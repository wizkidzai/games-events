# 00-agents-booth-global.md
## Universal Standards for Wiz Kidz Conference Booth Games (FINAL)

**Purpose:** This document defines universal standards, design system, NTAG213 card architecture, game registry, hardware input standards, and framework baseline for all Wiz Kidz conference booth games. All games inherit these standards and extend them via Layer 01.

**Who this is for:** Developers, AI agents (Claude, Gemini, Copilot), and maintainers building or extending Wiz Kidz games.

**Key principle:** This layer defines the foundation once. Games (Layer 01) extend it without reimplementing it.

---

## 1. Design System

### 1.1 Color Palette

**Primary Colors** (brand identity):
- **Peacock Pride**: `#006464` (teal) — calm, curiosity, confidence
- **Orchid Mantis**: `#A30078` (magenta) — empathy, collaboration, energy

**Secondary Colors** (mascots & accents):
- **Yellow Fawn**: `#FFC832` (yellow) — joy, optimism, cheerfulness
- **Blue Jay**: `#0AA4EB` (sky blue) — clarity, logic, knowledge
- **Red Fox**: `#FF4747` (red-orange) — adventure, energy, courage
- **Green Frog**: `#43A277` (jungle green) — balance, growth, nature

**Neutral Colors** (typography & backgrounds):
- **Jet** (dark): `#2D2D2D`
- **Seasalt** (light): `#FAFAFA`

### 1.2 Theme Strategy: System Preference Detection

Games **default to dark mode** respecting OS preference:
- Detect `prefers-color-scheme: dark` via CSS or JavaScript
- Light mode: Seasalt background (`#FAFAFA`), Jet text (`#2D2D2D`)
- Dark mode: Jet background (`#2D2D2D`), Seasalt text (`#FAFAFA`)
- Accent colors remain saturated in both themes (no darkening required)
- Optional: Include a theme toggle button for manual override

**CSS Variable Convention:**
```
--color-primary-teal: #006464
--color-primary-magenta: #A30078
--color-secondary-yellow: #FFC832
--color-secondary-blue: #0AA4EB
--color-secondary-red: #FF4747
--color-secondary-green: #43A277
--color-text-dark: #2D2D2D
--color-text-light: #FAFAFA
--color-bg-light: #FAFAFA
--color-bg-dark: #2D2D2D
```

Apply theme via root-level class:
```html
<body class="theme-dark"> or <body class="theme-light">
```

### 1.3 Typography

**Font Stack** (in order of preference):
- Primary headings: `Gill Sans Display`
- UI & body text: `Poppins`
- Secondary/fallback: `Outfit`
- System fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Scale Guidance** (relative sizing, not pixel-locked):
- Headings: Large (2.5x), Medium (2x), Small (1.5x)
- Body: Regular (1x), Small (0.875x)
- Minimum font size: 14px (accessibility)
- Line height: 1.5 (body), 1.2 (headings)

### 1.4 Spacing

**8px Base Unit:**
- 4px (half unit) — tight spacing
- 8px — default padding/margin
- 16px, 24px, 32px, 48px — larger spacings
- Use consistent multiples throughout

### 1.5 Components Checklist

Games must implement these interactive elements with consistent styling:
- **Button** — primary (Peacock Pride), secondary (gray), disabled state, hover/active feedback
- **Input** — text, number, select; focus state, error state
- **Card** — container with subtle shadow, rounded corners
- **Modal/Dialog** — overlay, close button, keyboard escape support
- **Leaderboard Display** — session UUID, score, timestamp
- **Mascot Container** — consistent size, idle animation, reaction states

### 1.6 Mascot Visual Guidelines

Each game is assigned **one mascot** (locked assignment per game in game registry). Mascots are animated characters that:
- Guide players through the game
- React to player actions (success, failure, milestone)
- Display personality through poses and expressions
- Appear in header/footer or as helper character

**Visual Requirements:**
- **Size**: 120px × 120px (default display), scalable to 80–240px
- **Format**: PNG with transparency (SVG acceptable for branding elements)
- **Animation States**: idle (loop), happy, confused, sad, celebrating
- **Color consistency**: Mascot primary color should match game theme
- **Accessibility**: Alt text for static use; descriptive labels for animated states

**Mascot Personalities:**
- Peacock Pride (Teal): Inventor — curious, technical, encouraging
- Orchid Mantis (Magenta): Coder — smart, empathetic, supportive
- Red Fox (Red-Orange): Explorer — adventurous, quick, bold
- Green Frog (Green): Mentor — calm, wise, patient
- Yellow Fawn (Yellow): Cheerleader — upbeat, motivating, energetic
- Blue Jay (Sky Blue): Engineer — logical, precise, analytical

---

## 2. NTAG213 Card System (RFID)

### 2.1 Hardware Specification

- **Card Type:** ISO 14443A NFC cards (passive)
- **Chip:** NTAG213 (48 bytes total, 180 bytes EEPROM available)
- **Reader:** ACR122U (USB HID device)
- **Cards Printed:** 6 mascot designs (one per card), RFID chip inside, QR code printed linking to wizkidz.ai
- **Each Card:** Physical collectible giveaway + score keeper (stores Mascot ID, Unique ID, Total Points)

### 2.2 Card Data Structure (7 Bytes Used)

```
NTAG213 User Memory Layout:
─────────────────────────────────────────────────────
Byte 0:      Mascot ID (0-5)
             0 = Peacock Pride
             1 = Orchid Mantis
             2 = Red Fox
             3 = Green Frog
             4 = Yellow Fawn
             5 = Blue Jay

Bytes 1-4:   Unique Card ID (4 bytes)
             Pre-configured by NXP admin app
             Format: Timestamp-based + random
             Example: "20260612_a7f2" (YYYYMMDD_RAND)

Bytes 5-6:   Total Points (16-bit unsigned integer)
             Range: 0-65535
             Accumulates across all games for this mascot
             Written after each game completion

Bytes 7+:    Reserved for future use / padding
```

