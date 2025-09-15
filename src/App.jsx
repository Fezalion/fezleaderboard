import { useEffect, useState } from "react";
import { poeExperienceTable } from "./poeExperienceTable";
import axios from "axios";

const LEAGUE_NAME = "xXxBaboonLeaguexXx (PL74225)";
const LIMIT = 200;
const API_URL = `https://poe-proxy-five.vercel.app/api/ladder?league=${LEAGUE_NAME}&limit=${LIMIT}`;
const REFRESH_INTERVAL = 300; // seconds

function App() {
  const [ladder, setLadder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [search, setSearch] = useState("");

  // Fetch ladder function
  const fetchLadder = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      const newLadder = res.data.entries || [];
      setLadder(newLadder);
    } catch (err) {
      console.error("Error fetching ladder:", err);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  };

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

  // Compute top 5 accounts with most deaths
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
      .slice(0, 5); // top 5
  })();

  // Filtered ladder based on search
  const filteredLadder = search.trim()
    ? ladder.filter(
        (entry) =>
          entry.character?.name?.toLowerCase().includes(search.toLowerCase()) ||
          entry.account?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : ladder;

  return (
    <div className="w-full mx-auto px-16 pt-8 pb-4 bg-gray-900 text-gray-100 font-sans">
      <h1 className="text-4xl font-extrabold mb-2 text-center tracking-tight font-sans">
        {LEAGUE_NAME} Leaderboard
      </h1>
      <p className="text-center mb-6 text-lg text-gray-400 font-medium font-sans">
        Auto-refresh in {countdown}s
      </p>
      <div className="flex justify-start mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search character or account..."
          className="px-4 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring focus:border-blue-400 w-full max-w-md text-base font-sans"
        />
      </div>

      {loading ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main ladder table with skeleton rows */}
          <table className="w-7/8 border-collapse text-gray-100">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-800 text-gray-100">
                <th className="p-2 text-left text-base font-bold font-sans">
                  Rank
                </th>
                <th className="p-2 text-left text-base font-bold font-sans">
                  Real Rank
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
          <div className="w-1/8 max-h-[400px] overflow-y-auto sticky top-0">
            <table className="w-full border-collapse text-gray-100">
              <thead>
                <tr className="bg-gray-800 text-gray-100">
                  <th className="p-2 text-left">Account</th>
                  <th className="p-2 text-left">Deaths</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
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
          <table className="w-7/8 border-collapse text-gray-100">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-800 text-gray-100">
                <th className="p-2 text-left">Rank</th>
                <th className="p-2 text-left">RR</th>
                <th className="p-2 text-left">Character</th>
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Account</th>
                <th className="p-2 text-left">Exp</th>
                <th className="p-2 text-left">Exp%</th>
                <th className="p-2 text-left">Diff</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let liveRank = 0;
                // Find top1 experience (first non-dead, highest exp)
                const top1 = filteredLadder.find((e) => !e.dead);
                const top1Exp = top1?.character?.experience || 0;
                return filteredLadder.map((entry, i) => {
                  const isDead = entry.dead;
                  if (!isDead) liveRank++;
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
                      className={`relative transition-all duration-700 transform ${
                        isDead
                          ? "bg-red-700 text-red-300 line-through"
                          : "bg-gray-700"
                      } animate-fadein`}
                      style={{ animationDelay: `${i * 0.01}s` }}
                    >
                      <td className="p-2 relative pl-8 text-sm font-medium font-sans">
                        {isDead && (
                          <img
                            src={`${import.meta.env.BASE_URL}4x.avif`}
                            alt="Dead"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 object-contain"
                          />
                        )}
                        {entry.rank}
                      </td>
                      <td className="p-2 text-sm font-medium font-sans">
                        {isDead ? "-" : liveRank}
                      </td>
                      <td className="p-2 text-sm font-medium font-sans">
                        {entry.character?.name}
                      </td>
                      <td className="p-2 text-sm font-medium font-sans">
                        {entry.character?.class}
                      </td>
                      <td className="p-2 text-sm font-medium font-sans">
                        {entry.character?.level}
                      </td>
                      <td className="p-2 text-sm font-medium font-sans">
                        {entry.account?.name}
                      </td>
                      <td className="p-2 text-sm font-mono font-semibold">
                        {entry.character?.experience}
                      </td>
                      <td className="p-2 text-sm font-medium font-sans">
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
                      <td className="p-2 text-sm font-mono font-semibold">
                        {i === 0 || isDead
                          ? "0"
                          : expDiff < 0
                          ? expDiff
                          : `+${expDiff}`}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          {/* Top deaths table */}
          <div className="w-1/8 max-h-[400px] overflow-y-auto sticky top-0">
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
