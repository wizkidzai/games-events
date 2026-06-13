import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { getState, subscribe, initFromCard } from './systems/gameState';
import { getMascotByID } from '@wizkidz/mascot-system';
import GameHUD from './components/GameHUD';
import MascotContainer from './components/MascotContainer';
import type { GameState } from './systems/types';

const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  backgroundColor: '#FAFAFA',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scene: [MenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: { noAudio: false },
  antialias: true,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [uiState, setUiState] = useState<GameState>(getState());

  // Demo: load card data — in production this comes from the RFID reader
  useEffect(() => {
    initFromCard('demo-uid-001', 0, 'Peacock Pride', 350);
  }, []);

  useEffect(() => {
    const unsub = subscribe(setUiState);
    return unsub;
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({ ...GAME_CONFIG, parent: containerRef.current });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const mascot = getMascotByID(uiState.mascotID);

  return (
    <div className="relative w-full min-h-screen bg-[#FAFAFA]">
      <GameHUD state={uiState} />
      <div ref={containerRef} className="w-full flex justify-center pt-12" />
      <MascotContainer
        mascotID={uiState.mascotID}
        animation={uiState.mascotAnimation}
        dialogue={uiState.mascotDialogue}
        color={mascot.color}
      />
    </div>
  );
}
