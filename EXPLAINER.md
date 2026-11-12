# EXPLAINER.md

## The Tree: Nested Comment Model

### Database Model

Nested comments are modeled using an **Adjacency List** schema. Each comment stores a `parent_id` that references another comment in the same table:

```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,           -- NULL = top-level comment
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES comments(id)
);
```

This allows **unlimited nesting depth** — any comment can be a reply to any other comment, creating Reddit-style threaded discussions.

### Avoiding the N+1 Query Problem

The entire comment tree for a post is fetched in a **single SQL query** using a Recursive CTE:

```sql
WITH RECURSIVE comment_tree AS (
    -- Base case: top-level comments
    SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at, 0 AS depth
    FROM comments c
    WHERE c.post_id = ? AND c.parent_id IS NULL

    UNION ALL

    -- Recursive case: replies
    SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at, ct.depth + 1
    FROM comments c
    INNER JOIN comment_tree ct ON c.parent_id = ct.id
)
SELECT
    ct.*, u.username, u.avatar_url,
    (SELECT COUNT(*) FROM likes WHERE comment_id = ct.id) AS like_count
FROM comment_tree ct
JOIN users u ON u.id = ct.user_id
ORDER BY ct.created_at ASC;
```

**Result:** 1 post + 50 comments = **1 query** (not 51).

### Tree Construction

The flat SQL result is converted into a nested JSON tree in **O(n)** using a two-pass hashmap approach in Node.js:

```javascript
function buildTree(flatComments) {
    const map = {};
    const roots = [];

    // Pass 1: Create lookup map
    for (const comment of flatComments) {
        map[comment.id] = { ...comment, children: [] };
    }

    // Pass 2: Link children to parents
    for (const comment of flatComments) {
        if (comment.parent_id === null) {
            roots.push(map[comment.id]);
        } else if (map[comment.parent_id]) {
            map[comment.parent_id].children.push(map[comment.id]);
        }
    }

    return roots;
}
```

**Why Adjacency List (not Nested Set or Materialized Path)?**

| Criteria | Adjacency List | Nested Set | Materialized Path |
|----------|---------------|------------|-------------------|
| Insert cost | O(1) | O(n) — rebalance | O(1) |
| Read cost | O(n) via CTE | O(1) | O(n) via LIKE |
| Concurrency | Excellent | Poor (locking) | Good |
| Complexity | Low | High | Medium |
| SQLite support | Native `WITH RECURSIVE` | Manual | Manual |

For a **write-heavy discussion feed**, adjacency list wins.

---

## The Math: 24-Hour Leaderboard Query

Karma is calculated **dynamically** from the `likes` activity table using time-window aggregation:

**Karma Rules:**
- 1 Like on a Post = **5 Karma** (awarded to the post author)
- 1 Like on a Comment = **1 Karma** (awarded to the comment author)

```sql
SELECT
    u.id, u.username, u.avatar_url,
    SUM(karma_points) AS karma
FROM (
    -- Karma from post likes (5 points each)
    SELECT p.user_id AS author_id, 5 AS karma_points
    FROM likes l
    JOIN posts p ON p.id = l.post_id
    WHERE l.post_id IS NOT NULL
      AND l.created_at >= datetime('now', '-1 day')

    UNION ALL

    -- Karma from comment likes (1 point each)
    SELECT c.user_id AS author_id, 1 AS karma_points
    FROM likes l
    JOIN comments c ON c.id = l.comment_id
    WHERE l.comment_id IS NOT NULL
      AND l.created_at >= datetime('now', '-1 day')
) AS karma_source
JOIN users u ON u.id = karma_source.author_id
GROUP BY u.id
ORDER BY karma DESC
LIMIT 5;
```

**Why this is correct:**
1. **No cached counters** — karma is computed from raw like activity, not a `daily_karma` column.
2. **Time-window filter** — `datetime('now', '-1 day')` ensures only the last 24 hours count.
3. **UNION ALL** — combines post karma (5 pts) and comment karma (1 pt) into one aggregation.
4. **Proper attribution** — karma goes to the **content author**, not the person who clicked like.
5. **Indexed** — `idx_likes_created_at` ensures the time filter is fast.

---

## The AI Audit

### Bug: AI-Generated Leaderboard Query Attributed Karma to the Wrong User

**The AI-generated version:**

```sql
-- BUGGY: Karma goes to the liker, not the content author
SELECT u.id, u.username,
    SUM(CASE WHEN l.post_id IS NOT NULL THEN 5
             WHEN l.comment_id IS NOT NULL THEN 1 END) AS karma
FROM likes l
JOIN users u ON u.id = l.user_id    -- ← BUG: l.user_id is the LIKER
WHERE l.created_at >= datetime('now', '-1 day')
GROUP BY u.id
ORDER BY karma DESC LIMIT 5;
```

**The problem:** `l.user_id` is the person who **clicked like**, not the person who **wrote the content**. This would rank users by how many things they liked, not by how much recognition they received.

**The fix:**

The corrected query joins through the `posts` or `comments` table to find the **content author**:

```sql
-- Post karma: join likes → posts to get post author
SELECT p.user_id AS author_id, 5 AS karma_points
FROM likes l
JOIN posts p ON p.id = l.post_id
...

-- Comment karma: join likes → comments to get comment author
SELECT c.user_id AS author_id, 1 AS karma_points
FROM likes l
JOIN comments c ON c.id = l.comment_id
...
```

Using a `UNION ALL` subquery approach also makes the karma point values (5 vs 1) explicit and easy to adjust, rather than burying them in a CASE expression with an incorrect JOIN.

**Impact:** Without this fix, the leaderboard would show the most active likers instead of the most appreciated contributors — completely inverting the gamification intent.
