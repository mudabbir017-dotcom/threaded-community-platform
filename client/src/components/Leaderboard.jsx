import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = () => {
        getLeaderboard()
            .then(data => setLeaders(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLeaderboard();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRankClass = (index) => {
        if (index === 0) return 'rank-1';
        if (index === 1) return 'rank-2';
        if (index === 2) return 'rank-3';
        return 'rank-other';
    };

    const getRankEmoji = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    return (
        <div className="glass-card leaderboard-widget">
            <div className="leaderboard-header">
                <div className="leaderboard-title">
                    <span className="trophy-icon">🏆</span>
                    Top Contributors
                </div>
                <div className="leaderboard-subtitle">Karma earned in last 24 hours</div>
            </div>

            <div className="leaderboard-list">
                {loading ? (
                    <div className="loading-container" style={{ padding: '20px' }}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : leaders.length === 0 ? (
                    <div className="leaderboard-empty">
                        No activity in the last 24 hours
                    </div>
                ) : (
                    leaders.map((user, index) => (
                        <div key={user.id} className="leaderboard-item animate-in" style={{ animationDelay: `${index * 0.08}s` }}>
                            <span className={`leaderboard-rank ${getRankClass(index)}`}>
                                {getRankEmoji(index)}
                            </span>
                            <img src={user.avatar_url} alt="" className="leaderboard-avatar" />
                            <div className="leaderboard-info">
                                <div className="leaderboard-name">{user.username}</div>
                            </div>
                            <span className="leaderboard-karma">
                                {user.karma} karma
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
