import { getMascotByID } from '@wizkidz/mascot-system';
import { setMascotState } from './gameState';

export function showHint(mascotID: number): void {
  const m = getMascotByID(mascotID);
  setMascotState('confused', m.dialogue.hint);
  setTimeout(() => setMascotState('idle', ''), 2500);
}

export function showSuccess(mascotID: number): void {
  const m = getMascotByID(mascotID);
  setMascotState('happy', m.dialogue.success);
  setTimeout(() => setMascotState('idle', ''), 2000);
}

export function showFailure(mascotID: number): void {
  const m = getMascotByID(mascotID);
  setMascotState('sad', m.dialogue.failure);
  setTimeout(() => setMascotState('idle', ''), 2000);
}

export function showCelebration(mascotID: number): void {
  const m = getMascotByID(mascotID);
  setMascotState('celebrating', m.dialogue.celebration);
}
