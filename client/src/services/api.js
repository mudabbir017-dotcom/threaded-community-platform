import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// ---- Users ----
export const getUsers = () => api.get('/users').then(r => r.data);

// ---- Posts ----
export const getPosts = (userId) =>
    api.get('/posts', { params: { userId } }).then(r => r.data);

export const getPost = (id, userId) =>
    api.get(`/posts/${id}`, { params: { userId } }).then(r => r.data);

export const createPost = (userId, title, content) =>
    api.post('/posts', { userId, title, content }).then(r => r.data);

// ---- Comments ----
export const addComment = (postId, userId, content, parentId = null) =>
    api.post('/comments', { postId, userId, content, parentId }).then(r => r.data);

// ---- Likes ----
export const togglePostLike = (userId, postId) =>
    api.post('/likes', { userId, postId }).then(r => r.data);

export const toggleCommentLike = (userId, commentId) =>
    api.post('/likes', { userId, commentId }).then(r => r.data);

// ---- Leaderboard ----
export const getLeaderboard = () => api.get('/leaderboard').then(r => r.data);
