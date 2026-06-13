import Phaser from 'phaser';

/**
 * Loads assets before any scene runs.
 * Place the Wiz Kidz logo at:  games/mascot-runner/public/wizkidz-logo.png
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // If the logo file is missing, create a gold "WZ" badge fallback instead
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === 'wizkidz-logo') {
        this.makeFallbackLogoTexture();
      }
    });

    // Vite serves public/ files at the page root in dev and at BASE_URL in prod
    this.load.image('wizkidz-logo', 'wizkidz-logo.png');
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private makeFallbackLogoTexture(): void {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Gold circle
    ctx.fillStyle = '#ffc832';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#e6a800';
    ctx.lineWidth = 2;
    ctx.stroke();

    // "WZ" text
    ctx.fillStyle = '#0d0d1a';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WZ', size / 2, size / 2);

    this.textures.addCanvas('wizkidz-logo', canvas);
  }
}
