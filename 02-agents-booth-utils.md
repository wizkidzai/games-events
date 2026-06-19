# 02-agents-booth-utils.md
## Wiz Kidz Utils: Admin Tools & Post-Booth Infrastructure (FINAL)

**Purpose:** This document defines the architecture and implementation for supporting tools that run *outside* the game app. These tools manage NTAG213 card configuration and post-booth player engagement.

**Who this is for:** Admin staff, booth setup developers, and AI agents building infrastructure apps (not game developers).

**Key principle:** Separate concerns from game development. These are one-time-built, long-lived utilities.

---

## Overview: Two Supporting Apps

```
Wiz Kidz Game Ecosystem:
│
├── 00-wizkidz-global.md        (Universal standards)
├── 01-conference-booth-game.md (Game development)
└── 02-wizkidz-utils.md         (This file - Infrastructure)
    │
    ├── Admin Card Configurator App
    │   Purpose: Pre-booth card setup
    │   Audience: Booth admin staff
    │   Runs on: Windows/macOS/Linux PC (Electron)
    │
    ├── Post-Booth Score Page
    │   Purpose: Post-booth marketing + enrollment CTA
    │   Audience: Players, parents
    │   Runs on: games.wizkidz.ai/score (web)
    │
    └── Shared Infrastructure
        Purpose: Version management between both apps
        File: cardDataStructure.json
```

---

## 1. Shared Infrastructure: Card Data Structure Template

### 1.1 cardDataStructure.json

**File Location:** `/public/cardDataStructure.json`

**Purpose:** Version control for NTAG213 card format. Both admin app and game app read from this file to ensure compatibility.

```json
{
  "version": "1.0",
  "lastUpdated": "2026-06-12",
  "description": "NTAG213 card data structure for Wiz Kidz booth games",
  "cardStructure": {
    "totalBytes": 180,
    "usedBytes": 7,
    "byteLayout": [
      {
        "byte": 0,
        "name": "mascotID",
        "type": "uint8",
        "range": [0, 5],
        "description": "Mascot identifier (0=Peacock Pride, 1=Orchid Mantis, 2=Red Fox, 3=Green Frog, 4=Yellow Fawn, 5=Blue Jay)",
        "immutable": true,
        "defaultValue": null
      },
      {
        "bytes": "1-4",
        "name": "uniqueID",
        "type": "string",
        "format": "YYYYMMDD_HHMMSS_XXXX",
        "description": "Unique player identifier (timestamp + random hex), generated at card setup",
        "immutable": true,
        "example": "20260612_143530_a7f2"
      },
      {
        "bytes": "5-6",
        "name": "totalPoints",
        "type": "uint16",
        "range": [0, 65535],
        "description": "Cumulative score across all games for this mascot, updated after each game",
        "immutable": false,
        "defaultValue": 0
      },
      {
        "bytes": "7+",
        "name": "reserved",
        "type": "bytes",
        "range": "Bytes 7-179",
        "description": "Reserved for future expansion",
        "immutable": true
      }
    ]
  },
  "breakingChanges": {
    "1.0": {
      "date": "2026-06-12",
      "description": "Initial version",
      "migration": "N/A"
    }
  }
}
```

### 1.2 Version Compatibility

**When structure changes:**
1. Increment version number (1.0 → 1.1)
2. Document breaking changes
3. Update BOTH admin app and game app
4. Add migration instructions if needed

**Admin app validation:**
```typescript
async function validateCardStructureVersion(): Promise<boolean> {
  const structureFile = await fetch('/public/cardDataStructure.json');
  const structure = await structureFile.json();
  
  const adminAppVersion = '1.0';
  const structureVersion = structure.version;
  
  if (adminAppVersion !== structureVersion) {
    alert(`Version mismatch! Admin app v${adminAppVersion}, structure v${structureVersion}. Update needed.`);
    return false;
  }
  
  return true;
}
```

**Game app validation:**
```typescript
async function validateCardStructureVersion(): Promise<boolean> {
  const structureFile = await fetch('/public/cardDataStructure.json');
  const structure = await structureFile.json();
  
  const gameAppVersion = '1.0';
  const structureVersion = structure.version;
  
  if (gameAppVersion !== structureVersion) {
    console.error(`Version mismatch! Game app v${gameAppVersion}, structure v${structureVersion}`);
    // Fall back to offline mode
    return false;
  }
  
  return true;
}
```

