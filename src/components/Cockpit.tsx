import React, { useState, useEffect, useRef } from 'react';
import { GameState, Kanji } from '../types';
import { kanjis } from '../data/kanjis';
import { 
  Rocket, Target, Clock, Trophy, AlertTriangle, Zap, 
  Home, Plane 
} from 'lucide-react';

interface CockpitProps {
  gameState: GameState;
  onAnswer: (answer: string) => void;
  onMenu: () => void;
  onGameOver: () => void;
  isMobileVersion?: boolean;
}

export function Cockpit({ 
  gameState, 
  onAnswer, 
  onMenu, 
  onGameOver,
  isMobileVersion = false 
}: CockpitProps) {
  const [answer, setAnswer] = useState('');
  const [currentKanji, setCurrentKanji] = useState<Kanji | null>(null);
  const [kanjiPosition, setKanjiPosition] = useState({ x: 50, y: 10 });
  const [isExploding, setIsExploding] = useState(false);
  const [cockpitExploding, setCockpitExploding] = useState(false);
  const [kanjiMissed, setKanjiMissed] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const explosionRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Speed mapping
  const SPEED_MAP = {
    slow: 150,
    normal: 100,
    fast: 60,
  };

  // Get next kanji from queue
  const getNextKanji = () => {
    if (gameState.kanjiQueue.length === 0) return null;
    
    const kanjiId = gameState.kanjiQueue[0];
    const kanji = kanjis.find(k => k.id === kanjiId);
    return kanji || null;
  };

  // Initialize kanji
  useEffect(() => {
    const nextKanji = getNextKanji();
    if (nextKanji) {
      setCurrentKanji(nextKanji);
      // Reset position for new kanji
      if (isMobileVersion) {
        setKanjiPosition({ x: 50, y: 10 });
      } else {
        // Random starting position for web version
        setKanjiPosition({ 
          x: Math.random() * 80 + 10, 
          y: 10 
        });
      }
    }
  }, [gameState.kanjiQueue, isMobileVersion]);

  // Kanji movement animation
  useEffect(() => {
    if (!currentKanji || gameState.gameOver || isExploding || kanjiMissed) return;

    const speed = SPEED_MAP[gameState.speed];
    
    intervalRef.current = setInterval(() => {
      setKanjiPosition(prev => {
        const newY = prev.y + 2;
        
        // Check if kanji reached the cockpit (bottom)
        if (newY >= 85) {
          // Kanji missed - consume error
          setKanjiMissed(true);
          setCockpitExploding(true);
          
          // Play explosion sound
          if (explosionRef.current) {
            explosionRef.current.currentTime = 0;
            explosionRef.current.play().catch(console.error);
          }

          // Trigger game over after explosion if no errors left
          setTimeout(() => {
            onAnswer(''); // Empty answer = missed kanji
            setCockpitExploding(false);
            setKanjiMissed(false);
            
            // Check if game should end
            if (gameState.errorsUsed + 1 >= gameState.errorsAllowed) {
              setTimeout(() => onGameOver(), 300);
            }
          }, 500);
          
          return prev;
        }
        
        return { ...prev, y: newY };
      });
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentKanji, gameState.speed, gameState.gameOver, isExploding, kanjiMissed, gameState.errorsUsed, gameState.errorsAllowed, onAnswer, onGameOver]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !currentKanji || isExploding || kanjiMissed) return;

    // Check if answer is correct
    const correctAnswers = gameState.mode === 'meaning'
      ? currentKanji.meanings.map(m => m.toLowerCase())
      : gameState.mode === 'onYomi'
        ? currentKanji.onYomi.map(o => o.replace(/\(.*?\)/g, '').trim())
        : currentKanji.kunYomi.map(k => k.replace(/\(.*?\)/g, '').trim());

    const isCorrect = correctAnswers.some(correct => 
      correct.toLowerCase() === answer.toLowerCase().trim()
    );

    if (isCorrect) {
      // Correct answer - explode kanji
      setIsExploding(true);
      
      // Play success sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }

      setTimeout(() => {
        onAnswer(answer);
        setIsExploding(false);
        setAnswer('');
      }, 500);
    } else {
      // Wrong answer - let kanji continue falling
      setAnswer('');
    }
  };

  // Get mode label and prompt
  const getModeLabel = () => {
    switch (gameState.mode) {
      case 'onYomi': return 'On\'yomi';
      case 'kunYomi': return 'Kun\'yomi';
      case 'meaning': return 'Signification';
      default: return gameState.mode;
    }
  };

  const getModePrompt = () => {
    switch (gameState.mode) {
      case 'onYomi': return 'Lecture chinoise :';
      case 'kunYomi': return 'Lecture japonaise :';
      case 'meaning': return 'Signification :';
      default: return 'Réponse :';
    }
  };

  if (!currentKanji) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Chargement des kanjis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 relative overflow-hidden">
      {/* Audio elements */}
      <audio ref={audioRef} preload="auto">
        <source src="/audio/Sound_explosion.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={explosionRef} preload="auto">
        <source src="/audio/Sound_explosion.mp3" type="audio/mpeg" />
      </audio>

      {/* Mobile version indicator */}
      {isMobileVersion && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            📱 Mobile
          </div>
        </div>
      )}

      {/* Menu button */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={onMenu}
          className="bg-gray-700/80 hover:bg-gray-600/80 text-white p-3 rounded-full transition-colors flex items-center gap-2 touch-manipulation"
          title="Retour au menu"
        >
          <Home size={20} />
        </button>
      </div>

      {/* Game Stats Header */}
      <div className="absolute top-4 right-4 z-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-white">
          {/* Score */}
          <div className="bg-blue-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-medium">Score</span>
            </div>
            <div className="text-lg font-bold">{gameState.score}</div>
          </div>

          {/* Mission Progress */}
          <div className="bg-green-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Mission</span>
            </div>
            <div className="text-lg font-bold">{gameState.completedKanjis}/{gameState.missionTarget}</div>
          </div>

          {/* Errors */}
          <div className="bg-red-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Erreurs</span>
            </div>
            <div className="text-lg font-bold">{gameState.errorsUsed}/{gameState.errorsAllowed}</div>
          </div>

          {/* Level */}
          <div className="bg-purple-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Rocket className="w-4 h-4" />
              <span className="text-xs font-medium">Niveau</span>
            </div>
            <div className="text-lg font-bold">{gameState.level}</div>
          </div>
        </div>
      </div>

      {/* Kanji Display */}
      <div 
        className="absolute transition-all duration-100 ease-linear"
        style={{
          left: `${kanjiPosition.x}%`,
          top: `${kanjiPosition.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className={`transition-all duration-300 ${
          isExploding 
            ? 'animate-ping scale-150 opacity-0' 
            : isMobileVersion 
              ? `scale-${Math.min(150 + kanjiPosition.y * 2, 300)}` // Face approach effect
              : 'animate-pulse scale-100'
        }`}>
          <div className="text-6xl sm:text-8xl font-bold text-white text-center drop-shadow-2xl">
            {currentKanji.character}
          </div>
        </div>
      </div>

      {/* Explosion effects */}
      {isExploding && (
        <div 
          className="absolute animate-ping"
          style={{
            left: `${kanjiPosition.x}%`,
            top: `${kanjiPosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-32 h-32 bg-orange-400 rounded-full opacity-75"></div>
        </div>
      )}

      {/* Cockpit */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
        cockpitExploding ? 'animate-pulse scale-110 filter brightness-200' : ''
      }`}>
        <div className="relative">
          {/* Cockpit explosion effect */}
          {cockpitExploding && (
            <div className="absolute inset-0 -m-8 animate-ping">
              <div className="w-full h-full bg-red-500 rounded-full opacity-75"></div>
            </div>
          )}
          
          {/* Cockpit body */}
          <div className="w-24 h-16 sm:w-32 sm:h-20 bg-gradient-to-t from-gray-800 to-gray-600 rounded-t-full relative">
            {/* Cockpit window */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-8 sm:w-20 sm:h-10 bg-gradient-to-b from-blue-200 to-blue-400 rounded-full opacity-80"></div>
            
            {/* Cockpit details */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-4 sm:w-24 sm:h-5 bg-gray-900 rounded-t-lg"></div>
            
            {/* Wings */}
            <div className="absolute top-8 -left-6 w-8 h-4 sm:w-10 sm:h-5 bg-gray-700 rounded-l-full"></div>
            <div className="absolute top-8 -right-6 w-8 h-4 sm:w-10 sm:h-5 bg-gray-700 rounded-r-full"></div>
          </div>
        </div>
      </div>

      {/* Answer Form */}
      <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-xl">
            <div className="text-center mb-3">
              <div className="text-sm text-gray-600 mb-1">Mode: {getModeLabel()}</div>
              <div className="text-lg font-semibold text-gray-800">{getModePrompt()}</div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center font-medium"
                placeholder="Votre réponse..."
                autoFocus
                disabled={isExploding || kanjiMissed}
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              
              <button
                type="submit"
                disabled={!answer.trim() || isExploding || kanjiMissed}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg touch-manipulation"
              >
                <Zap className="w-5 h-5" />
                Tirer !
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}