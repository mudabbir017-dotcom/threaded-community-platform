import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../App';
import { getPosts, togglePostLike, createPost } from '../services/api';
import CreatePost from './CreatePost';

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function Feed() {
    const { currentUserId } = useUser();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchPosts = () => {
        setLoading(true);
        getPosts(currentUserId)
            .then(data => setPosts(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (currentUserId) fetchPosts();
    }, [currentUserId]);

    const handleLike = async (e, postId) => {
        e.stopPropagation();
        if (!currentUserId) return;
        const result = await togglePostLike(currentUserId, postId);
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, like_count: result.likeCount, liked_by_user: result.liked }
                : p
        ));
    };

    const handlePostCreated = (newPost) => {
        setPosts(prev => [{ ...newPost, liked_by_user: false }, ...prev]);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="stagger-children">
            <CreatePost onCreated={handlePostCreated} />

            {posts.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📝</div>
                    <p>No posts yet. Be the first to share something!</p>
                </div>
            ) : (
                posts.map(post => (
                    <div
                        key={post.id}
                        className="glass-card post-card"
                        onClick={() => navigate(`/post/${post.id}`)}
                    >
                        <div className="post-header">
                            <img src={post.author_avatar} alt="" className="post-avatar" />
                            <div>
                                <div className="post-author">{post.author}</div>
                                <div className="post-time">{timeAgo(post.created_at)}</div>
                            </div>
                        </div>

                        <h2 className="post-title">{post.title}</h2>
                        <p className="post-content">{post.content}</p>

                        <div className="post-actions">
                            <button
                                className={`action-btn ${post.liked_by_user ? 'liked' : ''}`}
                                onClick={e => handleLike(e, post.id)}
                            >
                                <span className="icon">{post.liked_by_user ? '❤️' : '🤍'}</span>
                                {post.like_count}
                            </button>
                            <button className="action-btn">
                                <span className="icon">💬</span>
                                {post.comment_count}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
