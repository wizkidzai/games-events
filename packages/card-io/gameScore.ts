export interface LeaderboardEntry {
  gameScore: number;
  totalScore: number;
  difficulty: string;
  timestamp: string;
}

export class ScoreManager {
  private cardScorePrevious: number = 0;
  private gameScore: number = 0;
  private leaderboard: LeaderboardEntry[] = [];

  load(cardTotalPoints: number): void {
    this.cardScorePrevious = cardTotalPoints;
    this.gameScore = 0;
  }

  addPoints(points: number): void {
    this.gameScore += points;
  }

  get currentGameScore(): number {
    return this.gameScore;
  }

  get newTotalScore(): number {
    return this.cardScorePrevious + this.gameScore;
  }

  get previousScore(): number {
    return this.cardScorePrevious;
  }

  recordToLeaderboard(difficulty: string): void {
    this.leaderboard.push({
      gameScore: this.gameScore,
      totalScore: this.newTotalScore,
      difficulty,
      timestamp: new Date().toISOString(),
    });
    this.leaderboard = this.leaderboard.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
  }

  getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  resetLeaderboard(): void {
    this.leaderboard = [];
  }

  resetGameScore(): void {
    this.gameScore = 0;
  }
}
