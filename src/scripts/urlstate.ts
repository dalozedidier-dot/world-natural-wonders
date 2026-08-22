/** Chaque filtre et chaque lieu possèdent une URL partageable. */
export type State = Record<string, string | string[] | undefined>;

export function readState(): State {
  const p = new URLSearchParams(location.search);
  const out: State = {};
  for (const [k, v] of p.entries()) {
    if (!v) continue;
    out[k] = v.includes(',') ? v.split(',').filter(Boolean) : v;
  }
  return out;
}

export function writeState(state: State, replace = true) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) {
    if (v == null) continue;
    const s = Array.isArray(v) ? v.join(',') : v;
    if (s) p.set(k, s);
  }
  const qs = p.toString();
  const url = location.pathname + (qs ? `?${qs}` : '') + location.hash;
  if (replace) history.replaceState(null, '', url); else history.pushState(null, '', url);
}

export const asArray = (v: string | string[] | undefined): string[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];
