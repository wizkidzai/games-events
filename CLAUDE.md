# CLAUDE.md — Wiz Kidz Games

## Project Overview

This is the **Wiz Kidz Games** monorepo. It contains interactive booth games for kids, using RFID cards (NTAG213), React, TypeScript, Phaser 3, and Tailwind CSS.

## MANDATORY: Read These Documents First

Before doing ANY work in this repository, read these three spec documents in order:

1. [00-agents-booth-global.md](./00-agents-booth-global.md) — Universal standards (design system, RFID card architecture, game registry, security/COPPA rules)
2. [01-agents-booth-game.md](./01-agents-booth-game.md) — Game-specific architecture (three-scene structure, card I/O, input abstraction, state management)
3. [02-agents-booth-utils.md](./02-agents-booth-utils.md) — Admin tools & post-booth infrastructure (card configurator app, score page)

## Stack

- **Runtime**: Node.js 18+, pnpm 8+
- **Frontend**: React 18, TypeScript 5, Tailwind CSS 3
- **Game Engine**: Phaser 3.80+
- **Build**: Vite 5
- **Test**: Vitest (unit), Playwright (E2E)
- **Package manager**: pnpm (workspaces monorepo)

## Monorepo Structure

```
apps/
  booth-kiosk/          — Main kiosk app (game launcher + main menu)
  admin-card-config/    — Admin tool to configure NTAG213 RFID cards
games/
  memory-game/          — Sequence memory game (mascotID=1, Orchid Mantis)
packages/
  design-system/        — CSS tokens, Tailwind colors, shared UI components
  mascot-system/        — Mascot metadata, personalities, dialogue
  card-io/              — NTAG213 RFID read/write logic
  analytics/            — Session tracking (30-min inactivity timeout)
  ai-models/            — Hugging Face Transformers.js wrapper
public/
  gameRegistry.json     — All games + metadata (update when adding games)
  cardDataStructure.json — NTAG213 byte layout (shared between admin + game apps)
```

## Common Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all game dev servers
pnpm dev:kiosk            # Start booth kiosk only
pnpm dev:admin            # Start admin card configurator
pnpm test                 # Run unit tests
pnpm lint                 # ESLint check
pnpm build                # Build all packages
pnpm create-game <name> --mascot <0-5> --ageGroups <0,1,2>  # Scaffold new game
```

## Critical Rules (Do NOT Violate)

1. **RFID card is NOT game input** — Card is read once at start (identity + score), written once at end (score update). Never use it for game interaction.
2. **No PII** — Do not store names, emails, device IDs, or location. COPPA applies to all games.
3. **No backend** — All data lives on the NTAG213 card. No server calls except CDN for AI models.
4. **Mascot-to-game locking** — Each game is locked to one mascot. `game.mascotID` must match `card.mascotID` to launch.
5. **Light mode default** — Games default to light mode; respect `prefers-color-scheme: dark` for automatic dark mode.
6. **Always update `gameRegistry.json`** when creating a new game.
7. **Escalate to Pari** before making architectural changes or scope decisions.
8. **Escalate to Laila (via Pari)** before adding AI text generation, multiplayer, third-party SDKs, or any new data collection.

## Adding a New Game

1. Run `pnpm create-game <game-id> --mascot <0-5> --ageGroups <0,1,2>`
2. Follow the scaffolded boilerplate in `games/<game-id>/`
3. Implement game logic in `src/scenes/GameScene.ts`
4. `gameRegistry.json` is auto-updated by the scaffold script

## Design System Colors

| Name | Hex | Use |
|------|-----|-----|
| Peacock Pride | `#006464` | Primary teal, buttons |
| Orchid Mantis | `#A30078` | Primary magenta |
| Yellow Fawn | `#FFC832` | Accents, medium difficulty |
| Blue Jay | `#0AA4EB` | Sky blue |
| Red Fox | `#FF4747` | Red-orange, hard difficulty |
| Green Frog | `#43A277` | Jungle green, easy difficulty |

## Terminal Command Consent

The following commands require explicit user confirmation before running:
- `rm -rf` (file deletion)
- `git push` (remote push)
- `npm uninstall` / `pnpm remove` (dependency removal)
- `git reset --hard` (history rewrite)

All other common commands (`install`, `build`, `test`, `lint`, `dev`, `git add`, `git commit`) do NOT require confirmation.
