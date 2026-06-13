export interface CardData {
  uid: string;
  mascotID: number;
  uniqueID: string;
  totalPoints: number;
}

export function parseUInt16(bytes: Uint8Array): number {
  return (bytes[0] << 8) | bytes[1];
}

export function encodeUInt16(value: number): Uint8Array {
  const clamped = Math.min(65535, Math.max(0, value));
  return new Uint8Array([(clamped >> 8) & 0xff, clamped & 0xff]);
}

export function parseUniqueID(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function encodeUniqueID(uniqueID: string): Uint8Array {
  const hex = uniqueID.replace(/[^0-9a-fA-F]/g, '').padEnd(8, '0').slice(0, 8);
  const result = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
}

export function generateUniqueID(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(16).slice(2, 6);
  return `${date}_${time}_${random}`;
}
