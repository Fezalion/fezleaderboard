import { useEffect, useState, useCallback, useMemo } from "react";
import {
  THEME,
  LEAGUE_OPTIONS,
  getApiUrls,
  computeOverlayRows,
} from "./ladderConfig";
import OverlayPanel from "./OverlayPanel";

const OVERLAY_TYPES = [
  { value: "topLevels", label: "Top X — Levels" },
  { value: "topDelve", label: "Top X — Delve Depth" },
  { value: "people", label: "Specific People" },
];

function Overlays() {
  const [league, setLeague] = useState(LEAGUE_OPTIONS[0].value);
  const [overlayType, setOverlayType] = useState("topLevels");
  const [count, setCount] = useState(10);
  const [depthMode, setDepthMode] = useState("default");
  const [showClass, setShowClass] = useState(true);
  const [showLevel, setShowLevel] = useState(true);
  const [showAccount, setShowAccount] = useState(false);
  const [showDelve, setShowDelve] = useState(false);
  const [peopleSort, setPeopleSort] = useState("selected");
  const [title, setTitle] = useState("");
  const [opacity, setOpacity] = useState(100);
  const [refreshSeconds, setRefreshSeconds] = useState(60);
  const [copyState, setCopyState] = useState("idle"); // idle | copied

  // ── People picker state ──────────────────────────────────────────────
  const [ladder, setLadder] = useState([]);
  const [ladderLoading, setLadderLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedNames, setSelectedNames] = useState([]);

  const { API_URL } = getApiUrls(league);

  const fetchLadder = useCallback(async () => {
    setLadderLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setLadder(data.entries || []);
    } catch (err) {
      console.error("Error fetching ladder for overlay builder:", err);
    } finally {
      setLadderLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchLadder();
  }, [fetchLadder]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const lower = search.toLowerCase();
    const seen = new Set(selectedNames.map((n) => n.toLowerCase()));
    const names = new Set();
    ladder.forEach((e) => {
      const n = e.character?.name;
      if (n && n.toLowerCase().includes(lower) && !seen.has(n.toLowerCase())) {
        names.add(n);
      }
    });
    return Array.from(names).slice(0, 15);
  }, [search, ladder, selectedNames]);

  const addName = (name) => {
    setSelectedNames((prev) => [...prev, name]);
    setSearch("");
  };
  const removeName = (name) => {
    setSelectedNames((prev) => prev.filter((n) => n !== name));
  };

  const previewRows = useMemo(
    () =>
      computeOverlayRows(ladder, {
        type: overlayType,
        count,
        depthMode,
        names: selectedNames,
        peopleSort,
      }),
    [ladder, overlayType, count, depthMode, selectedNames, peopleSort],
  );

  const overlayUrl = useMemo(() => {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(
      /\/?$/,
      "/",
    );
    const params = new URLSearchParams();
    params.set("type", overlayType);
    params.set("league", league);
    if (overlayType === "topLevels" || overlayType === "topDelve") {
      params.set("count", String(count));
    }
    const needsDepthMode =
      overlayType === "topDelve" ||
      (overlayType === "people" && (showDelve || peopleSort === "delve"));
    if (needsDepthMode) {
      params.set("depthMode", depthMode);
    }
    if (overlayType === "people") {
      params.set("names", selectedNames.join(","));
      if (peopleSort !== "selected") params.set("peopleSort", peopleSort);
      params.set("showDelve", showDelve ? "1" : "0");
    }
    params.set("showClass", showClass ? "1" : "0");
    params.set("showLevel", showLevel ? "1" : "0");
    params.set("showAccount", showAccount ? "1" : "0");
    if (title.trim()) params.set("title", title.trim());
    params.set("opacity", String(opacity));
    params.set("refresh", String(Math.max(15, refreshSeconds || 60)));
    return `${base}overlay?${params.toString()}`;
  }, [
    league,
    overlayType,
    count,
    depthMode,
    selectedNames,
    showClass,
    showLevel,
    showAccount,
    showDelve,
    peopleSort,
    title,
    opacity,
    refreshSeconds,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const rowCount =
    overlayType === "people" ? Math.max(selectedNames.length, 1) : count;

  return (
    <div
      className={`min-h-dvh w-full bg-gradient-to-b ${THEME.bgGradient} ${THEME.textPrimary} px-6 py-10`}
    >
      <style>{`
        html, body, #root {
          min-height: 100%;
          overflow-x: hidden;
          overflow-y: auto !important;
        }
      `}</style>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">OBS Overlay Builder</h1>
          <p className={`${THEME.textSecondary} text-sm mt-1`}>
            Configure an overlay below, then copy the generated URL into an OBS
            Browser Source.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* League */}
            <div
              className={`p-4 rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentPrimary} ${THEME.glowSecondary} glass-panel`}
            >
              <label className="block text-sm font-semibold mb-2">League</label>
              <select
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className={`w-full p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
              >
                {LEAGUE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Overlay type */}
            <div
              className={`p-4 rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentPrimary} ${THEME.glowSecondary} glass-panel`}
            >
              <label className="block text-sm font-semibold mb-2">
                Overlay Type
              </label>
              <div className="flex flex-col gap-2">
                {OVERLAY_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="overlayType"
                      value={t.value}
                      checked={overlayType === t.value}
                      onChange={() => setOverlayType(t.value)}
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type-specific options */}
            {(overlayType === "topLevels" || overlayType === "topDelve") && (
              <div
                className={`p-4 rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentPrimary} ${THEME.glowSecondary} glass-panel`}
              >
                <label className="block text-sm font-semibold mb-2">
                  Top X
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className={`w-32 p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
                />
                {overlayType === "topDelve" && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold mb-2">
                      Depth Mode
                    </label>
                    <select
                      value={depthMode}
                      onChange={(e) => setDepthMode(e.target.value)}
                      className={`p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
                    >
                      <option value="default">Delve (Default)</option>
                      <option value="solo">Delve (Solo)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {overlayType === "people" && (
              <div
                className={`p-4 rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentPrimary} ${THEME.glowSecondary} glass-panel`}
              >
                <label className="block text-sm font-semibold mb-2">
                  Pick characters from the current ladder{" "}
                  {ladderLoading && (
                    <span className={THEME.textTertiary}>(loading…)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search character name…"
                    className={`w-full p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
                  />
                  {suggestions.length > 0 && (
                    <ul
                      className={`absolute z-10 w-full mt-1 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} max-h-56 overflow-y-auto`}
                    >
                      {suggestions.map((name) => (
                        <li
                          key={name}
                          onClick={() => addName(name)}
                          className={`p-2 cursor-pointer ${THEME.hoverDark}`}
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {selectedNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedNames.map((name) => (
                      <span
                        key={name}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded ${THEME.accentLight} border ${THEME.borderSecondary} text-sm`}
                      >
                        {name}
                        <button
                          onClick={() => removeName(name)}
                          className={`${THEME.textTertiary} hover:text-red-400`}
                          aria-label={`Remove ${name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {selectedNames.length === 0 && !ladderLoading && (
                  <p className={`${THEME.textTertiary} text-xs mt-2`}>
                    No characters selected yet.
                  </p>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">
                    Sort By
                  </label>
                  <select
                    value={peopleSort}
                    onChange={(e) => setPeopleSort(e.target.value)}
                    className={`w-full p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
                  >
                    <option value="selected">Selection order</option>
                    <option value="level">Level</option>
                    <option value="delve">Delve Depth</option>
                  </select>
                </div>

                {(showDelve || peopleSort === "delve") && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold mb-2">
                      Depth Mode
                    </label>
                    <select
                      value={depthMode}
                      onChange={(e) => setDepthMode(e.target.value)}
                      className={`p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
                    >
                      <option value="default">Delve (Default)</option>
                      <option value="solo">Delve (Solo)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Display options */}
            <div
              className={`p-4 rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentPrimary} ${THEME.glowSecondary} glass-panel flex flex-col gap-3`}
            >
              <label className="block text-sm font-semibold">
                Display Options
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClass}
                  onChange={(e) => setShowClass(e.target.checked)}
                />
                Show class
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLevel}
                  onChange={(e) => setShowLevel(e.target.checked)}
                />
                Show level
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAccount}
                  onChange={(e) => setShowAccount(e.target.checked)}
                />
                Show account name
              </label>
              {overlayType === "people" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDelve}
                    onChange={(e) => setShowDelve(e.target.checked)}
                  />
                  Show delve depth
                </label>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Overlay title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Top 10 Delvers"
                  className={`w-full p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Panel opacity ({opacity}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Refresh interval (seconds)
                </label>
                <input
                  type="number"
                  min={15}
                  value={refreshSeconds}
                  onChange={(e) => setRefreshSeconds(Number(e.target.value))}
                  className={`w-32 p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} ${THEME.focusBorder} outline-none`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live preview — full width, spans both columns */}
        <div
          className={`p-4 rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentPrimary} ${THEME.glowSecondary} glass-panel`}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold">Live Preview</label>
            <button
              onClick={fetchLadder}
              className={`text-xs px-2 py-1 rounded ${THEME.accentLight} border ${THEME.borderSecondary} ${THEME.hoverDark} transition-colors`}
            >
              {ladderLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <p className={`${THEME.textTertiary} text-xs mb-3`}>
            The checkered area represents transparency — that's what OBS will
            see through. This is the exact same component the overlay page
            renders.
          </p>
          <div
            className="rounded-lg p-6 overflow-auto"
            style={{
              backgroundImage:
                "linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          >
            <OverlayPanel
              rows={previewRows}
              type={overlayType}
              depthMode={depthMode}
              showClass={showClass}
              showLevel={showLevel}
              showAccount={showAccount}
              showDelve={showDelve}
              title={title}
              opacity={opacity}
            />
          </div>
        </div>

        {/* Generated URL */}
        <div
          className={`p-4 rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentPrimary} ${THEME.glowLarge} glass-panel`}
        >
          <label className="block text-sm font-semibold mb-2">
            OBS Browser Source URL
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={overlayUrl}
              onFocus={(e) => e.target.select()}
              className={`flex-1 p-2 rounded ${THEME.accentTertiary} border ${THEME.borderSecondary} text-sm font-mono`}
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded font-semibold ${THEME.accentLight} border ${THEME.borderPrimary} ${THEME.hoverDark} transition-colors`}
            >
              {copyState === "copied" ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className={`${THEME.textTertiary} text-xs mt-2`}>
            In OBS: Add Source → Browser → paste this URL. Recommended size
            ~800×{40 + rowCount * 36}px. Enable "Shutdown source when not
            visible" off so it keeps refreshing in the background.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Overlays;
