import { writeScoreWithRetry } from '@wizkidz/card-io';
import type { NFCReaderInterface } from '@wizkidz/card-io';
import { getState } from './gameState';

export async function persistScoreToCard(reader: NFCReaderInterface): Promise<boolean> {
  const { totalScore } = getState();
  return writeScoreWithRetry(reader, totalScore);
}
