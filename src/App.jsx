import { useEffect, useState, useCallback, useRef } from "react";
import { poeExperienceTable } from "./poeExperienceTable";
import RecentDeathsDisplay from "./RecentDeaths";

// ============================================================
// THEME CONFIGURATION - Customize all colors and styles here
// ============================================================
const THEME = {
  // Primary colors
  bgGradient: "from-[#0a0a0f] to-[#0a0a0f]",
  textPrimary: "text-[#c8b99a]",
  textSecondary: "text-[#a09080]",
  textTertiary: "text-[#6a5a4a]",
  textDark: "text-[#5a4a3a]",

  // Accent colors
  accentPrimary: "bg-[#0d0d14]",
  accentSecondary: "bg-[#111118]",
  accentTertiary: "bg-[#0a0a0f]",
  accentLight: "bg-[#14141e]",

  // Border colors
  borderPrimary: "border-[#c8853a]/30",
  borderSecondary: "border-[#c8853a]/15",
  borderDead: "border-red-900/50",

  // Glow/Shadow effects
  glowPrimary: "shadow-lg shadow-black/70",
  glowSecondary: "shadow-md shadow-black/60",
  glowLarge: "shadow-xl shadow-black/80",

  // Interactive states
  hoverDark: "hover:bg-[#c8853a]/10",
  hoverMedium: "hover:bg-[#c8853a]/07",
  focusBorder: "focus:border-[#c8853a]/70",

  // Special colors
  linkColor: "text-[#e8c97a]",
  linkColorHover: "hover:text-[#c8853a]",
  deadColor: "bg-red-950/60",
  deadText: "text-red-400",
  twitch: "bg-purple-700",
  twitchHover: "hover:bg-purple-600",

  // Row colors for tables
  rowEven: "bg-[#0d0d14]",
  rowOdd: "bg-[#0d0d14]",
  rowHover: "hover:bg-[#c8853a]/07",
  rowBorder: "border-b border-[#c8853a]/30",
  rowDead: "bg-red-950/40 text-red-400 line-through border-b border-red-900/40",
  rowAlive: "bg-[#0d0d14] border-b border-[#c8853a]/30 hover:bg-[#c8853a]/07",

  // Skeleton colors
  skeletonBg: "bg-[#14141e]",
  skeletonPulse: "bg-[#1e1e2a]",
  skeletonBorder: "border border-[#c8853a]/15",
  skeletonGlow: "shadow-md shadow-black/60",
};

// List of leagues to show in the combobox
const LEAGUE_OPTIONS = [
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
function getLeagueName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("league") || LEAGUE_OPTIONS[0].value;
}

const LIMIT = 200;
const REFRESH_INTERVAL = 300; // seconds

