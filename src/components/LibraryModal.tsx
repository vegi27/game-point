import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { X, Plus } from 'lucide-react';

interface LibraryModalProps {
    onClose: () => void;
}

const LibraryModal: React.FC<LibraryModalProps> = ({ onClose }) => {
    const { state, dispatch } = useGame();
    const [activeTab, setActiveTab] = useState<'players' | 'games'>('players');
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            dispatch({
                type: 'ADD_LIBRARY_ITEM',
                payload: { type: activeTab === 'players' ? 'player' : 'game', name: newItem.trim() }
            });
            setNewItem('');
        }
    };

    const items = activeTab === 'players' ? state.library.playerNames : state.library.gameNames;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <header className="modal-header">
                    <h2>Library</h2>
                    <button onClick={onClose} className="icon-btn"><X /></button>
                </header>

                <div className="modal-section">
                    <div className="home-nav" style={{ marginBottom: '1rem' }}>
                        <button
                            className={`nav-btn ${activeTab === 'players' ? 'active' : ''}`}
                            onClick={() => setActiveTab('players')}
                        >
                            Players
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'games' ? 'active' : ''}`}
                            onClick={() => setActiveTab('games')}
                        >
                            Games
                        </button>
                    </div>

                    <div className="input-group mb-md">
                        <input
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder={`New ${activeTab === 'players' ? 'Player' : 'Game'} Name`}
                            className="styled-input"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button onClick={handleAdd} className="btn-secondary"><Plus /></button>
                    </div>

                    <div className="chips-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {items.map((item, idx) => (
                            <div key={idx} className="chip" style={{ cursor: 'default' }}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryModal;
