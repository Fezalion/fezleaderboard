import React, { useState, useEffect } from "react";

const RecentDeathsDisplay = () => {
  const [deaths, setDeaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshSpinAngle, setRefreshSpinAngle] = useState(0);
  const [newDeathsCount, setNewDeathsCount] = useState(0);

  // Manual refresh handler (must be after fetchLadder)
  const handleManualRefresh = () => {
    setRefreshSpinAngle((prev) => prev + 180);
    fetchDeaths();
  };

  const fetchDeaths = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://poe-proxy-6mvi.vercel.app/api/deaths"
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch deaths");

      setDeaths(data.deaths || []);
      setNewDeathsCount(data.newDeaths?.length || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeaths();
  }, []);

  const getClassColor = (className) => {
    const colors = {
      Witch: "text-purple-400",
      Templar: "text-yellow-400",
      Marauder: "text-red-400",
      Ranger: "text-green-400",
      Duelist: "text-orange-400",
      Shadow: "text-gray-400",
      Scion: "text-pink-400",
    };
    return colors[className] || "text-blue-400";
  };

  if (error) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <h3 className="text-lg font-bold">Recent Deaths - Error</h3>
        </div>
        <p className="text-red-300">{error}</p>
        <button
          onClick={fetchDeaths}
          className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-h-1/2 bg-gray-800  overflow-hidden">
      <div className="bg-gray-800 px-4 border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-100">Recent Deaths</h3>
            {newDeathsCount > 0 && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse">
                +{newDeathsCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-600 transition-colors  focus:outline-none focus:ring relative"
              style={{ minWidth: 40 }}
              title="Refresh deaths"
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
          </div>
        </div>
      </div>

      <div
        className="max-h-full overflow-y-auto  [&::-webkit-scrollbar]:w-2
  dark:[&::-webkit-scrollbar-track]:bg-gray-700
  dark:[&::-webkit-scrollbar-thumb]:bg-gray-500"
      >
        {loading && deaths.length === 0 ? (
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-600 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-600 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : deaths.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p>No deaths recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-600">
            {deaths.map((death, index) => (
              <div
                key={death.id || index}
                className="flex items-center gap-3 p-3 bg-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-100 truncate">
                      {death.character || "Unknown Character"}
                    </span>
                    <span
                      className={`text-sm font-medium ${getClassColor(
                        death.class
                      )}`}
                    >
                      {death.class}
                    </span>
                    <span className="text-sm text-gray-400">
                      Level {death.level || "?"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">
                      {death.account || "Unknown Account"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentDeathsDisplay;
