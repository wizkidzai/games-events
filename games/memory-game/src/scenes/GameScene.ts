import Phaser from 'phaser';
import { addPoints, endGame, getState, nextRound } from '../systems/gameState';

const GAME_W = 900;
const GAME_H = 600;

const MASCOT_TILES  = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];
const TILE_COLORS   = [0x006464, 0xa30078, 0xff4747, 0x43a277, 0xffc832, 0x0aa4eb];
const TILE_NAMES    = ['Peacock', 'Mantis', 'Fox', 'Frog', 'Fawn', 'Blue Jay'];

// Grid: 3 columns × 2 rows, each tile 130×130 with 18px gap
const TILE_W  = 130;
const TILE_H  = 130;
const GAP_X   = 18;
const GAP_Y   = 18;
const GRID_W  = 3 * TILE_W + 2 * GAP_X;       // 426
const GRID_H  = 2 * TILE_H + GAP_Y;            // 278
const GRID_L  = (GAME_W - GRID_W) / 2;         // 237
const GRID_T  = 148;                            // below HUD + phase label

// Cursor speed (ms per tile step) per round — gets faster each round
const CURSOR_SPEEDS = [700, 520, 390];

type Phase = 'watching' | 'inputting' | 'feedback';

export class GameScene extends Phaser.Scene {
  private tileGfx: Phaser.GameObjects.Graphics[] = [];
  private tileBorderGfx: Phaser.GameObjects.Graphics[] = [];
  private tileLabels: Phaser.GameObjects.Text[] = [];

  private phase: Phase = 'watching';
  private cursorIdx = 0;
  private cursorTimer!: Phaser.Time.TimerEvent;

  private playerPos = 0;     // how many tiles correctly selected this round
  private scoreText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private progressDots: Phaser.GameObjects.Graphics[] = [];

  constructor() { super({ key: 'GameScene' }); }

  // ─── tile coordinate helpers ──────────────────────────────────────────────

  private tileCX(i: number): number { return GRID_L + (i % 3) * (TILE_W + GAP_X) + TILE_W / 2; }
  private tileCY(i: number): number { return GRID_T + Math.floor(i / 3) * (TILE_H + GAP_Y) + TILE_H / 2; }

  // ─── create ───────────────────────────────────────────────────────────────

