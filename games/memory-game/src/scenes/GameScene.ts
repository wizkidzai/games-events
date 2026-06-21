import Phaser from 'phaser';
import { addPoints, endGame, getState, nextRound } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const MASCOT_TILES = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];
const TILE_COLORS  = [0x006464, 0xa30078, 0xff4747, 0x43a277, 0xffc832, 0x0aa4eb];
const TILE_NAMES   = ['Peacock', 'Mantis', 'Fox', 'Frog', 'Fawn', 'Blue Jay'];

type Phase = 'watching' | 'inputting' | 'feedback';

export class GameScene extends Phaser.Scene {
  private isDark = true;

  // Dynamic layout — computed from canvas size in create()
  private gameW = 900;
  private gameH = 600;
  private tileW = 130;
  private tileH = 130;
  private gapX  = 18;
  private gapY  = 18;
  private gridL = 237;
  private gridT = 148;

  private tileGfx: Phaser.GameObjects.Graphics[] = [];
  private tileBorderGfx: Phaser.GameObjects.Graphics[] = [];
  private tileLabels: Phaser.GameObjects.Text[] = [];
  private tileZones: Phaser.GameObjects.Zone[] = [];

  private phase: Phase = 'watching';
  private cursorIdx = 0;

  private playerPos = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private progressDots: Phaser.GameObjects.Graphics[] = [];

  constructor() { super({ key: 'GameScene' }); }

  private tileCX(i: number): number { return this.gridL + (i % 3) * (this.tileW + this.gapX) + this.tileW / 2; }
  private tileCY(i: number): number { return this.gridT + Math.floor(i / 3) * (this.tileH + this.gapY) + this.tileH / 2; }
  private get dimAlpha(): number { return this.isDark ? 0.28 : 0.20; }
  private get tileRadius(): number { return Math.round(this.tileW * 0.12); }

  create(): void {
    this.isDark = resolveTheme() === 'dark';
    this.gameW  = this.scale.width;
    this.gameH  = this.scale.height;
    this.computeLayout();

    this.tileGfx       = [];
    this.tileBorderGfx = [];
    this.tileLabels    = [];
    this.progressDots  = [];
    this.playerPos     = 0;
    this.cursorIdx     = 0;
    this.phase         = 'watching';

    this.cameras.main.setBackgroundColor(this.isDark ? '#12122a' : '#cce0f8');
    this.drawBackground();
    this.buildTiles();
    this.buildTileZones();
    this.buildHUD();
    this.buildProgressDots();
    this.buildPhaseLabel();

    this.input.keyboard?.on('keydown-LEFT',  () => this.moveCursor(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveCursor(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.onEnter());
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));

    this.time.delayedCall(500, () => this.playSequence());

    this.scale.once('resize', () => this.scene.restart(), this);

    addThemeToggle(this, this.isDark);
  }

  private computeLayout(): void {
    const { gameW, gameH } = this;
    // Available area: leave HUD (top ~90px) + phase banner (~50px) + progress dots (~50px)
    const availW = gameW - 40;
    const availH = gameH - 210;
    // Square tiles: fit 3 cols × 2 rows
    const maxByW = Math.floor((availW - 2 * 14) / 3);
    const maxByH = Math.floor((availH - 14) / 2);
    const tile   = Math.min(130, maxByW, maxByH);
    this.tileW   = tile;
    this.tileH   = tile;
    this.gapX    = Math.max(10, Math.min(18, Math.floor((availW - 3 * tile) / 2)));
    this.gapY    = this.gapX;
    const gridW  = 3 * this.tileW + 2 * this.gapX;
    const gridH  = 2 * this.tileH + this.gapY;
    this.gridL   = Math.floor((gameW - gridW) / 2);
    // Centre the grid vertically in the available band (below phase banner)
    this.gridT   = 145 + Math.round((availH - gridH) / 2);
  }

