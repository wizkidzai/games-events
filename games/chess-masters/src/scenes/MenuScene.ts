import Phaser from 'phaser';
import { getMascotByID } from '@wizkidz/mascot-system';
import { setDifficulty, startGame } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const MASCOT_ID    = 0;
const MASCOT_COLOR = 0x006464;
const MASCOT_EMOJI = '🦚';

export class MenuScene extends Phaser.Scene {
  private hasLaunched = false;

  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    const { width, height } = this.scale;
    this.hasLaunched = false;
    const isDark = resolveTheme() === 'dark';

    const textPrimary   = isDark ? '#ffffff' : '#1a1a2e';
    const textSecondary = isDark ? '#8ab4f8' : '#2a4a80';
    const textMuted     = isDark ? '#9090b8' : '#4a6080';
    const textAccent    = isDark ? '#ffc832' : '#c07000';
    const promptColor   = isDark ? '#ffc832' : '#c07000';

    this.cameras.main.setBackgroundColor(isDark ? '#0d0d1a' : '#cce0f8');
    this.drawBackground(width, height, isDark);

    this.add.text(width / 2, height * 0.09, 'CHESS MASTERS', {
      fontSize: `${Math.round(Math.min(44, width * 0.055))}px`,
      fontFamily: 'Poppins, sans-serif', color: textPrimary, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.17, 'Wiz Kidz Conference  ✦  Tap pieces · Fewest moves · Beat your score', {
      fontSize: `${Math.round(Math.min(13, width * 0.016))}px`,
      fontFamily: 'Poppins, sans-serif', color: textAccent,
    }).setOrigin(0.5);

    // Mascot card — centred, dimensions proportional to viewport
    const cardW  = Math.min(130, Math.round(width * 0.16));
    const cardH  = Math.round(cardW * 0.92);
    const cardCX = width / 2;
    const cardCY = height * 0.42;
    const radius = Math.round(cardW * 0.11);

    const cardGfx = this.add.graphics();
    cardGfx.fillStyle(MASCOT_COLOR, 0.72);
    cardGfx.fillRoundedRect(cardCX - cardW / 2, cardCY - cardH / 2, cardW, cardH, radius);

    this.add.text(cardCX, cardCY - cardH * 0.13, MASCOT_EMOJI, {
      fontSize: `${Math.round(cardW * 0.31)}px`,
    }).setOrigin(0.5);
    this.add.text(cardCX, cardCY + cardH * 0.25, getMascotByID(MASCOT_ID).name.split(' ')[0], {
      fontSize: `${Math.round(Math.max(10, cardW * 0.095))}px`,
      fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const outerColor = isDark ? 0xffffff : 0x1a3a80;
    const outerAlpha = isDark ? 0.14 : 0.2;
    const borderGfx = this.add.graphics();
    borderGfx.lineStyle(6, outerColor, outerAlpha);
    borderGfx.strokeRoundedRect(cardCX - cardW / 2 - 5, cardCY - cardH / 2 - 5, cardW + 10, cardH + 10, radius + 4);
    borderGfx.lineStyle(2.5, isDark ? 0xffffff : 0x1a3a80, 0.95);
    borderGfx.strokeRoundedRect(cardCX - cardW / 2 - 2, cardCY - cardH / 2 - 2, cardW + 4, cardH + 4, radius + 2);

    this.add.text(width / 2, height * 0.62, getMascotByID(MASCOT_ID).name, {
      fontSize: `${Math.round(Math.min(22, height * 0.040))}px`,
      fontFamily: 'Poppins, sans-serif', color: '#006464', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.71, 'Solve the chess puzzle in the fewest moves possible', {
      fontSize: `${Math.round(Math.min(14, width * 0.017))}px`,
      fontFamily: 'Poppins, sans-serif', color: textSecondary,
    }).setOrigin(0.5);

    const enterText = this.add.text(width / 2, height * 0.80, '● TAP THE BOARD OR PRESS ENTER ●', {
      fontSize: `${Math.round(Math.min(20, height * 0.037))}px`,
      fontFamily: 'Poppins, sans-serif', color: promptColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: enterText, alpha: 0.25, duration: 700, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

    this.add.text(width / 2, height - 18, 'Medium difficulty — 10 moves to score as high as possible', {
      fontSize: `${Math.round(Math.min(11, width * 0.014))}px`,
      fontFamily: 'Poppins, sans-serif', color: textMuted,
    }).setOrigin(0.5);

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y > height - 40) return;
      this.launchGame();
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.launchGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.launchGame());

    this.scale.once('resize', () => { if (!this.hasLaunched) this.scene.restart(); }, this);

    addThemeToggle(this, isDark);
  }

  private drawBackground(width: number, height: number, isDark: boolean): void {
    const g = this.add.graphics();
    const s1 = height * 0.28, s2 = height * 0.60;
    if (isDark) {
      for (const b of [
        { y: 0,  h: s1,          c: 0x06060f },
        { y: s1, h: s2 - s1,     c: 0x0b0b1e },
        { y: s2, h: height - s2, c: 0x101028 },
      ]) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, width, b.h); }
      for (let i = 0; i < 110; i++) {
        g.fillStyle(0xffffff, 0.18 + Math.random() * 0.6);
        g.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
          Math.random() < 0.08 ? 2 : Math.random() < 0.25 ? 1.3 : 0.7);
      }
      g.fillStyle(0xfffce8, 0.88); g.fillCircle(width - 95, 58, 26);
      g.fillStyle(0x06060f, 1);    g.fillCircle(width - 82, 52, 21);
    } else {
      for (const b of [
        { y: 0,  h: s1,          c: 0xb8d4f0 },
        { y: s1, h: s2 - s1,     c: 0xcce0f8 },
        { y: s2, h: height - s2, c: 0xdce8ff },
      ]) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, width, b.h); }
      g.fillStyle(0xffd700, 0.9); g.fillCircle(width - 95, 58, 30);
      g.fillStyle(0xffe870, 0.4); g.fillCircle(width - 95, 58, 44);
      g.fillStyle(0xffffff, 0.85);
      [[90, 32, 110, 22], [340, 55, 130, 24], [610, 28, 115, 22]].forEach(
        ([x, y, w, h]) => { g.fillRoundedRect(x, y, w, h, 11); g.fillRoundedRect(x + w * 0.12, y - 12, w * 0.6, h - 4, 9); }
      );
    }
  }

  private launchGame(): void {
    if (this.hasLaunched) return;
    this.hasLaunched = true;
    setDifficulty('medium');
    startGame();
    this.scene.start('GameScene');
  }
}
