import { Shell, Prompt } from "./Terminal";
import { leagueCode, linkProps } from "./nav";

export default function Home({ leagues, unknown, navigate }) {
  return (
    <Shell title="fezalion@leaderboard: ~">
      <Prompt>whoami</Prompt>
      <h1 className="title">FezLeaderboard</h1>

      {unknown && (
        <p className="line bad" style={{ marginBottom: 16 }}>
          league “{unknown}” not found
        </p>
      )}

      <Prompt>ls leagues/</Prompt>
      <ul className="links">
        {leagues.map((league) => {
          const code = leagueCode(league);
          return (
            <li key={code}>
              <a {...linkProps(code, navigate)}>{league.label}</a>
              <span className="desc"># {code}</span>
            </li>
          );
        })}
      </ul>

      <Prompt>
        <span className="cursor" aria-hidden="true" />
      </Prompt>
    </Shell>
  );
}