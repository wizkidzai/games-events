#!/usr/bin/env node
/**
 * create-game.js — scaffold a new Wiz Kidz booth game
 * Usage: node scripts/create-game.js <game-id> --mascot <0-5> --ageGroups <0,1,2>
 * Example: node scripts/create-game.js logic-maze --mascot 0 --ageGroups 1,2
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MASCOTS = [
  { id: 0, name: 'Peacock Pride', color: '#006464', personality: 'Inventor' },
  { id: 1, name: 'Orchid Mantis', color: '#A30078', personality: 'Coder' },
  { id: 2, name: 'Red Fox', color: '#FF4747', personality: 'Explorer' },
  { id: 3, name: 'Green Frog', color: '#43A277', personality: 'Mentor' },
  { id: 4, name: 'Yellow Fawn', color: '#FFC832', personality: 'Cheerleader' },
  { id: 5, name: 'Blue Jay', color: '#0AA4EB', personality: 'Engineer' },
];

const AGE_LABELS = { 0: '7-10 years', 1: '10-16 years', 2: '16+ years' };

// --- Parse args ---
const args = process.argv.slice(2);
const gameId = args[0];
if (!gameId || gameId.startsWith('--')) {
  console.error('Usage: node scripts/create-game.js <game-id> --mascot <0-5> --ageGroups <0,1,2>');
  process.exit(1);
}

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const mascotArg = getArg('--mascot');
const ageGroupsArg = getArg('--ageGroups');

if (mascotArg === null || ageGroupsArg === null) {
  console.error('Missing required flags: --mascot and --ageGroups');
  process.exit(1);
}

const mascotID = parseInt(mascotArg, 10);
const ageGroups = ageGroupsArg.split(',').map(Number);

if (mascotID < 0 || mascotID > 5 || isNaN(mascotID)) {
  console.error('Mascot ID must be 0-5');
  process.exit(1);
}

const mascot = MASCOTS[mascotID];
const gameName = gameId
  .split('-')
  .map(w => w[0].toUpperCase() + w.slice(1))
  .join(' ');
const gameDir = resolve(ROOT, 'games', gameId);
const primaryColor = mascot.color.replace('#', '');

if (existsSync(gameDir)) {
  console.error(`Game directory already exists: games/${gameId}`);
  process.exit(1);
}

// --- Create directory structure ---
const dirs = [
  gameDir,
  `${gameDir}/src/scenes`,
  `${gameDir}/src/components`,
  `${gameDir}/src/systems`,
  `${gameDir}/src/assets/sprites`,
  `${gameDir}/src/assets/audio`,
  `${gameDir}/src/assets/images`,
  `${gameDir}/src/styles`,
  `${gameDir}/tests`,
  `${gameDir}/public`,
];
dirs.forEach(d => mkdirSync(d, { recursive: true }));

// --- Write files ---
function write(relPath, content) {
  writeFileSync(resolve(gameDir, relPath), content, 'utf-8');
}

write('package.json', JSON.stringify({
  name: gameId,
  version: '1.0.0',
  private: true,
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc && vite build',
    preview: 'vite preview',
    test: 'vitest run',
  },
  dependencies: {
    '@wizkidz/card-io': 'workspace:*',
    '@wizkidz/design-system': 'workspace:*',
    '@wizkidz/mascot-system': 'workspace:*',
    '@wizkidz/analytics': 'workspace:*',
    phaser: '^3.80.1',
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  },
  devDependencies: {
    '@types/react': '^18.3.0',
    '@types/react-dom': '^18.3.0',
    '@vitejs/plugin-react': '^4.3.0',
    autoprefixer: '^10.4.19',
    postcss: '^8.4.38',
    tailwindcss: '^3.4.4',
    typescript: '^5.4.5',
    vite: '^5.2.12',
    vitest: '^1.6.0',
  },
}, null, 2));

write('tsconfig.json', JSON.stringify({
  extends: '../../tsconfig.base.json',
  compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } },
  include: ['src'],
}, null, 2));

write('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  base: '/games/${gameId}/',
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { outDir: 'dist' },
});
`);

write('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'wk-teal': '#006464', 'wk-magenta': '#A30078', 'wk-yellow': '#FFC832',
        'wk-blue': '#0AA4EB', 'wk-red': '#FF4747', 'wk-green': '#43A277',
        'game-primary': '${mascot.color}',
      },
    },
  },
  plugins: [],
};
`);

write('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${gameName} — Wiz Kidz</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="theme-light">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

write('src/systems/types.ts', `export type Difficulty = 'easy' | 'medium' | 'hard';
export type SceneName = 'MenuScene' | 'GameScene' | 'GameOverScene';
export type MascotAnimation = 'idle' | 'happy' | 'confused' | 'sad' | 'celebrating';
export interface LeaderboardEntry { gameScore: number; totalScore: number; difficulty: string; timestamp: string; }
export interface GameState {
  cardUID: string; mascotID: number; mascotName: string; cardScorePrevious: number;
  currentScene: SceneName; gameScore: number; totalScore: number; level: number;
  difficulty: Difficulty; isGameActive: boolean; isGameOver: boolean;
  leaderboardScores: LeaderboardEntry[]; mascotAnimation: MascotAnimation; mascotDialogue: string;
  maxInactivityMinutes: number; lastActivityTime: number;
}
export const INITIAL_GAME_STATE: GameState = {
  cardUID: '', mascotID: ${mascotID}, mascotName: '${mascot.name}', cardScorePrevious: 0,
  currentScene: 'MenuScene', gameScore: 0, totalScore: 0, level: 1, difficulty: 'medium',
  isGameActive: false, isGameOver: false, leaderboardScores: [], mascotAnimation: 'idle', mascotDialogue: '',
  maxInactivityMinutes: 30, lastActivityTime: Date.now(),
};
`);

write('src/scenes/MenuScene.ts', `import Phaser from 'phaser';
import { getMascotByID } from '@wizkidz/mascot-system';
import { getState, setDifficulty, startGame } from '../systems/gameState';
import type { Difficulty } from '../systems/types';
const MASCOT_ID = ${mascotID};
export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }
  create(): void {
    const { width } = this.scale;
    const mascot = getMascotByID(MASCOT_ID);
    const state = getState();
    void state;
    this.cameras.main.setBackgroundColor('#FAFAFA');
    this.add.text(width / 2, 80, '${gameName}', { fontSize: '42px', fontFamily: 'Poppins', color: '${mascot.color}', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(width / 2, 160, mascot.greeting, { fontSize: '18px', fontFamily: 'Poppins', color: '#2D2D2D', wordWrap: { width: 500 }, align: 'center' }).setOrigin(0.5);
    // TODO: Add difficulty selector, instructions, start button
    const startBtn = this.add.rectangle(width / 2, 400, 220, 50, 0x${primaryColor}).setInteractive({ cursor: 'pointer' });
    this.add.text(width / 2, 400, 'Start Game →', { fontSize: '18px', fontFamily: 'Poppins', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    startBtn.on('pointerup', () => { setDifficulty('medium'); startGame(); this.scene.start('GameScene'); });
    this.input.keyboard?.once('keydown-ENTER', () => { startGame(); this.scene.start('GameScene'); });
  }
}
`);

write('src/scenes/GameScene.ts', `import Phaser from 'phaser';
import { addPoints, endGame } from '../systems/gameState';
// TODO: Implement full game logic for ${gameName}
export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#FAFAFA');
    this.add.text(width / 2, height / 2 - 30, '${gameName}', { fontSize: '28px', fontFamily: 'Poppins', color: '#2D2D2D' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 10, 'TODO: Implement game loop here', { fontSize: '14px', fontFamily: 'Poppins', color: '#9ca3af' }).setOrigin(0.5);
    // Demo: click to score and end game
    const demoBtn = this.add.rectangle(width / 2, height / 2 + 70, 200, 48, 0x${primaryColor}).setInteractive({ cursor: 'pointer' });
    this.add.text(width / 2, height / 2 + 70, 'Complete Game', { fontSize: '16px', fontFamily: 'Poppins', color: '#fff' }).setOrigin(0.5);
    demoBtn.on('pointerup', () => { addPoints(100); endGame(true); this.scene.start('GameOverScene'); });
    this.input.keyboard?.once('keydown-ESCAPE', () => this.scene.start('MenuScene'));
  }
}
`);

write('src/scenes/GameOverScene.ts', `import Phaser from 'phaser';
import { getState, resetSession } from '../systems/gameState';
export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }
  create(): void {
    const { width, height } = this.scale;
    const state = getState();
    this.cameras.main.setBackgroundColor('#FAFAFA');
    this.add.text(width / 2, 80, 'Game Over!', { fontSize: '42px', fontFamily: 'Poppins', color: '${mascot.color}', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(width / 2, 140, \`Score: \${state.gameScore} pts\`, { fontSize: '24px', fontFamily: 'Poppins', color: '#2D2D2D' }).setOrigin(0.5);
    this.add.text(width / 2, 180, \`Total: \${state.totalScore} pts\`, { fontSize: '18px', fontFamily: 'Poppins', color: '#374151' }).setOrigin(0.5);
    const playAgain = this.add.rectangle(width / 2 - 110, height - 80, 180, 48, 0x${primaryColor}).setInteractive({ cursor: 'pointer' });
    this.add.text(width / 2 - 110, height - 80, 'Play Again', { fontSize: '16px', fontFamily: 'Poppins', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    playAgain.on('pointerup', () => this.scene.start('MenuScene'));
    const newCard = this.add.rectangle(width / 2 + 110, height - 80, 180, 48, 0x555555).setInteractive({ cursor: 'pointer' });
    this.add.text(width / 2 + 110, height - 80, 'New Card', { fontSize: '16px', fontFamily: 'Poppins', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    newCard.on('pointerup', () => { resetSession(); this.scene.start('MenuScene'); });
  }
}
`);

write('src/main.tsx', `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@wizkidz/design-system/tokens.css';
import '@wizkidz/design-system/themes/light.css';
import './styles/game.css';
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
`);

write('src/App.tsx', `import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, width: 900, height: 600, backgroundColor: '#FAFAFA',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scene: [MenuScene, GameScene, GameOverScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  antialias: true,
};
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({ ...GAME_CONFIG, parent: containerRef.current });
    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, []);
  return <div ref={containerRef} className="w-full min-h-screen bg-[#FAFAFA]" />;
}
`);

write('src/styles/game.css', `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n* { box-sizing: border-box; }\nbody { margin: 0; font-family: var(--font-ui); }\n`);

write('tests/gameLogic.test.ts', `import { describe, it, expect, beforeEach } from 'vitest';
// TODO: import game-specific logic and write tests
describe('${gameName} — Game Logic', () => {
  beforeEach(() => {});
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
`);

// --- Update gameRegistry.json ---
const registryPath = resolve(ROOT, 'public', 'gameRegistry.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
const description = `Play ${gameName} with ${mascot.name}`;
registry.games.push({
  id: gameId,
  name: gameName,
  description,
  mascotID,
  ageGroups,
  difficulty: ['easy', 'medium', 'hard'],
  estimatedPlaytime: 120,
  featured: false,
});
registry.lastUpdated = new Date().toISOString().slice(0, 10);
writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');

// --- Done ---
console.log(`
✓ Created games/${gameId}/
✓ Updated public/gameRegistry.json

Game Details:
  Name:       ${gameName}
  Mascot:     ${mascot.name} (ID=${mascotID}, ${mascot.personality})
  Age Groups: ${ageGroups.map(ag => AGE_LABELS[ag]).join(', ')}
  Color:      ${mascot.color}

Next steps:
  1. cd games/${gameId}
  2. pnpm install
  3. pnpm dev
  4. Open src/scenes/GameScene.ts to implement your game logic

Refer to 01-agents-booth-game.md for architecture patterns.
`);
