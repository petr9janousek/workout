// Progression: what to try today, based on your recent sessions of an exercise.
//
// Three styles, chosen in Settings (PROGRESSION_MODES). None of them needs a
// rep range: the "starting reps" are the reps you did the first time at your
// current weight. With the default style a cycle looks like:
//   60×8 → 60×9 → 60×10 → 60×10 (2nd time, confirmed) → 62.5×8 → …
//
// In every style:
//   - any set at RPE 9.5+ last time            → repeat it (you were at your limit)
//   - a set 4+ reps above the session before    → heavier: it was easier than expected
//     (as much heavier as that set shows; high reps on their own are fine)
//   - reps 2+ below the starting reps, twice    → one step lighter
//   - no progress over 4 sessions at one weight → one step lighter, build back up
//
// suggestNext() returns { kind, title, text, sets }:
//   kind:  'up' (heavier / longer) | 'reps' (+1 rep) | 'confirm' (repeat once to confirm)
//          | 'hold' (repeat) | 'down' (lighter)
//   title: what to do today, with the numbers ("One more rep: 42.5 kg × 11, 11, 10")
//   text:  why, and what comes next
//   sets:  the suggested sets for today (new, unticked). In a workout they
//          become the grey planned values (see sets.js).

import { copySets, emptySets, nextSet, val, asTarget, formatSetList } from './sets.js';
import { recentSessions, createEntry, createWorkout } from './workouts.js';
import { typeOf } from './exercises.js';
import { formatNumber, formatSigned } from './format.js';
import { settingsFor, weightStepFor } from './settings.js';

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

// Reps above the plan (or the session before) that mean "this was easy".
export const WAY_ABOVE = 4;
// Without a plan (the first time), a set this long asks "felt easy?".
export const HIGH_REPS = 15;

const round1 = (n) => Math.round(n * 10) / 10;
const lowest = (list) => Math.min(...list);
const total = (list) => list.reduce((a, b) => a + b, 0);

// After a set of `reps` at `weight` that was easy: the weight for sets of
// `targetReps` (by estimated 1-rep max), in whole weight steps, 1 to 3.
// For assisted exercises (where the 1RM formula doesn't apply): one step.
export function heavierFor(weight, reps, targetReps, type, settings) {
  const step = weightStepFor(weight, settings);
  if (type === 'assisted' || weight <= 0) return round1(weight + step);
  const wanted = (weight * (1 + reps / 30)) / (1 + targetReps / 30);
  const steps = Math.min(3, Math.max(1, Math.round((wanted - weight) / step)));
  return round1(weight + steps * step);
}

// Reps to aim for at a new, heavier weight: where you started, if that's a
// usual number, otherwise 10.
const repsAfterJump = (startReps) => (startReps >= 6 && startReps <= 15 ? startReps : 10);

