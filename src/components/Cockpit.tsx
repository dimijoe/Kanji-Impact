import React, { useState, useRef, useEffect, useMemo } from "react";
import { GameState } from "../types";

// Helper son
function playSound(url: string) {
  const audio = new window.Audio(url);
  audio.currentTime = 0;
  audio.play();
}
function removeParenthesis(str: string) {
  return str.replace(/\((.*?)\)/g, "");
}
type Trajectory = "center" | "right" | "left";
function getRandomTrajectory(): Trajectory {
  const r = Math.random();
  if (r < 0.34) return "left";
  if (r < 0.67) return "right";
  return "center";
}
interface CockpitProps {
  gameState: GameState;
  onAnswer: (answer: string) => void;
  onMenu?: () => void;
}

export function Cockpit({ gameState, onAnswer, onMenu }: CockpitProps) {
  const [input, setInput] = useState("");
  const [kanjiZ, setKanjiZ] = useState(0);
  const [kanjiArrive, setKanjiArrive] = useState(false);
  const [kanjiExplode, setKanjiExplode] = useState(false);
  const [kanjiMissed, setKanjiMissed] = useState(false);
  const [laserDirection, setLaserDirection] = useState<Trajectory>("center");
  const [showLaser, setShowLaser] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const animRef = useRef<number>();
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);
  const { score, currentKanji } = gameState;
  const DURATION_BY_SPEED = useMemo(() => ({
    training: 10,
    normal: 7,
    expert: 5,
  }), []);
  const duration =
    DURATION_BY_SPEED[
      (gameState.speed as keyof typeof DURATION_BY_SPEED) || "normal"
    ] || 7;
  const [kanjiStart, setKanjiStart] = useState({ x: 0.5, y: 0.06 });
  const [kanjiEnd, setKanjiEnd] = useState({ x: 0.5, y: 0.38 });

  useEffect(() => {
    if (!currentKanji) return;
    let trajectory: Trajectory = getRandomTrajectory();
    setLaserDirection(trajectory);
    let startPos, endPos;
    if (trajectory === "center") {
      startPos = { x: 0.5, y: 0.06 };
      endPos = { x: 0.5, y: 0.38 };
    } else if (trajectory === "left") {
      startPos = { x: 0.13, y: 0.16 };
      endPos = { x: 0.34, y: 0.43 };
    } else {
      startPos = { x: 0.87, y: 0.16 };
      endPos = { x: 0.66, y: 0.43 };
    }
    setKanjiStart(startPos);
    setKanjiEnd(endPos);
    setKanjiZ(0);
    setKanjiArrive(false);
    setKanjiExplode(false);
    setKanjiMissed(false);
    setShowLaser(false);
    setScreenShake(false);
    setInput("");
    setTimeLeft(duration);
    if (inputRef.current) inputRef.current.focus();
    elapsedRef.current = 0;
    startTimeRef.current = null;
  }, [currentKanji, gameState.speed, duration]);

  useEffect(() => {
    if (!currentKanji) return;
    let paused = false, started = false;
    function loop(now: number) {
      if (paused) return;
      if (!started) {
        started = true;
        if (startTimeRef.current == null) startTimeRef.current = now;
      }
      let totalElapsed =
        elapsedRef.current + (now - (startTimeRef.current || now)) / 1000;
      let progress = Math.min(1, totalElapsed / duration);
      setKanjiZ(progress);
      setTimeLeft(Math.max(0, Math.ceil(duration - totalElapsed)));
      if (progress >= 1) {
        setKanjiArrive(true);
        setKanjiExplode(true);
        setScreenShake(true);
        setTimeout(() => {
          setKanjiExplode(false);
          setScreenShake(false);
        }, 600);
      } else {
        animRef.current = requestAnimationFrame(loop);
      }
    }
    if (!isPaused) {
      animRef.current = requestAnimationFrame(loop);
    }
    return () => {
      paused = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (startTimeRef.current) {
        const now = performance.now();
        elapsedRef.current += (now - startTimeRef.current) / 1000;
        startTimeRef.current = null;
      }
    };
  }, [currentKanji, duration, isPaused]);

  const handlePauseToggle = () => setIsPaused(p => !p);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [kanjiArrive, kanjiExplode, isPaused]);
  useEffect(() => {
    const handle = () => inputRef.current?.focus();
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  function checkKanjiAnswer(userInput: string, kanji: any, mode: string) {
    if (!kanji || !userInput) return false;
    if (mode === "meaning") {
      return kanji.meanings.map((m: string) => m.toLowerCase()).includes(userInput.toLowerCase());
    }
    if (mode === "onYomi") {
      return kanji.onYomi.map((o: string) => removeParenthesis(o).toLowerCase()).includes(userInput.toLowerCase());
    }
    if (mode === "kunYomi") {
      return kanji.kunYomi.map((k: string) => removeParenthesis(k).toLowerCase()).includes(userInput.toLowerCase());
    }
    return false;
  }
  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault?.();
    if (!currentKanji || kanjiArrive || isPaused) return;
    const userInput = input.trim();
    const isCorrect = checkKanjiAnswer(userInput, currentKanji, gameState.mode);
    playSound('/audio/Sound_rayon.mp3');
    if (isCorrect) {
      setShowLaser(true);
      setTimeout(() => {
        setShowLaser(false);
        setKanjiExplode(true);
        setScreenShake(true);
        playSound('/audio/Sound_explosion.mp3');
        setTimeout(() => setKanjiExplode(false), 600);
        setTimeout(() => setScreenShake(false), 700);
      }, 210);
      setKanjiMissed(false);
    } else {
      setKanjiMissed(true);
      setTimeout(() => setKanjiMissed(false), 380);
    }
    onAnswer(userInput);
    setInput("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && input.trim()) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape" && !isPaused) {
      handlePauseToggle();
    }
  };
  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
  const kanjiPos = {
    x: lerp(kanjiStart.x, kanjiEnd.x, kanjiZ),
    y: lerp(kanjiStart.y, kanjiEnd.y, kanjiZ)
  };
  const mainStyle: React.CSSProperties = screenShake
    ? { animation: "screenShake 0.36s cubic-bezier(.23,1.85,.42,-0.2) 2" }
    : {};

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        minHeight: "100svh",
        background:
          "radial-gradient(ellipse at 50% 100%, #1b273c 58%, #28325e 100%, #141b30 100%)",
        overflow: "hidden",
        position: "relative",
        ...mainStyle
      }}
      tabIndex={-1}
      onClick={() => inputRef.current?.focus()}
    >
      {kanjiMissed && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,30,60,0.14)",
            zIndex: 99,
            pointerEvents: "none",
            animation: "flashMissed 0.38s"
          }}
        />
      )}
      
      {/* Score et temps - Responsive */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-30">
        <div className="bg-black/50 rounded-lg px-3 py-2 text-white">
          <div className="text-xs sm:text-sm text-gray-300">Score</div>
          <div className="text-lg sm:text-xl font-bold text-sky-400">{score}</div>
        </div>
        <div className="bg-black/50 rounded-lg px-3 py-2 text-white">
          <div className="text-xs sm:text-sm text-gray-300">Temps</div>
          <div className="text-lg sm:text-xl font-bold text-orange-400">{timeLeft}s</div>
        </div>
      </div>

      {/* Boutons de contrôle - Responsive */}
      <div className="absolute top-2 right-2 z-30 flex gap-2">
        <button 
          onClick={handlePauseToggle} 
          className="bg-blue-600/80 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors touch-manipulation"
        >
          {isPaused ? "▶" : "⏸"}
        </button>
        <button 
          onClick={onMenu} 
          className="bg-gray-600/80 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors touch-manipulation"
        >
          Menu
        </button>
      </div>

      {isPaused && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 rounded-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-2xl font-bold text-sky-400 mb-6">PAUSE</h2>
            <div className="space-y-4">
              <button 
                onClick={() => setIsPaused(false)}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-lg font-bold text-lg transition-colors touch-manipulation"
              >
                Reprendre
              </button>
              <button 
                onClick={onMenu}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors touch-manipulation"
              >
                Retour menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanji animé - Taille responsive */}
      {currentKanji && (
        <div
          style={{
            position: "absolute",
            left: `calc(${kanjiPos.x * 100}% )`,
            top: `calc(${kanjiPos.y * 100}%)`,
            transform: `translate(-50%, -50%) scale(${0.18 + 1.25 * kanjiZ}${kanjiExplode ? ",1.46" : ""})`,
            zIndex: 11,
            pointerEvents: "none",
            opacity: kanjiExplode ? 0 : kanjiArrive ? 1 : 0.98,
            transition: kanjiExplode
              ? "opacity 0.16s, filter 0.22s"
              : kanjiArrive
              ? "opacity 0.13s"
              : undefined,
            filter: kanjiExplode
              ? "blur(12px) brightness(2.1) drop-shadow(0 0 74px #fffecb)"
              : kanjiArrive
              ? "drop-shadow(0 0 27px #fff)"
              : "drop-shadow(0 0 13px #75fafd) blur(0.25px)"
          }}
        >
          <span
            className="text-6xl sm:text-7xl md:text-8xl font-black text-white"
            style={{
              textShadow: [
                "0 0 44px #26f8e9",
                "0 0 7vw #12f2ea88",
                "0 0 5px #fff",
                "2px 2px 4px #152e58bb"
              ].join(","),
              letterSpacing: "2.2px"
            }}
          >
            {currentKanji.character}
          </span>
          {kanjiExplode && (
            <ExplosionSVG />
          )}
        </div>
      )}

      {showLaser && (
        <Laser
          target={kanjiPos}
          direction={laserDirection}
        />
      )}

      <CockpitDashboard
        kanjiExplode={kanjiExplode}
        screenShake={screenShake}
      />

      {/* Interface de saisie - Complètement responsive */}
      <div className="absolute bottom-4 left-4 right-4 z-40">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 border-2 border-sky-400/50 shadow-2xl"
          autoComplete="off"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-lg font-semibold placeholder-gray-400 touch-manipulation"
              autoFocus
              placeholder={
                !kanjiExplode && !isPaused
                  ? "Écris ta réponse..."
                  : "En attente…"
              }
              disabled={kanjiExplode || isPaused}
            />
            <button
              type="submit"
              disabled={kanjiExplode || isPaused || !input.trim()}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg disabled:opacity-50 touch-manipulation min-w-[100px]"
            >
              TIRER
            </button>
          </div>
          
          {/* Indicateur de mode de jeu */}
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
              Mode: {gameState.mode === 'onYomi' ? "On'yomi" : gameState.mode === 'kunYomi' ? "Kun'yomi" : "Signification"}
            </span>
          </div>
        </form>
      </div>

      <style>
        {`
        @keyframes screenShake {
          0%{transform: translate(0,0);}
          19%{transform: translate(-8px,6px);}
          34%{transform: translate(9px,-7px);}
          54%{transform: translate(-7px,5px);}
          75%{transform: translate(7px,-7px);}
          100%{transform: translate(0,0);}
        }
        @keyframes flashMissed {
          0%{opacity: .1;}
          30%{opacity: .25;}
          70%{opacity: .18;}
          100%{opacity:0;}
        }
        `}
      </style>
    </div>
  );
}