**Total used: 7 bytes**  
**Remaining: 173 bytes available for future expansion**

### 2.3 Unique Card ID Generation & Admin App

**Card Configuration Process:**

Agents will create and maintain a **Wiz Kidz Card Admin App** (separate from main game app) that:
1. Configures new NTAG213 cards with correct data structure
2. Generates Unique ID: `YYYYMMDD_HHMMSS_XXXX` (human-readable timestamp + random hex)
3. Writes Mascot ID to byte 0
4. Writes Unique ID to bytes 1-4
5. Initializes Total Points to 0 (bytes 5-6)
6. Verifies write success before marking card ready

**Shared Data Structure Template:**

Both **admin app** and **game app** read from common structure file (`cardDataStructure.json`):

```json
{
  "version": "1.0",
  "cardStructure": {
    "byte0": {
      "name": "mascotID",
      "type": "uint8",
      "range": "0-5",
      "description": "Mascot identifier (0=Peacock Pride, 1=Orchid Mantis, ...)"
    },
    "bytes1-4": {
      "name": "uniqueID",
      "type": "string",
      "format": "YYYYMMDD_HHMMSS_XXXX",
      "description": "Unique player identifier (timestamp + random)"
    },
    "bytes5-6": {
      "name": "totalPoints",
      "type": "uint16",
      "range": "0-65535",
      "description": "Cumulative score across all games"
    },
    "bytes7+": {
      "name": "reserved",
      "description": "Reserved for future use"
    }
  }
}
```

This ensures **version compatibility** between admin app and game app. If data structure changes, both apps update together.

**Admin App Architecture:**

```
Admin App (Electron or Web-based)
├── Card Reader Integration (ACR122U)
├── Card Configuration UI
│   ├── Select Mascot ID (0-5)
│   ├── Generate Unique ID (auto)
│   ├── Initialize Points (0)
│   └── Write to Card
├── Batch Configuration (configure 50+ cards at once)
├── Verification (read card, verify data written correctly)
└── Export CSV (log all configured cards)
```

**Example Card Configuration:**
```
Card 1:
  - Mascot ID: 0 (Peacock Pride)
  - Unique ID: "20260612_143530_a7f2"
  - Total Points: 0
  - Status: Ready for booth ✓

Card 2:
  - Mascot ID: 1 (Orchid Mantis)
  - Unique ID: "20260612_143545_b3e1"
  - Total Points: 0
  - Status: Ready for booth ✓
```

**Game App reads:** Mascot ID, Unique ID, Total Points  
**Game App writes:** Total Points only (updated after each game completion)

### 2.4 Card Lifecycle

**Booth Use - Normal Mode (RFID Available):**
```
Player arrives at booth
  ↓
Player grabs physical card (collectible, mascot artwork on front, QR code on back)
  ↓
Player scans card on ACR122U reader at booth kiosk
  ↓
Game reads: Mascot ID, Unique ID, Total Points
  ↓
Main menu loads (shows only games assigned to this mascot)
  ↓
Player selects game A → plays → earns 350 points
  ↓
Game writes: Total Points = 350 to card
  ↓
Player can:
  Option 1: Play again (same card, points accumulate)
    - Next game earned 200 points
    - Card updated: Total Points = 550
  Option 2: Play different mascot game
    - Must request new card with different mascot
    - New card = new Unique ID = new player session
    - Old card kept as collectible
  ↓
Player leaves booth with physical card(s)
```

**Booth Use - Offline Mode (RFID Unavailable):**
```
If ACR122U reader unavailable/disconnected:
  ↓
Booth admin enables "Offline Mode" via settings
  ↓
Game behavior changes:
  - Mascot restriction removed (all games playable)
  - No card read at start
  - Score tracking: Session-based leaderboard only
  - Data lost on session reset / browser close
  ↓
Once reader back online:
  Resume normal RFID mode
  (Offline sessions not synced to cards)
```

**Post-Booth Redemption & Marketing:**
```
Player scans card using personal mobile device
  (NFC reader on Android phone, or iPhone 12+)
  ↓
QR code or NFC detection auto-redirects to: https://games.wizkidz.ai/score
  ↓
Score page displays:
  ✓ Animated mascot character (based on card's Mascot ID)
  ✓ Total Score value (from card's Total Points)
  ✓ Call-to-action: "Enroll in Wiz Kidz Programs →"
  
  ✗ Does NOT display: Unique User ID (privacy)
  ✗ Does NOT store/track user device (no cookies)
  ↓
CTA button links to: https://wizkidz.ai/enroll
  (Leads to program enrollment page)
  ↓
No souvenir redemption, no score reset
  Card kept as physical collectible
  Score persists for future booth events
```

---

## 3. Game Registry Architecture

### 3.1 Game Registry File

**File Location:** `public/gameRegistry.json`

**Structure:**
```json
{
  "version": "1.0",
  "lastUpdated": "2026-06-12",
  "games": [
    {
      "id": "chess-masters",
      "name": "Chess Masters",
      "description": "Solve strategic puzzles",
      "mascotID": 0,
      "ageGroups": [1, 2],
      "difficulty": ["easy", "medium", "hard"],
      "estimatedPlaytime": 180,
      "featured": true
    },
    {
      "id": "memory-game",
      "name": "Memory Game",
      "description": "Replay the sequence of mascots",
      "mascotID": 1,
      "ageGroups": [0, 1, 2],
      "difficulty": ["easy", "medium", "hard"],
      "estimatedPlaytime": 120,
      "featured": true
    },
    {
      "id": "logic-maze",
      "name": "Logic Maze",
      "description": "Navigate using logic and strategy",
      "mascotID": 0,
      "ageGroups": [1, 2],
      "difficulty": ["easy", "medium", "hard"],
      "estimatedPlaytime": 150,
      "featured": false
    }
  ]
}
```

