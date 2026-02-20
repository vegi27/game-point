import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { v4 as uuidv4 } from 'uuid';

interface NewGameModalProps {
    onClose: () => void;
}

const NewGameModal: React.FC<NewGameModalProps> = ({ onClose }) => {
    const { state, dispatch } = useGame();
    const navigate = useNavigate();

    const [gameName, setGameName] = useState('');
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [newPlayerName, setNewPlayerName] = useState('');

    const handleAddPlayer = () => {
        if (newPlayerName.trim() && !selectedPlayers.includes(newPlayerName)) {
            setSelectedPlayers([...selectedPlayers, newPlayerName]);
            setNewPlayerName('');
            // Add to library automatically
            dispatch({ type: 'ADD_LIBRARY_ITEM', payload: { type: 'player', name: newPlayerName } });
        }
    };

    const togglePlayerSelection = (name: string) => {
        if (selectedPlayers.includes(name)) {
            setSelectedPlayers(selectedPlayers.filter(p => p !== name));
        } else {
            setSelectedPlayers([...selectedPlayers, name]);
        }
    };

    const handleStartGame = () => {
        if (!gameName || selectedPlayers.length === 0) return;

        const newSession = {
            id: uuidv4(),
            gameName,
            startTime: Date.now(),
            rounds: 0,
            status: 'active' as const,
            players: selectedPlayers.map(name => ({
                id: uuidv4(),
                name,
                isEliminated: false,
                scores: [],
                totalScore: 0
            }))
        };

        // Add game to library
        dispatch({ type: 'ADD_LIBRARY_ITEM', payload: { type: 'game', name: gameName } });

        dispatch({ type: 'START_GAME', payload: newSession });
        onClose();
        navigate(`/game/${newSession.id}`);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <header className="modal-header">
                    <h2>Start New Game</h2>
                    <button onClick={onClose} className="icon-btn"><X /></button>
                </header>

                <section className="modal-section">
                    <label>Game Name</label>
                    <div className="input-group">
                        <input
                            list="game-suggestions"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            placeholder="e.g. Catan, Poker"
                            className="styled-input"
                        />
                        <datalist id="game-suggestions">
                            {state.library.gameNames.map(name => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>
                    </div>
                </section>

                <section className="modal-section">
                    <label>Select Players</label>
                    <div className="chips-container">
                        {state.library.playerNames.map(name => (
                            <button
                                key={name}
                                className={`chip ${selectedPlayers.includes(name) ? 'selected' : ''}`}
                                onClick={() => togglePlayerSelection(name)}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    <div className="input-group mt-sm">
                        <input
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="Add new player..."
                            className="styled-input"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                        />
                        <button onClick={handleAddPlayer} className="btn-secondary"><Plus size={18} /></button>
                    </div>
                </section>

                <footer className="modal-footer">
                    <button
                        className="btn-primary full-width"
                        disabled={!gameName || selectedPlayers.length === 0}
                        onClick={handleStartGame}
                    >
                        Start Game
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default NewGameModal;
