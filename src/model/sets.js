// Sets: one line of a workout, e.g. 60 kg × 8.
//
// A set is a plain object:
//   { id, weight, reps, time, rpe, done, doneAt }
//   weight, reps, time (seconds), rpe: numbers, or null when empty
//   done:   ticked ✓ (only done sets count)
//   doneAt: when it was ticked (ISO date text), drives the rest timer

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

export const emptySets = (count = 3, done = false) => Array.from({ length: count }, () => newSet({}, done));

// One more set, copying the values of the one before it.
export const nextSet = (sets, done = false) => newSet(sets[sets.length - 1] || {}, done);

// A set counts once it's ticked and has reps or a time.
export const isDoneSet = (set) => Boolean(set.done) && (val(set.reps) > 0 || val(set.time) > 0);

// "60 kg × 8 @8", "12 reps", "45 s", "−20 kg × 8". Leave out unit for a shorter version.
export function formatSet(set, type = 'weight', unit = '') {
  let text;
  const w = val(set.weight);
  const reps = val(set.reps);
  if (type === 'time') text = formatSeconds(set.time);
  else if (type === 'assisted') text = `${formatSigned(w, unit)} × ${reps}`;
  else if (type === 'reps' || !w) text = `${reps} reps`;
  else text = `${formatNumber(w)}${unit ? ' ' + unit : ''} × ${reps}`;
  return set.rpe ? `${text} @${formatNumber(set.rpe)}` : text;
}

// Is `set` better (+1), worse (−1) or the same (0) as `prev` from last time?
export function compareSets(set, prev, type) {
  if (!prev) return 0;
  const cmp = (a, b) => Math.sign(val(a) - val(b));
  if (type === 'time') return cmp(set.time, prev.time);
  if (type === 'reps') return cmp(set.reps, prev.reps);
  return cmp(set.weight, prev.weight) || cmp(set.reps, prev.reps);
}

// Estimated one-rep max (Epley formula), to compare 60 kg × 10 with 70 kg × 5.
export function estimated1RM(set) {
  const w = val(set.weight);
  const r = val(set.reps);
  if (w <= 0 || !r) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}
