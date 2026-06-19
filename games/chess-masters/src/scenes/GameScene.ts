import Phaser from 'phaser';
import { addPoints, endGame, getState } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const COLS = 8;
const ROWS = 8;

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

  // Dynamic layout — computed from actual canvas size in create()
  private gameW     = 900;
  private gameH     = 600;
  private cell      = 48;   // chess cell size (pixels)
  private boardTop  = 90;   // Y where the board starts
  private boardLeft = 258;  // X where the board starts

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
    this.gameW  = this.scale.width;
    this.gameH  = this.scale.height;
    this.computeLayout();

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

    this.addBoardInput();
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));

    this.scale.once('resize', () => this.scene.restart(), this);

    addThemeToggle(this, this.isDark);
  }

  private computeLayout(): void {
    const { gameW, gameH } = this;
    // Board should fit within the canvas with comfortable margins
    const availW = gameW - 60;  // 30px left + right
    const availH = gameH - 140; // ~90px top HUD + ~50px bottom hint
    const maxCell = Math.min(60, Math.floor(availW / COLS), Math.floor(availH / ROWS));
    this.cell      = Math.max(32, maxCell);
    const boardW   = COLS * this.cell;
    const boardH   = ROWS * this.cell;
    this.boardLeft = Math.floor((gameW - boardW) / 2);
    // Centre the board vertically between the HUD panel and the bottom hint
    this.boardTop  = Math.round((gameH - boardH) / 2 - 10);
    if (this.boardTop < 88) this.boardTop = 88; // never overlap HUD
  }

  private drawBackground(): void {
    const { gameW, gameH, isDark } = this;
    const g  = this.add.graphics();
    const s1 = this.boardTop;
    const s2 = this.boardTop + ROWS * this.cell;
    if (isDark) {
      for (const b of [
        { y: 0,  h: s1,          c: 0x08081a },
        { y: s1, h: s2 - s1,     c: 0x0d0d24 },
        { y: s2, h: gameH - s2,  c: 0x080818 },
      ]) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, gameW, b.h); }
      for (let i = 0; i < 55; i++) {
        g.fillStyle(0xffffff, 0.12 + Math.random() * 0.35);
        g.fillCircle(Phaser.Math.Between(0, gameW), Phaser.Math.Between(0, s1), Math.random() < 0.15 ? 1.4 : 0.7);
      }
      g.fillStyle(0xfffce8, 0.82); g.fillCircle(gameW - 70, 38, 20);
      g.fillStyle(0x08081a, 1);    g.fillCircle(gameW - 60, 33, 16);
    } else {
      for (const b of [
        { y: 0,  h: s1,          c: 0xb8d4f0 },
        { y: s1, h: s2 - s1,     c: 0xcce0f8 },
        { y: s2, h: gameH - s2,  c: 0xdce8ff },
      ]) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, gameW, b.h); }
      g.fillStyle(0xffd700, 0.88); g.fillCircle(gameW - 70, 38, 22);
      g.fillStyle(0xffe870, 0.4);  g.fillCircle(gameW - 70, 38, 33);
      g.fillStyle(0xffffff, 0.75);
      g.fillRoundedRect(60, 18, 90, 18, 9);  g.fillRoundedRect(128, 10, 55, 16, 8);
      g.fillRoundedRect(280, 28, 110, 20, 10); g.fillRoundedRect(368, 18, 65, 16, 8);
    }
  }

  private drawBoard(): void {
    const { boardLeft, boardTop, cell } = this;
    const pieceFontSize = `${Math.round(cell * 0.54)}px`;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(boardLeft - 8, boardTop - 8, COLS * cell + 16, ROWS * cell + 16, 10);

    const board = this.add.graphics();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        board.fillStyle((r + c) % 2 === 0 ? this.cellLight : this.cellDark, 1);
        board.fillRect(boardLeft + c * cell, boardTop + r * cell, cell, cell);
      }
    }

    const labelColor = this.isDark ? '#4a6080' : '#7090a8';
    const labelStyle = { fontSize: '9px', fontFamily: 'Poppins, sans-serif', color: labelColor, fontStyle: 'bold' };
    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = ['8','7','6','5','4','3','2','1'];
    for (let i = 0; i < 8; i++) {
      this.add.text(boardLeft + i * cell + cell / 2, boardTop + ROWS * cell + 5, files[i], labelStyle).setOrigin(0.5, 0);
      this.add.text(boardLeft - 10, boardTop + i * cell + cell / 2, ranks[i], labelStyle).setOrigin(1, 0.5);
    }

    const pieceColorDark  = this.isDark ? '#c8d8f0' : '#3050a0';
    const pieceColorLight = this.isDark ? '#ffffff'  : '#1a1a2e';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const glyph = PIECES[r][c];
        if (!glyph) continue;
        const px = boardLeft + c * cell + cell / 2;
        const py = boardTop  + r * cell + cell / 2;
        const isBlackPiece = ['♜','♛','♚','♟','♞','♝'].includes(glyph);
        const t = this.add.text(px, py, glyph, {
          fontSize: pieceFontSize, color: isBlackPiece ? pieceColorDark : pieceColorLight,
        }).setOrigin(0.5).setDepth(3);
        this.pieceTexts.set(`${r},${c}`, t);
      }
    }
  }

  private buildHUD(): void {
    const { gameW, gameH } = this;
    const textScore = this.isDark ? '#ffffff' : '#1a1a2e';
    const textMoves = this.isDark ? '#ffc832' : '#c07000';
    const hintText  = this.isDark ? '#9090b8' : '#4a6080';
    const hudColor  = this.isDark ? 0x000000 : 0xffffff;
    const hudAlpha  = this.isDark ? 0.5 : 0.78;

    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(hudColor, hudAlpha);
    panel.fillRoundedRect(gameW - 168, 8, 156, 68, 12);

    this.scoreText = this.add.text(gameW - 18, 26, `SCORE: ${getState().gameScore}`, {
      fontSize: '15px', fontFamily: 'Poppins, sans-serif', color: textScore, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.movesText = this.add.text(gameW - 18, 56, `MOVES: 0 / ${MAX_MOVES}`, {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: textMoves,
    }).setOrigin(1, 0.5).setDepth(11);

    this.add.text(gameW / 2, gameH - 20, 'TAP A PIECE TO MAKE A MOVE  |  ESC = MENU', {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: hintText, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  private addBoardInput(): void {
    const { boardLeft, boardTop, cell } = this;
    const boardW = COLS * cell;
    const boardH = ROWS * cell;

    const zone = this.add.zone(
      boardLeft + boardW / 2,
      boardTop  + boardH / 2,
      boardW, boardH
    ).setInteractive({ useHandCursor: true }).setDepth(15);

    zone.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      const col = Math.floor((ptr.x - boardLeft) / cell);
      const row = Math.floor((ptr.y - boardTop)  / cell);
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
      this.hoverGfx.clear();
      this.hoverGfx.fillStyle(0xffffff, 0.09);
      this.hoverGfx.fillRect(boardLeft + col * cell, boardTop + row * cell, cell, cell);
    });
    zone.on('pointerout', () => this.hoverGfx.clear());

    zone.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.isOver) return;
      const col = Math.floor((ptr.x - boardLeft) / cell);
      const row = Math.floor((ptr.y - boardTop)  / cell);
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
    const { boardLeft, boardTop, cell } = this;
    this.highlightGfx.clear();
    this.highlightGfx.fillStyle(this.cellGlow, 0.7);
    this.highlightGfx.fillRect(boardLeft + c * cell, boardTop + r * cell, cell, cell);
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
