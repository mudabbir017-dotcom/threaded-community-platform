const express = require('express');
const { addComment } = require('../services/commentService');

const router = express.Router();

// POST /api/comments — Add a comment (top-level or reply)
router.post('/', (req, res) => {
    const { postId, userId, parentId, content } = req.body;

    if (!postId || !userId || !content) {
        return res.status(400).json({ error: 'postId, userId, and content are required' });
    }

    try {
        const comment = addComment(postId, userId, parentId || null, content);
        comment.children = [];
        res.status(201).json(comment);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        throw err;
    }
});

module.exports = router;
