// Progression: what to try today, based on your recent sessions of an exercise.
//
// Three styles, chosen in Settings (PROGRESSION_MODES). None of them needs a
// rep range: the "starting reps" are the reps you did the first time at your
// current weight. With the default style a cycle looks like:
//   60×8 → 60×9 → 60×10 → 60×10 (2nd time, confirmed) → 62.5×8 → …
//
// In every style:
//   - any set at RPE 9.5+ last time            → repeat it (you were at your limit)
//   - reps 2+ below the starting reps, twice    → one step lighter
//   - no progress over 4 sessions at one weight → one step lighter, build back up
//
// suggestNext() returns { kind, text, sets }:
//   kind: 'up' (heavier / longer) | 'reps' (+1 rep) | 'confirm' (repeat once to confirm)
//         | 'hold' (repeat) | 'down' (lighter)
//   text: the explanation shown to the user
//   sets: the suggested sets for today (new, unticked)

import { copySets, emptySets, val } from './sets.js';
import { recentSessions, createEntry, createWorkout } from './workouts.js';
import { typeOf } from './exercises.js';
import { formatNumber, formatSigned } from './format.js';

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

const round1 = (n) => Math.round(n * 10) / 10;
const lowest = (list) => Math.min(...list);
const total = (list) => list.reduce((a, b) => a + b, 0);

// settings: { unit, weightStep, progression }
export function suggestNext(sessions, type, settings = {}) {
  if (!sessions?.length) return null;
  const unit = settings.unit || 'kg';
  const step = settings.weightStep || (unit === 'lb' ? 5 : 2.5);
  const mode = settings.progression || 'double';

  const last = sessions[0].sets;
  const copy = copySets(last);
  const rpes = last.map((s) => val(s.rpe)).filter(Boolean);
  const maxRpe = rpes.length ? Math.max(...rpes) : null;

  if (maxRpe != null && maxRpe >= 9.5) {
    return { kind: 'hold', text: `Last time was close to your max (RPE ${maxRpe}), so repeat it`, sets: copy };
  }

  // Timed holds and plain bodyweight reps: small steady steps.
  if (type === 'time') {
    const add = Math.max(...last.map((s) => val(s.time))) >= 60 ? 10 : 5;
    return { kind: 'up', text: `Try holding ${add} s longer`, sets: copy.map((s) => ({ ...s, time: val(s.time) + add })) };
  }
  if (type === 'reps') {
    return { kind: 'reps', text: 'Try one more rep per set', sets: copy.map((s) => ({ ...s, reps: val(s.reps) + 1 })) };
  }

  // Weight × reps, and assisted/weighted (where the weight can be negative).
  const topOf = (sets) => Math.max(...sets.map((s) => val(s.weight)));
  const top = topOf(last);
  const isTop = (s) => val(s.weight) === top;
  const repsAtTop = (sets) => sets.filter(isTop).map((s) => val(s.reps));

  // Sessions in a row at the current weight, newest first.
  const run = [];
  for (const session of sessions) {
    if (topOf(session.sets) !== top) break;
    run.push(session);
  }
  const startReps = lowest(repsAtTop(run[run.length - 1].sets));
  const lastReps = repsAtTop(last);
  const prevReps = run[1] ? repsAtTop(run[1].sets) : null;

  const describe = (w) => {
    if (type !== 'assisted') return `${formatNumber(w)} ${unit}`;
    if (w < 0) return `less assistance (${formatSigned(w, unit)})`;
    if (w === 0) return 'it with no assistance';
    return formatSigned(w, unit);
  };
  // The top sets with a new weight (and optionally new reps); other sets unchanged.
  const withWeight = (weight, reps) =>
    copy.map((s) => (isTop(s) ? { ...s, weight, ...(reps != null ? { reps } : {}) } : s));
  const withReps = (fn) => copy.map((s) => (isTop(s) ? { ...s, reps: fn(val(s.reps)) } : s));

  const up = (why, reps) => {
    const next = round1(top + step);
    return { kind: 'up', text: `${why}, so try ${describe(next)}${reps != null ? ` × ${reps}` : ''}`, sets: withWeight(next, reps) };
  };
  const down = (why, reps) => {
    const next = round1(top - step);
    return { kind: 'down', text: `${why}, so try ${describe(next)} × ${reps}`, sets: withWeight(next, reps) };
  };
  const confirm = (why) => ({ kind: 'confirm', text: `${why}, so repeat it once more, then add weight`, sets: copy });

  // Struggling at this weight two sessions in a row.
  if (prevReps && lowest(lastReps) <= startReps - 2 && lowest(prevReps) <= startReps - 2) {
    return down('Reps dropped two sessions in a row', startReps);
  }
  // Plateau: 4+ sessions at this weight and neither of the last two beat the
  // session 3 back. (Two sessions, so one bad day doesn't count.)
  if (run.length >= 4 && Math.max(total(lastReps), total(prevReps)) <= total(repsAtTop(run[3].sets))) {
    return down('No progress in 4 sessions at this weight', Math.max(...lastReps));
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
      sets: withReps((r) => (r >= goal ? r : r + 1)),
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
      sets: withReps(() => target),
    };
  }

  if (mode === 'rpe') {
    if (maxRpe == null) {
      const fallback = double();
      return { ...fallback, text: `${fallback.text} (no RPE logged)` };
    }
    if (maxRpe <= 7) return up(`Felt easy (RPE ${maxRpe})`);
    if (lowest(lastReps) >= startReps + 2) return up(`${startReps + 2} reps at RPE ${maxRpe}`, startReps);
    return { kind: 'reps', text: `Moderate effort (RPE ${maxRpe}), so add a rep`, sets: withReps((r) => r + 1) };
  }

  return double();
}

// ---- Planning today's workout -------------------------------------------------
// ctx: { workouts, settings, startedAt } — startedAt keeps today's workout
// out of "last time".

// A new entry for an exercise: last time's sets with the suggestion applied,
// or 3 empty sets for an exercise done for the first time.
// `done`: when fixing an old workout, added sets count as done straight away.
export function planEntry(exercise, { workouts, settings, startedAt }, done = false) {
  const sessions = recentSessions(workouts, exercise.id, startedAt);
  if (!sessions.length) return createEntry(exercise.id, emptySets(3, done));
  const suggestion = suggestNext(sessions, typeOf(exercise), settings);
  const sets = suggestion.sets.map((s) => ({ ...s, done }));
  return createEntry(exercise.id, sets, done ? null : suggestion);
}

// A new workout, optionally with the exercises of an earlier one ("repeat").
export function planWorkout(template, exercisesById, { workouts, settings }, startedAt = new Date().toISOString()) {
  const entries = (template?.entries || [])
    .map((e) => exercisesById.get(e.exerciseId))
    .filter(Boolean)
    .map((exercise) => planEntry(exercise, { workouts, settings, startedAt }));
  return createWorkout(entries, startedAt);
}