---

## 2. Admin Card Configurator App

### 2.1 Purpose & Audience

**Purpose:** Configure NTAG213 cards with correct data structure before booth deployment.

**Audience:** Booth admin staff (non-technical)

**Workflow:**
```
Admin starts app
  ↓
App validates ACR122U reader connection
  ↓
Admin selects mascot (0-5)
  ↓
Admin scans blank card
  ↓
App generates Unique ID (YYYYMMDD_HHMMSS_XXXX)
  ↓
App initializes: Mascot ID, Unique ID, Total Points = 0
  ↓
App writes to card
  ↓
Card ready for booth
  ↓
Admin repeats for next card
```

### 2.2 Tech Stack

**Frontend:**
- React (same as game app)
- TypeScript
- Tailwind CSS
- Form validation library

**Desktop Framework:**
- Electron (build once, run on Windows/macOS/Linux)
- OR: Web-based (simpler, requires USB access)

**USB/RFID:**
- `nfc-pcsc` or Web NFC API (if available)
- ACR122U reader integration

**Database (optional):**
- SQLite (local, for card logging)
- OR: CSV export (simpler)

### 2.3 App Architecture

```
apps/admin-card-config/
├── src/
│   ├── App.tsx
│   │   - Header (Wiz Kidz branding)
│   │   - Main app container
│   │   - Error boundaries
│   │
│   ├── components/
│   │   ├── ReaderStatus.tsx
│   │   │   - ACR122U connection status
│   │   │   - USB connection indicator
│   │   │   - Troubleshooting link
│   │   │
│   │   ├── MascotSelector.tsx
│   │   │   - 6 mascot buttons (with icons)
│   │   │   - Selected state
│   │   │
│   │   ├── CardForm.tsx
│   │   │   - Mascot ID (dropdown or buttons)
│   │   │   - "Scan Card" button
│   │   │   - Auto-generated Unique ID display
│   │   │   - "Initialize & Write" button
│   │   │   - Status feedback
│   │   │
│   │   ├── CardVerification.tsx
│   │   │   - Display card data after write
│   │   │   - Verify success
│   │   │   - Next button → new card
│   │   │
│   │   ├── BatchConfiguration.tsx
│   │   │   - CSV upload (mascot ID per row)
│   │   │   - Auto-configure multiple cards
│   │   │   - Progress bar
│   │   │
│   │   └── CardLog.tsx
│   │       - Display all configured cards
│   │       - Export to CSV
│   │       - Search/filter
│   │
│   ├── services/
│   │   ├── nfcReader.ts
│   │   │   - ACR122U integration
│   │   │   - Read card
│   │   │   - Write card
│   │   │   - Verify write
│   │   │
│   │   ├── cardConfigurator.ts
│   │   │   - Generate Unique ID
│   │   │   - Validate data
│   │   │   - Format bytes
│   │   │
│   │   ├── cardStorage.ts
│   │   │   - Save to SQLite or CSV
│   │   │   - Export logs
│   │   │
│   │   └── validation.ts
│   │       - Card structure validation
│   │       - Mascot ID validation
│   │       - Byte layout validation
│   │
│   ├── types/
│   │   └── card.ts
│   │       - CardData interface
│   │       - ConfigurationLog interface
│   │
│   └── styles/
│       └── admin.css
│           - Light mode
│           - Responsive design
│
├── public/
│   ├── cardDataStructure.json (shared, symlink to /public)
│   └── favicon.ico
│
├── tests/
│   ├── nfcReader.test.ts
│   └── cardConfigurator.test.ts
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md (admin setup guide)
```

### 2.4 Key Features

#### 2.4.1 Reader Status

```typescript
// ReaderStatus component
const [readerConnected, setReaderConnected] = useState<boolean>(false);
const [readerStatus, setReaderStatus] = useState<string>('Disconnected');

useEffect(() => {
  const checkReader = async () => {
    const connected = await nfcReader.isAvailable();
    setReaderConnected(connected);
    setReaderStatus(
      connected ? 'ACR122U Connected ✓' : 'No reader detected ✗'
    );
  };

  checkReader();
  const interval = setInterval(checkReader, 1000);
  return () => clearInterval(interval);
}, []);

// Display: Green/red indicator + status text
```

#### 2.4.2 Unique ID Generation

