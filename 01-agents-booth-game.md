# 01-agents-booth-game.md
## Game-Specific Architecture for Wiz Kidz Games (FINAL - Updated)

**Purpose:** This document defines the architecture, patterns, and constraints for building individual games. Use this *after* understanding Layer 00 (universal standards).

**Who this is for:** Game developers (human or AI agents) building specific games. Extends Layer 00; do not repeat universal standards.

**Key principle:** All games follow the same architecture. Variations are in content and gameplay, not structure.

---

## 1. Overview: Game Architecture

### 1.1 Architecture Diagram (Conceptual)

```
App Entry Point (Main Menu)
│
├── Card Reader (ACR122U USB HID)
│   └── Read ONCE at start: Mascot ID, Unique ID, Total Points (identity + previous score)
│   └── Write ONCE at game end: Updated Total Points (score persistence)
│   └── Read-only during gameplay (NOT used for game input)
│
├── Age Group Selector (7-10, 10-16, 16+)
│
├── Game Registry Filter
│   └── Show: games where mascotID == card.mascotID AND ageGroups match
│
└── Main Menu
    ├── Card Greeting ("Welcome back, [Mascot Name]! Score: 350 pts")
    ├── Game Grid (filtered games for this mascot)
    └── Launch Game Button
        │
        ↓ (Game Selected)
        │
        React App Shell
        │
        ├── Phaser Game Container
        │   │
        │   ├── MenuScene (instructions, difficulty select)
        │   │
        │   ├── GameScene (main gameplay loop)
        │   │   ├── Physics (Arcade 2D)
        │   │   ├── Graphics / Sprites
        │   │   ├── Input System (abstracted)
        │   │   │   ├── PRIMARY: Camera (gesture) OR Joystick OR Buttons
        │   │   │   └── FALLBACK: Keyboard
        │   │   ├── Audio (Web Audio API)
        │   │   └── Mascot Overlay (reactions, guidance)
        │   │
        │   └── GameOverScene (results, leaderboard)
        │
        ├── HUD Overlay (React)
        │   ├── Score Display
        │   ├── Timer (if applicable)
        │   └── Leaderboard Display
        │
        ├── Card I/O System (background, not interactive)
        │   ├── Already read card at start (identity + score)
        │   ├── During game: Track earned points in memory
        │   └── On game end: Write updated score to card
        │
        └── Session Manager
            ├── Track inactivity (30 min)
            ├── Detect card swap
            └── Reset on timeout
```

### 1.2 Data Flow: Card → Game → Card

```
Player scans card at booth start
  ↓
App reads NTAG213:
  - Byte 0: Mascot ID (0-5)
  - Bytes 1-4: Unique ID
  - Bytes 5-6: Total Points (previous score)
  ↓
Main menu displays: "Welcome, [Mascot]! High score: 350"
  ↓
Player selects game (verified: game.mascotID == card.mascotID)
  ↓
Game launches
  ├── Load existing score from card (350)
  ├── Display in HUD
  ├── CARD IS READ-ONLY NOW (not used for input)
  ↓
Player plays game using: Camera gesture OR Joystick OR Buttons OR Keyboard
  (NOT card - card is identity only)
  ↓
Player earns points during gameplay (220 new points)
  ↓
Game ends
  ├── Calculate: newTotal = 350 + 220 = 570
  ├── Write to card: Bytes 5-6 = 570
  ↓
GameOverScene:
  └── Display: "Game Score: 220 | Total Score: 570! 🎉"
  ↓
Player can play again (card still in reader, score persists)
  OR swap card (new player, new session)
```

### 1.3 Game State Architecture

**Shared state** lives in React Context (not in Phaser), so UI can read/update it:

```typescript
interface GameState {
  // Card & Session info
  cardUID: string;
  mascotID: number;
  mascotName: string;
  cardScorePrevious: number;  // Score on card before this game
  
  // Game progress
  currentScene: 'MenuScene' | 'GameScene' | 'GameOverScene';
  gameScore: number;            // Points earned THIS game
  totalScore: number;           // Total on card (updated after game)
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isGameActive: boolean;
  isGameOver: boolean;
  
  // Leaderboard (per session, resets when card swaps)
  leaderboardScores: Array<{
    gameScore: number;
    totalScore: number;
    timestamp: string;
    difficulty: string;
  }>;
  
  // Mascot state
  mascotAnimation: 'idle' | 'happy' | 'confused' | 'sad' | 'celebrating';
  mascotDialogue: string;
  
  // Session config
  maxInactivityMinutes: number;
  lastActivityTime: number;
}
```

**Updates:**
- Phaser scenes emit events or call functions to update state
- React UI subscribes to state changes
- Card synced after game ends (write new score to NTAG213)

---

## 2. Card I/O System (Identity + Score Keeper)

### 2.1 Key Principle: RFID Card is NOT Game Input

**Critical distinction:**
- ✅ Card is read at app start (identity + retrieve previous score)
- ✅ Card is written after game end (persist new score)
- ❌ Card is **NOT** tapped/scanned during gameplay
- ❌ Card is **NOT** used for game interaction
- Game input comes from: Camera gesture, Joystick, Buttons, or Keyboard