  private drawBackground(): void {
    const { gameW, gameH, isDark } = this;
    const g  = this.add.graphics();
    const s1 = gameH * 0.15;
    const s2 = gameH * 0.85;
    if (isDark) {
      for (const b of [
        { y: 0,  h: s1,          c: 0x08081a },
        { y: s1, h: s2 - s1,     c: 0x0d0d24 },
        { y: s2, h: gameH - s2,  c: 0x080818 },
      ]) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, gameW, b.h); }
      for (let i = 0; i < 55; i++) {
        g.fillStyle(0xffffff, 0.10 + Math.random() * 0.28);
        g.fillCircle(Phaser.Math.Between(0, gameW), Phaser.Math.Between(0, s1 * 1.2),
          Math.random() < 0.15 ? 1.4 : 0.7);
      }
      g.fillStyle(0xfffce8, 0.82); g.fillCircle(gameW - 70, 36, 20);
      g.fillStyle(0x08081a, 1);    g.fillCircle(gameW - 60, 31, 16);
    } else {
      for (const b of [
        { y: 0,  h: s1,          c: 0xb8d4f0 },
        { y: s1, h: s2 - s1,     c: 0xcce0f8 },
        { y: s2, h: gameH - s2,  c: 0xdce8ff },
      ]) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, gameW, b.h); }
      g.fillStyle(0xffd700, 0.85); g.fillCircle(gameW - 70, 36, 22);
      g.fillStyle(0xffe870, 0.4);  g.fillCircle(gameW - 70, 36, 33);
      g.fillStyle(0xffffff, 0.75);
      [[80, 16, 90, 18], [270, 28, 110, 20]].forEach(
        ([x, y, w, h]) => { g.fillRoundedRect(x, y, w, h, 9); g.fillRoundedRect(x + w * 0.12, y - 10, w * 0.6, h - 4, 8); }
      );
    }
  }

  private buildTiles(): void {
    const nameColor = this.isDark ? '#7080a0' : '#5070a0';
    const emojiFs   = `${Math.round(this.tileW * 0.32)}px`;
    const nameFs    = `${Math.round(Math.max(9, this.tileW * 0.085))}px`;
    for (let i = 0; i < 6; i++) {
      const cx = this.tileCX(i);
      const cy = this.tileCY(i);

      const gfx = this.add.graphics();
      gfx.fillStyle(TILE_COLORS[i], this.dimAlpha);
      gfx.fillRoundedRect(cx - this.tileW / 2, cy - this.tileH / 2, this.tileW, this.tileH, this.tileRadius);
      this.tileGfx.push(gfx);

      this.tileBorderGfx.push(this.add.graphics());

      this.tileLabels.push(
        this.add.text(cx, cy - this.tileH * 0.13, MASCOT_TILES[i], { fontSize: emojiFs }).setOrigin(0.5)
      );

      this.add.text(cx, cy + this.tileH * 0.30, TILE_NAMES[i], {
        fontSize: nameFs, fontFamily: 'Poppins, sans-serif', color: nameColor,
      }).setOrigin(0.5);
    }
  }

  private buildTileZones(): void {
    for (let i = 0; i < 6; i++) {
      const zone = this.add.zone(this.tileCX(i), this.tileCY(i), this.tileW, this.tileH)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.onTileTap(i));
      this.tileZones.push(zone);
    }
  }

  private onTileTap(i: number): void {
    if (this.phase !== 'inputting') return;
    if (this.cursorIdx !== i) {
      const prev = this.cursorIdx;
      const cx0 = this.tileCX(prev), cy0 = this.tileCY(prev);
      this.tileGfx[prev].clear();
      this.tileGfx[prev].fillStyle(TILE_COLORS[prev], this.dimAlpha);
      this.tileGfx[prev].fillRoundedRect(cx0 - this.tileW / 2, cy0 - this.tileH / 2, this.tileW, this.tileH, this.tileRadius);
      this.tileBorderGfx[prev].clear();
      this.tileLabels[prev].setAlpha(0.5);
      this.cursorIdx = i;
      this.updateCursorVisual();
    }
    this.onEnter();
  }

  private buildHUD(): void {
    const { gameW } = this;
    const state     = getState();
    const textScore = this.isDark ? '#ffffff' : '#1a1a2e';
    const textRound = this.isDark ? '#ffc832' : '#c07000';
    const hudColor  = this.isDark ? 0x000000 : 0xffffff;
    const hudAlpha  = this.isDark ? 0.5 : 0.78;

    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(hudColor, hudAlpha);
    panel.fillRoundedRect(gameW - 168, 8, 156, 68, 12);

    this.scoreText = this.add.text(gameW - 18, 26, `SCORE: ${state.gameScore}`, {
      fontSize: '15px', fontFamily: 'Poppins, sans-serif', color: textScore, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.roundText = this.add.text(gameW - 18, 56, 'ROUND: 1', {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: textRound,
    }).setOrigin(1, 0.5).setDepth(11);
  }

  private buildPhaseLabel(): void {
    const { gameW } = this;
    const phaseBg = this.isDark ? 0x000000 : 0xffffff;
    const bg = this.add.graphics().setDepth(9);
    bg.fillStyle(phaseBg, this.isDark ? 0.45 : 0.72);
    bg.fillRoundedRect(gameW / 2 - 160, 92, 320, 40, 10);

    this.phaseText = this.add.text(gameW / 2, 112, '👀  WATCH THE SEQUENCE', {
      fontSize: '16px', fontFamily: 'Poppins, sans-serif',
      color: this.isDark ? '#8ab4f8' : '#2a4a80', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  private buildProgressDots(): void {
    const { gameW, gameH } = this;
    const seq = getState().sequence;
    const spacing = 20;
    const startX = gameW / 2 - ((seq.length - 1) * spacing) / 2;
    const emptyColor = this.isDark ? 0x303060 : 0xb0c8e8;
    for (let i = 0; i < seq.length; i++) {
      const dot = this.add.graphics().setDepth(10);
      dot.fillStyle(emptyColor, 1);
      dot.fillCircle(startX + i * spacing, gameH - 28, 6);
      this.progressDots.push(dot);
    }
  }

  private updateProgressDots(filled: number): void {
    const { gameW, gameH } = this;
    const seq = getState().sequence;
    const spacing = 20;
    const startX = gameW / 2 - ((seq.length - 1) * spacing) / 2;
    const emptyColor = this.isDark ? 0x303060 : 0xb0c8e8;
    this.progressDots.forEach((dot, i) => {
      dot.clear();
      dot.fillStyle(i < filled ? 0xa30078 : emptyColor, 1);
      dot.fillCircle(startX + i * spacing, gameH - 28, 6);
    });
  }

  private dimAllTiles(): void {
    for (let i = 0; i < 6; i++) {
      const cx = this.tileCX(i), cy = this.tileCY(i);
      this.tileGfx[i].clear();
      this.tileGfx[i].fillStyle(TILE_COLORS[i], this.dimAlpha);
      this.tileGfx[i].fillRoundedRect(cx - this.tileW / 2, cy - this.tileH / 2, this.tileW, this.tileH, this.tileRadius);
      this.tileBorderGfx[i].clear();
      this.tileLabels[i].setAlpha(0.5);
    }
  }

  private highlightTile(i: number, alpha = 1.0): void {
    const cx = this.tileCX(i), cy = this.tileCY(i);
    this.tileGfx[i].clear();
    this.tileGfx[i].fillStyle(TILE_COLORS[i], alpha);
    this.tileGfx[i].fillRoundedRect(cx - this.tileW / 2, cy - this.tileH / 2, this.tileW, this.tileH, this.tileRadius);
    this.tileLabels[i].setAlpha(1);
  }

  private setCursorBorder(i: number, color: number, alpha: number): void {
    const cx = this.tileCX(i), cy = this.tileCY(i);
    const pad = 3;
    this.tileBorderGfx[i].clear();
    this.tileBorderGfx[i].lineStyle(4, color, alpha);
    this.tileBorderGfx[i].strokeRoundedRect(
      cx - this.tileW / 2 - pad, cy - this.tileH / 2 - pad,
      this.tileW + pad * 2, this.tileH + pad * 2,
      this.tileRadius + pad,
    );
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
    this.phaseText.setText('🎯  TAP a tile  ·  or ← → + ENTER').setColor(phaseColor);
    this.dimAllTiles();
    this.updateCursorVisual();
  }

  private moveCursor(dir: -1 | 1): void {
    if (this.phase !== 'inputting') return;

    const prev = this.cursorIdx;
    const cx0 = this.tileCX(prev), cy0 = this.tileCY(prev);
    this.tileGfx[prev].clear();
    this.tileGfx[prev].fillStyle(TILE_COLORS[prev], this.dimAlpha);
    this.tileGfx[prev].fillRoundedRect(cx0 - this.tileW / 2, cy0 - this.tileH / 2, this.tileW, this.tileH, this.tileRadius);
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
    overlay.fillRoundedRect(cx - this.tileW / 2, cy - this.tileH / 2, this.tileW, this.tileH, this.tileRadius);
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
        this.roundText.setText(`ROUND: ${newState.currentRound + 1}`);
        this.progressDots.forEach(d => d.destroy());
        this.progressDots = [];
        this.buildProgressDots();
        this.updateProgressDots(0);
        this.playSequence();
      });
    } else {
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
    overlay.fillRoundedRect(cx - this.tileW / 2, cy - this.tileH / 2, this.tileW, this.tileH, this.tileRadius);
    this.tweens.add({ targets: overlay, alpha: 0, duration: 600, onComplete: () => overlay.destroy() });

    this.phaseText.setText('✗  WRONG — GAME OVER').setColor('#ff5555');

    this.time.delayedCall(1100, () => {
      endGame(false);
      this.scene.start('GameOverScene');
    });
  }

  shutdown(): void {
    this.tileGfx       = [];
    this.tileBorderGfx = [];
    this.tileLabels    = [];
    this.tileZones     = [];
    this.progressDots  = [];
  }
}
