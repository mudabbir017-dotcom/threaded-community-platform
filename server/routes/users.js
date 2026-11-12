const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/users — list all users
router.get('/', (req, res) => {
    const db = getDb();
    const users = db.prepare('SELECT id, username, avatar_url, created_at FROM users ORDER BY id').all();
    res.json(users);
});

// GET /api/users/:id — get single user
router.get('/:id', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT id, username, avatar_url, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});

module.exports = router;