**Field Descriptions:**
- `id`: Unique game identifier (kebab-case, used in file system)
- `name`: Display name in menu
- `description`: One-line description for menu
- `mascotID`: Which mascot "owns" this game (0-5)
- `ageGroups`: Array of age group indices
  - 0 = "7-10 years"
  - 1 = "10-16 years"
  - 2 = "16+ years"
- `difficulty`: Always ["easy", "medium", "hard"] (built-in to all games)
- `estimatedPlaytime`: Seconds (for booth planning)
- `featured`: Boolean (highlight in main menu)

### 3.2 Adding New Games

**When developer creates a new game:**

```
npm run create-game logic-maze --mascot 0 --ageGroups 1,2
```

Agent prompts:
```
Game details:
  Name: Logic Maze
  Mascot: Peacock Pride (ID=0)
  Age groups: 10-16, 16+
  Description: Navigate using logic and strategy

Adding to gameRegistry.json...
✓ Entry added

Next: Implement game in games/logic-maze/
```

Updated `gameRegistry.json` now includes the new game. Agents must update this file when creating games.

---

## 4. Age Group System

### 4.1 Age Group Categories

All games are tagged with applicable age groups:

- **Age Group 0:** 7-10 years
  - Simpler mechanics, forgiving gameplay, vibrant colors
  - Clear, concise instructions
  - Shorter time limits (60-90 sec)
  - Encouragement-focused mascot dialogue

- **Age Group 1:** 10-16 years
  - Medium complexity, balanced challenge
  - Standard instructions
  - 90-150 sec gameplay
  - Strategy-focused mascot dialogue

- **Age Group 2:** 16+ years
  - Complex mechanics, high challenge ceiling
  - Advanced features, nuanced instructions
  - 120-180 sec gameplay
  - Technical/analytical mascot dialogue

### 4.2 Main Menu Age Filter

**On app load:**

```
User sees: "Select your age group (multi-select)"
  Options: [7-10] [10-16] [16+]
  Default: All selected

User selects age group(s)
  ↓
Load gameRegistry
  ↓
Filter games where ageGroups includes selected groups
  ↓
Display filtered games for card's mascot
```

**Example:**
```
Card mascot: Peacock Pride (ID=0)
Selected age groups: [1, 2] (10-16, 16+)

Games for Peacock Pride:
- Chess Masters (ageGroups: [1, 2]) ✓ SHOW
- Logic Maze (ageGroups: [1, 2]) ✓ SHOW
- Intro Puzzle (ageGroups: [0, 1]) ✗ HIDE (doesn't include 16+)
```

---

## 5. Monorepo Structure

### 5.1 Directory Layout

```
wizkidz-conference-games/
├── .github/
│   └── workflows/
│       ├── ci.yml                    (ESLint, tests, build check)
│       └── deploy.yml                (Deploy to GitHub Pages)
├── apps/
│   ├── booth-kiosk/                  (Main game app, runs on booth computer)
│   │   └── [game structure below]
│   └── admin-card-config/            (Admin app, configure NTAG213 cards)
│       ├── src/
│       │   ├── App.jsx               (Card reader UI)
│       │   ├── cardConfigurator.js   (NTAG213 write logic)
│       │   ├── cardValidator.js      (verify card data)
│       │   └── components/           (UI components)
│       ├── public/
│       │   └── cardDataStructure.json (shared data structure template)
│       ├── package.json
│       └── README.md
├── games/
│   ├── chess-masters/
│   │   ├── src/
│   │   │   ├── scenes/               (Phaser scenes)
│   │   │   ├── components/           (React components)
│   │   │   ├── systems/              (game state, card I/O)
│   │   │   ├── assets/               (images, sprites, audio)
│   │   │   └── App.jsx               (React entry point)
│   │   ├── tests/
│   │   ├── package.json              (per-game dependencies)
│   │   └── README.md                 (game-specific docs)
│   ├── memory-game/
│   └── [game-N]/
├── packages/
│   ├── design-system/
│   │   ├── tokens.css                (color, spacing, typography vars)
│   │   ├── components/               (shared Button, Modal, etc.)
│   │   └── themes/                   (light/dark theme CSS)
│   ├── mascot-system/
│   │   ├── mascots.json              (mascot metadata & personalities)
│   │   ├── animations/               (mascot animation definitions)
│   │   └── assets/                   (mascot PNG/SVG files)
│   ├── card-io/
│   │   ├── nfc-reader.js             (ACR122U NTAG213 I/O)
│   │   ├── cardData.js               (parse/serialize card bytes)
│   │   └── gameScore.js              (score accumulation logic)
│   ├── analytics/
│   │   └── session.js                (session tracking)
│   └── ai-models/
│       └── inference.js              (Hugging Face Transformers integration)
├── public/
│   ├── gameRegistry.json             (all games + metadata)
│   ├── cardDataStructure.json        (shared data structure template for both apps)
│   ├── mascots/                      (mascot images)
│   ├── models/                       (model metadata, streaming URIs)
│   └── favicon.ico
├── docs/
│   ├── .storybook/
│   │   └── main.js
│   ├── stories/
│   │   └── Design.stories.jsx
│   └── storybook-static/             (built output)
├── .eslintrc.cjs                     (shared lint rules)
├── .prettierrc.json                  (shared format rules)
├── vite.config.js                    (monorepo build config)
├── vitest.config.js                  (test runner config)
├── playwright.config.js              (E2E test config)
├── package.json                      (root dependencies, scripts)
├── pnpm-workspace.yaml               (or package.json workspaces)
├── .env.example                      (env template)
├── .gitignore
└── README.md                         (repo overview)
```

### 5.2 Naming Conventions

**Game Folders:** kebab-case (e.g., `chess-masters`, `memory-game`, `logic-maze`)

**React Components:** PascalCase (e.g., `GameBoard.jsx`, `LeaderboardDisplay.jsx`)

**Scenes (Phaser):** PascalCase with "Scene" suffix (e.g., `GameScene.js`, `MenuScene.js`)

