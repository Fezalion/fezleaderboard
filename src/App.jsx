import { useEffect, useState, useCallback, useRef } from "react";
import { poeExperienceTable } from "./poeExperienceTable";

// Get league name from query param if present
function getLeagueName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("league") || "xXxBaboonLeaguexXx (PL74225)";
}

const LIMIT = 200;
const REFRESH_INTERVAL = 300; // seconds

const getApiUrls = (leagueName) => ({
  API_URL: `https://poe-proxy-6mvi.vercel.app/api/ladder?league=${encodeURIComponent(
    leagueName
  )}&limit=${LIMIT}`,
  API2_URL: `https://poe-proxy-6mvi.vercel.app/api/league?league=${encodeURIComponent(
    leagueName
  )}`,
});

function App() {
  const [ladder, setLadder] = useState([]);
  const [refreshSpinAngle, setRefreshSpinAngle] = useState(0);
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
  const leagueName = getLeagueName();
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

  // Easter egg state
  const [deadImageClicks, setDeadImageClicks] = useState({});
  const [isEasterEggActive, setIsEasterEggActive] = useState(false);

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

  // Easter egg handler
  const handleDeadImageClick = (rank) => {
    setDeadImageClicks((prev) => {
      const newClicks = { ...prev };
      newClicks[rank] = (newClicks[rank] || 0) + 1;

      if (newClicks[rank] === 3) {
        // Trigger easter egg
        setIsEasterEggActive(true);

        // Play cat.mp3
        const audio = new Audio(`${import.meta.env.BASE_URL || ""}cat.mp3`);
        audio.play().catch((err) => console.log("Audio play failed:", err));

        // Reset after animation
        setTimeout(() => {
          setIsEasterEggActive(false);
          newClicks[rank] = 0;
        }, 3000);
      }

      return newClicks;
    });
  };

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
      return <span className="text-gray-500 ml-1">↕️</span>;
    }
    return (
      <span className="text-blue-400 ml-1">
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
      .slice(0, 10); // top 10
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
  const top5Images = [
    `${import.meta.env.BASE_URL}diamond-72.png`,
    `${import.meta.env.BASE_URL}golden-72.png`,
    `${import.meta.env.BASE_URL}silver-72.png`,
    `${import.meta.env.BASE_URL}bronze-72.png`,
    `${import.meta.env.BASE_URL}base-72.png`,
  ];

  return (
    <div className="w-full mx-auto px-16 pt-8 pb-4 bg-gray-900 text-gray-100 font-sans relative">
      {/* Easter Egg Overlay */}
      {isEasterEggActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <img
            src={`${import.meta.env.BASE_URL}4x.avif`}
            className="w-96 h-96 object-contain"
          />
        </div>
      )}
      <h1 className="text-4xl font-extrabold mb-2 text-center tracking-tight font-sans">
        {leagueName} Leaderboard
      </h1>
      {details && details.name && (
        <>
          <p className="text-center mb-4 text-gray-400 font-sans">
            {details.rules[0].name} {details.category.id} -{" "}
            {formatDate(details.startAt)} to {formatDate(details.endAt)} -{" "}
            <a
              href={`https://www.pathofexile.com/private-leagues/league/${encodeURIComponent(
                details.id.replace(/\s*\(PL\d+\)$/, "")
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-400 hover:text-blue-200"
            >
              View League
            </a>
          </p>
          <p className="text-center mb-4 text-gray-400 font-sans">
            {details.description}
          </p>
        </>
      )}
      <p className="text-center mb-6 text-lg text-gray-400 font-medium font-sans">
        Auto-refresh in {countdown}s
      </p>
      <div className="flex items-center gap-4 justify-start mb-6 relative">
        <button
          onClick={handleManualRefresh}
          title="Refresh"
          className="flex items-center justify-center p-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600 focus:outline-none focus:ring"
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
        </button>
        {/* Search bar with bubbles inside input */}
        <div className="w-full max-w-md relative">
          <div className="flex flex-wrap items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 focus-within:ring focus-within:border-blue-400 min-h-[40px]">
            {searchBubbles.map((bubble, idx) => (
              <span
                key={bubble.type + bubble.value}
                className="flex items-center bg-blue-700 text-white px-2 py-1 rounded-full text-xs font-semibold mr-1"
                style={{ marginBottom: 2, marginTop: 2 }}
              >
                {bubble.value}
                <button
                  className="ml-1 text-white hover:text-gray-200 focus:outline-none"
                  onClick={() => {
                    setSearchBubbles(searchBubbles.filter((b, i) => i !== idx));
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
              className="bg-transparent outline-none border-none flex-1 min-w-[120px] text-base font-sans text-gray-100 py-1"
              style={{ minWidth: 120 }}
            />
          </div>
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow-lg z-20 max-h-56 overflow-y-auto">
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
                  <span className="text-xs text-gray-400">{s.type}</span>
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
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            Clear Sort
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main ladder table with skeleton rows */}
          <table className="w-6/8 border-collapse text-gray-100">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-800 text-gray-100">
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
                  className="bg-gray-700 animate-pulse transition-all duration-700"
                >
                  <td className="p-2 relative pl-8">
                    <div
                      className="h-4 w-8 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                  <td className="p-2">
                    <div
                      className="h-4 w-24 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                  <td className="p-2">
                    <div
                      className="h-4 w-16 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                  <td className="p-2">
                    <div
                      className="h-4 w-8 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                  <td className="p-2">
                    <div
                      className="h-4 w-20 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                  <td className="p-2">
                    <div
                      className="h-4 w-20 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                  <td className="p-2">
                    <div
                      className="h-4 w-20 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                  <td className="p-2">
                    <div
                      className="h-4 w-20 bg-gray-600 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Top deaths table skeleton */}
          <div className="w-2/8 max-h-[800px] overflow-y-auto sticky top-0 flex flex-col gap-6">
            <table className="w-full border-collapse text-gray-100">
              <thead>
                <tr className="bg-gray-800 text-gray-100">
                  <th className="p-2 text-left">Account</th>
                  <th className="p-2 text-left">Deaths</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="bg-gray-700 animate-pulse">
                    <td className="p-2">
                      <div className="h-4 w-24 bg-gray-600 rounded" />
                    </td>
                    <td className="p-2">
                      <div className="h-4 w-8 bg-gray-600 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Live on Twitch table skeleton */}
            <table className="w-full border-collapse text-gray-100">
              <thead>
                <tr className="bg-gray-800 text-gray-100">
                  <th className="p-2 text-left">Live on Twitch</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="bg-gray-700 animate-pulse">
                    <td className="p-2">
                      <div className="h-4 w-24 bg-gray-600 rounded" />
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
          <table className="w-6/8 border-collapse text-gray-100">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-800 text-gray-100">
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
                  className="p-2 text-left cursor-pointer hover:bg-gray-700 transition-colors select-none"
                  onClick={() => handleSort("account")}
                >
                  Account
                  <SortIndicator column="account" />
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-gray-700 transition-colors select-none"
                  onClick={() => handleSort("experience")}
                >
                  Exp
                  <SortIndicator column="experience" />
                </th>
                <th className="p-2 text-left">Exp%</th>
                <th className="p-2 text-left">Diff</th>
                {showDelve && (
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 transition-colors select-none"
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
                const top5AccountsByRank = Object.entries(accountFirstAliveRank)
                  .sort((a, b) => a[1] - b[1])
                  .slice(0, 5)
                  .map(([name]) => name);

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
                    const accIdx = top5AccountsByRank.indexOf(
                      entry.account.name
                    );
                    if (
                      accIdx > -1 &&
                      entry.rank === accountFirstAliveRank[entry.account.name]
                    ) {
                      top5Img = top5Images[accIdx];
                    }
                  }

                  const clickCount = deadImageClicks[entry.rank] || 0;

                  return (
                    <tr
                      key={entry.rank}
                      className={`relative transition-all duration-700 transform *:py-2 *:mx-0 ${
                        isDead
                          ? "bg-red-700 text-red-300 line-through"
                          : "bg-gray-700"
                      } animate-fadein`}
                      style={{ animationDelay: `${i * 0.01}s` }}
                    >
                      <td className="text-sm font-mono font-semibold text-center">
                        {aliveRankMap[entry.rank]
                          ? aliveRankMap[entry.rank]
                          : "-"}
                      </td>
                      <td className="relative pl-8 text-sm font-medium font-sans">
                        {isDead && (
                          <img
                            src={`${import.meta.env.BASE_URL}4x.avif`}
                            alt="Dead"
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 object-contain dead-image-clickable ${
                              clickCount > 0 && clickCount < 3
                                ? "dead-image-clicked"
                                : ""
                            }`}
                            onClick={() => handleDeadImageClick(entry.rank)}
                          />
                        )}
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
          <div className="w-2/8 max-h-[800px] overflow-y-auto sticky top-0 flex flex-col gap-6">
            <table className="w-full border-collapse text-gray-100">
              <thead>
                <tr className="bg-gray-800 text-gray-100">
                  <th className="p-2 text-left">Account</th>
                  <th className="p-2 text-left">Deaths</th>
                </tr>
              </thead>
              <tbody>
                {topDeaths.map(([account, deaths], i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-gray-700" : "bg-gray-800"}`}
                  >
                    <td className="p-2">{account}</td>
                    <td className="p-2">{deaths}</td>
                  </tr>
                ))}
                {topDeaths.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-2 text-center text-gray-400">
                      No deaths yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Live on Twitch table */}
            <table className="w-full border-collapse text-gray-100">
              <thead>
                <tr className="bg-gray-800 text-gray-100">
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
                        className={i % 2 === 0 ? "bg-gray-700" : "bg-gray-800"}
                      >
                        <td className="p-2">
                          <a
                            href={`https://twitch.tv/${entry.account.twitch.stream.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#9147ff] text-white font-bold hover:bg-[#772ce8] transition-colors duration-200 shadow-sm"
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
                      <td colSpan={2} className="p-2 text-center text-gray-400">
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
  );
}

export default App;
