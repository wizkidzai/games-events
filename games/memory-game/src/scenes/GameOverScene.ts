import Phaser from 'phaser';
import { getState } from '../systems/gameState';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(): void {
    const { width, height } = this.scale;
    const state = getState();
    const won = !state.isGameOver;
    const isNewBest = state.gameScore > 0 && state.totalScore > state.cardScorePrevious;

    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.drawBackground(width, height);

    const panelW = 560;
    const panelH = 350;
    const panelX = width / 2 - panelW / 2;
    const panelY = height / 2 - panelH / 2 - 20;

    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x111128, 0.88);
    panelGfx.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    panelGfx.lineStyle(1.5, 0x2a2a50, 0.9);
    panelGfx.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);

    this.add.text(width / 2, panelY + 48, won ? '🧠  AMAZING MEMORY!' : '🦋  SO CLOSE!', {
      fontSize: '34px', fontFamily: 'Poppins, sans-serif',
      color: won ? '#ffc832' : '#ff5555', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 96, `SCORE  ${state.gameScore}`, {
      fontSize: '30px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 131, `TOTAL  ${state.totalScore}`, {
      fontSize: '16px', fontFamily: 'Poppins, sans-serif', color: '#8ab4f8',
    }).setOrigin(0.5);

    if (isNewBest) {
      this.add.text(width / 2, panelY + 158, '✦  New Personal Best!  ✦', {
        fontSize: '14px', fontFamily: 'Poppins, sans-serif', color: '#ffc832', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    const dividerY = isNewBest ? panelY + 178 : panelY + 163;
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, 0x2a2a50, 0.8);
    divGfx.lineBetween(panelX + 24, dividerY, panelX + panelW - 24, dividerY);

    this.add.text(width / 2, dividerY + 14, 'SESSION LEADERBOARD', {
      fontSize: '11px', fontFamily: 'Poppins, sans-serif', color: '#40405a', fontStyle: 'bold',
    }).setOrigin(0.5);

    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    state.leaderboardScores.slice(0, 5).forEach((entry, i) => {
      this.add.text(
        width / 2,
        dividerY + 34 + i * 26,
        `${medals[i]}  ${entry.gameScore} pts  •  ${entry.difficulty}`,
        {
          fontSize: '13px', fontFamily: 'Poppins, sans-serif',
          color: i === 0 ? '#ffc832' : '#c0c4d8',
        }
      ).setOrigin(0.5);
    });

    const prompt = this.add.text(width / 2, height - 48, '● PRESS ENTER FOR NEW GAME ●', {
      fontSize: '20px', fontFamily: 'Poppins, sans-serif', color: '#ffc832', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.22, duration: 700, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('MenuScene'));
  }

  private drawBackground(width: number, height: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x080812, 1);
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < 70; i++) {
      g.fillStyle(0xffffff, 0.15 + Math.random() * 0.45);
      g.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Math.random() < 0.15 ? 1.5 : 0.8);
    }
  }
}
