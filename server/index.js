const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initializeDb, closeDb } = require('./db/database');

// Import routes
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const likesRouter = require('./routes/likes');
const leaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middleware ----
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ---- Initialize Database ----
initializeDb();

// ---- Routes ----
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/likes', likesRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});

// ---- Start Server ----
app.listen(PORT, () => {
    console.log(`Community Feed API running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    closeDb();
    process.exit(0);
});

module.exports = app;
