import { useState, useEffect, useCallback } from "react";

const DEATHS_URL = "https://poe-proxy-nine.vercel.app/api/deaths";

const CLASS_COLORS = {
  Witch: "#b794f6",
  Templar: "#e0b46b",
  Marauder: "#e07a7a",
  Ranger: "#7fe0a4",
  Duelist: "#fb923c",
  Shadow: "#94a3b8",
  Scion: "#f2a6c8",
};
const DEFAULT_CLASS_COLOR = "#8fd3ff";

const RecentDeathsDisplay = () => {
  const [deaths, setDeaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeaths = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(DEATHS_URL);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch deaths");

      // Newest first
      setDeaths([...(data.deaths || [])].sort((a, b) => b.index - a.index));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeaths();
  }, [fetchDeaths]);

  if (error) {
    return (
      <section className="panel">
        <h2>recent deaths: error</h2>
        <div className="panel-body">
          <p className="bad" style={{ margin: 0 }}>
            {error}
          </p>
          <div>
            <button type="button" className="btn" onClick={fetchDeaths}>
              retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>recent deaths</h2>
        <button
          type="button"
          onClick={fetchDeaths}
          disabled={loading}
          title="Refresh deaths"
        >
          {loading ? "…" : "↻"}
        </button>
      </div>

      {loading && deaths.length === 0 ? (
        <p className="panel-empty">loading…</p>
      ) : deaths.length === 0 ? (
        <p className="panel-empty">no deaths recorded yet</p>
      ) : (
        <div className="scroll" style={{ maxHeight: "20rem" }}>
          {deaths.map((death, index) => (
            <div key={death.index ?? index} className="death">
              <div>
                <span className="death-name">
                  {death.character || "Unknown Character"}
                </span>{" "}
                <span
                  style={{ color: CLASS_COLORS[death.class] || DEFAULT_CLASS_COLOR }}
                >
                  {death.class}
                </span>{" "}
                <span className="dim">lvl {death.level || "?"}</span>
              </div>
              <div className="dim">{death.account || "Unknown Account"}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentDeathsDisplay;