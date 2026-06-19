# Wiz Kidz Games

Interactive booth games for kids, designed to run on a kiosk with a single big button (Enter key). Players use RFID cards (NTAG213) to carry their identity and scores between sessions — no backend, no accounts, no PII.

## Games

| Game | Description | Mascot |
|------|-------------|--------|
| **Mascot Runner** | Infinite side-scrolling runner — jump over obstacles, collect Wiz Kidz logos for bonus points, beat your high score | Any mascot |
| **Memory Game** | Sequence memory challenge — replay the mascot pattern | Orchid Mantis |

## Stack

- **Runtime**: Node.js 18+, pnpm 8+
- **Frontend**: React 18, TypeScript 5, Tailwind CSS 3
- **Game engine**: Phaser 3.80+
- **Build**: Vite 5
- **Tests**: Vitest (unit), Playwright (E2E)

## Monorepo Structure

```
apps/
  booth-kiosk/          — Main kiosk launcher (game menu)
  admin-card-config/    — Admin tool to configure RFID cards
games/
  mascot-runner/        — Infinite runner game
  memory-game/          — Sequence memory game
packages/
  design-system/        — Shared UI components, Tailwind tokens, CSS
  mascot-system/        — Mascot metadata and personalities
  card-io/              — NTAG213 RFID read/write logic
  analytics/            — Session tracking (30-min inactivity timeout)
  ai-models/            — Hugging Face Transformers.js wrapper
public/
  gameRegistry.json     — Game catalogue (update when adding a game)
  cardDataStructure.json — NTAG213 byte layout shared across apps
```

## Prerequisites

Install [Node.js 18+](https://nodejs.org) and [pnpm 8+](https://pnpm.io/installation):

```bash
npm install -g pnpm
```

## Setup

```bash
# Clone the repo
git clone https://github.com/wizkidzai/games.git
cd games

# Install all dependencies
pnpm install
```

## Running in Development

### All games at once

```bash
pnpm dev
```

Each game starts on its own Vite dev server (ports assigned automatically). Open the URL printed in the terminal for each game.

### Individual targets

```bash
# Mascot Runner game only
pnpm --filter mascot-runner dev

# Memory Game only
pnpm --filter memory-game dev

# Booth kiosk launcher (http://localhost:5173)
pnpm dev:kiosk

# Admin card configurator (http://localhost:5174)
pnpm dev:admin
```

### Wiz Kidz logo (Mascot Runner)

The runner game supports a real logo image. Drop your PNG at:

```
games/mascot-runner/public/wizkidz-logo.png
```

If the file is absent the game automatically uses a gold "WZ" badge as a fallback — no code change needed.

## Building for Production

```bash
# Build every app and game
pnpm build
```

Built files land in each package's `dist/` directory. Deploy them to any static host (CDN, nginx, etc.).

## Testing

```bash
# Run all unit tests (Vitest)
pnpm test

# Watch mode
pnpm test:watch

# End-to-end tests (Playwright — requires a running dev server)
pnpm test:e2e
```

## Linting & Formatting

```bash
pnpm lint          # ESLint check
pnpm lint:fix      # Auto-fix lint errors
pnpm format        # Prettier write
pnpm format:check  # Prettier check (used in CI)
```

## Adding a New Game

Use the scaffold script — it wires up the boilerplate and updates `gameRegistry.json` automatically:

```bash
pnpm create-game <game-id> --mascot <0-5> --ageGroups <0,1,2>
```

Then implement your game logic in `games/<game-id>/src/scenes/GameScene.ts`.

## Booth Hardware

The kiosk runs on a single-button input device that sends the **Enter** key. All game flows are designed around this constraint:

- **Menu**: auto-cycles through mascots every 1.5 s — press Enter any time to start with the highlighted mascot
- **In game**: Enter = jump (Space also works in dev)
- **Game over**: press Enter to return to the menu

RFID cards are read once at session start (identity + previous score) and written once at session end (updated score). Cards are never used as game input.

## Design System Colors

| Token | Hex | Use |
|-------|-----|-----|
| Peacock Pride | `#006464` | Primary teal, buttons |
| Orchid Mantis | `#A30078` | Primary magenta |
| Yellow Fawn | `#FFC832` | Accents, collectibles |
| Blue Jay | `#0AA4EB` | Sky blue |
| Red Fox | `#FF4747` | Hard difficulty |
| Green Frog | `#43A277` | Easy difficulty |

## CI

GitHub Actions runs on every push and pull request:

- **Lint** — ESLint + Prettier check
- **Unit tests** — Vitest across all packages
- **Build** — full production build

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for details.
