import Phaser from 'phaser';
import { getMascotByID } from '@wizkidz/mascot-system';
import { selectMascot, setDifficulty } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const MASCOT_COLORS: number[] = [0x006464, 0xa30078, 0xff4747, 0x43a277, 0xffc832, 0x0aa4eb];
const MASCOT_EMOJIS: string[] = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];

const CARD_Y = 205;
const CARD_CENTERS_X = [78, 228, 378, 528, 678, 828];
const CARD_BASE_W = 95;
const CARD_BASE_H = 88;

function toHexColor(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

export class MenuScene extends Phaser.Scene {
  private selectedID = 0;
  private mascotCards: Phaser.GameObjects.Container[] = [];
  private selBorderGfx!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private emojiText!: Phaser.GameObjects.Text;
  private cycleTimer!: Phaser.Time.TimerEvent;
  private hasLaunched = false;
  private isDark = true;

  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    const { width, height } = this.scale;
    this.hasLaunched = false;
    this.isDark = resolveTheme() === 'dark';

    const textPrimary  = this.isDark ? '#ffffff' : '#1a1a2e';
    const textMuted    = this.isDark ? '#2a2a45' : '#7090b0';

    this.cameras.main.setBackgroundColor(this.isDark ? '#0d0d1a' : '#cce0f8');
    this.drawBackground(width, height);

    this.add.text(width / 2, 46, 'MASCOT RUNNER', {
      fontSize: '44px', fontFamily: 'Poppins, sans-serif',
      color: textPrimary, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 88, 'Wiz Kidz Conference  ✦  Collect logos · Dodge cacti · Beat your score', {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: '#ffc832',
    }).setOrigin(0.5);

    this.mascotCards = [];
    for (let i = 0; i < 6; i++) {
      this.mascotCards.push(this.buildMascotCard(i, CARD_CENTERS_X[i], CARD_Y));
    }

    this.selBorderGfx = this.add.graphics();

    this.emojiText = this.add.text(width / 2, 310, MASCOT_EMOJIS[0], { fontSize: '38px' }).setOrigin(0.5);
    this.nameText  = this.add.text(width / 2, 352, getMascotByID(0).name, {
      fontSize: '22px', fontFamily: 'Poppins, sans-serif',
      color: toHexColor(MASCOT_COLORS[0]), fontStyle: 'bold',
    }).setOrigin(0.5);

    const promptColor = this.isDark ? '#ffc832' : '#c07000';
    const enterText = this.add.text(width / 2, 412, '● PRESS ENTER TO START ●', {
      fontSize: '20px', fontFamily: 'Poppins, sans-serif', color: promptColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: enterText, alpha: 0.25, duration: 700, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

    this.add.text(width / 2, height - 22, 'Auto-selecting mascot every 1.5s  —  press ENTER any time', {
      fontSize: '11px', fontFamily: 'Poppins, sans-serif', color: textMuted,
    }).setOrigin(0.5);

    this.applySelection(0);

    this.cycleTimer = this.time.addEvent({
      delay: 1500, repeat: -1,
      callback: () => { this.selectedID = (this.selectedID + 1) % 6; this.applySelection(this.selectedID); },
    });

    this.input.keyboard?.on('keydown-ENTER', () => this.launchGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.launchGame());

    addThemeToggle(this, this.isDark);
  }

  private buildMascotCard(mascotID: number, cx: number, cy: number): Phaser.GameObjects.Container {
    const color = MASCOT_COLORS[mascotID];
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 0.72);
    gfx.fillRoundedRect(-CARD_BASE_W / 2, -CARD_BASE_H / 2, CARD_BASE_W, CARD_BASE_H, 14);

    const emojiLabel = this.add.text(0, -12, MASCOT_EMOJIS[mascotID], { fontSize: '28px' }).setOrigin(0.5);
    const nameLabel  = this.add.text(0, 28, getMascotByID(mascotID).name.split(' ')[0], {
      fontSize: '10px', fontFamily: 'Poppins, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    return this.add.container(cx, cy, [gfx, emojiLabel, nameLabel]);
  }

  private applySelection(id: number): void {
    this.mascotCards.forEach((card, i) => {
      this.tweens.add({
        targets: card, scaleX: i === id ? 1.18 : 1.0, scaleY: i === id ? 1.18 : 1.0,
        duration: 220, ease: 'Power2.Out',
      });
    });

    const cx = CARD_CENTERS_X[id];
    const outerColor = this.isDark ? 0xffffff : 0x1a3a80;
    const outerAlpha = this.isDark ? 0.14 : 0.2;
    const innerColor = this.isDark ? 0xffffff : 0x1a3a80;

    this.selBorderGfx.clear();
    this.selBorderGfx.lineStyle(6, outerColor, outerAlpha);
    this.selBorderGfx.strokeRoundedRect(cx - 60, CARD_Y - 55, 120, 110, 17);
    this.selBorderGfx.lineStyle(2.5, innerColor, 0.95);
    this.selBorderGfx.strokeRoundedRect(cx - 57, CARD_Y - 52, 114, 104, 15);

    this.emojiText.setText(MASCOT_EMOJIS[id]);
    this.nameText.setText(getMascotByID(id).name);
    this.nameText.setColor(toHexColor(MASCOT_COLORS[id]));
  }

  private drawBackground(width: number, height: number): void {
    const g = this.add.graphics();

    if (this.isDark) {
      const bands = [
        { y: 0, h: 130, c: 0x06060f }, { y: 130, h: 160, c: 0x0b0b1e }, { y: 290, h: height - 290, c: 0x101028 },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, width, b.h); }
      for (let i = 0; i < 110; i++) {
        g.fillStyle(0xffffff, 0.18 + Math.random() * 0.6);
        g.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
          Math.random() < 0.08 ? 2 : Math.random() < 0.25 ? 1.3 : 0.7);
      }
      g.fillStyle(0xfffce8, 0.88); g.fillCircle(width - 95, 58, 26);
      g.fillStyle(0x06060f, 1);    g.fillCircle(width - 82, 52, 21);
    } else {
      const bands = [
        { y: 0, h: 130, c: 0xb8d4f0 }, { y: 130, h: 160, c: 0xcce0f8 }, { y: 290, h: height - 290, c: 0xdce8ff },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, width, b.h); }
      // Sun
      g.fillStyle(0xffd700, 0.9); g.fillCircle(width - 95, 58, 30);
      g.fillStyle(0xffe870, 0.4); g.fillCircle(width - 95, 58, 44);
      // Clouds
      g.fillStyle(0xffffff, 0.85);
      [[90, 32, 110, 22], [175, 22, 72, 18], [340, 55, 130, 24], [435, 44, 80, 20], [610, 28, 115, 22]].forEach(
        ([x, y, w, h]) => { g.fillRoundedRect(x, y, w, h, 11); g.fillRoundedRect(x + w * 0.12, y - 12, w * 0.6, h - 4, 9); }
      );
    }
  }

  private launchGame(): void {
    if (this.hasLaunched) return;
    this.hasLaunched = true;
    this.cycleTimer?.remove();
    selectMascot(this.selectedID);
    setDifficulty('medium');
    this.scene.start('GameScene');
  }
}
