const { getDb } = require('../db/database');

/**
 * Fetch all comments for a post using a single Recursive CTE query,
 * then build a nested tree in memory — O(n) time, O(n) space.
 * 
 * This avoids the N+1 query problem entirely.
 */
function getCommentTreeForPost(postId) {
    const db = getDb();

    // Single recursive query — fetches entire comment tree with author info
    const rows = db.prepare(`
    WITH RECURSIVE comment_tree AS (
      SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at, 0 AS depth
      FROM comments c
      WHERE c.post_id = ? AND c.parent_id IS NULL

      UNION ALL

      SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at, ct.depth + 1
      FROM comments c
      INNER JOIN comment_tree ct ON c.parent_id = ct.id
    )
    SELECT 
      ct.*,
      u.username,
      u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE comment_id = ct.id) AS like_count
    FROM comment_tree ct
    JOIN users u ON u.id = ct.user_id
    ORDER BY ct.created_at ASC
  `).all(postId);

    // Build tree in memory using a hashmap — O(n)
    return buildTree(rows);
}

/**
 * Build a nested tree from a flat array of comments.
 * Uses a single pass with a lookup map — O(n).
 */
function buildTree(flatComments) {
    const map = {};
    const roots = [];

    // First pass: create lookup map
    for (const comment of flatComments) {
        map[comment.id] = { ...comment, children: [] };
    }

    // Second pass: link children to parents
    for (const comment of flatComments) {
        if (comment.parent_id === null) {
            roots.push(map[comment.id]);
        } else if (map[comment.parent_id]) {
            map[comment.parent_id].children.push(map[comment.id]);
        }
    }

    return roots;
}

/**
 * Add a comment to a post (top-level or reply).
 */
function addComment(postId, userId, parentId, content) {
    const db = getDb();

    // If parentId is provided, verify it belongs to the same post
    if (parentId) {
        const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND post_id = ?').get(parentId, postId);
        if (!parent) {
            throw Object.assign(new Error('Parent comment not found or does not belong to this post'), { status: 400 });
        }
    }

    const result = db.prepare(
        'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)'
    ).run(postId, userId, parentId || null, content);

    // Return the new comment with author info
    return db.prepare(`
    SELECT c.*, u.username, u.avatar_url,
           0 AS like_count
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);
}

module.exports = { getCommentTreeForPost, addComment, buildTree };
