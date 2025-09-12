import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GameMode, GameSpeed, KanjiLevel } from '../types';
import { GameService } from '../services/gameService';
import { 
  Rocket, Brain, Zap, ScrollText, BookOpen, User, LogIn, Monitor, 
  Smartphone, Target, AlertTriangle, Trophy, Star, Crown, Medal,
  X, TrendingUp, Calendar, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MainMenuProps {
  onStart: (
    mode: GameMode, 
    speed: GameSpeed, 
    level: KanjiLevel, 
    isMobileVersion?: boolean,
    missionTarget?: number,
    errorsAllowed?: number
  ) => void;
  onRevision: (level: KanjiLevel) => void;
  onShowProfile: () => void;
}

interface UserStats {
  bestScores: { [key: string]: number };
  totalGames: number;
  totalScore: number;
  averageAccuracy: number;
}

export function MainMenu({ onStart, onRevision, onShowProfile }: MainMenuProps) {
  const { currentUser, userProfile } = useAuth();
  const [mode, setMode] = useState<GameMode>('onYomi');
  const [speed, setSpeed] = useState<GameSpeed>('normal');
  const [level, setLevel] = useState<KanjiLevel>('N5');
  const [gameVersion, setGameVersion] = useState<'web' | 'mobile'>('web');
  const [missionTarget, setMissionTarget] = useState(10);
  const [errorsAllowed, setErrorsAllowed] = useState(3);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    bestScores: {},
    totalGames: 0,
    totalScore: 0,
    averageAccuracy: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Charger les statistiques utilisateur
  useEffect(() => {
    const loadUserStats = async () => {
      if (!currentUser) return;
      
      setLoadingStats(true);
      try {
        const sessions = await GameService.getUserGameSessions(currentUser.uid, 50);
        
        // Calculer les meilleurs scores par niveau
        const bestScores: { [key: string]: number } = {};
        sessions.forEach(session => {
          if (!bestScores[session.level] || session.score > bestScores[session.level]) {
            bestScores[session.level] = session.score;
          }
        });

        // Calculer les stats générales
        const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
        const totalAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0);
        
        setUserStats({
          bestScores,
          totalGames: sessions.length,
          totalScore,
          averageAccuracy: sessions.length > 0 ? totalAccuracy / sessions.length : 0
        });
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadUserStats();
  }, [currentUser]);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play();
    }
  }, []);

  const handleStart = () => {
    onStart(mode, speed, level, gameVersion === 'mobile', missionTarget, errorsAllowed);
  };

  const getLevelColor = (levelKey: string) => {
    const colors = {
      'N5': 'text-green-400',
      'N4': 'text-blue-400', 
      'N3': 'text-yellow-400',
      'N2': 'text-orange-400',
      'N1': 'text-red-400'
    };
    return colors[levelKey as keyof typeof colors] || 'text-gray-400';
  };

  const getLevelIcon = (levelKey: string) => {
    const currentBest = userStats.bestScores[levelKey];
    if (!currentBest) return <Medal className="w-4 h-4 text-gray-500" />;
    if (currentBest >= 2000) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (currentBest >= 1000) return <Trophy className="w-4 h-4 text-orange-400" />;
    return <Star className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center relative overflow-hidden p-4">
      {/* Background animation */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-gray-900"></div>
      
      {/* Animated stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`
            }}
          ></div>
        ))}
      </div>
      
      <audio
        ref={audioRef}
        src="https://www.epidemicsound.com/fr/music/tracks/b00691e1-e53b-4442-9900-64188a134857/"
        loop
      />
      
      <div className="relative bg-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-2xl w-full max-w-2xl mx-auto p-6 sm:p-8">
        {/* User Info / Auth Button */}
        <div className="absolute -top-4 right-4">
          {currentUser ? (
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-full transition-colors flex items-center gap-2 touch-manipulation shadow-lg"
              title="Voir le profil"
            >
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
              ) : (
                <User size={20} />
              )}
            </button>
          ) : (
            <Link to="/auth">
              <button
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors touch-manipulation"
                title="Se connecter"
              >
                <LogIn size={20} />
              </button>
            </Link>
          )}
        </div>

        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <Rocket size={40} className="text-sky-400 sm:w-12 sm:h-12" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-2 bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 text-transparent bg-clip-text mt-4">
          Kanji Invasion
        </h1>
        <p className="text-gray-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">Master kanji through space combat</p>
        
        {/* Welcome message for logged in users */}
        {currentUser && userProfile && (
          <div className="bg-sky-500/20 border border-sky-500/50 rounded-lg p-3 mb-6 text-center">
            <p className="text-sky-300 text-sm">
              Bienvenue, <span className="font-semibold">{userProfile.displayName}</span>!
            </p>
          </div>
        )}

        {/* Best Scores Display */}
        {currentUser && Object.keys(userStats.bestScores).length > 0 && (
          <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-600">
            <h3 className="text-lg font-bold text-center mb-3 flex items-center justify-center gap-2">
              <Trophy className="text-yellow-400" size={20} />
              Meilleurs Scores
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['N5', 'N4', 'N3', 'N2', 'N1'].map(levelKey => (
                <div key={levelKey} className="text-center">
                  <div className={`text-xs font-medium ${getLevelColor(levelKey)}`}>{levelKey}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getLevelIcon(levelKey)}
                    <span className="text-sm font-bold text-white">
                      {userStats.bestScores[levelKey] || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration de base */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <Brain size={18} /> Mode de jeu
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as GameMode)}
                className="w-full bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600 focus:border-sky-500 focus:ring focus:ring-sky-500/20 text-white touch-manipulation"
              >
                <option value="onYomi">On yomi (lecture chinoise)</option>
                <option value="kunYomi">Kun yomi (lecture japonaise)</option>
                <option value="meaning">Traduction Française</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <ScrollText size={18} /> Niveau Kanji
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as KanjiLevel)}
                className="w-full bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600 focus:border-sky-500 focus:ring focus:ring-sky-500/20 text-white touch-manipulation"
              >
                <option value="N5">JLPT N5 (Débutant)</option>
                <option value="N4">JLPT N4</option>
                <option value="N3">JLPT N3</option>
                <option value="N2">JLPT N2</option>
                <option value="N1">JLPT N1 (Avancé)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <Zap size={18} /> Vitesse
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as GameSpeed)}
                className="w-full bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600 focus:border-sky-500 focus:ring focus:ring-sky-500/20 text-white touch-manipulation"
              >
                <option value="slow">Entraînement (Lent)</option>
                <option value="normal">Normal</option>
                <option value="fast">Expert (Rapide)</option>
              </select>
            </div>
          </div>

          {/* Configuration avancée */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <Target size={18} /> Objectif Mission
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={missionTarget}
                  onChange={(e) => setMissionTarget(Number(e.target.value))}
                  className="flex-1 accent-sky-500"
                />
                <div className="bg-sky-500/20 text-sky-300 px-3 py-2 rounded-lg min-w-[60px] text-center font-bold">
                  {missionTarget}
                </div>
              </div>
              <p className="text-xs text-gray-400">Nombre de kanjis à réussir pour gagner</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertTriangle size={18} /> Erreurs Autorisées
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={errorsAllowed}
                  onChange={(e) => setErrorsAllowed(Number(e.target.value))}
                  className="flex-1 accent-red-500"
                />
                <div className="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg min-w-[60px] text-center font-bold">
                  {errorsAllowed}
                </div>
              </div>
              <p className="text-xs text-gray-400">Kanjis manqués avant Game Over</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <Monitor size={18} /> Version de jeu
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameVersion('web')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all touch-manipulation ${
                    gameVersion === 'web'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Monitor size={18} />
                  <span className="text-sm font-medium">Web</span>
                </button>
                <button
                  onClick={() => setGameVersion('mobile')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all touch-manipulation ${
                    gameVersion === 'mobile'
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Smartphone size={18} />
                  <span className="text-sm font-medium">Mobile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Score Preview */}
        <div className="bg-gray-900/50 rounded-xl p-4 mt-6 border border-gray-600">
          <h3 className="text-sm font-bold text-center mb-2 text-gray-300">Système de Score</h3>
          <div className="flex justify-center gap-6 text-xs">
            <div className="text-center">
              <div className="text-green-400 font-bold">+100</div>
              <div className="text-gray-400">Kanji réussi</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold">-50</div>
              <div className="text-gray-400">Kanji manqué</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-bold">Max</div>
              <div className="text-gray-400">{missionTarget * 100} pts</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          {/* BOUTON REVISER (APPRENTISSAGE) */}
          <button
            onClick={() => onRevision(level)}
            className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 active:scale-95 transition-all duration-200 font-bold text-base sm:text-lg gap-2 touch-manipulation"
          >
            <BookOpen size={20} /> Réviser (Apprentissage)
          </button>
          
          {/* BOUTON DE JEU */}
          <button
            onClick={handleStart}
            disabled={!currentUser}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-sky-600 hover:to-blue-700 transform hover:scale-105 active:scale-95 transition-all duration-200 font-bold text-base sm:text-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentUser ? 'Commencer la mission' : 'Se connecter pour jouer'}
          </button>
        </div>
      </div>

      {/* User Stats Modal */}
      {showUserModal && currentUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-800/95 backdrop-blur-lg rounded-2xl w-full max-w-md mx-auto relative border border-gray-700 p-6">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors touch-manipulation"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-sky-500">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-sky-500 flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 text-transparent bg-clip-text">
                {userProfile?.displayName || 'Joueur'}
              </h2>
              <p className="text-gray-400 text-sm">{currentUser.email}</p>
            </div>

            {loadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Chargement des statistiques...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-green-400" />
                      <span className="text-xs text-gray-400">Parties</span>
                    </div>
                    <div className="text-xl font-bold text-white">{userStats.totalGames}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Award size={16} className="text-yellow-400" />
                      <span className="text-xs text-gray-400">Précision</span>
                    </div>
                    <div className="text-xl font-bold text-white">{Math.round(userStats.averageAccuracy)}%</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy size={16} className="text-orange-400" />
                    <span className="text-sm text-gray-400">Meilleurs Scores</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(userStats.bestScores)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([level, score]) => (
                        <div key={level} className="flex justify-between items-center">
                          <span className={`text-sm font-medium ${getLevelColor(level)}`}>{level}</span>
                          <div className="flex items-center gap-1">
                            {getLevelIcon(level)}
                            <span className="text-sm font-bold text-white">{score}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Calendar size={16} className="text-blue-400" />
                    <span className="text-xs text-gray-400">Membre depuis</span>
                  </div>
                  <div className="text-sm text-white">
                    {userProfile?.createdAt?.toLocaleDateString('fr-FR') || 'Récemment'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}