```typescript
function generateUniqueID(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(16).slice(2, 6);

  return `${date}_${time}_${random}`;
  // Example: "20260612_143530_a7f2"
}
```

#### 2.4.3 Card Configuration & Write

```typescript
async function configureCard(
  mascotID: number,
  reader: NFCReader
): Promise<boolean> {
  try {
    // Detect card
    const card = await reader.detectCard();
    if (!card) {
      alert('Card not detected. Please scan a card.');
      return false;
    }

    // Generate Unique ID
    const uniqueID = generateUniqueID();

    // Format bytes
    const mascotByte = mascotID;
    const idBytes = encodeUniqueID(uniqueID);
    const pointsBytes = encodeUInt16(0);

    // Write to card
    await reader.write(card, 0, mascotByte);
    await reader.write(card, 1, idBytes);
    await reader.write(card, 5, pointsBytes);

    // Verify
    const verification = await reader.read(card, 0, 7);
    if (!verifyCardWrite(verification, mascotID, uniqueID)) {
      alert('Verification failed. Card data may be corrupted.');
      return false;
    }

    // Log to database/CSV
    await logCardConfiguration({
      mascotID,
      uniqueID,
      timestamp: new Date(),
      status: 'success',
    });

    return true;
  } catch (error) {
    console.error('Card configuration error:', error);
    alert('Error writing to card. Please retry.');
    return false;
  }
}
```

#### 2.4.4 Batch Configuration (CSV)

```typescript
async function batchConfigureCards(csvFile: File): Promise<void> {
  const csv = await csvFile.text();
  const rows = csv.split('\n').slice(1); // Skip header

  let successCount = 0;
  let failureCount = 0;

  for (const row of rows) {
    const [mascotID] = row.split(',');
    const mascotNum = parseInt(mascotID);

    if (mascotNum < 0 || mascotNum > 5) {
      failureCount++;
      console.warn(`Invalid mascot ID: ${mascotID}`);
      continue;
    }

    const success = await configureCard(mascotNum, nfcReader);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  alert(
    `Batch configuration complete: ${successCount} success, ${failureCount} failed`
  );
}
```

#### 2.4.5 Card Log & Export

```typescript
interface CardLog {
  id: string;
  mascotID: number;
  uniqueID: string;
  configuredAt: Date;
  status: 'success' | 'failed' | 'verified';
}

async function exportCardLog(): Promise<void> {
  const logs = await cardStorage.getAllLogs();

  // Format as CSV
  const csv =
    'Mascot ID,Unique ID,Configured At,Status\n' +
    logs
      .map(
        (log) =>
          `${log.mascotID},${log.uniqueID},${log.configuredAt},${log.status}`
      )
      .join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `card-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
```

### 2.5 UI Flow (Simple, Non-Technical)

```
┌─────────────────────────────────────┐
│  Wiz Kidz Card Configurator         │
├─────────────────────────────────────┤
│  Reader Status: ACR122U Connected ✓ │
├─────────────────────────────────────┤
│  Select Mascot:                     │
│  [🦚] [🦋] [🦊] [🐸] [🦌] [🐦]    │
│  Peacock Orchid Red Green Yellow Blue│
├─────────────────────────────────────┤
│  Selected: Peacock Pride (0)        │
│                                      │
│  1. Scan blank card on reader      │
│  2. Click "Initialize & Write"     │
│  3. Card ready when done           │
│                                      │
│  [Initialize & Write]               │
│  [Next Card]  [Batch Config]        │
├─────────────────────────────────────┤
│  Configured Today: 25 cards         │
│  [View Log] [Export CSV]            │
└─────────────────────────────────────┘
```

---

## 3. Post-Booth Score Page

### 3.1 Purpose & Audience

**Purpose:** Drive enrollment via score display. Player scans card, sees animated mascot + score + CTA to enroll.

**Audience:** Players (kids), Parents

**URL:** `https://games.wizkidz.ai/score`

**How it's triggered:**
1. Player scans card QR code with phone
2. QR code redirects to games.wizkidz.ai/score
3. Page uses NFC to read card (Android 12+, iOS 13.1+)
4. Displays mascot + score + enrollment CTA

### 3.2 Tech Stack

**Frontend:**
- React
- TypeScript
- Tailwind CSS

**Mobile NFC:**
- Web NFC API (Android 12+)
- Native iOS integration (React Native or webview)
- Fallback: Manual QR code scan (shows previous score link)