function Laser({
  target,
  direction
}: {
  target: { x: number; y: number };
  direction: Trajectory;
}) {
  let from;
  if (direction === "center") {
    from = { x: 0.5, y: 0.82 };
  } else if (direction === "left") {
    from = { x: 0.31, y: 0.88 };
  } else {
    from = { x: 0.69, y: 0.88 };
  }
  const w = window.innerWidth,
    h = window.innerHeight;
  const x1 = from.x * w, y1 = from.y * h, x2 = target.x * w, y2 = target.y * h;
  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 25,
        pointerEvents: "none"
      }}
      width={w}
      height={h}
    >
      <defs>
        <linearGradient id="laser" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="30%" stopColor="#96e0f8" stopOpacity="0.92" />
          <stop offset="90%" stopColor="#27e9fd" stopOpacity="0.07" />
        </linearGradient>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="url(#laser)"
        strokeWidth={15}
        strokeLinecap="round"
        filter="drop-shadow(0 0 18px #79f6fe)"
        opacity="0.86"
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#4affff"
        strokeWidth={27}
        strokeLinecap="round"
        opacity="0.14"
        filter="blur(5.7px)"
      />
    </svg>
  );
}

function ExplosionSVG() {
  return (
    <svg width="260" height="260" style={{
      position: "absolute",
      left: "50%",
      top: "52%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      opacity: 0.87,
      zIndex: 99
    }}>
      <radialGradient id="fx" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fffdb6" stopOpacity="1" />
        <stop offset="40%" stopColor="#ffe35f" stopOpacity="0.6" />
        <stop offset="88%" stopColor="#ff9010" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#fff0" stopOpacity="0" />
      </radialGradient>
      <circle cx="130" cy="132" r="84" fill="url(#fx)" />
      <circle cx="130" cy="132" r="43" fill="#fffd8a" opacity="0.18" />
    </svg>
  );
}

