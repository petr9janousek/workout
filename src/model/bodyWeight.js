// Body weight, optional (Settings → Body weight). One entry per day:
//   [{ date: '2026-10-25', weight: 62.4 }, …] oldest first
// Kept in the settings as one list, so backups and restores include it.

// The list with `weight` for that day (replacing that day's entry);
// weight null removes the day.
export function logBodyWeight(list = [], date, weight) {
  const others = list.filter((e) => e.date !== date);
  const next = weight == null ? others : [...others, { date, weight }];
  return next.sort((a, b) => a.date.localeCompare(b.date));
}

// The change over the last `days` days (the oldest entry in that window to
// the newest), or null with fewer than two entries in it.
export function bodyWeightChange(list = [], days = 30, now = new Date()) {
  const since = new Date(now.getTime() - days * 864e5).toISOString().slice(0, 10);
  const recent = list.filter((e) => e.date >= since);
  if (recent.length < 2) return null;
  return Math.round((recent.at(-1).weight - recent[0].weight) * 10) / 10;
}
