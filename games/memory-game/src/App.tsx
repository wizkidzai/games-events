import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { initFromCard } from './systems/gameState';
import { resolveTheme } from './utils/theme';

const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#0d0d1a',
  scene: [MenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: { noAudio: true },
  antialias: true,
  roundPixels: false,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [theme, setTheme] = useState(() => resolveTheme());

  // Demo card data — replaced by real RFID read at booth startup
  useEffect(() => {
    initFromCard('demo-uid-002', 1, 'Orchid Mantis', 0);
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({ ...GAME_CONFIG, parent: containerRef.current });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const update = () => setTheme(resolveTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('wizkidz-theme-change', update);
    mq.addEventListener('change', update);
    return () => {
      window.removeEventListener('wizkidz-theme-change', update);
      mq.removeEventListener('change', update);
    };
  }, []);

  const base = import.meta.env.BASE_URL;
  const logoSrc = theme === 'dark' ? `${base}wizkidz-logo-white.png` : `${base}wizkidz-logo-teal.png`;
  const symbolSrc = theme === 'dark' ? `${base}wizkidz-symbol-white.png` : `${base}wizkidz-symbol-teal.png`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d0d1a', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <picture style={{ position: 'absolute', top: 14, left: 14, zIndex: 20, pointerEvents: 'none' }}>
        <source media="(max-width: 480px)" srcSet={symbolSrc} />
        <img src={logoSrc} alt="Wiz Kidz" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
      </picture>
    </div>
  );
}
