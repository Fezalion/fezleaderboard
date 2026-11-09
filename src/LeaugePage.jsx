import { useEffect, useState, useCallback, useMemo } from "react";
import { poeExperienceTable } from "./poeExperienceTable";
import RecentDeathsDisplay from "./RecentDeaths";
import DelveBattleCarousel from "./DelveBattleCarousel";
import FishyRerollCounter from "./FishyRerollCounter";
import LeagueStats from "./LeagueStats";
import { Shell, Prompt } from "./Terminal";
import { leagueCode, linkProps } from "./nav";
import {
  REFRESH_INTERVAL,
  getApiUrls,
  BANNED_ACCOUNTS,
} from "./ladderConfig";
import "./App.css";

const BANNED_ACCOUNTS_SET = new Set(
  BANNED_ACCOUNTS.map((a) => a.toLowerCase().trim()),
);

const LAST_LOGINS_URL = "https://poe-proxy-nine.vercel.app/api/lastLogins";
const DEFAULT_SORT = { key: "rank", direction: "asc" };

const formatDate = (dateString) =>
  new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

const profileUrl = (account = "") =>
  `https://www.pathofexile.com/account/view-profile/${encodeURI(account.replace("#", "-"))}`;

function sortValue(entry, key, lastSeen) {
  switch (key) {
    case "rank":
      return entry.rank || 0;
    case "character":
      return entry.character?.name?.toLowerCase() || "";
    case "class":
      return entry.character?.class?.toLowerCase() || "";
    case "level":
      return entry.character?.level || 0;
    case "account":
      return entry.account?.name?.toLowerCase() || "";
    case "experience":
      return entry.character?.experience || 0;
    case "dead":
      return entry.dead ? 1 : 0;
    case "delve":
      return entry.character?.depth?.default || 0;
    case "challenges":
      return entry.account?.challenges?.completed || 0;
    case "lastSeen":
      return lastSeen[entry.account?.name] ?? -Infinity;
    default:
      return null;
  }
}

// ─── Small presentational pieces ────────────────────────────────────────────

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

