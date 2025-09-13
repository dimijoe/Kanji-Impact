import React, { useState, useEffect, useRef } from 'react';
import { Plane, Target, Clock, Trophy, AlertTriangle, Zap } from 'lucide-react';
import { Kanji, GameMode, GameSettings } from '../types';

interface CockpitProps {
  kanjis: Kanji[];
  mode: GameMode;
  onAnswer: (answer: string) => void;
  onGameOver: () => void;
  gameSettings: GameSettings;
  isMobileVersion: boolean;
}

export const Cockpit: React.FC<CockpitProps> = ({ 
  kanjis, 
  mode, 
  onAnswer, 
  onGameOver,
  gameSettings,
  isMobileVersion 
}) => {
  const [currentKanjiIndex, setCurrentKanjiIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExploding, setIsExploding] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [kanjiQueue, setKanjiQueue] = useState<Kanji[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize shuffled queue
  useEffect(() => {
    if (kanjis.length > 0) {
      const shuffled = shuffleArray(kanjis);
      setKanjiQueue(shuffled);
      setQueueIndex(0);
    }
  }, [kanjis]);

  // Timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onGameOver();
    }
  }, [timeLeft, onGameOver]);

  // Check mission completion
  useEffect(() => {
    if (successCount >= gameSettings.targetKanjis) {
      onGameOver();
    }
  }, [successCount, gameSettings.targetKanjis, onGameOver]);

  // Check max errors reached
  useEffect(() => {
    if (errorCount >= gameSettings.maxErrors) {
      onGameOver();
    }
  }, [errorCount, gameSettings.maxErrors, onGameOver]);

  const currentKanji = kanjiQueue[queueIndex % kanjiQueue.length];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !currentKanji) return;

    const correctAnswers = currentKanji[mode] || [];
    const isCorrect = correctAnswers.some(correct => 
      correct.toLowerCase() === answer.toLowerCase().trim()
    );

    if (isCorrect) {
      setScore(prev => prev + 100);
      setSuccessCount(prev => prev + 1);
      setIsExploding(true);
      
      // Play explosion sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }

      setTimeout(() => {
        setIsExploding(false);
        nextKanji();
      }, 500);
    } else {
      // Wrong answer - kanji passes through, consume error
      setScore(prev => prev - 50);
      setErrorCount(prev => prev + 1);
      nextKanji();
    }

    onAnswer(answer);
    setAnswer('');
  };

  const nextKanji = () => {
    if (kanjiQueue.length === 0) return;
    
    // Move to next kanji in shuffled queue
    const nextIndex = queueIndex + 1;
    
    // If we've gone through all kanjis, reshuffle
    if (nextIndex >= kanjiQueue.length) {
      const reshuffled = shuffleArray(kanjis);
      setKanjiQueue(reshuffled);
      setQueueIndex(0);
    } else {
      setQueueIndex(nextIndex);
    }
  };

  if (!currentKanji) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Chargement des kanjis...</div>
      </div>
    );
  }

  const getModeLabel = () => {
    switch (mode) {
      case 'onYomi': return 'On\'yomi';
      case 'kunYomi': return 'Kun\'yomi';
      case 'meaning': return 'Signification';
      default: return mode;
    }
  };

  const getModePrompt = () => {
    switch (mode) {
      case 'onYomi': return 'Lecture chinoise :';
      case 'kunYomi': return 'Lecture japonaise :';
      case 'meaning': return 'Signification :';
      default: return 'Réponse :';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 relative overflow-hidden">
      <audio ref={audioRef} preload="auto">
        <source src="/explosion.mp3" type="audio/mpeg" />
      </audio>

      {/* Mobile version indicator */}
      {isMobileVersion && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            📱 Mobile
          </div>
        </div>
      )}

      {/* Game Stats Header */}
      <div className="absolute top-4 right-4 z-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-white">
          {/* Score */}
          <div className="bg-blue-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-medium">Score</span>
            </div>
            <div className="text-lg font-bold">{score}</div>
          </div>

          {/* Mission Progress */}
          <div className="bg-green-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Mission</span>
            </div>
            <div className="text-lg font-bold">{successCount}/{gameSettings.targetKanjis}</div>
          </div>

          {/* Errors */}
          <div className="bg-red-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Erreurs</span>
            </div>
            <div className="text-lg font-bold">{errorCount}/{gameSettings.maxErrors}</div>
          </div>

          {/* Time */}
          <div className="bg-orange-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Temps</span>
            </div>
            <div className="text-lg font-bold">{timeLeft}s</div>
          </div>
        </div>
      </div>

      {/* Cockpit */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
        isExploding ? 'animate-pulse scale-110' : ''
      }`}>
        <div className="relative">
          {/* Explosion effect */}
          {isExploding && (
            <div className="absolute inset-0 -m-8 animate-ping">
              <div className="w-full h-full bg-orange-400 rounded-full opacity-75"></div>
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

      {/* Kanji Display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className={`transition-all duration-1000 ${
          isMobileVersion 
            ? 'animate-pulse scale-150 sm:scale-200' // Mobile: face approach effect
            : 'animate-bounce' // Web: traditional trajectory
        }`}>
          <div className="text-8xl sm:text-9xl font-bold text-white text-center drop-shadow-2xl">
            {currentKanji.character}
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
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              
              <button
                type="submit"
                disabled={!answer.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg"
                style={{ touchAction: 'manipulation' }}
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
};