import { Shell, Prompt } from "./Terminal";
import { leagueCode, linkProps } from "./nav";

// Same layout as the fezalion.xyz homepage, listing leagues instead of subdomains.
export default function Home({ leagues, unknown, navigate }) {
  return (
    <Shell title="fezalion@xyz: ~" home>
      <Prompt host="fezalion@xyz">whoami</Prompt>
      <h1 className="name">Fezalion</h1>

      {unknown && (
        <p className="line bad" style={{ marginBottom: 16 }}>
          league “{unknown}” not found
        </p>
      )}

      <Prompt host="fezalion@xyz">ls leagues/</Prompt>
      <ul className="links">
        {leagues.map((league) => {
          const code = leagueCode(league);
          return (
            <li key={code} className={league.finished ? "finished" : undefined}>
              <a {...linkProps(code, navigate)}>{code}</a>
              <span className="desc">
                # {league.label}
                {league.finished && <span className="tag"> [finished]</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <Prompt host="fezalion@xyz">
        <span className="cursor" aria-hidden="true" />
      </Prompt>
    </Shell>
  );
}