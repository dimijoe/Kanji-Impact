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
      <div style={{
        position:"absolute",top:22,right:32,zIndex:125,display:"flex",gap:11
      }}>
        <button onClick={handlePauseToggle} style={btnStyle}>
          {isPaused ? "▶" : "⏸"}
        </button>
        <button onClick={onMenu} style={btnStyle}>Menu</button>
      </div>
      {isPaused && (
        <div style={{
          position:"absolute",zIndex:222,
          left:0,top:0,width:"100vw",height:"100vh",
          background: "rgba(12,19,33,0.74)",display:"flex",alignItems:"center",justifyContent:"center"
        }}>
          <div style={{
            background: "linear-gradient(180deg,#1a3755e9,#091420e9 90%)",
            padding:"45px 65px",borderRadius:32,display:"flex",flexDirection:"column",alignItems:"center",gap:28,boxShadow:"0 0 33px #167af599"
          }}>
            <span style={{fontSize:"2.3rem",color:"#38eeff",fontWeight:"bold"}}>PAUSE</span>
            <button onClick={()=>setIsPaused(false)}
              style={{...btnStyle,minWidth:"110px",padding:"13px 24px",fontWeight:900,fontSize:"1.32rem",background:"#12bdcb"}}>
              Reprendre
            </button>
            <button onClick={onMenu}
              style={{...btnStyle,minWidth:"110px",padding:"11px 20px",fontSize:"1.06rem",background:"#2a3a56"}}>
              Retour menu
            </button>
          </div>
        </div>
      )}
      {/* ... Étoiles, score, countdown, cockpit, laser ... */}
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
            style={{
              fontSize: "8vw",
              color: "#fff",
              textShadow: [
                "0 0 44px #26f8e9",
                "0 0 7vw #12f2ea88",
                "0 0 5px #fff",
                "2px 2px 4px #152e58bb"
              ].join(","),
              fontWeight: 900,
              fontFamily: "Arial Black, sans-serif",
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
      <form
        onSubmit={handleSubmit}
        style={{
          position: "absolute",
          left: "50%",
          bottom: "17vh",
          transform: "translateX(-50%)",
          width: "28vw",
          minWidth: 260,
          maxWidth: 435,
          background: "rgba(16,27,44,0.94)",
          borderRadius: 15,
          padding: "12px 18px",
          display: "flex",
          boxShadow: "0 0 18px #0bfaff44",
          zIndex: 40,
          border: "2.6px solid #39e6ff",
          transition: "box-shadow 0.15s"
        }}
        autoComplete="off"
        tabIndex={-1}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: "rgba(28,39,92,1)",
            color: "#b5fafd",
            border: "none",
            outline: "none",
            padding: "14px",
            fontSize: "1.33rem",
            borderRadius: 11,
            fontWeight: 600,
            fontFamily: "monospace"
          }}
          autoFocus
          placeholder={
            !kanjiExplode && !isPaused
              ? "Écris la réponse puis entrée/espace pour tirer"
              : "En attente…"
          }
          disabled={kanjiExplode || isPaused}
        />
        <button
          type="submit"
          disabled={kanjiExplode || isPaused}
          style={{
            marginLeft: 14,
            padding: "13px 20px",
            fontWeight: "bold",
            background: "linear-gradient(90deg,#15eaff 20%,#28a0ff 110%)",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: "1.09rem",
            boxShadow: "0 0 11px #11e3f9cc",
            cursor: kanjiExplode || isPaused ? "wait" : "pointer",
            opacity: kanjiExplode || isPaused ? 0.6 : 1
          }}
        >
          TIRER
        </button>
      </form>
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
const btnStyle: React.CSSProperties = {
  fontSize:"1.2rem",
  background: "#116ea9",
  color:"#fff",
  border: "none",
  borderRadius: "11px",
  padding:"8px 16px",
  fontWeight:700,
  cursor:"pointer",
  boxShadow:"0 0 7px #0efb",
  outline:"none",
  transition:"background .15s"
};
// ...garde Laser, ExplosionSVG, CockpitDashboard identiques à avant


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
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100vw",
        height: "225px",
        background:
          "linear-gradient(180deg,#253f69 55%,#22365f 90%,#141924 100%)",
        zIndex: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "end",
        boxShadow: kanjiExplode
          ? "0 0 45px 25px #fff3, 0 0 70px 12px #ff9603c1"
          : "0 0 35px #16e6e6a9",
        filter: screenShake
          ? "brightness(1.07) blur(1.5px)"
          : "none",
        transition: "filter .21s, box-shadow .28s"
      }}
    >
      <div
        style={{
          width: "160px",
          height: "155px",
          marginLeft: "30px",
          marginBottom: "20px",
          background: "#092b15",
          borderRadius: "17px",
          border: "3px solid #38fd70",
          boxShadow: "0 0 22px #24fc7a77",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <svg width="110" height="110">
          <circle cx="55" cy="55" r="51" fill="#050" stroke="#24fc7a" strokeWidth="6" opacity="0.16" />
          <circle cx="55" cy="55" r="36" fill="none" stroke="#92ff8e" strokeWidth="2" opacity="0.5" />
          <path d="M55,55 L55,17 A38,38 0 0,1 87,31" stroke="#31fa82" strokeWidth="8" fill="none" opacity="0.64" />
          <circle cx="55" cy="55" r="7" fill="#74fd80" opacity="0.65" />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          height: "179px",
          margin: "0 16px 4px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "end"
        }}
      >
        <div
          style={{
            width: "298px",
            height: "66px",
            background: "linear-gradient(180deg,#384d7f 70%,#163078 105%)",
            borderRadius: "8px",
            marginBottom: "12px",
            boxShadow:
              "inset 0 0 19px #8effff33,0 0 13px #2aeffd22"
          }}
        />
        <div
          style={{
            width: "285px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between"
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 16,
                margin: "4px",
                background: i === 2 ? "#fff" : "#3b8fff",
                borderRadius: "3px",
                boxShadow:
                  i === 2
                    ? "0 0 12px #43d8ff"
                    : "0 0 8px #138ffa55",
                border:
                  i === 2
                    ? "2px solid #25fff3"
                    : "1.8px solid #38eaff",
                opacity: "0.96"
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          width: "142px",
          height: "151px",
          marginRight: "27px",
          marginBottom: "19px",
          background: "#301c0a",
          borderRadius: "17px",
          border: "3px solid #ffb643",
          boxShadow: "0 0 19px #fbe04c99",
          position: "relative",
          display: "flex",
          alignItems: "end",
          justifyContent: "center"
        }}
      >
        <svg width="95" height="100" style={{ marginBottom: "23px" }}>
          <rect x="8" y="49" width="15" height="37" fill="#ffe190" opacity="0.85" />
          <rect x="32" y="33" width="15" height="53" fill="#ffc443" opacity="0.91" />
          <rect x="56" y="73" width="15" height="13" fill="#fedc74" opacity="0.85" />
          <rect x="74" y="43" width="12" height="43" fill="#fffaa0" opacity="0.85" />
        </svg>
      </div>
    </div>
  );
}
