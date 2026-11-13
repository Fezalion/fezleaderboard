import { useEffect, useState, useCallback, useMemo } from "react";
import { LEAGUE_OPTIONS, getApiUrls, computeOverlayRows } from "./ladderConfig";
import { Shell, Prompt } from "./Terminal";
import OverlayPanel from "./OverlayPanel";

const OVERLAY_TYPES = [
  { value: "topLevels", label: "Top X — Levels" },
  { value: "topDelve", label: "Top X — Delve Depth" },
  { value: "people", label: "Specific People" },
];

// Clamp a raw (possibly invalid) numeric string to a safe range, falling
// back to a default when it isn't a finite number at all.
function clampNumber(raw, min, max, fallback) {
  const n = Number(raw);
  if (raw === null || raw === "" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}


function Toggle({ checked, onChange, children }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className="toggle"
      onClick={() => onChange(!checked)}
    >
      [{checked ? "x" : "\u00a0"}] {children}
    </button>
  );
}

function DepthSelect({ value, onChange }) {
  return (
    <div>
      <h3 className="sect">depth mode</h3>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="default">Delve (Default)</option>
        <option value="solo">Delve (Solo)</option>
      </select>
    </div>
  );
}

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
  const [loadStatus, setLoadStatus] = useState(null); // { type: "success"|"warning"|"error", message }

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
      const acct = e.account?.name;
      const matches =
        n?.toLowerCase().includes(lower) || acct?.toLowerCase().includes(lower);
      if (n && matches && !seen.has(n.toLowerCase())) {
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

  // Auto-dismiss the load status banner after a bit.
  useEffect(() => {
    if (!loadStatus) return;
    const t = setTimeout(() => setLoadStatus(null), 7000);
    return () => clearTimeout(t);
  }, [loadStatus]);

  // Parse a pasted overlay URL, sanity-check every field, and load whatever
  // is valid into the builder's inputs so an old link can be re-edited.
  const loadFromUrl = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    let urlObj;
    try {
      urlObj = new URL(trimmed);
    } catch {
      try {
        urlObj = new URL(trimmed, window.location.origin);
      } catch {
        setLoadStatus({
          type: "error",
          message: "That doesn't look like a valid URL.",
        });
        return;
      }
    }

    const params = urlObj.searchParams;
    if ([...params.keys()].length === 0) {
      setLoadStatus({
        type: "error",
        message: "No overlay parameters found in that URL.",
      });
      return;
    }

    const warnings = [];

    // Overlay type
    const rawType = params.get("type");
    const validType = OVERLAY_TYPES.some((t) => t.value === rawType)
      ? rawType
      : "topLevels";
    if (rawType && validType !== rawType) {
      warnings.push(`unknown type "${rawType}" → defaulted to Top X — Levels`);
    }

    // League — keep the current selection if the URL's league isn't one we know
    const rawLeague = params.get("league");
    const validLeague = LEAGUE_OPTIONS.some((l) => l.value === rawLeague)
      ? rawLeague
      : league;
    if (rawLeague && validLeague !== rawLeague) {
      warnings.push(`unknown league "${rawLeague}" → kept current league`);
    } else if (!rawLeague) {
      warnings.push("no league in URL → kept current league");
    }

    // Count
    const rawCount = params.get("count");
    const parsedCount = clampNumber(rawCount, 1, 100, 10);
    if (rawCount !== null && String(parsedCount) !== rawCount) {
      warnings.push(`count "${rawCount}" out of range → set to ${parsedCount}`);
    }

    // Depth mode
    const validDepthMode =
      params.get("depthMode") === "solo" ? "solo" : "default";

    // Names (for "people" overlays)
    const rawNames = params.get("names") || "";
    const parsedNames = Array.from(
      new Set(
        rawNames
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
      ),
    );
    if (validType === "people" && parsedNames.length === 0) {
      warnings.push("no characters found in the names list");
    }

    // People sort
    const rawSort = params.get("peopleSort");
    const validSort = ["selected", "level", "delve"].includes(rawSort)
      ? rawSort
      : "selected";
    if (rawSort && validSort !== rawSort) {
      warnings.push(`unknown sort "${rawSort}" → defaulted to Selection order`);
    }

    // Booleans (matches OverlayView's own parsing rules)
    const validShowClass = params.get("showClass") !== "0";
    const validShowLevel = params.get("showLevel") !== "0";
    const validShowAccount = params.get("showAccount") === "1";
    const validShowDelve = params.get("showDelve") === "1";

    // Title — just guard against something absurd
    const rawTitle = params.get("title") || "";
    const validTitle = rawTitle.slice(0, 100);
    if (rawTitle.length > 100) {
      warnings.push("title was too long → trimmed to 100 characters");
    }

    // Opacity
    const rawOpacity = params.get("opacity");
    const parsedOpacity = clampNumber(rawOpacity, 10, 100, 100);
    if (rawOpacity !== null && String(parsedOpacity) !== rawOpacity) {
      warnings.push(
        `opacity "${rawOpacity}" out of range → set to ${parsedOpacity}%`,
      );
    }

    // Refresh interval
    const rawRefresh = params.get("refresh");
    const parsedRefresh = clampNumber(rawRefresh, 15, 3600, 60);
    if (rawRefresh !== null && String(parsedRefresh) !== rawRefresh) {
      warnings.push(
        `refresh "${rawRefresh}" out of range → set to ${parsedRefresh}s`,
      );
    }

    // Apply everything that survived the sanity checks
    setLeague(validLeague);
    setOverlayType(validType);
    setCount(parsedCount);
    setDepthMode(validDepthMode);
    setShowClass(validShowClass);
    setShowLevel(validShowLevel);
    setShowAccount(validShowAccount);
    setShowDelve(validShowDelve);
    setPeopleSort(validSort);
    setTitle(validTitle);
    setOpacity(parsedOpacity);
    setRefreshSeconds(parsedRefresh);
    setSearch("");
    if (validType === "people") {
      setSelectedNames(parsedNames);
    }

    setLoadStatus(
      warnings.length
        ? {
            type: "warning",
            message: `Loaded with adjustments: ${warnings.join("; ")}.`,
          }
        : { type: "success", message: "Overlay settings loaded from URL." },
    );
  };

  const handleUrlPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    loadFromUrl(text);
  };

  const rowCount =
    overlayType === "people" ? Math.max(selectedNames.length, 1) : count;

  return (
    <Shell title="fezalion@xyz: overlay-builder">
      <Prompt host="fezalion@xyz">overlay --build</Prompt>
      <h1 className="title">OBS Overlay Builder</h1>
      <p className="line dim" style={{ marginBottom: 20 }}>
        # configure an overlay, then paste the generated URL into an OBS Browser Source
      </p>

      <div className="ov-grid">
        {/* Left column */}
        <div className="ov-col">
          <section className="panel">
            <h2>league</h2>
            <div className="panel-body">
              <select
                className="select ov-full"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
              >
                {LEAGUE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="panel">
            <h2>overlay type</h2>
            <div className="panel-body">
              <div className="tabs" role="tablist" style={{ flexWrap: "wrap", marginBottom: 0 }}>
                {OVERLAY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="tab"
                    className="tab"
                    aria-selected={overlayType === t.value}
                    onClick={() => setOverlayType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {(overlayType === "topLevels" || overlayType === "topDelve") && (
            <section className="panel">
              <h2>top x</h2>
              <div className="panel-body">
                <div>
                  <h3 className="sect">count (1–100)</h3>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="input ov-short"
                  />
                </div>
                {overlayType === "topDelve" && (
                  <DepthSelect value={depthMode} onChange={setDepthMode} />
                )}
              </div>
            </section>
          )}

          {overlayType === "people" && (
            <section className="panel">
              <h2>characters{ladderLoading ? " (loading…)" : ""}</h2>
              <div className="panel-body">
                <div>
                  <h3 className="sect">pick from the current ladder</h3>
                  <div className="search ov-search">
                    <div className="search-box">
                      {selectedNames.map((name) => (
                        <span key={name} className="chip">
                          {name}
                          <button
                            type="button"
                            onClick={() => removeName(name)}
                            aria-label={`Remove ${name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="search character or account…"
                      />
                    </div>
                    {suggestions.length > 0 && (
                      <ul className="suggest">
                        {suggestions.map((name) => (
                          <li key={name} onClick={() => addName(name)}>
                            {name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selectedNames.length === 0 && !ladderLoading && (
                    <p className="dim" style={{ margin: "8px 0 0" }}>
                      no characters selected yet
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="sect">sort by</h3>
                  <select
                    className="select"
                    value={peopleSort}
                    onChange={(e) => setPeopleSort(e.target.value)}
                  >
                    <option value="selected">Selection order</option>
                    <option value="level">Level</option>
                    <option value="delve">Delve Depth</option>
                  </select>
                </div>

                {(showDelve || peopleSort === "delve") && (
                  <DepthSelect value={depthMode} onChange={setDepthMode} />
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="ov-col">
          <section className="panel">
            <h2>display options</h2>
            <div className="panel-body">
              <div className="ov-fields">
                <Toggle checked={showClass} onChange={setShowClass}>show class</Toggle>
                <Toggle checked={showLevel} onChange={setShowLevel}>show level</Toggle>
                <Toggle checked={showAccount} onChange={setShowAccount}>show account name</Toggle>
                {overlayType === "people" && (
                  <Toggle checked={showDelve} onChange={setShowDelve}>show delve depth</Toggle>
                )}
              </div>
              <div>
                <h3 className="sect">overlay title (optional)</h3>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Top 10 Delvers"
                  className="input ov-full"
                />
              </div>
              <div>
                <h3 className="sect">panel opacity ({opacity}%)</h3>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="range"
                />
              </div>
              <div>
                <h3 className="sect">refresh interval (seconds)</h3>
                <input
                  type="number"
                  min={15}
                  value={refreshSeconds}
                  onChange={(e) => setRefreshSeconds(Number(e.target.value))}
                  className="input ov-short"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="ov-stack">
        {/* Live preview */}
        <section className="panel">
          <div className="panel-head">
            <h2>live preview</h2>
            <button type="button" onClick={fetchLadder} disabled={ladderLoading}>
              {ladderLoading ? "refreshing…" : "refresh"}
            </button>
          </div>
          <div className="panel-body">            
            <div className="ov-checker">
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
        </section>

        {/* Generated URL */}
        <section className="panel">
          <h2>obs browser source url</h2>
          <div className="panel-body">
            <div className="ov-row">
              <input
                readOnly
                value={overlayUrl}
                onFocus={(e) => e.target.select()}
                onPaste={handleUrlPaste}
                className="input"
              />
              <button type="button" className="btn" onClick={handleCopy}>
                {copyState === "copied" ? "copied!" : "copy"}
              </button>
            </div>
            <div>
              <p className="dim line">
                # In OBS: Add Source → Browser → paste this URL. Recommended size
                ~800×{70 + rowCount * 31}px. Enable "Shutdown source when not
                visible" so it doesn't use resources while hidden.
              </p>
              <p className="dim line">
                # Tip: paste an old overlay URL into the box above (Ctrl/Cmd+V)
                to reload it into the builder for editing.
              </p>
            </div>
            {loadStatus && (
              <p
                className={`line ${
                  loadStatus.type === "error" ? "bad" : loadStatus.type === "warning" ? "warn" : "accent"
                }`}
              >
                {loadStatus.message}
              </p>
            )}
          </div>
        </section>
      </div>

      <Prompt host="fezalion@xyz">
        <span className="cursor" aria-hidden="true" />
      </Prompt>
    </Shell>
  );
}

export default Overlays;