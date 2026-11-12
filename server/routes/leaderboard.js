const express = require('express');
const { getLeaderboard } = require('../services/leaderboardService');

const router = express.Router();

// GET /api/leaderboard — Top 5 users by karma in last 24 hours
router.get('/', (req, res) => {
    const leaderboard = getLeaderboard();
    res.json(leaderboard);
});

module.exports = router;