**Backend (Optional):**
- None (static page, reads from card only)
- OR: Analytics endpoint (if tracking unique IDs post-booth)

### 3.3 App Architecture

```
/score (GitHub Pages hosted)
├── src/
│   ├── App.tsx
│   │   - Check NFC capability
│   │   - Prompt card scan
│   │   - Load mascot assets
│   │
│   ├── components/
│   │   ├── CardReader.tsx
│   │   │   - "Tap card to read score"
│   │   │   - NFC event handler
│   │   │   - Error handling
│   │   │
│   │   ├── ScoreDisplay.tsx
│   │   │   - Animated mascot (large)
│   │   │   - Total Score (large text)
│   │   │   - "New Personal Best!" badge (if applicable)
│   │   │
│   │   ├── CTAButton.tsx
│   │   │   - "Enroll in Wiz Kidz Programs"
│   │   │   - Links to: wizkidz.ai/enroll
│   │   │
│   │   ├── ShareCard.tsx
│   │   │   - "Share your score"
│   │   │   - Social media share (optional)
│   │   │
│   │   └── FallbackQR.tsx
│   │       - If NFC unavailable
│   │       - Display QR code + instructions
│   │
│   ├── services/
│   │   ├── nfcReader.ts
│   │   │   - Web NFC API integration
│   │   │   - Read card data
│   │   │   - Error handling
│   │   │
│   │   ├── cardParser.ts
│   │   │   - Parse NTAG213 bytes
│   │   │   - Extract mascotID, totalPoints
│   │   │
│   │   └── analytics.ts (optional)
│   │       - Log: mascotID, score, timestamp
│   │       - NO unique user ID logged
│   │
│   ├── assets/
│   │   ├── mascots/ (PNG images, animated)
│   │   ├── logos/ (Wiz Kidz branding)
│   │   └── sounds/ (celebration audio, optional)
│   │
│   └── styles/
│       └── score.css
│           - Light mode
│           - Mobile-first design
│           - Animations
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
└── package.json
```

### 3.4 Key Features

#### 3.4.1 NFC Card Reading

```typescript
async function readCardViaWNFC(): Promise<CardData | null> {
  try {
    // Check NFC support
    if (!('NDEFReader' in window)) {
      console.warn('Web NFC not supported on this device');
      return null;
    }

    const ndef = new NDEFReader();
    await ndef.scan();

    // Listen for NFC tag detection
    return new Promise((resolve) => {
      ndef.onreading = async (event: any) => {
        const records = event.message.records;
        const cardData = parseNDEFRecords(records);
        resolve(cardData);
      };

      ndef.onerror = () => {
        console.error('NFC read error');
        resolve(null);
      };
    });
  } catch (error) {
    console.error('NFC initialization error:', error);
    return null;
  }
}

function parseNDEFRecords(records: any[]): CardData | null {
  for (const record of records) {
    if (record.recordType === 'bytes') {
      const bytes = new Uint8Array(record.data.buffer);

      return {
        mascotID: bytes[0],
        uniqueID: parseUniqueID(bytes.slice(1, 5)),
        totalPoints: parseUInt16(bytes.slice(5, 7)),
      };
    }
  }

  return null;
}
```

#### 3.4.2 Score Display Component

```typescript
interface ScoreDisplayProps {
  mascotID: number;
  totalPoints: number;
  mascotName: string;
}

export function ScoreDisplay({
  mascotID,
  totalPoints,
  mascotName,
}: ScoreDisplayProps): JSX.Element {
  const mascotImage = getMascotImage(mascotID);

  return (
    <div className="score-display light-mode">
      {/* Animated mascot */}
      <img
        src={mascotImage}
        alt={mascotName}
        className="mascot-animated"
        style={{ animation: 'floating 3s ease-in-out infinite' }}
      />

      {/* Score */}
      <div className="score-value">{totalPoints}</div>
      <div className="score-label">TOTAL POINTS</div>

      {/* Mascot name */}
      <div className="mascot-name">{mascotName}</div>

      {/* Celebration feedback */}
      <div className="celebration-feedback">
        🎉 Great job! You're awesome! 🎉
      </div>
    </div>
  );
}
```

#### 3.4.3 CTA Button

