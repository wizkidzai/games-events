export type ActionType =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'CONFIRM'
  | 'CANCEL'
  | 'ACTION_1'
  | 'ACTION_2';

export type InputSource = 'camera' | 'joystick' | 'buttons' | 'keyboard' | 'touch';

export interface InputAction {
  type: ActionType;
  timestamp: number;
  source: InputSource;
}

const KEY_MAP: Record<string, ActionType> = {
  ArrowUp: 'MOVE_UP',
  ArrowDown: 'MOVE_DOWN',
  ArrowLeft: 'MOVE_LEFT',
  ArrowRight: 'MOVE_RIGHT',
  Enter: 'CONFIRM',
  ' ': 'CONFIRM',
  Escape: 'CANCEL',
  z: 'ACTION_1',
  x: 'ACTION_2',
};

type ActionHandler = (action: InputAction) => void;

export class InputSystem {
  private handlers: ActionHandler[] = [];
  private cleanupFns: (() => void)[] = [];

  constructor(primaryDevices: InputSource[] = []) {
    void primaryDevices;
  }

  start(): void {
    const onKey = (e: KeyboardEvent) => {
      const type = KEY_MAP[e.key];
      if (type) {
        this.emit({ type, timestamp: Date.now(), source: 'keyboard' });
      }
    };
    document.addEventListener('keydown', onKey);
    this.cleanupFns.push(() => document.removeEventListener('keydown', onKey));
  }

  stop(): void {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
  }

  on(handler: ActionHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  private emit(action: InputAction): void {
    this.handlers.forEach(h => h(action));
  }
}
