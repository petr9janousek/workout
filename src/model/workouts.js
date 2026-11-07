// Workouts and the history built from them.
//
// A workout is a plain object, saved as one record in the database:
//   { id, startedAt, finishedAt, notes, entries: [entry, …], name?, planId?, dayId?, movesDone?, movesSkipped? }
//   finishedAt: null while the workout is in progress
//   name, planId, dayId: set when it was started from a plan day (see plans.js)
//   movesDone, movesSkipped: warm-up and stretches ticked off or skipped while it runs (warmup.js)
// An entry is one exercise inside a workout:
//   { id, exerciseId, sets: [set, …], suggestion? }
//   suggestion: the "try heavier" hint shown when it was added (see progression.js)
//   swappedFrom, swapKept: a swapped plan exercise, and whether it was kept in the plan (while it runs)
//   note: your note on this exercise today (shown next time, see lastNoteOf; an
//         exercise with a note but no sets done is kept when finishing)

import { newId } from './ids.js';
import { isDoneSet, val, estimated1RM, withoutTarget } from './sets.js';

const round1 = (n) => Math.round(n * 10) / 10;

// meta: optional { name, planId, dayId } when started from a plan day.
export function createWorkout(entries = [], startedAt = new Date().toISOString(), meta = {}) {
  return { id: newId(), startedAt, finishedAt: null, notes: '', entries, ...meta };
}

// The hint is kept with plain copies of its sets' values, so you can go
// back to it after choosing "Same as last time".
export function createEntry(exerciseId, sets, suggestion = null) {
  if (!suggestion) return { id: newId(), exerciseId, sets, suggestion: null };
  const { kind, title, text } = suggestion;
  return { id: newId(), exerciseId, sets, suggestion: { kind, title, text, sets: suggestion.sets.map(({ weight, reps, time }) => ({ weight, reps, time })) } };
}

// Finished workouts, newest first. Many screens ask for this many times per
// render, so the result is remembered for each list (lists are never changed
// in place, so a changed list is a new array and gets worked out again).
const finishedCache = new WeakMap();
export function finishedWorkouts(workouts) {
  let list = finishedCache.get(workouts);
  if (!list) {
    list = workouts.filter((w) => w.finishedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    finishedCache.set(workouts, list);
  }
  return list;
}

export const activeWorkout = (workouts) => workouts.find((w) => !w.finishedAt) || null;

// Finish a workout: keep only ticked sets, drop exercises left with none.
// Returns { workout, skipped }: workout is null if nothing was done at all;
// skipped is how many unticked sets were left out.
// `skipped` counts unticked sets, except those of healthy extras (skipping
// those is fine, so finishing doesn't ask about them).
// The warm-up and stretch ticks (movesDone, movesSkipped; see warmup.js) and
// whose turn it is (turn; see partner.js) are only for while it runs.
export function finishWorkout({ movesDone, movesSkipped, turn, ...workout }, finishedAt = new Date().toISOString()) {
  const skipped = workout.entries.filter((e) => !e.extra).flatMap((e) => e.sets).filter((s) => !isDoneSet(s)).length;
  const entries = workout.entries
    .map(({ suggestion, swappedFrom, swapKept, note, ...entry }) => ({
      ...entry,
      ...(note?.trim() ? { note: note.trim() } : {}),
      sets: entry.sets.filter(isDoneSet).map(withoutTarget),
    }))
    .filter((e) => e.sets.length > 0 || e.note); // a skipped exercise stays for its note
  return { workout: entries.some((e) => e.sets.length) ? { ...workout, entries, finishedAt } : null, skipped };
}

// Totals for a workout: sets done (out of planned), weight lifted, reps, time held.
// Assistance (negative weight) doesn't count as weight lifted.
export function workoutTotals(workout) {
  const all = workout.entries.flatMap((e) => e.sets);
  const done = all.filter(isDoneSet);
  const sum = (fn) => done.reduce((total, s) => total + fn(s), 0);
  return {
    planned: all.length,
    sets: done.length,
    volume: sum((s) => Math.max(0, val(s.weight)) * val(s.reps)),
    reps: sum((s) => val(s.reps)),
    seconds: sum((s) => val(s.time)),
  };
}

// The done sets of one exercise in one workout.
const doneSetsOf = (workout, exerciseId) =>
  workout.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter(isDoneSet));

// Recent sessions of one exercise, newest first: [{ date, sets }].
// Only workouts that started before `beforeIso` (so today's doesn't count).
export function recentSessions(workouts, exerciseId, beforeIso = null, limit = 12) {
  const sessions = [];
  for (const w of finishedWorkouts(workouts)) {
    if (beforeIso && w.startedAt >= beforeIso) continue;
    const sets = doneSetsOf(w, exerciseId);
    if (sets.length) sessions.push({ date: w.startedAt, sets });
    if (sessions.length >= limit) break;
  }
  return sessions;
}

export const lastSession = (workouts, exerciseId, beforeIso) => recentSessions(workouts, exerciseId, beforeIso, 1)[0] || null;

// The note from the last finished workout that had this exercise (done or
// skipped), started before `beforeIso`: { date, note }, or null when that
// time had no note. Shown on the exercise's card next time.
export function lastNoteOf(workouts, exerciseId, beforeIso = null) {
  for (const w of finishedWorkouts(workouts)) {
    if (beforeIso && w.startedAt >= beforeIso) continue;
    const entry = w.entries.find((e) => e.exerciseId === exerciseId);
    if (entry) return entry.note ? { date: w.startedAt, note: entry.note } : null;
  }
  return null;
}

// Every note written on one exercise in finished workouts, newest first:
// [{ workoutId, entryId, date, note }] (the exercise's page lists them).
export const notesOf = (workouts, exerciseId) =>
  finishedWorkouts(workouts).flatMap((w) =>
    w.entries.filter((e) => e.exerciseId === exerciseId && e.note).map((e) => ({ workoutId: w.id, entryId: e.id, date: w.startedAt, note: e.note })),
  );

// Every session of one exercise, oldest first, with the numbers the Progress
// screen charts and the personal records.
export function exerciseHistory(workouts, exerciseId) {
  return finishedWorkouts(workouts)
    .map((w) => {
      const sets = doneSetsOf(w, exerciseId);
      if (!sets.length) return null;
      const max = (fn) => Math.max(...sets.map(fn));
      const sum = (fn) => sets.reduce((total, s) => total + fn(s), 0);
      return {
        workoutId: w.id,
        date: w.startedAt,
        sets,
        topWeight: max((s) => val(s.weight)),
        best1RM: round1(max(estimated1RM)),
        volume: sum((s) => Math.max(0, val(s.weight)) * val(s.reps)),
        bestReps: max((s) => val(s.reps)),
        totalReps: sum((s) => val(s.reps)),
        longestTime: max((s) => val(s.time)),
        totalTime: sum((s) => val(s.time)),
      };
    })
    .filter(Boolean)
    .reverse();
}

// How many workouts include an exercise (an exercise in use can't be deleted).
export const countWorkoutsWith = (workouts, exerciseId) =>
  workouts.filter((w) => w.entries.some((e) => e.exerciseId === exerciseId)).length;

// The last finished workout before this one that was the same plan day
// (or, without a plan, had the same name), to compare with. null if none.
export function previousLike(workouts, workout) {
  const same = (w) => (workout.dayId ? w.dayId === workout.dayId : Boolean(workout.name) && w.name === workout.name);
  return finishedWorkouts(workouts).find((w) => w.id !== workout.id && !w.kind && w.startedAt < workout.startedAt && same(w)) || null;
}
