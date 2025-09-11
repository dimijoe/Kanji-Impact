import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { kanjis } from '../data/kanjis';
import { GameService } from '../services/gameService'; // À adapter !
interface GameOverProps {
  gameState: GameState | null;
  onRestart: () => void;
  onMenu: () => void;
  onAfterSave?: () => void; // pour rediriger vers la page "Bravo"
}
type HighScore = { user: string; score: number };

export function GameOver({ gameState, onRestart, onMenu, onAfterSave }: GameOverProps) {
  const [saving, setSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [showSavePrompt, setShowSavePrompt] = useState(true);

  // Charger les meilleurs scores du niveau JLPT courant
  useEffect(() => {
    async function fetchHighScores() {
      if (!gameState?.level) return;
      try {
        // Adapter selon GameService !
        const top = await GameService.getHighScoresByLevel(gameState.level, 5);
        setHighScores(top);
      } catch (e) {
        setHighScores([]);
      }
    }
    fetchHighScores();
  }, [gameState?.level]);

  // Protection gameState et currentKanji
  if (!gameState || !gameState.currentKanji) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-800/95 p-8 rounded-2xl text-white max-w-xl w-full mx-4 shadow-2xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-red-500">Erreur</h2>
          <p className="text-gray-300 mb-8">Impossible d'afficher la fin de partie...</p>
          <button
            onClick={onMenu}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-semibold touch-manipulation"
          >
            Retour au Menu
          </button>
        </div>
      </div>
    );
  }

  const failedKanji = kanjis.find(k => k.character === gameState.currentKanji.character);

  // Handler pour enregistrer le score
  const handleSave = async () => {
    setSaving(true);
    try {
      // Enregistre la partie dans Firestore (adapter selon GameService)
      await GameService.saveGameResult(gameState);
      setSaveDone(true);
      setShowSavePrompt(false);
      if (onAfterSave) onAfterSave(); // Redirige si besoin
    } catch (e) {
      alert("Erreur lors de l'enregistrement du score.");
    } finally {
      setSaving(false);
    }
  };

  // Handler pour terminer sans enregistrer
  const handleNoSave = () => {
    setShowSavePrompt(false);
    onMenu();
  };

  // Message "Bravo" après enregistrement
  if (saveDone) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-900/95 p-8 rounded-2xl text-white max-w-lg w-full mx-4 shadow-2xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-green-400">Bravo, vous avez terminé !</h2>
          <p className="mb-8 text-xl">Votre score a été enregistré !</p>
          <button
            onClick={onMenu}
            className="bg-gradient-to-r from-sky-500 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold shadow-lg transition hover:from-sky-600 hover:to-blue-800"
          >
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800/95 p-6 sm:p-8 rounded-2xl text-white max-w-xl w-full mx-4 shadow-2xl">
        <h2 className="text-4xl font-bold mb-6 text-center text-red-500">
          Game Over
        </h2>

        {/* Score et résumé */}
        <div className="mb-6 text-center">
          <p className="text-2xl mb-2 font-semibold">
            Score&nbsp;: <span className="text-sky-400">{gameState.score}</span>
          </p>
          <p className="text-lg text-gray-300">
            Mode : {gameState.mode === 'onYomi' ? "On'yomi" : gameState.mode === 'kunYomi' ? "Kun'yomi" : "Signification"}
            &nbsp;| Vitesse : {gameState.speed} &nbsp;| Niveau : {gameState.level}
          </p>
        </div>

        {/* Échec Kanji */}
        {failedKanji ? (
          <div className="bg-gray-900/60 rounded-xl p-6 text-center mb-6">
            <p className="text-5xl font-bold mb-4 text-sky-300">{failedKanji.character}</p>
            <div className="space-y-2">
              <p className="text-gray-200"><span className="font-semibold text-sky-400">Signification :</span> {failedKanji.meanings.join(', ')}</p>
              <p className="text-gray-200"><span className="font-semibold text-sky-400">On'yomi :</span> {failedKanji.onYomi.map(o => o.replace(/\(.*\)/, '')).join(' / ') || 'N/A'}</p>
              <p className="text-gray-200"><span className="font-semibold text-sky-400">Kun'yomi :</span> {failedKanji.kunYomi.map(k => k.replace(/\(.*\)/, '')).join(' / ') || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/60 rounded-xl p-6 text-center mb-6">
            <p className="text-red-300 font-bold text-2xl">Kanji inconnu</p>
            <p className="text-gray-400">Impossible de retrouver ce kanji dans la base.</p>
          </div>
        )}

        {/* Top scores JLPT */}
        <div className="bg-gray-900/60 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-2 text-yellow-300">
            Top scores – Niveau {gameState.level}
          </h3>
          <ol className="text-base text-gray-200 space-y-1 text-left max-w-xs mx-auto">
            {highScores.length === 0 
              ? <li className="text-gray-400 italic">Pas de score enregistré</li>
              : highScores.map((s, i) => (
                  <li key={i}>
                    <span className="font-bold text-white">{i + 1}.</span>
                    &nbsp;<span className="text-sky-300">{s.user}</span>
                    &nbsp;–&nbsp;
                    <span className="font-semibold text-sky-400">{s.score}</span>
                  </li>
                ))}
          </ol>
        </div>

        {/* Choix de l'action */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <button
            onClick={onRestart}
            className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 active:bg-sky-700 font-semibold touch-manipulation transition"
            disabled={saving}
          >
            Rejouer
          </button>
          {showSavePrompt && (
            <>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold touch-manipulation transition"
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Terminer & enregistrer"}
              </button>
              <button
                onClick={handleNoSave}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold touch-manipulation transition"
                disabled={saving}
              >
                Terminer sans enregistrer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
