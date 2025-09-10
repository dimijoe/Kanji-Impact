import React from 'react';
import { GameState } from '../types';
import { kanjis } from '../data/kanjis';

interface GameOverProps {
  gameState: GameState;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOver({ gameState, onRestart, onMenu }: GameOverProps) {
  // On identifie le dernier kanji qui a frappé le cockpit
  const failedKanji = kanjis.find(
    k => k.character === gameState.currentKanji.character
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl text-white w-full max-w-lg mx-auto shadow-2xl p-6 sm:p-8">
        
        {/* Titre principal */}
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-red-500">
          Game Over
        </h2>

        {/* Résumé rapide */}
        <div className="mb-6 sm:mb-8 text-center">
          <p className="text-xl sm:text-2xl mb-2 font-semibold">
            Score : <span className="text-sky-400">{gameState.score}</span>
          </p>
          <div className="text-sm sm:text-base text-gray-300 space-y-1">
            <p>Mode : {gameState.mode === 'onYomi' ? "On'yomi" : gameState.mode === 'kunYomi' ? "Kun'yomi" : "Signification"}</p>
            <p>Vitesse : {gameState.speed} | Niveau : {gameState.level}</p>
          </div>
        </div>

        {/* Kanji qui a causé l'échec */}
        {failedKanji && (
          <div className="bg-gray-900/60 rounded-xl p-4 sm:p-6 text-center mb-6">
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-sky-300">
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
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onRestart}
            className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 active:bg-sky-700 transform hover:scale-105 active:scale-95 transition-all duration-200 font-semibold touch-manipulation"
          >
            Rejouer
          </button>
          <button
            onClick={onMenu}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 active:bg-gray-800 transform hover:scale-105 active:scale-95 transition-all duration-200 font-semibold touch-manipulation"
          >
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
}