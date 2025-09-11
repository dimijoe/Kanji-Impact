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

  static async saveGameSession(session: Omit<GameSession, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'gameSessions'), {
      ...session,
      completedAt: new Date()
    });
    return docRef.id;
  }

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
// Enregistre un score de partie
export async function saveGameResult(gameState: GameState) {
  // Adapte le modèle selon ce que tu veux garder !
  await addDoc(collection(db, 'gameScores'), {
    userId: gameState.userId,            // À passer depuis l'état de l'utilisateur connecté
    score: gameState.score,
    level: gameState.level,
    mode: gameState.mode,
    speed: gameState.speed,
    date: serverTimestamp()
    // Tu peux aussi ajouter : username/displayName/game details…
  });
}

/ Charge le top N des scores pour un niveau
export async function getHighScoresByLevel(level: string, topN: number = 5) {
  const scoresRef = collection(db, 'gameScores');
  const q = query(
    scoresRef,
    where('level', '==', level),
    orderBy('score', 'desc'),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    user: doc.data().userId || 'Anonyme',      // tu peux aussi stocker le username dans le doc pour l'afficher
    score: doc.data().score
  }));
}




  

  private static checkForNewAchievements(currentProfile: UserProfile, updates: Partial<UserProfile>): Achievement[] {
    const achievements: Achievement[] = [];
    
    // Perfect Game Achievement
    const perfectGameAchievement = currentProfile.achievements.find(a => a.id === 'perfect-accuracy');
    if (!perfectGameAchievement || !perfectGameAchievement.completed) {
      // This would be checked based on the current game session
      // Implementation depends on how you want to track this
    }

    return achievements;
  }
}
