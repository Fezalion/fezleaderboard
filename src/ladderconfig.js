// ============================================================
// Shared, non-component constants used across the ladder page
// and the overlay pages. Kept in its own file (rather than in
// App.jsx) so that App.jsx only exports a component and React
// Fast Refresh can still hot-reload it correctly.
// ============================================================

// THEME CONFIGURATION - Customize all colors and styles here
export const THEME = {
  // Primary colors
  bgGradient: "from-[#08090c] to-[#08090c]",
  textPrimary: "text-[#e8e6f0]",
  textSecondary: "text-[#a8a5b8]",
  textTertiary: "text-[#6b6878]",
  textDark: "text-[#4a4756]",

  // Accent colors (glass panels — translucent over the obsidian backdrop)
  accentPrimary: "bg-white/[0.04]",
  accentSecondary: "bg-white/[0.03]",
  accentTertiary: "bg-[#0d0e16]",
  accentLight: "bg-white/[0.07]",

  // Border colors
  borderPrimary: "border-[#8b5cf6]/25",
  borderSecondary: "border-[#8b5cf6]/12",
  borderDead: "border-red-900/40",

  // Glow/Shadow effects
  glowPrimary: "shadow-lg shadow-[#8b5cf6]/10",
  glowSecondary: "shadow-md shadow-[#8b5cf6]/5",
  glowLarge: "shadow-xl shadow-[#8b5cf6]/15",

  // Interactive states
  hoverDark: "hover:bg-[#8b5cf6]/10",
  hoverMedium: "hover:bg-[#8b5cf6]/07",
  focusBorder: "focus:border-[#8b5cf6]/70",

  // Special colors
  linkColor: "text-[#ff8c42]",
  linkColorHover: "hover:text-[#ffab6b]",
  deadColor: "bg-red-950/40",
  deadText: "text-red-400/80",
  twitch: "bg-[#9147ff]",
  twitchHover: "hover:bg-[#7c3aed]",

  // Row colors for tables
  rowEven: "bg-white/[0.015]",
  rowOdd: "bg-transparent",
  rowHover: "hover:bg-[#8b5cf6]/[0.07]",
  rowBorder: "border-b border-white/[0.06]",
  rowDead:
    "bg-red-950/15 text-red-400/70 line-through border-b border-red-900/15",
  rowAlive:
    "bg-transparent border-b border-white/[0.06] hover:bg-[#8b5cf6]/[0.07]",

  // Skeleton colors
  skeletonBg: "bg-white/[0.05]",
  skeletonPulse: "bg-white/[0.09]",
  skeletonBorder: "border border-white/10",
  skeletonGlow: "shadow-md shadow-black/40",
};

// List of leagues to show in the combobox
export const LEAGUE_OPTIONS = [
  {
    label: "Yo can I get that",
    value: "Yo can I get that (PL83733)",
  },
  {
    label: "Shimatta",
    value: "Shimatta (PL78633)",
  },
  {
    label: "VibeRaters Praise the Tree Tree",
    value: "VibeRaters Praise the Tree Tree (PL76433)",
  },
];

// Get league name from query param if present
export function getLeagueName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("league") || LEAGUE_OPTIONS[0].value;
}

export const LIMIT = 200;
export const REFRESH_INTERVAL = 300; // seconds

export const getApiUrls = (leagueName) => ({
  API_URL: `https://poe-proxy-nine.vercel.app/api/ladder?league=${encodeURIComponent(
    leagueName,
  )}&limit=${LIMIT}`,
  API2_URL: `https://poe-proxy-nine.vercel.app/api/league?league=${encodeURIComponent(
    leagueName,
  )}`,
});

export function computeOverlayRows(
  ladder,
  { type, count, depthMode, names, peopleSort },
) {
  if (type === "topDelve") {
    return [...ladder]
      .filter((e) => e.character?.depth)
      .sort(
        (a, b) =>
          (b.character.depth[depthMode] || 0) -
          (a.character.depth[depthMode] || 0),
      )
      .slice(0, count);
  }
  if (type === "people") {
    const wanted = new Set((names || []).map((n) => n.toLowerCase()));
    const byName = new Map();
    ladder.forEach((e) => {
      const n = e.character?.name;
      if (n && wanted.has(n.toLowerCase()) && !byName.has(n.toLowerCase())) {
        byName.set(n.toLowerCase(), e);
      }
    });

    // Initially preserve selection order
    let rows = (names || [])
      .map((n) => byName.get(n.toLowerCase()))
      .filter(Boolean);

    // Apply specific people sorting selection
    if (peopleSort === "level") {
      rows.sort((a, b) => {
        const lvl = (b.character?.level || 0) - (a.character?.level || 0);
        if (lvl !== 0) return lvl;
        return (b.character?.experience || 0) - (a.character?.experience || 0);
      });
    } else if (peopleSort === "delve") {
      rows.sort((a, b) => {
        const depthA = a.character?.depth?.[depthMode] || 0;
        const depthB = b.character?.depth?.[depthMode] || 0;
        return depthB - depthA;
      });
    }

    return rows;
  }
  // topLevels (default)
  return [...ladder]
    .sort((a, b) => {
      const lvl = (b.character?.level || 0) - (a.character?.level || 0);
      if (lvl !== 0) return lvl;
      return (b.character?.experience || 0) - (a.character?.experience || 0);
    })
    .slice(0, count);
}
