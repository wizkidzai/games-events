import Phaser from 'phaser';
import { addPoints, endGame, getState, nextRound } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const GAME_W = 900;
const GAME_H = 600;

const MASCOT_TILES = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];
const TILE_COLORS  = [0x006464, 0xa30078, 0xff4747, 0x43a277, 0xffc832, 0x0aa4eb];
const TILE_NAMES   = ['Peacock', 'Mantis', 'Fox', 'Frog', 'Fawn', 'Blue Jay'];

const TILE_W  = 130;
const TILE_H  = 130;
const GAP_X   = 18;
const GAP_Y   = 18;
const GRID_W  = 3 * TILE_W + 2 * GAP_X; // 426
const GRID_L  = (GAME_W - GRID_W) / 2;  // 237
const GRID_T  = 148;

type Phase = 'watching' | 'inputting' | 'feedback';

export class GameScene extends Phaser.Scene {
  private isDark = true;

  private tileGfx: Phaser.GameObjects.Graphics[] = [];
  private tileBorderGfx: Phaser.GameObjects.Graphics[] = [];
  private tileLabels: Phaser.GameObjects.Text[] = [];

  private phase: Phase = 'watching';
  private cursorIdx = 0;

  private playerPos = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private progressDots: Phaser.GameObjects.Graphics[] = [];

  constructor() { super({ key: 'GameScene' }); }

  private tileCX(i: number): number { return GRID_L + (i % 3) * (TILE_W + GAP_X) + TILE_W / 2; }
  private tileCY(i: number): number { return GRID_T + Math.floor(i / 3) * (TILE_H + GAP_Y) + TILE_H / 2; }
  private get dimAlpha(): number { return this.isDark ? 0.28 : 0.20; }