**Variables/Functions:** camelCase

**Constants:** UPPER_SNAKE_CASE

**CSS Classes:** kebab-case with BEM convention (e.g., `.game-board`, `.game-board__cell--active`)

---

## 6. React + PWA Framework Baseline

### 6.1 Project Setup

**Required:**
- Node.js 18+
- pnpm (package manager, preferred for monorepos)
- React 18+
- TypeScript (required for type safety and maintainability)
- Tailwind CSS (required for consistent utility-first styling)
- Vite (build tool)
- Phaser 3.x (latest stable)

### 6.2 Service Worker & Offline-First Strategy

Games must work **offline after first load:**

1. **Service Worker Registration:** Install SW on app load, cache game assets (HTML, JS, CSS, images, models)
2. **Cache Strategy:** 
   - **Static assets** (index.html, main.js, game assets): Cache on install, serve cached version
   - **Models** (WASM, AI models): Cache on first load, serve cached version
   - **API calls** (if any): Not applicable for booth games (no backend)
3. **Reset Behavior:**
   - **Session timeout (30 min inactivity):** Clear sessionStorage, reset leaderboard display
   - **Browser close:** Hard reset (localStorage persists until manual clear or reboot)
   - **System reboot:** Hard reset (all data cleared)

### 6.3 App Shell Architecture

Games follow a consistent shell:

```
App (React root)
├── Header (branding, card greeting, age filter)
├── GameContainer (Phaser instance)
├── HUD/Overlay (score, timer, leaderboard, controls)
└── Footer (reset button, theme toggle, brand info)
```

**Responsibility Split:**
- **React**: Layout, UI controls, leaderboard display, session management, card greeting
- **Phaser**: Game loop, graphics, input handling, game state

**Communication:** React ↔ Phaser via shared state store (Context API or simple event emitter)

### 6.4 Theme Implementation (Light Mode Default)

Games **default to light mode**:

**Method 1 (Recommended):** System preference + CSS, default to light
```css
/* Light mode (default) */
body { background: #FAFAFA; color: #2D2D2D; }

/* Dark mode (if system preference) */
@media (prefers-color-scheme: dark) {
  body { background: #2D2D2D; color: #FAFAFA; }
}
```

**Method 2:** JavaScript detection + class toggle, default to light
```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.className = prefersDark ? 'theme-dark' : 'theme-light';
// Defaults to 'theme-light' if no preference detected
```

**Optional:** Add manual toggle button that overrides system preference
```javascript
localStorage.setItem('theme', 'light'); // Persist user choice
```

### 6.5 Responsive Design

Games must run on:
- **Desktop** (Windows, macOS, Linux): 1920×1080 (primary), 1280×720 (fallback)
- **Chromebook** (1366×768, 1024×768)
- **Touch devices** (tablets optional, but recommended: iOS iPad, Android tablets)

**Phaser Scaling:**
```
Phaser.scale.ScaleMode.FIT (scale to fit within window)
or
Phaser.scale.ScaleMode.RESIZE (scale with window)
```

Use CSS media queries for layout adjustments below 800px width.

---

## 7. Hardware Input Device Standards

### 7.1 Input Device Hierarchy

**PRIMARY (Priority Order):**
1. **RFID Card** (all games, identity & score keeper ONLY)
   - Player scans NTAG213 card on ACR122U reader at booth start
   - Identifies player + loads mascot + retrieves previous score
   - Card is **read-only** during gameplay (not used for game input)
   - Card is **written to** after game completion (score update)
   - Acts as: Identity provider + Score keeper + Collectible giveaway

2. **Camera** (optional per-game, if applicable)
   - Hand gesture detection (wave, point, peace sign)
   - Pose detection (arms up, dance moves)
   - Face detection (smile, blink)
   - Used for actual game input/interaction

3. **Joystick** (optional per-game)
   - Arcade-style 8-way joystick
   - USB HID standard input
   - Mapped to in-game movement/navigation
   - Used for actual game input/interaction

4. **Physical Buttons** (optional per-game)
   - Big easy buttons (accessibility-friendly)
   - Foot pedals / foot buttons (accessibility)
   - Mapped to specific keyboard characters
   - Used for actual game input/interaction

**FALLBACK (Safety Net):**
- **Keyboard** (always available, if primary input fails)
- **Gamepad** (standard USB gamepad)
- **Touchscreen** (touch input on monitor, if available)

### 7.2 Input Abstraction Layer

Games use unified input API, not device-specific code:

```javascript
// Game doesn't care WHERE input comes from
const playerAction = await inputSystem.getAction();
// Could be: RFID card tap, camera gesture, joystick push, button click, or keyboard

switch(playerAction.type) {
  case 'CONFIRM': gameScene.playerConfirm(); break;
  case 'MOVE_LEFT': gameScene.playerMove(-1); break;
  case 'MOVE_RIGHT': gameScene.playerMove(1); break;
  // ... etc
}
```

This allows seamless fallback: if RFID reader unavailable, keyboard takes over.

### 7.3 ACR122U Reader Integration

**USB HID Device:**
- Connects to booth PC/Chromebook via USB
- Detected automatically by browser via Web NFC API or USB HID API
- Passively reads NTAG213 cards when card is in range

**JavaScript Libraries:**
- `nfc-emulator` (browser NFC emulation for testing)
- `usb` npm package (Node.js USB HID access, if server-side reader needed)
- Web NFC API (native browser support, if available)

**Read Flow:**
```
Player scans card
  ↓
Reader detects card (UID triggers)
  ↓
Browser receives 'card-detected' event
  ↓
Read Mascot ID (byte 0)
  ↓
Read Unique ID (bytes 1-4)
  ↓
Read Total Points (bytes 5-6)
  ↓
Load game data for this mascot
```

---

## 8. Phaser Integration Points

### 8.1 Phaser 3.x Baseline

Use **latest stable Phaser 3.x** at time of build (currently 3.80+).

