import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProfile } from './components/UserProfile';
import { Cockpit } from './components/Cockpit';
import { GameOver } from './components/GameOver';
import { MainMenu } from './components/MainMenu';
import { Learning } from './components/Learning';
import { AuthPage } from './components/AuthPage'; // Import AuthPage
import { GameState, GameMode, GameSpeed, KanjiLevel, Kanji } from './types';
import { kanjis } from './data/kanjis';
import { GameService } from './services/gameService';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'; // Import BrowserRouter, Routes, Route, Navigate, Link

const INITIAL_STATE: GameState = {
  score: 0,
  shields: 3,
  gameOver: false,
  currentKanji: null,
  mode: 'onYomi',
  speed: 'normal',
  level: 'N5',
  destroyedKanjis: new Set(),
  correctAnswers: 0,
  totalAttempts: 0,
};

type AppScreen = 'menu' | 'game' | 'learning';
const SPEED_MAP = {
  slow: 8000,
  normal: 5000,
  fast: 3000,
};

function GameApp() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu');
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [isMobileVersion, setIsMobileVersion] = useState(false);

  // Redirect to auth if not logged in and trying to play
  useEffect(() => {
    if (currentScreen === 'game' && !currentUser) {
      setCurrentScreen('menu');
    }
  }, [currentScreen, currentUser]);

  useEffect(() => {
    if (currentScreen === 'game' && !gameState.gameOver) {
      const spawnKanji = () => {
        const levelKanjis = kanjis.filter(k => k.group === gameState.level);
        // Filter out already destroyed kanjis
        const availableKanjis = levelKanjis.filter(k => !gameState.destroyedKanjis.has(k.id));
        
        // If all kanjis are destroyed, end the game with victory
        if (availableKanjis.length === 0) {
          setGameState(prev => ({ ...prev, gameOver: true }));
          return;
        }
        
        const randomKanji = availableKanjis[Math.floor(Math.random() * availableKanjis.length)];
        setGameState((prev) => ({ ...prev, currentKanji: randomKanji }));
      };

      spawnKanji();

      const timer = setInterval(() => {
        setGameState((prev) => {
          if (prev.shields <= 1) {
            return { ...prev, shields: 0, gameOver: true };
          }
          return { ...prev, shields: prev.shields - 1 };
        });
      }, SPEED_MAP[gameState.speed]);

      return () => clearInterval(timer);
    }
  }, [currentScreen, gameState.gameOver, gameState.speed, gameState.level, gameState.destroyedKanjis]);

  const handleGameOver = () => {
    setGameState(prev => ({ ...prev, gameOver: true }));
  };

  const handleAnswer = (answer: string) => {
    if (!gameState.currentKanji) return;

    const newTotalAttempts = gameState.totalAttempts + 1;

    const isCorrect = gameState.mode === 'meaning'
      ? gameState.currentKanji.meanings.includes(answer.toLowerCase())
      : gameState.mode === 'onYomi'
        ? gameState.currentKanji.onYomi.includes(answer)
        : gameState.currentKanji.kunYomi.includes(answer);

    // Enregistrer la tentative sur ce kanji spécifique
    if (currentUser) {
      const correctAnswers = gameState.mode === 'meaning'
        ? gameState.currentKanji.meanings
        : gameState.mode === 'onYomi'
          ? gameState.currentKanji.onYomi
          : gameState.currentKanji.kunYomi;

      const kanjiAttempt = {
        userId: currentUser.uid,
        kanjiId: gameState.currentKanji.id,
        kanjiCharacter: gameState.currentKanji.character,
        mode: gameState.mode,
        userAnswer: answer,
        correctAnswer: correctAnswers,
        isCorrect,
        attemptedAt: new Date()
      };

      GameService.saveKanjiAttempt(kanjiAttempt).catch(error => {
        console.error('Erreur lors de l\'enregistrement de la tentative:', error);
      });
    }

    if (isCorrect) {
      const newCorrectAnswers = gameState.correctAnswers + 1;
      
      const levelKanjis = kanjis.filter(k => k.group === gameState.level);
      // Add current kanji to destroyed set
      const newDestroyedKanjis = new Set(gameState.destroyedKanjis);
      newDestroyedKanjis.add(gameState.currentKanji.id);
      
      // Filter out destroyed kanjis for next selection
      const availableKanjis = levelKanjis.filter(k => !newDestroyedKanjis.has(k.id));
      const randomKanji = availableKanjis.length > 0 
        ? availableKanjis[Math.floor(Math.random() * availableKanjis.length)]
        : null;

      setGameState((prev) => ({
        ...prev,
        score: prev.score + 100,
        correctAnswers: newCorrectAnswers,
        totalAttempts: newTotalAttempts,
        currentKanji: randomKanji,
        destroyedKanjis: newDestroyedKanjis,
        gameOver: availableKanjis.length === 0 // Victory condition
      }));
    } else {
      setGameState(prev => ({ ...prev, totalAttempts: newTotalAttempts }));
    }
  };

  const handleStart = (mode: GameMode, speed: GameSpeed, level: KanjiLevel, isMobileVersion: boolean = false) => {
    if (!currentUser) {
      return;
    }
    
    setIsMobileVersion(isMobileVersion);
    setGameState({ ...INITIAL_STATE, mode, speed, level, destroyedKanjis: new Set() });
    setGameStartTime(new Date());
    setCurrentScreen('game');
  };

  const handleRestart = () => {
    setGameState({ ...INITIAL_STATE, 
      mode: gameState.mode, 
      speed: gameState.speed, 
      level: gameState.level,
      destroyedKanjis: new Set()
    });
    setGameStartTime(new Date());
    setCurrentScreen('game');
  };

  const handleBackToMenu = async () => {
    // Save game session if game was played
    if (currentScreen === 'game' && gameStartTime && currentUser && userProfile) {
      const duration = Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000);
      const accuracy = gameState.totalAttempts > 0 ? (gameState.correctAnswers / gameState.totalAttempts) * 100 : 0;
      
      const gameSession = {
        userId: currentUser.uid,
        mode: gameState.mode,
        level: gameState.level,
        speed: gameState.speed,
        score: gameState.score,
        correctAnswers: gameState.correctAnswers,
        totalAttempts: gameState.totalAttempts,
        accuracy,
        duration,
        kanjisDestroyed: Array.from(gameState.destroyedKanjis),
        completedAt: new Date()
      };

      try {
        await GameService.saveGameSession(gameSession);
        const profileUpdates = await GameService.updateUserStats(currentUser.uid, gameSession, userProfile);
        await updateUserProfile(profileUpdates);
      } catch (error) {
        console.error('Error saving game session:', error);
      }
    }

    setCurrentScreen('menu');
    setGameState(INITIAL_STATE);
    setGameStartTime(null);
  };

  const handleLearning = (level: KanjiLevel) => {
    setCurrentScreen('learning');
  };

  return (
    <>
      {currentScreen === 'menu' && (
        <MainMenu 
          onStart={handleStart} 
          onRevision={handleLearning}
          onShowProfile={() => {}}
        />
      )}

      {currentScreen === 'learning' && (
        <Learning onBack={handleBackToMenu} />
      )}

      {currentScreen === 'game' && (
        <Cockpit 
          gameState={gameState} 
          onAnswer={handleAnswer} 
          onMenu={handleBackToMenu}
          onGameOver={handleGameOver}
          isMobileVersion={isMobileVersion}
        />
      )}

      {gameState.gameOver && (
        <GameOver 
          gameState={gameState} 
          onRestart={handleRestart} 
          onMenu={handleBackToMenu}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <GameApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// ProtectedRoute component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  return children;
}

export default App;
