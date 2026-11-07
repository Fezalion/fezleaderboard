import { useState, useEffect, useCallback } from "react";
import { LEAGUE_OPTIONS } from "./ladderConfig";
import { leagueCode, leagueHref } from "./nav";
import Home from "./Home";
import LeaguePage from "./LeaugePage";

const norm = (s) => String(s ?? "").trim().toLowerCase();

// "/mirage" -> "mirage". Falls back to the old ?league=... links.
function readParam() {
  const { pathname, search } = window.location;
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  try {
    return decodeURIComponent(segment) || new URLSearchParams(search).get("league");
  } catch {
    return segment;
  }
}

// Match on the codename first, then the real league name (so old links keep working).
function findLeague(param) {
  const p = norm(param);
  if (!p) return null;
  return (
    LEAGUE_OPTIONS.find((l) => norm(leagueCode(l)) === p) ??
    LEAGUE_OPTIONS.find((l) => norm(l.value) === p) ??
    null
  );
}

export default function App() {
  const [param, setParam] = useState(readParam);

  useEffect(() => {
    const onPop = () => setParam(readParam());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((code) => {
    window.history.pushState(null, "", leagueHref(code));
    setParam(code || null);
    window.scrollTo(0, 0);
  }, []);

  const league = findLeague(param);

  // Tidy the URL: ?league=Real Name and /Mirage both become /mirage
  useEffect(() => {
    if (!league) return;
    const want = leagueHref(leagueCode(league));
    if (window.location.pathname + window.location.search !== want) {
      window.history.replaceState(null, "", want);
    }
  }, [league]);

  useEffect(() => {
    document.title = league ? `${league.label} · FezLeaderboard` : "FezLeaderboard";
  }, [league]);

  if (league) {
    return <LeaguePage key={leagueCode(league)} league={league} navigate={navigate} />;
  }
  return <Home leagues={LEAGUE_OPTIONS} unknown={param || null} navigate={navigate} />;
}