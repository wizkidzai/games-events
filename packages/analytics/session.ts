const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export interface SessionConfig {
  onTimeout: () => void;
}

export class SessionManager {
  private lastActivity: number = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;
  private onTimeout: () => void;

  constructor(config: SessionConfig) {
    this.onTimeout = config.onTimeout;
  }

  start(): void {
    this.recordActivity();
    this.timer = setInterval(() => this.checkInactivity(), 60_000);
    document.addEventListener('pointerdown', this.recordActivity);
    document.addEventListener('keydown', this.recordActivity);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener('pointerdown', this.recordActivity);
    document.removeEventListener('keydown', this.recordActivity);
  }

  private recordActivity = (): void => {
    this.lastActivity = Date.now();
  };

  private checkInactivity(): void {
    if (Date.now() - this.lastActivity > INACTIVITY_MS) {
      this.onTimeout();
    }
  }

  getLastActivity(): number {
    return this.lastActivity;
  }
}
