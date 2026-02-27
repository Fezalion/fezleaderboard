import { useState, useMemo } from "react";

// ─── Shared constants ────────────────────────────────────────────────────────
const TICKS_PER_SEC = 30;

// ─── Tab 1 helpers ───────────────────────────────────────────────────────────
function calcCDRRow(
  cdr,
  vixenCD,
  doomCD,
  tempChains,
  actionSpeed,
  cascadeHits,
) {
  const cdrDiv = 1 + cdr / 100;
  const vixenEffCD = vixenCD / cdrDiv;
  const doomEffCD = doomCD / cdrDiv;
  const vixenTicks = Math.ceil(vixenEffCD * TICKS_PER_SEC);
  const vixenCDRSec = vixenTicks / TICKS_PER_SEC;
  const asMult = 1 + actionSpeed / 100;
  const maxDpsCS = Math.floor(
    (1 / (cascadeHits * doomEffCD * asMult) - 1) * 100,
  );
  const hardcapCS = Math.floor(
    (7.5 / (vixenTicks * (1 - tempChains) * asMult) - 1) * 100,
  );
  return {
    cdr,
    maxDpsCS: Math.max(0, maxDpsCS),
    hardcapCS: Math.max(0, hardcapCS),
    vixenTicks,
    vixenCDRSec: +vixenCDRSec.toFixed(3),
    doomEffCD: +doomEffCD.toFixed(3),
  };
}

