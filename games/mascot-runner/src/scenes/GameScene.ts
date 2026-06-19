import Phaser from 'phaser';
import { getState, startRun, addScore, endRun } from '../systems/gameState';
import { resolveTheme, addThemeToggle } from '../utils/theme';

const PLAYER_X = 120;
const PLAYER_W = 26;
const PLAYER_H = 52;
const MAX_JUMPS = 3;

const MASCOT_COLORS: Record<number, number> = {
  0: 0x006464, 1: 0xa30078, 2: 0xff4747,
  3: 0x43a277, 4: 0xffc832, 5: 0x0aa4eb,
};
const MASCOT_EMOJIS: Record<number, string> = {
  0: '🦚', 1: '🦋', 2: '🦊', 3: '🐸', 4: '🦌', 5: '🐦',
};

interface DiffConfig { speed: number; gravity: number; jumpV: number; spawnMin: number; spawnMax: number; }
const DIFF_CONFIG: Record<string, DiffConfig> = {
  easy:   { speed: 220, gravity: 1700, jumpV: -760, spawnMin: 2400, spawnMax: 3600 },
  medium: { speed: 300, gravity: 2100, jumpV: -820, spawnMin: 1600, spawnMax: 2700 },
  hard:   { speed: 400, gravity: 2500, jumpV: -880, spawnMin: 1100, spawnMax: 1900 },
};

const LOGO_HEIGHTS = [
  { dy: 75, bonus: 25 }, { dy: 140, bonus: 50 }, { dy: 200, bonus: 100 },
];

interface ObstaclePart { gfx: Phaser.GameObjects.Graphics; dx: number; hw: number; hh: number; cy: number; }
interface Obstacle { refX: number; parts: ObstaclePart[]; }
interface Collectible { container: Phaser.GameObjects.Container; x: number; baseY: number; bonus: number; collected: boolean; }

function darken(hex: number, f: number): number {
  return ((Math.floor(((hex >> 16) & 0xff) * f) << 16) |
          (Math.floor(((hex >> 8)  & 0xff) * f) << 8)  |
           Math.floor(( hex        & 0xff) * f));
}
function lighten(hex: number, a: number): number {
  return ((Math.min(255, ((hex >> 16) & 0xff) + a) << 16) |
          (Math.min(255, ((hex >> 8)  & 0xff) + a) << 8)  |
           Math.min(255,  (hex        & 0xff) + a));
}

export class GameScene extends Phaser.Scene {
  private isDark = true;

  // Dynamic layout — computed from actual canvas size in create()
  private gameW = 900;
  private gameH = 500;
  private groundY = 410; // gameH * 0.82

  private playerY = 0;
  private playerVY = 0;
  private isOnGround = true;
  private jumpsUsed = 0;
  private gravity = 2100;
  private jumpVelocity = -820;
  private baseSpeed = 300;
  private currentSpeed = 300;

  private spawnMin = 1600;
  private spawnMax = 2700;
  private obstacleTimer!: Phaser.Time.TimerEvent;
  private obstacles: Obstacle[] = [];

  private collectibles: Collectible[] = [];
  private collectibleTimer!: Phaser.Time.TimerEvent;

  private score = 0;
  private scoreAccum = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private hiScoreText!: Phaser.GameObjects.Text;

  private playerContainer!: Phaser.GameObjects.Container;
  private legL!: Phaser.GameObjects.Ellipse;
  private legR!: Phaser.GameObjects.Ellipse;
  private jumpDots: Phaser.GameObjects.Ellipse[] = [];
  private legStep = false;
  private legTimer!: Phaser.Time.TimerEvent;

  private mascotColor = 0x006464;
  private mascotEmoji = '🦚';

  private groundTicks: Phaser.GameObjects.Graphics[] = [];
  private clouds: Array<{ gfx: Phaser.GameObjects.Graphics; speed: number; totalW: number }> = [];

  private isOver = false;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.isDark = resolveTheme() === 'dark';
    this.gameW = this.scale.width;
    this.gameH = this.scale.height;
    this.groundY = Math.floor(this.gameH * 0.82);

