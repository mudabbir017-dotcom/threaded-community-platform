import { useState } from 'react';
import { useUser } from '../App';
import { createPost } from '../services/api';

export default function CreatePost({ onCreated }) {
    const { currentUserId, users } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const currentUser = users.find(u => u.id === currentUserId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !currentUserId) return;

        setSubmitting(true);
        try {
            const newPost = await createPost(currentUserId, title.trim(), content.trim());
            onCreated(newPost);
            setTitle('');
            setContent('');
            setIsOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="glass-card create-post-card" onClick={() => setIsOpen(true)}>
                <div className="create-post-trigger">
                    {currentUser && (
                        <img src={currentUser.avatar_url} alt="" className="post-avatar" />
                    )}
                    <div className="fake-input">What's on your mind?</div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card create-post-card animate-in">
            <form className="create-post-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Post title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                />
                <textarea
                    placeholder="Share your thoughts..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                />
                <div className="create-post-actions">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => { setIsOpen(false); setTitle(''); setContent(''); }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={!title.trim() || !content.trim() || submitting}
                    >
                        {submitting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}
