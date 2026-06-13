import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { getState, subscribe, initFromCard } from './systems/gameState';
import { getMascotByID } from '@wizkidz/mascot-system';
import type { GameState, MascotAnimation } from './systems/types';

const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  backgroundColor: '#FAFAFA',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scene: [MenuScene, GameScene, GameOverScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  antialias: true,
};

const ANIM_EMOJI: Record<MascotAnimation, string> = {
  idle: '🦋', happy: '🎉', confused: '🤔', sad: '😔', celebrating: '🏆',
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [uiState, setUiState] = useState<GameState>(getState());

  useEffect(() => { initFromCard('demo-uid-002', 1, 'Orchid Mantis', 0); }, []);
  useEffect(() => subscribe(setUiState), []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({ ...GAME_CONFIG, parent: containerRef.current });
    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, []);

  const mascot = getMascotByID(uiState.mascotID);

  return (
    <div className="relative w-full min-h-screen bg-[#FAFAFA]">
      {uiState.isGameActive && (
        <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-20" aria-live="polite">
          <span className="font-bold text-wk-magenta text-lg">Memory Game</span>
          <span className="font-semibold text-gray-700">Score: <strong className="text-wk-magenta">{uiState.gameScore}</strong></span>
          <span className="text-sm text-gray-500">Round <span className="font-semibold">{uiState.currentRound + 1}</span></span>
        </div>
      )}
      <div ref={containerRef} className="w-full flex justify-center pt-12" />
      <div className="fixed bottom-6 left-6 z-20 flex items-end gap-3" role="status" aria-live="polite">
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-4xl shadow-lg border-4" style={{ borderColor: mascot.color, background: `${mascot.color}22` }}>
          {ANIM_EMOJI[uiState.mascotAnimation]}
        </div>
        {uiState.mascotDialogue && (
          <div className="max-w-[200px] bg-white rounded-xl shadow-md px-4 py-2 text-sm text-gray-700 border border-gray-100 mb-2" style={{ borderLeft: `3px solid ${mascot.color}` }}>
            {uiState.mascotDialogue}
          </div>
        )}
      </div>
    </div>
  );
}