    const state = getState();
    const mascotID = state.selectedMascotID;
    this.mascotColor = MASCOT_COLORS[mascotID] ?? 0x006464;
    this.mascotEmoji = MASCOT_EMOJIS[mascotID] ?? '🦚';

    const cfg = DIFF_CONFIG[state.difficulty] ?? DIFF_CONFIG.medium;
    this.gravity = cfg.gravity;
    this.jumpVelocity = cfg.jumpV;
    this.baseSpeed = cfg.speed;
    this.currentSpeed = cfg.speed;
    this.spawnMin = cfg.spawnMin;
    this.spawnMax = cfg.spawnMax;

    this.playerY = this.groundY - PLAYER_H / 2;
    this.playerVY = 0;
    this.isOnGround = true;
    this.jumpsUsed = 0;
    this.score = 0;
    this.scoreAccum = 0;
    this.isOver = false;
    this.obstacles = [];
    this.collectibles = [];
    this.groundTicks = [];
    this.clouds = [];
    this.jumpDots = [];

    startRun();

    this.cameras.main.setBackgroundColor(this.isDark ? '#12122a' : '#9dd8f0');
    this.buildBackground();
    this.buildGround();
    this.buildPlayer();
    this.buildHUD();

    // Primary: Enter (big booth button). Space / Up as dev fallbacks. Pointer for touch.
    this.input.keyboard?.on('keydown-ENTER', () => this.jump());
    this.input.keyboard?.on('keydown-SPACE', () => this.jump());
    this.input.keyboard?.on('keydown-UP', () => this.jump());
    this.input.on('pointerdown', () => this.jump());

    this.legTimer = this.time.addEvent({ delay: 110, repeat: -1, callback: this.toggleLegs, callbackScope: this });
    this.scheduleNextObstacle();
    this.scheduleNextCollectible();

