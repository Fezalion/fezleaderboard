import { useState, useRef, useEffect } from "react";

// ============================================================
// 🎵 EDIT YOUR TRACKS HERE
// ============================================================
const TRACKS = [
  {
    id: 1,
    title: "Rub it on my lips",
    artist: "Assatanica",
    url: "https://kappa.lol/9oHHU4",
    color: "#ff6b6b",
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
    title: "Creampie in Anus",
    artist: "Shroomelle",
    url: "https://kappa.lol/TsaT1E",
    color: "#ff9ff3",
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
  const [volume, setVolume] = useState(0.8);
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
    setIsPlaying(true);
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

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#111118",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)`,
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

          {/* Album art placeholder */}
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
            {/* Shuffle */}
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

            {/* Prev */}
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

            {/* Play/Pause */}
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

            {/* Next */}
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

            {/* Loop */}
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
