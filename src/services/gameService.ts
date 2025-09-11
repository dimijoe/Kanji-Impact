import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GameState, GameSession, UserProfile, Badge, Achievement, KanjiLevel, KanjiAttempt } from '../types';

export class GameService {
  // Enregistrer une tentative sur un kanji spécifique
  static async saveKanjiAttempt(attempt: Omit<KanjiAttempt, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'kanjiAttempts'), {
      ...attempt,
      attemptedAt: new Date()
    });
    return docRef.id;
  }

  // Récupérer les 5 dernières tentatives pour un kanji spécifique
  static async getKanjiAttempts(userId: string, kanjiId: string, limitCount: number = 5): Promise<KanjiAttempt[]> {
    const q = query(
      collection(db, 'kanjiAttempts'),
      where('userId', '==', userId),
      where('kanjiId', '==', kanjiId),
      orderBy('attemptedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      attemptedAt: doc.data().attemptedAt.toDate()
    })) as KanjiAttempt[];
  }

  // Enregistrer une session de jeu complète
  static async saveGameSession(session: Omit<GameSession, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'gameSessions'), {
      ...session,
      completedAt: new Date()
    });
    return docRef.id;
  }

  // Récupérer les sessions de jeu utilisateur
  static async getUserGameSessions(userId: string, limitCount: number = 10): Promise<GameSession[]> {
    const q = query(
      collection(db, 'gameSessions'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt.toDate()
    })) as GameSession[];
  }

  // Leaderboard sur les parties complètes
  static async getLeaderboard(level: KanjiLevel, limitCount: number = 10): Promise<any[]> {
    const q = query(
      collection(db, 'gameSessions'),
      where('level', '==', level),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  // Nouvelle méthode : enregistrer un score type "GameOver"
  static async saveGameResult(gameState: GameState) {
    if (!gameState.userId) throw new Error("Aucun userId fourni !");
    if (typeof gameState.score !== "number") throw new Error("Score absent ou invalide !");
    await addDoc(collection(db, 'gameScores'), {
      userId: gameState.userId,
      displayName: gameState.displayName || "Anonyme",
      score: gameState.score,
      level: gameState.level,
      mode: gameState.mode,
      speed: gameState.speed,
      date: serverTimestamp()
      // Ajoute ici d'autres infos utiles si besoin
    });
  }

  // Nouvelle méthode : top N scores JLPT par niveau (pour leaderboard GameOver)
  static async getHighScoresByLevel(level: string, topN: number = 5) {
    const scoresRef = collection(db, 'gameScores');
    const q = query(
      scoresRef,
      where('level', '==', level),
      orderBy('score', 'desc'),
      limit(topN)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      user: doc.data().displayName || doc.data().userId || 'Anonyme',
      score: doc.data().score
    }));
  }

  // Mise à jour des stats utilisateur après partie
  static async updateUserStats(
    userId: string,
    gameSession: Omit<GameSession, 'id' | 'userId'>,
    currentProfile: UserProfile
  ): Promise<Partial<UserProfile>> {
    const updates: Partial<UserProfile> = {
      totalGamesPlayed: currentProfile.totalGamesPlayed + 1,
      totalScore: currentProfile.totalScore + gameSession.score,
      bestScore: Math.max(currentProfile.bestScore, gameSession.score),
      lastLoginAt: new Date()
    };
    // Update level progress
    const levelProgress = { ...currentProfile.levelProgress };
    const currentLevelProgress = levelProgress[gameSession.level];

    levelProgress[gameSession.level] = {
      ...currentLevelProgress,
      gamesPlayed: currentLevelProgress.gamesPlayed + 1,
      averageAccuracy: (
        (currentLevelProgress.averageAccuracy * currentLevelProgress.gamesPlayed + gameSession.accuracy) /
        (currentLevelProgress.gamesPlayed + 1)
      ),
      masteredKanjis: new Set([
        ...Array.from(currentLevelProgress.masteredKanjis),
        ...gameSession.kanjisDestroyed
      ])
    };
    updates.levelProgress = levelProgress;

    // Check for new badges and achievements
    const newBadges = this.checkForNewBadges(currentProfile, updates);
    const newAchievements = this.checkForNewAchievements(currentProfile, updates);
    if (newBadges.length > 0) {
      updates.badges = [...currentProfile.badges, ...newBadges];
    }
    if (newAchievements.length > 0) {
      updates.achievements = [...currentProfile.achievements, ...newAchievements];
    }
    return updates;
  }

  private static checkForNewBadges(currentProfile: UserProfile, updates: Partial<UserProfile>): Badge[] {
    const badges: Badge[] = [];
    const existingBadgeIds = new Set(currentProfile.badges.map(b => b.id));
    // First Game Badge
    if (currentProfile.totalGamesPlayed === 0 && !existingBadgeIds.has('first-game')) {
      badges.push({
        id: 'first-game',
        name: 'First Steps',
        description: 'Played your first game!',
        icon: '🎮',
        unlockedAt: new Date(),
        rarity: 'common'
      });
    }
    // High Score Badges
    if (updates.bestScore && updates.bestScore >= 1000 && !existingBadgeIds.has('score-1000')) {
      badges.push({
        id: 'score-1000',
        name: 'Kanji Warrior',
        description: 'Reached 1000 points in a single game!',
        icon: '⚔️',
        unlockedAt: new Date(),
        rarity: 'rare'
      });
    }
    if (updates.bestScore && updates.bestScore >= 5000 && !existingBadgeIds.has('score-5000')) {
      badges.push({
        id: 'score-5000',
        name: 'Kanji Master',
        description: 'Reached 5000 points in a single game!',
        icon: '👑',
        unlockedAt: new Date(),
        rarity: 'epic'
      });
    }
    // Games Played Badges
    if (updates.totalGamesPlayed && updates.totalGamesPlayed >= 10 && !existingBadgeIds.has('games-10')) {
      badges.push({
        id: 'games-10',
        name: 'Dedicated Learner',
        description: 'Played 10 games!',
        icon: '📚',
        unlockedAt: new Date(),
        rarity: 'common'
      });
    }
    return badges;
  }

  private static checkForNewAchievements(currentProfile: UserProfile, updates: Partial<UserProfile>): Achievement[] {
    const achievements: Achievement[] = [];
    // TODO : implémenter selon ta logique de jeu !
    return achievements;
  }
}

// (optionnel - pour compatibilité avec certains imports)
export const GameServiceSingleton = GameService;
export default GameService;
