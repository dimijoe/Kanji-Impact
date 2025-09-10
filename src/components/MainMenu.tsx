import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GameMode, GameSpeed, KanjiLevel } from '../types';
import { Rocket, Brain, Zap, ScrollText, BookOpen, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MainMenuProps {
  onStart: (mode: GameMode, speed: GameSpeed, level: KanjiLevel) => void;
  onRevision: (level: KanjiLevel) => void;
  onShowProfile: () => void;
}

export function MainMenu({ onStart, onRevision, onShowProfile }: MainMenuProps) {
  const { currentUser, userProfile } = useAuth();
  const [mode, setMode] = React.useState<GameMode>('onYomi');
  const [speed, setSpeed] = React.useState<GameSpeed>('normal');
  const [level, setLevel] = React.useState<KanjiLevel>('N5');
  const audioRef = React.useRef<HTMLAudioElement>(null);
  

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center relative overflow-hidden">
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
        src="https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3"
        loop
      />
      <div className="relative bg-gray-800/90 p-8 rounded-2xl w-full max-w-md mx-4 backdrop-blur-lg border border-gray-700">
        {/* User Info / Auth Button */}
        <div className="absolute -top-4 right-4">
          {currentUser ? (
            <button
              onClick={onShowProfile}
              className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-full transition-colors flex items-center gap-2"
              title="Voir le profil"
            >
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
              ) : (
                <User size={20} />
              )}
            </button>
          ) : (
            <Link to="/auth">
              <button
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors"
                title="Se connecter"
              >
                <LogIn size={20} />
              </button>
            </Link>
          )}
        </div>

        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <Rocket size={48} className="text-sky-400" />
        </div>
        <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
          Kanji Invasion
        </h1>
        <p className="text-gray-400 text-center mb-8">Master kanji through space combat</p>
        
        {/* Welcome message for logged in users */}
        {currentUser && userProfile && (
          <div className="bg-sky-500/20 border border-sky-500/50 rounded-lg p-3 mb-6 text-center">
            <p className="text-sky-300 text-sm">
              Bienvenue, <span className="font-semibold">{userProfile.displayName}</span>!
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <Brain size={20} /> Game Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as GameMode)}
              className="w-full bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600 focus:border-sky-500 focus:ring focus:ring-sky-500/20"
            >
              <option value="onYomi">On yomi (lecture chinese)</option>
              <option value="kunYomi">Kun yomi (lecture japonaise)</option>
              <option value="meaning">Traduction Française</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <ScrollText size={20} /> Kanji Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as KanjiLevel)}
              className="w-full bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600 focus:border-sky-500 focus:ring focus:ring-sky-500/20"
            >
              <option value="N5">JLPT N5 (Beginner)</option>
              <option value="N4">JLPT N4</option>
              <option value="N3">JLPT N3</option>
              <option value="N2">JLPT N2</option>
              <option value="N1">JLPT N1 (Advanced)</option>
              {/* Ajoute d'autres niveaux ou grades ici si besoin */}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <Zap size={20} /> Speed
            </label>
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as GameSpeed)}
              className="w-full bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600 focus:border-sky-500 focus:ring focus:ring-sky-500/20"
            >
              <option value="slow">Training (Slow)</option>
              <option value="normal">Normal</option>
              <option value="fast">Expert (Fast)</option>
            </select>
          </div>

          {/* BOUTON REVISER (APPRENTISSAGE) */}
          <button
            onClick={() => onRevision(level)}
            className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-bold text-lg mb-2 gap-2"
          >
            <BookOpen size={22} className="mr-2" /> Réviser (Apprentissage)
          </button>
          
          {/* SEPARATEUR OU SPACING */}
          <div className="h-2" />

          {/* BOUTON DE JEU */}
          <button
            onClick={() => onStart(mode, speed, level)}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-sky-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 font-bold text-lg"
          >
            {currentUser ? 'Commencer la mission' : 'Se connecter pour jouer'}
          </button>
        </div>
      </div>
    </div>
  );
}