```typescript
function CTAButton(): JSX.Element {
  const handleEnroll = () => {
    window.location.href = 'https://wizkidz.ai/enroll';
  };

  return (
    <button
      onClick={handleEnroll}
      className="cta-button primary-color light-mode"
    >
      Enroll in Wiz Kidz Programs
      <span className="arrow"> →</span>
    </button>
  );
}
```

#### 3.4.4 Fallback (If NFC Unavailable)

```typescript
function FallbackQR(): JSX.Element {
  return (
    <div className="fallback-container light-mode">
      <h2>NFC Not Available</h2>
      <p>
        Your device doesn't support wireless card reading. Please:
      </p>

      <ol>
        <li>Visit: <strong>games.wizkidz.ai/score</strong></li>
        <li>Scan the QR code on your card</li>
        <li>Or upgrade to Android 12+ or iOS 13.1+</li>
      </ol>

      {/* Display QR code */}
      <div className="qr-placeholder">
        <img
          src="/qr-code.svg"
          alt="games.wizkidz.ai/score"
        />
      </div>

      {/* Or show score if previously loaded */}
      {previousScore && (
        <>
          <p>Your previous score: <strong>{previousScore}</strong></p>
          <CTAButton />
        </>
      )}
    </div>
  );
}
```

### 3.5 Privacy & Analytics

**Data displayed:**
- ✅ Mascot ID (from card)
- ✅ Total Points (from card)
- ✅ Enrollment CTA

**Data NOT displayed or tracked:**
- ❌ Unique User ID (not shown to player)
- ❌ Player device ID
- ❌ Player location
- ❌ Cookies (no tracking)
- ❌ Third-party analytics

**Optional logging (anonymous):**
```typescript
// Log: mascotID + score + timestamp
// NO unique identifier
async function logScorePageView(
  mascotID: number,
  totalPoints: number
): Promise<void> {
  // Post anonymously
  await fetch('/api/score-page-view', {
    method: 'POST',
    body: JSON.stringify({
      mascotID,
      totalPoints,
      timestamp: new Date(),
      // NO uniqueID, NO userAgent, NO IP
    }),
  });
}
```

### 3.6 Mobile Optimization

```css
/* Light mode (default) */
body {
  background-color: #FAFAFA;
  color: #2D2D2D;
  font-family: 'Poppins', sans-serif;
}

/* Mobile-first */
@media (max-width: 768px) {
  .score-display {
    padding: 2rem 1rem;
  }

  .mascot-animated {
    width: 200px;
    height: 200px;
  }

  .score-value {
    font-size: 3rem;
  }

  .cta-button {
    width: 100%;
    padding: 1rem;
  }
}

/* Large screens */
@media (min-width: 769px) {
  .score-display {
    max-width: 600px;
    margin: 0 auto;
  }

  .mascot-animated {
    width: 300px;
    height: 300px;
  }

  .score-value {
    font-size: 4rem;
  }
}
```

---

## 4. Deployment & Hosting

### 4.1 Admin Card Configurator

**Deployment:**
- Package as Electron app (Windows .exe, macOS .dmg, Linux .AppImage)
- OR: Deploy as web app (requires USB access permissions)
- Distribute to: Booth setup staff via company dashboard

**System Requirements:**
- Windows 7+ / macOS 10.10+ / Linux
- ACR122U reader connected via USB
- 200 MB disk space
- Internet connection (for card structure version check)

**Update Mechanism:**
- Auto-check for app updates on launch
- Silent update + restart (or notify user)

### 4.2 Post-Booth Score Page

**Deployment:**
- Static React app deployed to GitHub Pages: `games.wizkidz.ai/score`
- OR: Deploy to Vercel/Netlify for custom domain

**Hosting:**
```
games.wizkidz.ai/score
  ├── index.html
  ├── /js (React bundle)
  ├── /css (Tailwind bundle)
  └── /assets (mascot images, logos)
```

**Caching:**
- Static assets: Cache forever (fingerprint filenames)
- index.html: No cache (always latest)

**HTTPS:** Required (NFC API requires secure context)

---

## 5. Integration Points

### 5.1 Admin App ↔ Game App

**Both read from same file:**
```
/public/cardDataStructure.json

Admin app reads:
  - Validates byte layout before writing

Game app reads:
  - Validates version before reading card
  - Knows exact byte offsets
```

**Version mismatch handling:**
```typescript
// Admin app detects mismatch → Alert staff → Don't write
// Game app detects mismatch → Fall back to offline mode
```

