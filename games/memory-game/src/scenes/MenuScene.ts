import Phaser from 'phaser';
import { getMascotByID } from '@wizkidz/mascot-system';
import { setDifficulty, startGame } from '../systems/gameState';

const MASCOT_ID = 1;
const MASCOT_COLOR = 0xa30078;
const MASCOT_EMOJI = '🦋';

export class MenuScene extends Phaser.Scene {
  private hasLaunched = false;

  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    const { width, height } = this.scale;
    this.hasLaunched = false;

    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.drawBackground(width, height);

    this.add.text(width / 2, 52, 'MEMORY GAME', {
      fontSize: '44px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 94, 'Wiz Kidz Conference  ✦  Watch the sequence · Repeat it · Beat your score', {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: '#ffc832',
    }).setOrigin(0.5);

    const cardCX = width / 2;
    const cardCY = 256;
    const cardW = 130;
    const cardH = 120;

    const cardGfx = this.add.graphics();
    cardGfx.fillStyle(MASCOT_COLOR, 0.72);
    cardGfx.fillRoundedRect(cardCX - cardW / 2, cardCY - cardH / 2, cardW, cardH, 14);

    this.add.text(cardCX, cardCY - 16, MASCOT_EMOJI, { fontSize: '40px' }).setOrigin(0.5);
    this.add.text(cardCX, cardCY + 30, getMascotByID(MASCOT_ID).name.split(' ')[0], {
      fontSize: '12px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const borderGfx = this.add.graphics();
    borderGfx.lineStyle(6, 0xffffff, 0.14);
    borderGfx.strokeRoundedRect(cardCX - cardW / 2 - 5, cardCY - cardH / 2 - 5, cardW + 10, cardH + 10, 18);
    borderGfx.lineStyle(2.5, 0xffffff, 0.95);
    borderGfx.strokeRoundedRect(cardCX - cardW / 2 - 2, cardCY - cardH / 2 - 2, cardW + 4, cardH + 4, 16);

    this.add.text(width / 2, 348, getMascotByID(MASCOT_ID).name, {
      fontSize: '22px', fontFamily: 'Poppins, sans-serif', color: '#a30078', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 388, 'Watch the mascot sequence carefully, then repeat it back!', {
      fontSize: '14px', fontFamily: 'Poppins, sans-serif', color: '#8ab4f8',
    }).setOrigin(0.5);

    const enterText = this.add.text(width / 2, 448, '● PRESS ENTER TO START ●', {
      fontSize: '20px', fontFamily: 'Poppins, sans-serif', color: '#ffc832', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: enterText, alpha: 0.25, duration: 700, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

    this.add.text(width / 2, height - 22, 'Use ENTER to select the highlighted mascot tile', {
      fontSize: '11px', fontFamily: 'Poppins, sans-serif', color: '#2a2a45',
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-ENTER', () => this.launchGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.launchGame());
  }

  private drawBackground(width: number, height: number): void {
    const g = this.add.graphics();
    const bands = [
      { y: 0,   h: 130,        c: 0x06060f },
      { y: 130, h: 160,        c: 0x0b0b1e },
      { y: 290, h: height-290, c: 0x101028 },
    ];
    for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, width, b.h); }
    for (let i = 0; i < 110; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      g.fillStyle(0xffffff, 0.18 + Math.random() * 0.6);
      g.fillCircle(x, y, Math.random() < 0.08 ? 2 : Math.random() < 0.25 ? 1.3 : 0.7);
    }
    g.fillStyle(0xfffce8, 0.88); g.fillCircle(width - 95, 58, 26);
    g.fillStyle(0x06060f, 1);    g.fillCircle(width - 82, 52, 21);
  }

  private launchGame(): void {
    if (this.hasLaunched) return;
    this.hasLaunched = true;
    setDifficulty('medium');
    startGame();
    this.scene.start('GameScene');
  }
}
