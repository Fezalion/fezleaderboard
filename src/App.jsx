import { useEffect, useState } from "react";
import axios from "axios";

const LEAGUE_NAME = "xXxBaboonLeaguexXx (PL74225)";
const API_URL = `https://poe-proxy-five.vercel.app/api/ladder?league=${LEAGUE_NAME}&limit=200`;
const REFRESH_INTERVAL = 30; // seconds

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
      setCountdown(REFRESH_INTERVAL); // reset countdown after fetch
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLadder();
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLadder(); // refresh when countdown reaches 0
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-center">
        {LEAGUE_NAME} Leaderboard
      </h1>
      <p className="text-center mb-4 text-gray-600">
        Auto-refresh in {countdown}s
      </p>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
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
                    className={`${
                      isDead
                        ? "bg-red-200 text-red-800 line-through"
                        : "odd:bg-gray-100 even:bg-gray-200"
                    } relative`}
                  >
                    <td className="p-2 relative pl-8">
                      {isDead && (
                        <img
                          src="/4x.avif"
                          alt="Dead"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-16 object-contain"
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
      )}
    </div>
  );
}

export default App;
