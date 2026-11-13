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
  const showDepth = type === "topDelve" || (type === "people" && showDelve);
  const colCount = 2 + (showClass ? 1 : 0) + (showLevel ? 1 : 0) + (showDepth ? 1 : 0) + (showAccount ? 1 : 0);

  return (
    <div
      className="terminal overlay-panel panel"
      style={{ opacity: Math.max(0, Math.min(100, opacity)) / 100 }}
    >
      {title && <h2>{title}</h2>}
      <table className="ladder">
        <thead>
          <tr>
            <th>#</th>
            <th>Character</th>
            {showClass && <th>Class</th>}
            {showLevel && <th>Level</th>}
            {showDepth && <th>Depth</th>}
            {showAccount && <th>Account</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="empty">
              <td colSpan={colCount}>waiting for ladder data…</td>
            </tr>
          )}
          {rows.map((entry, i) => (
            <tr
              key={`${entry.account?.name || "u"}-${entry.character?.name || i}`}
              className={entry.dead ? "row-dead" : undefined}
            >
              <td className={i < 3 ? `r${i + 1}` : "dim"}>{i + 1}</td>
              <td className="char">
                {entry.character?.name}
                {entry.dead && <span className="bad"> ☠</span>}
              </td>
              {showClass && <td>{entry.character?.class}</td>}
              {showLevel && <td>{entry.character?.level}</td>}
              {showDepth && (
                <td className="accent">{entry.character?.depth?.[depthMode] ?? 0}</td>
              )}
              {showAccount && <td className="dim">{entry.account?.name}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OverlayPanel;