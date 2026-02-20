import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Dices, Book, ScrollText, X, Trash2 } from 'lucide-react'; // Changed icons
import { useGame } from '../context/GameContext';
import NewGameModal from './NewGameModal';
import SavedGames from './SavedGames';
import Leaderboard from './Leaderboard';

const HomePage: React.FC = () => {
    const { state, dispatch } = useGame();
    const [showNewGameModal, setShowNewGameModal] = useState(false);
    // Unified entry point via Tabs
    const [activeMainTab, setActiveMainTab] = useState<'play' | 'library' | 'leaderboard'>('play');

    // Library inner state
    const [libraryTab, setLibraryTab] = useState<'players' | 'games' | 'groups'>('players');
    const [newItem, setNewItem] = useState('');

    const handleAddLibraryItem = () => {
        if (newItem.trim()) {
            if (libraryTab === 'groups') {
                dispatch({
                    type: 'ADD_GROUP',
                    payload: newItem.trim()
                });
            } else {
                dispatch({
                    type: 'ADD_LIBRARY_ITEM',
                    payload: { type: libraryTab === 'players' ? 'player' : 'game', name: newItem.trim() }
                });
            }
            setNewItem('');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    const libraryItems = libraryTab === 'players' ? state.library.playerNames : state.library.gameNames;
    const groupEntries = Object.entries(state.library.groups);

    return (
        <div className="home-container">
            <header className="app-header">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="app-title"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Dices size={24} /> {/* Playing cards/dice icon representation */}
                    <h1 style={{ fontSize: '1.5rem' }}>Game Point</h1>
                </motion.div>

                <button
                    className="theme-switch"
                    data-checked={state.theme === 'dark'}
                    onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                    title="Toggle Theme"
                >
                    <div className="theme-switch-thumb">
                        {state.theme === 'light' ? '☀️' : '🌙'}
                    </div>
                </button>
            </header>

            <main className="home-content">
                <nav className="home-nav">
                    <button
                        className={`nav-btn ${activeMainTab === 'play' ? 'active' : ''}`}
                        onClick={() => setActiveMainTab('play')}
                    >
                        <Play size={20} /> Play
                    </button>
                    <button
                        className={`nav-btn ${activeMainTab === 'library' ? 'active' : ''}`}
                        onClick={() => setActiveMainTab('library')}
                    >
                        <Book size={20} /> Library
                    </button>
                    <button
                        className={`nav-btn ${activeMainTab === 'leaderboard' ? 'active' : ''}`}
                        onClick={() => setActiveMainTab('leaderboard')}
                    >
                        <ScrollText size={20} /> Stats
                    </button>
                </nav>

                <motion.div
                    className="tab-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key={activeMainTab}
                >
                    {activeMainTab === 'play' && (
                        <div className="start-section">
                            <motion.div variants={itemVariants}>
                                <h3 className="mb-md" style={{ marginTop: '2rem' }}>Game History</h3>
                                <SavedGames />
                            </motion.div>
                        </div>
                    )}

                    {activeMainTab === 'library' && (
                        <div className="library-section">
                            <div className="home-nav" style={{ marginBottom: '1rem' }}>
                                <button
                                    className={`nav-btn ${libraryTab === 'players' ? 'active' : ''}`}
                                    onClick={() => setLibraryTab('players')}
                                >
                                    Players
                                </button>
                                <button
                                    className={`nav-btn ${libraryTab === 'games' ? 'active' : ''}`}
                                    onClick={() => setLibraryTab('games')}
                                >
                                    Games
                                </button>
                                <button
                                    className={`nav-btn ${libraryTab === 'groups' ? 'active' : ''}`}
                                    onClick={() => setLibraryTab('groups')}
                                >
                                    Groups
                                </button>
                            </div>

                            <div className="input-group mb-md">
                                <input
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    placeholder={`New ${libraryTab === 'players' ? 'Player' : libraryTab === 'games' ? 'Game' : 'Group'} Name`}
                                    className="styled-input"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddLibraryItem()}
                                />
                                <button onClick={handleAddLibraryItem} className="btn-secondary"><Plus /></button>
                            </div>

                            {libraryTab !== 'groups' ? (
                                <div className="chips-container">
                                    {libraryItems.length === 0 && <p style={{ color: 'var(--color-text-light)' }}>No items yet.</p>}
                                    {libraryItems.map((item, idx) => (
                                        <div key={idx} className="chip">
                                            {item}
                                            <button
                                                className="btn-icon-danger"
                                                style={{ marginLeft: '8px', padding: '2px', display: 'inline-flex' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Remove "${item}"?`)) {
                                                        dispatch({
                                                            type: 'REMOVE_LIBRARY_ITEM',
                                                            payload: { type: libraryTab === 'players' ? 'player' : 'game', name: item }
                                                        });
                                                    }
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="groups-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {groupEntries.length === 0 && <p style={{ color: 'var(--color-text-light)' }}>No groups yet. Create some!</p>}
                                    {groupEntries.map(([groupName, members]) => (
                                        <div key={groupName} className="library-group-card" style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h3 style={{ margin: 0 }}>{groupName}</h3>
                                                <button
                                                    className="btn-icon-danger"
                                                    onClick={() => {
                                                        if (confirm(`Delete group "${groupName}"?`)) {
                                                            dispatch({ type: 'REMOVE_GROUP', payload: groupName })
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>Toggle members:</p>
                                            <div className="chips-container">
                                                {state.library.playerNames.map(playerName => {
                                                    const isMember = members.includes(playerName);
                                                    return (
                                                        <button
                                                            key={playerName}
                                                            className={`chip ${isMember ? 'selected' : ''}`}
                                                            onClick={() => dispatch({
                                                                type: 'TOGGLE_PLAYER_IN_GROUP',
                                                                payload: { group: groupName, player: playerName }
                                                            })}
                                                        >
                                                            {playerName}
                                                        </button>
                                                    );
                                                })}
                                                {state.library.playerNames.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>No players in library to add.</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeMainTab === 'leaderboard' && <Leaderboard />}
                </motion.div>
            </main>

            {showNewGameModal && (
                <NewGameModal onClose={() => setShowNewGameModal(false)} />
            )}

            {/* Floating Action Button for New Game */}
            <button className="fab-btn" onClick={() => setShowNewGameModal(true)} title="Start New Game">
                <Plus size={32} color="white" />
            </button>
        </div>
    );
};

export default HomePage;
