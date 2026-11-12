const { initializeDb, getDb, closeDb } = require('./database');

function seed() {
    const db = initializeDb();

    // Clear existing data
    db.exec('DELETE FROM likes');
    db.exec('DELETE FROM comments');
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM users');

    // Reset auto-increment
    db.exec("DELETE FROM sqlite_sequence");

    // ---- Users ----
    const insertUser = db.prepare('INSERT INTO users (username, avatar_url) VALUES (?, ?)');
    const users = [
        ['alice_dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'],
        ['bob_coder', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'],
        ['carol_eng', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol'],
        ['dave_ops', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave'],
        ['eve_hacker', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve'],
    ];
    const insertUsers = db.transaction(() => {
        for (const [username, avatar] of users) {
            insertUser.run(username, avatar);
        }
    });
    insertUsers();

    // ---- Posts ----
    const insertPost = db.prepare('INSERT INTO posts (user_id, title, content, created_at) VALUES (?, ?, ?, ?)');
    const now = new Date();
    const posts = [
        [1, 'Understanding Recursive CTEs in SQLite', 'Recursive Common Table Expressions are a powerful SQL feature that lets you traverse hierarchical data structures like comment trees in a single query. Here\'s how they work and why they matter for performance...', hoursAgo(now, 2)],
        [2, 'Why Concurrency Matters in Web Apps', 'Race conditions can silently corrupt your data. Imagine two users clicking "like" at the same exact moment — without proper handling, you could end up with duplicate likes and inflated karma scores.', hoursAgo(now, 5)],
        [3, 'The N+1 Query Problem Explained', 'If you have a post with 50 comments and you fetch each comment\'s author separately, that\'s 51 queries instead of 1 or 2. This is the N+1 problem, and it can bring your database to its knees.', hoursAgo(now, 8)],
        [4, 'Building a Karma System That Actually Works', 'Most karma systems just store a total counter on the user model. But what if you need time-windowed calculations? You need an activity-based approach with proper aggregation.', hoursAgo(now, 12)],
        [5, 'My Experience with Adjacency List vs Nested Set', 'After trying both models for threaded comments, I can confidently say adjacency list + recursive CTE beats nested set for write-heavy applications. Here\'s my comparison...', hoursAgo(now, 18)],
    ];

    const insertPosts = db.transaction(() => {
        for (const [userId, title, content, createdAt] of posts) {
            insertPost.run(userId, title, content, createdAt);
        }
    });
    insertPosts();

    // ---- Comments (Nested Thread) ----
    const insertComment = db.prepare('INSERT INTO comments (post_id, user_id, parent_id, content, created_at) VALUES (?, ?, ?, ?, ?)');

    const insertComments = db.transaction(() => {
        // Post 1 comments — deep thread
        insertComment.run(1, 2, null, 'Great explanation! I always wondered how recursive CTEs differ from regular subqueries.', hoursAgo(now, 1.5));  // id=1
        insertComment.run(1, 3, 1, 'The key difference is that recursive CTEs can reference themselves, allowing you to walk tree structures.', hoursAgo(now, 1.2));  // id=2
        insertComment.run(1, 1, 2, 'Exactly! And the beauty is that SQLite handles this natively with WITH RECURSIVE.', hoursAgo(now, 1));  // id=3
        insertComment.run(1, 4, 1, 'How does this perform with very deep nesting? Say 100 levels?', hoursAgo(now, 0.8));  // id=4
        insertComment.run(1, 1, 4, 'SQLite has a default recursion limit of 1000, so 100 levels is fine. You can configure it with SQLITE_MAX_RECURSIVE.', hoursAgo(now, 0.5));  // id=5
        insertComment.run(1, 5, null, 'This is exactly what I needed for my project. Bookmarked!', hoursAgo(now, 0.3));  // id=6

        // Post 2 comments
        insertComment.run(2, 1, null, 'Database-level constraints are the only reliable way to prevent race conditions.', hoursAgo(now, 4));  // id=7
        insertComment.run(2, 3, 7, 'Agreed. Frontend validation alone is never enough for data integrity.', hoursAgo(now, 3.5));  // id=8
        insertComment.run(2, 5, 7, 'What about using Redis for distributed locking?', hoursAgo(now, 3));  // id=9
        insertComment.run(2, 2, 9, 'For a prototype with SQLite, UNIQUE constraints + transactions are sufficient and simpler.', hoursAgo(now, 2.5));  // id=10

        // Post 3 comments
        insertComment.run(3, 4, null, 'I learned this the hard way when my API response time went from 50ms to 3 seconds.', hoursAgo(now, 7));  // id=11
        insertComment.run(3, 5, 11, 'Ouch! What query tool helped you diagnose it?', hoursAgo(now, 6.5));  // id=12
        insertComment.run(3, 4, 12, 'EXPLAIN QUERY PLAN in SQLite is your best friend for this.', hoursAgo(now, 6));  // id=13

        // Post 4 comments
        insertComment.run(4, 1, null, 'Activity-based karma is definitely more flexible. You can compute any time window you need.', hoursAgo(now, 11));  // id=14
        insertComment.run(4, 3, 14, 'But doesn\'t that get slow with millions of like records?', hoursAgo(now, 10));  // id=15
        insertComment.run(4, 4, 15, 'That\'s where proper indexing on created_at comes in. With an index, the time-window filter is efficient.', hoursAgo(now, 9.5));  // id=16

        // Post 5 comments
        insertComment.run(5, 2, null, 'Nested set is better for read-heavy scenarios where the tree rarely changes. Forums? Adjacency list wins.', hoursAgo(now, 17));  // id=17
        insertComment.run(5, 3, 17, 'Exactly. The insert cost of nested set is just not worth it for live discussions.', hoursAgo(now, 16));  // id=18
    });
    insertComments();

    // ---- Likes (distributed across recent 24h for leaderboard demo) ----
    const insertLike = db.prepare('INSERT INTO likes (user_id, post_id, comment_id, created_at) VALUES (?, ?, ?, ?)');

    const insertLikes = db.transaction(() => {
        // Post likes (each gives 5 karma to post author)
        insertLike.run(2, 1, null, hoursAgo(now, 1));    // bob likes alice's post → alice +5
        insertLike.run(3, 1, null, hoursAgo(now, 0.5));   // carol likes alice's post → alice +5
        insertLike.run(4, 1, null, hoursAgo(now, 0.3));   // dave likes alice's post → alice +5
        insertLike.run(5, 1, null, hoursAgo(now, 2));     // eve likes alice's post → alice +5
        insertLike.run(1, 2, null, hoursAgo(now, 3));     // alice likes bob's post → bob +5
        insertLike.run(3, 2, null, hoursAgo(now, 4));     // carol likes bob's post → bob +5
        insertLike.run(1, 3, null, hoursAgo(now, 6));     // alice likes carol's post → carol +5
        insertLike.run(4, 3, null, hoursAgo(now, 7));     // dave likes carol's post → carol +5
        insertLike.run(1, 4, null, hoursAgo(now, 10));    // alice likes dave's post → dave +5
        insertLike.run(2, 5, null, hoursAgo(now, 15));    // bob likes eve's post → eve +5

        // Comment likes (each gives 1 karma to comment author)
        insertLike.run(1, null, 1, hoursAgo(now, 1));     // alice likes bob's comment → bob +1
        insertLike.run(4, null, 2, hoursAgo(now, 1));     // dave likes carol's comment → carol +1
        insertLike.run(5, null, 3, hoursAgo(now, 0.5));   // eve likes alice's comment → alice +1
        insertLike.run(3, null, 7, hoursAgo(now, 3));     // carol likes alice's comment → alice +1
        insertLike.run(2, null, 8, hoursAgo(now, 3));     // bob likes carol's comment → carol +1
        insertLike.run(1, null, 11, hoursAgo(now, 5));    // alice likes dave's comment → dave +1
        insertLike.run(3, null, 17, hoursAgo(now, 16));   // carol likes bob's comment → bob +1
        insertLike.run(5, null, 14, hoursAgo(now, 9));    // eve likes alice's comment → alice +1
    });
    insertLikes();

    console.log('✅ Database seeded successfully!');
    console.log('   📝 5 users, 5 posts, 18 comments, 18 likes');
    closeDb();
}

function hoursAgo(now, hours) {
    const date = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return date.toISOString().replace('T', ' ').replace('Z', '');
}

seed();