### 2.2 Card Data Reading (App Start)

**Flow:**
```typescript
async function readCard(reader: NFCReader): Promise<CardData | null> {
  try {
    const card = await reader.detectCard(); // Blocking read
    
    if (!card) {
      console.log("No card detected");
      return null;
    }
    
    const cardData: CardData = {
      uid: card.uid,                    // 7 bytes, unique identifier
      mascotID: card.bytes[0],          // Byte 0
      uniqueID: parseUniqueID(card.bytes.slice(1, 5)),  // Bytes 1-4
      totalPoints: parseUInt16(card.bytes.slice(5, 7)), // Bytes 5-6
    };
    
    return cardData;
  } catch (error) {
    console.error("Card read error:", error);
    return null;
  }
}
```

**On app start (main menu):**
```typescript
// Main menu loads
const cardData = await readCard(nfcReader);

if (cardData) {
  // Card detected
  gameState.cardUID = cardData.uid;
  gameState.mascotID = cardData.mascotID;
  gameState.cardScorePrevious = cardData.totalPoints;
  
  // Load mascot personality
  const mascot = getMascotByID(cardData.mascotID);
  gameState.mascotName = mascot.name;
  
  // Display greeting
  displayGreeting(`Welcome back, ${mascot.name}! High score: ${cardData.totalPoints} pts`);
} else {
  // No card detected (offline mode)
  displayMessage("Scan your RFID card to play, or press Start for offline mode");
  promptCardScan();
}
```

### 2.3 Card Data Writing (Game End)

**Flow:**
```typescript
async function writeScoreToCard(reader: NFCReader, newTotalPoints: number): Promise<boolean> {
  try {
    const card = await reader.detectCard();
    
    if (!card) {
      console.error("No card detected for write");
      return false;
    }
    
    // Encode new total points as 16-bit unsigned int
    const pointsBytes = encodeUInt16(newTotalPoints);
    
    // Write to bytes 5-6
    await reader.write(card, 5, pointsBytes);
    
    console.log(`Card updated: ${newTotalPoints} points`);
    return true;
  } catch (error) {
    console.error("Card write error:", error);
    return false;
  }
}
```

**On game end (GameOverScene):**
```typescript
// GameOverScene
const newTotalScore = gameState.cardScorePrevious + gameState.gameScore;
const success = await writeScoreToCard(nfcReader, newTotalScore);

if (success) {
  gameState.totalScore = newTotalScore;
  displayMessage("✓ Score saved to card!");
} else {
  displayError("Could not save score. Keep card in reader.");
  // Still display result, but warn player
}
```

### 2.4 Error Handling

**Common errors:**
1. **Card not detected** — Keep reader active, prompt retry
2. **Card removed mid-read** — Retry, show "Keep card in reader"
3. **Card removed mid-write** — Retry, ask user to keep card still
4. **Write failed** — Retry 3 times with delays
5. **Reader disconnected** — Fall back to offline mode

**Graceful degradation:**
```typescript
if (readerAvailable) {
  // Use RFID card for identity + score
  const cardData = await readCard(nfcReader);
  if (cardData) {
    // Normal mode
    initializeGameWithCard(cardData);
  } else {
    // Reader available but no card
    promptCardScan();
  }
} else {
  // Reader unavailable - offline mode
  console.warn("Card reader unavailable. Starting offline mode.");
  initializeOfflineMode();
}
```

### 2.5 Card Swap Detection

**Track previous card UID:**
```typescript
let previousCardUID: string | null = null;

async function checkCardSwap(reader: NFCReader): Promise<boolean> {
  const cardData = await readCard(reader);
  
  if (!cardData) return false; // No card
  
  if (previousCardUID && cardData.uid !== previousCardUID) {
    // Different card detected
    console.log("Card swapped! New player.");
    return true;
  }
  
  previousCardUID = cardData.uid;
  return false;
}
```

**On card swap:**
```typescript
if (await checkCardSwap(nfcReader)) {
  // Reset session
  resetSession();
  clearLeaderboard();
  returnToMainMenu();
}
```

---

## 3. Main Menu & Access Control

### 3.1 Main Menu Component Flow

```
MainMenu.tsx
├── CardGreeting (display card info or prompt scan)
├── AgeGroupSelector (multi-select: 7-10, 10-16, 16+)
├── GameGrid (filtered games)
│   └── GameCard
│       └── onClick → verifyAccess() → launchGame()
└── OfflineModeButton (if reader unavailable)
```

### 3.2 Game Filtering Logic

```typescript
function getAvailableGames(
  cardMascotID: number,
  selectedAgeGroups: number[]
): Game[] {
  const allGames = gameRegistry.games;
  
  return allGames.filter(game => {
    // Check mascot ID matches
    if (game.mascotID !== cardMascotID) {
      return false;
    }
    
    // Check age group overlap
    const ageGroupMatch = game.ageGroups.some(ag =>
      selectedAgeGroups.includes(ag)
    );
    if (!ageGroupMatch) {
      return false;
    }
    
    return true;
  });
}

// Example:
// Card mascotID: 0 (Peacock Pride)
// Selected age groups: [1, 2] (10-16, 16+)
// Result: Show only Peacock Pride games with ageGroups [1, 2]
```

