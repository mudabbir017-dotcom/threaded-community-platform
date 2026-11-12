const { getDb } = require('../db/database');

/**
 * Toggle a like on a post or comment.
 * Uses INSERT OR IGNORE + UNIQUE constraints for concurrency safety.
 * 
 * Returns { liked: boolean, likeCount: number }
 */
function toggleLike(userId, postId, commentId) {
    const db = getDb();

    // Validate that exactly one of postId/commentId is provided
    if ((!postId && !commentId) || (postId && commentId)) {
        throw Object.assign(new Error('Must provide either postId or commentId, not both'), { status: 400 });
    }

    // Use a transaction for atomicity
    const result = db.transaction(() => {
        // Check if like already exists
        let existing;
        if (postId) {
            existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId);
        } else {
            existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND comment_id = ?').get(userId, commentId);
        }

        if (existing) {
            // Unlike — remove the like
            db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
            const likeCount = getLikeCount(db, postId, commentId);
            return { liked: false, likeCount };
        } else {
            // Like — insert (UNIQUE constraint handles any remaining race condition)
            try {
                db.prepare('INSERT INTO likes (user_id, post_id, comment_id) VALUES (?, ?, ?)').run(userId, postId || null, commentId || null);
                const likeCount = getLikeCount(db, postId, commentId);
                return { liked: true, likeCount };
            } catch (err) {
                // UNIQUE constraint violation — another request already inserted
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    const likeCount = getLikeCount(db, postId, commentId);
                    return { liked: true, likeCount };
                }
                throw err;
            }
        }
    })();

    return result;
}

/**
 * Check if a user has liked a post or comment.
 */
function hasUserLiked(userId, postId, commentId) {
    const db = getDb();
    if (postId) {
        return !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId);
    }
    return !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND comment_id = ?').get(userId, commentId);
}

/**
 * Get like count for a post or comment.
 */
function getLikeCount(db, postId, commentId) {
    if (postId) {
        return db.prepare('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?').get(postId).count;
    }
    return db.prepare('SELECT COUNT(*) AS count FROM likes WHERE comment_id = ?').get(commentId).count;
}

/**
 * Get all like statuses for a user for a set of post IDs.
 * Used to batch-check likes for the feed view.
 */
function getUserLikesForPosts(userId, postIds) {
    if (!postIds.length) return {};
    const db = getDb();
    const placeholders = postIds.map(() => '?').join(',');
    const rows = db.prepare(
        `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`
    ).all(userId, ...postIds);

    const likeMap = {};
    for (const row of rows) {
        likeMap[row.post_id] = true;
    }
    return likeMap;
}

/**
 * Get all like statuses for a user for a set of comment IDs.
 */
function getUserLikesForComments(userId, commentIds) {
    if (!commentIds.length) return {};
    const db = getDb();
    const placeholders = commentIds.map(() => '?').join(',');
    const rows = db.prepare(
        `SELECT comment_id FROM likes WHERE user_id = ? AND comment_id IN (${placeholders})`
    ).all(userId, ...commentIds);

    const likeMap = {};
    for (const row of rows) {
        likeMap[row.comment_id] = true;
    }
    return likeMap;
}

module.exports = { toggleLike, hasUserLiked, getUserLikesForPosts, getUserLikesForComments };
