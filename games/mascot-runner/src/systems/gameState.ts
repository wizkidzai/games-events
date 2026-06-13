import { INITIAL_STATE } from './types';
import type { RunnerGameState, Difficulty, LeaderboardEntry } from './types';

let state: RunnerGameState = { ...INITIAL_STATE };
const listeners = new Set<(s: RunnerGameState) => void>();

function setState(patch: Partial<RunnerGameState>): void {
  state = { ...state, ...patch };
  listeners.forEach(cb => cb(state));
}

export function getState(): RunnerGameState {
  return state;
}

export function subscribe(cb: (s: RunnerGameState) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function selectMascot(id: number): void {
  setState({ selectedMascotID: id });
}

export function setDifficulty(diff: Difficulty): void {
  setState({ difficulty: diff });
}

export function startRun(): void {
  setState({ score: 0, isRunActive: true, isRunOver: false, currentScene: 'GameScene' });
}

export function addScore(pts: number): void {
  const score = state.score + pts;
  const highScore = Math.max(score, state.highScore);
  setState({ score, highScore });
}

export function endRun(): void {
  const entry: LeaderboardEntry = {
    score: state.score,
    mascotID: state.selectedMascotID,
    difficulty: state.difficulty,
    timestamp: new Date().toISOString(),
  };
  const leaderboard = [...state.leaderboard, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  setState({ isRunActive: false, isRunOver: true, leaderboard, currentScene: 'GameOverScene' });
}

export function resetSession(): void {
  state = { ...INITIAL_STATE };
  listeners.forEach(cb => cb(state));
}