**Renderer Selection:**
- **WebGL** (default): Preferred for performance, works on all modern browsers
- **Canvas** (fallback): Use if device doesn't support WebGL or for older hardware

**Configuration Baseline:**
```
- Physics: Arcade (2D physics engine)
- Input: Pointer + Keyboard (both supported)
- Audio: Web Audio API (with fallback to HTML5 Audio)
- Scale: FIT or RESIZE (responsive)
- Render: WebGL with Canvas fallback
- Antialias: true
```

### 8.2 Game State Management

Games use a centralized game state (not in Phaser registry):
- **React Context** or simple object passed to scenes
- Contains: player score, level, mascot state, card data, leaderboard
- Updated by Phaser scenes, read by React UI
- Synced to card before session timeout

**Do not** lock game state inside Phaser scenes — keep it accessible to React.

### 8.3 Scene Lifecycle

Every game implements this basic scene structure:
1. **MenuScene** — Start screen, instructions, difficulty select
2. **GameScene** — Main gameplay loop
3. **GameOverScene** — Results, leaderboard, reset button

Scenes communicate via Phaser events or shared state object.

### 8.4 Input Handling

Games support (via abstraction layer):
- **RFID Card**: Card tap/scan triggers action
- **Camera**: Gesture/pose triggers action
- **Joystick/Buttons**: Physical input triggers action
- **Keyboard**: Fallback keyboard keys
- **Pointer/Mouse**: Click, drag (for touch & mouse)

All input must have visible feedback (visual change, sound, mascot reaction).

---

## 9. Mascot System

### 9.1 Locked Mascot-to-Game Assignment (Reference)

**This table is a REFERENCE for understanding game assignments. Agents do NOT build the games themselves.**

Each game is assigned to ONE mascot (immutable):

| Mascot | Color | Personality | Example Games |
|--------|-------|-------------|---|
| Peacock Pride | Teal | Inventor | Chess Masters, Logic Maze |
| Orchid Mantis | Magenta | Coder | Memory Game, Pattern Solver |
| Red Fox | Red-Orange | Explorer | Rescue Robot, Speed Sprint |
| Green Frog | Green | Mentor | Nature Quest, Ecosystem Builder |
| Yellow Fawn | Yellow | Cheerleader | Cheerleader Challenge, Rhythm Game |
| Blue Jay | Sky Blue | Engineer | Code Detective, Engineering Puzzle |

**How to build games:**
- Developers interact with **Layer 01 (Game Agent)** to design and build specific games
- During design phase, developer selects which mascot owns the game
- Game Agent implements the game logic, not Layer 00
- Layer 00 provides: mascot personalities, assets, messaging, theme colors
- Game Agent builds the actual gameplay, state management, input handling

**Future games:** Developers can assign new games to existing mascots or explore new combinations. Mascot-to-game mapping is fluid and grows over time.

### 9.2 Mascot Metadata File

**File Location:** `packages/mascot-system/mascots.json`

```json
{
  "mascots": [
    {
      "id": 0,
      "name": "Peacock Pride",
      "color": "#006464",
      "personality": "Inventor",
      "greeting": "Hey explorer! I'm Peacock Pride. Ready to solve some puzzles?",
      "encouragement": ["You've got this!", "Great thinking!", "Almost there..."],
      "celebration": "We did it! Fantastic work!",
      "hint": "Think about the pattern..."
    },
    {
      "id": 1,
      "name": "Orchid Mantis",
      "color": "#A30078",
      "personality": "Coder",
      "greeting": "I'm Orchid Mantis! Let's remember this sequence together.",
      "encouragement": ["You're smart!", "Try again!", "I believe in you!"],
      "celebration": "Amazing! You nailed it!",
      "hint": "Focus on the order..."
    },
    // ... others
  ]
}
```

### 9.3 Mascot Usage in Games

**Required behaviors:**
1. **Intro**: Mascot greets player (from greeting field)
2. **Guidance**: Mascot provides hints or encouragement during gameplay
3. **Reactions**: Mascot reacts to player success/failure (animation state change)
4. **Celebration**: Mascot celebrates when player completes game or reaches high score
5. **Card Greeting**: "Welcome back, Player-[UUID]! Your Peacock Pride card."

**Animation States:**
- `idle` — default loop (breathing, slight movement)
- `happy` — celebrate, thumbs up, smile
- `confused` — thinking pose, question mark
- `sad` — disappointed, head down
- `celebrating` — jump, cheer, confetti ready

---

## 10. Main Menu Architecture

### 10.1 Main Menu Flow

```
App loads
  ↓
Prompt: "Scan your RFID card"
  ↓
Card detected → read Mascot ID + Unique ID + Total Points
  ↓
Display: "Welcome back, [Mascot Name]! High score: 350 pts"
  ↓
Prompt: "Select your age group (multi-select)"
  Options: [7-10] [10-16] [16+]
  ↓
Load gameRegistry.json
  ↓
Filter games:
  - WHERE game.mascotID == card.mascotID
  - AND game.ageGroups includes selected groups
  ↓
Display filtered games
  ↓
Player selects game → Launch game
```

### 10.2 Main Menu Components

**React Components:**
- `CardGreeting` — displays mascot name + current score
- `AgeGroupSelector` — multi-select buttons (7-10, 10-16, 16+)
- `GameGrid` — filtered game list, launch buttons
- `MascotAvatar` — large mascot image, idle animation
- `SessionInfo` — session UUID, mascot name
- `ResetButton` — clear session, new card

### 10.3 Game Access Gate

**Before launching game:**
```javascript
if (card.mascotID !== game.mascotID) {
  // Card doesn't match game
  showError("You need a " + mascotName + " card to play this game!");
  return; // Don't launch
}

// Mascot matches, launch game
launchGame(game.id);
```

This prevents cheating (e.g., trying to play Peacock Pride game with Orchid Mantis card).

---

## 11. Code Quality & Standards