function SortTh({ column, sort, onSort, children }) {
  const active = sort.key === column;
  const arrow = active ? (sort.direction === "asc" ? "↑" : "↓") : "↕";
  return (
    <th
      aria-sort={
        active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button type="button" className="th-btn" onClick={() => onSort(column)}>
        {children}
        <span className={active ? "sort on" : "sort"}>{arrow}</span>
      </button>
    </th>
  );
}

function ExpBar({ pct }) {
  const width = 12;
  const filled = Math.round((pct / 100) * width);
  return (
    <span>
      <span className="accent">{"█".repeat(filled)}</span>
      <span className="dim">{"░".repeat(width - filled)}</span>{" "}
      {pct.toFixed(2)}%
    </span>
  );
}

function LastSeen({ ts }) {
  if (!ts) return <span className="dim">—</span>;
  const minutes = Math.floor((Date.now() - ts * 1000) / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return <span className="dim">{days}d ago</span>;
  if (hours > 0) return <span>{hours}h ago</span>;
  if (minutes > 0) return <span className="path">{minutes}m ago</span>;
  return <span className="accent">just now</span>;
}

// ─── App ────────────────────────────────────────────────────────────────────

function LeaguePage({ league, navigate }) {
  const [ladder, setLadder] = useState([]);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [lastLogins, setLastLogins] = useState({});
  const [activeTab, setActiveTab] = useState("leaderboard");

  const [search, setSearch] = useState("");
  const [searchBubbles, setSearchBubbles] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  const [showDelve, setShowDelve] = useState(false);
  const [onlyAlive, setOnlyAlive] = useState(false);
  const [hideQuitters, setHideQuitters] = useState(false);
  const [onlyTopRanked, setOnlyTopRanked] = useState(false);
  const [sort, setSort] = useState(DEFAULT_SORT);

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [countdownType, setCountdownType] = useState(null);

  const leagueName = league.value;
  const leagueVanityName = league.label;
  const { API_URL, API2_URL } = getApiUrls(leagueName);

  function LeagueBackdrop({ src }) {
  if (!src) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -0,
        pointerEvents: "none",
        backgroundImage: `url("${src}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top left",
        backgroundSize: "contain",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 80% at 0% 0%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)",
        maskImage:
          "radial-gradient(ellipse 80% 60% at 0% 0%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)",
      }}
    />
  );
}

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchLastLogins = useCallback(async () => {
    try {
      const res = await fetch(
        `${LAST_LOGINS_URL}?league=${encodeURIComponent(leagueName)}`,
      );
      const data = await res.json();
      setLastLogins(data.lastLogins || {});
    } catch (err) {
      console.error("Error fetching last logins:", err);
    }
  }, [leagueName]);

  const fetchLadder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setLadder(
        (data.entries || []).filter(
          (entry) =>
            !BANNED_ACCOUNTS_SET.has((entry.account?.name || "").toLowerCase()),
        ),
      );
    } catch (err) {
      console.error("Error fetching ladder:", err);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, [API_URL]);

  const fetchLeague = useCallback(async () => {
    try {
      const res = await fetch(API2_URL);
      setDetails(await res.json());
    } catch (err) {
      console.error("Error fetching league data:", err);
    }
  }, [API2_URL]);

  useEffect(() => {
    fetchLastLogins();
  }, [fetchLastLogins]);

  useEffect(() => {
    fetchLeague();
  }, [fetchLeague]);

  useEffect(() => {
    fetchLadder();
  }, [fetchLadder]);

  // Auto-refresh: tick once a second (paused while the tab is hidden),
  // refetch when the countdown reaches zero.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      setCountdown((c) => (c > 0 ? c - 1 : c));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown <= 0) fetchLadder();
  }, [countdown, fetchLadder]);

  // League start / end countdown
  useEffect(() => {
    if (!details?.startAt || !details?.endAt) {
      setTimeRemaining(null);
      setCountdownType(null);
      return;
    }
    const start = new Date(details.startAt).getTime();
    const end = new Date(details.endAt).getTime();
    const update = () => {
      const now = Date.now();
      if (now < start) {
        setTimeRemaining(start - now);
        setCountdownType("start");
      } else if (now < end) {
        setTimeRemaining(end - now);
        setCountdownType("end");
      } else {
        setTimeRemaining(null);
        setCountdownType(null);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [details?.startAt, details?.endAt]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  // Rank among alive characters, one per account
  const aliveRankMap = useMemo(() => {
    let rank = 1;
    const map = {};
    const seen = new Set();
    ladder.forEach((entry) => {
      const acc = entry.account?.name;
      if (!entry.dead && acc && !seen.has(acc)) {
        map[entry.rank] = rank++;
        seen.add(acc);
      }
    });
    return map;
  }, [ladder]);

  // Most recent login across all characters of the same account
  const lastSeenByAccount = useMemo(() => {
    const map = {};
    ladder.forEach((entry) => {
      const acc = entry.account?.name;
      const ts = lastLogins[entry.character?.name];
      if (acc && ts !== undefined && (map[acc] === undefined || ts > map[acc])) {
        map[acc] = ts;
      }
    });
    return map;
  }, [ladder, lastLogins]);

  const topDeaths = useMemo(() => {
    const counts = {};
    ladder.forEach((entry) => {
      if (entry.dead) {
        const acc = entry.account?.name || "Unknown";
        counts[acc] = (counts[acc] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [ladder]);

  const liveAccounts = useMemo(() => {
    const map = new Map();
    ladder.forEach((e) => {
      if (e.account?.twitch?.stream && e.account?.name && !map.has(e.account.name)) {
        map.set(e.account.name, e);
      }
    });
    return Array.from(map.values());
  }, [ladder]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const bubbled = new Set(searchBubbles.map((b) => b.value.toLowerCase()));
    const groups = {
      character: new Set(),
      account: new Set(),
      class: new Set(),
    };
    ladder.forEach((e) => {
      if (e.character?.name) groups.character.add(e.character.name);
      if (e.account?.name) groups.account.add(e.account.name);
      if (e.character?.class) groups.class.add(e.character.class);
    });
    const out = [];
    for (const [type, set] of Object.entries(groups)) {
      for (const value of set) {
        const lower = value.toLowerCase();
        if (lower.includes(q) && !bubbled.has(lower)) out.push({ type, value });
      }
    }
    return out.slice(0, 20);
  }, [search, ladder, searchBubbles]);

  let filteredLadder = ladder;
  if (searchBubbles.length > 0) {
    filteredLadder = filteredLadder.filter((entry) =>
      searchBubbles.some((bubble) => {
        const v = bubble.value.toLowerCase();
        if (bubble.type === "character")
          return entry.character?.name?.toLowerCase() === v;
        if (bubble.type === "account")
          return entry.account?.name?.toLowerCase() === v;
        if (bubble.type === "class")
          return entry.character?.class?.toLowerCase() === v;
        return false;
      }),
    );
  } else if (search.trim()) {
    const q = search.toLowerCase();
    filteredLadder = filteredLadder.filter(
      (entry) =>
        entry.character?.name?.toLowerCase().includes(q) ||
        entry.account?.name?.toLowerCase().includes(q) ||
        entry.character?.class?.toLowerCase().includes(q),
    );
  }
  if (onlyAlive) filteredLadder = filteredLadder.filter((e) => !e.dead);
  if (onlyTopRanked)
    filteredLadder = filteredLadder.filter((e) => aliveRankMap[e.rank]);
  if (hideQuitters) filteredLadder = filteredLadder.filter((e) => !e.retired);

  const sortedLadder = [...filteredLadder].sort((a, b) => {
    const av = sortValue(a, sort.key, lastSeenByAccount);
    const bv = sortValue(b, sort.key, lastSeenByAccount);
    if (av === null || bv === null) return 0;
    if (av < bv) return sort.direction === "asc" ? -1 : 1;
    if (av > bv) return sort.direction === "asc" ? 1 : -1;
    return 0;
  });

  const top1Exp =
    sortedLadder.find((e) => !e.dead)?.character?.experience || 0;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = (key) =>
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));

  const addBubble = (s) => {
    setSearchBubbles((b) => [...b, s]);
    setSearch("");
    setShowSuggestions(false);
    setHighlightedIdx(-1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        setHighlightedIdx((i) => Math.min(i + 1, suggestions.length - 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setHighlightedIdx((i) => Math.max(i - 1, 0));
        e.preventDefault();
      } else if (e.key === "Enter" && highlightedIdx >= 0) {
        addBubble(suggestions[highlightedIdx]);
        e.preventDefault();
      }
    } else if (e.key === "Backspace" && search === "" && searchBubbles.length) {
      setSearchBubbles((b) => b.slice(0, -1));
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const initialLoad = loading && ladder.length === 0;
  const sortIsDefault =
    sort.key === DEFAULT_SORT.key && sort.direction === DEFAULT_SORT.direction;

  let countdownText = null;
  if (timeRemaining && timeRemaining > 0) {
    const s = Math.floor(timeRemaining / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s / 3600) % 24);
    const m = Math.floor((s / 60) % 60);
    countdownText = `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${s % 60}s`;
  }

  const loadingLine = (
    <p className="line dim">
      loading<span className="cursor" aria-hidden="true" />
    </p>
  );

  return (
    <>
    
    <Shell title={`fezalion@leaderboard: ~/leagues/${leagueCode(league)}`}>
    <LeagueBackdrop src={league.image} />
        <Prompt>
          <a {...linkProps(null, navigate)}>cd ..</a>
        </Prompt>

        <h1 className="title">{leagueVanityName} leaderboard</h1>

        {details?.name && (
          <dl className="info">
            <dt>rules</dt>
            <dd>
              {details.rules?.[0]?.name} {details.category?.id}
            </dd>
            <dt>period</dt>
            <dd>
              {formatDate(details.startAt)} → {formatDate(details.endAt)}
              {details.id && (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={`https://www.pathofexile.com/private-leagues/league/${encodeURIComponent(details.id.replace(/\s*\(PL\d+\)$/, ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    view league
                  </a>
                </>
              )}
            </dd>
            {details.description && (
              <>
                <dt>about</dt>
                <dd>{details.description}</dd>
              </>
            )}
            {countdownText && (
              <>
                <dt>{countdownType === "start" ? "starts in" : "ends in"}</dt>
                <dd>{countdownText}</dd>
              </>
            )}
          </dl>
        )}

        <div className="tabs" role="tablist">
          {[
            { key: "leaderboard", label: "leaderboard" },
            { key: "stats", label: "league stats" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className="tab"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "stats" &&
          (initialLoad ? (
            loadingLine
          ) : (
            <LeagueStats ladder={ladder} leagueName={leagueName} />
          ))}

        {activeTab === "leaderboard" && (
          <>
            <div className="controls">
              <button
                type="button"
                className="btn"
                onClick={fetchLadder}
                title="Refresh now"
              >
                ↻ {loading ? "…" : `${countdown}s`}
              </button>

              <div className="search">
                <div className="search-box">
                  {searchBubbles.map((bubble, idx) => (
                    <span key={bubble.type + bubble.value} className="chip">
                      {bubble.value}
                      <button
                        type="button"
                        aria-label={`Remove ${bubble.value}`}
                        tabIndex={-1}
                        onClick={() =>
                          setSearchBubbles((b) => b.filter((_, i) => i !== idx))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                      setHighlightedIdx(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="grep character, class or account"
                    aria-label="Search"
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="suggest" role="listbox">
                    {suggestions.map((s, idx) => (
                      <li
                        key={s.type + s.value}
                        role="option"
                        aria-selected={highlightedIdx === idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addBubble(s);
                        }}
                        onMouseEnter={() => setHighlightedIdx(idx)}
                      >
                        <span>{s.value}</span>
                        <span className="kind">{s.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Toggle checked={showDelve} onChange={setShowDelve}>
                show delve
              </Toggle>
              <Toggle checked={onlyAlive} onChange={setOnlyAlive}>
                hide dead
              </Toggle>
              <Toggle checked={hideQuitters} onChange={setHideQuitters}>
                hide retired
              </Toggle>
              <Toggle checked={onlyTopRanked} onChange={setOnlyTopRanked}>
                top per acc.
              </Toggle>
              {!sortIsDefault && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setSort(DEFAULT_SORT)}
                >
                  clear sort
                </button>
              )}
            </div>

            {initialLoad ? (
              loadingLine
            ) : (
              <div className="layout">
                <div className="main">
                  <table className="ladder">
                    <thead>
                      <tr>
                        <th>#</th>
                        <SortTh column="rank" sort={sort} onSort={handleSort}>
                          Rank
                        </SortTh>
                        <SortTh column="character" sort={sort} onSort={handleSort}>
                          Character
                        </SortTh>
                        <SortTh column="class" sort={sort} onSort={handleSort}>
                          Class
                        </SortTh>
                        <SortTh column="level" sort={sort} onSort={handleSort}>
                          Level
                        </SortTh>
                        <SortTh column="account" sort={sort} onSort={handleSort}>
                          Account
                        </SortTh>
                        <SortTh column="experience" sort={sort} onSort={handleSort}>
                          Exp
                        </SortTh>
                        <th>Exp%</th>
                        <th>Diff</th>
                        <SortTh column="lastSeen" sort={sort} onSort={handleSort}>
                          Last Seen
                        </SortTh>
                        {showDelve && (
                          <SortTh column="delve" sort={sort} onSort={handleSort}>
                            Delve Depth
                          </SortTh>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLadder.length === 0 && (
                        <tr className="empty">
                          <td colSpan={showDelve ? 11 : 10}>no results</td>
                        </tr>
                      )}
                      {sortedLadder.map((entry, i) => {
                        const isDead = entry.dead;
                        const exp = entry.character?.experience || 0;
                        const lvl = entry.character?.level || 1;
                        const prevExp = poeExperienceTable[lvl - 1] ?? 0;
                        const nextExp = poeExperienceTable[lvl];
                        let pct = 100;
                        if (typeof nextExp === "number" && nextExp > prevExp) {
                          pct = Math.max(
                            0,
                            Math.min(
                              100,
                              ((exp - prevExp) / (nextExp - prevExp)) * 100,
                            ),
                          );
                        }
                        const diff = i === 0 || isDead ? null : exp - top1Exp;
                        const aliveRank = aliveRankMap[entry.rank];
                        const acc = entry.account?.name ?? "";
                        const stream = entry.account?.twitch?.stream;
                        const challenges = entry.account?.challenges?.completed;
                        const rowClass = [
                          isDead && "row-dead",
                          entry.retired && "row-retired",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <tr
                            key={entry.rank}
                            className={rowClass}
                            title={entry.retired ? "Retired" : undefined}
                          >
                            <td
                              className={
                                aliveRank && aliveRank <= 3 ? `r${aliveRank}` : ""
                              }
                            >
                              {aliveRank ?? "-"}
                            </td>
                            <td>{entry.rank}</td>
                            <td className="char">
                              <a
                                href={`${profileUrl(acc)}/characters?characterName=${encodeURI(entry.character?.name ?? "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {entry.character?.name}
                              </a>
                            </td>
                            <td>{entry.character?.class}</td>
                            <td>{entry.character?.level}</td>
                            <td>
                              {stream ? (
                                <a
                                  href={`https://twitch.tv/${stream.name}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="live"
                                  title="Live on Twitch"
                                >
                                  ● {acc}
                                </a>
                              ) : (
                                <a
                                  href={profileUrl(acc)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {acc}
                                </a>
                              )}
                              {typeof challenges === "number" && (
                                <span className="badge" title="Challenges completed">
                                  {challenges}
                                </span>
                              )}
                            </td>
                            <td>{entry.character?.experience}</td>
                            <td>
                              <ExpBar pct={pct} />
                            </td>
                            <td>
                              {diff === null ? "0" : diff < 0 ? diff : `+${diff}`}
                            </td>
                            <td>
                              <LastSeen ts={lastSeenByAccount[acc]} />
                            </td>
                            {showDelve && (
                              <td>
                                {entry.character?.depth
                                  ? `Depth: ${entry.character.depth.default ?? 0} / Solo: ${entry.character.depth.solo ?? 0}`
                                  : "-"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <aside className="side">
                  {leagueName === "disabled" && (
                    <>
                      <RecentDeathsDisplay />
                      <section className="panel">
                        <h2>top deaths</h2>
                        <ul>
                          {topDeaths.map(([account, deaths]) => (
                            <li key={account}>
                              <span>{account}</span>
                              <span className="dim">{deaths}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </>
                  )}

                  <section className="panel">
                    <h2>live on twitch</h2>
                    {liveAccounts.length > 0 ? (
                      <ul>
                        {liveAccounts.map((entry) => (
                          <li key={entry.account.name}>
                            <a
                              href={`https://twitch.tv/${entry.account.twitch.stream.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="live"
                              title="Live on Twitch"
                            >
                              ● {entry.account.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="panel-empty">no one is live</p>
                    )}
                  </section>

                  <FishyRerollCounter ladder={ladder} />
                  <DelveBattleCarousel ladder={ladder} />
                </aside>
              </div>
            )}
          </>
        )}
    </Shell>
    </>
  );
}

export default LeaguePage;