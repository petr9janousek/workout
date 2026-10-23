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
  'Plank', 'Dead hang',
];

// ---- Exercise types --------------------------------------------------------
// weight: weight × reps (bench press)
// reps:   bodyweight, reps only (push-ups)
// time:     held for a time, in seconds (plank)
// assisted: bodyweight reps with weight taken off (−, assisted pull-up
//           machine or band) or added (+, weighted pull-ups). The weight is
//           saved as a signed number, so going up always means progress:
//           −30 → −25 → 0 → +5
export const EXERCISE_TYPES = [
  { id: 'weight', label: 'Weight × reps' },
  { id: 'reps', label: 'Bodyweight reps' },
  { id: 'assisted', label: 'Assisted / weighted ±' },
  { id: 'time', label: 'Timed hold' },
];

// Older exercises have no type saved yet: guess it from the name.
export function guessType(name = '') {
  const n = name.toLowerCase();
  if (/plank|hold|hang|wall sit|l-sit|hollow|isometric/.test(n)) return 'time';
  if (/assist|band|weighted (pull|chin|dip|push)/.test(n)) return 'assisted';
  if (/pull-?up|chin-?up|push-?up|\bdips?\b|sit-?up|crunch|burpee|pistol|inverted row|leg raise/.test(n)) return 'reps';
  return 'weight';
}

export const typeOf = (exercise) => exercise?.type || guessType(exercise?.name);

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

// A set "counts" once it's been ticked as done and has reps or a time.
export const isDoneSet = (set) => set.done && (num(set.reps) > 0 || num(set.time) > 0);

// 45 -> "45 s", 90 -> "1:30"
export function formatSeconds(sec) {
  const s = Math.round(num(sec));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// −20 -> "−20", 10 -> "+10", 0 -> "BW" (just bodyweight)
export function formatSigned(w, unit = '') {
  if (!w) return 'BW';
  return `${w < 0 ? '−' : '+'}${Math.abs(w)}${unit ? ' ' + unit : ''}`;
}

// "60 kg × 8 @8", "12 reps", "45 s", "−20 kg × 8". Leave out unit for a shorter version.
export function formatSet(set, type = 'weight', unit = '') {
  let text;
  if (type === 'time') text = formatSeconds(set.time);
  else if (type === 'assisted') text = `${formatSigned(num(set.weight), unit)} × ${num(set.reps)}`;
  else {
    const w = num(set.weight);
    if (type === 'reps' || !w) text = `${num(set.reps)} reps`;
    else text = `${w}${unit ? ' ' + unit : ''} × ${num(set.reps)}`;
  }
  return num(set.rpe) ? `${text} @${num(set.rpe)}` : text;
}

export function formatNumber(n) {
  return Math.round(n).toLocaleString();
}

// Totals for a workout: sets done, weight lifted (weight × reps), reps and time.
export function workoutTotals(workout) {
  const all = workout.entries.flatMap((e) => e.sets);
  const done = all.filter(isDoneSet);
  return {
    planned: all.length,
    sets: done.length,
    volume: done.reduce((sum, s) => sum + Math.max(0, num(s.weight)) * num(s.reps), 0),
    reps: done.reduce((sum, s) => sum + num(s.reps), 0),
    seconds: done.reduce((sum, s) => sum + num(s.time), 0),
  };
}

// Estimated one-rep max (Epley formula). Lets you compare
// "60 kg × 10" with "70 kg × 5" on the same scale.
export function estimated1RM(set) {
  const w = num(set.weight);
  const r = num(set.reps);
  if (w <= 0 || !r) return 0;
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
        bestReps: Math.max(...sets.map((s) => num(s.reps))),
        volume: sets.reduce((sum, s) => sum + Math.max(0, num(s.weight)) * num(s.reps), 0),
        longestTime: Math.max(...sets.map((s) => num(s.time))),
        totalTime: sets.reduce((sum, s) => sum + num(s.time), 0),
      };
    })
    .filter(Boolean)
    .reverse();
}

