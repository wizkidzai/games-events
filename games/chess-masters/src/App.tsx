import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { initFromCard } from './systems/gameState';

const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  backgroundColor: '#0d0d1a',
  scene: [MenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 900,
    height: 600,
  },
  audio: { noAudio: true },
  antialias: true,
  roundPixels: false,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Demo card data — replaced by real RFID read at booth startup
  useEffect(() => {
    initFromCard('demo-uid-001', 0, 'Peacock Pride', 350);
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({ ...GAME_CONFIG, parent: containerRef.current });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0d0d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