### 11.1 Linting & Formatting

**ESLint Rules:**
- Use `eslint:recommended` as base
- Add React plugin (`eslint-plugin-react`)
- Add accessibility plugin (`eslint-plugin-jsx-a11y`)
- Enforce no unused variables, no console logs (except errors)
- Enforce strict equality (`===` not `==`)

**Prettier:**
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas (ES5 mode)

**Pre-commit Hook:** Run eslint + prettier on all staged files (husky + lint-staged)

### 11.2 Git Workflow

**Branch naming:**
- Feature: `feature/game-name` or `feature/component-name`
- Bug fix: `fix/issue-description`
- Experiment: `exp/short-description`

**Commit messages:**
```
[type] Short description (50 chars max)

Longer explanation if needed. Reference issue #123 if applicable.

Types: feat, fix, docs, style, refactor, perf, test, chore
```

**Pull Request checklist** (template in `.github/`):
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] Accessibility tested (Tab navigation, screen reader check)
- [ ] Responsive design verified (desktop + tablet + touch)
- [ ] Mascot animations are smooth
- [ ] Leaderboard displays correctly
- [ ] Card I/O tested (read/write scores)

### 11.3 Testing Strategy

**Unit Tests (Vitest):**
- Test utility functions, React components in isolation
- Target: 70%+ coverage for game logic
- Run on every commit via GitHub Actions

**E2E Tests (Playwright):**
- Test full game flow: card scan → play → end → leaderboard
- Test reset behavior, timeout logic
- Run on PR and before deploy

**Manual Testing:**
- Offline mode (disconnect network, verify game works)
- Session reset (inactive 30 min, verify reset)
- Multiple browsers (Chrome, Firefox, Safari)
- Multiple input devices (RFID card, keyboard, gamepad)
- Card I/O (read/write scores to actual NTAG213 card)

### 11.4 Documentation Requirements

Every game must include:
1. **README.md** — Game overview, how to play, instructions for developers
2. **CONTRIBUTING.md** — Development setup (copy from repo root)
3. **Code comments** — Explain complex logic, state transitions, API usage
4. **Storybook stories** — Design system components + game-specific components

---

## 12. Security & COPPA Compliance

### 12.1 Data Protection Rules

**NO collection of:**
- Real names, email addresses, phone numbers
- Location data (GPS, IP-based)
- Biometric data (facial recognition, fingerprints)
- Device identifiers (IMEI, MAC address, etc.)
- Browsing history or cookies for tracking

**ALLOWED:**
- Card Unique ID (random, non-persistent across sessions)
- Game scores (stored on card only)
- Session duration (for timeout logic)
- Accessibility preferences (theme, text size)

### 12.2 Storage Rules

- **NTAG213 Card** — Only data stored here: Mascot ID, Unique ID, Total Points
- **localStorage** — Session data (not recommended for booth games)
- **sessionStorage** — Data cleared on tab close
- **No backend storage** — Games do not send data to any server
- **No third-party analytics** — No Google Analytics, Mixpanel, etc.

### 12.3 External Resources

**Allowed:**
- CDN for AI models (streaming WASM, weights)
- Font CDN (Google Fonts, Typekit) — use self-hosted fonts if possible

**Not allowed:**
- Embedded iframes (except critical functionality)
- External ad networks
- Third-party SDKs that track users
- Payment processing (not applicable for booth games)

### 12.4 Content Moderation

Games must **not** contain:
- Violence or gore
- Hate speech or discrimination
- Sexual or suggestive content
- Advertising for non-educational products

**Text generation (if using AI models):**
- If games generate any text (hints, dialogue), filter output via blocklist
- Never use unfiltered LLM output in UI
- Moderate all user-facing text before display

---

## 13. AI/ML Standards

### 13.1 Model Deployment Strategy

**Default Approach:** Stream models on first load, cache locally.

1. **Model Discovery**: Store model metadata in `public/models/manifest.json`
   ```json
   {
     "models": {
       "puzzle-classifier": {
         "format": "onnx",
         "url": "https://cdn.example.com/models/classifier.onnx",
         "size": "15MB",
         "version": "1.0"
       }
     }
   }
   ```

2. **Model Loading** (packages/ai-models/inference.js):
   - Detect supported runtime: WASM > WebGPU > WebNN > fallback to CPU
   - Fetch model from CDN (with progress bar)
   - Cache to IndexedDB (larger storage than localStorage)
   - Load from cache on subsequent runs

3. **Inference**: Run locally in browser, **never send data to server**

### 13.2 Runtime Selection & Libraries

**Priority order:**
1. **WebGPU** (if available) — GPU acceleration, fastest
2. **WASM** (general fallback) — portable, good performance
3. **WebNN** (experimental) — hardware acceleration API
4. **CPU fallback** — pure JavaScript, slowest but always works

**Primary Library (Recommended):**
- **Hugging Face Transformers.js**: `@xenova/transformers`
  - Pre-built models from Hugging Face Hub
  - ONNX-based, runs in browser
  - Supports: Text classification, NLP, vision, speech
  - Auto model download and caching
  - Examples: sentiment analysis, text generation, image classification

