export interface CardLogEntry {
  id: string;
  mascotID: number;
  mascotName: string;
  uniqueID: string;
  configuredAt: string;
  status: 'success' | 'failed' | 'verified';
}
