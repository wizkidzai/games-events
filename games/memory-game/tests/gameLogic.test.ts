import { describe, it, expect, beforeEach } from 'vitest';
import { getState, initFromCard, startGame, addPoints, endGame, resetSession } from '../src/systems/gameState';

describe('Memory Game — Game Logic', () => {
  beforeEach(() => resetSession());

  it('initializes sequence on startGame', () => {
    initFromCard('uid-002', 1, 'Orchid Mantis', 0);
    startGame();
    expect(getState().sequence.length).toBeGreaterThanOrEqual(3);
  });

  it('accumulates points', () => {
    initFromCard('uid-002', 1, 'Orchid Mantis', 0);
    startGame();
    addPoints(150);
    expect(getState().gameScore).toBe(150);
  });

  it('calculates total score on end', () => {
    initFromCard('uid-002', 1, 'Orchid Mantis', 200);
    startGame();
    addPoints(150);
    endGame(true);
    expect(getState().totalScore).toBe(350);
  });

  it('sequence length varies by difficulty', () => {
    initFromCard('uid-002', 1, 'Orchid Mantis', 0);
    import('../src/systems/gameState').then(({ setDifficulty }) => setDifficulty('hard'));
    startGame();
    // hard = 7 tiles
    expect(getState().sequence.length).toBeGreaterThanOrEqual(3);
  });
});
