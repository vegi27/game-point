import React, { useState } from 'react';
import type { Player } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreTableProps {
    players: Player[];
    rounds: number;
    onEditScore: (playerId: string, roundIndex: number, newScore: number) => void;
}

const ScoreTable: React.FC<ScoreTableProps> = ({ players, rounds, onEditScore }) => {
    const [sortConfig, setSortConfig] = useState<{ key: 'total' | 'name', direction: 'asc' | 'desc' } | null>(null);

    const sortedPlayers = React.useMemo(() => {
        let sortablePlayers = [...players];
        if (sortConfig !== null) {
            sortablePlayers.sort((a, b) => {
                if (sortConfig.key === 'total') {
                    return sortConfig.direction === 'asc' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
                } else {
                    return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                }
            });
        }
        return sortablePlayers;
    }, [players, sortConfig]);

    const requestSort = (key: 'total' | 'name') => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to high score first
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    // Helper to handle cell edits
    const handleCellClick = (player: Player, roundIndex: number) => {
        const currentScore = player.scores[roundIndex] || 0;
        const newScoreString = prompt(`Edit score for ${player.name} (Round ${roundIndex + 1})`, currentScore.toString());
        if (newScoreString !== null) {
            const newScore = parseInt(newScoreString);
            if (!isNaN(newScore)) {
                onEditScore(player.id, roundIndex, newScore);
            }
        }
    };

    return (
        <div className="score-table-container">
            <table className="score-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('name')} className="sortable-header">
                            Player {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </th>
                        <th onClick={() => requestSort('total')} className="sortable-header">
                            Total {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </th>
                        {Array.from({ length: rounds }).map((_, i) => (
                            <th key={i}>R{i + 1}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map(player => (
                        <tr key={player.id} className={player.isEliminated ? 'eliminated-row' : ''}>
                            <td className="player-name-cell">{player.name}</td>
                            <td className="total-cell">{player.totalScore}</td>
                            {Array.from({ length: rounds }).map((_, i) => {
                                const score = player.scores[i];
                                return (
                                    <td
                                        key={i}
                                        className="score-cell"
                                        onClick={() => handleCellClick(player, i)}
                                        title="Click to edit"
                                    >
                                        {score !== undefined ? score : '-'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScoreTable;
