import { THEME } from "./ladderConfig";

// Pure presentational panel: given rows + display options, renders the
// overlay table. Used by OverlayView (the real OBS page) and by the
// live preview in Overlays.jsx, so the two can never visually drift apart.
function OverlayPanel({
  rows,
  type,
  depthMode,
  showClass,
  showLevel = true,
  showAccount,
  showDelve,
  title,
  opacity = 100,
}) {
  return (
    <div
      className={`inline-block rounded-lg border-2 ${THEME.borderPrimary} ${THEME.accentTertiary} ${THEME.glowLarge} overflow-hidden`}
      style={{
        backdropFilter: "blur(2px)",
        opacity: Math.max(0, Math.min(100, opacity)) / 100,
      }}
    >
      {title && (
        <div
          className={`px-4 py-2 text-lg font-bold ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary} ${THEME.accentPrimary}`}
        >
          {title}
        </div>
      )}
      <table className="border-collapse">
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className={`px-4 py-3 ${THEME.textTertiary} text-sm`}>
                Waiting for ladder data…
              </td>
            </tr>
          )}
          {rows.map((entry, i) => (
            <tr
              key={`${entry.account?.name || "u"}-${entry.character?.name || i}`}
              className={`${i % 2 === 0 ? THEME.rowEven : THEME.rowOdd} ${THEME.rowBorder} ${entry.dead ? THEME.rowDead : ""}`}
            >
              <td
                className={`px-3 py-1.5 text-sm font-mono font-semibold ${THEME.textTertiary}`}
              >
                {i + 1}
              </td>
              <td
                className={`px-3 py-1.5 text-sm font-semibold ${THEME.textPrimary}`}
              >
                {entry.character?.name}
                {entry.dead && <span className="ml-1 text-red-400">☠</span>}
              </td>
              {showClass && (
                <td className={`px-3 py-1.5 text-sm ${THEME.textSecondary}`}>
                  {entry.character?.class}
                </td>
              )}
              {showLevel && (
                <td
                  className={`px-3 py-1.5 text-sm font-mono ${THEME.textPrimary}`}
                >
                  Lv {entry.character?.level}
                </td>
              )}
              {(type === "topDelve" || (type === "people" && showDelve)) && (
                <td
                  className={`px-3 py-1.5 text-sm font-mono ${THEME.linkColor}`}
                >
                  Depth {entry.character?.depth?.[depthMode] ?? 0}
                </td>
              )}
              {showAccount && (
                <td className={`px-3 py-1.5 text-sm ${THEME.textSecondary}`}>
                  {entry.account?.name}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OverlayPanel;