// settings: { weightStep, progression } (weightStep: a number or 'auto',
// see weightStepFor() in settings.js; use settingsFor() for an exercise's own step)
export function suggestNext(sessions, type, settings = {}) {
  if (!sessions?.length) return null;
  const mode = settings.progression || 'double';
  const list = (sets) => formatSetList(sets, type);

  const last = sessions[0].sets;
  const copy = copySets(last);
  const rpes = last.map((s) => val(s.rpe)).filter(Boolean);
  const maxRpe = rpes.length ? Math.max(...rpes) : null;

  if (maxRpe != null && maxRpe >= 9.5) {
    return { kind: 'hold', title: 'Same as last time: you were at your limit', text: `A set was at RPE ${formatNumber(maxRpe)}. Repeat it before going up`, sets: copy };
  }

  // Timed holds and plain bodyweight reps: small steady steps.
  if (type === 'time') {
    const add = Math.max(...last.map((s) => val(s.time))) >= 60 ? 10 : 5;
    const sets = copy.map((s) => ({ ...s, time: val(s.time) + add }));
    return { kind: 'up', title: `Hold ${add} s longer: ${list(sets)}`, text: 'Holds grow by 5 s at a time (10 s past a minute)', sets };
  }
  if (type === 'reps') {
    const sets = copy.map((s) => ({ ...s, reps: val(s.reps) + 1 }));
    return { kind: 'reps', title: `One more rep: ${list(sets)}`, text: 'Bodyweight exercises grow a rep at a time', sets };
  }

  // Weight × reps, and assisted/weighted (where the weight can be negative).
  const topOf = (sets) => Math.max(...sets.map((s) => val(s.weight)));
  const top = topOf(last);
  const step = weightStepFor(top, settings);
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

  // "45 kg (+2.5)" / "less assistance: −25 kg (+2.5)"
  const weightChange = (w) => {
    const change = `(${formatSigned(round1(w - top))})`;
    if (type !== 'assisted') return `${formatNumber(w)} kg ${change}`;
    if (w < 0) return `less assistance, ${formatSigned(w, 'kg')} ${change}`;
    if (w === 0) return 'no assistance';
    return `${formatSigned(w, 'kg')} ${change}`;
  };
  // The top sets with a new weight (and optionally new reps); other sets unchanged.
  const withWeight = (weight, reps) =>
    copy.map((s) => (isTop(s) ? { ...s, weight, ...(reps != null ? { reps } : {}) } : s));
  const withReps = (fn) => copy.map((s) => (isTop(s) ? { ...s, reps: fn(val(s.reps)) } : s));

  const heavier = (next, reps, why, extra = reps != null ? `, back to ${reps} reps` : '') => ({
    kind: 'up',
    title: `Heavier: ${weightChange(next)}${extra}`,
    text: why,
    sets: withWeight(next, reps),
  });
  const up = (why, reps) => heavier(round1(top + step), reps, why);
  const down = (why, reps) => {
    const next = round1(top - step);
    return { kind: 'down', title: `A bit lighter: ${weightChange(next)}, then build back up`, text: why, sets: withWeight(next, reps) };
  };
  const confirm = (why) => ({ kind: 'confirm', title: 'Same again: once more, then heavier', text: why, sets: copy });
  const plusOne = (goal, why) => {
    const sets = withReps((r) => (r >= goal ? r : r + 1));
    return { kind: 'reps', title: `One more rep: ${list(sets)}`, text: why, sets };
  };

  // A set far above the session before: it was easier than expected.
  if (prevReps) {
    const most = Math.max(...lastReps);
    const more = most - Math.max(...prevReps);
    if (more >= WAY_ABOVE) {
      const reps = repsAfterJump(startReps);
      const next = heavierFor(top, most, reps, type, settings);
      return heavier(next, reps, `${most} reps was ${more} more than the time before, so the weight is easy for you now`, `. ${most} reps was ${more} more than before`);
    }
  }

  // Struggling at this weight two sessions in a row.
  if (prevReps && lowest(lastReps) <= startReps - 2 && lowest(prevReps) <= startReps - 2) {
    return down('Your reps dropped two sessions in a row. A step back now makes the next weeks go up again', startReps);
  }
  // Plateau: 4+ sessions at this weight and neither of the last two beat the
  // session 3 back. (Two sessions, so one bad day doesn't count.)
  if (run.length >= 4 && Math.max(total(lastReps), total(prevReps)) <= total(repsAtTop(run[3].sets))) {
    return down('No progress in 4 sessions at this weight. A step back, then build up again', Math.max(...lastReps));
  }

  // "Reps, then weight": the goal is 2 reps above where you started this weight.
  const double = () => {
    const goal = startReps + 2;
    const lastHit = lowest(lastReps) >= goal;
    const prevHit = prevReps && lowest(prevReps) >= goal;
    if (lastHit && prevHit) return up(`${goal}+ reps on every set, two sessions in a row. More weight now; the reps start lower and build up again`, startReps);
    if (lastHit) return confirm(`You got ${goal} reps on every set. Do it once more to be sure, then the weight goes up`);
    return plusOne(goal, `You're building reps at this weight. At ${goal} reps on every set, two sessions in a row, the weight goes up`);
  };

  if (mode === 'linear') {
    const target = Math.max(...lastReps);
    const steady = (reps) => reps.every((r) => r >= reps[0]);
    const tooHard = maxRpe != null && maxRpe > 8.5;
    if (steady(lastReps) && !tooHard) {
      if (prevReps && steady(prevReps) && lowest(prevReps) >= lowest(lastReps)) return heavier(round1(top + step), null, 'All your reps, two sessions in a row');
      return confirm('All your reps done. Do it once more, then the weight goes up');
    }
    return {
      kind: 'hold',
      title: `Same weight: ${target} reps on every set`,
      text: tooHard ? `It was hard work (RPE ${formatNumber(maxRpe)}), so stay at this weight` : 'Get all your reps first, then the weight goes up',
      sets: withReps(() => target),
    };
  }

  if (mode === 'rpe') {
    if (maxRpe == null) {
      const fallback = double();
      return { ...fallback, text: `${fallback.text} (no RPE logged)` };
    }
    if (maxRpe <= 7) return heavier(round1(top + step), null, `It felt easy (RPE ${formatNumber(maxRpe)})`);
    if (lowest(lastReps) >= startReps + 2) return up(`${startReps + 2} reps at RPE ${formatNumber(maxRpe)}`, startReps);
    return plusOne(Infinity, `Moderate effort (RPE ${formatNumber(maxRpe)}), so add a rep`);
  }

  return double();
}

// ---- Planning today's workout -------------------------------------------------
// ctx: { workouts, settings, startedAt } — startedAt keeps today's workout
// out of "last time".

// A new entry for an exercise: last time's sets with the suggestion applied
// (as grey planned values), or empty sets for an exercise done for the first time.
// `done`: when fixing an old workout, added sets count as done straight away.
// `setCount`: how many sets (from a plan); otherwise last time's count, or 3.
export function planEntry(exercise, { workouts, settings, startedAt }, done = false, setCount = null) {
  const sessions = recentSessions(workouts, exercise.id, startedAt);
  if (!sessions.length) return createEntry(exercise.id, emptySets(setCount || 3, done));
  const suggestion = suggestNext(sessions, typeOf(exercise), settingsFor(settings, exercise));
  const sets = resizeSets(suggestion.sets, setCount).map((s) => (done ? { ...s, done: true } : asTarget({ ...s, done: false })));
  return createEntry(exercise.id, sets, done ? null : suggestion);
}

// Cut or extend (copying the last set) to `count` sets; null = leave as is.
function resizeSets(sets, count) {
  if (!count || count === sets.length) return sets;
  if (count < sets.length) return sets.slice(0, count);
  const more = [...sets];
  while (more.length < count) more.push(nextSet(more, true));
  return more;
}

// A new workout, optionally with the exercises of an earlier one ("repeat").
// A repeat keeps the earlier one's name and plan day, so it's compared with
// it and counts as that day of the plan.
export function planWorkout(template, exercisesById, { workouts, settings }, startedAt = new Date().toISOString()) {
  const entries = (template?.entries || [])
    .map((e) => ({ exercise: exercisesById.get(e.exerciseId), extra: e.extra }))
    .filter((e) => e.exercise)
    .map(({ exercise, extra }) => {
      const entry = planEntry(exercise, { workouts, settings, startedAt });
      return extra ? { ...entry, extra: true } : entry;
    });
  const { name, planId, dayId } = template || {};
  return createWorkout(entries, startedAt, { ...(name ? { name } : {}), ...(planId ? { planId, dayId } : {}) });
}
