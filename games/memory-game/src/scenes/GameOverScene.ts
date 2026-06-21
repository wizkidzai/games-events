import Phaser from 'phaser';
import { getState } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(): void {
    const { width, height } = this.scale;
    const isDark = resolveTheme() === 'dark';
    const state  = getState();
    const won    = !state.isGameOver;
    const isNewBest = state.gameScore > 0 && state.totalScore > state.cardScorePrevious;

    const textPrimary   = isDark ? '#ffffff' : '#1a1a2e';
    const textSecondary = isDark ? '#8ab4f8' : '#2a4a80';
    const textMuted     = isDark ? '#40405a' : '#7090b0';
    const textGold      = isDark ? '#ffc832' : '#c07000';
    const panelBg       = isDark ? 0x111128 : 0xffffff;
    const panelAlpha    = isDark ? 0.88 : 0.94;
    const panelBorder   = isDark ? 0x2a2a50 : 0xb0c8e8;
    const divider       = isDark ? 0x2a2a50 : 0xb0c8e8;
    const promptColor   = isDark ? '#ffc832' : '#c07000';

    this.cameras.main.setBackgroundColor(isDark ? '#0d0d1a' : '#cce0f8');
    this.drawBackground(width, height, isDark);

    const panelW = 560, panelH = 350;
    const panelX = width / 2 - panelW / 2, panelY = height / 2 - panelH / 2 - 20;
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(panelBg, panelAlpha);
    panelGfx.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    panelGfx.lineStyle(1.5, panelBorder, 0.9);
    panelGfx.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);

    this.add.text(width / 2, panelY + 48, won ? '🧠  AMAZING MEMORY!' : '🦋  SO CLOSE!', {
      fontSize: '34px', fontFamily: 'Poppins, sans-serif',
      color: won ? textGold : '#ff5555', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 96, `SCORE  ${state.gameScore}`, {
      fontSize: '30px', fontFamily: 'Poppins, sans-serif', color: textPrimary, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 131, `TOTAL  ${state.totalScore}`, {
      fontSize: '16px', fontFamily: 'Poppins, sans-serif', color: textSecondary,
    }).setOrigin(0.5);

    if (isNewBest) {
      this.add.text(width / 2, panelY + 158, '✦  New Personal Best!  ✦', {
        fontSize: '14px', fontFamily: 'Poppins, sans-serif', color: textGold, fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    const dividerY = isNewBest ? panelY + 178 : panelY + 163;
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, divider, 0.8);
    divGfx.lineBetween(panelX + 24, dividerY, panelX + panelW - 24, dividerY);

    this.add.text(width / 2, dividerY + 14, 'SESSION LEADERBOARD', {
      fontSize: '11px', fontFamily: 'Poppins, sans-serif', color: textMuted, fontStyle: 'bold',
    }).setOrigin(0.5);

    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    state.leaderboardScores.slice(0, 5).forEach((entry, i) => {
      this.add.text(width / 2, dividerY + 34 + i * 26,
        `${medals[i]}  ${entry.gameScore} pts  •  ${entry.difficulty}`, {
          fontSize: '13px', fontFamily: 'Poppins, sans-serif',
          color: i === 0 ? textGold : textPrimary,
        }
      ).setOrigin(0.5);
    });

    const prompt = this.add.text(width / 2, height - 48, '● TAP OR PRESS ENTER FOR NEW GAME ●', {
      fontSize: '20px', fontFamily: 'Poppins, sans-serif', color: promptColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.22, duration: 700, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('MenuScene'));
    this.input.once('pointerdown', () => this.scene.start('MenuScene'));

    addThemeToggle(this, isDark);
  }

  private drawBackground(width: number, height: number, isDark: boolean): void {
    const g = this.add.graphics();
    if (isDark) {
      g.fillStyle(0x080812, 1); g.fillRect(0, 0, width, height);
      for (let i = 0; i < 70; i++) {
        g.fillStyle(0xffffff, 0.15 + Math.random() * 0.45);
        g.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Math.random() < 0.15 ? 1.5 : 0.8);
      }
    } else {
      const bands = [{ y: 0, h: height / 2, c: 0xb8d4f0 }, { y: height / 2, h: height / 2, c: 0xcce0f8 }];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, width, b.h); }
      g.fillStyle(0xffd700, 0.85); g.fillCircle(width - 70, 50, 26);
      g.fillStyle(0xffe870, 0.4);  g.fillCircle(width - 70, 50, 38);
    }
  }
}
