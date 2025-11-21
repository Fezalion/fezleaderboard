import { useEffect, useState, useCallback, useRef } from "react";
import { poeExperienceTable } from "./poeExperienceTable";
import RecentDeathsDisplay from "./RecentDeaths";

// ============================================================
// THEME CONFIGURATION - Customize all colors and styles here
// ============================================================
const THEME = {
  // Primary colors
  bgGradient: "from-black to-gray-950",
  textPrimary: "text-gray-100",
  textSecondary: "text-gray-300",
  textTertiary: "text-gray-500",
  textDark: "text-gray-600",

  // Accent colors
  accentPrimary: "bg-gray-950",
  accentSecondary: "bg-gray-900",
  accentTertiary: "bg-black",
  accentLight: "bg-gray-900",

  // Border colors
  borderPrimary: "border-gray-800",
  borderSecondary: "border-gray-900",
  borderDead: "border-red-900",

  // Glow/Shadow effects
  glowPrimary: "shadow-lg shadow-black/50",
  glowSecondary: "shadow-md shadow-black/40",
  glowLarge: "shadow-xl shadow-black/60",

  // Interactive states
  hoverDark: "hover:bg-black-500",
  hoverMedium: "hover:bg-gray-900",
  focusBorder: "focus:border-blue-500",

  // Special colors
  linkColor: "text-blue-400",
  linkColorHover: "hover:text-blue-300",
  deadColor: "bg-red-950",
  deadText: "text-red-400",
  twitch: "bg-purple-600",
  twitchHover: "hover:bg-purple-700",

  // Row colors for tables
  rowEven: "bg-gray-950",
  rowOdd: "bg-gray-950",
  rowHover: "hover:bg-gray-900",
  rowBorder: "border-b border-gray-900",
  rowDead: "bg-red-950 text-red-400 line-through border-b border-red-900",
  rowAlive: "bg-gray-950 border-b border-gray-900 hover:bg-gray-900",

  // Skeleton colors
  skeletonBg: "bg-gray-950",
  skeletonPulse: "bg-gray-900",
  skeletonBorder: "border border-gray-900",
  skeletonGlow: "shadow-md shadow-black/40",
};

// List of leagues to show in the combobox
const LEAGUE_OPTIONS = [
  {
    label: "VibeRaters Praise the Tree Tree",
    value: "VibeRaters Praise the Tree Tree (PL76433)",
  },
];

// Get league name from query param if present
function getLeagueName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("league") || LEAGUE_OPTIONS[0].value;
}

const LIMIT = 200;
const REFRESH_INTERVAL = 300; // seconds

const getApiUrls = (leagueName) => ({
  API_URL: `https://poe-proxy-nine.vercel.app/api/ladder?league=${encodeURIComponent(
    leagueName
  )}&limit=${LIMIT}`,
  API2_URL: `https://poe-proxy-nine.vercel.app/api/league?league=${encodeURIComponent(
    leagueName
  )}`,
});

