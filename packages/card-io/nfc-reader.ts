import type { CardData } from './cardData';
import { parseUInt16, encodeUInt16, parseUniqueID } from './cardData';

const CARD_DATA_VERSION = '1.0';

export interface NFCReaderInterface {
  isAvailable(): boolean;
  detectCard(): Promise<RawCard | null>;
  write(card: RawCard, byteOffset: number, data: Uint8Array | number): Promise<void>;
  read(card: RawCard, byteOffset: number, length: number): Promise<Uint8Array>;
}

export interface RawCard {
  uid: string;
  bytes: Uint8Array;
}

export async function validateCardStructureVersion(): Promise<boolean> {
  try {
    const res = await fetch('/cardDataStructure.json');
    const structure = await res.json();
    if (structure.version !== CARD_DATA_VERSION) {
      console.error(
        `Card structure version mismatch: expected ${CARD_DATA_VERSION}, got ${structure.version}`
      );
      return false;
    }
    return true;
  } catch {
    console.warn('Could not validate card structure version — proceeding anyway');
    return true;
  }
}

export async function readCard(reader: NFCReaderInterface): Promise<CardData | null> {
  try {
    const card = await reader.detectCard();
    if (!card) return null;

    return {
      uid: card.uid,
      mascotID: card.bytes[0],
      uniqueID: parseUniqueID(card.bytes.slice(1, 5)),
      totalPoints: parseUInt16(card.bytes.slice(5, 7)),
    };
  } catch (error) {
    console.error('Card read error:', error);
    return null;
  }
}

export async function writeScoreToCard(
  reader: NFCReaderInterface,
  newTotalPoints: number
): Promise<boolean> {
  try {
    const card = await reader.detectCard();
    if (!card) {
      console.error('No card detected for write');
      return false;
    }
    const pointsBytes = encodeUInt16(newTotalPoints);
    await reader.write(card, 5, pointsBytes);
    return true;
  } catch (error) {
    console.error('Card write error:', error);
    return false;
  }
}

export async function writeScoreWithRetry(
  reader: NFCReaderInterface,
  newTotalPoints: number,
  maxAttempts = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const success = await writeScoreToCard(reader, newTotalPoints);
    if (success) return true;
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

let previousCardUID: string | null = null;

export async function checkCardSwap(reader: NFCReaderInterface): Promise<boolean> {
  const card = await reader.detectCard();
  if (!card) return false;
  if (previousCardUID && card.uid !== previousCardUID) {
    previousCardUID = card.uid;
    return true;
  }
  previousCardUID = card.uid;
  return false;
}

export function resetCardSwapTracking(): void {
  previousCardUID = null;
}