  create(): void {
    this.isDark = resolveTheme() === 'dark';

    this.tileGfx = [];
    this.tileBorderGfx = [];
    this.tileLabels = [];
    this.progressDots = [];
    this.playerPos = 0;
    this.cursorIdx = 0;
    this.phase = 'watching';

    this.cameras.main.setBackgroundColor(this.isDark ? '#12122a' : '#cce0f8');
    this.drawBackground();
    this.buildTiles();
    this.buildHUD();
    this.buildProgressDots();
    this.buildPhaseLabel();

    // Primary: 3x big buttons — Left, Right, Enter
    this.input.keyboard?.on('keydown-LEFT',  () => this.moveCursor(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveCursor(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.onEnter());
    // Fallback: keyboard (same keys) — already handled above
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));

    this.time.delayedCall(500, () => this.playSequence());

    addThemeToggle(this, this.isDark);
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    if (this.isDark) {
      const bands = [
        { y: 0,   h: 80,          c: 0x08081a },
        { y: 80,  h: 440,         c: 0x0d0d24 },
        { y: 520, h: GAME_H - 520, c: 0x080818 },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, GAME_W, b.h); }
      for (let i = 0; i < 55; i++) {
        g.fillStyle(0xffffff, 0.10 + Math.random() * 0.28);
        g.fillCircle(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, 72), Math.random() < 0.15 ? 1.4 : 0.7);
      }
      g.fillStyle(0xfffce8, 0.82); g.fillCircle(GAME_W - 70, 36, 20);
      g.fillStyle(0x08081a, 1);    g.fillCircle(GAME_W - 60, 31, 16);
    } else {
      const bands = [
        { y: 0,   h: 80,          c: 0xb8d4f0 },
        { y: 80,  h: 440,         c: 0xcce0f8 },
        { y: 520, h: GAME_H - 520, c: 0xdce8ff },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, GAME_W, b.h); }
      g.fillStyle(0xffd700, 0.85); g.fillCircle(GAME_W - 70, 36, 22);
      g.fillStyle(0xffe870, 0.4);  g.fillCircle(GAME_W - 70, 36, 33);
      g.fillStyle(0xffffff, 0.75);
      [[80, 16, 90, 18], [270, 28, 110, 20]].forEach(
        ([x, y, w, h]) => { g.fillRoundedRect(x, y, w, h, 9); g.fillRoundedRect(x + w * 0.12, y - 10, w * 0.6, h - 4, 8); }
      );
    }
  }

  private buildTiles(): void {
    const nameColor = this.isDark ? '#7080a0' : '#5070a0';
    for (let i = 0; i < 6; i++) {
      const cx = this.tileCX(i);
      const cy = this.tileCY(i);

      const gfx = this.add.graphics();
      gfx.fillStyle(TILE_COLORS[i], this.dimAlpha);
      gfx.fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
      this.tileGfx.push(gfx);

      this.tileBorderGfx.push(this.add.graphics());

      this.tileLabels.push(
        this.add.text(cx, cy - 16, MASCOT_TILES[i], { fontSize: '42px' }).setOrigin(0.5)
      );

      this.add.text(cx, cy + 38, TILE_NAMES[i], {
        fontSize: '11px', fontFamily: 'Poppins, sans-serif', color: nameColor,
      }).setOrigin(0.5);
    }
  }

  private buildHUD(): void {
    const state     = getState();
    const textScore = this.isDark ? '#ffffff' : '#1a1a2e';
    const textRound = this.isDark ? '#ffc832' : '#c07000';
    const badgeText = this.isDark ? '#8ab4f8' : '#2a4a80';
    const hudColor  = this.isDark ? 0x000000 : 0xffffff;
    const hudAlpha  = this.isDark ? 0.5 : 0.78;

    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(hudColor, hudAlpha);
    panel.fillRoundedRect(GAME_W - 168, 8, 156, 68, 12);

    this.scoreText = this.add.text(GAME_W - 18, 26, `SCORE: ${state.gameScore}`, {
      fontSize: '15px', fontFamily: 'Poppins, sans-serif', color: textScore, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.roundText = this.add.text(GAME_W - 18, 56, 'ROUND: 1 / 3', {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: textRound,
    }).setOrigin(1, 0.5).setDepth(11);

    const badge = this.add.graphics().setDepth(10);
    badge.fillStyle(hudColor, hudAlpha);
    badge.fillRoundedRect(9, 8, 90, 36, 10);
    this.add.text(18, 26, 'MEDIUM', {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: badgeText, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);
  }

  private buildPhaseLabel(): void {
    const phaseBg = this.isDark ? 0x000000 : 0xffffff;
    const bg = this.add.graphics().setDepth(9);
    bg.fillStyle(phaseBg, this.isDark ? 0.45 : 0.72);
    bg.fillRoundedRect(GAME_W / 2 - 160, 92, 320, 40, 10);

    this.phaseText = this.add.text(GAME_W / 2, 112, '👀  WATCH THE SEQUENCE', {
      fontSize: '16px', fontFamily: 'Poppins, sans-serif',
      color: this.isDark ? '#8ab4f8' : '#2a4a80', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  private buildProgressDots(): void {
    const seq = getState().sequence;
    const total = seq.length;
    const spacing = 20;
    const startX = GAME_W / 2 - ((total - 1) * spacing) / 2;
    const emptyColor = this.isDark ? 0x303060 : 0xb0c8e8;
    for (let i = 0; i < total; i++) {
      const dot = this.add.graphics().setDepth(10);
      dot.fillStyle(emptyColor, 1);
      dot.fillCircle(startX + i * spacing, GAME_H - 28, 6);
      this.progressDots.push(dot);
    }
  }

  private updateProgressDots(filled: number): void {
    const seq = getState().sequence;
    const spacing = 20;
    const startX = GAME_W / 2 - ((seq.length - 1) * spacing) / 2;
    const emptyColor = this.isDark ? 0x303060 : 0xb0c8e8;
    this.progressDots.forEach((dot, i) => {
      dot.clear();
      dot.fillStyle(i < filled ? 0xa30078 : emptyColor, 1);
      dot.fillCircle(startX + i * spacing, GAME_H - 28, 6);
    });
  }

  private dimAllTiles(): void {
    for (let i = 0; i < 6; i++) {
      const cx = this.tileCX(i), cy = this.tileCY(i);
      this.tileGfx[i].clear();
      this.tileGfx[i].fillStyle(TILE_COLORS[i], this.dimAlpha);
      this.tileGfx[i].fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
      this.tileBorderGfx[i].clear();
      this.tileLabels[i].setAlpha(0.5);
    }
  }

  private highlightTile(i: number, alpha = 1.0): void {
    const cx = this.tileCX(i), cy = this.tileCY(i);
    this.tileGfx[i].clear();
    this.tileGfx[i].fillStyle(TILE_COLORS[i], alpha);
    this.tileGfx[i].fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
    this.tileLabels[i].setAlpha(1);
  }

  private setCursorBorder(i: number, color: number, alpha: number): void {
    const cx = this.tileCX(i), cy = this.tileCY(i);
    this.tileBorderGfx[i].clear();
    this.tileBorderGfx[i].lineStyle(4, color, alpha);
    this.tileBorderGfx[i].strokeRoundedRect(cx - TILE_W / 2 - 3, cy - TILE_H / 2 - 3, TILE_W + 6, TILE_H + 6, 18);
  }

  private playSequence(): void {
    this.phase = 'watching';
    this.phaseText.setText('👀  WATCH THE SEQUENCE').setColor(this.isDark ? '#8ab4f8' : '#2a4a80');
    this.dimAllTiles();

    const seq = getState().sequence;
    seq.forEach((tileIdx, step) => {
      this.time.delayedCall(step * 850 + 200, () => {
        this.dimAllTiles();
        this.highlightTile(tileIdx, 0.95);
        this.setCursorBorder(tileIdx, 0xffffff, 0.9);
        this.tweens.add({ targets: this.tileLabels[tileIdx], scaleX: 1.18, scaleY: 1.18, duration: 120, yoyo: true });
      });
      this.time.delayedCall(step * 850 + 680, () => this.dimAllTiles());
    });

    this.time.delayedCall(seq.length * 850 + 850, () => this.startInputPhase());
  }

  private startInputPhase(): void {
    this.phase = 'inputting';
    this.playerPos = 0;
    this.cursorIdx = 0;

    const phaseColor = this.isDark ? '#ffc832' : '#c07000';
    this.phaseText.setText('🎯  ← → NAVIGATE  ·  ENTER SELECT').setColor(phaseColor);
    this.dimAllTiles();
    this.updateCursorVisual();
  }

  // Move the cursor with the Left / Right big buttons
  private moveCursor(dir: -1 | 1): void {
    if (this.phase !== 'inputting') return;

    const prev = this.cursorIdx;
    const cx0 = this.tileCX(prev), cy0 = this.tileCY(prev);
    this.tileGfx[prev].clear();
    this.tileGfx[prev].fillStyle(TILE_COLORS[prev], this.dimAlpha);
    this.tileGfx[prev].fillRoundedRect(cx0 - TILE_W / 2, cy0 - TILE_H / 2, TILE_W, TILE_H, 16);
    this.tileBorderGfx[prev].clear();
    this.tileLabels[prev].setAlpha(0.5);

    this.cursorIdx = (this.cursorIdx + dir + 6) % 6;
    this.updateCursorVisual();
  }

  private updateCursorVisual(): void {
    const i = this.cursorIdx;
    this.highlightTile(i, this.isDark ? 0.72 : 0.80);
    this.setCursorBorder(i, this.isDark ? 0xffffff : 0x1a3a80, 0.95);
  }

  private onEnter(): void {
    if (this.phase !== 'inputting') return;

    const { sequence } = getState();
    const expected = sequence[this.playerPos];
    const chosen   = this.cursorIdx;

    this.phase = 'feedback';

    if (chosen === expected) {
      this.onCorrect(chosen);
    } else {
      this.onWrong(chosen);
    }
  }

  private onCorrect(tileIdx: number): void {
    const cx = this.tileCX(tileIdx), cy = this.tileCY(tileIdx);
    const overlay = this.add.graphics().setDepth(6);
    overlay.fillStyle(0x43a277, 0.65);
    overlay.fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
    this.tweens.add({ targets: overlay, alpha: 0, duration: 380, onComplete: () => overlay.destroy() });

    this.playerPos++;
    this.updateProgressDots(this.playerPos);

    const { sequence } = getState();
    if (this.playerPos >= sequence.length) {
      const points = sequence.length * 50;
      addPoints(points);
      this.scoreText.setText(`SCORE: ${getState().gameScore}`);

      const label = this.add.text(cx, cy - 20, `+${points}`, {
        fontSize: '24px', fontFamily: 'Poppins, sans-serif', color: '#43a277', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: label, y: label.y - 60, alpha: 0, duration: 900, ease: 'Power2.Out', onComplete: () => label.destroy() });

      nextRound();
      const newState = getState();
      this.time.delayedCall(1000, () => {
        if (newState.currentRound >= 3) {
          endGame(true);
          this.scene.start('GameOverScene');
        } else {
          this.roundText.setText(`ROUND: ${newState.currentRound + 1} / 3`);
          this.updateProgressDots(0);
          this.playSequence();
        }
      });
    } else {
      // More tiles to select — re-enter input phase with cursor at same position
      this.time.delayedCall(220, () => {
        this.phase = 'inputting';
        this.updateCursorVisual();
      });
    }
  }

  private onWrong(tileIdx: number): void {
    const cx = this.tileCX(tileIdx), cy = this.tileCY(tileIdx);
    const overlay = this.add.graphics().setDepth(6);
    overlay.fillStyle(0xff4747, 0.75);
    overlay.fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
    this.tweens.add({ targets: overlay, alpha: 0, duration: 600, onComplete: () => overlay.destroy() });

    this.phaseText.setText('✗  WRONG — GAME OVER').setColor('#ff5555');

    this.time.delayedCall(1100, () => {
      endGame(false);
      this.scene.start('GameOverScene');
    });
  }

  shutdown(): void {
    this.tileGfx = [];
    this.tileBorderGfx = [];
    this.tileLabels = [];
    this.progressDots = [];
  }
}
