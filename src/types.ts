export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  totalGamesPlayed: number;
  totalScore: number;
  bestScore: number;
  badges: string[];
  achievements: string[];
  levelProgress: {
    [key: string]: LevelProgress;
  };
}
