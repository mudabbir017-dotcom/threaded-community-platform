-- ============================================
-- Community Feed Database Schema
-- Model: Adjacency List for nested comments
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Adjacency List model: each comment references its parent via parent_id
-- parent_id IS NULL means it's a top-level comment on the post
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Likes table with UNIQUE constraints to prevent double-likes at DB level
-- A like is either for a post OR a comment, never both
CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    -- Prevent double-likes: one like per user per post
    UNIQUE(user_id, post_id),
    -- Prevent double-likes: one like per user per comment
    UNIQUE(user_id, comment_id),
    -- Ensure a like targets either a post or a comment, not both
    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- ============================================
-- Performance Indexes
-- ============================================

-- Fast comment tree fetches
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Fast leaderboard aggregation (time-window queries)
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Fast like lookups (check if user already liked)
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(user_id, comment_id);

-- Fast post feeds
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