### 3.3 Game Access Gate

**Before launching game:**
```typescript
async function launchGame(game: Game): Promise<void> {
  // Verify card mascot matches game mascot
  const cardData = await readCard(nfcReader);
  
  if (!cardData) {
    showError("Card not detected. Scan card and try again.");
    return;
  }
  
  if (cardData.mascotID !== game.mascotID) {
    const gameMascot = getMascotByID(game.mascotID);
    const cardMascot = getMascotByID(cardData.mascotID);
    
    showError(
      `This game is for ${gameMascot.name} cards.\n` +
      `You have a ${cardMascot.name} card.\n` +
      `Switch cards or try another game.`
    );
    return;
  }
  
  // Access granted
  initializeGame(game, cardData);
}
```

### 3.4 Offline Mode (If Reader Unavailable)

**Activation:**
```typescript
if (!nfcReader.isAvailable()) {
  enableOfflineMode();
  displayMessage("Offline Mode: All games playable, score not saved to card");
}
```

**Offline behavior:**
```typescript
offlineMode = {
  mascotRestriction: false,  // All games playable
  cardPersistence: false,    // No card I/O
  leaderboard: 'session',    // Session-based only (lost on close)
  dataLoss: 'expected',      // Data lost on browser close / reboot
};
```

**In offline mode:**
- Show all games (no mascot filter)
- Leaderboard shows session high scores only
- Score NOT written to card (no card reader)
- Data reset on browser close or system reboot

---

## 4. Three-Scene Structure

### 4.1 MenuScene

**Responsibilities:**
- Initialize mascot greeting (from card data)
- Display game instructions
- Difficulty level selector (Easy, Medium, Hard)
- Show player session ID (card UID)
- Launch game

**Typical structure:**
```
MenuScene
├── Background (brand colors, light theme)
├── Title Text (game name)
├── Mascot Character (animated, intro pose)
├── Mascot Dialogue Box (greeting message, personality-specific)
├── Instructions Panel (how to play with visuals)
├── Difficulty Selector (3 buttons: Easy, Medium, Hard)
├── Session ID Display ("Player-A7F2-8B9C")
└── "Start Game" Button
```

**Mascot greeting (personality-driven):**
```typescript
const greetings: Record<number, string> = {
  0: "Hey explorer! I'm Peacock Pride. Ready to solve some puzzles?",  // Inventor
  1: "I'm Orchid Mantis! Let's code this together.",                    // Coder
  2: "Red Fox here! Ready for an adventure? Let's go!",                 // Explorer
  3: "Green Frog at your service. Take your time. You can do this.",    // Mentor
  4: "Yellow Fawn here! This is going to be fun! Let's play!",          // Cheerleader
  5: "I'm Blue Jay. Logic and strategy. You've got this!",              // Engineer
};

mascotDialogue = greetings[cardData.mascotID];
```

**Transitions:**
- "Start Game" → Phaser.scene.start('GameScene', { difficulty: 'medium' })

### 4.2 GameScene

**Responsibilities:**
- Main game loop (update, render, physics)
- Input handling (abstracted, from Camera/Joystick/Buttons/Keyboard)
- Game logic (winning, losing, level progression)
- HUD updates (score, timer, lives, progress)
- Mascot hints & reactions
- Win/lose detection → transition to GameOverScene

**Typical structure:**
```
GameScene
├── Background / Game World
├── Game Objects (sprites, physics bodies, graphics)
├── HUD Overlay (React component, not Phaser)
│   ├── Score Display (top-right)
│   ├── Timer (if applicable)
│   ├── Lives / Health (if applicable)
│   ├── Progress Bar (if applicable)
│   └── Pause Button (optional)
├── Mascot Overlay (bottom-left or corner)
│   ├── Mascot Image (current animation state)
│   └── Dialogue Bubble (hints, reactions)
└── Input System (abstracted, see Section 6)
```

**Game loop (Phaser automatically calls every frame):**
1. **preload()** — Load assets (images, audio, fonts)
2. **create()** — Initialize game objects, physics, input
3. **update()** — Called every frame (60 FPS target)
   - Read input from abstraction layer (NOT card)
   - Update physics
   - Update game state
   - Check win/lose conditions
   - Update HUD
4. **Cleanup on exit** — Dispose of resources

**Win/Lose Detection:**
```typescript
update() {
  // ... game logic ...
  
  if (winConditionMet()) {
    endGame('win');
  } else if (loseConditionMet()) {
    endGame('lose');
  }
}

function endGame(result: 'win' | 'lose'): void {
  gameState.isGameOver = true;
  gameState.isGameActive = false;
  
  // Play end animation
  gameState.mascotAnimation = result === 'win' ? 'celebrating' : 'sad';
  
  // Wait 1-2 sec, then transition
  this.time.delayedCall(1500, () => {
    this.scene.start('GameOverScene');
  });
}
```

### 4.3 GameOverScene

**Responsibilities:**
- Display final score & outcome
- Show leaderboard (scores from this session, accumulated)
- Mascot celebration or consolation
- Buttons: "Play Again", "Change Difficulty", "Back to Menu", "New Card"

