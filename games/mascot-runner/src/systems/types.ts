export type Difficulty = 'easy' | 'medium' | 'hard';
export type SceneName = 'MenuScene' | 'GameScene' | 'GameOverScene';

export interface LeaderboardEntry {
  score: number;
  mascotID: number;
  difficulty: string;
  timestamp: string;
}

export interface RunnerGameState {
  selectedMascotID: number;
  difficulty: Difficulty;
  score: number;
  highScore: number;
  isRunActive: boolean;
  isRunOver: boolean;
  currentScene: SceneName;
  leaderboard: LeaderboardEntry[];
}

export const INITIAL_STATE: RunnerGameState = {
  selectedMascotID: 0,
  difficulty: 'medium',
  score: 0,
  highScore: 0,
  isRunActive: false,
  isRunOver: false,
  currentScene: 'MenuScene',
  leaderboard: [],
};
