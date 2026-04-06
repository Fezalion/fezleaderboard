import { useState, useEffect } from "react";

const DelveBattleCarousel = ({ ladder, battlePairs, THEME }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const ROTATE_DURATION = 12000;
  const TICK_RATE = 100;

  useEffect(() => {
    if (!battlePairs || battlePairs.length <= 1 || isHovered) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const step = (TICK_RATE / ROTATE_DURATION) * 100;
        const nextValue = prev + step;

        if (nextValue >= 100) {
          // Logic to move to next slide
          setCurrentIndex((idx) => (idx + 1) % battlePairs.length);
          return 0;
        }
        return nextValue;
      });
    }, TICK_RATE);

    return () => clearInterval(timer);
  }, [isHovered, battlePairs.length]);

  const handleDotClick = (idx) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  if (!battlePairs || battlePairs.length === 0) return null;

  const currentBattle = battlePairs[currentIndex];

  // Helper to find the deepest character for an account
  const getBestEntry = (accName) => {
    let best = null;
    if (!ladder) return null;
    ladder.forEach((entry) => {
      const depth = entry.character?.depth?.default || 0;
      if (
        depth > 0 &&
        entry.account?.name?.toLowerCase() === accName.toLowerCase()
      ) {
        if (!best || depth > (best.character?.depth?.default || 0)) {
          best = entry;
        }
      }
    });
    return best;
  };

  const entryA = getBestEntry(currentBattle.playerA.acc);
  const entryB = getBestEntry(currentBattle.playerB.acc);
  const depthA = entryA?.character?.depth?.default || 0;
  const depthB = entryB?.character?.depth?.default || 0;
  const totalDepth = depthA + depthB || 1;
  const pctA = Math.round((depthA / totalDepth) * 100);
  const pctB = 100 - pctA;
  const winning = depthA > depthB ? "A" : depthB > depthA ? "B" : "tie";

  return (
    <div
      className={`${THEME.accentSecondary} rounded-lg border-2 ${THEME.borderPrimary} overflow-hidden ${THEME.glowSecondary} transition-all duration-300 relative flex flex-col`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`                      
        @keyframes pulse-gold {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .winner-label {
          position: absolute;
          width: 100%;
          left: 0;
          top: -20px; 
          font-size: 0.7rem;
          font-weight: 800;
          color: #e8c97a;
          letter-spacing: 0.1em;
          text-align: center;
        }
      `}</style>

      {/* Header */}
      <div
        className={`${THEME.accentPrimary} border-b-2 ${THEME.borderPrimary} p-3 relative z-10 flex items-center justify-center`}
      >
        <span className="text-[#e8c97a] font-bold text-[0.85rem] uppercase tracking-widest text-center">
          {currentBattle.label}
        </span>
      </div>

      {/* Arena Body */}
      <div
        className="p-5 pb-4 relative flex-1"
        style={{ paddingTop: "2.5rem" }}
      >
        <div className="flex items-center justify-between mb-6 relative">
          {/* Player A */}
          <div className="flex-1 text-center relative">
            {winning === "A" && (
              <div className="winner-label animate-pulse">👑 WINNING 👑</div>
            )}
            <div className="text-[#88bbff] font-black text-xl mb-1 tracking-tight">
              {currentBattle.playerA.display}
            </div>
            <div className="text-[0.7rem] text-[#88bbff]/60 h-4 overflow-hidden mb-2">
              {entryA ? entryA.character?.name : "no active data"}
              {entryA?.dead && <span className="text-red-500 ml-1">✝</span>}
            </div>
            <div className="text-4xl font-black text-[#4488ff] leading-none">
              {depthA}
            </div>
            <div className="text-[0.65rem] text-[#4488ff]/40 uppercase mt-1">
              depth
            </div>
          </div>

          <div className="px-4 text-center relative">
            {winning === "tie" && depthA > 0 && (
              <div className="winner-label" style={{ top: "-25px" }}>
                TIED
              </div>
            )}
            <div className="text-2xl font-black bg-gradient-to-br from-[#4488ff] via-[#e8c97a] to-[#640F87] bg-clip-text text-transparent italic">
              VS
            </div>
            <div className="text-xl mt-1 opacity-80">⚔️</div>
          </div>

          {/* Player B */}
          <div className="flex-1 text-center relative">
            {winning === "B" && (
              <div className="winner-label animate-pulse">👑 WINNING 👑</div>
            )}
            <div className="text-[#a855f7] font-black text-xl mb-1 tracking-tight">
              {currentBattle.playerB.display}
            </div>
            <div className="text-[0.7rem] text-[#a855f7]/60 h-4 overflow-hidden mb-2">
              {entryB ? entryB.character?.name : "no active data"}
              {entryB?.dead && <span className="text-red-500 ml-1">✝</span>}
            </div>
            <div className="text-4xl font-black text-[#640F87] leading-none">
              {depthB}
            </div>
            <div className="text-[0.65rem] text-[#640F87]/40 uppercase mt-1">
              depth
            </div>
          </div>
        </div>

        {/* Depth Comparison Bar */}
        <div className="relative pt-2">
          <div className="h-4 w-full bg-black/40 rounded-full flex overflow-hidden border border-[#c8853a]/20">
            <div
              style={{ width: `${pctA}%` }}
              className="h-full bg-gradient-to-r from-[#1a3a88] to-[#4488ff] transition-all duration-1000 shadow-[0_0_10px_rgba(68,136,255,0.4)]"
            />
            <div
              style={{ width: `${pctB}%` }}
              className="h-full bg-gradient-to-r from-[#640F87] to-[#2c073d] transition-all duration-1000 shadow-[0_0_10px_rgba(100,15,135,0.4)]"
            />
          </div>

          <div className="flex justify-between items-center mt-3 px-1">
            <div className="text-[0.75rem] font-bold text-[#88bbff]">
              {pctA}%
            </div>
            <div className="text-[0.7rem] font-bold text-[#e8c97a] uppercase tracking-tighter bg-[#e8c97a]/10 px-3 py-1 rounded-full border border-[#e8c97a]/20">
              {depthA === depthB
                ? "DEAD HEAT"
                : `${winning === "A" ? currentBattle.playerA.display : currentBattle.playerB.display} LEADS BY ${Math.abs(depthA - depthB)}`}
            </div>
            <div className="text-[0.75rem] font-bold text-[#a855f7]">
              {pctB}%
            </div>
          </div>
        </div>

        {/* Carousel Dots */}
        {battlePairs.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {battlePairs.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? "bg-[#e8c97a] scale-110 shadow-[0_0_5px_rgba(232,201,122,0.8)]"
                    : "bg-[#c8853a]/30 hover:bg-[#c8853a]/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Timer Progress Bar (The bottom-most line) */}
      {battlePairs.length > 1 && (
        <div className="h-[3px] w-full bg-black/40 overflow-hidden">
          <div
            className="h-full bg-[#e8c97a]/50"
            style={{
              width: `${progress}%`,
              transition:
                progress === 0 ? "none" : `width ${TICK_RATE}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DelveBattleCarousel;
