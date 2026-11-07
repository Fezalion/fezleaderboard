import { useMemo } from "react";

const DelveBattleCarousel = ({ ladder }) => {
  // One row per account: their single deepest character, deepest first.
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
    return Object.values(bestPerAccount)
      .filter((e) => (e.character?.depth?.default || 0) > 0)
      .sort(
        (a, b) =>
          (b.character?.depth?.default || 0) -
          (a.character?.depth?.default || 0),
      );
  }, [ladder]);

  if (!players.length) return null;

  const maxDepth = players[0].character.depth.default;

  return (
    <section className="panel">
      <h2>delve depth ladder</h2>
      <div className="scroll delve">
        {players.map((entry, i) => {
          const depth = entry.character.depth.default;
          const pct = (depth / maxDepth) * 100;
          const accName = entry.account?.name || "Unknown";

          return (
            <div key={accName} className="delve-row">
              <div className="delve-who">
                <div className="delve-name">
                  {i + 1}. {accName.split("#")[0]}
                </div>
                <div className="dim delve-char">
                  {entry.character?.name}
                  {entry.dead && <span className="bad"> ✝</span>}
                </div>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="delve-depth">{depth}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DelveBattleCarousel;