const getApiUrls = (leagueName) => ({
  API_URL: `https://poe-proxy-nine.vercel.app/api/ladder?league=${encodeURIComponent(
    leagueName,
  )}&limit=${LIMIT}`,
  API2_URL: `https://poe-proxy-nine.vercel.app/api/league?league=${encodeURIComponent(
    leagueName,
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
  const [hideQuitters, setHideQuitters] = useState(false);
  const [onlyTopRanked, setOnlyTopRanked] = useState(false);
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
        (n) => n.toLowerCase().includes(lower) && !bubbled.has(n.toLowerCase()),
      )
      .map((n) => ({ type: "character", value: n }));
    const accSugs = Array.from(accs)
      .filter(
        (n) => n.toLowerCase().includes(lower) && !bubbled.has(n.toLowerCase()),
      )
      .map((n) => ({ type: "account", value: n }));
    const classSugs = Array.from(classes)
      .filter(
        (n) => n.toLowerCase().includes(lower) && !bubbled.has(n.toLowerCase()),
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
      var newLadder = data.entries || [];
      newLadder = newLadder.map((x) => {
        if (x.account.name.includes("slinky")) {
          x.account.name = x.account.name.replace("slinky", "stinky");
        }
        return x;
      });
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
      return <span className="text-[#c8853a]/40 ml-1">↕</span>;
    }
    return (
      <span className="text-[#e8c97a] ml-1">
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
        entry.character?.class?.toLowerCase().includes(search.toLowerCase()),
    );
  }
  if (onlyAlive) {
    filteredLadder = filteredLadder.filter((entry) => !entry.dead);
  }
  if (onlyTopRanked) {
    filteredLadder = filteredLadder.filter((entry) => aliveRankMap[entry.rank]);
  }
  if (hideQuitters) {
    filteredLadder = filteredLadder.filter((entry) => !entry.retired);
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

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [countdownType, setCountdownType] = useState(null); // 'start' or 'end'
  const [changedUnits, setChangedUnits] = useState({});
  const prevTimeRef = useRef(null);

  useEffect(() => {
    if (!details?.startAt || !details?.endAt) return;

    const updateCountdown = () => {
      const now = Date.now();
      const startTime = new Date(details.startAt).getTime();
      const endTime = new Date(details.endAt).getTime();

      let diff;
      let type;

      if (now < startTime) {
        // League hasn't started yet
        diff = startTime - now;
        type = "start";
      } else if (now < endTime) {
        // League is running
        diff = endTime - now;
        type = "end";
      } else {
        // League has ended
        setTimeRemaining(null);
        setCountdownType(null);
        return;
      }

      if (diff > 0) {
        const days = Math.floor(diff / 1000 / 60 / 60 / 24);
        const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        const currentTime = { days, hours, minutes, seconds };

        if (prevTimeRef.current) {
          const changed = {};
          if (prevTimeRef.current.days !== days) changed.days = true;
          if (prevTimeRef.current.hours !== hours) changed.hours = true;
          if (prevTimeRef.current.minutes !== minutes) changed.minutes = true;
          if (prevTimeRef.current.seconds !== seconds) changed.seconds = true;

          if (Object.keys(changed).length > 0) {
            setChangedUnits(changed);
            setTimeout(() => setChangedUnits({}), 300);
          }
        }

        prevTimeRef.current = currentTime;
        setTimeRemaining(diff);
        setCountdownType(type);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [details?.startAt, details?.endAt, leagueName]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Fira+Code:wght@300;400;500&display=swap');
        .doom-title {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          background: linear-gradient(135deg, #e8c97a 0%, #c8853a 50%, #e8c97a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.08em;
        }
        .doom-divider {
          width: 200px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c8853a, transparent);
          margin: 0.5rem auto 1rem;
        }
        .doom-th {
          font-family: 'Cinzel', serif;
          letter-spacing: 0.08em;
          color: #c8853a !important;
          text-transform: uppercase;
          font-size: 0.7rem !important;
        }
        body { background: #0a0a0f; }
      `}</style>
      <div
        className={`w-full min-h-screen mx-auto px-16 pt-8 pb-16 ${THEME.textPrimary} font-sans relative`}
        style={{
          background:
            "radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)",
        }}
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
              setDetails();
              setLadder([]);
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
          <>
            <h1 className="doom-title text-4xl text-center">
              {leagueName} Leaderboard
            </h1>
            <div className="doom-divider" />
          </>
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
                    details.id.replace(/\s*\(PL\d+\)$/, ""),
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
              {timeRemaining &&
                timeRemaining > 0 &&
                (() => {
                  const days = Math.floor(timeRemaining / 1000 / 60 / 60 / 24);
                  const hours = Math.floor(
                    (timeRemaining / 1000 / 60 / 60) % 24,
                  );
                  const minutes = Math.floor((timeRemaining / 1000 / 60) % 60);
                  const seconds = Math.floor((timeRemaining / 1000) % 60);

                  return (
                    <p
                      className={`text-center mb-4 ${THEME.textSecondary} font-sans`}
                    >
                      {countdownType === "start"
                        ? "League starts in"
                        : "League ends in"}{" "}
                      {days > 0 && (
                        <>
                          <span
                            className={`inline-block transition-all duration-300 ${
                              changedUnits.days
                                ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)]"
                                : ""
                            }`}
                          >
                            {days}d
                          </span>{" "}
                        </>
                      )}
                      <span
                        className={`inline-block transition-all duration-300 ${
                          changedUnits.hours
                            ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)]"
                            : ""
                        }`}
                      >
                        {hours}h
                      </span>{" "}
                      <span
                        className={`inline-block transition-all duration-300 ${
                          changedUnits.minutes
                            ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)]"
                            : ""
                        }`}
                      >
                        {minutes}m
                      </span>{" "}
                      <span
                        className={`inline-block transition-all duration-300 ${
                          changedUnits.seconds
                            ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)]"
                            : ""
                        }`}
                      >
                        {seconds}s
                      </span>
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
                  className="flex items-center bg-[#c8853a]/80 text-[#0a0a0f] px-2 py-1 rounded-full text-xs font-semibold mr-1"
                  style={{ marginBottom: 2, marginTop: 2 }}
                >
                  {bubble.value}
                  <button
                    className={`ml-1 ${THEME.textPrimary} hover:text-purple-200 focus:outline-none`}
                    onClick={() => {
                      setSearchBubbles(
                        searchBubbles.filter((b, i) => i !== idx),
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
                        Math.min(idx + 1, suggestions.length - 1),
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
                        ? "bg-[#c8853a]/30 text-[#e8c97a]"
                        : "hover:bg-[#c8853a]/10"
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
            Hide Dead
          </label>
          <label className="flex items-center gap-2 text-base font-sans cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideQuitters}
              onChange={(e) => setHideQuitters(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600"
            />
            Hide Retired
          </label>
          <label className="flex items-center gap-2 text-base font-sans cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyTopRanked}
              onChange={(e) => setOnlyTopRanked(e.target.checked)}
              className="form-checkbox h-4 w-4 text-amber-600"
            />
            Filter Top per Acc.
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
                className={`w-full border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowSecondary} rounded-lg overflow-hidden sticky`}
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
                  <th className="p-2 text-left doom-th">#</th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-[#c8853a]/10 transition-colors select-none doom-th"
                    onClick={() => handleSort("rank")}
                  >
                    Rank
                    <SortIndicator column="rank" />
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-[#c8853a]/10 transition-colors select-none doom-th"
                    onClick={() => handleSort("character")}
                  >
                    Character
                    <SortIndicator column="character" />
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-[#c8853a]/10 transition-colors select-none doom-th"
                    onClick={() => handleSort("class")}
                  >
                    Class
                    <SortIndicator column="class" />
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-[#c8853a]/10 transition-colors select-none doom-th"
                    onClick={() => handleSort("level")}
                  >
                    Level
                    <SortIndicator column="level" />
                  </th>
                  <th
                    className={`p-2 text-left cursor-pointer hover:bg-[#c8853a]/10 transition-colors select-none doom-th`}
                    onClick={() => handleSort("account")}
                  >
                    Account
                    <SortIndicator column="account" />
                  </th>
                  <th
                    className={`p-2 text-left cursor-pointer hover:bg-[#c8853a]/10 transition-colors select-none doom-th`}
                    onClick={() => handleSort("experience")}
                  >
                    Exp
                    <SortIndicator column="experience" />
                  </th>
                  <th className="p-2 text-left doom-th">Exp%</th>
                  <th className="p-2 text-left doom-th">Diff</th>
                  {showDelve && (
                    <th
                      className={`p-2 text-left cursor-pointer hover:bg-[#c8853a]/10 transition-colors select-none doom-th`}
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

                    return (
                      <tr
                        key={entry.rank}
                        className={`relative transition-all duration-700 transform *:py-2 *:mx-0 ${
                          isDead ? `${THEME.rowDead}` : `${THEME.rowAlive}`
                        } animate-fadein ${
                          entry.retired
                            ? `bg-[repeating-linear-gradient(45deg,#ef444420,#ef444420_10px,#ffffff20_10px,#ffffff20_20px)]`
                            : ``
                        }`}
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
                        <td className="text-sm font-medium font-sans">
                          <a
                            href={`https://www.pathofexile.com/account/view-profile/${encodeURI(
                              entry.account?.name,
                            ).replace(
                              "#",
                              "-",
                            )}/characters?characterName=${encodeURI(
                              entry.character?.name,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {entry.character?.name}
                          </a>
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
                            <a
                              href={`https://www.pathofexile.com/account/view-profile/${encodeURI(
                                entry.account?.name.replace("stinky", "slinky"),
                              ).replace("#", "-")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {entry.account?.name}
                            </a>
                          )}
                          {typeof entry.account?.challenges?.completed ===
                            "number" && (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 mx-2 rounded-full bg-[#1a1408] text-xs font-bold text-[#e8c97a] border-2 border-[#c8853a]/60"
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
                            <div className="w-32 h-2 bg-[#1e1e2a] rounded overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#c8853a] to-[#e8c97a] transition-all duration-500"
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
        className={`fixed bottom-0 left-0 w-full ${THEME.textTertiary} text-center py-3 text-sm border-t border-[#c8853a]/20 z-50`}
        style={{ background: "rgba(10,10,15,0.95)", pointerEvents: "auto" }}
      >
        FezLeaderboard &copy; 2025 - 2026 &mdash; Created by Fezalion |{" "}
        <a
          href="https://github.com/sponsors/Fezalion"
          target="_blank"
          className="bg-gradient-to-r items-center from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent text-center select-auto animate-pulse"
        >
          Sponsor me ❤️
        </a>{" "}
        | Append ?league=LEAGUE_NAME to the URL to share a specific league view.{" "}
        |
        <a
          rel="stylesheet"
          href="/fezleaderboard/idc"
          className="bg-gradient-to-r items-center from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent text-center select-auto animate-pulse"
        >
          {" "}
          Impending Doom Calc{" "}
        </a>{" "}
        |
      </footer>
    </>
  );
}

export default App;