    addThemeToggle(this, this.isDark);
  }

  private buildBackground(): void {
    const { gameW, groundY } = this;
    const g = this.add.graphics();

    if (this.isDark) {
      const bands = [
        { y: 0, h: 100, c: 0x080816 }, { y: 100, h: 120, c: 0x0e0e24 },
        { y: 220, h: 120, c: 0x131330 }, { y: 340, h: 70, c: 0x191938 },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, gameW, b.h); }
      for (let i = 0; i < 75; i++) {
        g.fillStyle(0xffffff, 0.28 + Math.random() * 0.65);
        g.fillCircle(Phaser.Math.Between(0, gameW), Phaser.Math.Between(0, groundY - 40),
          Math.random() < 0.1 ? 2 : Math.random() < 0.28 ? 1.3 : 0.7);
      }
      g.fillStyle(0xfffce8, 0.9); g.fillCircle(gameW - 85, 62, 28);
      g.fillStyle(0x0e0e24, 1);   g.fillCircle(gameW - 72, 56, 23);
      g.fillStyle(0x1a1e52, 0.45); g.fillRect(0, groundY - 80, gameW, 80);
    } else {
      const bands = [
        { y: 0, h: 100, c: 0x87ceeb }, { y: 100, h: 120, c: 0x9dd8f0 },
        { y: 220, h: 120, c: 0xb8e4f8 }, { y: 340, h: 70, c: 0xcdeeff },
      ];
      for (const b of bands) { g.fillStyle(b.c, 1); g.fillRect(0, b.y, gameW, b.h); }
      g.fillStyle(0xffd700, 0.9);  g.fillCircle(gameW - 85, 62, 30);
      g.fillStyle(0xffe870, 0.45); g.fillCircle(gameW - 85, 62, 44);
    }

    // Cloud defs
    const defs = [
      { x: 160, y: 78, w: 120, r: 0.6, spd: 26 }, { x: 470, y: 50, w: 85, r: 0.55, spd: 20 },
      { x: 740, y: 102, w: 145, r: 0.62, spd: 34 }, { x: 345, y: 148, w: 92, r: 0.58, spd: 16 },
      { x: 840, y: 68, w: 100, r: 0.6, spd: 29 },
    ];
    const cloudColor = this.isDark ? 0x1c2048 : 0xffffff;
    const cloudAlpha = this.isDark ? 0.85 : 0.88;
    for (const d of defs) {
      const gfx = this.add.graphics();
      gfx.fillStyle(cloudColor, cloudAlpha);
      gfx.fillRoundedRect(0, 0, d.w, 18, 9);
      gfx.fillRoundedRect(d.w * 0.12, -13, d.w * d.r, 16, 8);
      gfx.x = d.x; gfx.y = d.y;
      this.clouds.push({ gfx, speed: d.spd, totalW: d.w });
    }
  }

  private buildGround(): void {
    const { gameW, gameH, groundY } = this;
    const g = this.add.graphics();
    g.fillStyle(0x3a2518, 1); g.fillRect(0, groundY + 10, gameW, gameH - groundY - 10);
    g.fillStyle(0x4e9447, 1); g.fillRect(0, groundY, gameW, 14);
    g.fillStyle(0x62b25a, 0.55); g.fillRect(0, groundY, gameW, 4);
    g.fillStyle(0x2e1e10, 1);   g.fillRect(0, groundY + 14, gameW, 5);
    for (let i = 0; i < 16; i++) {
      const tick = this.add.graphics();
      tick.fillStyle(0x5a3d2b, 0.45);
      tick.fillRoundedRect(-3.5, -2, 7, 4, 2);
      tick.x = i * 58 + 22; tick.y = groundY + 24;
      this.groundTicks.push(tick);
    }
  }

  private buildPlayer(): void {
    const bodyColor = darken(this.mascotColor, 0.62);
    const highlight  = lighten(this.mascotColor, 55);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.22); g.fillEllipse(0, 34, 36, 10);
    g.fillStyle(bodyColor, 1);   g.fillRoundedRect(-13, -4, 26, 28, 9);
    g.fillStyle(highlight, 0.18); g.fillRoundedRect(-7, -1, 9, 14, 4);
    g.fillStyle(this.mascotColor, 1); g.fillCircle(0, -18, 19);
    g.fillStyle(0xffffff, 0.18); g.fillCircle(-7, -26, 8);
    const face = this.add.text(0, -18, this.mascotEmoji, { fontSize: '17px' }).setOrigin(0.5);
    this.legL = this.add.ellipse(-7, 31, 11, 18, this.mascotColor);
    this.legR = this.add.ellipse( 7, 31, 11, 18, this.mascotColor);
    for (let i = 0; i < MAX_JUMPS; i++) {
      this.jumpDots.push(this.add.ellipse((i - 1) * 12, 46, 6, 6, 0xffffff, 0.88));
    }
    this.playerContainer = this.add.container(PLAYER_X, this.playerY);
    this.playerContainer.add([g, this.legL, this.legR, face, ...this.jumpDots]);
  }

  private buildHUD(): void {
    const textScore = this.isDark ? '#ffffff' : '#1a1a2e';
    const textBest  = '#ffc832';
    const hudAlpha  = this.isDark ? 0.5 : 0.75;
    const hudColor  = this.isDark ? 0x000000 : 0xffffff;

    const hintText  = this.isDark ? '#2a2a45' : '#9090b0';

    const { gameW, gameH } = this;
    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(hudColor, hudAlpha);
    panel.fillRoundedRect(gameW - 168, 8, 156, 62, 12);

    this.scoreText = this.add.text(gameW - 18, 22, 'SCORE: 0', {
      fontSize: '15px', fontFamily: 'Poppins, sans-serif', color: textScore, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    const prevBest = getState().highScore;
    this.hiScoreText = this.add.text(gameW - 18, 50, `BEST: ${prevBest}`, {
      fontSize: '13px', fontFamily: 'Poppins, sans-serif', color: textBest,
    }).setOrigin(1, 0.5).setDepth(11);

    this.add.text(gameW / 2, gameH - 14, 'ENTER / TAP to jump  •  3 jumps per run', {
      fontSize: '11px', fontFamily: 'Poppins, sans-serif', color: hintText, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  private jump(): void {
    if (this.jumpsUsed < MAX_JUMPS && !this.isOver) {
      this.playerVY = this.jumpsUsed === 0 ? this.jumpVelocity : this.jumpVelocity * 0.87;
      this.jumpsUsed++;
      this.isOnGround = false;
      this.updateJumpDots();
    }
  }

  private updateJumpDots(): void {
    const left = MAX_JUMPS - this.jumpsUsed;
    this.jumpDots.forEach((d, i) => d.setAlpha(i < left ? 0.88 : 0.12));
  }

  private toggleLegs(): void {
    this.legStep = !this.legStep;
    if (this.isOnGround) {
      this.legL.setY(this.legStep ? 34 : 27); this.legL.setScale(1, this.legStep ? 1.18 : 0.82);
      this.legR.setY(this.legStep ? 27 : 34); this.legR.setScale(1, this.legStep ? 0.82 : 1.18);
    } else {
      this.legL.setY(25); this.legL.setScale(1, 0.6);
      this.legR.setY(25); this.legR.setScale(1, 0.6);
    }
  }

  private scheduleNextObstacle(): void {
    const reduction = Math.min(650, Math.floor(this.score / 80) * 42);
    const delay = Phaser.Math.Between(
      Math.max(650, this.spawnMin - reduction), Math.max(1000, this.spawnMax - reduction)
    );
    this.obstacleTimer = this.time.delayedCall(delay, () => {
      if (!this.isOver) { this.spawnObstacle(); this.scheduleNextObstacle(); }
    });
  }

  private spawnObstacle(): void {
    const { gameW, groundY } = this;
    let maxType = 2;
    if (this.score >= 120) maxType = 3;
    if (this.score >= 300) maxType = 4;
    const type = Phaser.Math.Between(0, maxType);
    const refX = gameW + 60;
    switch (type) {
      case 0: { const [w, h] = [26, 58]; const cy = groundY - h / 2;
        const gfx = this.trunkGfx(w, h, 0x2d6e1e, 0x3d8a26); gfx.x = refX; gfx.y = cy;
        this.obstacles.push({ refX, parts: [{ gfx, dx: 0, hw: w / 2, hh: h / 2, cy }] }); break; }
      case 1: { const [w, h] = [28, 95]; const cy = groundY - h / 2;
        const gfx = this.trunkArmedGfx(w, h, 0x2d6e1e, 0x3d8a26); gfx.x = refX; gfx.y = cy;
        this.obstacles.push({ refX, parts: [{ gfx, dx: 0, hw: w / 2 + 8, hh: h / 2, cy }] }); break; }
      case 2: { const [w, h1, h2] = [24, 68, 52];
        const cy1 = groundY - h1 / 2; const cy2 = groundY - h2 / 2;
        const g1 = this.trunkGfx(w, h1, 0x2d6e1e, 0x3d8a26);
        const g2 = this.trunkGfx(w, h2, 0x3d8a26, 0x2d6e1e);
        g1.x = refX - 20; g1.y = cy1; g2.x = refX + 20; g2.y = cy2;
        this.obstacles.push({ refX, parts: [
          { gfx: g1, dx: -20, hw: w/2, hh: h1/2, cy: cy1 },
          { gfx: g2, dx: 20, hw: w/2, hh: h2/2, cy: cy2 },
        ]}); break; }
      case 3: { const [w, h] = [30, 165]; const cy = groundY - h / 2;
        const gfx = this.trunkArmedGfx(w, h, 0x1e5214, 0x2d7a1e); gfx.x = refX; gfx.y = cy;
        this.obstacles.push({ refX, parts: [{ gfx, dx: 0, hw: w / 2 + 10, hh: h / 2, cy }] }); break; }
      default: { const [w, h] = [32, 195]; const cy = groundY - h / 2;
        const gfx = this.trunkMultiArmGfx(w, h, 0x1a4a12, 0x28701a); gfx.x = refX; gfx.y = cy;
        this.obstacles.push({ refX, parts: [{ gfx, dx: 0, hw: w / 2 + 10, hh: h / 2, cy }] }); break; }
    }
  }

  private trunkGfx(w: number, h: number, trunk: number, hi: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(trunk, 1); g.fillRoundedRect(-w/2, -h/2, w, h, { tl: 8, tr: 8, bl: 4, br: 4 });
    g.fillStyle(hi, 1);    g.fillRoundedRect(-w/2 + 4, -h/2 + 5, 8, h - 10, 3);
    return g;
  }

  private trunkArmedGfx(w: number, h: number, trunk: number, hi: number): Phaser.GameObjects.Graphics {
    const g = this.trunkGfx(w, h, trunk, hi);
    const a1y = -h/2 + h * 0.32; const a2y = -h/2 + h * 0.52;
    g.fillStyle(trunk, 1);
    g.fillRoundedRect(-w/2 - 18, a1y, 20, 12, 5); g.fillRoundedRect(-w/2 - 18, a1y - 22, 13, 24, 5);
    g.fillRoundedRect( w/2 - 2, a2y, 20, 12, 5);  g.fillRoundedRect( w/2 + 6, a2y - 26, 13, 28, 5);
    g.fillStyle(hi, 1);
    g.fillRoundedRect(-w/2 - 14, a1y - 20, 5, 20, 2); g.fillRoundedRect( w/2 + 10, a2y - 23, 5, 24, 2);
    return g;
  }

  private trunkMultiArmGfx(w: number, h: number, trunk: number, hi: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(trunk, 1); g.fillRoundedRect(-w/2, -h/2, w, h, { tl: 10, tr: 10, bl: 5, br: 5 });
    g.fillStyle(hi, 1);    g.fillRoundedRect(-w/2+4, -h/2+6, 9, h-12, 3);
    for (const ay of [-h*0.34, -h*0.08, h*0.16]) {
      g.fillStyle(trunk, 1);
      g.fillRoundedRect(-w/2-18, ay-6, 20, 11, 5); g.fillRoundedRect(-w/2-18, ay-24, 13, 20, 5);
      g.fillRoundedRect( w/2-2,  ay-4, 20, 11, 5); g.fillRoundedRect( w/2+6,  ay-22, 13, 20, 5);
      g.fillStyle(hi, 1);
      g.fillRoundedRect(-w/2-14, ay-22, 5, 18, 2); g.fillRoundedRect(w/2+10, ay-20, 5, 18, 2);
    }
    return g;
  }

  private scheduleNextCollectible(): void {
    const delay = Phaser.Math.Between(4500, 9000);
    this.collectibleTimer = this.time.delayedCall(delay, () => {
      if (!this.isOver) {
        const pick = Phaser.Math.RND.pick(LOGO_HEIGHTS);
        this.spawnCollectible(this.gameW + 40, this.groundY - pick.dy, pick.bonus);
        this.scheduleNextCollectible();
      }
    });
  }

  private spawnCollectible(x: number, baseY: number, bonus: number): void {
    let inner: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
    const symbolKey = resolveTheme() === 'dark' ? 'wizkidz-symbol-white' : 'wizkidz-symbol-teal';
    if (this.textures.exists(symbolKey)) {
      inner = this.add.image(0, 0, symbolKey).setDisplaySize(36, 36);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0xffc832, 1); g.fillCircle(0, 0, 18);
      g.lineStyle(2.5, 0xe6a800, 1); g.strokeCircle(0, 0, 18);
      inner = g;
    }
    const glow = this.add.graphics();
    glow.lineStyle(4, 0xffc832, 0.35); glow.strokeCircle(0, 0, 22);
    const container = this.add.container(x, baseY, [glow, inner]);
    this.tweens.add({ targets: container, y: baseY - 9, duration: 620, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
    this.tweens.add({ targets: glow, angle: 360, duration: 2800, repeat: -1 });
    this.collectibles.push({ container, x, baseY, bonus, collected: false });
  }

  private collectItem(c: Collectible): void {
    c.collected = true;
    this.tweens.killTweensOf(c.container);
    this.tweens.add({
      targets: c.container, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 380, ease: 'Power2.Out',
      onComplete: () => { if (c.container.active) c.container.destroy(); },
    });
    const label = this.add.text(c.x, c.baseY - 16, `+${c.bonus}`, {
      fontSize: '22px', fontFamily: 'Poppins, sans-serif', color: '#ffc832', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: label, y: label.y - 55, alpha: 0, duration: 850, ease: 'Power2.Out', onComplete: () => label.destroy() });
    this.score += c.bonus;
    addScore(c.bonus);
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.hiScoreText.setText(`BEST: ${getState().highScore}`);
  }

  private checkCollision(obs: Obstacle): boolean {
    const m = 5;
    const pL = PLAYER_X - PLAYER_W/2 + m, pR = PLAYER_X + PLAYER_W/2 - m;
    const pT = this.playerY - PLAYER_H/2 + m, pB = this.playerY + PLAYER_H/2 - m;
    for (const p of obs.parts) {
      const ox = obs.refX + p.dx;
      if (pL < ox+p.hw && pR > ox-p.hw && pT < p.cy+p.hh && pB > p.cy-p.hh) return true;
    }
    return false;
  }

  private triggerGameOver(): void {
    this.isOver = true;
    this.legTimer?.remove();
    this.obstacleTimer?.remove();
    this.collectibleTimer?.remove();
    endRun();
    this.tweens.add({
      targets: this.playerContainer, alpha: 0, duration: 75, yoyo: true, repeat: 3,
      onComplete: () => { this.time.delayedCall(300, () => this.scene.start('GameOverScene')); },
    });
  }

  update(_time: number, delta: number): void {
    if (this.isOver) return;
    const dt = delta / 1000;

    this.playerVY += this.gravity * dt;
    this.playerY  += this.playerVY * dt;
    const groundLevel = this.groundY - PLAYER_H / 2;
    if (this.playerY >= groundLevel) {
      this.playerY = groundLevel; this.playerVY = 0;
      if (!this.isOnGround) { this.jumpsUsed = 0; this.isOnGround = true; this.updateJumpDots(); }
    } else { this.isOnGround = false; }
    this.playerContainer.setY(this.playerY);

    for (const t of this.groundTicks) {
      t.x -= this.currentSpeed * dt;
      if (t.x < -20) t.x += 58 * 16;
    }
    for (const c of this.clouds) {
      c.gfx.x -= c.speed * dt;
      if (c.gfx.x + c.totalW < -10) c.gfx.x = this.gameW + 15;
    }
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.refX -= this.currentSpeed * dt;
      for (const p of obs.parts) p.gfx.x = obs.refX + p.dx;
      const leftEdge = Math.min(...obs.parts.map(p => obs.refX + p.dx - p.hw));
      if (leftEdge < -90) { obs.parts.forEach(p => p.gfx.destroy()); this.obstacles.splice(i, 1); continue; }
      if (this.checkCollision(obs)) { this.triggerGameOver(); return; }
    }
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      if (c.collected) { if (!c.container.active) this.collectibles.splice(i, 1); continue; }
      c.x -= this.currentSpeed * dt;
      c.container.x = c.x;
      if (c.x < -70) { c.container.destroy(); this.collectibles.splice(i, 1); continue; }
      if (Math.abs(PLAYER_X - c.x) < 28 && Math.abs(this.playerY - c.baseY) < 28) this.collectItem(c);
    }

    this.scoreAccum += delta;
    if (this.scoreAccum >= 100) {
      const pts = Math.floor(this.scoreAccum / 100);
      this.score += pts; this.scoreAccum %= 100;
      addScore(pts);
      this.scoreText.setText(`SCORE: ${this.score}`);
      this.hiScoreText.setText(`BEST: ${getState().highScore}`);
    }
    this.currentSpeed = Math.min(this.baseSpeed * 3, this.baseSpeed + Math.floor(this.score / 200) * 8);
  }

  shutdown(): void {
    this.obstacles = [];
    this.groundTicks = [];
    this.clouds = [];
    this.jumpDots = [];
    this.collectibles = [];
  }
}
