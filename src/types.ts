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
  badges: Badge[];
  achievements: Achievement[];
  levelProgress: {
    [key: string]: LevelProgress;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  unlockedAt?: Date;
  category: 'score' | 'accuracy' | 'speed' | 'consistency' | 'special';
}

export interface LevelProgress {
  level: KanjiLevel;
  totalKanjisLearned: number;
  masteredKanjis: Set<string>;
  averageAccuracy: number;
  bestTime: number;
  gamesPlayed: number;
}

export interface GameSession {
  id?: string;
  userId: string;
  mode: GameMode;
  level: KanjiLevel;
  speed: GameSpeed;
  score: number;
  correctAnswers: number;
  totalAttempts: number;
  accuracy: number;
  duration: number;
  kanjisDestroyed: string[];
  completedAt: Date;
}

export interface KanjiAttempt {
  id?: string;
  userId: string;
  kanjiId: string;
  kanjiCharacter: string;
  mode: GameMode;
  userAnswer: string;
  correctAnswer: string[];
  isCorrect: boolean;
  attemptedAt: Date;
  gameSessionId?: string;
}

export interface GameState {
  score: number;
  shields: number;
  gameOver: boolean;
  currentKanji: Kanji | null;
  mode: GameMode;
  speed: GameSpeed;
  level: KanjiLevel;
  destroyedKanjis: Set<string>;
  correctAnswers: number;
  totalAttempts: number;
}

export type GameMode = 'onYomi' | 'kunYomi' | 'meaning';
export type GameSpeed = 'slow' | 'normal' | 'fast';
export type KanjiLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'Jōyō1' | 'Jōyō2';

export interface Kanji {
  id: string;
  character: string;
  meanings: string[];
  onYomi: string[];
  kunYomi: string[];
  group: KanjiLevel;
  difficulty?: number;
  strokes?: number;
  frequency?: number;
}