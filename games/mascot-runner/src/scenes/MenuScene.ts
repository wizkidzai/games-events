import Phaser from 'phaser';
import { getMascotByID } from '@wizkidz/mascot-system';
import { selectMascot, setDifficulty } from '../systems/gameState';

const MASCOT_COLORS: number[] = [0x006464, 0xa30078, 0xff4747, 0x43a277, 0xffc832, 0x0aa4eb];
const MASCOT_EMOJIS: string[] = ['🦚', '🦋', '🦊', '🐸', '🦌', '🐦'];

// Card centers for a row of 6, evenly distributed across 900px
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

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.hasLaunched = false;

    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.drawBackground(width, height);

    // Title
    this.add
      .text(width / 2, 46, 'MASCOT RUNNER', {
        fontSize: '44px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 88, 'Wiz Kidz Conference  ✦  Collect logos · Dodge cacti · Beat your score', {
        fontSize: '13px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffc832',
      })
      .setOrigin(0.5);

    // Build 6 mascot cards
    this.mascotCards = [];
    for (let i = 0; i < 6; i++) {
      const card = this.buildMascotCard(i, CARD_CENTERS_X[i], CARD_Y);
      this.mascotCards.push(card);
    }

    // Selection border (drawn above cards)
    this.selBorderGfx = this.add.graphics();

    // Selected mascot name display
    this.emojiText = this.add
      .text(width / 2, 310, MASCOT_EMOJIS[0], { fontSize: '38px' })
      .setOrigin(0.5);

    this.nameText = this.add
      .text(width / 2, 352, getMascotByID(0).name, {
        fontSize: '22px',
        fontFamily: 'Poppins, sans-serif',
        color: toHexColor(MASCOT_COLORS[0]),
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // "PRESS ENTER" prompt with pulsing tween
    const enterText = this.add
      .text(width / 2, 412, '● PRESS ENTER TO START ●', {
        fontSize: '20px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffc832',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: enterText,
      alpha: 0.25,
      duration: 700,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(width / 2, height - 22, 'Auto-selecting mascot every 1.5s  —  press ENTER any time', {
        fontSize: '11px',
        fontFamily: 'Poppins, sans-serif',
        color: '#2a2a45',
      })
      .setOrigin(0.5);

    // Apply initial selection
    this.applySelection(0);

    // Auto-cycle: advance selection every 1.5 s
    this.cycleTimer = this.time.addEvent({
      delay: 1500,
      repeat: -1,
      callback: () => {
        this.selectedID = (this.selectedID + 1) % 6;
        this.applySelection(this.selectedID);
      },
    });

    // Single button: Enter (or Space for dev/testing)
    this.input.keyboard?.on('keydown-ENTER', () => this.launchGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.launchGame());
  }

  // ──────────────────── card builder

  private buildMascotCard(mascotID: number, cx: number, cy: number): Phaser.GameObjects.Container {
    const color = MASCOT_COLORS[mascotID];
    const emoji = MASCOT_EMOJIS[mascotID];
    const name = getMascotByID(mascotID).name.split(' ')[0]; // first word only for small cards

    const gfx = this.add.graphics();
    gfx.fillStyle(color, 0.72);
    gfx.fillRoundedRect(-CARD_BASE_W / 2, -CARD_BASE_H / 2, CARD_BASE_W, CARD_BASE_H, 14);

    const emojiLabel = this.add
      .text(0, -12, emoji, { fontSize: '28px' })
      .setOrigin(0.5);

    const nameLabel = this.add
      .text(0, 28, name, {
        fontSize: '10px',
        fontFamily: 'Poppins, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const container = this.add.container(cx, cy, [gfx, emojiLabel, nameLabel]);
    return container;
  }

  // ──────────────────── selection state

  private applySelection(id: number): void {
    // Scale cards: selected → 1.18, others → 1.0
    this.mascotCards.forEach((card, i) => {
      this.tweens.add({
        targets: card,
        scaleX: i === id ? 1.18 : 1.0,
        scaleY: i === id ? 1.18 : 1.0,
        duration: 220,
        ease: 'Power2.Out',
      });
    });

    // Redraw selection border at selected card position
    const cx = CARD_CENTERS_X[id];
    this.selBorderGfx.clear();
    this.selBorderGfx.lineStyle(6, 0xffffff, 0.14);
    this.selBorderGfx.strokeRoundedRect(cx - 60, CARD_Y - 55, 120, 110, 17);
    this.selBorderGfx.lineStyle(2.5, 0xffffff, 0.95);
    this.selBorderGfx.strokeRoundedRect(cx - 57, CARD_Y - 52, 114, 104, 15);

    // Update name / emoji display
    const color = MASCOT_COLORS[id];
    this.emojiText.setText(MASCOT_EMOJIS[id]);
    this.nameText.setText(getMascotByID(id).name);
    this.nameText.setColor(toHexColor(color));
  }

  // ──────────────────── background

  private drawBackground(width: number, height: number): void {
    const g = this.add.graphics();
    const bands = [
      { y: 0,   h: 130, c: 0x06060f },
      { y: 130, h: 160, c: 0x0b0b1e },
      { y: 290, h: 210, c: 0x101028 },
    ];
    for (const b of bands) {
      g.fillStyle(b.c, 1);
      g.fillRect(0, b.y, width, b.h);
    }

    // Stars
    for (let i = 0; i < 110; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const bright = 0.18 + Math.random() * 0.6;
      const r = Math.random() < 0.08 ? 2 : Math.random() < 0.25 ? 1.3 : 0.7;
      g.fillStyle(0xffffff, bright);
      g.fillCircle(x, y, r);
    }

    // Moon
    g.fillStyle(0xfffce8, 0.88);
    g.fillCircle(width - 95, 58, 26);
    g.fillStyle(0x06060f, 1);
    g.fillCircle(width - 82, 52, 21);
  }

  // ──────────────────── launch

  private launchGame(): void {
    if (this.hasLaunched) return;
    this.hasLaunched = true;
    this.cycleTimer?.remove();
    selectMascot(this.selectedID);
    setDifficulty('medium'); // fixed difficulty; in-game speed ramp handles progression
    this.scene.start('GameScene');
  }
}
