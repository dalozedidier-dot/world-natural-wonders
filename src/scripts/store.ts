/** Listes personnelles, conservées uniquement dans le navigateur. Aucun compte, aucun serveur. */
export type ListName = 'favorites' | 'seen' | 'someday';
const KEY = 'wnw:lists:v1';
type Lists = Record<ListName, string[]>;
const empty = (): Lists => ({ favorites: [], seen: [], someday: [] });

export function read(): Lists {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return { ...empty(), ...parsed };
  } catch { return empty(); }
}
export function write(lists: Lists) {
  try { localStorage.setItem(KEY, JSON.stringify(lists)); } catch {}
  document.dispatchEvent(new CustomEvent('wnw:lists', { detail: lists }));
}
export function has(list: ListName, id: string) { return read()[list].includes(id); }
export function toggle(list: ListName, id: string) {
  const lists = read();
  const i = lists[list].indexOf(id);
  if (i >= 0) lists[list].splice(i, 1); else lists[list].push(id);
  write(lists);
  return lists[list].includes(id);
}
