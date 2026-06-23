/** Recently-viewed labs, persisted in localStorage (client only, best-effort). */
const KEY = "sandbox.recent";
const MAX = 8;

export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = [id, ...getRecent().filter((x) => x !== id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / disabled storage */
  }
}
