/** Achievement progress lives only in this visitor's browser (spec §3). */

const KEY = "ehsan.achievements";
const COUNTS = "ehsan.achievement-counts";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / private mode: progress just isn't saved */
  }
}

export const unlockedIds = (): string[] => read<string[]>(KEY, []);
export const isUnlocked = (id: string) => unlockedIds().includes(id);

export function markUnlocked(id: string) {
  const ids = unlockedIds();
  if (ids.includes(id)) return false;
  write(KEY, [...ids, id]);
  return true;
}

/** Counters for "do X N times" triggers; `uniq` counts distinct values (e.g. 5 different stars). */
export function bump(id: string, uniq?: string): number {
  const all = read<Record<string, number | string[]>>(COUNTS, {});
  if (uniq !== undefined) {
    const set = new Set((all[id] as string[]) ?? []);
    set.add(uniq);
    all[id] = [...set];
    write(COUNTS, all);
    return set.size;
  }
  const n = ((all[id] as number) ?? 0) + 1;
  all[id] = n;
  write(COUNTS, all);
  return n;
}
