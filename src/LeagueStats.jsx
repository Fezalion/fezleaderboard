import { useMemo, useState } from "react";

const CHART_COLORS = [
  "#7fe0a4",
  "#8fd3ff",
  "#e0b46b",
  "#b794f6",
  "#e07a7a",
  "#f2a6c8",
  "#a3e635",
  "#60a5fa",
  "#fb923c",
  "#67e8f9",
  "#c4b5fd",
  "#94a3b8",
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Builds an SVG donut path for a single slice
function describeArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const outerStart = polarToCartesian(cx, cy, rOuter, endAngle);
  const outerEnd = polarToCartesian(cx, cy, rOuter, startAngle);
  const innerStart = polarToCartesian(cx, cy, rInner, endAngle);
  const innerEnd = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

// Generic donut chart. Takes [{ label, value }] and renders slices + a legend.
function DonutChart({ data, size = 400, thickness = 128 }) {
  const [hovered, setHovered] = useState(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter - thickness;

  let cursor = 0;
  const slices = data.map((d, i) => {
    const angle = total > 0 ? (d.value / total) * 360 : 0;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return {
      ...d,
      path: describeArc(cx, cy, rOuter, rInner, start, end),
      color: CHART_COLORS[i % CHART_COLORS.length],
      pct: total > 0 ? (d.value / total) * 100 : 0,
    };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="donut">
        {slices.map((s, i) => (
          <path
            key={s.label + i}
            d={s.path}
            fill={s.color}
            opacity={hovered === null || hovered === i ? 1 : 0.35}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="donut-total"
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          {hovered !== null ? `${slices[hovered].pct.toFixed(1)}%` : total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="donut-label"
          style={{ fontSize: 11 }}
        >
          {hovered !== null ? slices[hovered].label : "total"}
        </text>
      </svg>

      <div className="legend">
        {slices
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((s, i) => (
            <div
              key={s.label + i}
              className="legend-row"
              onMouseEnter={() =>
                setHovered(data.findIndex((d) => d.label === s.label))
              }
              onMouseLeave={() => setHovered(null)}
            >
              <span className="legend-label">
                <span className="swatch" style={{ background: s.color }} />
                <span className="legend-text">{s.label}</span>
              </span>
              <span className="dim">
                {s.value} ({s.pct.toFixed(1)}%)
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// Horizontal bar list, e.g. for level buckets
function BarList({ data, maxBars = 10 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="barlist">
      {data.slice(0, maxBars).map((d, i) => (
        <div key={d.label + i} className="barlist-row">
          <span className="dim barlist-label">{d.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="barlist-value">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

// League-wide stats: class/ascendancy split, alive vs dead, level spread, and misc counts.
function LeagueStats({ ladder, leagueName }) {
  const stats = useMemo(() => {
    if (!ladder || ladder.length === 0) return null;

    const classCounts = {};
    const levelBuckets = {};
    const uniqueAccounts = new Set();
    let alive = 0;
    let dead = 0;
    let retired = 0;
    let liveOnTwitch = 0;
    let totalLevel = 0;
    let totalChallenges = 0;
    let challengeSamples = 0;
    let maxDepthDefault = 0;
    let maxDepthSolo = 0;
    let depthEntries = 0;
    const levels = [];

    ladder.forEach((entry) => {
      const cls = entry.character?.class || "Unknown";
      classCounts[cls] = (classCounts[cls] || 0) + 1;

      const lvl = entry.character?.level || 0;
      levels.push(lvl);
      totalLevel += lvl;
      const bucketStart = Math.floor(lvl / 10) * 10;
      const bucketLabel = `${bucketStart}-${bucketStart + 9}`;
      levelBuckets[bucketLabel] = (levelBuckets[bucketLabel] || 0) + 1;

      if (entry.account?.name) uniqueAccounts.add(entry.account.name);
      if (entry.dead) dead++;
      else alive++;
      if (entry.retired) retired++;
      if (entry.account?.twitch?.stream) liveOnTwitch++;
      if (entry.account?.challenges?.completed !== undefined) {
        totalChallenges += entry.account.challenges.completed;
        challengeSamples++;
      }
      if (entry.character?.depth) {
        depthEntries++;
        maxDepthDefault = Math.max(
          maxDepthDefault,
          entry.character.depth.default || 0,
        );
        maxDepthSolo = Math.max(maxDepthSolo, entry.character.depth.solo || 0);
      }
    });

    levels.sort((a, b) => a - b);
    const median =
      levels.length % 2 === 0
        ? (levels[levels.length / 2 - 1] + levels[levels.length / 2]) / 2
        : levels[Math.floor(levels.length / 2)];

    return {
      classData: Object.entries(classCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      levelBucketData: Object.entries(levelBuckets)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => parseInt(a.label) - parseInt(b.label)),
      totalCharacters: ladder.length,
      uniqueAccountCount: uniqueAccounts.size,
      alive,
      dead,
      retired,
      liveOnTwitch,
      avgLevel: (totalLevel / ladder.length).toFixed(1),
      medianLevel: median,
      topLevel: levels[levels.length - 1] || 0,
      avgChallenges:
        challengeSamples > 0
          ? (totalChallenges / challengeSamples).toFixed(1)
          : null,
      hasDelve: depthEntries > 0,
      maxDepthDefault,
      maxDepthSolo,
    };
  }, [ladder]);

  if (!stats) return null;

  return (
    <section className="panel">
      <h2>league stats{leagueName ? ` — ${leagueName}` : ""}</h2>

      <div className="panel-body">
        <div className="stat-grid">
          <StatCard label="Characters" value={stats.totalCharacters} />
          <StatCard label="Accounts" value={stats.uniqueAccountCount} />
          <StatCard
            label="Alive"
            value={`${((stats.alive / stats.totalCharacters) * 100).toFixed(0)}%`}
            sub={`${stats.alive} / ${stats.totalCharacters}`}
          />
          <StatCard label="Retired" value={stats.retired} />
          <StatCard label="Avg Level" value={stats.avgLevel} />
          <StatCard label="Median Level" value={stats.medianLevel} />
          <StatCard label="Top Level" value={stats.topLevel} />
          <StatCard label="Live on Twitch" value={stats.liveOnTwitch} />
        </div>

        {(stats.avgChallenges !== null || stats.hasDelve) && (
          <dl className="info" style={{ margin: 0 }}>
            {stats.avgChallenges !== null && (
              <>
                <dt>avg. challenges completed</dt>
                <dd>{stats.avgChallenges}</dd>
              </>
            )}
            {stats.hasDelve && (
              <>
                <dt>deepest delve</dt>
                <dd>{stats.maxDepthDefault}</dd>
                <dt>deepest solo</dt>
                <dd>{stats.maxDepthSolo}</dd>
              </>
            )}
          </dl>
        )}

        <div>
          <h3 className="sect">class / ascendancy breakdown</h3>
          <DonutChart data={stats.classData} />
        </div>

        <div>
          <h3 className="sect">level distribution</h3>
          <BarList data={stats.levelBucketData} maxBars={20} />
        </div>
      </div>
    </section>
  );
}

export default LeagueStats;