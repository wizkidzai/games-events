import Phaser from 'phaser';
import { getState } from '../systems/gameState';

const MASCOT_EMOJIS = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];
const MASCOT_NAMES = [
  'Peacock Pride', 'Orchid Mantis', 'Red Fox',
  'Green Frog', 'Yellow Fawn', 'Blue Jay',
];

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const state = getState();
    const emoji = MASCOT_EMOJIS[state.selectedMascotID] ?? '🦚';
    const isNewBest =
      state.score > 0 &&
      state.score === state.highScore &&
      state.leaderboard.length > 1;

    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.drawBackground(width, height);

    // Central panel
    const panelW = 560;
    const panelH = 360;
    const panelX = width / 2 - panelW / 2;
    const panelY = height / 2 - panelH / 2 - 24;
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x111128, 0.88);
    panelGfx.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    panelGfx.lineStyle(1.5, 0x2a2a50, 0.9);
    panelGfx.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);

    // Title
    this.add
      .text(width / 2, panelY + 48, `${emoji}  GAME OVER`, {
        fontSize: '36px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ff5555',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Score
    this.add
      .text(width / 2, panelY + 98, `SCORE  ${state.score}`, {
        fontSize: '30px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffc832',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, panelY + 133, `BEST  ${state.highScore}`, {
        fontSize: '16px',
        fontFamily: 'Poppins, sans-serif',
        color: '#8ab4f8',
      })
      .setOrigin(0.5);

    if (isNewBest) {
      this.add
        .text(width / 2, panelY + 158, '✦  New Personal Best!  ✦', {
          fontSize: '14px',
          fontFamily: 'Poppins, sans-serif',
          color: '#ffc832',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    // Leaderboard
    const dividerY = isNewBest ? panelY + 178 : panelY + 163;
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, 0x2a2a50, 0.8);
    divGfx.lineBetween(panelX + 24, dividerY, panelX + panelW - 24, dividerY);

    this.add
      .text(width / 2, dividerY + 14, 'SESSION LEADERBOARD', {
        fontSize: '11px',
        fontFamily: 'Poppins, sans-serif',
        color: '#40405a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    const lbStartY = dividerY + 34;
    state.leaderboard.slice(0, 5).forEach((entry, i) => {
      const name = MASCOT_NAMES[entry.mascotID] ?? 'Runner';
      const rowColor = i === 0 ? '#ffc832' : '#c0c4d8';
      this.add
        .text(
          width / 2,
          lbStartY + i * 26,
          `${medals[i]}  ${entry.score}  •  ${name}  •  ${entry.difficulty}`,
          {
            fontSize: '13px',
            fontFamily: 'Poppins, sans-serif',
            color: rowColor,
          }
        )
        .setOrigin(0.5);
    });

    // Pulsing "PRESS ENTER" prompt (only way to proceed — no buttons)
    const prompt = this.add
      .text(width / 2, height - 48, '● PRESS ENTER FOR NEW GAME ●', {
        fontSize: '20px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffc832',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.22,
      duration: 700,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    // Enter (big booth button) → back to MenuScene so mascot cycles again
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('MenuScene'));
  }

  private drawBackground(width: number, height: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x080812, 1);
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      g.fillStyle(0xffffff, 0.15 + Math.random() * 0.45);
      g.fillCircle(x, y, Math.random() < 0.15 ? 1.5 : 0.8);
    }
  }
}
