// Sets: one line of a workout, e.g. 60 kg × 8.
//
// A set is a plain object:
//   { id, weight, reps, time, rpe, done, doneAt, target? }
//   weight, reps, time (seconds), rpe: numbers, or null when empty
//   done:   ticked ✓ (only done sets count)
//   doneAt: when it was ticked (ISO date text), drives the rest timer
//   target: { weight, reps, time } the plan for a set not done yet (from last
//           time + the suggestion, or from the set above). Shown grey in the
//           empty fields; ticking the set fills the empty fields from it.
//           Finished workouts don't keep it.

import { newId } from './ids.js';
import { formatNumber, formatSeconds, formatSigned } from './format.js';

// null-safe number: empty fields count as 0 in calculations.
export const val = (n) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

// A new set. Only the values are taken from `from`; RPE and done always start fresh.
export function newSet(from = {}, done = false) {
  return {
    id: newId(),
    weight: from.weight ?? null,
    reps: from.reps ?? null,
    time: from.time ?? null,
    rpe: null,
    done,
    doneAt: null,
  };
}

export const copySets = (sets, done = false) => sets.map((s) => newSet(s, done));

const VALUE_FIELDS = ['weight', 'reps', 'time'];

// What a field shows: your own value, or else the planned one.
export const shown = (set, field) => set[field] ?? set.target?.[field] ?? null;

// The set as a plan: its values move into `target` (grey until confirmed).
export const asTarget = (set) => ({
  ...set,
  weight: null, reps: null, time: null,
  target: Object.fromEntries(VALUE_FIELDS.map((f) => [f, shown(set, f)])),
});

// Ticking a set: empty fields take the planned values.
export const tickSet = (set, doneAt = new Date().toISOString()) => ({
  ...set,
  ...Object.fromEntries(VALUE_FIELDS.map((f) => [f, shown(set, f)])),
  done: true,
  doneAt,
});

// A set without its plan, for saving a finished workout.
export const withoutTarget = ({ target, ...set }) => set;

// You typed `value` into `field` of set number `index`: the sets below that
// aren't done and have no value of their own get it as their plan.
// (Fill in the first set of a new exercise and the rest follow.)
export function planBelow(sets, index, field, value) {
  if (!VALUE_FIELDS.includes(field) || value == null) return sets;
  return sets.map((s, i) => (i > index && !s.done && s[field] == null ? { ...s, target: { ...s.target, [field]: value } } : s));
}

export const emptySets = (count = 3, done = false) => Array.from({ length: count }, () => newSet({}, done));

// One more set like the one before it: as a plan during a workout, or with
// real values when fixing a finished workout (done).
export function nextSet(sets, done = false) {
  const last = sets[sets.length - 1] || {};
  const values = Object.fromEntries(VALUE_FIELDS.map((f) => [f, shown(last, f)]));
  return done ? newSet(values, true) : asTarget(newSet(values));
}

// A set counts once it's ticked and has reps or a time.
export const isDoneSet = (set) => Boolean(set.done) && (val(set.reps) > 0 || val(set.time) > 0);

// "60 kg × 8 (RPE 8)", "12 reps", "45 s", "−20 kg × 8".
export function formatSet(set, type = 'weight') {
  let text;
  const w = val(set.weight);
  const reps = val(set.reps);
  if (type === 'time') text = formatSeconds(set.time);
  else if (type === 'assisted') text = `${formatSigned(w, 'kg')} × ${reps}`;
  else if (type === 'reps' || !w) text = `${reps} reps`;
  else text = `${formatNumber(w)} kg × ${reps}`;
  return set.rpe ? `${text} (RPE ${formatNumber(set.rpe)})` : text;
}

// Several sets in one short line, sets of the same weight grouped:
// "42.5 kg × 10, 10, 9 (RPE 8)", "40 kg × 10 · 42.5 kg × 8, 8", "12, 10 reps",
// "45 s, 40 s". The RPE shown is the hardest set's.
export function formatSetList(sets, type = 'weight') {
  if (!sets.length) return '';
  const rpe = Math.max(0, ...sets.map((s) => val(s.rpe)));
  const tail = rpe ? ` (RPE ${formatNumber(rpe)})` : '';
  if (type === 'time') return sets.map((s) => formatSeconds(s.time)).join(', ') + tail;
  if (type === 'reps') return `${sets.map((s) => val(s.reps)).join(', ')} reps${tail}`;
  const groups = [];
  for (const s of sets) {
    const w = val(s.weight);
    if (groups.at(-1)?.weight === w) groups.at(-1).reps.push(val(s.reps));
    else groups.push({ weight: w, reps: [val(s.reps)] });
  }
  const weightText = (w) => (type === 'assisted' ? formatSigned(w, 'kg') : w ? `${formatNumber(w)} kg` : null);
  return (
    groups.map((g) => (weightText(g.weight) ? `${weightText(g.weight)} × ${g.reps.join(', ')}` : `${g.reps.join(', ')} reps`)).join(' · ') + tail
  );
}

// Is `set` better (+1), worse (−1) or the same (0) as `prev` from last time?
export function compareSets(set, prev, type) {
  if (!prev) return 0;
  const cmp = (field) => Math.sign(val(shown(set, field)) - val(prev[field]));
  if (type === 'time') return cmp('time');
  if (type === 'reps') return cmp('reps');
  return cmp('weight') || cmp('reps');
}

// Estimated one-rep max (Epley formula), to compare 60 kg × 10 with 70 kg × 5.
export function estimated1RM(set) {
  const w = val(set.weight);
  const r = val(set.reps);
  if (w <= 0 || !r) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}
