import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trash2, Calendar, User, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SavedGames: React.FC = () => {
    const { state, dispatch } = useGame();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('');

    const allGames = state.activeSession
        ? [state.activeSession, ...state.savedGames.filter(g => g.id !== state.activeSession?.id)]
        : state.savedGames;
    const games = allGames
        .filter(g => g.gameName.toLowerCase().includes(filter.toLowerCase()) ||
            g.players.some(p => p.name.toLowerCase().includes(filter.toLowerCase())))
        .sort((a, b) => b.startTime - a.startTime);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const handleLoad = (gameId: string) => {
        const game = state.savedGames.find(g => g.id === gameId);
        if (game) {
            // Prepare game for active session
            // If it was completed, maybe we can't resume easily without changing status?
            // For now, let's just View it. If status is 'completed' GamePage should probably be read-only or allow re-opening.
            // My GamePage logic checks activeSession.

            // If it's a completed game, we might want to just view the history. 
            // But the requirement says "Save game should save the game and can be loaded later".
            // It implies resuming.

            // Let's set it as active even if completed, to allow viewing/editing?
            // Or maybe strictly resume active ones.

            dispatch({ type: 'LOAD_GAME', payload: game });
            navigate(`/game/${game.id}`);
        }
    };

    const handleDelete = (e: React.MouseEvent, gameId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this game?')) {
            dispatch({ type: 'DELETE_GAME', payload: gameId });
        }
    };

    return (
        <div className="saved-games-container">
            <div className="input-group mb-md">
                <input
                    className="styled-input"
                    placeholder="Search games or players..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            {games.length === 0 ? (
                <div className="empty-state">
                    <p>No saved games found.</p>
                </div>
            ) : (
                <div className="games-list">
                    {games.map(game => (
                        <div key={game.id} className="game-card-item" onClick={() => handleLoad(game.id)}>
                            <div className="game-card-header" style={{ paddingRight: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h3>{game.gameName}</h3>
                                    <span style={{ width: 'fit-content' }} className={`status-badge ${game.status}`}>{game.status}</span>
                                </div>
                            </div>

                            <div className="game-card-details">
                                <div className="detail-item">
                                    <Calendar size={14} /> {formatDate(game.startTime)}
                                </div>
                                <div className="detail-item">
                                    <User size={14} /> {game.players.length} Players
                                </div>
                                {game.status === 'completed' && game.winnerId && (
                                    <div className="detail-item" style={{ color: 'var(--color-secondary)' }}>
                                        <Trophy size={14} /> Winner: {game.players.find(p => p.id === game.winnerId)?.name || 'Unknown'}
                                    </div>
                                )}
                            </div>

                            <div className="game-card-players">
                                {game.players.map(p => p.name).join(', ')}
                            </div>

                            <button
                                className="btn-icon-danger delete-btn"
                                onClick={(e) => handleDelete(e, game.id)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedGames;