// ---- Progression ----------------------------------------------------------
//
// Looks at the sets from last time and suggests what to try today.
// With RPE (how hard it felt, 10 = nothing left):
//   all sets RPE 8 or easier  -> go up
//   any set RPE 9.5 or harder -> stay the same
//   in between                -> same weight, one more rep
// Without RPE: if every set hit the same reps, go up; otherwise add a rep.
//
// Returns { kind: 'up' | 'reps' | 'hold', text, sets } where `sets` are the
// suggested values for today.

const blank = (s) => ({ id: newId(), weight: s.weight ?? '', reps: s.reps ?? '', time: s.time ?? '', rpe: '', done: false });

export function suggestNext(lastSets, type, unit = 'kg', step) {
  if (!lastSets?.length) return null;
  const inc = step || (unit === 'lb' ? 5 : 2.5);
  const rpes = lastSets.map((s) => num(s.rpe)).filter(Boolean);
  const maxRpe = rpes.length ? Math.max(...rpes) : null;
  const copy = lastSets.map(blank);

  if (maxRpe != null && maxRpe >= 9.5) {
    return { kind: 'hold', text: `Last time was close to max (RPE ${maxRpe}), so repeat it`, sets: copy };
  }

  if (type === 'time') {
    const add = Math.max(...lastSets.map((s) => num(s.time))) >= 60 ? 10 : 5;
    return {
      kind: 'up',
      text: `Try holding ${add} s longer`,
      sets: copy.map((s) => ({ ...s, time: String(num(s.time) + add) })),
    };
  }

  const moreReps = (why) => ({
    kind: 'reps',
    text: why,
    sets: copy.map((s) => ({ ...s, reps: String(num(s.reps) + 1) })),
  });

  if (type === 'reps') return moreReps('Try one more rep per set');

  const top = Math.max(...lastSets.map((s) => num(s.weight)));
  const topSets = lastSets.filter((s) => num(s.weight) === top);
  const steady = topSets.every((s) => num(s.reps) >= num(topSets[0].reps));
  const easy = maxRpe != null ? maxRpe <= 8 : steady && (top > 0 || type === 'assisted');

  if (easy) {
    const next = round1(top + inc);
    let target = `${next} ${unit}`;
    if (type === 'assisted') {
      if (next < 0) target = `less assistance (${formatSigned(next, unit)})`;
      else if (next === 0) target = 'it with no assistance';
      else target = formatSigned(next, unit);
    }
    return {
      kind: 'up',
      text: maxRpe != null ? `Felt manageable (RPE ${maxRpe}), so try ${target}` : `All sets done, so try ${target}`,
      sets: copy.map((s) => (num(s.weight) === top ? { ...s, weight: String(next) } : s)),
    };
  }
  return moreReps(
    maxRpe != null ? `Tough but doable (RPE ${maxRpe}), so same weight, aim for +1 rep` : 'Reps dropped last time, so same weight, aim for +1 rep',
  );
}

// The sets to start an exercise with today: last time's sets with the
// suggestion applied, or 3 empty sets for a new exercise.
export function plannedSets(workouts, exerciseId, type, unit, step, beforeIso) {
  const last = lastTimeSets(workouts, exerciseId, beforeIso);
  if (!last) return { sets: [0, 1, 2].map(() => blank({})), suggestion: null, last: null };
  const suggestion = suggestNext(last.sets, type, unit, step);
  return { sets: suggestion.sets, suggestion, last };
}

// Is this set better (+1), worse (-1) or the same (0) as a set from last time?
export function compareSets(set, prev, type) {
  if (!prev) return 0;
  const cmp = (a, b) => Math.sign(num(a) - num(b));
  if (type === 'time') return cmp(set.time, prev.time);
  if (type === 'reps') return cmp(set.reps, prev.reps);
  return cmp(set.weight, prev.weight) || cmp(set.reps, prev.reps);
}
