export interface Game {
  id: string;
  name: string;
  description: string;
  mascotID: number;
  ageGroups: number[];
  difficulty: ('easy' | 'medium' | 'hard')[];
  estimatedPlaytime: number;
  featured: boolean;
}
