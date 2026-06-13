export type Difficulty = 'easy' | 'medium' | 'hard';
export type SceneName = 'MenuScene' | 'GameScene' | 'GameOverScene';
export type MascotAnimation = 'idle' | 'happy' | 'confused' | 'sad' | 'celebrating';

export interface LeaderboardEntry {
  gameScore: number;
  totalScore: number;
  difficulty: string;
  timestamp: string;
}

export interface GameState {
  cardUID: string;
  mascotID: number;
  mascotName: string;
  cardScorePrevious: number;
  currentScene: SceneName;
  gameScore: number;
  totalScore: number;
  level: number;
  difficulty: Difficulty;
  isGameActive: boolean;
  isGameOver: boolean;
  leaderboardScores: LeaderboardEntry[];
  mascotAnimation: MascotAnimation;
  mascotDialogue: string;
  maxInactivityMinutes: number;
  lastActivityTime: number;
  // Memory-game specific
  sequence: number[];
  currentRound: number;
}

export const INITIAL_GAME_STATE: GameState = {
  cardUID: '',
  mascotID: 1,
  mascotName: 'Orchid Mantis',
  cardScorePrevious: 0,
  currentScene: 'MenuScene',
  gameScore: 0,
  totalScore: 0,
  level: 1,
  difficulty: 'medium',
  isGameActive: false,
  isGameOver: false,
  leaderboardScores: [],
  mascotAnimation: 'idle',
  mascotDialogue: '',
  maxInactivityMinutes: 30,
  lastActivityTime: Date.now(),
  sequence: [],
  currentRound: 0,
};
