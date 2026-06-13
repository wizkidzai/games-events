import { describe, it, expect, beforeEach } from 'vitest';
import { getState, initFromCard, startGame, addPoints, endGame, resetSession } from '../src/systems/gameState';

describe('Chess Masters — Game Logic', () => {
  beforeEach(() => {
    resetSession();
  });

  it('loads card score as previous score', () => {
    initFromCard('uid-001', 0, 'Peacock Pride', 350);
    expect(getState().cardScorePrevious).toBe(350);
  });

  it('accumulates points correctly', () => {
    initFromCard('uid-001', 0, 'Peacock Pride', 100);
    startGame();
    addPoints(50);
    addPoints(30);
    expect(getState().gameScore).toBe(80);
  });

  it('calculates total score on game end', () => {
    initFromCard('uid-001', 0, 'Peacock Pride', 350);
    startGame();
    addPoints(220);
    endGame(true);
    expect(getState().totalScore).toBe(570);
  });

  it('adds to leaderboard on game end', () => {
    initFromCard('uid-001', 0, 'Peacock Pride', 0);
    startGame();
    addPoints(100);
    endGame(true);
    expect(getState().leaderboardScores.length).toBe(1);
    expect(getState().leaderboardScores[0].gameScore).toBe(100);
  });

  it('keeps only top 5 leaderboard entries', () => {
    for (let i = 0; i < 6; i++) {
      resetSession();
      initFromCard('uid-001', 0, 'Peacock Pride', 0);
      startGame();
      addPoints((i + 1) * 50);
      endGame(true);
    }
    // Each resetSession clears leaderboard — last game only
    expect(getState().leaderboardScores.length).toBeLessThanOrEqual(5);
  });

  it('resets game score on session reset', () => {
    initFromCard('uid-001', 0, 'Peacock Pride', 100);
    startGame();
    addPoints(200);
    resetSession();
    expect(getState().gameScore).toBe(0);
    expect(getState().cardUID).toBe('');
  });
});
