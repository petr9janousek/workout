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
// Suggests what to try today, from your recent sessions of an exercise.
// There are three styles to choose from in Settings (see PROGRESSION_MODES).
//
// "Starting reps" = the reps you did the first time at your current weight.
// The app uses that instead of asking you to set a rep range, so with
// "Reps, then weight" a cycle looks like:
//   60×8 → 60×9 → 60×10 → 60×10 (2nd time, confirmed) → 62.5×8 → …
//
// In every style:
//   - any set at RPE 9.5+ last time → repeat it (you were at your limit)
//   - reps dropped 2+ below the starting reps, twice in a row → go lighter
//   - no more reps than 3 sessions ago at the same weight (a plateau) → go lighter
//
// Returns { kind, text, sets }: kind is 'up' | 'reps' | 'confirm' | 'hold' | 'down',
// `sets` are the suggested values for today.

export const PROGRESSION_MODES = [
  {
    id: 'double',
    label: 'Reps, then weight',
    help: 'Add a rep each session. Once you do 2 more reps than you started that weight with, two sessions in a row, add weight and go back to the starting reps. What most coaches recommend ("double progression", the 2-for-2 rule).',
  },
  {
    id: 'linear',
    label: 'Weight only',
    help: 'Keep the reps the same. Once you get all your reps two sessions in a row, add weight. Simple, good when starting out.',
  },
  {
    id: 'rpe',
    label: 'By RPE',
    help: 'Uses how hard the sets felt. Easy (RPE 7 or less): add weight. Moderate: add a rep, or weight once you are 2 reps up. 9.5+: repeat. Without RPE it works like "Reps, then weight".',
  },
];

export const SUGGESTION_ICONS = { up: '▲', reps: '▲', confirm: '↻', hold: '=', down: '▼' };

const blank = (s) => ({ id: newId(), weight: s.weight ?? '', reps: s.reps ?? '', time: s.time ?? '', rpe: '', done: false });

// Recent sessions of one exercise, newest first: [{ date, sets }]
export function recentSessions(workouts, exerciseId, beforeIso, limit = 12) {
  const out = [];
  for (const w of finishedWorkouts(workouts)) {
    if (beforeIso && w.startedAt >= beforeIso) continue;
    const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter(isDoneSet));
    if (sets.length) out.push({ date: w.startedAt, sets });
    if (out.length >= limit) break;
  }
  return out;
}