**Model Discovery & Download:**
- Use **Hugging Face Model Hub**: https://huggingface.co/models
- Filter for ONNX or browser-compatible models
- Examples:
  - `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (sentiment)
  - `Xenova/mobilenet-v2` (image classification)
  - `Xenova/codebert-base` (code understanding)

**Alternative Libraries (if needed):**
- ONNX Runtime (JavaScript): `onnxruntime-web` (lower-level control)
- TensorFlow.js: `@tensorflow/tfjs` (general ML tasks)
- MediaPipe: `@mediapipe/tasks-web` (computer vision, pose)

### 13.3 Optimization Strategies

- **Quantization**: Use INT8 or FP16 models (smaller, faster)
- **Model pruning**: Remove unused layers
- **Batching**: Process multiple inputs at once
- **Caching**: Cache inference results for repeated inputs
- **Offscreen workers**: Run inference in Web Worker to avoid UI blocking

### 13.4 Memory Management

- Clear model cache on session timeout (destroy inference session)
- Monitor memory usage (log to console for debugging)
- Dispose of tensors after inference
- Pre-allocate buffers if possible

---

## 14. Accessibility (WCAG 2.1 Level AA)

### 14.1 Keyboard Navigation

- **All interactive elements must be keyboard-accessible**: buttons, inputs, menus
- **Tab order**: Logical, left-to-right, top-to-bottom
- **Focus indicators**: Visible outline (minimum 2px, sufficient contrast)
- **Escape key**: Close modals, cancel operations
- **Arrow keys**: Navigate menus, game controls (where applicable)

### 14.2 Color Contrast

- **Text**: Minimum 4.5:1 contrast ratio (normal text), 3:1 (large text)
- **UI components**: 3:1 contrast for borders, outlines
- **Don't rely on color alone** — use icons, patterns, or text labels

### 14.3 ARIA & Semantic HTML

- Use semantic HTML (`<button>`, `<input>`, `<nav>`) instead of `<div>` with roles
- Add `aria-label` or `aria-labelledby` for non-obvious elements
- Use `aria-live="polite"` for dynamic score/timer updates
- Test with screen readers (NVDA, JAWS, VoiceOver)

### 14.4 Text & Readability

- Minimum font size: 14px
- Line height: 1.5
- Line length: 50–80 characters (avoid walls of text)
- Avoid justified text (use left-align)
- Provide text alternatives for images (alt text)

### 14.5 Testing Checklist

Before launch, verify:
- [ ] Keyboard-only navigation (no mouse) works end-to-end
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Color contrast passes (use WebAIM checker)
- [ ] Screen reader (browser built-in or NVDA) can navigate UI
- [ ] Buttons have descriptive labels
- [ ] Leaderboard table has proper headers
- [ ] Timer/score updates are announced to screen readers
- [ ] Game instructions are clear and readable

**Tools:**
- axe DevTools (browser extension)
- WAVE (WebAIM)
- Lighthouse (in DevTools)

---

## 15. Quick-Start Command

### 15.1 Create a New Game

**Command:**
```bash
npm run create-game memory-game --mascot 1 --ageGroups 0,1,2
```

**What it does:**
1. Creates folder: `games/memory-game/`
2. Prompts for details:
   ```
   Game name: Memory Game
   Mascot ID: 1 (Orchid Mantis)
   Age groups: 7-10, 10-16, 16+ (all)
   Description: Remember the sequence of mascot images
   ```
3. Scaffolds React + Phaser boilerplate:
   - `src/App.jsx` (React entry, card reader, age filter)
   - `src/scenes/MenuScene.js`, `GameScene.js`, `GameOverScene.js`
   - `src/components/GameBoard.jsx`, `LeaderboardDisplay.jsx`, `CardGreeting.jsx`
   - `src/systems/gameState.js`, `cardIO.js`, `scoreManager.js`
   - `src/assets/` (placeholder folders)
   - `tests/` (test template)
   - `package.json` (per-game dependencies)
   - `README.md` (game template)

4. Updates `gameRegistry.json` with new game entry:
   ```json
   {
     "id": "memory-game",
     "name": "Memory Game",
     "mascotID": 1,
     "ageGroups": [0, 1, 2],
     ...
   }
   ```

5. Generates:
   - CSS file with mascot color theme (Orchid Mantis = magenta)
   - Mascot dialogue based on personality (Coder theme)
   - Card I/O code (read scores, write scores)
   - Comments with TODO markers for developer

6. Next steps printed:
   ```
   ✓ Created games/memory-game/
   ✓ Updated gameRegistry.json
   ✓ Scaffolded boilerplate

   Next steps:
   1. cd games/memory-game
   2. npm install
   3. Review README.md
   4. Open src/App.jsx to start building
   5. Implement game logic in src/scenes/GameScene.js

   Refer to 01-conference-booth-game.md for architecture.
   ```

### 15.2 What the Boilerplate Includes

**React Shell:**
- App.jsx with card reader integration
- Theme detection (light/dark)
- Age group selector
- Game menu filtering

**Phaser Scenes:**
- MenuScene with mascot greeting + difficulty selector
- GameScene (empty, ready for game logic)
- GameOverScene with leaderboard display

**Shared Components:**
- CardGreeting.jsx (shows mascot + score)
- LeaderboardDisplay.jsx (displays scores)
- MascotContainer.jsx (mascot image + animation)
- ResetButton.jsx (clears session)
- DifficultySelector.jsx (Easy, Medium, Hard)

**Systems:**
- gameState.js (centralized state object)
- cardIO.js (NTAG213 read/write)
- scoreManager.js (score accumulation)
- mascotResponses.js (personality-driven dialogue)

**Styling:**
- tokens.css imported from design-system
- game.css (game-specific styles using CSS vars)
- Responsive grid layout

---

## 16. Agent Instructions & Consent Model

### 16.1 How Agents Use This Document

**Workflow:**
1. **First request**: Agent reads this document (00-wizkidz-global.md)
2. **Development**: Agent references sections (design system, NTAG213 spec, game registry, mascot system)
3. **Game creation**: Agent generates using patterns defined here
4. **For game-specific architecture**: Agent reads 01-conference-booth-game.md

**Agents should NOT:**
- Override design system (colors, fonts, spacing)
- Skip accessibility checklist
- Store data on backend (card + localStorage only)
- Use undocumented dependencies
- Add games to gameRegistry.json without updating metadata

**Agents SHOULD:**
- Ask developer clarifying questions before starting
- Reference specific sections of this document when explaining decisions
- Flag compliance issues (COPPA, accessibility) before implementation
- Recommend testing strategy based on game type
- Update gameRegistry.json when creating games

### 16.2 Terminal Command Consent

**Agent asks for explicit consent ONLY for destructive commands:**

❌ **Require consent:**
```bash
rm -rf [directory]          # File deletion
git push origin [branch]    # Remote push
npm uninstall [package]     # Dependency removal
git reset --hard            # History rewrite
```

✅ **Do NOT require consent** (safe operations):
```bash
npm install                 # Install deps
npm run build               # Build
npm run test                # Run tests
npm run lint                # Lint check
npm run dev                 # Start dev server
git add .                   # Stage files
git commit -m "message"     # Local commit
git checkout [branch]       # Switch branch
mkdir [directory]           # Create folder
```

**Consent prompt format:**
```
I need to run a terminal command. Please confirm:

