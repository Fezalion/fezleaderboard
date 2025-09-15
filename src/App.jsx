import { useEffect, useState } from "react";
import { poeExperienceTable } from "./poeExperienceTable";

const LEAGUE_NAME = "xXxBaboonLeaguexXx (PL74225)";
const LIMIT = 200;
const API_URL = `https://poe-proxy-6mvi.vercel.app/api/ladder?league=${LEAGUE_NAME}&limit=${LIMIT}`;
const API2_URL = `https://poe-proxy-6mvi.vercel.app/api/league?league=${LEAGUE_NAME}`;
const REFRESH_INTERVAL = 300; // seconds

function App() {
  const [ladder, setLadder] = useState([]);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [search, setSearch] = useState("");
  const [showDelve, setShowDelve] = useState(false);
  const [onlyAlive, setOnlyAlive] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });

  // Fetch ladder function
  const fetchLadder = async () => {
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
  };

  const fetchLeague = async () => {
    try {
      const res = await fetch(API2_URL);
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      console.error("Error fetching league data:", err);
    }
  };

  useEffect(() => {
    fetchLeague();
  }, []);

  useEffect(() => {
    fetchLadder();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLadder();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Filtered ladder based on search and onlyAlive
  let filteredLadder = ladder;
  if (search.trim()) {
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

  return (
    <div className="w-full mx-auto px-16 pt-8 pb-4 bg-gray-900 text-gray-100 font-sans">
      <h1 className="text-4xl font-extrabold mb-2 text-center tracking-tight font-sans">
        {LEAGUE_NAME} Leaderboard
      </h1>
      {details && details.name && (
        // Then use it like:
        <p className="text-center mb-4 text-gray-400 font-sans">
          {details.rules[0].name} {details.category.id} -{" "}
          {formatDate(details.startAt)} to {formatDate(details.endAt)}
        </p>
      )}
      <p className="text-center mb-6 text-lg text-gray-400 font-medium font-sans">
        Auto-refresh in {countdown}s
      </p>
      <div className="flex items-center gap-4 justify-start mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search character, class or account..."
          className="px-4 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring focus:border-blue-400 w-full max-w-md text-base font-sans"
        />
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
          <div className="w-2/8 max-h-[400px] overflow-y-auto sticky top-0">
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
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main ladder table */}
          <table className="w-6/8 border-collapse text-gray-100">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-800 text-gray-100">
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
                      <td className="relative pl-8 text-sm font-medium font-sans">
                        {isDead && (
                          <img
                            src={`${import.meta.env.BASE_URL}4x.avif`}
                            alt="Dead"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 object-contain"
                          />
                        )}
                        {entry.rank}
                      </td>
                      <td className="text-sm font-medium font-sans">
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
          <div className="w-2/8 max-h-[400px] overflow-y-auto sticky top-0">
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
