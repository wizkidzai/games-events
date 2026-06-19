import Phaser from 'phaser';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'wizkidz-theme';

export function getThemeMode(): ThemeMode {
  try { return (localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? 'light'; }
  catch { return 'light'; }
}
export function setThemeMode(m: ThemeMode): void {
  try { localStorage.setItem(STORAGE_KEY, m); } catch { /**/ }
  window.dispatchEvent(new CustomEvent('wizkidz-theme-change'));
}
export function cycleTheme(): ThemeMode {
  const order: ThemeMode[] = ['light', 'dark', 'system'];
  const next = order[(order.indexOf(getThemeMode()) + 1) % 3];
  setThemeMode(next);
  return next;
}
export function resolveTheme(): 'light' | 'dark' {
  const m = getThemeMode();
  if (m !== 'system') return m;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  catch { return 'light'; }
}

const ICON: Record<ThemeMode, string> = { light: '☀', dark: '☾', system: '⊙' };

export function addThemeToggle(scene: Phaser.Scene, isDark: boolean): void {
  const { width, height } = scene.scale;
  const mode = getThemeMode();
  const W = 76, H = 24;
  const tx = width - W - 6, ty = height - H - 6;

  const bg = scene.add.graphics().setDepth(50);
  bg.fillStyle(isDark ? 0x000000 : 0xffffff, isDark ? 0.45 : 0.65);
  bg.fillRoundedRect(tx, ty, W, H, 7);

  scene.add.text(tx + W / 2, ty + H / 2, `${ICON[mode]} ${mode.toUpperCase()}`, {
    fontSize: '11px', fontFamily: 'Poppins, sans-serif',
    color: isDark ? '#aabbcc' : '#2a3a60', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(51);

  scene.add.zone(tx + W / 2, ty + H / 2, W, H)
    .setInteractive({ useHandCursor: true }).setDepth(52)
    .on('pointerdown', () => { cycleTheme(); scene.scene.restart(); });
}
