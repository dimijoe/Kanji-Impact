import React from 'react';
import { GameState } from '../types';
import { kanjis } from '../data/kanjis';

interface GameOverProps {
  gameState: GameState | null;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOver({ gameState, onRestart, onMenu }: GameOverProps) {
  // Protection contre gameState null
  if (!gameState) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-800/95 p-8 rounded-2xl text-white max-w-xl w-full mx-4 shadow-2xl">
          <h2 className="text-4xl font-bold mb-6 text-center text-red-500">
            Erreur
          </h2>
          <p className="text-center text-gray-300 mb-8">
            Impossible d'afficher la fin de partie...
          </p>
          <div className="flex justify-center">
            <button
              onClick={onMenu}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 active:bg-gray-800 transform hover:scale-105 transition-all duration-200 font-semibold touch-manipulation"
            >
              Retour au Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Protection contre currentKanji null
  if (!gameState.currentKanji) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-800/95 p-8 rounded-2xl text-white max-w-xl w-full mx-4 shadow-2xl">
          <h2 className="text-4xl font-bold mb-6 text-center text-red-500">
            Game Over
          </h2>
          <div className="mb-8 text-center">
            <p className="text-2xl mb-2 font-semibold">
              Score : <span className="text-sky-400">{gameState.score}</span>
            </p>
            <p className="text-lg text-gray-300">
              Mode : {gameState.mode === 'onYomi' ? "On'yomi" : gameState.mode === 'kunYomi' ? "Kun'yomi" : "Signification"} | Vitesse : {gameState.speed} | Niveau : {gameState.level}
            </p>
          </div>
          <div className="bg-gray-900/60 rounded-xl p-6 text-center">
            <p className="text-red-300 font-bold text-2xl">Partie terminée</p>
            <p className="text-gray-400">Félicitations pour votre performance !</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <button
              onClick={onRestart}
              className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 active:bg-sky-700 transform hover:scale-105 transition-all duration-200 font-semibold touch-manipulation"
            >
              Rejouer
            </button>
            <button
              onClick={onMenu}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 active:bg-gray-800 transform hover:scale-105 transition-all duration-200 font-semibold touch-manipulation"
            >
              Menu Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cherche le kanji responsable de l'échec
  const failedKanji = kanjis.find(k => k.character === gameState.currentKanji.character);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800/95 p-6 sm:p-8 rounded-2xl text-white max-w-xl w-full mx-4 shadow-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-red-500">
          Game Over
        </h2>
        <div className="mb-6 sm:mb-8 text-center">
          <p className="text-xl sm:text-2xl mb-2 font-semibold">
            Score : <span className="text-sky-400">{gameState.score}</span>
          </p>
          <p className="text-base sm:text-lg text-gray-300">
            Mode : {gameState.mode === 'onYomi' ? "On'yomi" : gameState.mode === 'kunYomi' ? "Kun'yomi" : "Signification"} | Vitesse : {gameState.speed} | Niveau : {gameState.level}
          </p>
        </div>
        {failedKanji ? (
          <div className="bg-gray-900/60 rounded-xl p-4 sm:p-6 text-center">
            <p className="text-4xl sm:text-6xl font-bold mb-4 text-sky-300">
              {failedKanji.character}
            </p>
            <div className="space-y-2 text-sm sm:text-base">
              <p className="text-gray-200">
                <span className="font-semibold text-sky-400">Signification : </span>
                {failedKanji.meanings.join(', ')}
              </p>
              <p className="text-gray-200">
                <span className="font-semibold text-sky-400">On'yomi : </span>
                {failedKanji.onYomi.map(o => o.replace(/\(.*\)/, '')).join(' / ') || 'N/A'}
              </p>
              <p className="text-gray-200">
                <span className="font-semibold text-sky-400">Kun'yomi : </span>
                {failedKanji.kunYomi.map(k => k.replace(/\(.*\)/, '')).join(' / ') || 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/60 rounded-xl p-4 sm:p-6 text-center">
            <p className="text-red-300 font-bold text-xl sm:text-2xl">Kanji inconnu</p>
            <p className="text-gray-400">Impossible de retrouver ce kanji dans la base.</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 sm:mt-8">
          <button
            onClick={onRestart}
            className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 active:bg-sky-700 transform hover:scale-105 transition-all duration-200 font-semibold touch-manipulation"
          >
            Rejouer
          </button>
          <button
            onClick={onMenu}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 active:bg-gray-800 transform hover:scale-105 transition-all duration-200 font-semibold touch-manipulation"
          >
            Menu Principal
          </button>
          </div>
      </div>
    </div>
  );
}