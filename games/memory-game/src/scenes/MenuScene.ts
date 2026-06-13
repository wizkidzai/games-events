import Phaser from 'phaser';
import { getMascotByID } from '@wizkidz/mascot-system';
import { getState, setDifficulty, startGame } from '../systems/gameState';
import type { Difficulty } from '../systems/types';

const MASCOT_ID = 1; // Orchid Mantis — locked to Memory Game

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    const { width, height } = this.scale;
    const mascot = getMascotByID(MASCOT_ID);
    const state = getState();
    this.cameras.main.setBackgroundColor('#FAFAFA');

    this.add.text(width / 2, 80, 'Memory Game', {
      fontSize: '42px', fontFamily: 'Poppins, sans-serif', color: '#A30078', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 160, mascot.greeting, {
      fontSize: '18px', fontFamily: 'Poppins, sans-serif', color: '#2D2D2D',
      wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5);

    if (state.cardUID) {
      this.add.text(width / 2, 220, `Welcome back! High score: ${state.cardScorePrevious} pts`, {
        fontSize: '14px', fontFamily: 'Poppins, sans-serif', color: '#6b7280',
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, 290,
      'Watch the mascot sequence carefully.\nRepeat it back correctly to score points!', {
        fontSize: '16px', fontFamily: 'Poppins, sans-serif', color: '#4b5563',
        align: 'center', wordWrap: { width: 480 },
      }).setOrigin(0.5);

    this.add.text(width / 2, 370, 'Select Difficulty:', {
      fontSize: '16px', fontFamily: 'Poppins, sans-serif', color: '#374151', fontStyle: 'bold',
    }).setOrigin(0.5);

    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const diffColors: Record<Difficulty, number> = { easy: 0x43a277, medium: 0xffc832, hard: 0xff4747 };

    difficulties.forEach((diff, i) => {
      const x = width / 2 + (i - 1) * 140;
      const btn = this.add.rectangle(x, 420, 120, 44, diffColors[diff]).setInteractive({ cursor: 'pointer' });
      this.add.text(x, 420, diff.toUpperCase(), {
        fontSize: '14px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      btn.on('pointerup', () => { setDifficulty(diff); this.launchGame(); });
      btn.on('pointerover', () => btn.setAlpha(0.85));
      btn.on('pointerout', () => btn.setAlpha(1));
    });

    const startBtn = this.add.rectangle(width / 2, 510, 220, 50, 0xa30078).setInteractive({ cursor: 'pointer' });
    this.add.text(width / 2, 510, 'Start Game  →', {
      fontSize: '18px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    startBtn.on('pointerup', () => this.launchGame());
    this.input.keyboard?.once('keydown-ENTER', () => this.launchGame());
    void height;
  }

  private launchGame(): void {
    startGame();
    this.scene.start('GameScene');
  }
}
