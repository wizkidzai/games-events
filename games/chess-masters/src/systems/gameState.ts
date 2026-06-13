import { INITIAL_GAME_STATE } from './types';
import type { GameState, Difficulty, MascotAnimation, LeaderboardEntry } from './types';

let state: GameState = { ...INITIAL_GAME_STATE };
const listeners = new Set<(s: GameState) => void>();

export function getState(): GameState {
  return state;
}

function setState(patch: Partial<GameState>): void {
  state = { ...state, ...patch };
  listeners.forEach(cb => cb(state));
}

export function subscribe(cb: (s: GameState) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function initFromCard(
  uid: string,
  mascotID: number,
  mascotName: string,
  totalPoints: number
): void {
  setState({
    cardUID: uid,
    mascotID,
    mascotName,
    cardScorePrevious: totalPoints,
    totalScore: totalPoints,
    gameScore: 0,
  });
}

export function setDifficulty(difficulty: Difficulty): void {
  setState({ difficulty });
}

export function startGame(): void {
  setState({ isGameActive: true, isGameOver: false, gameScore: 0, currentScene: 'GameScene' });
}

export function addPoints(points: number): void {
  const gameScore = state.gameScore + points;
  setState({ gameScore });
}

export function setMascotState(animation: MascotAnimation, dialogue: string): void {
  setState({ mascotAnimation: animation, mascotDialogue: dialogue });
}

export function endGame(won: boolean): void {
  const totalScore = state.cardScorePrevious + state.gameScore;
  setState({
    isGameActive: false,
    isGameOver: true,
    totalScore,
    mascotAnimation: won ? 'celebrating' : 'sad',
    currentScene: 'GameOverScene',
  });

  const entry: LeaderboardEntry = {
    gameScore: state.gameScore,
    totalScore,
    difficulty: state.difficulty,
    timestamp: new Date().toISOString(),
  };
  const sorted = [...state.leaderboardScores, entry]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);
  setState({ leaderboardScores: sorted });
}

export function resetSession(): void {
  state = { ...INITIAL_GAME_STATE, lastActivityTime: Date.now() };
  listeners.forEach(cb => cb(state));
}
