import mascotsData from './mascots.json';

export interface MascotDialogue {
  hint: string;
  success: string;
  failure: string;
  celebration: string;
}

export interface Mascot {
  id: number;
  name: string;
  color: string;
  personality: string;
  greeting: string;
  encouragement: string[];
  celebration: string;
  hint: string;
  dialogue: MascotDialogue;
}

export const MASCOTS: Mascot[] = mascotsData.mascots as Mascot[];

export function getMascotByID(id: number): Mascot {
  const mascot = MASCOTS.find(m => m.id === id);
  if (!mascot) throw new Error(`Unknown mascot ID: ${id}`);
  return mascot;
}

export function getMascotColor(id: number): string {
  return getMascotByID(id).color;
}

export const MASCOT_ANIMATION_STATES = ['idle', 'happy', 'confused', 'sad', 'celebrating'] as const;
export type MascotAnimationState = (typeof MASCOT_ANIMATION_STATES)[number];