### 5.2 Score Page ↔ Card Data

**Score page reads card directly:**
```typescript
// Player NFC scans at games.wizkidz.ai/score
// Card data read directly from NTAG213
// No server communication (except optional analytics)
// No unique ID sent anywhere
```

### 5.3 QR Code Integration

**Printed on every card:**
```
Front of card: Mascot artwork
Back of card: QR code linking to games.wizkidz.ai/score

QR content: https://games.wizkidz.ai/score
  → Mobile NFC auto-triggers on Android 12+
  → Manual tap to visit URL on iOS / older Android
```

---

## 6. Agent Workflow for Building Utils

### 6.1 Design Phase

**For Admin Card Configurator:**
```
1. Requirements:
   - Configure 50+ cards before event
   - Validate ACR122U reader connection
   - Batch configuration (CSV import)
   - Card logging for inventory

2. Tech Stack:
   - React + TypeScript + Tailwind
   - Electron (desktop app)
   - nfc-pcsc or Web NFC API

3. Estimated Effort: 5-7 hours
```

**For Post-Booth Score Page:**
```
1. Requirements:
   - Display score from card via NFC
   - Show animated mascot
   - CTA to enrollment page
   - Mobile-friendly
   - No user tracking

2. Tech Stack:
   - React + TypeScript + Tailwind
   - Web NFC API
   - GitHub Pages

3. Estimated Effort: 4-6 hours
```

### 6.2 Implementation Phase

**Admin app:**
```
✓ Step 1: Reader status component
✓ Step 2: Mascot selector
✓ Step 3: Card configuration form
✓ Step 4: Write to card logic
✓ Step 5: Batch CSV import
✓ Step 6: Card logging
✓ Step 7: Export functionality
✓ Step 8: Testing
```

**Score page:**
```
✓ Step 1: NFC reader integration
✓ Step 2: Card parser
✓ Step 3: Mascot display component
✓ Step 4: Score display
✓ Step 5: CTA button (enroll)
✓ Step 6: Fallback UI (NFC unavailable)
✓ Step 7: Mobile optimization
✓ Step 8: Testing on real devices
```

### 6.3 Testing Checklist

**Admin app:**
- [ ] Reader detection works
- [ ] Mascot selector functional
- [ ] Card write successful
- [ ] Data verification passes
- [ ] Batch import works (CSV)
- [ ] Card log exports to CSV
- [ ] Version check works
- [ ] Error handling graceful

**Score page:**
- [ ] NFC read works (Android 12+)
- [ ] Card data parsed correctly
- [ ] Mascot displays correctly
- [ ] Score displays correctly
- [ ] CTA button navigates correctly
- [ ] Fallback UI displays on iOS
- [ ] Mobile layout responsive
- [ ] No user tracking (verify network tab)
- [ ] HTTPS working

---

## 7. Future Enhancements

### 7.1 Admin App
- 🔄 Real-time card inventory dashboard
- 📊 Analytics: Most popular mascots, cards configured per event
- 🔐 Security: Password-protect app, log admin actions
- 🌍 Multi-language support (Spanish, Mandarin)
- ☁️ Cloud sync: Back up card logs to cloud

### 7.2 Score Page
- 🎬 Animated mascot reactions (different per score range)
- 📱 SMS/Email enrollment CTA (request permission)
- 🏆 Leaderboard (top 10 scores from event, anonymous)
- 🎤 Parent testimonial videos (on score page)
- 🔐 Optional: Player can save score to account (with parental consent)

### 7.3 Integration
- 🔗 Admin app ↔ Booth kiosk sync (real-time inventory)
- 📈 Central dashboard for multi-booth events
- 🎯 A/B testing CTA variations on score page

---

## Summary: When to Use Each Tool

| Scenario | Tool | When |
|----------|------|------|
| Setting up booth | Admin Card Configurator | Before event, once per card |
| Playing games | Booth Game App (Layer 01) | During event, repeatedly |
| After booth | Post-Booth Score Page | After event, weeks/months later |
| Managing versions | cardDataStructure.json | When changing card format |
| Training staff | Admin app README + tutorial | Booth setup day |

---

**Document version:** 1.0 (FINAL)  
**Last updated:** June 2026  
**Maintained by:** Tae (IT Specialist, Wiz Kidz)  
**Companion documents:** 00-wizkidz-global.md, 01-conference-booth-game.md
