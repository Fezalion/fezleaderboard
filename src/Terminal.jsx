export function Prompt({ children, host = "fezalion@leaderboard" }) {
  return (
    <p className="line">
      <span className="prompt">{host}</span>
      <span className="dim">:</span>
      <span className="path">~</span>
      <span className="dim">$</span> {children}
    </p>
  );
}

// Terminal window shared by every page: title bar, scrolling screen, status bar.
// `home` gives the bare fezalion.xyz look: larger text, roomier padding, no status bar.
export function Shell({ title, home = false, children }) {
  return (
    <main className={home ? "terminal terminal-home" : "terminal"}>
      <div className="titlebar">
        <div className="dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
        <span className="title-text">{title}</span>
        <a className="titlebar-link" href="https://fezalion.xyz">
          ← fezalion.xyz
        </a>
      </div>

      <div className="screen">{children}</div>

      {!home && (
        <footer className="statusbar">
          <span>FezLeaderboard &copy; 2025 &ndash; 2026 &mdash; Created by Fezalion</span>
          <span className="sep">|</span>
          <a
            href="https://github.com/sponsors/Fezalion"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sponsor me ❤️
          </a>
          <span className="sep">|</span>
          <a href="https://impendingdoom.fezalion.xyz">Impending Doom Calc</a>
          <span className="sep">|</span>
          <a href="https://leaderboard.fezalion.xyz/overlays">OBS Overlay Builder</a>
        </footer>
      )}
    </main>
  );
}