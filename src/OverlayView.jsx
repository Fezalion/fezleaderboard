import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LEAGUE_OPTIONS, getApiUrls, computeOverlayRows } from "./ladderConfig";
import OverlayPanel from "./OverlayPanel";

function useOverlayParams() {
  const [searchParams] = useSearchParams();
  return useMemo(() => {
    const type = searchParams.get("type") || "topLevels";
    const league = searchParams.get("league") || LEAGUE_OPTIONS[0].value;
    const count = Math.min(
      100,
      Math.max(1, Number(searchParams.get("count")) || 10),
    );
    const depthMode =
      searchParams.get("depthMode") === "solo" ? "solo" : "default";
    const namesParam = searchParams.get("names") || "";
    const names = namesParam
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const showClass = searchParams.get("showClass") !== "0";
    const showLevel = searchParams.get("showLevel") !== "0";
    const showAccount = searchParams.get("showAccount") === "1";
    const showDelve = searchParams.get("showDelve") === "1";
    const peopleSort = searchParams.get("peopleSort") || "";
    const title = searchParams.get("title") || "";
    const opacityParam = searchParams.get("opacity");
    const opacity =
      opacityParam === null
        ? 100
        : Math.max(0, Math.min(100, Number(opacityParam) || 0));
    const refresh = Math.max(15, Number(searchParams.get("refresh")) || 60);
    return {
      type,
      league,
      count,
      depthMode,
      names,
      showClass,
      showLevel,
      showAccount,
      showDelve,
      peopleSort,
      title,
      opacity,
      refresh,
    };
  }, [searchParams]);
}

function OverlayView() {
  const {
    type,
    league,
    count,
    depthMode,
    names,
    showClass,
    showLevel,
    showAccount,
    showDelve,
    peopleSort,
    title,
    opacity,
    refresh,
  } = useOverlayParams();
  const [ladder, setLadder] = useState([]);
  const { API_URL } = getApiUrls(league);

  // Make the page background transparent so OBS only captures the panel
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, []);

  const fetchLadder = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setLadder(data.entries || []);
    } catch (err) {
      console.error("Error fetching overlay ladder:", err);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchLadder();
    const interval = setInterval(fetchLadder, refresh * 1000);
    return () => clearInterval(interval);
  }, [fetchLadder, refresh]);

  const rows = useMemo(
    () =>
      computeOverlayRows(ladder, {
        type,
        count,
        depthMode,
        names,
        peopleSort,
      }),
    [ladder, type, count, depthMode, names, peopleSort],
  );

  return (
    <div
      className="min-h-dvh w-full flex items-start justify-start p-4"
      style={{ background: "transparent" }}
    >
      <OverlayPanel
        rows={rows}
        type={type}
        depthMode={depthMode}
        showClass={showClass}
        showLevel={showLevel}
        showAccount={showAccount}
        showDelve={showDelve}
        title={title}
        opacity={opacity}
      />
    </div>
  );
}

export default OverlayView;
