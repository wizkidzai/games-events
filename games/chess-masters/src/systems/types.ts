export type Difficulty = 'easy' | 'medium' | 'hard';
export type SceneName = 'MenuScene' | 'GameScene' | 'GameOverScene';
export type MascotAnimation = 'idle' | 'happy' | 'confused' | 'sad' | 'celebrating';

export interface CardData {
  uid: string;
  mascotID: number;
  uniqueID: string;
  totalPoints: number;
}

export interface LeaderboardEntry {
  gameScore: number;
  totalScore: number;
  difficulty: string;
  timestamp: string;
}

export interface GameState {
  // Card & session
  cardUID: string;
  mascotID: number;
  mascotName: string;
  cardScorePrevious: number;

  // Game progress
  currentScene: SceneName;
  gameScore: number;
  totalScore: number;
  level: number;
  difficulty: Difficulty;
  isGameActive: boolean;
  isGameOver: boolean;

  // Leaderboard (per session)
  leaderboardScores: LeaderboardEntry[];

  // Mascot state
  mascotAnimation: MascotAnimation;
  mascotDialogue: string;

  // Session config
  maxInactivityMinutes: number;
  lastActivityTime: number;
}

export const INITIAL_GAME_STATE: GameState = {
  cardUID: '',
  mascotID: 0,
  mascotName: 'Peacock Pride',
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
};
