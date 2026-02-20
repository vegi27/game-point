import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Medal, Users, TrendingUp } from 'lucide-react';
import type { LeaderboardEntry } from '../types';

const Leaderboard: React.FC = () => {
    const { state } = useGame();
    const [statsTab, setStatsTab] = useState<'players' | 'games'>('players');
    const [selectedGroup, setSelectedGroup] = useState<string>('all');

    // Get relevant completed games
    const completedGames = state.savedGames.filter(g => g.status === 'completed');

    // Filter players based on selected group
    const allowedPlayers = selectedGroup === 'all'
        ? state.library.playerNames
        : state.library.groups[selectedGroup] || [];

    // --- Player Stats Logic (Dynamic) ---
    const buildPlayerStats = () => {
        const playerMap: Record<string, LeaderboardEntry> = {};

        // Only initialize allowed players if a group is selected, otherwise we allow anyone who played
        const initialPlayers = selectedGroup === 'all'
            ? Array.from(new Set(completedGames.flatMap(g => g.players.map(p => p.name))))
            : allowedPlayers;

        initialPlayers.forEach(name => {
            playerMap[name] = { playerName: name, games: {} };
        });

        completedGames.forEach(game => {
            game.players.forEach(p => {
                if (!playerMap[p.name] && selectedGroup === 'all') {
                    playerMap[p.name] = { playerName: p.name, games: {} };
                }

                if (playerMap[p.name]) { // They are allowed
                    if (!playerMap[p.name].games[game.gameName]) {
                        playerMap[p.name].games[game.gameName] = { played: 0, won: 0 };
                    }
                    playerMap[p.name].games[game.gameName].played += 1;
                    if (game.winnerId === p.id) {
                        playerMap[p.name].games[game.gameName].won += 1;
                    }
                }
            });
        });

        // Filter out players who haven't played anything if we want, or keep them with 0s. Let's keep them if in group.
        return Object.values(playerMap).sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
            const winsA = Object.values(a.games).reduce((sum, g) => sum + g.won, 0);
            const winsB = Object.values(b.games).reduce((sum, g) => sum + g.won, 0);
            return winsB - winsA;
        });
    };

    const sortedLeaderboard = buildPlayerStats();

    // --- Game Stats Logic (Dynamic) ---
    const calculateGameStats = () => {
        const gameStats: Record<string, {
            highestScore: { player: string, score: number },
            lowestScore: { player: string, score: number },
            mostWins: { player: string, wins: number },
            bestWinRate: { player: string, rate: number }
        }> = {};

        // Aggregate data per game type from completed games
        const playerGameData: Record<string, Record<string, { scores: number[], wins: number, played: number }>> = {};

        completedGames.forEach(game => {
            // First check if any allowed player was in this game to bother processing?
            // Actually, we process the game, but only include allowed players in the tally.

            game.players.forEach(p => {
                const isAllowed = selectedGroup === 'all' || allowedPlayers.includes(p.name);

                if (isAllowed) {
                    if (!playerGameData[game.gameName]) {
                        playerGameData[game.gameName] = {};
                    }
                    if (!playerGameData[game.gameName][p.name]) {
                        playerGameData[game.gameName][p.name] = { scores: [], wins: 0, played: 0 };
                    }
                    playerGameData[game.gameName][p.name].scores.push(p.totalScore);
                    playerGameData[game.gameName][p.name].played += 1;
                    if (p.id === game.winnerId) {
                        playerGameData[game.gameName][p.name].wins += 1;
                    }
                }
            });
        });

        // Now calculate the extremes for each game type
        Object.entries(playerGameData).forEach(([gameName, players]) => {
            let highest = { player: '-', score: -Infinity };
            let lowest = { player: '-', score: Infinity };
            let mostWins = { player: '-', wins: -1 };
            let bestWinRate = { player: '-', rate: -1 };

            Object.entries(players).forEach(([playerName, data]) => {
                const maxScore = Math.max(...data.scores);
                const minScore = Math.min(...data.scores);
                const winRate = data.played > 0 ? (data.wins / data.played) * 100 : 0;

                if (maxScore > highest.score) highest = { player: playerName, score: maxScore };
                if (minScore < lowest.score) lowest = { player: playerName, score: minScore };
                if (data.wins > mostWins.wins) mostWins = { player: playerName, wins: data.wins };
                if (winRate > bestWinRate.rate) bestWinRate = { player: playerName, rate: winRate };
            });

            // Handle cases where no valid score exists (e.g. initial state)
            if (highest.score === -Infinity) highest.score = 0;
            if (lowest.score === Infinity) lowest.score = 0;

            gameStats[gameName] = {
                highestScore: highest,
                lowestScore: lowest,
                mostWins: mostWins,
                bestWinRate: bestWinRate
            };
        });

        return gameStats;
    };

    const gameStatsData = calculateGameStats();

    if (sortedLeaderboard.length === 0 && Object.keys(gameStatsData).length === 0) {
        return <div className="empty-state">No games played yet! Start a game to see stats.</div>;
    }

    return (
        <div className="leaderboard-container">
            <div className="stats-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                <div className="home-nav" style={{ marginBottom: 0, flex: 1 }}>
                    <button
                        className={`nav-btn ${statsTab === 'players' ? 'active' : ''}`}
                        onClick={() => setStatsTab('players')}
                    >
                        <Users size={18} /> Player Stats
                    </button>
                    <button
                        className={`nav-btn ${statsTab === 'games' ? 'active' : ''}`}
                        onClick={() => setStatsTab('games')}
                    >
                        <TrendingUp size={18} /> Game Stats
                    </button>
                </div>

                <div className="group-filter" style={{ minWidth: '150px' }}>
                    <select
                        className="styled-input"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        style={{ padding: '8px', width: '100%' }}
                    >
                        <option value="all">All Players</option>
                        {Object.keys(state.library.groups).map(groupName => (
                            <option key={groupName} value={groupName}>Group: {groupName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {statsTab === 'players' && (
                sortedLeaderboard.length === 0 ? (
                    <div className="empty-state">No player stats available yet.</div>
                ) : (
                    sortedLeaderboard.map((entry: LeaderboardEntry, index) => {
                        const totalWins = Object.values(entry.games).reduce((sum, g) => sum + g.won, 0);
                        const totalPlayed = Object.values(entry.games).reduce((sum, g) => sum + g.played, 0);
                        const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

                        return (
                            <div key={entry.playerName} className="leaderboard-card">
                                <div className="rank-indicator">
                                    {index === 0 ? <Trophy color="#FFD700" size={24} /> :
                                        index === 1 ? <Medal color="#C0C0C0" size={24} /> :
                                            index === 2 ? <Medal color="#CD7F32" size={24} /> :
                                                <span className="rank-number">{index + 1}</span>}
                                </div>

                                <div className="player-stats-main">
                                    <h3>{entry.playerName}</h3>
                                    <div className="overall-stats">
                                        <span className="stat-tag win-rate">{winRate}% Win Rate</span>
                                        <span className="stat-tag total-wins">{totalWins} Wins</span>
                                    </div>
                                </div>

                                <div className="game-breakdown">
                                    {Object.entries(entry.games).map(([gameName, stats]) => (
                                        <div key={gameName} className="game-stat-row">
                                            <span className="game-name">{gameName}</span>
                                            <span className="game-numbers">{stats.won}/{stats.played} ({Math.round((stats.won / stats.played) * 100)}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )
            )}

            {statsTab === 'games' && (
                Object.keys(gameStatsData).length === 0 ? (
                    <div className="empty-state">Complete a game to see game-specific stats!</div>
                ) : (
                    Object.entries(gameStatsData).map(([gameName, stats]) => (
                        <div key={gameName} className="leaderboard-card">
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>{gameName}</h3>
                            <div className="game-breakdown">
                                <div className="game-stat-row">
                                    <span className="game-name">Highest Score</span>
                                    <span className="game-numbers">
                                        <strong>{stats.highestScore.score}</strong> ({stats.highestScore.player})
                                    </span>
                                </div>
                                <div className="game-stat-row">
                                    <span className="game-name">Lowest Score</span>
                                    <span className="game-numbers">
                                        <strong>{stats.lowestScore.score}</strong> ({stats.lowestScore.player})
                                    </span>
                                </div>
                                <div className="game-stat-row">
                                    <span className="game-name">Most Wins</span>
                                    <span className="game-numbers">
                                        <strong>{stats.mostWins.wins}</strong> ({stats.mostWins.player})
                                    </span>
                                </div>
                                <div className="game-stat-row">
                                    <span className="game-name">Best Win Rate</span>
                                    <span className="game-numbers">
                                        <strong>{Math.round(stats.bestWinRate.rate)}%</strong> ({stats.bestWinRate.player})
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )
            )}
        </div>
    );
};

export default Leaderboard;
