import React from 'react';
import type { GameState } from '../systems/types';

interface Props {
  state: GameState;
}

export default function GameHUD({ state }: Props) {
  if (!state.isGameActive) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-20"
      aria-live="polite"
      aria-label="Game HUD"
    >
      <span className="font-bold text-wk-teal text-lg">Chess Masters</span>
      <span className="font-semibold text-gray-700">
        Score: <strong className="text-wk-teal">{state.gameScore}</strong>
      </span>
      <span className="text-sm text-gray-500">
        Difficulty: <span className="font-semibold capitalize">{state.difficulty}</span>
      </span>
    </div>
  );
}
