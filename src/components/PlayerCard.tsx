import React, { useState, useEffect } from 'react';
import type { Player } from '../types';
import { Plus, Skull, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlayerCardProps {
    player: Player;
    currentRound: number;
    onAddScore: (score: number, roundIndex: number) => void;
    onEliminate: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, currentRound, onAddScore, onEliminate }) => {
    const [activeRound, setActiveRound] = useState(currentRound);
    const [scoreInput, setScoreInput] = useState('');

    // Sync activeRound with game's currentRound when it advances
    useEffect(() => {
        setActiveRound(currentRound);
    }, [currentRound]);

    // Sync input with the score of the active round
    useEffect(() => {
        const savedScore = player.scores[activeRound];
        setScoreInput(savedScore !== undefined ? savedScore.toString() : '');
    }, [activeRound, player.scores, player]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: player.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleSubmitScore = () => {
        if (scoreInput.trim() === '') return; // Don't submit empty
        const score = parseInt(scoreInput);
        if (!isNaN(score)) {
            onAddScore(score, activeRound);
            // We don't clear input if we are editing. 
            // If it's the current round (adding new score), maybe we want to keep it visible?
            // Actually, usually in these games you want to see what you entered.
            // Since we rely on `player.scores` to populate input, it will persist.
        }
    };

    const changeRound = (delta: number) => {
        const newRound = activeRound + delta;
        if (newRound >= 0 && newRound <= currentRound) {
            setActiveRound(newRound);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`player-card ${player.isEliminated ? 'eliminated' : ''}`}
        >
            <div className="drag-handle" {...attributes} {...listeners}>:::</div>

            <div className="player-info">
                <h3>{player.name}</h3>
                <div className="total-score">
                    <span className="label">Total</span>
                    <span className="value">{player.totalScore}</span>
                </div>
            </div>

            <div className="player-actions">
                {!player.isEliminated ? (
                    <>
                        <div className="round-control">
                            <button
                                className="icon-btn-large"
                                onClick={() => changeRound(-1)}
                                disabled={activeRound === 0}
                                title="Previous Round"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <span className="round-indicator">Rd {activeRound + 1}</span>
                            <button
                                className="icon-btn-large"
                                onClick={() => changeRound(1)}
                                disabled={activeRound === currentRound}
                                title="Next Round"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <div className="score-input-wrapper">
                            <input
                                type="number"
                                value={scoreInput}
                                onChange={(e) => setScoreInput(e.target.value)}
                                placeholder="-"
                                className="score-input-small"
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitScore()}
                            />
                            <button onClick={handleSubmitScore} className="btn-add"><Plus size={20} /></button>
                        </div>
                    </>
                ) : (
                    <div className="eliminated-badge" style={{ flex: 1 }}>Eliminated</div>
                )}

                <button
                    onClick={onEliminate}
                    className={`btn-eliminate ${player.isEliminated ? 'restore' : ''}`}
                    title={player.isEliminated ? "Restore Player" : "Eliminate Player"}
                >
                    <Skull size={18} />
                </button>
            </div>
        </div>
    );
};

export default PlayerCard;