Command: rm -rf node_modules
Reason: Clear cache to fix dependency issue

Proceed? (y/n)
```

### 16.3 When to Escalate to Pari

Agent should **ask Pari directly** (via message) for:
- Clarification on game design or concept
- Approval for architectural changes
- Scope questions ("Should the game support multiple players?")
- Timeline/deadline questions
- Integration with other Wiz Kidz systems
- Hardware questions (new input devices, reader specifications)

Agent should **mention but NOT ask Pari** for:
- Code style decisions (refer to this document)
- Component implementation details
- Testing strategy refinements

### 16.4 When to Escalate to Laila (Compliance)

Agent should **flag for Laila immediately** (via Pari) if:
- Game uses any AI model that generates text/images (content moderation needed)
- Game collects data beyond what's on NTAG213 card
- Game includes real-time communication between players (multiplayer)
- Game uses third-party SDKs or services
- Game processes or stores any form of personal data
- COPPA compliance questions arise

**Do not implement** these features without Laila's sign-off.

---

## 17. Deployment & CI/CD

### 17.1 GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

**On every commit:**
1. Lint check (ESLint)
2. Unit tests (Vitest)
3. Build check (Vite build)
4. Accessibility scan (axe-core)

**On PR merge to main:**
1. Run all above
2. Build optimized bundle
3. Deploy to GitHub Pages (`gh-pages` branch)

**Result:** Game live at `https://username.github.io/wizkidz-conference-games/games/game-name/`

### 17.2 Environment Variables

**File**: `.env.example`
```
VITE_MODEL_CDN=https://cdn.example.com/models/
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
VITE_NFC_READER=true
```

Copy to `.env.local`, fill in values, add to `.gitignore`.

### 17.3 Build Optimization

**Vite targets:**
- Bundle each game as a separate entry point
- Code splitting for shared packages (design-system, card-io, analytics)
- Minification enabled in production
- Asset optimization (images, fonts)

**Size targets:**
- Game JS bundle: < 500KB (gzipped)
- HTML + CSS: < 100KB
- Model files: streamed on demand (not in bundle)

---

## 18. Storybook Documentation

### 18.1 Purpose

Storybook is the living design system documentation. Developers reference it for:
- Component APIs (props, behaviors)
- Design tokens (colors, spacing, typography)
- Mascot animations and states
- Accessibility patterns
- NTAG213 card data format examples

### 18.2 Structure

```
docs/stories/
├── Design.stories.jsx          (color palette, typography, spacing)
├── Components.stories.jsx       (Button, Input, Modal, Card)
├── Mascots.stories.jsx         (all 6 mascots, animation states)
├── CardSystem.stories.jsx      (NTAG213 data format, examples)
└── Accessibility.stories.jsx   (contrast examples, keyboard nav)
```

**Storybook command:**
```bash
npm run storybook              # Start Storybook dev server
npm run build-storybook        # Build static Storybook
```

**Deploy Storybook to GitHub Pages** (separate folder or subdomain).

---

## 19. Summary Checklist for New Games

Before starting a new game, confirm:

- [ ] Game concept approved by Pari
- [ ] Mascot assigned (locked to one of 6 mascots)
- [ ] Age groups selected (multi-select: 7-10, 10-16, 16+)
- [ ] No compliance concerns (check with Laila if needed)
- [ ] Primary input devices identified (RFID always; plus others?)
- [ ] Accessibility baseline: keyboard nav + screen reader support required
- [ ] Offline-first: works without network after first load
- [ ] Card I/O: reads/writes scores to NTAG213 card
- [ ] Dark mode default: system preference detection enabled
- [ ] Tests: unit + E2E coverage planned
- [ ] gameRegistry.json will be updated with game metadata
- [ ] Ready to read Layer 01 for game-specific architecture

---

## 20. Quick Reference Links

- **Design System**: Section 1 (colors, typography, components)
- **NTAG213 Card System**: Section 2 (hardware spec, data structure, card lifecycle)
- **Game Registry**: Section 3 (how games are registered + filtered)
- **Age Group System**: Section 4 (7-10, 10-16, 16+ filtering)
- **Monorepo Setup**: Section 5 (folder structure, naming)
- **React + PWA**: Section 6 (app shell, offline, dark mode)
- **Hardware Input**: Section 7 (RFID primary, input abstraction layer)
- **Phaser Integration**: Section 8 (scenes, state, input)
- **Mascot System**: Section 9 (mascot assignments, behaviors)
- **Main Menu Architecture**: Section 10 (filtering, access control)
- **Code Quality**: Section 11 (lint, git, testing)
- **Security**: Section 12 (COPPA, data protection)
- **AI/ML**: Section 13 (model deployment, inference)
- **Accessibility**: Section 14 (WCAG 2.1 AA checklist)
- **Quick-Start**: Section 15 (`npm run create-game`)
- **Agent Instructions**: Section 16 (consent model, escalation)
- **CI/CD**: Section 17 (GitHub Actions, deployment)
- **Storybook**: Section 18 (design documentation)

---

**Document version:** 2.0 (FINAL)  
**Last updated:** June 2026  
**Maintained by:** Tae (IT Specialist, Wiz Kidz)  
**Next layer:** Read `01-conference-booth-game.md` for game-specific architecture.
