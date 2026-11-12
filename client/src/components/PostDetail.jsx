import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../App';
import { getPost, togglePostLike, addComment } from '../services/api';
import CommentThread from './CommentThread';

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

export default function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUserId, users } = useUser();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const currentUser = users.find(u => u.id === currentUserId);

    const fetchPost = () => {
        setLoading(true);
        getPost(id, currentUserId)
            .then(data => setPost(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (currentUserId) fetchPost();
    }, [id, currentUserId]);

    const handleLike = async () => {
        if (!currentUserId) return;
        const result = await togglePostLike(currentUserId, post.id);
        setPost(prev => ({ ...prev, like_count: result.likeCount, liked_by_user: result.liked }));
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !currentUserId) return;

        setSubmitting(true);
        try {
            const newComment = await addComment(post.id, currentUserId, commentText.trim());
            newComment.liked_by_user = false;
            setPost(prev => ({
                ...prev,
                comments: [...prev.comments, newComment],
            }));
            setCommentText('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (parentId, text) => {
        if (!text.trim() || !currentUserId) return;
        const newComment = await addComment(post.id, currentUserId, text.trim(), parentId);
        newComment.liked_by_user = false;
        // Re-fetch to get the updated tree
        fetchPost();
    };

    const handleCommentLikeUpdate = (commentId, liked, likeCount) => {
        // Update comment tree state with new like info
        setPost(prev => ({
            ...prev,
            comments: updateCommentLike(prev.comments, commentId, liked, likeCount),
        }));
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="empty-state">
                <div className="icon">🔍</div>
                <p>Post not found</p>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <button className="back-btn" onClick={() => navigate('/')}>
                ← Back to Feed
            </button>

            <div className="glass-card" style={{ padding: '24px' }}>
                <div className="post-header">
                    <img src={post.author_avatar} alt="" className="post-avatar" />
                    <div>
                        <div className="post-author">{post.author}</div>
                        <div className="post-time">{timeAgo(post.created_at)}</div>
                    </div>
                </div>

                <h1 className="post-title" style={{ fontSize: '1.4rem' }}>{post.title}</h1>
                <p className="post-detail-content">{post.content}</p>

                <div className="post-actions">
                    <button
                        className={`action-btn ${post.liked_by_user ? 'liked' : ''}`}
                        onClick={handleLike}
                    >
                        <span className="icon">{post.liked_by_user ? '❤️' : '🤍'}</span>
                        {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
                    </button>
                    <span className="action-btn" style={{ cursor: 'default' }}>
                        <span className="icon">💬</span>
                        {post.comments ? countAllComments(post.comments) : 0} comments
                    </span>
                </div>
            </div>

            {/* Comments section */}
            <div className="comments-section" style={{ marginTop: '16px' }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 className="comments-header">
                        Discussion ({post.comments ? countAllComments(post.comments) : 0})
                    </h3>

                    {/* Top-level comment form */}
                    <form className="comment-form" onSubmit={handleAddComment}>
                        <textarea
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={!commentText.trim() || submitting}
                        >
                            {submitting ? 'Commenting...' : 'Comment'}
                        </button>
                    </form>

                    {/* Comment tree */}
                    {post.comments && post.comments.length > 0 ? (
                        post.comments.map(comment => (
                            <CommentThread
                                key={comment.id}
                                comment={comment}
                                onReply={handleReply}
                                onLikeUpdate={handleCommentLikeUpdate}
                            />
                        ))
                    ) : (
                        <div className="empty-state" style={{ padding: '24px' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No comments yet. Start the discussion!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function countAllComments(comments) {
    let count = 0;
    for (const c of comments) {
        count++;
        if (c.children && c.children.length > 0) {
            count += countAllComments(c.children);
        }
    }
    return count;
}

function updateCommentLike(comments, commentId, liked, likeCount) {
    return comments.map(c => {
        if (c.id === commentId) {
            return { ...c, liked_by_user: liked, like_count: likeCount };
        }
        if (c.children && c.children.length > 0) {
            return { ...c, children: updateCommentLike(c.children, commentId, liked, likeCount) };
        }
        return c;
    });
}
