import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  selectMascot,
  setDifficulty,
  startRun,
  addScore,
  endRun,
  resetSession,
} from '../src/systems/gameState';

describe('Mascot Runner — Game Logic', () => {
  beforeEach(() => resetSession());

  it('initial state has score 0 and medium difficulty', () => {
    expect(getState().score).toBe(0);
    expect(getState().difficulty).toBe('medium');
    expect(getState().selectedMascotID).toBe(0);
  });

  it('selectMascot updates selectedMascotID', () => {
    selectMascot(3);
    expect(getState().selectedMascotID).toBe(3);
  });

  it('setDifficulty updates difficulty', () => {
    setDifficulty('hard');
    expect(getState().difficulty).toBe('hard');
  });

  it('startRun resets score and marks run active', () => {
    addScore(500);
    startRun();
    expect(getState().score).toBe(0);
    expect(getState().isRunActive).toBe(true);
    expect(getState().isRunOver).toBe(false);
  });

  it('addScore accumulates correctly within a run', () => {
    startRun();
    addScore(100);
    addScore(250);
    expect(getState().score).toBe(350);
  });

  it('highScore persists the maximum score across runs', () => {
    startRun();
    addScore(300);
    endRun();
    startRun();
    addScore(200);
    endRun();
    expect(getState().highScore).toBe(300);
  });

  it('endRun records entry to leaderboard sorted descending', () => {
    startRun();
    addScore(200);
    endRun();
    startRun();
    addScore(350);
    endRun();
    const lb = getState().leaderboard;
    expect(lb.length).toBe(2);
    expect(lb[0].score).toBe(350);
    expect(lb[1].score).toBe(200);
  });

  it('leaderboard is capped at top 5 entries', () => {
    for (let i = 1; i <= 7; i++) {
      startRun();
      addScore(i * 100);
      endRun();
    }
    const lb = getState().leaderboard;
    expect(lb.length).toBe(5);
    expect(lb[0].score).toBe(700);
    expect(lb[4].score).toBe(300);
  });

  it('resetSession clears score, highScore, leaderboard, and mascot selection', () => {
    selectMascot(4);
    startRun();
    addScore(500);
    endRun();
    resetSession();
    const s = getState();
    expect(s.score).toBe(0);
    expect(s.highScore).toBe(0);
    expect(s.leaderboard.length).toBe(0);
    expect(s.selectedMascotID).toBe(0);
    expect(s.isRunActive).toBe(false);
  });
});
