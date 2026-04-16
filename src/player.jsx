import { useState, useRef, useEffect } from "react";

// ============================================================
// 🎵 EDIT YOUR TRACKS HERE
// ============================================================
const TRACKS = [
  {
    id: 1,
    title: "Creampie in Anus",
    artist: "Shroomelle",
    url: "https://kappa.lol/TsaT1E",
    color: "#ff9ff3",
  },
  {
    id: 2,
    title: "Gets me drunk",
    artist: "Dragonspunk",
    url: "https://kappa.lol/Ziet9B",
    color: "#feca57",
  },
  {
    id: 3,
    title: "Do me from behind",
    artist: "Assatanica",
    url: "https://kappa.lol/2HyNRt",
    color: "#48dbfb",
  },
  {
    id: 4,
    title: "Rub it on my lips",
    artist: "Assatanica",
    url: "https://kappa.lol/9oHHU4",
    color: "#ff6b6b",
  },
];
// ============================================================

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// ============================================================
// 🌊 BEAT-REACTIVE WAVE VISUALIZER
// - Static colored border (no spinning)
// - Canvas waveform bars that auto-adjust per frequency band
// - Beat detection via bass energy amplifies bar heights
// ============================================================
function VisualizerWave({ audioRef, isPlaying, color }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const requestRef = useRef(null);
  const maxEnergyRef = useRef(1);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    const audioContext = audioCtxRef.current;

    if (isPlaying && audioContext.state === "suspended") {
      audioContext.resume();
    }

    if (!sourceRef.current) {
      try {
        sourceRef.current = audioContext.createMediaElementSource(
          audioRef.current,
        );
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        sourceRef.current.connect(analyser);
        analyser.connect(audioContext.destination);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {}
    }

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !dataArray) return;
    const ctx = canvas.getContext("2d");

    const animate = () => {
      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] *= 0.8;
        }
      }

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      ctx.clearRect(0, 0, W, H);

      const currentMax = Math.max(...dataArray);
      maxEnergyRef.current = Math.max(
        currentMax,
        maxEnergyRef.current * 0.99,
        1,
      );

      // --- BASS DETECTION FOR GLOW ---
      // We look at the first few bins (low frequencies)
      const bassSum = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const bassFactor = bassSum / maxEnergyRef.current; // 0.0 to 1.0

      const BAR_COUNT = 128;
      const barW = W / BAR_COUNT;
      const centerY = H / 2;

      // Set global glow properties based on bass
      ctx.shadowBlur = 30 * bassFactor; // Glow gets bigger on bass hits
      ctx.shadowColor = color;

      for (let i = 0; i < BAR_COUNT; i++) {
        let relIndex =
          i < BAR_COUNT / 2
            ? i / (BAR_COUNT / 2)
            : (BAR_COUNT - i) / (BAR_COUNT / 2);

        const freqIndex = Math.floor(
          Math.pow(relIndex, 1.5) * dataArray.length * 0.5,
        );
        const rawValue = dataArray[freqIndex] / maxEnergyRef.current;
        const edgeTaper = Math.sin(relIndex * Math.PI);

        const barHeight = rawValue * (H * 0.45) * edgeTaper;
        const x = i * barW;

        ctx.globalAlpha = isPlaying ? Math.max(0.1, rawValue * edgeTaper) : 0.1;
        ctx.fillStyle = color;

        const width = barW * 0.5;
        const xOffset = (barW - width) / 2;
        const finalH = Math.max(barHeight, 1);

        // Draw the main bars
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x + xOffset, centerY - finalH, width, finalH, 2);
          ctx.roundRect(x + xOffset, centerY, width, finalH, 2);
          ctx.fill();
        } else {
          ctx.fillRect(x + xOffset, centerY - finalH, width, finalH);
          ctx.fillRect(x + xOffset, centerY, width, finalH);
        }
      }

      // Reset shadow for next frame performance
      ctx.shadowBlur = 0;
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, color, audioRef]);

  return (
    <>
      {/* Beat-reactive background glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: `radial-gradient(circle, ${color}11 0%, transparent 70%)`,
          opacity: isPlaying ? 0.5 : 0,
          transition: "opacity 1s ease",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
          width: "100%",
          height: "450px",
          zIndex: 0,
          pointerEvents: "none",
          filter: "contrast(1.2) brightness(1.2)", // Sharpen the glow
        }}
      />
    </>
  );
}

function WaveformBars({ playing, color }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
        height: "20px",
      }}
    >
      {[0.6, 1, 0.75, 1, 0.5].map((h, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            borderRadius: "2px",
            background: color,
            height: playing ? `${h * 100}%` : "30%",
            animation: playing
              ? `bar-bounce 0.${6 + i}s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${i * 0.1}s`,
            transition: "height 0.3s ease",
          }}
        />
      ))}
      <style>{`
        @keyframes bar-bounce {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

export default function MusicPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const audioRef = useRef(null);
  const track = TRACKS[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.url;
    audio.volume = volume;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
  }, [currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.play().catch(() => setIsPlaying(false)) : audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => setDuration(audioRef.current.duration);
  const handleEnded = () => {
    if (isLooping) {
      audioRef.current.play();
      return;
    }
    if (isShuffling) {
      setCurrentIndex(Math.floor(Math.random() * TRACKS.length));
      return;
    }
    const next = (currentIndex + 1) % TRACKS.length;
    setCurrentIndex(next);
    setIsPlaying(false);
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  const prev = () => {
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    setCurrentIndex((currentIndex - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const next = () => {
    setCurrentIndex(
      isShuffling
        ? Math.floor(Math.random() * TRACKS.length)
        : (currentIndex + 1) % TRACKS.length,
    );
    setIsPlaying(true);
  };

  const selectTrack = (i) => {
    if (i === currentIndex) {
      setIsPlaying(!isPlaying);
      return;
    }
    setCurrentIndex(i);
    setIsPlaying(true);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const accent = track.color;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .track-row:hover { background: rgba(255,255,255,0.05) !important; }
        .ctrl-btn:hover { transform: scale(1.15); }
        .ctrl-btn { transition: transform 0.15s ease; cursor: pointer; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 3px; border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; cursor: pointer; }
      `}</style>

      {/* VISUALIZER — rendered behind everything */}
      <VisualizerWave
        audioRef={audioRef}
        isPlaying={isPlaying}
        color={accent}
      />

      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          background: "#111118",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)`,
          opacity: 0.8,
          outline: `2px solid ${accent}`,
        }}
      >
        {/* Header / Now Playing */}
        <div
          style={{
            padding: "32px 28px 24px",
            background: `linear-gradient(160deg, ${accent}18 0%, transparent 60%)`,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.3)",
              marginBottom: "16px",
              textTransform: "uppercase",
            }}
          >
            Now Playing
          </div>

          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: `linear-gradient(135deg, ${accent}55, ${accent}22)`,
              border: `1px solid ${accent}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              boxShadow: `0 8px 32px ${accent}33`,
            }}
          >
            <span style={{ fontSize: "28px" }}>🎵</span>
          </div>

          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "22px",
              fontWeight: "800",
              color: "#fff",
              marginBottom: "4px",
              letterSpacing: "-0.5px",
            }}
          >
            {track.title}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "20px",
            }}
          >
            {track.artist}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "8px" }}>
            <div
              onClick={seek}
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "2px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${accent}, ${accent}bb)`,
                  borderRadius: "2px",
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <button
              className="ctrl-btn"
              onClick={() => setIsShuffling(!isShuffling)}
              style={{
                background: "none",
                border: "none",
                color: isShuffling ? accent : "rgba(255,255,255,0.3)",
                fontSize: "16px",
              }}
            >
              ⇄
            </button>

            <button
              className="ctrl-btn"
              onClick={prev}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                fontSize: "20px",
              }}
            >
              ⏮
            </button>

            <button
              className="ctrl-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: accent,
                border: "none",
                color: "#000",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 24px ${accent}66`,
              }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            <button
              className="ctrl-btn"
              onClick={next}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                fontSize: "20px",
              }}
            >
              ⏭
            </button>

            <button
              className="ctrl-btn"
              onClick={() => setIsLooping(!isLooping)}
              style={{
                background: "none",
                border: "none",
                color: isLooping ? accent : "rgba(255,255,255,0.3)",
                fontSize: "16px",
              }}
            >
              ↺
            </button>
          </div>

          {/* Volume */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
              🔈
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{
                flex: 1,
                background: `linear-gradient(90deg, ${accent} ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%)`,
              }}
            />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
              🔊
            </span>
          </div>
        </div>

        {/* Track List */}
        <div style={{ maxHeight: "260px", overflowY: "auto" }}>
          {TRACKS.map((t, i) => (
            <div
              key={t.id}
              className="track-row"
              onClick={() => selectTrack(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                cursor: "pointer",
                background:
                  i === currentIndex ? "rgba(255,255,255,0.06)" : "transparent",
                borderLeft:
                  i === currentIndex
                    ? `3px solid ${t.color}`
                    : "3px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: `${t.color}22`,
                  border: `1px solid ${t.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i === currentIndex && isPlaying ? (
                  <WaveformBars playing={true} color={t.color} />
                ) : (
                  <span style={{ fontSize: "14px", color: t.color }}>♪</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color:
                      i === currentIndex ? "#fff" : "rgba(255,255,255,0.6)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "2px",
                  }}
                >
                  {t.artist}
                </div>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              >
                #{String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
