import { useMemo } from "react";

const LABEL_WIDTH = 108; // px, left column: rank + names
const GAP_PX = 8; // px, tailwind gap-2 between label / bar / depth
const DEPTH_WIDTH = 52; // px, right column: depth number
const ROW_HEIGHT = 44; // px per player row
const MIN_BAR_PX = 10; // every bar is at least this long, even at 0 depth

const rankColor = (idx) => {
  return idx % 2 === 0 ? "#4ecdc4" : "#8b5cf6";
};

const DelveBattleCarousel = ({ ladder, THEME }) => {
  // One row per account: their single deepest character.
  const players = useMemo(() => {
    const bestPerAccount = {};
    (ladder || []).forEach((entry) => {
      const accName = entry.account?.name;
      if (!accName) return;
      const depth = entry.character?.depth?.default || 0;
      const existing = bestPerAccount[accName];
      if (!existing || depth > (existing.character?.depth?.default || 0)) {
        bestPerAccount[accName] = entry;
      }
    });
    return Object.values(bestPerAccount).sort(
      (a, b) =>
        (b.character?.depth?.default || 0) - (a.character?.depth?.default || 0),
    );
  }, [ladder]);

  if (!players.length) return null;

  const maxDepth = players[0]?.character?.depth?.default || 0;

  return (
    <div
      className={`${THEME.accentSecondary} rounded-lg border-2 ${THEME.borderPrimary} overflow-hidden ${THEME.glowSecondary} glass-panel transition-all duration-300 flex flex-col`}
    >
      <style>{`        
        .ladder-scroll {
          scrollbar-width: thin;
          scrollbar-color: #8b5cf680 transparent;
        }
        .ladder-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .ladder-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .ladder-scroll::-webkit-scrollbar-thumb {
          background-color: #8b5cf680;
          border-radius: 999px;
        }
      `}</style>

      {}
      <div
        className={`${THEME.accentPrimary} border-b-2 ${THEME.borderPrimary} p-3 flex items-center justify-center`}
      >
        <span className="text-[#c4b5fd] font-bold text-[0.85rem] uppercase tracking-widest text-center">
          ⛏️ Delve Depth Ladder ⛏️
        </span>
      </div>

      {}
      <div
        className="ladder-scroll p-4 overflow-y-auto"
        style={{ maxHeight: "min(60vh, 720px)" }}
      >
        <div className="relative">
          {}
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-[#8b5cf6] rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)] z-10"
            style={{ left: `${LABEL_WIDTH + GAP_PX}px` }}
          />

          <div className="flex flex-col">
            {players.map((entry, i) => {
              const depth = entry.character?.depth?.default || 0;
              if (depth == 0) return;
              const pct = maxDepth > 0 ? (depth / maxDepth) * 100 : 0;
              const color = rankColor(i);
              const accName = entry.account?.name || "Unknown";
              const displayName = accName.split("#")[0];

              return (
                <div
                  key={accName + "-" + i}
                  className="flex items-center"
                  style={{ height: `${ROW_HEIGHT}px`, gap: `${GAP_PX}px` }}
                >
                  {}
                  <div
                    className="shrink-0 text-right overflow-hidden"
                    style={{ width: `${LABEL_WIDTH}px` }}
                  >
                    <div
                      className="text-[0.75rem] font-bold truncate"
                      style={{ color }}
                    >
                      {i + 1}. {displayName}
                    </div>
                    <div className="text-[0.6rem] text-white/40 truncate">
                      {entry.character?.name}
                      {entry.dead && (
                        <span className="text-red-500 ml-1">✝</span>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="relative flex-1 h-3">
                    <div className="absolute inset-0 rounded-r-full bg-black/40 border border-[#8b5cf6]/20 overflow-hidden" />
                    <div
                      className="absolute left-0 top-0 h-full rounded-r-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        minWidth: `${MIN_BAR_PX}px`,
                        background: `linear-gradient(to right, ${color}55, ${color})`,
                        boxShadow: `0 0 8px ${color}66`,
                      }}
                    ></div>
                  </div>

                  {}
                  <div
                    className="shrink-0 text-right font-mono font-bold text-sm"
                    style={{ width: `${DEPTH_WIDTH}px`, color }}
                  >
                    {depth}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelveBattleCarousel;
