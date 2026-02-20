import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PlayerCard from './PlayerCard';
import ReactConfetti from 'react-confetti';
import type { Player } from '../types';
import { ArrowLeft, Trophy, UserPlus, X } from 'lucide-react';
import ScoreTable from './ScoreTable';
import { v4 as uuidv4 } from 'uuid';

const GamePage: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const { state, dispatch } = useGame();
    const navigate = useNavigate();
    const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [winnerId, setWinnerId] = useState<string>('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (state.activeSession && state.activeSession.id === gameId) {
            setLocalPlayers(state.activeSession.players);
        } else {
            const saved = state.savedGames.find(g => g.id === gameId);
            if (saved) {
                dispatch({ type: 'LOAD_GAME', payload: saved });
            } else if (!state.activeSession) {
                navigate('/');
            }
        }
    }, [gameId, state.activeSession, state.savedGames, dispatch, navigate]);

    const updateGameState = (newPlayers: Player[]) => {
        setLocalPlayers(newPlayers);
        if (state.activeSession) {
            dispatch({
                type: 'UPDATE_SESSION',
                payload: { ...state.activeSession, players: newPlayers }
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLocalPlayers((items) => {
                const oldIndex = items.findIndex((p) => p.id === active.id);
                const newIndex = items.findIndex((p) => p.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                if (state.activeSession) {
                    dispatch({
                        type: 'UPDATE_SESSION',
                        payload: { ...state.activeSession, players: newOrder }
                    });
                }
                return newOrder;
            });
        }
    };

    const handleAddScore = (playerId: string, score: number, roundIndex: number) => {
        if (!state.activeSession) return;

        const updatedPlayers = localPlayers.map(p => {
            if (p.id === playerId) {
                const oldScore = p.scores[roundIndex] || 0;
                const newScores = [...p.scores];
                newScores[roundIndex] = score;
                // Calculate new total
                const newTotal = p.totalScore - oldScore + score;
                return { ...p, scores: newScores, totalScore: newTotal };
            }
            return p;
        });

        // Check for *CURRENT* round completion only
        const currentRoundIdx = state.activeSession.rounds;
        let shouldAdvance = false;

        // Only advance if we are editing/filling the current round
        if (roundIndex === currentRoundIdx) {
            const allScored = updatedPlayers
                .filter(p => !p.isEliminated)
                .every(p => p.scores[currentRoundIdx] !== undefined);
            shouldAdvance = allScored;
        }

        setLocalPlayers(updatedPlayers);

        const newSessionState = {
            ...state.activeSession,
            players: updatedPlayers,
            rounds: shouldAdvance ? state.activeSession.rounds + 1 : state.activeSession.rounds
        };

        dispatch({ type: 'UPDATE_SESSION', payload: newSessionState });
    };

    const handleEditScore = (playerId: string, roundIndex: number, newScore: number) => {
        handleAddScore(playerId, newScore, roundIndex);
    };

    const handleEliminate = (playerId: string) => {
        const updatedPlayers = localPlayers.map(p =>
            p.id === playerId ? { ...p, isEliminated: !p.isEliminated } : p
        );
        updateGameState(updatedPlayers);
    };

    const handleAddNewPlayer = () => {
        if (!newPlayerName.trim() || !state.activeSession) return;

        const newPlayer: Player = {
            id: uuidv4(),
            name: newPlayerName,
            isEliminated: false,
            // Fill previous rounds with 0
            scores: new Array(state.activeSession.rounds).fill(0),
            totalScore: 0
        };

        const updatedPlayers = [...localPlayers, newPlayer];
        updateGameState(updatedPlayers);

        dispatch({ type: 'ADD_LIBRARY_ITEM', payload: { type: 'player', name: newPlayerName } });
        setNewPlayerName('');
        setShowAddPlayerModal(false);
    };

    const handleEndGameClick = () => {
        const sorted = [...localPlayers].sort((a, b) => b.totalScore - a.totalScore);
        if (sorted.length > 0) setWinnerId(sorted[0].id);
        setShowEndGameModal(true);
    };

    const confirmEndGame = () => {
        if (state.activeSession && winnerId) {
            dispatch({
                type: 'END_GAME',
                payload: { session: state.activeSession, winnerId }
            });
            // Show confetti for 3 seconds then go home? 
            // Or just navigate home and maybe show confetti there?
            // For now, let's just go home.
            navigate('/');
        }
    };

    if (!state.activeSession) return <div>Loading...</div>;

    const highScoreVal = localPlayers.length > 0 ? Math.max(...localPlayers.map(p => p.totalScore)) : 0;
    const lowScoreVal = localPlayers.length > 0 ? Math.min(...localPlayers.map(p => p.totalScore)) : 0;
    const highScorePlayers = localPlayers.filter(p => p.totalScore === highScoreVal).map(p => p.name).join(', ');
    const lowScorePlayers = localPlayers.filter(p => p.totalScore === lowScoreVal).map(p => p.name).join(', ');

    return (
        <div className="game-page">
            <header className="game-header">
                <button className="icon-btn" onClick={() => navigate('/')}><ArrowLeft size={24} /></button>
                <div className="game-info">
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{state.activeSession.gameName}</h2>
                    <span className="round-badge">Round {state.activeSession.rounds + 1}</span>
                </div>
                <div className="header-actions">
                    <button className="icon-btn" onClick={() => setShowAddPlayerModal(true)} title="Add Player"><UserPlus size={24} /></button>
                    <button className="icon-btn" onClick={handleEndGameClick} title="End Game"><Trophy size={24} /></button>
                </div>
            </header>

            <section className="player-section">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={localPlayers.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="player-list">
                            {localPlayers.map(player => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    currentRound={state.activeSession!.rounds}
                                    onAddScore={(score, round) => handleAddScore(player.id, score, round)}
                                    onEliminate={() => handleEliminate(player.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </section>

            <ScoreTable
                players={localPlayers}
                rounds={state.activeSession.rounds}
                onEditScore={handleEditScore}
            />

            {showAddPlayerModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Player Mid-Game</h2>
                            <button onClick={() => setShowAddPlayerModal(false)} className="icon-btn"><X /></button>
                        </div>
                        <div className="modal-section">
                            <div className="input-group">
                                <input
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    placeholder="Player Name"
                                    className="styled-input"
                                />
                            </div>
                            <div className="chips-container mt-sm">
                                {state.library.playerNames
                                    .filter(name => !localPlayers.some(p => p.name === name))
                                    .map(name => (
                                        <button
                                            key={name}
                                            className="chip"
                                            onClick={() => setNewPlayerName(name)}
                                        >
                                            {name}
                                        </button>
                                    ))}
                            </div>
                        </div>
                        <button
                            className="btn-primary"
                            disabled={!newPlayerName}
                            onClick={handleAddNewPlayer}
                        >
                            Add Player
                        </button>
                    </div>
                </div>
            )}

            {showEndGameModal && (
                <div className="modal-overlay">
                    <ReactConfetti recycle={true} numberOfPieces={200} />
                    <div className="modal-content" style={{ position: 'relative', zIndex: 1001 }}>
                        <div className="modal-header">
                            <h2>🏆 End Game</h2>
                            <button onClick={() => setShowEndGameModal(false)} className="icon-btn">X</button>
                        </div>
                        <div className="modal-section">
                            <label>Select Winner</label>
                            <select
                                className="styled-input"
                                value={winnerId}
                                onChange={(e) => setWinnerId(e.target.value)}
                            >
                                {localPlayers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.totalScore})</option>
                                ))}
                            </select>
                            <p className="mt-sm" style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Highest Score: {highScoreVal} - {highScorePlayers} <br />
                                Lowest Score: {lowScoreVal} - {lowScorePlayers}
                            </p>
                        </div>
                        <button className="btn-primary" onClick={confirmEndGame}>Confirm & Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamePage;