**Typical structure:**
```
GameOverScene
├── Background (brand colors, light theme)
├── Result Title ("You Won!" or "Game Over")
├── Score Display (large, centered)
│   ├── This Game Score (220 pts)
│   ├── Total Score on Card (570 pts)
│   └── Status ("New Personal Best! 🎉")
├── Leaderboard Panel
│   ├── Title ("Session Scores")
│   └── Top 5 Scores (game, total, difficulty, time)
├── Mascot Reaction (large, celebrating or sympathetic)
├── Mascot Dialogue ("Amazing work!" or "Better luck next time!")
└── Buttons
    ├── "Play Again" (same difficulty, reset scene)
    ├── "Change Difficulty" (return to MenuScene, keep card)
    ├── "Back to Main Menu" (clear game, return to menu)
    └── "New Card" (reset session, return to main menu)
```

**Score display:**
```
Game Score: 220 pts
───────────────────────
Your Total Score: 570 pts
Previous Best: 350 pts
New Personal Best! 🎉

Session Scores:
1. 220 pts (Hard)
2. 150 pts (Medium)
3. 100 pts (Easy)
```

---

## 5. Game State Management (TypeScript)

### 5.1 State Updates (Phaser → React)

Phaser scenes don't modify state directly. Instead, they **dispatch events** or call functions.

**Pattern:**
```typescript
// In GameScene, when player scores:
window.gameStateManager.updateScore(100);

// Or via event:
this.events.emit('score-updated', { points: 100 });

// React Context listens and updates
gameState.gameScore += 100;
```

**Key state transitions:**
- MenuScene → GameScene: `gameState.isGameActive = true`
- GameScene detects win: `gameState.isGameOver = true`
- GameOverScene displays: `gameState.currentScene = 'GameOverScene'`
- Player clicks "Play Again": Reset gameScore, restart GameScene

### 5.2 Score Accumulation Logic

```typescript
function startGame(difficulty: 'easy' | 'medium' | 'hard'): void {
  // Load previous score from card
  gameState.cardScorePrevious = cardData.totalPoints;  // e.g., 350
  gameState.gameScore = 0;  // Reset for this game
  gameState.difficulty = difficulty;
  gameState.totalScore = cardData.totalPoints;
}

function addPoints(basePoints: number): void {
  gameState.gameScore += basePoints;
  updateHUD();
}

async function finishGame(): Promise<void> {
  // Calculate new total
  gameState.totalScore = gameState.cardScorePrevious + gameState.gameScore;
  
  // Write to card
  const success = await writeScoreToCard(nfcReader, gameState.totalScore);
  
  // Add to leaderboard
  if (success) {
    addToLeaderboard({
      gameScore: gameState.gameScore,
      totalScore: gameState.totalScore,
      difficulty: gameState.difficulty,
      timestamp: new Date(),
    });
  }
}
```

### 5.3 Mascot State Management

Mascot state is tied to game events:

```typescript
gameState.mascotAnimation = 'idle';  // Default

// When player makes correct move:
gameState.mascotAnimation = 'happy';
gameState.mascotDialogue = "Nice work!";
setTimeout(() => (gameState.mascotAnimation = 'idle'), 2000);

// When player fails:
gameState.mascotAnimation = 'confused';
gameState.mascotDialogue = "Try again!";
setTimeout(() => (gameState.mascotAnimation = 'idle'), 1500);

// On game win:
gameState.mascotAnimation = 'celebrating';
gameState.mascotDialogue = "We did it! You're amazing!";
```

**Animation transitions should be smooth (100–300 ms fade or interpolation).**

---

## 6. Hardware Input System

### 6.1 Input Device Hierarchy

**PRIMARY (Priority Order) - Used for Game Input:**
1. **Camera** (optional per-game)
   - Hand gesture detection (wave, point, peace sign)
   - Pose detection (arms up, dance moves)
   - Face detection (smile, blink)
   - Requires browser camera permission
   - Only active if game.inputDevices includes 'camera'

2. **Joystick** (optional per-game)
   - Arcade-style 8-way joystick
   - USB HID standard input
   - Mapped to in-game movement/navigation
   - Requires USB connection

3. **Physical Buttons** (optional per-game)
   - Big easy buttons (accessibility-friendly)
   - Foot pedals / foot buttons (accessibility)
   - Mapped to specific keyboard characters

**FALLBACK (Safety Net):**
- **Keyboard** (always available)
  - Arrow keys: Movement/navigation
  - Space/Enter: Confirm
  - Escape: Cancel/menu

**NOT Used for Game Input:**
- ❌ RFID Card (used for identity + score persistence only, not game interaction)
- ❌ Touchscreen (optional, but not required for booth games)

### 6.2 Input Abstraction Layer

Games use unified input API, not device-specific code:

