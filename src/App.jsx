import { useEffect, useState } from "react";
import axios from "axios";

const LEAGUE_NAME = "xXxBaboonLeaguexXx (PL74225)";
const LIMIT = 200;
const API_URL = `https://poe-proxy-five.vercel.app/api/ladder?league=${LEAGUE_NAME}&limit=${LIMIT}`;
const REFRESH_INTERVAL = 300; // seconds

function App() {
  const [ladder, setLadder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  // Fetch ladder function
  const fetchLadder = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setLadder(res.data.entries || []);
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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-gray-100">
      <h1 className="text-3xl font-bold mb-2 text-center">
        {LEAGUE_NAME} Leaderboard
      </h1>
      <p className="text-center mb-4 text-gray-400">
        Auto-refresh in {countdown}s
      </p>

      {loading ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main ladder table with skeleton rows */}
          <table className="w-full lg:w-2/3 border-collapse text-gray-100">
            <thead>
              <tr className="bg-gray-800 text-gray-100">
                <th className="p-2 text-left">Rank</th>
                <th className="p-2 text-left">Real Rank</th>
                <th className="p-2 text-left">Character</th>
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Account</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(LIMIT)].map((_, i) => (
                <tr key={i} className="bg-gray-700 animate-pulse">
                  <td className="p-2 relative pl-8">
                    <div className="h-4 w-8 bg-gray-600 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-8 bg-gray-600 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-24 bg-gray-600 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-16 bg-gray-600 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-8 bg-gray-600 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-20 bg-gray-600 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Top deaths table skeleton */}
          <div className="w-full lg:w-1/3 max-h-[400px] overflow-y-auto">
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
          <table className="w-full lg:w-2/3 border-collapse text-gray-100">
            <thead>
              <tr className="bg-gray-800 text-gray-100">
                <th className="p-2 text-left">Rank</th>
                <th className="p-2 text-left">Real Rank</th>
                <th className="p-2 text-left">Character</th>
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Account</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let liveRank = 0;
                return ladder.map((entry) => {
                  const isDead = entry.dead;
                  if (!isDead) liveRank++;
                  return (
                    <tr
                      key={entry.rank}
                      className={`relative ${
                        isDead
                          ? "bg-red-700 text-red-300 line-through"
                          : "bg-gray-700"
                      }`}
                    >
                      <td className="p-2 relative pl-8">
                        {isDead && (
                          <img
                            src={`${import.meta.env.BASE_URL}4x.avif`}
                            alt="Dead"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 object-contain"
                          />
                        )}
                        {entry.rank}
                      </td>
                      <td className="p-2">{isDead ? "-" : liveRank}</td>
                      <td className="p-2">{entry.character?.name}</td>
                      <td className="p-2">{entry.character?.class}</td>
                      <td className="p-2">{entry.character?.level}</td>
                      <td className="p-2">{entry.account?.name}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          {/* Top deaths table */}
          <div className="w-full lg:w-1/3 max-h-[400px] overflow-y-auto">
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
