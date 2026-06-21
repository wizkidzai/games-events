import Phaser from 'phaser';
import { setDifficulty, startGame } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const MASCOT_EMOJIS = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];
const MASCOT_COLORS = [0x006464, 0xa30078, 0xff4747, 0x43a277, 0xffc832, 0x0aa4eb];
const MASCOT_NAMES  = ['Peacock', 'Mantis', 'Fox', 'Frog', 'Fawn', 'Jay'];

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

    this.add.text(width / 2, height * 0.09, 'MEMORY GAME', {
      fontSize: `${Math.round(Math.min(44, width * 0.055))}px`,
      fontFamily: 'Poppins, sans-serif', color: textPrimary, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.17, 'Wiz Kidz  ✦  Watch the sequence · Tap a tile or navigate to select', {
      fontSize: `${Math.round(Math.min(13, width * 0.016))}px`,
      fontFamily: 'Poppins, sans-serif', color: textAccent,
    }).setOrigin(0.5);

    // Mascot card row — 6 cards filling the full width
    const gap   = Math.max(8, Math.round(width * 0.012));
    const cardW = Math.min(90, Math.floor((width - 40 - 5 * gap) / 6));
    const cardH = Math.round(cardW * 0.91);
    const rowW  = 6 * cardW + 5 * gap;
    const rowX  = (width - rowW) / 2;
    const rowY  = height * 0.30;
    const r     = Math.round(cardW * 0.13);
    const emojiFs = Math.round(cardW * 0.31);
    const nameFs  = Math.max(8, Math.round(cardW * 0.12));

    for (let i = 0; i < 6; i++) {
      const cx = rowX + i * (cardW + gap) + cardW / 2;
      const cy = rowY + cardH / 2;
      const gfx = this.add.graphics();
      gfx.fillStyle(MASCOT_COLORS[i], isDark ? 0.72 : 0.65);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, r);
      this.add.text(cx, cy - cardH * 0.13, MASCOT_EMOJIS[i], { fontSize: `${emojiFs}px` }).setOrigin(0.5);
      this.add.text(cx, cy + cardH * 0.32, MASCOT_NAMES[i], {
        fontSize: `${nameFs}px`, fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, rowY + cardH + height * 0.04, 'Memorize sequences of these 6 mascot tiles', {
      fontSize: `${Math.round(Math.min(13, width * 0.016))}px`,
      fontFamily: 'Poppins, sans-serif', color: textSecondary,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.63, 'Tap a tile · or ← → to navigate then ENTER · Beat your score!', {
      fontSize: `${Math.round(Math.min(14, width * 0.017))}px`,
      fontFamily: 'Poppins, sans-serif', color: textSecondary,
    }).setOrigin(0.5);

    const enterText = this.add.text(width / 2, height * 0.73, '● TAP OR PRESS ENTER TO START ●', {
      fontSize: `${Math.round(Math.min(20, height * 0.037))}px`,
      fontFamily: 'Poppins, sans-serif', color: promptColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: enterText, alpha: 0.25, duration: 700, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

    this.add.text(width / 2, height - 18, 'Tap any tile to select  ·  or ← → to navigate then ENTER', {
      fontSize: `${Math.round(Math.min(11, width * 0.014))}px`,
      fontFamily: 'Poppins, sans-serif', color: textMuted,
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-ENTER', () => this.launchGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.launchGame());
    this.input.on('pointerdown', () => this.launchGame());

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
