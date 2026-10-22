// Small helper functions used across the app.

// A unique id for each exercise, workout and set.
// (crypto.randomUUID only exists on https/localhost, so we fall back.)
export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const STARTER_EXERCISES = [
  'Bench press', 'Squat', 'Deadlift', 'Overhead press', 'Barbell row',
  'Pull-up', 'Lat pulldown', 'Seated cable row', 'Leg press', 'Romanian deadlift',
  'Hip thrust', 'Lunge', 'Leg curl', 'Leg extension', 'Calf raise',
  'Dumbbell curl', 'Triceps pushdown', 'Lateral raise', 'Incline dumbbell press', 'Push-up',
];

// ---- Dates ---------------------------------------------------------------

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' });
}

export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- Sets & numbers ------------------------------------------------------

// Turns what was typed into a number. Accepts "62,5" as well as "62.5".
export function num(v) {
  if (v === '' || v == null) return 0;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// A set "counts" once it's been ticked as done and has some reps.
export const isDoneSet = (set) => set.done && num(set.reps) > 0;

// "60 × 8", or "60 kg × 8" when a unit is given, or "8 reps" with no weight.
export function formatSet(set, unit) {
  const w = num(set.weight);
  if (!w) return `${set.reps} reps`;
  return unit ? `${w} ${unit} × ${set.reps}` : `${w} × ${set.reps}`;
}

// Estimated one-rep max (Epley formula). Lets you compare
// "60 kg × 10" with "70 kg × 5" on the same scale.
export function estimated1RM(set) {
  const w = num(set.weight);
  const r = num(set.reps);
  if (!w || !r) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}

export const round1 = (n) => Math.round(n * 10) / 10;

// ---- History lookups -----------------------------------------------------

// Finished workouts, newest first.
export function finishedWorkouts(workouts) {
  return workouts
    .filter((w) => w.finishedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

// The done sets of an exercise from the most recent finished workout
// before `beforeIso` (or ever, if not given).
export function lastTimeSets(workouts, exerciseId, beforeIso) {
  for (const w of finishedWorkouts(workouts)) {
    if (beforeIso && w.startedAt >= beforeIso) continue;
    const sets = w.entries
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => e.sets.filter(isDoneSet));
    if (sets.length) return { date: w.startedAt, sets };
  }
  return null;
}

// One data point per workout for an exercise, oldest first.
export function exerciseHistory(workouts, exerciseId) {
  return finishedWorkouts(workouts)
    .map((w) => {
      const sets = w.entries
        .filter((e) => e.exerciseId === exerciseId)
        .flatMap((e) => e.sets.filter(isDoneSet));
      if (!sets.length) return null;
      return {
        workoutId: w.id,
        date: w.startedAt,
        sets,
        topWeight: Math.max(...sets.map((s) => num(s.weight))),
        best1RM: round1(Math.max(...sets.map(estimated1RM))),
        totalReps: sets.reduce((sum, s) => sum + num(s.reps), 0),
        volume: sets.reduce((sum, s) => sum + num(s.weight) * num(s.reps), 0),
      };
    })
    .filter(Boolean)
    .reverse();
}
