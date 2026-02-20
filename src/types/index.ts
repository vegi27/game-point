export interface Player {
    id: string;
    name: string;
    isEliminated: boolean;
    scores: number[]; // Index = round number - 1
    totalScore: number;
}

export interface GameSession {
    id: string;
    gameName: string;
    startTime: number; // Timestamp
    players: Player[];
    status: 'active' | 'completed';
    rounds: number;
    winnerId?: string;
}

export interface SavedGame {
    id: string;
    gameName: string;
    date: string; // ISO String
    playerCount: number;
}

export interface LeaderboardStats {
    played: number;
    won: number;
}

export interface LeaderboardEntry {
    playerName: string;
    games: Record<string, LeaderboardStats>; // gameName -> Stats
}

export type Theme = 'light' | 'dark';
