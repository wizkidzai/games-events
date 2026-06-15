import Phaser from 'phaser';
import { addPoints, endGame, getState } from '../systems/gameState';

const GAME_W = 900;
const GAME_H = 600;

// Board layout: 8×8 cells at 48px each
const CELL = 48;
const COLS = 8;
const ROWS = 8;
const BOARD_LEFT = (GAME_W - COLS * CELL) / 2; // 258
const BOARD_TOP  = 90;

// Visual cell colours
const CELL_DARK  = 0x162032;
const CELL_LIGHT = 0x243a52;
const CELL_GLOW  = 0x1a4a7a;

// Static starting position [row][col] → piece glyph ('' = empty)
const PIECES: string[][] = [
  ['♜','', '', '', '♚','', '', '♜'],
  ['', '', '♟','', '', '♟','', ''],
  ['', '', '', '', '♟','', '', ''],
  ['', '', '', '♟','', '', '', ''],
  ['', '', '♙','', '', '', '', ''],
  ['', '', '', '♘','', '', '', ''],
  ['♙','♙','', '', '♙','♙','♙','♙'],
  ['♖','♘','♗','♕','♔','♗','', '♖'],
];

const MAX_MOVES = 10;

export class GameScene extends Phaser.Scene {
  private moveCount = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private isOver = false;

  // Track piece text objects so we can animate a "move"
  private pieceTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  // Highlight overlay graphics
  private highlightGfx!: Phaser.GameObjects.Graphics;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.moveCount = 0;
    this.isOver = false;
    this.pieceTexts.clear();

    this.cameras.main.setBackgroundColor('#12122a');
    this.drawBackground();
    this.drawBoard();
    this.buildHUD();

    this.highlightGfx = this.add.graphics().setDepth(5);

    this.input.keyboard?.on('keydown-ENTER', () => this.handleMove());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleMove());
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  // ─── background ──────────────────────────────────────────────────────────

  private drawBackground(): void {
    const g = this.add.graphics();
    const bands = [
      { y: 0,   h: 90,       c: 0x08081a },
      { y: 90,  h: 430,      c: 0x0d0d24 },
      { y: 520, h: GAME_H-520, c: 0x080818 },
    ];
    for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, GAME_W, b.h); }
    for (let i = 0; i < 55; i++) {
      g.fillStyle(0xffffff, 0.12 + Math.random() * 0.35);
      g.fillCircle(
        Phaser.Math.Between(0, GAME_W),
        Phaser.Math.Between(0, 80),
        Math.random() < 0.15 ? 1.4 : 0.7
      );
    }
    // Moon
    g.fillStyle(0xfffce8, 0.82); g.fillCircle(GAME_W - 70, 38, 20);
    g.fillStyle(0x08081a, 1);    g.fillCircle(GAME_W - 60, 33, 16);
  }

  // ─── chess board ─────────────────────────────────────────────────────────

  private drawBoard(): void {
    // Outer shadow/border
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRoundedRect(BOARD_LEFT - 8, BOARD_TOP - 8, COLS * CELL + 16, ROWS * CELL + 16, 10);

    const board = this.add.graphics();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const light = (r + c) % 2 === 0;
        board.fillStyle(light ? CELL_LIGHT : CELL_DARK, 1);
        board.fillRect(BOARD_LEFT + c * CELL, BOARD_TOP + r * CELL, CELL, CELL);
      }
    }

    // Rank & file labels
    const labelStyle = {
      fontSize: '9px', fontFamily: 'Poppins, sans-serif',
      color: '#4a6080', fontStyle: 'bold',
    };
    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = ['8','7','6','5','4','3','2','1'];
    for (let i = 0; i < 8; i++) {
      this.add.text(
        BOARD_LEFT + i * CELL + CELL / 2, BOARD_TOP + ROWS * CELL + 5,
        files[i], labelStyle
      ).setOrigin(0.5, 0);
      this.add.text(
        BOARD_LEFT - 10, BOARD_TOP + i * CELL + CELL / 2,
        ranks[i], labelStyle
      ).setOrigin(1, 0.5);
    }

    // Chess pieces
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const glyph = PIECES[r][c];
        if (!glyph) continue;
        const px = BOARD_LEFT + c * CELL + CELL / 2;
        const py = BOARD_TOP  + r * CELL + CELL / 2;
        const isBlack = glyph === glyph.toLowerCase() ||
          ['♜','♛','♚','♟','♞','♝'].includes(glyph);
        const t = this.add.text(px, py, glyph, {
          fontSize: '26px',
          color: isBlack ? '#c8d8f0' : '#ffffff',
        }).setOrigin(0.5).setDepth(3);
        this.pieceTexts.set(`${r},${c}`, t);
      }
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private buildHUD(): void {
    // Score panel (top right)
    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(0x000000, 0.5);
    panel.fillRoundedRect(GAME_W - 168, 8, 156, 68, 12);

    const state = getState();
    this.scoreText = this.add.text(GAME_W - 18, 26, `SCORE: ${state.gameScore}`, {
      fontSize: '15px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.movesText = this.add.text(GAME_W - 18, 56, `MOVES: 0 / ${MAX_MOVES}`, {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: '#ffc832',
    }).setOrigin(1, 0.5).setDepth(11);

    // Difficulty badge (top left)
    const badge = this.add.graphics().setDepth(10);
    badge.fillStyle(0x000000, 0.5);
    badge.fillRoundedRect(9, 8, 90, 36, 10);
    this.add.text(18, 26, 'MEDIUM', {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: '#8ab4f8', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);

    // Bottom instruction
    this.add.text(GAME_W / 2, GAME_H - 20, 'PRESS ENTER TO MAKE A MOVE', {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: '#2a2a45', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  // ─── game logic ──────────────────────────────────────────────────────────

  private handleMove(): void {
    if (this.isOver) return;

    this.moveCount++;
    const points = Math.max(10, 50 - (this.moveCount - 1) * 4);
    addPoints(points);

    const { gameScore } = getState();
    this.scoreText.setText(`SCORE: ${gameScore}`);
    this.movesText.setText(`MOVES: ${this.moveCount} / ${MAX_MOVES}`);

    // Flash a random piece to suggest a move was made
    this.flashRandomPiece();

    if (this.moveCount >= MAX_MOVES) {
      this.isOver = true;
      this.time.delayedCall(600, () => {
        endGame(true);
        this.scene.start('GameOverScene');
      });
    }
  }

  private flashRandomPiece(): void {
    const keys = Array.from(this.pieceTexts.keys());
    if (keys.length === 0) return;
    const key = keys[Phaser.Math.Between(0, keys.length - 1)];
    const [r, c] = key.split(',').map(Number);

    // Highlight the cell
    this.highlightGfx.clear();
    this.highlightGfx.fillStyle(CELL_GLOW, 0.7);
    this.highlightGfx.fillRect(BOARD_LEFT + c * CELL, BOARD_TOP + r * CELL, CELL, CELL);
    this.time.delayedCall(280, () => this.highlightGfx.clear());

    // Scale the piece text briefly
    const pieceText = this.pieceTexts.get(key);
    if (pieceText) {
      this.tweens.add({ targets: pieceText, scaleX: 1.35, scaleY: 1.35, duration: 120, yoyo: true });
    }
  }

  shutdown(): void {
    this.pieceTexts.clear();
  }
}
