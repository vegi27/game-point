import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { GameSession, LeaderboardEntry, Theme } from '../types';

// State Definition
interface GameState {
    activeSession: GameSession | null;
    savedGames: GameSession[]; // Simplified: keeping full sessions for now
    leaderboard: LeaderboardEntry[];
    library: {
        playerNames: string[];
        gameNames: string[];
        groups: Record<string, string[]>;
    };
    theme: Theme;
}

// Action Definitions
type Action =
    | { type: 'START_GAME'; payload: GameSession }
    | { type: 'UPDATE_SESSION'; payload: GameSession }
    | { type: 'END_GAME'; payload: { session: GameSession; winnerId?: string } }
    | { type: 'LOAD_GAME'; payload: GameSession }
    | { type: 'DELETE_GAME'; payload: string }
    | { type: 'ADD_LIBRARY_ITEM'; payload: { type: 'player' | 'game'; name: string } }
    | { type: 'REMOVE_LIBRARY_ITEM'; payload: { type: 'player' | 'game'; name: string } }
    | { type: 'ADD_GROUP'; payload: string }
    | { type: 'REMOVE_GROUP'; payload: string }
    | { type: 'TOGGLE_PLAYER_IN_GROUP'; payload: { group: string; player: string } }
    | { type: 'TOGGLE_THEME' }
    | { type: 'LOAD_STATE'; payload: GameState };

// Initial State
const initialState: GameState = {
    activeSession: null,
    savedGames: [],
    leaderboard: [],
    library: {
        playerNames: [],
        gameNames: [],
        groups: {},
    },
    theme: 'dark',
};

// Reducer
const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'START_GAME':
            return { ...state, activeSession: action.payload };
        case 'UPDATE_SESSION':
            return { ...state, activeSession: action.payload };
        case 'END_GAME': {
            const { session, winnerId } = action.payload;
            const completedSession = { ...session, status: 'completed' as const, winnerId };

            const existingIndex = state.savedGames.findIndex(g => g.id === session.id);
            let newSavedGames = [...state.savedGames];
            if (existingIndex >= 0) {
                newSavedGames[existingIndex] = completedSession;
            } else {
                newSavedGames.push(completedSession);
            }

            return {
                ...state,
                activeSession: null,
                savedGames: newSavedGames,
            };
        }
        case 'LOAD_GAME':
            return { ...state, activeSession: action.payload };
        case 'DELETE_GAME':
            return { ...state, savedGames: state.savedGames.filter(g => g.id !== action.payload) };
        case 'ADD_LIBRARY_ITEM': {
            const listKey = action.payload.type === 'player' ? 'playerNames' : 'gameNames';
            if (state.library[listKey].includes(action.payload.name)) return state;
            return {
                ...state,
                library: {
                    ...state.library,
                    [listKey]: [...state.library[listKey], action.payload.name],
                },
            };
        }
        case 'REMOVE_LIBRARY_ITEM': {
            const listKey = action.payload.type === 'player' ? 'playerNames' : 'gameNames';
            return {
                ...state,
                library: {
                    ...state.library,
                    [listKey]: state.library[listKey].filter(name => name !== action.payload.name),
                },
            };
        }
        case 'ADD_GROUP': {
            if (state.library.groups[action.payload]) return state;
            return {
                ...state,
                library: {
                    ...state.library,
                    groups: { ...state.library.groups, [action.payload]: [] }
                }
            };
        }
        case 'REMOVE_GROUP': {
            const newGroups = { ...state.library.groups };
            delete newGroups[action.payload];
            return {
                ...state,
                library: {
                    ...state.library,
                    groups: newGroups
                }
            };
        }
        case 'TOGGLE_PLAYER_IN_GROUP': {
            const { group, player } = action.payload;
            const currentMembers = state.library.groups[group] || [];
            const newMembers = currentMembers.includes(player)
                ? currentMembers.filter(p => p !== player)
                : [...currentMembers, player];

            return {
                ...state,
                library: {
                    ...state.library,
                    groups: { ...state.library.groups, [group]: newMembers }
                }
            };
        }
        case 'TOGGLE_THEME':
            return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
        case 'LOAD_STATE':
            return action.payload;
        default:
            return state;
    }
};

// Context
const GameContext = createContext<{
    state: GameState;
    dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

// Provider
const STORAGE_KEY = 'game_point_data';

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    // Load from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Merge with initial state to ensure structure validity
                dispatch({ type: 'LOAD_STATE', payload: { ...initialState, ...parsed } });
            } catch (e) {
                console.error("Failed to load state", e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Apply theme
        document.documentElement.setAttribute('data-theme', state.theme);
    }, [state]);

    return (
        <GameContext.Provider value={{ state, dispatch }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
