// A league's URL codename comes from `code` in ladderConfig (falls back to `value`).
export const leagueCode = (league) => league.code || league.value;

// Home is "/", a league is "/<codename>"
export const leagueHref = (code) => (code ? `/${encodeURIComponent(code)}` : "/");

// Props for an <a> that navigates without a page reload (ctrl/cmd-click still opens a new tab).
export function linkProps(code, navigate) {
  return {
    href: leagueHref(code),
    onClick: (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(code);
    },
  };
}