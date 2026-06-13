import Phaser from 'phaser';
import { addPoints, endGame, getState, nextRound } from '../systems/gameState';
import { showSuccess, showFailure, showCelebration } from '../systems/mascotResponses';
import { InputSystem } from '../systems/inputAbstraction';

// Mascot display names used as sequence tiles
const MASCOT_TILES = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];
const TILE_COLORS = [0x006464, 0xa30078, 0xff4747, 0x43a277, 0xffc832, 0x0aa4eb];

const MASCOT_ID = 1;

export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private tiles: Phaser.GameObjects.Rectangle[] = [];
  private tileTexts: Phaser.GameObjects.Text[] = [];
  private playerInput: number[] = [];
  private isPlayingSequence = false;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor('#FAFAFA');
    this.playerInput = [];

    this.add.text(20, 20, 'Memory Game', {
      fontSize: '22px', fontFamily: 'Poppins, sans-serif', color: '#A30078', fontStyle: 'bold',
    });

    this.add.text(width / 2, 20, 'Watch — then repeat!', {
      fontSize: '16px', fontFamily: 'Poppins, sans-serif', color: '#6b7280',
    }).setOrigin(0.5, 0);

    // 6 mascot tiles in a 3×2 grid
    const cols = 3, rows = 2;
    const tileW = 110, tileH = 110, gapX = 20, gapY = 20;
    const gridW = cols * tileW + (cols - 1) * gapX;
    const startX = (width - gridW) / 2 + tileW / 2;
    const startY = 160;

    for (let i = 0; i < 6; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * (tileW + gapX);
      const y = startY + row * (tileH + gapY);
      const tile = this.add.rectangle(x, y, tileW, tileH, TILE_COLORS[i], 0.4)
        .setInteractive({ cursor: 'pointer' });
      const label = this.add.text(x, y, MASCOT_TILES[i], {
        fontSize: '36px',
      }).setOrigin(0.5);

      this.tiles.push(tile);
      this.tileTexts.push(label);

      tile.on('pointerup', () => {
        if (!this.isPlayingSequence) this.handlePlayerInput(i);
      });
    }

    // Play sequence after short delay
    this.time.delayedCall(600, () => this.playSequence());

    this.inputSystem = new InputSystem(['keyboard']);
    this.inputSystem.start();
    this.inputSystem.on(action => {
      if (action.type === 'CANCEL') this.scene.start('MenuScene');
    });
  }

  private playSequence(): void {
    this.isPlayingSequence = true;
    const { sequence } = getState();
    sequence.forEach((tileIdx, step) => {
      this.time.delayedCall(step * 900 + 400, () => this.flashTile(tileIdx));
    });
    this.time.delayedCall(sequence.length * 900 + 700, () => {
      this.isPlayingSequence = false;
    });
  }

  private flashTile(idx: number): void {
    const tile = this.tiles[idx];
    tile.setAlpha(1);
    this.time.delayedCall(600, () => tile.setAlpha(0.4));
  }

  private handlePlayerInput(idx: number): void {
    const { sequence } = getState();
    this.playerInput.push(idx);
    this.flashTile(idx);

    const pos = this.playerInput.length - 1;
    if (this.playerInput[pos] !== sequence[pos]) {
      // Wrong tile
      showFailure(MASCOT_ID);
      this.time.delayedCall(1200, () => {
        endGame(false);
        this.scene.start('GameOverScene');
      });
      return;
    }

    if (this.playerInput.length === sequence.length) {
      // Correct sequence!
      const points = sequence.length * 50;
      addPoints(points);
      showSuccess(MASCOT_ID);
      nextRound();
      this.playerInput = [];
      this.time.delayedCall(1200, () => {
        const state = getState();
        if (state.currentRound >= 3) {
          showCelebration(MASCOT_ID);
          this.time.delayedCall(1200, () => { endGame(true); this.scene.start('GameOverScene'); });
        } else {
          this.playSequence();
        }
      });
    }
  }

  shutdown(): void { this.inputSystem?.stop(); }
}
