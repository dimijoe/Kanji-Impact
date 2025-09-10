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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800/90 p-8 rounded-2xl text-white max-w-xl w-full mx-4 shadow-2xl">
        
        {/* Titre principal */}
        <h2 className="text-4xl font-bold mb-6 text-center text-red-500">
          Game Over
        </h2>

        {/* Résumé rapide */}
        <div className="mb-8 text-center">
          <p className="text-2xl mb-2 font-semibold">
            Score : <span className="text-sky-400">{gameState.score}</span>
          </p>
          <p className="text-lg text-gray-300">
            Mode : {gameState.mode === 'onYomi' ? "On'yomi" : gameState.mode === 'kunYomi' ? "Kun'yomi" : "Signification"} | 
            Vitesse : {gameState.speed} | 
            Niveau : {gameState.level}
          </p>
        </div>

        {/* Kanji qui a causé l'échec */}
        {failedKanji && (
          <div className="bg-gray-900/60 rounded-xl p-6 text-center">
            <p className="text-6xl font-bold mb-4 text-sky-300">
              {failedKanji.character}
            </p>
            <p className="text-lg text-gray-200 mb-2">
              <span className="font-semibold text-sky-400">Signification : </span>
              {failedKanji.meanings.join(', ')}
            </p>
            <p className="text-lg text-gray-200 mb-2">
              <span className="font-semibold text-sky-400">On'yomi : </span>
              {failedKanji.onYomi.map(o => o.replace(/\(.*\)/, '')).join(' / ') || 'N/A'}
            </p>
            <p className="text-lg text-gray-200">
              <span className="font-semibold text-sky-400">Kun'yomi : </span>
              {failedKanji.kunYomi.map(k => k.replace(/\(.*\)/, '')).join(' / ') || 'N/A'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={onRestart}
            className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 active:bg-sky-700 transform hover:scale-105 transition-all duration-200 font-semibold"
          >
            Rejouer
          </button>
          <button
            onClick={onMenu}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 active:bg-gray-800 transform hover:scale-105 transition-all duration-200 font-semibold"
          >
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
}