// ─── Tab 2 helpers ───────────────────────────────────────────────────────────
function calcSpecific(
  cdr,
  castSpeedPct,
  actionSpeed,
  tempChainsBase,
  vixenCD,
  doomCD,
) {
  const cdrDiv = 1 + cdr / 100;
  const vixenEff = vixenCD / cdrDiv;
  const doomEff = doomCD / cdrDiv;
  const vixenTicks = Math.ceil(vixenEff * TICKS_PER_SEC);
  const vixenServerCD = vixenTicks / TICKS_PER_SEC;
  const asMult = 1 + actionSpeed / 100;
  const castTime = tempChainsBase / (1 + castSpeedPct / 100) / asMult;
  const vixenWasted = castTime - vixenServerCD;
  const blastRatio = castTime / doomEff;
  const blastWasted = (blastRatio % 1) * doomEff;
  return {
    castTime,
    vixenWasted,
    blastWasted,
    vixenServerCD,
    doomEff,
    vixenTicks,
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Fira+Code:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; font-family: 'Fira Code', monospace; }

  .app {
    min-height: 100vh;
    background: radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%);
    color: #c8b99a; padding: 2rem 1rem 3rem;
  }

  .header { text-align: center; margin-bottom: 2rem; }
  .header h1 {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.6rem, 4vw, 2.8rem); font-weight: 700;
    background: linear-gradient(135deg, #e8c97a 0%, #c8853a 50%, #e8c97a 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    letter-spacing: 0.08em; margin-bottom: 0.3rem;
  }
  .header .subtitle { font-size: 0.75rem; color: #6a5a4a; letter-spacing: 0.15em; text-transform: uppercase; }
  .header .credit   { font-size: 0.7rem; color: #8a7060; margin-top: 0.4rem; }
  .divider { width: 200px; height: 1px; background: linear-gradient(90deg, transparent, #c8853a, transparent); margin: 1rem auto; }

  .sheet-tabs {
    display: flex; max-width: 1000px; margin: 0 auto 2rem;
    border-bottom: 1px solid rgba(200,133,58,0.3);
  }
  .sheet-tab {
    padding: 0.55rem 1.4rem; background: transparent;
    border: 1px solid transparent; border-bottom: none;
    color: #6a5a4a; font-family: 'Cinzel', serif; font-size: 0.72rem;
    letter-spacing: 0.08em; cursor: pointer; transition: all 0.18s;
    text-transform: uppercase; border-radius: 4px 4px 0 0;
    position: relative; bottom: -1px;
  }
  .sheet-tab:hover:not(.active) { color: #a08060; background: rgba(200,133,58,0.05); }
  .sheet-tab.active {
    color: #e8c97a; background: rgba(200,133,58,0.1);
    border-color: rgba(200,133,58,0.3); border-bottom-color: #0a0a0f;
  }

  .layout, .spec-layout {
    max-width: 1000px; margin: 0 auto;
    display: grid; grid-template-columns: 300px 1fr; gap: 2rem; align-items: start;
  }
  @media (max-width: 700px) { .layout, .spec-layout { grid-template-columns: 1fr; } }

  .panel {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(200,133,58,0.25);
    border-radius: 8px; padding: 1.5rem; position: sticky; top: 1rem;
  }
  .panel-title {
    font-family: 'Cinzel', serif; font-size: 0.9rem; color: #e8c97a;
    letter-spacing: 0.1em; margin-bottom: 1.2rem; text-transform: uppercase;
  }

  .field { margin-bottom: 1rem; }
  .field label { display: block; font-size: 0.7rem; color: #8a7060; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.4rem; }
  .field input {
    width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(200,133,58,0.3);
    border-radius: 4px; color: #e8c97a; font-family: 'Fira Code', monospace; font-size: 0.9rem;
    padding: 0.5rem 0.7rem; outline: none; transition: border-color 0.2s;
  }
  .field input:focus { border-color: rgba(200,133,58,0.7); }
  .field .hint { font-size: 0.65rem; color: #5a4a3a; margin-top: 0.3rem; line-height: 1.4; }

  .toggle-label { font-size: 0.65rem; color: #8a7060; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.4rem; display: block; }
  .toggle-group {
    display: flex; background: rgba(0,0,0,0.3);
    border: 1px solid rgba(200,133,58,0.25); border-radius: 6px; overflow: hidden; margin-bottom: 1.2rem;
  }
  .toggle-btn {
    flex: 1; padding: 0.5rem 0.4rem; background: transparent; border: none;
    color: #6a5a4a; font-family: 'Fira Code', monospace; font-size: 0.68rem;
    cursor: pointer; transition: all 0.18s; line-height: 1.3; text-align: center;
  }
  .toggle-btn.active { background: rgba(200,133,58,0.18); color: #e8c97a; }
  .toggle-btn:hover:not(.active) { color: #a08060; background: rgba(200,133,58,0.07); }

  .info-boxes { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .info-box { background: rgba(200,133,58,0.06); border-left: 2px solid #c8853a; padding: 0.6rem 0.8rem; border-radius: 0 4px 4px 0; }
  .info-box .ib-label { font-size: 0.65rem; color: #c8853a; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.2rem; }
  .info-box .ib-value { font-size: 1.1rem; color: #e8c97a; font-weight: 500; }
  .info-box.danger { border-left-color: #e85a3a; background: rgba(232,90,58,0.06); }
  .info-box.danger .ib-label { color: #e85a3a; }
  .info-box.danger .ib-value { color: #ff8060; }

  .table-wrap { overflow-x: auto; border: 1px solid rgba(200,133,58,0.2); border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  thead tr { background: rgba(200,133,58,0.12); }
  thead th {
    padding: 0.7rem 1rem; text-align: right;
    font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.1em;
    color: #c8853a; text-transform: uppercase; white-space: nowrap;
    border-bottom: 1px solid rgba(200,133,58,0.2);
  }
  thead th:first-child { text-align: center; }
  tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
  tbody tr:hover { background: rgba(200,133,58,0.07); }
  tbody tr.highlight-row { background: rgba(200,133,58,0.13); }
  tbody tr.breakpoint-row { border-top: 1px solid rgba(200,133,58,0.4); }
  tbody td { padding: 0.45rem 1rem; text-align: right; color: #b0a090; }
  tbody td:first-child { text-align: center; color: #6a5a4a; font-size: 0.7rem; }
  tbody tr.current-cs-row { background: rgba(200,133,58,0.13); }
  tbody tr.current-cs-row td:first-child { color: #e8c97a; }

  .val-maxdps  { color: #80d080; font-weight: 500; }
  .val-hardcap { color: #e87050; font-weight: 500; }
  .val-ticks   { color: #8090d0; }
  .wasted-good { color: #80e8a0; }
  .wasted-ok   { color: #e8c060; }
  .wasted-bad  { color: #e87050; }
  .wasted-loss { color: #9b7be8; font-style: italic; }

  .badge { display: inline-block; font-size: 0.55rem; padding: 0.1rem 0.4rem; border-radius: 2px; vertical-align: middle; margin-left: 0.4rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .badge-bp  { background: rgba(200,133,58,0.25); color: #c8853a; border: 1px solid rgba(200,133,58,0.4); }
  .badge-you { background: rgba(200,133,58,0.35); color: #e8c97a; border: 1px solid rgba(200,133,58,0.6); }
  .cascade-badge { display: inline-block; font-size: 0.6rem; padding: 0.15rem 0.5rem; border-radius: 3px; margin-left: 0.5rem; vertical-align: middle; background: rgba(130,180,255,0.12); color: #82b4ff; border: 1px solid rgba(130,180,255,0.3); }

  .search-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: center; }
  .search-row input {
    flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(200,133,58,0.2);
    border-radius: 4px; color: #e8c97a; font-family: 'Fira Code', monospace;
    font-size: 0.8rem; padding: 0.4rem 0.7rem; outline: none;
  }
  .search-row input:focus { border-color: rgba(200,133,58,0.5); }
  .search-row label { font-size: 0.7rem; color: #6a5a4a; white-space: nowrap; }

  .notes { max-width: 1000px; margin: 1.5rem auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .note-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(200,133,58,0.15); border-radius: 6px; padding: 1rem; }
  .note-card h4 { font-family: 'Cinzel', serif; font-size: 0.7rem; color: #c8853a; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .note-card p  { font-size: 0.7rem; color: #6a5a4a; line-height: 1.6; }

  /* Tab 2 */
  .derived-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 1.2rem; }
  .derived-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(200,133,58,0.15); border-radius: 6px; padding: 0.7rem; }
  .derived-box .db-label { font-size: 0.6rem; color: #6a5a4a; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.2rem; }
  .derived-box .db-value { font-size: 0.9rem; color: #c8b99a; font-weight: 500; }

  .spec-summary { background: rgba(255,255,255,0.03); border: 1px solid rgba(200,133,58,0.25); border-radius: 8px; padding: 1.2rem; margin-bottom: 1.2rem; }
  .spec-summary-title { font-family: 'Cinzel', serif; font-size: 0.75rem; color: #c8853a; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.8rem; }
  .spec-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .ssb { padding: 0.6rem 0.8rem; border-radius: 4px; border-left: 2px solid; }
  .ssb .ssb-label { font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.2rem; }
  .ssb .ssb-value { font-size: 1rem; font-weight: 500; }
  .ssb.neutral { border-color: #c8853a; background: rgba(200,133,58,0.06); }
  .ssb.neutral .ssb-label { color: #c8853a; }
  .ssb.neutral .ssb-value { color: #e8c97a; }
  .ssb.good    { border-color: #4ab870; background: rgba(74,184,112,0.06); }
  .ssb.good    .ssb-label { color: #4ab870; }
  .ssb.good    .ssb-value { color: #80e8a0; }
  .ssb.danger  { border-color: #e85a3a; background: rgba(232,90,58,0.06); }
  .ssb.danger  .ssb-label { color: #e85a3a; }
  .ssb.danger  .ssb-value { color: #ff8060; }
  .ssb.warn    { border-color: #e8c060; background: rgba(232,192,96,0.06); }
  .ssb.warn    .ssb-label { color: #e8c060; }
  .ssb.warn    .ssb-value { color: #ffe090; }
  .ssb.loss    { border-color: #9b7be8; background: rgba(155,123,232,0.06); }
  .ssb.loss    .ssb-label { color: #9b7be8; }
  .ssb.loss    .ssb-value { color: #c4a8ff; }

  .hint-banner {
    font-size: 0.68rem; color: #6a5a4a; line-height: 1.6;
    background: rgba(200,133,58,0.05); border: 1px solid rgba(200,133,58,0.15);
    border-radius: 6px; padding: 0.7rem 1rem; margin-bottom: 1rem;
  }
  .hint-banner span { color: #c8853a; }

  .range-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
`;

// ─── Tab 1: CDR Table ─────────────────────────────────────────────────────────
function CDRTable({
  vixenCD,
  setVixenCD,
  doomCD,
  setDoomCD,
  tempChains,
  setTempChains,
  actionSpeed,
  setActionSpeed,
  awakened,
  setAwakened,
}) {
  const [highlightCDR, setHighlightCDR] = useState("");
  const cascadeHits = awakened ? 5 : 4;

  const rows = useMemo(() => {
    const data = [];
    for (let cdr = 0; cdr <= 89; cdr++) {
      data.push(
        calcCDRRow(cdr, vixenCD, doomCD, tempChains, actionSpeed, cascadeHits),
      );
    }
    return data;
  }, [vixenCD, doomCD, tempChains, actionSpeed, cascadeHits]);

  const breakpoints = useMemo(() => {
    const bp = new Set();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].vixenTicks !== rows[i - 1].vixenTicks) bp.add(rows[i].cdr);
    }
    return bp;
  }, [rows]);

  const hlCDR = parseInt(highlightCDR);
  const hlRow = !isNaN(hlCDR) && hlCDR >= 0 && hlCDR <= 89 ? rows[hlCDR] : null;

  return (
    <div className="layout">
      <div>
        <div className="panel">
          <div className="panel-title">⚙ Parameters</div>
          <span className="toggle-label">Spell Cascade</span>
          <div className="toggle-group">
            <button
              className={`toggle-btn${!awakened ? " active" : ""}`}
              onClick={() => setAwakened(false)}
            >
              Regular
              <br />
              <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>
                4 hits/cast
              </span>
            </button>
            <button
              className={`toggle-btn${awakened ? " active" : ""}`}
              onClick={() => setAwakened(true)}
            >
              Greater
              <br />
              <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>
                5 hits/cast
              </span>
            </button>
          </div>

          <div className="field">
            <div className="hint">
              The Normal/Greater selection is WIP and not tested, based on POB
              DoomBlastCalc code.{" "}
              <span className="text-red-500">DO NOT RELY</span>
            </div>
          </div>

          <div className="field">
            <label>Vixen Cooldown (s)</label>
            <input
              type="number"
              step="0.01"
              value={vixenCD}
              onChange={(e) => setVixenCD(parseFloat(e.target.value) || 0.25)}
            />
          </div>
          <div className="field">
            <label>Doom Blast Cooldown (s)</label>
            <input
              type="number"
              step="0.01"
              value={doomCD}
              onChange={(e) => setDoomCD(parseFloat(e.target.value) || 0.15)}
            />
          </div>
          <div className="field">
            <label>Temp Chains Cast Time</label>
            <input
              type="number"
              step="0.05"
              value={tempChains}
              onChange={(e) => setTempChains(parseFloat(e.target.value) || 0)}
            />
            <div className="hint">
              the base cast time of Temporal Chains (should be 0.5 at all times
              ?)
            </div>
          </div>
          <div className="field">
            <label>Action Speed (%)</label>
            <input
              type="number"
              step="1"
              value={actionSpeed}
              onChange={(e) => setActionSpeed(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {hlRow && (
          <div className="panel" style={{ marginTop: "1rem" }}>
            <div className="panel-title">📊 CDR {hlCDR}% Results</div>
            <div className="info-boxes">
              <div className="info-box">
                <div className="ib-label">Max DPS Cast Speed</div>
                <div className="ib-value">{hlRow.maxDpsCS}%</div>
              </div>
              <div className="info-box danger">
                <div className="ib-label">Hardcap Cast Speed</div>
                <div className="ib-value">{hlRow.hardcapCS}%</div>
              </div>
              <div className="info-box">
                <div className="ib-label">Vixen Ticks</div>
                <div className="ib-value">{hlRow.vixenTicks}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="search-row">
          <label>Jump to CDR %:</label>
          <input
            type="number"
            min="0"
            max="89"
            placeholder="e.g. 30"
            value={highlightCDR}
            onChange={(e) => setHighlightCDR(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>CDR %</th>
                <th>
                  Max DPS CS{" "}
                  <span className="cascade-badge">{cascadeHits} hits</span>
                </th>
                <th>Hardcap CS</th>
                <th>Vixen Ticks</th>
                <th>Vixen CD</th>
                <th>Doom CD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.cdr}
                  className={[
                    row.cdr === hlCDR ? "highlight-row" : "",
                    breakpoints.has(row.cdr) ? "breakpoint-row" : "",
                  ].join(" ")}
                >
                  <td>
                    {row.cdr}
                    {breakpoints.has(row.cdr) && (
                      <span className="badge badge-bp">bp</span>
                    )}
                  </td>
                  <td className="val-maxdps">{row.maxDpsCS}</td>
                  <td className="val-hardcap">{row.hardcapCS}</td>
                  <td className="val-ticks">{row.vixenTicks}</td>
                  <td>{row.vixenCDRSec.toFixed(3)}</td>
                  <td>{row.doomEffCD.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Checking Specific Values ─────────────────────────────────────────
function SpecificValues({ vixenCD, doomCD, tempChains, setTempChains }) {
  const [cdr, setCdr] = useState(53);
  const [actionSpeed, setAS] = useState(0);
  const [myCastSpeed, setMyCS] = useState(133);
  const [offset, setOffset] = useState(10);

  const tempChainsBase = tempChains;

  const summary = useMemo(
    () =>
      calcSpecific(
        cdr,
        myCastSpeed,
        actionSpeed,
        tempChainsBase,
        vixenCD,
        doomCD,
      ),
    [cdr, myCastSpeed, actionSpeed, tempChainsBase, vixenCD, doomCD],
  );

  const clampedOffset = Math.min(15, Math.max(0, offset));
  const tableRows = useMemo(() => {
    const lo = myCastSpeed - clampedOffset;
    const hi = myCastSpeed + clampedOffset;
    const rows = [];
    for (let cs = lo; cs <= hi; cs++) {
      rows.push({
        cs,
        ...calcSpecific(cdr, cs, actionSpeed, tempChainsBase, vixenCD, doomCD),
      });
    }
    return rows;
  }, [
    cdr,
    myCastSpeed,
    clampedOffset,
    actionSpeed,
    tempChainsBase,
    vixenCD,
    doomCD,
  ]);

  function wastedClass(v, type) {
    if (type === "vixen") {
      if (v < 0) return "wasted-loss"; // casting too slow, losing DPS
      if (v < 0.005) return "wasted-good";
      if (v < 0.02) return "wasted-ok";
      return "wasted-bad";
    }
    // blast
    if (v < 0.005) return "wasted-good";
    if (v < 0.015) return "wasted-ok";
    return "wasted-bad";
  }

  function vixenSummaryClass(v) {
    if (v < 0) return "loss";
    if (v < 0.005) return "good";
    if (v < 0.02) return "warn";
    return "danger";
  }
  function blastSummaryClass(v) {
    if (v < 0.005) return "good";
    if (v < 0.015) return "warn";
    return "danger";
  }

  const vixenEff = vixenCD / (1 + cdr / 100);
  const doomEffDisp = doomCD / (1 + cdr / 100);

  return (
    <div className="spec-layout">
      <div>
        <div className="panel">
          <div className="panel-title">🔍 Your Stats</div>
          <div className="field">
            <label>Temp Chains Cast Time</label>
            <input
              type="number"
              step="0.05"
              value={tempChains}
              onChange={(e) => setTempChains(parseFloat(e.target.value) || 0)}
            />
            <div className="hint">
              the base cast time of Temporal Chains (should be 0.5 at all times
              ?)
            </div>
          </div>

          <div className="field">
            <label>CDR %</label>
            <input
              type="number"
              min="0"
              max="89"
              value={cdr}
              onChange={(e) =>
                setCdr(Math.max(0, Math.min(89, parseInt(e.target.value) || 0)))
              }
            />
          </div>
          <div className="field">
            <label>Action Speed (%)</label>
            <input
              type="number"
              step="1"
              value={actionSpeed}
              onChange={(e) => setAS(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="field">
            <label>Your Cast Speed (%)</label>
            <input
              type="number"
              step="1"
              value={myCastSpeed}
              onChange={(e) => setMyCS(parseInt(e.target.value) || 0)}
            />
            <div className="hint">
              The increased cast speed value you currently have
            </div>
          </div>

          <div style={{ marginTop: "1rem", marginBottom: "0.4rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Scan Offset (±, max 15)</label>
              <input
                type="number"
                min="0"
                max="15"
                value={offset}
                onChange={(e) =>
                  setOffset(
                    Math.min(15, Math.max(0, parseInt(e.target.value) || 0)),
                  )
                }
              />
              <div className="hint">
                Shows your CS ± this value. You will always be in the middle.
              </div>
            </div>
          </div>

          <div className="derived-grid">
            <div className="derived-box">
              <div className="db-label">Vixen Eff CD</div>
              <div className="db-value">{vixenEff.toFixed(4)}s</div>
            </div>
            <div className="derived-box">
              <div className="db-label">Vixen Ticks</div>
              <div className="db-value">{summary.vixenTicks}</div>
            </div>
            <div className="derived-box">
              <div className="db-label">Server Tick</div>
              <div className="db-value">
                {summary.vixenServerCD.toFixed(3)}s
              </div>
            </div>
            <div className="derived-box">
              <div className="db-label">Doom Eff CD</div>
              <div className="db-value">{doomEffDisp.toFixed(4)}s</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="spec-summary">
          <div className="spec-summary-title">
            Results at {myCastSpeed}% Cast Speed
          </div>
          <div className="spec-summary-grid">
            <div className="ssb neutral">
              <div className="ssb-label">Cast Time</div>
              <div className="ssb-value">{summary.castTime.toFixed(4)}s</div>
            </div>
            <div className="ssb neutral">
              <div className="ssb-label">Base Cast Time</div>
              <div className="ssb-value">{tempChainsBase.toFixed(2)}s</div>
            </div>
            <div className={`ssb ${vixenSummaryClass(summary.vixenWasted)}`}>
              <div className="ssb-label">Vixen CD Wasted</div>
              <div className="ssb-value">
                {summary.vixenWasted < 0 ? "−" : "+"}
                {Math.abs(summary.vixenWasted).toFixed(4)}s
              </div>
            </div>
            <div className={`ssb ${blastSummaryClass(summary.blastWasted)}`}>
              <div className="ssb-label">Blast CD Wasted</div>
              <div className="ssb-value">{summary.blastWasted.toFixed(4)}s</div>
            </div>
          </div>
        </div>

        <div className="hint-banner">
          <span>Vixen Wasted:</span> difference between your cast time and
          Vixen's server-tick window.
          <span> Negative (purple) = casting too slowly, losing DPS.</span>{" "}
          Positive value closest to 0 is ideal.
          <br />
          <span>Blast Wasted:</span> how much of Doom Blast's cooldown is wasted
          per cast — lower is better.
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>CS %</th>
                <th>Cast Time</th>
                <th>Vixen Wasted</th>
                <th>Blast Wasted</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.cs}
                  className={row.cs === myCastSpeed ? "current-cs-row" : ""}
                >
                  <td>
                    {row.cs}
                    {row.cs === myCastSpeed && (
                      <span className="badge badge-you">you</span>
                    )}
                  </td>
                  <td>{row.castTime.toFixed(4)}</td>
                  <td className={wastedClass(row.vixenWasted, "vixen")}>
                    {row.vixenWasted < 0 ? "−" : "+"}
                    {Math.abs(row.vixenWasted).toFixed(4)}
                  </td>
                  <td className={wastedClass(row.blastWasted, "blast")}>
                    {row.blastWasted.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ImpendingDoomCalc() {
  const [activeTab, setActiveTab] = useState("cdr");

  // Tab 1 params
  const [vixenCD, setVixenCD] = useState(0.25);
  const [doomCD, setDoomCD] = useState(0.15);
  const [tempChains, setTempChains] = useState(0.5);
  const [actionSpeed, setActionSpeed] = useState(0);
  const [awakened, setAwakened] = useState(false);
  // Tab 2 independent params
  const [tempChains2, setTempChains2] = useState(0.5);
  const [awakened2, setAwakened2] = useState(false);

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header">
          <h1>Impending Doom</h1>
          <div className="subtitle">Cast Speed & CDR Calculator</div>
          <div className="divider" />
          <div className="credit">
            Originally Made by @Silenth ·{" "}
            <a href="https://docs.google.com/spreadsheets/d/1J-yVLmDhKqKNE8QecsPnZgNR2TDGDm41f-1tdC_BxQA/edit?gid=1230763965#gid=1230763965">
              og document
            </a>{" "}
            · Path of Exile
          </div>
        </div>

        <div className="sheet-tabs">
          <button
            className={`sheet-tab${activeTab === "cdr" ? " active" : ""}`}
            onClick={() => setActiveTab("cdr")}
          >
            CDR &amp; Cast Speed
          </button>
          <button
            className={`sheet-tab${activeTab === "specific" ? " active" : ""}`}
            onClick={() => setActiveTab("specific")}
          >
            Checking Specific Values
          </button>
        </div>

        <div style={{ display: activeTab === "cdr" ? "block" : "none" }}>
          <CDRTable
            vixenCD={vixenCD}
            setVixenCD={setVixenCD}
            doomCD={doomCD}
            setDoomCD={setDoomCD}
            tempChains={tempChains}
            setTempChains={setTempChains}
            actionSpeed={actionSpeed}
            setActionSpeed={setActionSpeed}
            awakened={awakened}
            setAwakened={setAwakened}
          />
          <div className="notes">
            <div className="note-card">
              <h4>Cast Speed MaxDPS</h4>
              <p>
                The cast speed to aim for in bossing (no mapping buffs). Getting
                more beyond this gives no DPS gain.
              </p>
            </div>
            <div className="note-card">
              <h4>Cast Speed Hardcap ⚠</h4>
              <p>
                Do NOT exceed this at any point — including with Onslaught or
                other temporary buffs. Exceeding it causes Doom Blast to fire
                faster than Vixen's cooldown, halving your damage.
              </p>
            </div>
            <div className="note-card">
              <h4>Breakpoints</h4>
              <p>
                No real breakpoints except 80–88% CDR where Vixen Ticks drop
                5→4. Breakpoints elsewhere are a myth — Doom Blast's cooldown
                recovers between server ticks.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: activeTab === "specific" ? "block" : "none" }}>
          <SpecificValues
            vixenCD={vixenCD}
            doomCD={doomCD}
            tempChains={tempChains2}
            setTempChains={setTempChains2}
            awakened={awakened2}
            setAwakened={setAwakened2}
          />
        </div>
      </div>
    </>
  );
}
