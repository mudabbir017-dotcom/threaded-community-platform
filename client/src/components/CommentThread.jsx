import { useState } from 'react';
import { useUser } from '../App';
import { toggleCommentLike } from '../services/api';

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

/**
 * Recursive comment component — renders a comment and its children.
 * This is the key UI component for threaded discussions.
 */
export default function CommentThread({ comment, onReply, onLikeUpdate }) {
    const { currentUserId } = useUser();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleLike = async () => {
        if (!currentUserId) return;
        const result = await toggleCommentLike(currentUserId, comment.id);
        onLikeUpdate(comment.id, result.liked, result.likeCount);
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await onReply(comment.id, replyText.trim());
            setReplyText('');
            setShowReplyForm(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="comment-node">
            <div className="comment-body">
                <img src={comment.avatar_url} alt="" className="comment-avatar" />
                <div className="comment-main">
                    <div className="comment-meta">
                        <span className="comment-author">{comment.username}</span>
                        <span className="comment-time">{timeAgo(comment.created_at)}</span>
                        {comment.depth > 0 && (
                            <span className="comment-depth-indicator">depth {comment.depth}</span>
                        )}
                    </div>
                    <p className="comment-text">{comment.content}</p>
                    <div className="comment-actions">
                        <button
                            className={`comment-action-btn ${comment.liked_by_user ? 'liked' : ''}`}
                            onClick={handleLike}
                        >
                            {comment.liked_by_user ? '❤️' : '🤍'} {comment.like_count}
                        </button>
                        <button
                            className="comment-action-btn"
                            onClick={() => setShowReplyForm(!showReplyForm)}
                        >
                            💬 Reply
                        </button>
                    </div>
                </div>
            </div>

            {/* Reply form */}
            {showReplyForm && (
                <div className="reply-form animate-in">
                    <textarea
                        placeholder={`Reply to ${comment.username}...`}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        autoFocus
                    />
                    <div className="reply-form-actions">
                        <button
                            className="btn-cancel"
                            onClick={() => { setShowReplyForm(false); setReplyText(''); }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-reply-submit"
                            onClick={handleReply}
                            disabled={!replyText.trim() || submitting}
                        >
                            {submitting ? 'Posting...' : 'Reply'}
                        </button>
                    </div>
                </div>
            )}

            {/* Recursive children */}
            {comment.children && comment.children.length > 0 && (
                <div className="comment-children">
                    {comment.children.map(child => (
                        <CommentThread
                            key={child.id}
                            comment={child}
                            onReply={onReply}
                            onLikeUpdate={onLikeUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
