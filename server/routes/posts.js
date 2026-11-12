const express = require('express');
const { getDb } = require('../db/database');
const { getCommentTreeForPost } = require('../services/commentService');
const { getUserLikesForPosts, getUserLikesForComments } = require('../services/likeService');

const router = express.Router();

// GET /api/posts — Feed: list all posts with author and like count
router.get('/', (req, res) => {
    const db = getDb();
    const currentUserId = req.query.userId ? parseInt(req.query.userId) : null;

    const posts = db.prepare(`
    SELECT 
      p.id, p.title, p.content, p.created_at,
      p.user_id,
      u.username AS author,
      u.avatar_url AS author_avatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `).all();

    // Batch check if current user has liked these posts
    if (currentUserId) {
        const postIds = posts.map(p => p.id);
        const userLikes = getUserLikesForPosts(currentUserId, postIds);
        for (const post of posts) {
            post.liked_by_user = !!userLikes[post.id];
        }
    }

    res.json(posts);
});

// GET /api/posts/:id — Single post with full comment tree
router.get('/:id', (req, res) => {
    const db = getDb();
    const currentUserId = req.query.userId ? parseInt(req.query.userId) : null;

    const post = db.prepare(`
    SELECT 
      p.id, p.title, p.content, p.created_at,
      p.user_id,
      u.username AS author,
      u.avatar_url AS author_avatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `).get(req.params.id);

    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    // Get full comment tree in a single recursive query
    const commentTree = getCommentTreeForPost(post.id);

    // Check if user has liked the post
    if (currentUserId) {
        const userLikes = getUserLikesForPosts(currentUserId, [post.id]);
        post.liked_by_user = !!userLikes[post.id];

        // Collect all comment IDs and batch-check likes
        const allCommentIds = collectCommentIds(commentTree);
        const commentLikes = getUserLikesForComments(currentUserId, allCommentIds);
        markCommentLikes(commentTree, commentLikes);
    }

    res.json({ ...post, comments: commentTree });
});

// POST /api/posts — Create a new post
router.post('/', (req, res) => {
    const { userId, title, content } = req.body;

    if (!userId || !title || !content) {
        return res.status(400).json({ error: 'userId, title, and content are required' });
    }

    const db = getDb();
    const result = db.prepare('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)').run(userId, title, content);

    const newPost = db.prepare(`
    SELECT 
      p.id, p.title, p.content, p.created_at,
      p.user_id,
      u.username AS author,
      u.avatar_url AS author_avatar,
      0 AS like_count,
      0 AS comment_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

    res.status(201).json(newPost);
});

/**
 * Recursively collect all comment IDs from a tree.
 */
function collectCommentIds(comments) {
    const ids = [];
    for (const comment of comments) {
        ids.push(comment.id);
        if (comment.children && comment.children.length > 0) {
            ids.push(...collectCommentIds(comment.children));
        }
    }
    return ids;
}

/**
 * Recursively mark liked_by_user on each comment.
 */
function markCommentLikes(comments, likeMap) {
    for (const comment of comments) {
        comment.liked_by_user = !!likeMap[comment.id];
        if (comment.children && comment.children.length > 0) {
            markCommentLikes(comment.children, likeMap);
        }
    }
}

module.exports = router;
