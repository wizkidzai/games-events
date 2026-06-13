import { getMascotByID } from '@wizkidz/mascot-system';
import { setMascotState } from './gameState';
export function showHint(id: number): void { const m = getMascotByID(id); setMascotState('confused', m.dialogue.hint); setTimeout(() => setMascotState('idle', ''), 2500); }
export function showSuccess(id: number): void { const m = getMascotByID(id); setMascotState('happy', m.dialogue.success); setTimeout(() => setMascotState('idle', ''), 2000); }
export function showFailure(id: number): void { const m = getMascotByID(id); setMascotState('sad', m.dialogue.failure); setTimeout(() => setMascotState('idle', ''), 2000); }
export function showCelebration(id: number): void { const m = getMascotByID(id); setMascotState('celebrating', m.dialogue.celebration); }