function CockpitDashboard({ kanjiExplode, screenShake }: { kanjiExplode: boolean, screenShake: boolean }) {
  return (
    <div
      className="absolute left-0 bottom-0 w-full h-32 sm:h-40 md:h-48 z-10 flex flex-row items-end justify-between px-4 pb-4"
      style={{
        background: "linear-gradient(180deg,#253f69 55%,#22365f 90%,#141924 100%)",
        boxShadow: kanjiExplode
          ? "0 0 45px 25px #fff3, 0 0 70px 12px #ff9603c1"
          : "0 0 35px #16e6e6a9",
        filter: screenShake
          ? "brightness(1.07) blur(1.5px)"
          : "none",
        transition: "filter .21s, box-shadow .28s"
      }}
    >
      {/* Radar gauche */}
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-green-900/50 rounded-xl border-2 border-green-400 flex items-center justify-center"
        style={{
          boxShadow: "0 0 15px #24fc7a77"
        }}
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-400/30 rounded-full border border-green-400"></div>
      </div>

      {/* Écran central */}
      <div className="flex-1 mx-4 h-16 sm:h-20 md:h-24 bg-blue-900/50 rounded-lg border border-blue-400/50 flex items-center justify-center">
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-2 sm:w-4 sm:h-3 bg-blue-400 rounded-sm opacity-80"
              style={{
                backgroundColor: i === 2 ? "#fff" : "#3b8fff",
                boxShadow: i === 2 ? "0 0 8px #43d8ff" : "0 0 4px #138ffa55"
              }}
            />
          ))}
        </div>
      </div>

      {/* Panneau droit */}
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-orange-900/50 rounded-xl border-2 border-orange-400 flex items-center justify-center"
        style={{
          boxShadow: "0 0 15px #fbe04c99"
        }}
      >
        <div className="grid grid-cols-2 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-4 sm:w-3 sm:h-6 bg-orange-400/70 rounded-sm"
              style={{ height: `${20 + i * 10}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}