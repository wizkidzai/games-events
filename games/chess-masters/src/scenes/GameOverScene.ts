import Phaser from 'phaser';
import { getState, resetSession } from '../systems/gameState';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const state = getState();
    this.cameras.main.setBackgroundColor('#FAFAFA');

    // Title
    this.add
      .text(width / 2, 60, state.isGameOver ? 'Game Over!' : 'You Won!', {
        fontSize: '42px',
        fontFamily: 'Poppins, sans-serif',
        color: '#006464',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Scores
    this.add
      .text(width / 2, 130, `Game Score: ${state.gameScore} pts`, {
        fontSize: '24px',
        fontFamily: 'Poppins, sans-serif',
        color: '#2D2D2D',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 170, `Total Score: ${state.totalScore} pts`, {
        fontSize: '20px',
        fontFamily: 'Poppins, sans-serif',
        color: '#374151',
      })
      .setOrigin(0.5);

    if (state.totalScore > state.cardScorePrevious) {
      this.add
        .text(width / 2, 205, '🎉 New Personal Best!', {
          fontSize: '16px',
          fontFamily: 'Poppins, sans-serif',
          color: '#FFC832',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    // Leaderboard
    this.add
      .text(width / 2, 250, 'Session Scores:', {
        fontSize: '16px',
        fontFamily: 'Poppins, sans-serif',
        color: '#6b7280',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    state.leaderboardScores.slice(0, 5).forEach((entry, i) => {
      this.add
        .text(
          width / 2,
          280 + i * 26,
          `${i + 1}. ${entry.gameScore} pts  (${entry.difficulty})`,
          {
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif',
            color: '#4b5563',
          }
        )
        .setOrigin(0.5);
    });

    // Buttons
    this.makeButton(width / 2 - 130, height - 80, 'Play Again', () => {
      this.scene.start('MenuScene');
    });

    this.makeButton(width / 2 + 130, height - 80, 'New Card', () => {
      resetSession();
      this.scene.start('MenuScene');
    });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const btn = this.add
      .rectangle(x, y, 200, 48, 0x006464)
      .setInteractive({ cursor: 'pointer' });
    this.add
      .text(x, y, label, {
        fontSize: '16px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    btn.on('pointerup', onClick);
    btn.on('pointerover', () => btn.setAlpha(0.85));
    btn.on('pointerout', () => btn.setAlpha(1));
  }
}