```typescript
interface InputAction {
  type:
    | 'MOVE_UP'
    | 'MOVE_DOWN'
    | 'MOVE_LEFT'
    | 'MOVE_RIGHT'
    | 'CONFIRM'
    | 'CANCEL'
    | 'ACTION_1'
    | 'ACTION_2';
  timestamp: number;
  source: 'camera' | 'joystick' | 'buttons' | 'keyboard';
}

class InputSystem {
  private primaryDevices: string[];  // ['camera'] or ['joystick'] or ['buttons']
  private fallbackDevice: string = 'keyboard';

  async getAction(): Promise<InputAction | null> {
    // Try primary devices first
    for (const device of this.primaryDevices) {
      const action = await this.readDevice(device);
      if (action) return action;
    }

    // Fall back to keyboard
    return await this.readDevice(this.fallbackDevice);
  }

  private async readDevice(device: string): Promise<InputAction | null> {
    switch (device) {
      case 'camera':
        return await this.readCamera();
      case 'joystick':
        return await this.readJoystick();
      case 'buttons':
        return await this.readButtons();
      case 'keyboard':
        return await this.readKeyboard();
      default:
        return null;
    }
  }
}

// Usage in GameScene:
const inputSystem = new InputSystem(['joystick'], 'keyboard');

update() {
  const action = await inputSystem.getAction();
  if (action) {
    this.handleGameAction(action);
  }
}
```

### 6.3 Camera Input (Optional)

**Gesture detection (if game enabled):**
```typescript
const gestureMap: Record<string, () => void> = {
  'wave-left': () => playerMove('left'),
  'wave-right': () => playerMove('right'),
  'thumbs-up': () => playerConfirm(),
  'peace-sign': () => playerCancel(),
};

// Detect via WebRTC camera + pose detection library
// Only active if game.inputDevices includes 'camera'
// Fallback to keyboard if camera unavailable
```

### 6.4 Joystick Input (Optional)

**Arcade-style 8-way joystick:**
```typescript
const joystickMap: Record<string, () => void> = {
  'up': () => playerMove('up'),
  'down': () => playerMove('down'),
  'left': () => playerMove('left'),
  'right': () => playerMove('right'),
  'center': () => playerConfirm(),
};

// USB HID gamepad API
if (navigator.getGamepads) {
  const gamepad = navigator.getGamepads()[0];
  // Read axes[0] (X), axes[1] (Y)
}
```

### 6.5 Physical Buttons (Optional)

**Big buttons, foot pedals:**
```typescript
// Buttons mapped to keyboard characters
// Button 1 = 'a'
// Button 2 = 's'
// Button 3 = 'd'
// Foot pedal = spacebar

document.addEventListener('keydown', (e: KeyboardEvent) => {
  const buttonMap: Record<string, () => void> = {
    'a': () => playerAction1(),
    's': () => playerAction2(),
    'd': () => playerAction3(),
    ' ': () => playerFootAction(),
  };

  if (buttonMap[e.key]) {
    buttonMap[e.key]();
  }
});
```

### 6.6 Keyboard (Fallback)

**Always available:**
```typescript
this.cursors = this.input.keyboard.createCursorKeys();

update() {
  if (this.cursors.up.isDown) {
    playerMove('up');
  }
  if (this.cursors.left.isDown) {
    playerMove('left');
  }
  // ... etc
}
```

---

## 7. Mascot Integration in Games

### 7.1 Mascot as Helper Character

The mascot appears in every game:
1. **Guide** — Explains mechanics and objectives
2. **Encourager** — Gives hints and motivation
3. **Reactor** — Reacts to player actions
4. **Celebrant** — Celebrates completion

