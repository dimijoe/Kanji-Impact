import React, { useMemo, useState, useEffect } from "react";
import { kanjis } from "../data/kanjis";
import { 
  ScrollText, ChevronLeft, ChevronRight, 
  ChevronLeft as ChevronDoubleLeft, 
  ChevronRight as ChevronDoubleRight, 
  Search 
} from "lucide-react";

// Fonction utilitaire pour les variantes
function removeParenthesis(str: string) {
  return str.replace(/\((.*?)\)/g, "");
}
const getUniqueLevels = () => Array.from(new Set(kanjis.map(k => k.group)));

interface LearningProps {
  onBack: () => void;
}

export function Learning({ onBack }: LearningProps) {
  const [level, setLevel] = useState("N5");
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"meaning"|"onYomi"|"kunYomi">("meaning");
  const [currentIdx, setCurrentIdx] = useState(0);

  // --- FILTRE FINAL : 
  // - Si recherche non vide : recherche sur tout le corpus (non filtré par niveau)
  // - Sinon : filtre par niveau classique
  const filteredKanjis = useMemo(() => {
    const q = search.trim().toLowerCase();
    let pool = q ? kanjis : kanjis.filter(k => k.group === level);
    return pool.filter(k => {
      if (!q) return true;
      switch (searchMode) {
        case "meaning":
          return k.meanings.some(m => m.toLowerCase().includes(q));
        case "onYomi":
          return k.onYomi.some(o => removeParenthesis(o).toLowerCase().includes(q));
        case "kunYomi":
          return k.kunYomi.some(kun => removeParenthesis(kun).toLowerCase().includes(q));
        default:
          return true;
      }
    });
  }, [level, search, searchMode]);

  // SÉCURITÉ : corrige l'index courant si besoin
  useEffect(() => {
    if (currentIdx >= filteredKanjis.length) {
      setCurrentIdx(0);
    }
  }, [filteredKanjis.length, currentIdx]);

  const currentKanji = filteredKanjis.length > 0 ? filteredKanjis[currentIdx] : null;

  // Navigation
  const goto = (dir: "first" | "prev" | "next" | "last") => {
    if (!filteredKanjis.length) return;
    if (dir === "first") setCurrentIdx(0);
    else if (dir === "last") setCurrentIdx(filteredKanjis.length - 1);
    else if (dir === "prev") setCurrentIdx(i => (i > 0 ? i - 1 : filteredKanjis.length - 1));
    else if (dir === "next") setCurrentIdx(i => (i < filteredKanjis.length - 1 ? i + 1 : 0));
  };
  // Changement de niveau minceur : on reset l'index, on CLEAR la barre recherche (UX plus logique)
  const onLevelChange = (lv: string) => {
    setLevel(lv);
    setCurrentIdx(0);
    setSearch(""); // Remet à vide la recherche quand on change de niveau
  };
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentIdx(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 via-gray-900 to-gray-900 flex items-center justify-center py-10 px-4">
      <div className="bg-gray-800/90 p-8 rounded-2xl shadow-2xl w-full max-w-3xl relative">
        <h1 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 text-transparent bg-clip-text flex items-center justify-center gap-2">
          <ScrollText size={36} />
          Révision Kanji
        </h1>
        {/* Filtres */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <select
            value={level}
            onChange={e => onLevelChange(e.target.value)}
            className="bg-gray-700/70 px-4 py-2 rounded-lg border border-gray-600 text-lg cursor-pointer shadow focus:border-sky-500 focus:ring focus:ring-sky-500/10"
          >
            {getUniqueLevels().map(lv => (
              <option key={lv} value={lv}>Niveau {lv}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-gray-300">
              <input type="radio" value="meaning" checked={searchMode === "meaning"}
                onChange={() => setSearchMode("meaning")} className="accent-blue-500" />
              Sens
            </label>
            <label className="flex items-center gap-1 text-gray-300">
              <input type="radio" value="onYomi" checked={searchMode === "onYomi"}
                onChange={() => setSearchMode("onYomi")} className="accent-purple-400" />
              On
            </label>
            <label className="flex items-center gap-1 text-gray-300">
              <input type="radio" value="kunYomi" checked={searchMode === "kunYomi"}
                onChange={() => setSearchMode("kunYomi")} className="accent-green-500" />
              Kun
            </label>
          </div>
          <div className="flex items-center bg-gray-700/80 rounded-lg px-3">
            <Search size={18} className="text-sky-400 mr-2" />
            <input
              type="text"
              value={search}
              onChange={onSearchChange}
              placeholder={`Recherche ${searchMode === "meaning" ? "sens" : searchMode}`}
              className="bg-transparent outline-none text-white py-2"
            />
          </div>
        </div>
        {/* Carte du kanji */}
        <div className={`transition-all duration-200 rounded-2xl bg-gradient-to-br from-gray-900/70 via-gray-800/70 to-blue-900/60 flex flex-col sm:flex-row shadow-xl p-8 mb-4 border border-gray-700`}>
          <div className="flex-1 flex items-center justify-center mb-4 sm:mb-0">
            <span className="text-[104px] font-bold text-white drop-shadow-lg select-none">
              {currentKanji?.character || <span className="text-2xl italic text-gray-400">?</span>}
            </span>
          </div>
          <div className="flex-[2] flex flex-col gap-3 justify-center">
            <div className="mb-1">
              <span className="block font-bold text-lg text-yellow-100 mb-1">Sens de base</span>
              <div className="bg-gray-700/40 rounded px-3 py-2 text-white min-h-[44px] text-[1.15rem]">
                {currentKanji?.meanings?.join(", ") || "..."}
              </div>
            </div>
            <div>
              <span className="block font-semibold text-base text-indigo-300 mb-1">
                Lecture ON <span className="text-xs font-normal text-indigo-200">(origine chinoise)</span>
              </span>
              <div className="bg-gray-700/40 rounded px-3 py-2 text-indigo-100 min-h-[36px]">
                {currentKanji?.onYomi?.map(o => removeParenthesis(o)).join(" / ") || "..."}
              </div>
            </div>
            <div>
              <span className="block font-semibold text-base text-pink-300 mb-1">
                Lecture KUN <span className="text-xs font-normal text-pink-200">(origine japonaise)</span>
              </span>
              <div className="bg-gray-700/40 rounded px-3 py-2 text-pink-100 min-h-[36px]">
                {currentKanji?.kunYomi?.map(kun => removeParenthesis(kun)).join(" / ") || "..."}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-2 text-sm font-medium text-gray-300">
              <span>Niveau : <span className="font-bold text-white">{currentKanji?.group || "-"}</span></span>
              {currentKanji && typeof currentKanji.difficulty !== "undefined" && (
                <span>Difficulty : <span className="text-white">{currentKanji.difficulty}</span></span>
              )}
              {currentKanji && "strokes" in currentKanji ? (
                <span>Traits : <span className="text-white">{currentKanji.strokes}</span></span>
              ) : null}
              {currentKanji && "frequency" in currentKanji ? (
                <span>Fréquence : <span className="text-white">{currentKanji.frequency}</span></span>
              ) : null}
              <span>
                <span className="text-white font-bold">N°</span> {(filteredKanjis.length === 0 ? 0 : currentIdx + 1)}
                {" / "}
                {filteredKanjis.length}
              </span>
            </div>
          </div>
        </div>
        {/* Contrôles navigation */}
        <div className="flex items-center gap-2 justify-center mt-2">
          <button
            className="p-2 rounded bg-gray-700/80 hover:bg-gray-600 transition border border-gray-600"
            onClick={() => goto("first")}
            disabled={currentIdx === 0 || !filteredKanjis.length}
          >
            <ChevronDoubleLeft />
          </button>
          <button
            className="p-2 rounded bg-gray-700/80 hover:bg-gray-600 transition border border-gray-600"
            onClick={() => goto("prev")}
            disabled={filteredKanjis.length === 0}
          >
            <ChevronLeft />
          </button>
          <button
            className="p-2 rounded bg-gray-700/80 hover:bg-gray-600 transition border border-gray-600"
            onClick={() => goto("next")}
            disabled={filteredKanjis.length === 0}
          >
            <ChevronRight />
          </button>
          <button
            className="p-2 rounded bg-gray-700/80 hover:bg-gray-600 transition border border-gray-600"
            onClick={() => goto("last")}
            disabled={currentIdx === filteredKanjis.length - 1 || !filteredKanjis.length}
          >
            <ChevronDoubleRight />
          </button>
        </div>
        <div className="flex justify-center mt-4">
          <button
            className="bg-gradient-to-r from-gray-600 to-gray-800 px-6 py-2 rounded-lg text-white font-semibold shadow hover:from-gray-700 hover:to-gray-900 transition"
            onClick={onBack}
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}
