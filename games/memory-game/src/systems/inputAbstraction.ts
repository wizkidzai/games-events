export type ActionType = 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_LEFT' | 'MOVE_RIGHT' | 'CONFIRM' | 'CANCEL' | 'ACTION_1' | 'ACTION_2';
export type InputSource = 'camera' | 'joystick' | 'buttons' | 'keyboard';
export interface InputAction { type: ActionType; timestamp: number; source: InputSource; }

const KEY_MAP: Record<string, ActionType> = {
  ArrowUp: 'MOVE_UP', ArrowDown: 'MOVE_DOWN', ArrowLeft: 'MOVE_LEFT', ArrowRight: 'MOVE_RIGHT',
  Enter: 'CONFIRM', ' ': 'CONFIRM', Escape: 'CANCEL', z: 'ACTION_1', x: 'ACTION_2',
};

type Handler = (a: InputAction) => void;

export class InputSystem {
  private handlers: Handler[] = [];
  private cleanups: (() => void)[] = [];
  constructor(_primaryDevices: InputSource[] = []) {}
  start(): void {
    const onKey = (e: KeyboardEvent) => {
      const type = KEY_MAP[e.key];
      if (type) this.emit({ type, timestamp: Date.now(), source: 'keyboard' });
    };
    document.addEventListener('keydown', onKey);
    this.cleanups.push(() => document.removeEventListener('keydown', onKey));
  }
  stop(): void { this.cleanups.forEach(f => f()); this.cleanups = []; }
  on(h: Handler): () => void {
    this.handlers.push(h);
    return () => { this.handlers = this.handlers.filter(x => x !== h); };
  }
  private emit(a: InputAction): void { this.handlers.forEach(h => h(a)); }
}
