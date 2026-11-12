const express = require('express');
const { toggleLike } = require('../services/likeService');

const router = express.Router();

// POST /api/likes — Toggle like on a post or comment
router.post('/', (req, res) => {
    const { userId, postId, commentId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    if (!postId && !commentId) {
        return res.status(400).json({ error: 'Either postId or commentId is required' });
    }

    try {
        const result = toggleLike(userId, postId || null, commentId || null);
        res.json(result);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        throw err;
    }
});

module.exports = router;