  create(): void {
    this.tileGfx = [];
    this.tileBorderGfx = [];
    this.tileLabels = [];
    this.progressDots = [];
    this.playerPos = 0;
    this.cursorIdx = 0;
    this.phase = 'watching';

    this.cameras.main.setBackgroundColor('#12122a');
    this.drawBackground();
    this.buildTiles();
    this.buildHUD();
    this.buildProgressDots();
    this.buildPhaseLabel();

    // Keyboard (Enter / Space both accepted — both go through the same handler)
    this.input.keyboard?.on('keydown-ENTER', () => this.onEnter());
    this.input.keyboard?.on('keydown-SPACE', () => this.onEnter());
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));

    // Start sequence playback after a short delay
    this.time.delayedCall(500, () => this.playSequence());
  }

  // ─── background ───────────────────────────────────────────────────────────

  private drawBackground(): void {
    const g = this.add.graphics();
    const bands = [
      { y: 0,   h: 80,        c: 0x08081a },
      { y: 80,  h: 440,       c: 0x0d0d24 },
      { y: 520, h: GAME_H-520, c: 0x080818 },
    ];
    for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, GAME_W, b.h); }
    for (let i = 0; i < 55; i++) {
      g.fillStyle(0xffffff, 0.10 + Math.random() * 0.28);
      g.fillCircle(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, 72), Math.random() < 0.15 ? 1.4 : 0.7);
    }
    g.fillStyle(0xfffce8, 0.82); g.fillCircle(GAME_W - 70, 36, 20);
    g.fillStyle(0x08081a, 1);    g.fillCircle(GAME_W - 60, 31, 16);
  }

  // ─── tile grid ────────────────────────────────────────────────────────────

  private buildTiles(): void {
    for (let i = 0; i < 6; i++) {
      const cx = this.tileCX(i);
      const cy = this.tileCY(i);

      // Background fill
      const gfx = this.add.graphics();
      gfx.fillStyle(TILE_COLORS[i], 0.28);
      gfx.fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
      this.tileGfx.push(gfx);

      // Border (used for cursor highlight)
      const border = this.add.graphics();
      this.tileBorderGfx.push(border);

      // Emoji
      this.tileLabels.push(
        this.add.text(cx, cy - 16, MASCOT_TILES[i], { fontSize: '42px' }).setOrigin(0.5)
      );

      // Name label
      this.add.text(cx, cy + 38, TILE_NAMES[i], {
        fontSize: '11px', fontFamily: 'Poppins, sans-serif', color: '#7080a0',
      }).setOrigin(0.5);
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private buildHUD(): void {
    const state = getState();

    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(0x000000, 0.5);
    panel.fillRoundedRect(GAME_W - 168, 8, 156, 68, 12);

    this.scoreText = this.add.text(GAME_W - 18, 26, `SCORE: ${state.gameScore}`, {
      fontSize: '15px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.roundText = this.add.text(GAME_W - 18, 56, `ROUND: 1 / 3`, {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: '#ffc832',
    }).setOrigin(1, 0.5).setDepth(11);

    const badge = this.add.graphics().setDepth(10);
    badge.fillStyle(0x000000, 0.5);
    badge.fillRoundedRect(9, 8, 90, 36, 10);
    this.add.text(18, 26, 'MEDIUM', {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: '#8ab4f8', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);
  }

  // ─── phase label ─────────────────────────────────────────────────────────

  private buildPhaseLabel(): void {
    const bg = this.add.graphics().setDepth(9);
    bg.fillStyle(0x000000, 0.45);
    bg.fillRoundedRect(GAME_W / 2 - 140, 92, 280, 40, 10);

    this.phaseText = this.add.text(GAME_W / 2, 112, '👀  WATCH THE SEQUENCE', {
      fontSize: '16px', fontFamily: 'Poppins, sans-serif', color: '#8ab4f8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  // ─── sequence progress dots ───────────────────────────────────────────────

  private buildProgressDots(): void {
    const seq = getState().sequence;
    const total = seq.length;
    const spacing = 20;
    const startX = GAME_W / 2 - ((total - 1) * spacing) / 2;
    for (let i = 0; i < total; i++) {
      const dot = this.add.graphics().setDepth(10);
      dot.fillStyle(0x303060, 1);
      dot.fillCircle(startX + i * spacing, GAME_H - 28, 6);
      this.progressDots.push(dot);
    }
  }

  private updateProgressDots(filled: number): void {
    const seq = getState().sequence;
    const total = seq.length;
    const spacing = 20;
    const startX = GAME_W / 2 - ((total - 1) * spacing) / 2;
    this.progressDots.forEach((dot, i) => {
      dot.clear();
      dot.fillStyle(i < filled ? 0xa30078 : 0x303060, 1);
      dot.fillCircle(startX + i * spacing, GAME_H - 28, 6);
    });
  }

  // ─── tile visual states ───────────────────────────────────────────────────

  private dimAllTiles(): void {
    for (let i = 0; i < 6; i++) {
      const cx = this.tileCX(i);
      const cy = this.tileCY(i);
      this.tileGfx[i].clear();
      this.tileGfx[i].fillStyle(TILE_COLORS[i], 0.28);
      this.tileGfx[i].fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
      this.tileBorderGfx[i].clear();
      this.tileLabels[i].setAlpha(0.5);
    }
  }

  private highlightTile(i: number, alpha = 1.0): void {
    const cx = this.tileCX(i);
    const cy = this.tileCY(i);
    this.tileGfx[i].clear();
    this.tileGfx[i].fillStyle(TILE_COLORS[i], alpha);
    this.tileGfx[i].fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
    this.tileLabels[i].setAlpha(1);
  }

  private setCursorBorder(i: number, color: number, alpha: number): void {
    const cx = this.tileCX(i);
    const cy = this.tileCY(i);
    this.tileBorderGfx[i].clear();
    this.tileBorderGfx[i].lineStyle(4, color, alpha);
    this.tileBorderGfx[i].strokeRoundedRect(cx - TILE_W / 2 - 3, cy - TILE_H / 2 - 3, TILE_W + 6, TILE_H + 6, 18);
  }

  // ─── sequence playback ────────────────────────────────────────────────────

  private playSequence(): void {
    this.phase = 'watching';
    this.phaseText.setText('👀  WATCH THE SEQUENCE').setColor('#8ab4f8');
    this.dimAllTiles();

    const seq = getState().sequence;
    seq.forEach((tileIdx, step) => {
      // Flash on
      this.time.delayedCall(step * 850 + 200, () => {
        this.dimAllTiles();
        this.highlightTile(tileIdx, 0.95);
        this.setCursorBorder(tileIdx, 0xffffff, 0.9);
        this.tweens.add({ targets: this.tileLabels[tileIdx], scaleX: 1.18, scaleY: 1.18, duration: 120, yoyo: true });
      });
      // Flash off
      this.time.delayedCall(step * 850 + 680, () => {
        this.dimAllTiles();
      });
    });

    // After sequence: switch to input phase
    this.time.delayedCall(seq.length * 850 + 850, () => {
      this.startInputPhase();
    });
  }

  // ─── input phase ─────────────────────────────────────────────────────────

  private startInputPhase(): void {
    this.phase = 'inputting';
    this.playerPos = 0;
    this.cursorIdx = 0;

    this.phaseText.setText('🎯  YOUR TURN — PRESS ENTER').setColor('#ffc832');
    this.dimAllTiles();

    const roundIdx = getState().currentRound;
    const speed = CURSOR_SPEEDS[Math.min(roundIdx, CURSOR_SPEEDS.length - 1)];

    this.cursorTimer = this.time.addEvent({
      delay: speed,
      repeat: -1,
      callback: this.advanceCursor,
      callbackScope: this,
    });

    this.updateCursorVisual();
  }

  private advanceCursor(): void {
    // Remove old cursor highlight
    const prevIdx = this.cursorIdx;
    this.tileBorderGfx[prevIdx].clear();
    this.tileGfx[prevIdx].clear();
    const cx0 = this.tileCX(prevIdx);
    const cy0 = this.tileCY(prevIdx);
    this.tileGfx[prevIdx].fillStyle(TILE_COLORS[prevIdx], 0.28);
    this.tileGfx[prevIdx].fillRoundedRect(cx0 - TILE_W / 2, cy0 - TILE_H / 2, TILE_W, TILE_H, 16);
    this.tileLabels[prevIdx].setAlpha(0.5);

    this.cursorIdx = (this.cursorIdx + 1) % 6;
    this.updateCursorVisual();
  }

  private updateCursorVisual(): void {
    const i = this.cursorIdx;
    this.highlightTile(i, 0.72);
    this.setCursorBorder(i, 0xffffff, 0.95);
  }

  // ─── enter key ────────────────────────────────────────────────────────────

  private onEnter(): void {
    if (this.phase !== 'inputting') return;

    const { sequence } = getState();
    const expected = sequence[this.playerPos];
    const chosen   = this.cursorIdx;

    this.phase = 'feedback';
    this.cursorTimer?.remove();

    if (chosen === expected) {
      this.onCorrect(chosen);
    } else {
      this.onWrong(chosen);
    }
  }

  private onCorrect(tileIdx: number): void {
    // Green flash
    const cx = this.tileCX(tileIdx);
    const cy = this.tileCY(tileIdx);
    const overlay = this.add.graphics().setDepth(6);
    overlay.fillStyle(0x43a277, 0.65);
    overlay.fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 16);
    this.tweens.add({ targets: overlay, alpha: 0, duration: 380, onComplete: () => overlay.destroy() });

    this.playerPos++;
    this.updateProgressDots(this.playerPos);

    const { sequence } = getState();
    if (this.playerPos >= sequence.length) {
      // Full sequence done
      const points = sequence.length * 50;
      addPoints(points);

      const state = getState();
      this.scoreText.setText(`SCORE: ${state.gameScore}`);

      // Floating score pop
      const label = this.add.text(cx, cy - 20, `+${points}`, {
        fontSize: '24px', fontFamily: 'Poppins, sans-serif', color: '#43a277', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: label, y: label.y - 60, alpha: 0, duration: 900, ease: 'Power2.Out',
        onComplete: () => label.destroy() });

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
      // More tiles to select — resume cursor
      this.time.delayedCall(220, () => {
        this.phase = 'inputting';
        const roundIdx = getState().currentRound;
        const speed = CURSOR_SPEEDS[Math.min(roundIdx, CURSOR_SPEEDS.length - 1)];
        this.cursorTimer = this.time.addEvent({
          delay: speed, repeat: -1,
          callback: this.advanceCursor, callbackScope: this,
        });
        this.updateCursorVisual();
      });
    }
  }

  private onWrong(tileIdx: number): void {
    // Red flash on chosen tile
    const cx = this.tileCX(tileIdx);
    const cy = this.tileCY(tileIdx);
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
    this.cursorTimer?.remove();
    this.tileGfx = [];
    this.tileBorderGfx = [];
    this.tileLabels = [];
    this.progressDots = [];
  }
}
