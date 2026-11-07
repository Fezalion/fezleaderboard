export function Prompt({ children }) {
  return (
    <p className="line">
      <span className="prompt">fezalion@leaderboard</span>
      <span className="dim">:</span>
      <span className="path">~</span>
      <span className="dim">$</span> {children}
    </p>
  );
}

// Terminal window shared by every page: title bar, scrolling screen, status bar.
export function Shell({ title, children }) {
  return (
    <main className="terminal">
      <div className="titlebar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="title-text">{title}</span>
      </div>

      <div className="screen">{children}</div>

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
    </main>
  );
}