**Mascot appearance options:**
- Corner overlay (fixed, doesn't block gameplay)
- Side panel (can minimize)
- Floating bubble (appears near action, fades)

### 7.2 Personality-Driven Dialogue

Dialogue varies by mascot personality:

```typescript
interface MascotDialogues {
  hint: string;
  success: string;
  failure: string;
  celebration: string;
}

const dialogueByMascot: Record<number, MascotDialogues> = {
  0: {  // Peacock Pride - Inventor
    hint: "Think about the pattern...",
    success: "Great thinking!",
    failure: "Not yet!",
    celebration: "We solved it!",
  },
  1: {  // Orchid Mantis - Coder
    hint: "Debug your logic...",
    success: "Smart move!",
    failure: "Try again!",
    celebration: "Perfect code!",
  },
  // ... others
};

const mascotID = gameState.mascotID;
const response = dialogueByMascot[mascotID][event];
```

### 7.3 Mascot Animations

Mascot has 5 animation states:

1. **idle** — Default loop (breathing, subtle movement, 2-3 sec cycle)
2. **happy** — Success (jump, smile, thumbs up, 1-2 sec play then fade)
3. **confused** — Thinking, hint mode (head tilt, question mark, 1-2 sec)
4. **sad** — Failure (head down, sympathetic, 1-2 sec then fade)
5. **celebrating** — Game won (jump, confetti, big smile, full 3 sec)

**Smooth transitions:**
- Fade: 200-300ms between states
- No abrupt switches

---

## 8. Game Loop Patterns

### 8.1 Turn-Based Games (Chess, Puzzle)

```
MenuScene
  ↓
GameScene (each turn)
  1. Display board/puzzle state
  2. Highlight valid moves
  3. Wait for player input (Camera/Joystick/Buttons/Keyboard)
  4. Validate move
  5. Update board state
  6. Advance turn counter
  7. Check win condition
  8. Loop until game over
  ↓
GameOverScene
```

**State:**
```typescript
interface PuzzleGameState {
  currentTurn: number;
  playerMoves: string[];
  boardState: unknown[];
  moveCount: number;
  maxMoves: number;
}
```

### 8.2 Real-Time Action Games (Catch, Dodge, Reflex)

```
MenuScene
  ↓
GameScene (continuous update loop, 60 FPS)
  1. Spawn obstacles/targets
  2. Move player based on input
  3. Update physics
  4. Check collisions
  5. Update score/lives
  6. Check win/lose condition
  7. Repeat every frame
  ↓
GameOverScene
```

**State:**
```typescript
interface ActionGameState {
  elapsedTime: number;
  playerPosition: { x: number; y: number };
  lives: number;
  gameScore: number;
  itemsCaught: number;
}
```

### 8.3 Resource Management Games (Build, Collect)

```
MenuScene
  ↓
GameScene (decision-making loop)
  1. Display current state
  2. Present choices/actions
  3. Wait for player decision
  4. Apply consequences
  5. Update state
  6. Check win/lose condition
  7. Loop until game over
  ↓
GameOverScene
```

---

## 9. Score Persistence on Card

### 9.1 Score Lifecycle

```
Game Start:
  Load from card: cardScorePrevious = 350
  gameScore = 0

During Game:
  Player action → +50 points
  gameScore = 50
  (not yet on card, held in memory)

Game End:
  Calculate: totalScore = 350 + 50 = 400
  Write to card: Bytes 5-6 = 400
  Confirm: "Score saved!"

Card Available:
  Next player/game reads: 400 points

Post-Booth:
  Player scans card on personal mobile
  Score page displays: 400 points + mascot + CTA
```

### 9.2 Write Failure Handling

```typescript
async function finishGameWithRetry(): Promise<void> {
  let success = false;
  let attempts = 0;

  while (!success && attempts < 3) {
    try {
      success = await writeScoreToCard(
        nfcReader,
        gameState.totalScore
      );
      if (success) {
        showMessage("✓ Score saved to card!");
      }
    } catch (error) {
      attempts++;
      showMessage(
        `Failed to save (attempt ${attempts}/3). Keep card in reader.`
      );
      await delay(1000);
    }
  }

  if (!success) {
    showError("Could not save to card. Score lost.");
    // Still display result, but warn player
  }
}
```

### 9.3 Leaderboard on Card (Per Session)

Leaderboard accumulates scores during session, resets when card swaps:

```typescript
function addToLeaderboard(): void {
  gameState.leaderboardScores.push({
    gameScore: gameState.gameScore,
    totalScore: gameState.totalScore,
    difficulty: gameState.difficulty,
    timestamp: new Date(),
  });

  // Keep top 5
  gameState.leaderboardScores = gameState.leaderboardScores
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);
}

function resetLeaderboard(): void {
  gameState.leaderboardScores = [];
}
```

---

## 10. Performance Considerations

### 10.1 Target Performance

- **Frame rate:** 60 FPS (stable, no drops below 50 FPS)
- **Load time:** < 3 sec (MenuScene ready)
- **Memory usage:** < 100 MB during gameplay
- **Bundle size:** < 500 KB (JavaScript, gzipped)

### 10.2 Optimization Techniques

**Rendering:**
- Use sprite atlases (combine multiple images)
- Batch graphics rendering
- Cull off-screen objects
- Use WebGL (canvas fallback)

**Physics:**
- Only enable physics on bodies that need it
- Use simpler collision shapes
- Limit concurrent physics bodies (< 100)

**Audio:**
- Use compressed formats (MP3, OGG)
- Limit concurrent sounds (8-16 max)
- Reuse audio instances

**Memory:**
- Dispose scenes on exit
- Clear arrays on reset
- Monitor via DevTools

### 10.3 Profiling

Use browser DevTools:
- **Performance tab:** Record gameplay, identify long frames
- **Memory tab:** Track heap usage
- **Network tab:** Verify asset loading

Target: Consistent 16.67ms per frame (60 FPS).

---

## 11. Testing Strategy for Games

### 11.1 Unit Tests (Vitest + TypeScript)

```typescript
// Example: Score calculation
test('Accumulate score from card + earned', () => {
  const cardScore = 350;
  const earnedScore = 220;
  const total = cardScore + earnedScore;
  expect(total).toBe(570);
});

// Example: Leaderboard sorting
test('Keep top 5 scores sorted', () => {
  const scores = [500, 800, 650, 1000, 300, 900];
  const top5 = scores.sort((a, b) => b - a).slice(0, 5);
  expect(top5[0]).toBe(1000);
  expect(top5.length).toBe(5);
});
```

### 11.2 E2E Tests (Playwright)

```typescript
test('Complete game flow on medium difficulty', async ({ page }) => {
  // Load game — replace with your game's path
  await page.goto('/games/memory-game');

  // MenuScene
  await expect(page.locator('text=Memory Game')).toBeVisible();
  await page.click('button:has-text("Medium")');
  await page.click('button:has-text("Start Game")');

  // GameScene (simplified input - use keyboard fallback)
  await page.press('body', 'ArrowLeft');
  await expect(page.locator('.score')).toContainText('50');

  // ... play until win

  // GameOverScene
  await expect(page.locator('text=You Won!')).toBeVisible();
  await expect(page.locator('.leaderboard')).toBeVisible();
});
```

### 11.3 Manual Testing Checklist

- [ ] Game starts without errors
- [ ] All three scenes load
- [ ] Input works (primary device + fallback keyboard)
- [ ] Score updates correctly
- [ ] Mascot animations smooth
- [ ] Leaderboard displays
- [ ] "Play Again" resets
- [ ] Card I/O tested (read at start, write at end)
- [ ] Offline mode works (reader unavailable)
- [ ] Responsive layout (Chromebook 1024×768)
- [ ] Light mode looks good
- [ ] Accessibility: Tab nav, screen reader
- [ ] TypeScript compilation succeeds
- [ ] No console warnings or errors

---

## 12. Game Template Structure (TypeScript + Tailwind)

### 12.1 Generated Boilerplate

```
games/[game-name]/
├── src/
│   ├── App.tsx
│   │   - Card reader initialization
│   │   - Age group selector
│   │   - Game menu filtering
│   │   - Phaser container
│   │   - HUD overlay
│   │
│   ├── scenes/
│   │   ├── MenuScene.ts
│   │   │   - Mascot greeting
│   │   │   - Instructions
│   │   │   - Difficulty selector
│   │   │
│   │   ├── GameScene.ts
│   │   │   - Main game loop
│   │   │   - Input handling (abstracted)
│   │   │   - Game logic
│   │   │   - State updates
│   │   │
│   │   └── GameOverScene.ts
│   │       - Score display
│   │       - Leaderboard
│   │       - Buttons (play again, menu)
│   │
│   ├── components/
│   │   ├── GameHUD.tsx (score, timer overlay)
│   │   ├── LeaderboardDisplay.tsx (top 5)
│   │   ├── MascotContainer.tsx (mascot + dialogue)
│   │   ├── ResetButton.tsx
│   │   └── DifficultySelector.tsx
│   │
│   ├── systems/
│   │   ├── gameState.ts (centralized state)
│   │   ├── cardIO.ts (read/write NTAG213)
│   │   ├── scoreManager.ts (accumulation logic)
│   │   ├── mascotResponses.ts (dialogue)
│   │   ├── inputAbstraction.ts (unified input API)
│   │   └── types.ts (TypeScript interfaces)
│   │
│   ├── assets/
│   │   ├── sprites/
│   │   ├── audio/
│   │   └── images/
│   │
│   └── styles/
│       ├── game.css (Tailwind + custom)
│       └── theme.css (light mode)
│
├── tests/
│   ├── gameLogic.test.ts (unit)
│   └── gameFlow.test.ts (E2E)
│
├── public/
│   └── index.html
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── README.md
└── vite.config.ts
```

### 12.2 Key TypeScript Interfaces

**types.ts:**
```typescript
export interface CardData {
  uid: string;
  mascotID: number;
  uniqueID: string;
  totalPoints: number;
}

export interface GameState {
  cardUID: string;
  mascotID: number;
  mascotName: string;
  cardScorePrevious: number;
  gameScore: number;
  totalScore: number;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isGameActive: boolean;
  isGameOver: boolean;
  mascotAnimation: 'idle' | 'happy' | 'confused' | 'sad' | 'celebrating';
  mascotDialogue: string;
  leaderboardScores: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  gameScore: number;
  totalScore: number;
  difficulty: string;
  timestamp: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  mascotID: number;
  ageGroups: number[];
  difficulty: ('easy' | 'medium' | 'hard')[];
  estimatedPlaytime: number;
  featured: boolean;
}
```

---

## 13. Agent Workflow for Building a Game

### 13.1 Design Phase (With Developer)

Agent asks:
```
1. Game name?
   "Chess Masters"

2. Age groups? (multi-select: 0, 1, 2)
   "1, 2" (10-16, 16+)

3. Mascot? (0-5, locked to one mascot per game)
   "0" (Peacock Pride)

4. Game description?
   "Solve strategic puzzles in minimum moves"

5. Primary input device? (Camera, Joystick, Buttons, or Keyboard fallback)
   "Keyboard" (fallback only, use arrow keys)

6. Estimated playtime?
   "2-3 minutes"

7. Game mechanics summary?
   "Turn-based puzzle. Player arranges pieces to match target pattern."
```

### 13.2 Architecture Phase

Agent proposes:
```
Based on your input:

Game Type: Turn-based puzzle
Primary Input: Keyboard (arrow keys)
Estimated Effort: 10-14 hours

Architecture:
- MenuScene: Difficulty select, mascot greeting
- GameScene: Puzzle grid, move validation, score calc
- GameOverScene: Results, leaderboard

Key Logic:
- moveValidator() → check move matches solution
- scoreCalculator() → points based on moves + difficulty
- puzzleGenerator() → random puzzles per level

Card I/O:
- Read at start: Get cardScorePrevious
- Write at end: Update total score

Next: Create game with:
npm run create-game <game-id> --mascot <0-5> --ageGroups <0,1,2>
```

### 13.3 Implementation Phase

Agent builds scene by scene, with checkpoints:

```
✓ Step 1: Generate MenuScene (TypeScript)
  - Difficulty selector
  - Mascot greeting
  - Start button

✓ Step 2: Generate GameScene (TypeScript)
  - Render puzzle grid
  - Accept keyboard input (arrow keys)
  - Validate moves
  - Update score
  - Detect win condition

✓ Step 3: Generate GameOverScene (TypeScript)
  - Display score + leaderboard
  - Play Again / Menu buttons

✓ Step 4: Integrate card I/O
  - Read card on start
  - Write score on game end

✓ Step 5: Styling with Tailwind CSS
  - Light mode (default)
  - Responsive layout
  - Mascot color theme

✓ Step 6: Add accessibility
  - Keyboard fallback
  - Screen reader support
  - Color contrast

✓ Step 7: Test
  - Unit tests for logic
  - E2E test for flow
```

### 13.4 Review & Deployment

Agent delivers checklist:
```
✓ All scenes implemented (TypeScript)
✓ Game logic validated
✓ Card I/O tested (read/write scores)
✓ Mascot animations smooth
✓ Leaderboard displays
✓ Offline mode works (keyboard fallback)
✓ Responsive layout (Chromebook)
✓ Accessibility passed
✓ Light mode tested
✓ All tests pass
✓ Tailwind CSS applied
✓ README complete
✓ Bundle < 500 KB
✓ Load time < 3 sec
✓ TypeScript compilation succeeds

Ready to deploy? (Will ask consent before git push)
```

---

## 14. AI Integration (Optional - Hugging Face Transformers)

### 14.1 If Game Uses AI/ML

Use **Hugging Face Transformers.js** (`@xenova/transformers`):

```typescript
import { pipeline } from '@xenova/transformers';

// Example: Sentiment analysis for game hints
async function analyzeHint(hintText: string): Promise<string> {
  const classifier = await pipeline(
    'sentiment-analysis',
    'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
  );
  
  const result = await classifier(hintText);
  return result[0].label; // 'POSITIVE' or 'NEGATIVE'
}

// Example: Image classification (identify player-drawn shapes)
async function classifyShape(imageData: ImageData): Promise<string> {
  const classifier = await pipeline(
    'image-classification',
    'Xenova/mobilenet-v2'
  );
  
  const result = await classifier(imageData);
  return result[0].label; // 'circle', 'square', etc.
}
```

### 14.2 Model Hub

Browse models at: https://huggingface.co/models
Filter for: ONNX, browser-compatible

Examples:
- `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (sentiment)
- `Xenova/mobilenet-v2` (image classification)
- `Xenova/codebert-base` (code understanding)

---

## 15. Summary Checklist for Game Implementation

Before deployment:

**Architecture:**
- [ ] Game assigned to one mascot
- [ ] Age groups selected (multi-select)
- [ ] Primary input device(s) chosen (NOT card)
- [ ] Difficulty levels: Easy, Medium, Hard (auto-implemented)
- [ ] Estimated playtime: 2-3 min per game

**Implementation (TypeScript):**
- [ ] All three scenes coded (MenuScene, GameScene, GameOverScene)
- [ ] Game state centralized in React (TypeScript interfaces)
- [ ] Card I/O working (read scores at start, write at end)
- [ ] Score accumulation logic correct
- [ ] Input via abstraction layer (Camera/Joystick/Buttons/Keyboard)
- [ ] Mascot personality integrated (greeting, dialogue, reactions)
- [ ] HUD displays score, timer, progress
- [ ] Leaderboard shows top 5 session scores

**Styling (Tailwind CSS):**
- [ ] Light mode applied (default)
- [ ] Responsive design (Chromebook 1024×768)
- [ ] Mascot color theme consistent
- [ ] Component styling matches design system

**Testing:**
- [ ] Unit tests for game logic (TypeScript, 70%+ coverage)
- [ ] E2E test for full game flow
- [ ] Manual: Offline mode works (card reader unavailable)
- [ ] Manual: Card I/O tested with real NTAG213
- [ ] Manual: All input devices work (primary + fallback)
- [ ] Manual: Responsive (Chromebook resolution)

**Accessibility:**
- [ ] Keyboard navigation works end-to-end
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Color contrast 4.5:1 (text), 3:1 (UI)
- [ ] Screen reader can navigate
- [ ] Game instructions clear

**Documentation:**
- [ ] README.md complete
- [ ] Code comments explain logic
- [ ] gameRegistry.json updated with metadata
- [ ] TypeScript types documented

**Performance:**
- [ ] 60 FPS stable
- [ ] Bundle < 500 KB (gzipped)
- [ ] Load time < 3 sec
- [ ] Memory < 100 MB

**Security & COPPA:**
- [ ] No personal data collected
- [ ] Card data only (no PII)
- [ ] No third-party trackers
- [ ] No external APIs (except CDN for models)

**Ready to deploy to GitHub Pages?**
- [ ] All above checked
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Ready for PR + merge

---

**Document version:** 2.0 (FINAL - Updated)  
**Last updated:** June 2026  
**Maintained by:** Tae (IT Specialist, Wiz Kidz)  
**Companion documents:** 00-wizkidz-global.md, 02-wizkidz-utils.md