export function suggestNext(sessions, type, settings = {}) {
  if (!sessions?.length) return null;
  const unit = settings.unit || 'kg';
  const step = settings.weightStep || (unit === 'lb' ? 5 : 2.5);
  const mode = settings.progression || 'double';

  const last = sessions[0].sets;
  const copy = last.map(blank);
  const rpes = last.map((s) => num(s.rpe)).filter(Boolean);
  const maxRpe = rpes.length ? Math.max(...rpes) : null;

  if (maxRpe != null && maxRpe >= 9.5) {
    return { kind: 'hold', text: `Last time was close to your max (RPE ${maxRpe}), so repeat it`, sets: copy };
  }

  // Timed holds and plain bodyweight reps: small steady steps.
  if (type === 'time') {
    const add = Math.max(...last.map((s) => num(s.time))) >= 60 ? 10 : 5;
    return { kind: 'up', text: `Try holding ${add} s longer`, sets: copy.map((s) => ({ ...s, time: String(num(s.time) + add) })) };
  }
  if (type === 'reps') {
    return { kind: 'reps', text: 'Try one more rep per set', sets: copy.map((s) => ({ ...s, reps: String(num(s.reps) + 1) })) };
  }

  // Weight × reps, and assisted/weighted (where the weight can be negative).
  const topOf = (sets) => Math.max(...sets.map((s) => num(s.weight)));
  const top = topOf(last);
  const repsAtTop = (sets) => sets.filter((s) => num(s.weight) === top).map((s) => num(s.reps));

  // Sessions in a row at the current weight, newest first.
  const run = [];
  for (const session of sessions) {
    if (topOf(session.sets) !== top) break;
    run.push(session);
  }
  const startReps = Math.min(...repsAtTop(run[run.length - 1].sets));
  const lastReps = repsAtTop(last);
  const prevReps = run[1] ? repsAtTop(run[1].sets) : null;
  const lowest = (reps) => Math.min(...reps);

  const describe = (w) => {
    if (type !== 'assisted') return `${w} ${unit}`;
    if (w < 0) return `less assistance (${formatSigned(w, unit)})`;
    if (w === 0) return 'it with no assistance';
    return formatSigned(w, unit);
  };
  // Change the weight of the top sets, optionally resetting their reps.
  const withWeight = (w, reps) =>
    copy.map((s) => (num(s.weight) === top ? { ...s, weight: String(w), ...(reps != null ? { reps: String(reps) } : {}) } : s));

  const up = (why, reps) => {
    const next = round1(top + step);
    const repsText = reps != null ? ` × ${reps}` : '';
    return { kind: 'up', text: `${why}, so try ${describe(next)}${repsText}`, sets: withWeight(next, reps) };
  };
  const confirm = (why) => ({ kind: 'confirm', text: `${why}, so repeat it once more, then add weight`, sets: copy });

  // Struggling at this weight two sessions in a row → go a bit lighter.
  if (prevReps && lowest(lastReps) <= startReps - 2 && lowest(prevReps) <= startReps - 2) {
    const next = round1(top - step);
    return { kind: 'down', text: `Reps dropped two sessions in a row, so try ${describe(next)} × ${startReps}`, sets: withWeight(next, startReps) };
  }

  // Stuck: 4+ sessions at this weight, and neither of the last two beat the
  // reps from 3 sessions ago → drop a step and build back up.
  // (Two sessions, so one bad day doesn't count as a plateau.)
  const total = (reps) => reps.reduce((a, b) => a + b, 0);
  if (run.length >= 4 && Math.max(total(lastReps), total(prevReps)) <= total(repsAtTop(run[3].sets))) {
    const next = round1(top - step);
    const reps = Math.max(...lastReps);
    return { kind: 'down', text: `No progress in 4 sessions at this weight, so drop to ${describe(next)} × ${reps} and build back up`, sets: withWeight(next, reps) };
  }

  // "Reps, then weight": the goal is 2 reps above where you started this weight.
  const double = () => {
    const goal = startReps + 2;
    const lastHit = lowest(lastReps) >= goal;
    const prevHit = prevReps && lowest(prevReps) >= goal;
    if (lastHit && prevHit) return up(`${goal}+ reps two sessions in a row`, startReps);
    if (lastHit) return confirm(`Reached ${goal} reps`);
    return {
      kind: 'reps',
      text: `Add a rep. At ${goal} reps for two sessions, add weight`,
      sets: copy.map((s) => (num(s.weight) === top ? { ...s, reps: String(num(s.reps) >= goal ? num(s.reps) : num(s.reps) + 1) } : s)),
    };
  };

  if (mode === 'linear') {
    const target = Math.max(...lastReps);
    const steady = (reps) => reps.every((r) => r >= reps[0]);
    const tooHard = maxRpe != null && maxRpe > 8.5;
    if (steady(lastReps) && !tooHard) {
      if (prevReps && steady(prevReps) && lowest(prevReps) >= lowest(lastReps)) return up('All reps done two sessions in a row');
      return confirm('All reps done');
    }
    return {
      kind: 'hold',
      text: tooHard ? `Hard work (RPE ${maxRpe}), so stay at this weight` : `Stay at this weight and try to get ${target} reps on every set`,
      sets: copy.map((s) => (num(s.weight) === top ? { ...s, reps: String(target) } : s)),
    };
  }

  if (mode === 'rpe') {
    if (maxRpe == null) {
      const fallback = double();
      return { ...fallback, text: `${fallback.text} (no RPE logged)` };
    }
    if (maxRpe <= 7) return up(`Felt easy (RPE ${maxRpe})`);
    if (lowest(lastReps) >= startReps + 2) return up(`${startReps + 2} reps at RPE ${maxRpe}`, startReps);
    return { kind: 'reps', text: `Moderate effort (RPE ${maxRpe}), so add a rep`, sets: copy.map((s) => (num(s.weight) === top ? { ...s, reps: String(num(s.reps) + 1) } : s)) };
  }

  return double();
}

// The sets to start an exercise with today: last time's sets with the
// suggestion applied, or 3 empty sets for an exercise you haven't done before.
export function plannedSets(workouts, exerciseId, type, settings, beforeIso) {
  const sessions = recentSessions(workouts, exerciseId, beforeIso);
  if (!sessions.length) return { sets: [0, 1, 2].map(() => blank({})), suggestion: null, last: null };
  const suggestion = suggestNext(sessions, type, settings);
  return { sets: suggestion.sets, suggestion, last: sessions[0] };
}

// Is this set better (+1), worse (-1) or the same (0) as a set from last time?
export function compareSets(set, prev, type) {
  if (!prev) return 0;
  const cmp = (a, b) => Math.sign(num(a) - num(b));
  if (type === 'time') return cmp(set.time, prev.time);
  if (type === 'reps') return cmp(set.reps, prev.reps);
  return cmp(set.weight, prev.weight) || cmp(set.reps, prev.reps);
}
