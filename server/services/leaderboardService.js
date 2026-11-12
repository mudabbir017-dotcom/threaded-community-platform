const { getDb } = require('../db/database');

/**
 * Get top 5 users by karma earned in the last 24 hours.
 * 
 * Karma rules:
 *   - 1 like on a post    = 5 karma (to the post author)
 *   - 1 like on a comment = 1 karma (to the comment author)
 * 
 * This is calculated DYNAMICALLY from the likes table — no cached counters.
 * The query uses time-window filtering with proper indexing.
 */
function getLeaderboard() {
    const db = getDb();

    const rows = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.avatar_url,
      SUM(karma_points) AS karma
    FROM (
      -- Karma from post likes (5 points each)
      SELECT 
        p.user_id AS author_id,
        5 AS karma_points
      FROM likes l
      JOIN posts p ON p.id = l.post_id
      WHERE l.post_id IS NOT NULL
        AND l.created_at >= datetime('now', '-1 day')

      UNION ALL

      -- Karma from comment likes (1 point each)
      SELECT 
        c.user_id AS author_id,
        1 AS karma_points
      FROM likes l
      JOIN comments c ON c.id = l.comment_id
      WHERE l.comment_id IS NOT NULL
        AND l.created_at >= datetime('now', '-1 day')
    ) AS karma_source
    JOIN users u ON u.id = karma_source.author_id
    GROUP BY u.id
    ORDER BY karma DESC
    LIMIT 5
  `).all();

    return rows;
}

module.exports = { getLeaderboard };
