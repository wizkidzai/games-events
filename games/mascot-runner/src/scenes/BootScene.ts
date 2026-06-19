import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('wizkidz-symbol-teal', 'wizkidz-symbol-teal.png');
    this.load.image('wizkidz-symbol-white', 'wizkidz-symbol-white.png');
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
