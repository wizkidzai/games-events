import Phaser from 'phaser';
import { addPoints, endGame, getState } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const GAME_W = 900;
const GAME_H = 600;

const CELL = 48;
const COLS = 8;
const ROWS = 8;
const BOARD_LEFT = (GAME_W - COLS * CELL) / 2; // 258
const BOARD_TOP  = 90;

// Dark-theme board colours
const CELL_DARK_D  = 0x162032;
const CELL_LIGHT_D = 0x243a52;
const CELL_GLOW_D  = 0x1a4a7a;

// Light-theme board colours
const CELL_DARK_L  = 0x6b8fb0;
const CELL_LIGHT_L = 0xf4e8c8;
const CELL_GLOW_L  = 0x3880c0;

const PIECES: string[][] = [
  ['♜', '',  '',  '',  '♚', '',  '',  '♜'],
  ['',  '',  '♟', '',  '',  '♟', '',  '' ],
  ['',  '',  '',  '',  '♟', '',  '',  '' ],
  ['',  '',  '',  '♟', '',  '',  '',  '' ],
  ['',  '',  '♙', '',  '',  '',  '',  '' ],
  ['',  '',  '',  '♘', '',  '',  '',  '' ],
  ['♙', '♙', '',  '',  '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '',  '♖'],
];

const MAX_MOVES = 10;

export class GameScene extends Phaser.Scene {
  private isDark = true;
  private cellDark  = CELL_DARK_D;
  private cellLight = CELL_LIGHT_D;
  private cellGlow  = CELL_GLOW_D;

  private moveCount = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private isOver = false;

  private pieceTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private highlightGfx!: Phaser.GameObjects.Graphics;
  private hoverGfx!: Phaser.GameObjects.Graphics;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.isDark = resolveTheme() === 'dark';
    this.cellDark  = this.isDark ? CELL_DARK_D  : CELL_DARK_L;
    this.cellLight = this.isDark ? CELL_LIGHT_D : CELL_LIGHT_L;
    this.cellGlow  = this.isDark ? CELL_GLOW_D  : CELL_GLOW_L;

    this.moveCount = 0;
    this.isOver = false;
    this.pieceTexts.clear();

    this.cameras.main.setBackgroundColor(this.isDark ? '#12122a' : '#cce0f8');
    this.drawBackground();
    this.drawBoard();
    this.buildHUD();

    this.highlightGfx = this.add.graphics().setDepth(5);
    this.hoverGfx     = this.add.graphics().setDepth(4);

    // Primary: touchscreen / mouse pointer on board cells
    this.addBoardInput();
    // ESC: back to menu
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));

    addThemeToggle(this, this.isDark);
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    if (this.isDark) {
      const bands = [
        { y: 0,   h: 90,           c: 0x08081a },
        { y: 90,  h: 430,          c: 0x0d0d24 },
        { y: 520, h: GAME_H - 520, c: 0x080818 },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, GAME_W, b.h); }
      for (let i = 0; i < 55; i++) {
        g.fillStyle(0xffffff, 0.12 + Math.random() * 0.35);
        g.fillCircle(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, 80), Math.random() < 0.15 ? 1.4 : 0.7);
      }
      g.fillStyle(0xfffce8, 0.82); g.fillCircle(GAME_W - 70, 38, 20);
      g.fillStyle(0x08081a, 1);    g.fillCircle(GAME_W - 60, 33, 16);
    } else {
      const bands = [
        { y: 0,   h: 90,           c: 0xb8d4f0 },
        { y: 90,  h: 430,          c: 0xcce0f8 },
        { y: 520, h: GAME_H - 520, c: 0xdce8ff },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, GAME_W, b.h); }
      g.fillStyle(0xffd700, 0.88); g.fillCircle(GAME_W - 70, 38, 22);
      g.fillStyle(0xffe870, 0.4);  g.fillCircle(GAME_W - 70, 38, 33);
      g.fillStyle(0xffffff, 0.75);
      g.fillRoundedRect(60, 18, 90, 18, 9);  g.fillRoundedRect(128, 10, 55, 16, 8);
      g.fillRoundedRect(280, 28, 110, 20, 10); g.fillRoundedRect(368, 18, 65, 16, 8);
    }
  }

  private drawBoard(): void {
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(BOARD_LEFT - 8, BOARD_TOP - 8, COLS * CELL + 16, ROWS * CELL + 16, 10);

    const board = this.add.graphics();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        board.fillStyle((r + c) % 2 === 0 ? this.cellLight : this.cellDark, 1);
        board.fillRect(BOARD_LEFT + c * CELL, BOARD_TOP + r * CELL, CELL, CELL);
      }
    }

    const labelColor = this.isDark ? '#4a6080' : '#7090a8';
    const labelStyle = { fontSize: '9px', fontFamily: 'Poppins, sans-serif', color: labelColor, fontStyle: 'bold' };
    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = ['8','7','6','5','4','3','2','1'];
    for (let i = 0; i < 8; i++) {
      this.add.text(BOARD_LEFT + i * CELL + CELL / 2, BOARD_TOP + ROWS * CELL + 5, files[i], labelStyle).setOrigin(0.5, 0);
      this.add.text(BOARD_LEFT - 10, BOARD_TOP + i * CELL + CELL / 2, ranks[i], labelStyle).setOrigin(1, 0.5);
    }

    const pieceColorDark  = this.isDark ? '#c8d8f0' : '#3050a0';
    const pieceColorLight = this.isDark ? '#ffffff'  : '#1a1a2e';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const glyph = PIECES[r][c];
        if (!glyph) continue;
        const px = BOARD_LEFT + c * CELL + CELL / 2;
        const py = BOARD_TOP  + r * CELL + CELL / 2;
        const isBlackPiece = ['♜','♛','♚','♟','♞','♝'].includes(glyph);
        const t = this.add.text(px, py, glyph, {
          fontSize: '26px', color: isBlackPiece ? pieceColorDark : pieceColorLight,
        }).setOrigin(0.5).setDepth(3);
        this.pieceTexts.set(`${r},${c}`, t);
      }
    }
  }

  private buildHUD(): void {
    const textScore = this.isDark ? '#ffffff' : '#1a1a2e';
    const textMoves = this.isDark ? '#ffc832' : '#c07000';
    const badgeText = this.isDark ? '#8ab4f8' : '#2a4a80';
    const hintText  = this.isDark ? '#2a2a45' : '#9090b0';
    const hudColor  = this.isDark ? 0x000000 : 0xffffff;
    const hudAlpha  = this.isDark ? 0.5 : 0.78;

    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(hudColor, hudAlpha);
    panel.fillRoundedRect(GAME_W - 168, 8, 156, 68, 12);

    this.scoreText = this.add.text(GAME_W - 18, 26, `SCORE: ${getState().gameScore}`, {
      fontSize: '15px', fontFamily: 'Poppins, sans-serif', color: textScore, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.movesText = this.add.text(GAME_W - 18, 56, `MOVES: 0 / ${MAX_MOVES}`, {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: textMoves,
    }).setOrigin(1, 0.5).setDepth(11);

    const badge = this.add.graphics().setDepth(10);
    badge.fillStyle(hudColor, hudAlpha);
    badge.fillRoundedRect(9, 8, 90, 36, 10);
    this.add.text(18, 26, 'MEDIUM', {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: badgeText, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);

    this.add.text(GAME_W / 2, GAME_H - 20, 'TAP A PIECE TO MAKE A MOVE  |  ESC = MENU', {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: hintText, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  private addBoardInput(): void {
    const boardW = COLS * CELL;
    const boardH = ROWS * CELL;

    const zone = this.add.zone(
      BOARD_LEFT + boardW / 2,
      BOARD_TOP  + boardH / 2,
      boardW, boardH
    ).setInteractive({ useHandCursor: true }).setDepth(15);

    zone.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      const col = Math.floor((ptr.x - BOARD_LEFT) / CELL);
      const row = Math.floor((ptr.y - BOARD_TOP)  / CELL);
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
      this.hoverGfx.clear();
      this.hoverGfx.fillStyle(0xffffff, 0.09);
      this.hoverGfx.fillRect(BOARD_LEFT + col * CELL, BOARD_TOP + row * CELL, CELL, CELL);
    });
    zone.on('pointerout', () => this.hoverGfx.clear());

    zone.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.isOver) return;
      const col = Math.floor((ptr.x - BOARD_LEFT) / CELL);
      const row = Math.floor((ptr.y - BOARD_TOP)  / CELL);
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

      if (PIECES[row][col]) {
        this.flashPiece(row, col);
      } else {
        this.flashRandomPiece();
      }
      this.handleMove();
    });
  }

  private handleMove(): void {
    this.moveCount++;
    const points = Math.max(10, 50 - (this.moveCount - 1) * 4);
    addPoints(points);

    const { gameScore } = getState();
    this.scoreText.setText(`SCORE: ${gameScore}`);
    this.movesText.setText(`MOVES: ${this.moveCount} / ${MAX_MOVES}`);

    if (this.moveCount >= MAX_MOVES) {
      this.isOver = true;
      this.hoverGfx.clear();
      this.time.delayedCall(600, () => { endGame(true); this.scene.start('GameOverScene'); });
    }
  }

  private flashPiece(r: number, c: number): void {
    this.highlightGfx.clear();
    this.highlightGfx.fillStyle(this.cellGlow, 0.7);
    this.highlightGfx.fillRect(BOARD_LEFT + c * CELL, BOARD_TOP + r * CELL, CELL, CELL);
    this.time.delayedCall(280, () => this.highlightGfx.clear());

    const pieceText = this.pieceTexts.get(`${r},${c}`);
    if (pieceText) {
      this.tweens.add({ targets: pieceText, scaleX: 1.35, scaleY: 1.35, duration: 120, yoyo: true });
    }
  }

  private flashRandomPiece(): void {
    const keys = Array.from(this.pieceTexts.keys());
    if (keys.length === 0) return;
    const key = keys[Phaser.Math.Between(0, keys.length - 1)];
    const [r, c] = key.split(',').map(Number);
    this.flashPiece(r, c);
  }

  shutdown(): void { this.pieceTexts.clear(); }
}