function App() {
  const [ladder, setLadder] = useState([]);
  const [refreshSpinAngle, setRefreshSpinAngle] = useState(0);
  // League selection state
  const [selectedLeague, setSelectedLeague] = useState(() => {
    // Try to match param to an option, fallback to param or default
    const param = getLeagueName();
    const found = LEAGUE_OPTIONS.find((l) => l.value === param);
    return found ? found.value : param;
  });
  // Compute alive-only rank for each character (by their unique id or rank)
  const aliveRankMap = (() => {
    let rank = 1;
    const map = {};
    const seenAccounts = new Set();
    ladder.forEach((entry) => {
      if (
        !entry.dead &&
        entry.account?.name &&
        !seenAccounts.has(entry.account.name)
      ) {
        map[entry.rank] = rank;
        seenAccounts.add(entry.account.name);
        rank++;
      }
    });
    return map;
  })();
  // Use selectedLeague instead of leagueName
  const leagueName = selectedLeague;
  const { API_URL, API2_URL } = getApiUrls(leagueName);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [search, setSearch] = useState("");
  const [searchBubbles, setSearchBubbles] = useState([]); // { type, value }
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const searchInputRef = useRef(null);
  const [showDelve, setShowDelve] = useState(false);
  const [onlyAlive, setOnlyAlive] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });

  // Update suggestions when search or ladder changes
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setHighlightedIdx(-1);
      return;
    }
    const lower = search.toLowerCase();
    const chars = new Set();
    const accs = new Set();
    const classes = new Set();
    ladder.forEach((entry) => {
      if (entry.character?.name) chars.add(entry.character.name);
      if (entry.account?.name) accs.add(entry.account.name);
      if (entry.character?.class) classes.add(entry.character.class);
    });
    // Remove already bubbled
    const bubbled = new Set(searchBubbles.map((b) => b.value.toLowerCase()));
    const charSugs = Array.from(chars)
      .filter(
        (n) => n.toLowerCase().includes(lower) && !bubbled.has(n.toLowerCase())
      )
      .map((n) => ({ type: "character", value: n }));
    const accSugs = Array.from(accs)
      .filter(
        (n) => n.toLowerCase().includes(lower) && !bubbled.has(n.toLowerCase())
      )
      .map((n) => ({ type: "account", value: n }));
    const classSugs = Array.from(classes)
      .filter(
        (n) => n.toLowerCase().includes(lower) && !bubbled.has(n.toLowerCase())
      )
      .map((n) => ({ type: "class", value: n }));
    setSuggestions([...charSugs, ...accSugs, ...classSugs].slice(0, 20));
    setHighlightedIdx(-1);
  }, [search, ladder, searchBubbles]);

  // Fetch ladder function

  const fetchLadder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const newLadder = data.entries || [];
      setLadder(newLadder);
    } catch (err) {
      console.error("Error fetching ladder:", err);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, [API_URL]);

  // Manual refresh handler (must be after fetchLadder)
  const handleManualRefresh = () => {
    setRefreshSpinAngle((prev) => prev + 180);
    fetchLadder();
  };

  const fetchLeague = useCallback(async () => {
    try {
      const res = await fetch(API2_URL);
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      console.error("Error fetching league data:", err);
    }
  }, [API2_URL]);

  useEffect(() => {
    fetchLeague();
  }, [fetchLeague]);

  useEffect(() => {
    fetchLadder();
  }, [fetchLadder]);

  useEffect(() => {
    let timer = null;
    let pausedAt = null;

    const tick = () => {
      setCountdown((prev) => {
        if (document.hidden) {
          // Pause timer
          if (!pausedAt) pausedAt = Date.now();
          return prev;
        } else {
          // Resume timer
          if (pausedAt) {
            pausedAt = null;
          }
        }
        if (prev <= 1) {
          fetchLadder();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    };

    timer = setInterval(tick, 1000);

    // Listen for tab visibility changes
    const handleVisibility = () => {
      if (!document.hidden && pausedAt) {
        pausedAt = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchLadder]);

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort indicator component
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="text-purple-400 ml-1">↕️</span>;
    }
    return (
      <span className="text-cyan-300 ml-1">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Compute top 10 accounts with most deaths
  const topDeaths = (() => {
    const deathCounts = {};
    ladder.forEach((entry) => {
      if (entry.dead) {
        const acc = entry.account?.name || "Unknown";
        deathCounts[acc] = (deathCounts[acc] || 0) + 1;
      }
    });

    return Object.entries(deathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 10
  })();

  // Filtered ladder based on search bubbles and onlyAlive
  let filteredLadder = ladder;
  if (searchBubbles.length > 0) {
    filteredLadder = filteredLadder.filter((entry) => {
      return searchBubbles.some((bubble) => {
        if (bubble.type === "character") {
          return (
            entry.character?.name?.toLowerCase() === bubble.value.toLowerCase()
          );
        } else if (bubble.type === "account") {
          return (
            entry.account?.name?.toLowerCase() === bubble.value.toLowerCase()
          );
        } else if (bubble.type === "class") {
          return (
            entry.character?.class?.toLowerCase() === bubble.value.toLowerCase()
          );
        }
        return false;
      });
    });
  } else if (search.trim()) {
    filteredLadder = filteredLadder.filter(
      (entry) =>
        entry.character?.name?.toLowerCase().includes(search.toLowerCase()) ||
        entry.account?.name?.toLowerCase().includes(search.toLowerCase()) ||
        entry.character?.class?.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (onlyAlive) {
    filteredLadder = filteredLadder.filter((entry) => !entry.dead);
  }

  // Sort filtered ladder
  const sortedLadder = [...filteredLadder].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue, bValue;

    switch (sortConfig.key) {
      case "rank":
        aValue = a.rank || 0;
        bValue = b.rank || 0;
        break;
      case "character":
        aValue = a.character?.name?.toLowerCase() || "";
        bValue = b.character?.name?.toLowerCase() || "";
        break;
      case "class":
        aValue = a.character?.class?.toLowerCase() || "";
        bValue = b.character?.class?.toLowerCase() || "";
        break;
      case "level":
        aValue = a.character?.level || 0;
        bValue = b.character?.level || 0;
        break;
      case "account":
        aValue = a.account?.name?.toLowerCase() || "";
        bValue = b.account?.name?.toLowerCase() || "";
        break;
      case "experience":
        aValue = a.character?.experience || 0;
        bValue = b.character?.experience || 0;
        break;
      case "dead":
        aValue = a.dead ? 1 : 0;
        bValue = b.dead ? 1 : 0;
        break;
      case "delve":
        aValue = a.character?.depth?.default || 0;
        bValue = b.character?.depth?.default || 0;
        break;
      case "challenges":
        aValue = a.account?.challenges?.completed || 0;
        bValue = b.account?.challenges?.completed || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  // Image sources for top 5
  const _top5Images = [
    `${import.meta.env.BASE_URL}diamond-72.png`,
    `${import.meta.env.BASE_URL}golden-72.png`,
    `${import.meta.env.BASE_URL}silver-72.png`,
    `${import.meta.env.BASE_URL}bronze-72.png`,
    `${import.meta.env.BASE_URL}base-72.png`,
  ];

  const [timeUntilStart, setTimeUntilStart] = useState(null);

  useEffect(() => {
    if (!details?.startAt) return;

    const updateCountdown = () => {
      const diff = new Date(details.startAt) - Date.now();
      if (diff > 0) {
        setTimeUntilStart(diff);
      } else {
        setTimeUntilStart(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [details?.startAt]);

  return (
    <>
      <div
        className={`w-full min-h-screen mx-auto px-16 pt-8 pb-16 bg-gradient-to-b ${THEME.bgGradient} ${THEME.textPrimary} font-sans relative`}
      >
        {/* League combobox skeleton */}
        {loading ? (
          <div
            className={`px-3 py-2 rounded ${THEME.accentPrimary} animate-pulse absolute top-4 left-4 z-30 ${THEME.borderPrimary} ${THEME.glowPrimary}`}
            style={{ minWidth: 220, height: 44 }}
          />
        ) : (
          <select
            className={`px-3 py-2 rounded ${THEME.accentPrimary} ${THEME.textPrimary} border-2 ${THEME.borderPrimary} focus:outline-none focus:ring ${THEME.focusBorder} text-base font-sans top-4 left-4 absolute z-30 ${THEME.glowPrimary}`}
            value={selectedLeague}
            onChange={(e) => {
              setSelectedLeague(e.target.value);
              setSearch("");
              setSearchBubbles([]);
            }}
            style={{ minWidth: 220 }}
          >
            {LEAGUE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* League name skeleton */}
        {loading ? (
          <div
            className={`h-8 w-72 ${THEME.skeletonBg} rounded animate-pulse mx-auto mt-2 mb-4 ${THEME.skeletonBorder} ${THEME.skeletonGlow}`}
          />
        ) : (
          <h1
            className={`text-4xl font-extrabold text-center tracking-tight font-sans`}
          >
            {leagueName} Leaderboard
          </h1>
        )}
        {/* League details skeleton */}
        {loading ? (
          <>
            <div
              className={`mx-auto mb-4 h-4 w-2/3 ${THEME.skeletonBg} rounded animate-pulse ${THEME.skeletonBorder} ${THEME.skeletonGlow}`}
            />
            <div
              className={`mx-auto mb-4 h-3 w-1/2 ${THEME.skeletonBg} rounded animate-pulse ${THEME.skeletonBorder} ${THEME.skeletonGlow}`}
            />
          </>
        ) : (
          details &&
          details.name && (
            <>
              <p
                className={`text-center mb-4 ${THEME.textSecondary} font-sans`}
              >
                {details.rules[0]?.name} {details.category.id} -{" "}
                {formatDate(details.startAt)} to {formatDate(details.endAt)} -{" "}
                <a
                  href={`https://www.pathofexile.com/private-leagues/league/${encodeURIComponent(
                    details.id.replace(/\s*\(PL\d+\)$/, "")
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline ${THEME.linkColor} ${THEME.linkColorHover}`}
                >
                  View League
                </a>
              </p>
              <p
                className={`text-center mb-4 ${THEME.textSecondary} font-sans`}
              >
                {details.description}
              </p>
              {timeUntilStart &&
                timeUntilStart > 0 &&
                (() => {
                  const days = Math.floor(timeUntilStart / 1000 / 60 / 60 / 24);
                  const hours = Math.floor(
                    (timeUntilStart / 1000 / 60 / 60) % 24
                  );
                  const minutes = Math.floor((timeUntilStart / 1000 / 60) % 60);
                  const seconds = Math.floor((timeUntilStart / 1000) % 60);

                  return (
                    <p
                      className={`text-center mb-4 ${THEME.textSecondary} font-sans`}
                    >
                      League starts in {days > 0 && `${days}d `}
                      {hours}h {minutes}m {seconds}s
                    </p>
                  );
                })()}
            </>
          )
        )}
        {/* Countdown is now inside the refresh button */}
        <div className="flex items-center gap-4 justify-start mb-6 relative">
          <button
            onClick={handleManualRefresh}
            title="Refresh"
            className={`flex items-center justify-center p-2 rounded ${THEME.accentSecondary} ${THEME.hoverDark} transition-colors ${THEME.borderPrimary} focus:outline-none focus:ring relative ${THEME.glowPrimary}`}
            style={{ minWidth: 40 }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
                transform: `rotate(${refreshSpinAngle}deg)`,
              }}
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M4.06189 13C4.02104 12.6724 4 12.3387 4 12C4 7.58172 7.58172 4 12 4C14.5006 4 16.7332 5.14727 18.2002 6.94416M19.9381 11C19.979 11.3276 20 11.6613 20 12C20 16.4183 16.4183 20 12 20C9.61061 20 7.46589 18.9525 6 17.2916M9 17H6V17.2916M18.2002 4V6.94416M18.2002 6.94416V6.99993L15.2002 7M6 20V17.2916"
                  stroke="#ffffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </svg>
            {/* Countdown in bottom right */}
            <span
              className={`absolute text-[8px] ${THEME.textSecondary} font-mono`}
              style={{ right: 0, bottom: -3, pointerEvents: "none" }}
            >
              {countdown}s
            </span>
          </button>
          {/* Search bar with bubbles inside input */}
          <div className="w-full max-w-md relative">
            <div
              className={`flex flex-wrap items-center gap-1 px-2 py-1 rounded ${THEME.accentPrimary} border-2 ${THEME.borderPrimary} focus-within:ring ${THEME.focusBorder} min-h-[40px] ${THEME.glowSecondary}`}
            >
              {searchBubbles.map((bubble, idx) => (
                <span
                  key={bubble.type + bubble.value}
                  className="flex items-center bg-blue-700 text-white px-2 py-1 rounded-full text-xs font-semibold mr-1"
                  style={{ marginBottom: 2, marginTop: 2 }}
                >
                  {bubble.value}
                  <button
                    className={`ml-1 ${THEME.textPrimary} hover:text-purple-200 focus:outline-none`}
                    onClick={() => {
                      setSearchBubbles(
                        searchBubbles.filter((b, i) => i !== idx)
                      );
                    }}
                    aria-label="Remove"
                    tabIndex={-1}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onKeyDown={(e) => {
                  if (showSuggestions && suggestions.length > 0) {
                    if (e.key === "ArrowDown") {
                      setHighlightedIdx((idx) =>
                        Math.min(idx + 1, suggestions.length - 1)
                      );
                      e.preventDefault();
                    } else if (e.key === "ArrowUp") {
                      setHighlightedIdx((idx) => Math.max(idx - 1, 0));
                      e.preventDefault();
                    } else if (e.key === "Enter" && highlightedIdx >= 0) {
                      const s = suggestions[highlightedIdx];
                      setSearchBubbles([...searchBubbles, s]);
                      setSearch("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                      setHighlightedIdx(-1);
                      e.preventDefault();
                    }
                  } else if (
                    e.key === "Backspace" &&
                    search === "" &&
                    searchBubbles.length > 0
                  ) {
                    setSearchBubbles(searchBubbles.slice(0, -1));
                  }
                }}
                placeholder="Search character, class or account..."
                className={`bg-transparent outline-none border-none flex-1 min-w-[120px] text-base font-sans ${THEME.textPrimary} py-1`}
                style={{ minWidth: 120 }}
              />
            </div>
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                className={`absolute left-0 top-full mt-1 w-full ${THEME.accentPrimary} border-2 ${THEME.borderPrimary} rounded shadow-lg ${THEME.glowPrimary} z-20 max-h-56 overflow-y-auto`}
              >
                {suggestions.map((s, idx) => (
                  <li
                    key={s.type + s.value}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                      highlightedIdx === idx
                        ? "bg-blue-700 text-white"
                        : "hover:bg-gray-700"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchBubbles([...searchBubbles, s]);
                      setSearch("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                      setHighlightedIdx(-1);
                    }}
                    onMouseEnter={() => setHighlightedIdx(idx)}
                  >
                    <span className="font-bold capitalize">{s.value}</span>
                    <span className={`text-xs ${THEME.textTertiary}`}>
                      {s.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label className="flex items-center gap-2 text-base font-sans cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDelve}
              onChange={(e) => setShowDelve(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            Show Delve
          </label>
          <label className="flex items-center gap-2 text-base font-sans cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAlive}
              onChange={(e) => setOnlyAlive(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600"
            />
            Only Alive
          </label>
          {(sortConfig.key !== "rank" || sortConfig.direction !== "asc") && (
            <button
              onClick={() => setSortConfig({ key: "rank", direction: "asc" })}
              className={`px-3 py-1 ${THEME.accentSecondary} ${THEME.hoverDark} rounded text-sm transition-colors ${THEME.borderPrimary} ${THEME.glowSecondary}`}
            >
              Clear Sort
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main ladder table with skeleton rows */}
            <table
              className={`w-6/8 border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowLarge} rounded-lg overflow-hidden`}
            >
              <thead className="sticky top-0 z-10">
                <tr
                  className={`${THEME.accentPrimary} ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary}`}
                >
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Rank
                  </th>
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Character
                  </th>
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Class
                  </th>
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Level
                  </th>
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Account
                  </th>
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Exp
                  </th>
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Exp%
                  </th>
                  <th className="p-2 text-left text-base font-bold font-sans">
                    Diff
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(LIMIT)].map((_, i) => (
                  <tr
                    key={i}
                    className={`${THEME.rowEven} animate-pulse transition-all duration-700 ${THEME.rowBorder}`}
                  >
                    <td className="p-2 relative pl-8">
                      <div
                        className={`h-4 w-8 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`h-4 w-24 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`h-4 w-16 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`h-4 w-8 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`h-4 w-20 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`h-4 w-20 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`h-4 w-20 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`h-4 w-20 ${THEME.skeletonPulse} rounded animate-pulse`}
                        style={{ animationDelay: `${i * 0.02}s` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Top deaths table skeleton */}
            <div className="w-2/8 max-h-[800px] overflow-y-auto sticky top-0 flex flex-col gap-6">
              <table
                className={`w-full border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowSecondary} rounded-lg overflow-hidden`}
              >
                <thead>
                  <tr
                    className={`${THEME.accentPrimary} ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary}`}
                  >
                    <th className="p-2 text-left">Account</th>
                    <th className="p-2 text-left">Deaths</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, i) => (
                    <tr
                      key={i}
                      className={`${THEME.rowEven} animate-pulse ${THEME.rowBorder}`}
                    >
                      <td className="p-2">
                        <div
                          className={`h-4 w-24 ${THEME.skeletonPulse} rounded`}
                        />
                      </td>
                      <td className="p-2">
                        <div
                          className={`h-4 w-8 ${THEME.skeletonPulse} rounded`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Live on Twitch table skeleton */}
              <table
                className={`w-full border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowSecondary} rounded-lg overflow-hidden`}
              >
                <thead>
                  <tr
                    className={`${THEME.accentPrimary} ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary}`}
                  >
                    <th className="p-2 text-left">Live on Twitch</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, i) => (
                    <tr
                      key={i}
                      className={`${THEME.rowEven} animate-pulse ${THEME.rowBorder}`}
                    >
                      <td className="p-2">
                        <div
                          className={`h-4 w-24 ${THEME.skeletonPulse} rounded`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main ladder table */}
            <table
              className={`w-6/8 border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowLarge} rounded-lg overflow-hidden`}
            >
              <thead className="sticky top-0 z-10">
                <tr
                  className={`${THEME.accentPrimary} ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary}`}
                >
                  <th className="p-2 text-left text-base font-bold font-sans">
                    #
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort("rank")}
                  >
                    Rank
                    <SortIndicator column="rank" />
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort("character")}
                  >
                    Character
                    <SortIndicator column="character" />
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort("class")}
                  >
                    Class
                    <SortIndicator column="class" />
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSort("level")}
                  >
                    Level
                    <SortIndicator column="level" />
                  </th>
                  <th
                    className={`p-2 text-left cursor-pointer ${THEME.hoverMedium} transition-colors select-none`}
                    onClick={() => handleSort("account")}
                  >
                    Account
                    <SortIndicator column="account" />
                  </th>
                  <th
                    className={`p-2 text-left cursor-pointer ${THEME.hoverMedium} transition-colors select-none`}
                    onClick={() => handleSort("experience")}
                  >
                    Exp
                    <SortIndicator column="experience" />
                  </th>
                  <th className="p-2 text-left">Exp%</th>
                  <th className="p-2 text-left">Diff</th>
                  {showDelve && (
                    <th
                      className={`p-2 text-left cursor-pointer ${THEME.hoverMedium} transition-colors select-none`}
                      onClick={() => handleSort("delve")}
                    >
                      Delve Depth
                      <SortIndicator column="delve" />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Find top1 experience (first non-dead, highest exp)
                  const top1 = sortedLadder.find((e) => !e.dead);
                  const top1Exp = top1?.character?.experience || 0;
                  // Assign icons based on actual rank (1-5, alive, unique account)
                  // Build a map of account name to their first alive character's rank (from the original ladder, not filtered)
                  const accountFirstAliveRank = {};
                  ladder.forEach((entry) => {
                    if (
                      !entry.dead &&
                      entry.account?.name &&
                      accountFirstAliveRank[entry.account.name] === undefined
                    ) {
                      accountFirstAliveRank[entry.account.name] = entry.rank;
                    }
                  });
                  // Build a sorted list of top 5 unique alive accounts by their first alive character's rank
                  /*const top5AccountsByRank = Object.entries(
                    accountFirstAliveRank
                  )
                    .sort((a, b) => a[1] - b[1])
                    .slice(0, 5)
                    .map(([name]) => name);
                  */

                  return sortedLadder.map((entry, i) => {
                    const isDead = entry.dead;
                    const exp = entry.character?.experience || 0;
                    const lvl = entry.character?.level || 1;
                    // Use cumulative experience table values directly
                    const prevLevelExp = poeExperienceTable[lvl - 1] ?? 0;
                    const nextLevelExp = poeExperienceTable[lvl] ?? undefined;
                    let percentToNext = 100;
                    if (
                      typeof nextLevelExp === "number" &&
                      nextLevelExp > prevLevelExp
                    ) {
                      percentToNext =
                        ((exp - prevLevelExp) / (nextLevelExp - prevLevelExp)) *
                        100;
                      percentToNext = Math.max(0, Math.min(100, percentToNext));
                    } else if (typeof nextLevelExp !== "number") {
                      percentToNext = 100;
                    }
                    const expDiff = i === 0 || isDead ? null : exp - top1Exp;
                    // Only show top5 image if this account is in top5AccountsByRank and this is their first alive character (by rank)
                    let top5Img = null;
                    if (!isDead && entry.account?.name) {
                      /*const accIdx = top5AccountsByRank.indexOf(
                        entry.account.name
                      );
                      if (
                        accIdx > -1 &&
                        entry.rank === accountFirstAliveRank[entry.account.name]
                      ) {
                        top5Img = top5Images[accIdx];
                      }*/
                    }

                    return (
                      <tr
                        key={entry.rank}
                        className={`relative transition-all duration-700 transform *:py-2 *:mx-0 ${
                          isDead ? `${THEME.rowDead}` : `${THEME.rowAlive}`
                        } animate-fadein`}
                        style={{ animationDelay: `${i * 0.01}s` }}
                      >
                        <td className="text-sm font-mono font-semibold text-center">
                          {aliveRankMap[entry.rank]
                            ? aliveRankMap[entry.rank]
                            : "-"}
                        </td>
                        <td className="relative pl-8 text-sm font-medium font-sans">
                          {entry.rank}
                        </td>
                        <td className="text-sm font-medium font-sans flex items-center gap-2">
                          {top5Img && (
                            <img
                              src={top5Img}
                              alt={`Top${i + 1}`}
                              className="inline-block w-7 h-7 object-contain mr-1"
                            />
                          )}
                          {entry.character?.name}
                        </td>
                        <td className="text-sm font-medium font-sans">
                          {entry.character?.class}
                        </td>
                        <td className="text-sm font-medium font-sans">
                          {entry.character?.level}
                        </td>
                        <td className="text-sm font-medium font-sans">
                          {entry.account?.twitch?.stream ? (
                            <a
                              href={`https://twitch.tv/${entry.account?.twitch.stream.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-2 py-1 rounded bg-[#9147ff] text-white font-bold hover:bg-[#772ce8] transition-colors duration-200 shadow-sm"
                              title="Live on Twitch!"
                            >
                              <span className="mr-1 align-middle">🔴</span>
                              {entry.account?.name}
                            </a>
                          ) : (
                            entry.account?.name
                          )}
                          {typeof entry.account?.challenges?.completed ===
                            "number" && (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 mx-2 rounded-full bg-gray-700 text-xs font-bold text-blue-300 border-2 border-blue-500"
                              title="Challenges Completed"
                            >
                              {entry.account.challenges.completed}
                            </span>
                          )}
                        </td>
                        <td className="text-sm font-mono font-semibold">
                          {entry.character?.experience}
                        </td>
                        <td className="text-sm font-medium font-sans">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold font-mono tracking-tight">
                              {percentToNext.toFixed(2)}%
                            </span>
                            <div className="w-32 h-2 bg-gray-800 rounded overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${percentToNext}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="text-sm font-mono font-semibold">
                          {i === 0 || isDead
                            ? "0"
                            : expDiff < 0
                            ? expDiff
                            : `+${expDiff}`}
                        </td>
                        {showDelve && (
                          <td className="text-sm font-mono font-semibold">
                            {entry.character?.depth
                              ? `Depth: ${
                                  entry.character.depth.default ?? 0
                                } / Solo: ${entry.character.depth.solo ?? 0}`
                              : "-"}
                          </td>
                        )}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>

            {/* Top deaths table */}
            <div className="w-2/8 max-h-dvh overflow-y-auto sticky top-0 flex flex-col gap-6">
              {leagueName == "disabled" ? <RecentDeathsDisplay /> : ""}
              {leagueName == "disabled" ? (
                <table
                  className={`w-full border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowLarge} rounded-lg overflow-hidden`}
                >
                  <thead>
                    <tr
                      className={`${THEME.accentPrimary} ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary}`}
                    >
                      <th className="p-2 text-left">Account</th>
                      <th className="p-2 text-left">Deaths</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDeaths.map(([account, deaths], i) => (
                      <tr
                        key={i}
                        className={`${
                          i % 2 === 0 ? THEME.rowEven : THEME.rowOdd
                        } ${THEME.rowBorder}`}
                      >
                        <td className={`p-2 ${THEME.textPrimary}`}>
                          {account}
                        </td>
                        <td className={`p-2 ${THEME.textPrimary}`}>{deaths}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                ""
              )}

              {/* Live on Twitch table */}
              <table
                className={`w-full border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowLarge} rounded-lg overflow-hidden`}
              >
                <thead>
                  <tr
                    className={`${THEME.accentPrimary} ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary}`}
                  >
                    <th className="p-2 text-left">Live on Twitch</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Build a map to ensure unique accounts
                    const uniqueAccounts = new Map();
                    ladder.forEach((e) => {
                      if (
                        e.account?.twitch?.stream &&
                        e.account?.name &&
                        !uniqueAccounts.has(e.account.name)
                      ) {
                        uniqueAccounts.set(e.account.name, e);
                      }
                    });
                    const uniqueLive = Array.from(uniqueAccounts.values());
                    return uniqueLive.length > 0 ? (
                      uniqueLive.map((entry, i) => (
                        <tr
                          key={entry.account.name + "-" + i}
                          className={
                            i % 2 === 0
                              ? `${THEME.rowEven} ${THEME.rowBorder}`
                              : `${THEME.rowOdd} ${THEME.rowBorder}`
                          }
                        >
                          <td className={`p-2 ${THEME.textPrimary}`}>
                            <a
                              href={`https://twitch.tv/${entry.account.twitch.stream.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded ${THEME.twitch} text-white font-bold ${THEME.twitchHover} transition-colors duration-200 shadow-sm`}
                              title="Live on Twitch!"
                            >
                              <span className="mr-1 align-middle">🔴</span>
                              {entry.account.name}
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className={`p-2 text-center ${THEME.textTertiary}`}
                        >
                          No one is live on Twitch
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Fixed footer */}
      <footer
        className={`fixed bottom-0 left-0 w-full bg-gradient-to-r ${THEME.bgGradient} ${THEME.textSecondary} text-center py-3 text-sm border-t-2 ${THEME.borderPrimary} z-50 ${THEME.glowLarge}`}
        style={{ pointerEvents: "auto" }}
      >
        FezLeaderboard &copy; 2025 &mdash; Created by Fezalion |{" "}
        <a
          href="https://github.com/sponsors/Fezalion"
          target="_blank"
          className="bg-gradient-to-r items-center from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent text-center select-auto animate-pulse"
        >
          Sponsor me ❤️
        </a>{" "}
        | Append ?league=LEAGUE_NAME to the URL to share a specific league view.
      </footer>
    </>
  );
}

export default App;
