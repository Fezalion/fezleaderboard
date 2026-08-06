import { useMemo, useState } from "react";

// Palette pulled from the app's existing gradient accents so slices feel native
const CHART_COLORS = [
  "#8b5cf6",
  "#ff8c42",
  "#4ecdc4",
  "#c4b5fd",
  "#f472b6",
  "#facc15",
  "#34d399",
  "#60a5fa",
  "#fb7185",
  "#a3e635",
  "#e879f9",
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
function DonutChart({ data, THEME, size = 400, thickness = 128 }) {
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
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="flex-shrink-0"
      >
        {slices.map((s, i) => (
          <path
            key={s.label + i}
            d={s.path}
            fill={s.color}
            opacity={hovered === null || hovered === i ? 1 : 0.35}
            className="transition-opacity duration-150 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className={`fill-current ${THEME.textPrimary}`}
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          {hovered !== null ? `${slices[hovered].pct.toFixed(1)}%` : total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className={`fill-current ${THEME.textTertiary}`}
          style={{ fontSize: 11 }}
        >
          {hovered !== null ? slices[hovered].label : "total"}
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-1 text-sm font-sans max-h-128 overflow-y-auto pr-1 w-full">
        {slices
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((s, i) => (
            <div
              key={s.label + i}
              className={`flex items-center justify-between gap-3 px-2 py-1 rounded cursor-pointer ${THEME.hoverDark}`}
              onMouseEnter={() =>
                setHovered(data.findIndex((d) => d.label === s.label))
              }
              onMouseLeave={() => setHovered(null)}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: s.color }}
                />
                <span className={`truncate ${THEME.textSecondary}`}>
                  {s.label}
                </span>
              </span>
              <span
                className={`font-mono text-xs flex-shrink-0 ${THEME.textTertiary}`}
              >
                {s.value} ({s.pct.toFixed(1)}%)
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// Small horizontal bar list, e.g. for level buckets
function BarList({ data, THEME, maxBars = 10 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2">
      {data.slice(0, maxBars).map((d, i) => (
        <div key={d.label + i} className="flex items-center gap-2">
          <span
            className={`w-16 text-xs font-mono flex-shrink-0 ${THEME.textTertiary}`}
          >
            {d.label}
          </span>
          <div className="flex-1 h-3 bg-white/[0.08] rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#ff8c42] transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span
            className={`w-10 text-xs font-mono text-right flex-shrink-0 ${THEME.textSecondary}`}
          >
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, THEME }) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 rounded-lg glass-panel border-2 ${THEME.borderPrimary}`}
    >
      <span className={`text-2xl font-bold font-mono ${THEME.textPrimary}`}>
        {value}
      </span>
      <span className={`text-xs uppercase tracking-wide ${THEME.textTertiary}`}>
        {label}
      </span>
      {sub && (
        <span className={`text-[11px] mt-1 ${THEME.textSecondary}`}>{sub}</span>
      )}
    </div>
  );
}

// League-wide stats: class/ascendancy split, alive vs dead, level spread, and misc counts.
// Props mirror the other sidebar widgets (FishyRerollCounter, DelveBattleCarousel): ladder + THEME.
function LeagueStats({ ladder, THEME, leagueName }) {
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

    const topClassEntry = Object.entries(classCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      classData: Object.entries(classCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      aliveDeadData: [
        { label: "Alive", value: alive },
        { label: "Dead", value: dead },
      ],
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
      topClass: topClassEntry ? topClassEntry[0] : "-",
      topClassCount: topClassEntry ? topClassEntry[1] : 0,
      hasDelve: depthEntries > 0,
      maxDepthDefault,
      maxDepthSolo,
    };
  }, [ladder]);

  if (!stats) return null;

  return (
    <div
      className={`w-full ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowLarge} rounded-lg overflow-hidden glass-panel p-4 flex flex-col gap-6`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-sans">
          League Stats{leagueName ? ` — ${leagueName}` : ""}
        </h2>
      </div>

      {/* Top-line numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Characters"
          value={stats.totalCharacters}
          THEME={THEME}
        />
        <StatCard
          label="Accounts"
          value={stats.uniqueAccountCount}
          THEME={THEME}
        />
        <StatCard
          label="Alive"
          value={`${((stats.alive / stats.totalCharacters) * 100).toFixed(0)}%`}
          sub={`${stats.alive} / ${stats.totalCharacters}`}
          THEME={THEME}
        />
        <StatCard label="Retired" value={stats.retired} THEME={THEME} />
        <StatCard label="Avg Level" value={stats.avgLevel} THEME={THEME} />
        <StatCard
          label="Median Level"
          value={stats.medianLevel}
          THEME={THEME}
        />
        <StatCard label="Top Level" value={stats.topLevel} THEME={THEME} />
        <StatCard
          label="Live on Twitch"
          value={stats.liveOnTwitch}
          THEME={THEME}
        />
      </div>

      {stats.avgChallenges !== null && (
        <div className="text-sm font-sans">
          <span className={THEME.textTertiary}>
            Avg. challenges completed:{" "}
          </span>
          <span className={`font-mono font-semibold ${THEME.textPrimary}`}>
            {stats.avgChallenges}
          </span>
        </div>
      )}

      {stats.hasDelve && (
        <div className="text-sm font-sans flex gap-6">
          <span>
            <span className={THEME.textTertiary}>Deepest delve: </span>
            <span className={`font-mono font-semibold ${THEME.textPrimary}`}>
              {stats.maxDepthDefault}
            </span>
          </span>
          <span>
            <span className={THEME.textTertiary}>Deepest solo: </span>
            <span className={`font-mono font-semibold ${THEME.textPrimary}`}>
              {stats.maxDepthSolo}
            </span>
          </span>
        </div>
      )}

      {/* Class / Ascendancy breakdown */}
      <div>
        <h3
          className={`text-sm font-semibold mb-3 font-sans ${THEME.textSecondary}`}
        >
          Class / Ascendancy Breakdown
        </h3>
        <DonutChart data={stats.classData} THEME={THEME} />
      </div>

      {/* Level distribution */}
      <div>
        <h3
          className={`text-sm font-semibold mb-3 font-sans ${THEME.textSecondary}`}
        >
          Level Distribution
        </h3>
        <BarList data={stats.levelBucketData} THEME={THEME} maxBars={20} />
      </div>
    </div>
  );
}

export default LeagueStats;
