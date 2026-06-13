import Phaser from 'phaser';
import { addPoints, endGame, getState } from '../systems/gameState';
import { showHint, showSuccess, showFailure } from '../systems/mascotResponses';
import { InputSystem } from '../systems/inputAbstraction';

const MASCOT_ID = 0; // Peacock Pride

// TODO: Implement full chess puzzle logic here.
// This is the boilerplate game loop — replace placeholder logic with real gameplay.

export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private moveCount = 0;
  private readonly MAX_MOVES = 10;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#FAFAFA');

    // --- HUD ---
    this.add
      .text(20, 20, 'Chess Masters', {
        fontSize: '22px',
        fontFamily: 'Poppins, sans-serif',
        color: '#006464',
        fontStyle: 'bold',
      });

    this.scoreText = this.add.text(width - 20, 20, 'Score: 0', {
      fontSize: '18px',
      fontFamily: 'Poppins, sans-serif',
      color: '#2D2D2D',
    }).setOrigin(1, 0);

    this.movesText = this.add.text(width / 2, 20, `Moves: 0 / ${this.MAX_MOVES}`, {
      fontSize: '16px',
      fontFamily: 'Poppins, sans-serif',
      color: '#6b7280',
    }).setOrigin(0.5, 0);

    // --- Placeholder game board ---
    this.add
      .text(width / 2, height / 2 - 40, '♟ Chess Puzzle Board', {
        fontSize: '28px',
        fontFamily: 'Poppins, sans-serif',
        color: '#2D2D2D',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, 'TODO: Implement puzzle grid', {
        fontSize: '14px',
        fontFamily: 'Poppins, sans-serif',
        color: '#9ca3af',
      })
      .setOrigin(0.5);

    // Demo click target — press SPACE or click to simulate a move
    const moveBtn = this.add
      .rectangle(width / 2, height / 2 + 80, 200, 48, 0x006464)
      .setInteractive({ cursor: 'pointer' });
    this.add
      .text(width / 2, height / 2 + 80, 'Make Move (Space)', {
        fontSize: '16px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    moveBtn.on('pointerup', () => this.handleMove());

    // Hint button
    const hintBtn = this.add
      .text(width - 20, height - 30, 'Hint', {
        fontSize: '14px',
        fontFamily: 'Poppins, sans-serif',
        color: '#006464',
        backgroundColor: '#e0f0f0',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 1)
      .setInteractive({ cursor: 'pointer' });
    hintBtn.on('pointerup', () => showHint(MASCOT_ID));

    // Input system
    this.inputSystem = new InputSystem(['keyboard']);
    this.inputSystem.start();
    this.inputSystem.on(action => {
      if (action.type === 'CONFIRM') this.handleMove();
      if (action.type === 'CANCEL') this.scene.start('MenuScene');
    });
  }

  private handleMove(): void {
    this.moveCount++;
    const points = Math.max(10, 50 - this.moveCount * 4);
    addPoints(points);
    showSuccess(MASCOT_ID);

    const { gameScore } = getState();
    this.scoreText.setText(`Score: ${gameScore}`);
    this.movesText.setText(`Moves: ${this.moveCount} / ${this.MAX_MOVES}`);

    if (this.moveCount >= this.MAX_MOVES) {
      this.finishGame(true);
    }
  }

  private finishGame(won: boolean): void {
    this.inputSystem.stop();
    if (won) showSuccess(MASCOT_ID);
    else showFailure(MASCOT_ID);

    this.time.delayedCall(1500, () => {
      endGame(won);
      this.scene.start('GameOverScene');
    });
  }

  shutdown(): void {
    this.inputSystem?.stop();
  }
}
