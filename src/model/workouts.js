// Workouts and the history built from them.
//
// A workout is a plain object, saved as one record in the database:
//   { id, startedAt, finishedAt, notes, entries: [entry, …], name?, planId?, dayId? }
//   finishedAt: null while the workout is in progress
//   name, planId, dayId: set when it was started from a plan day (see plans.js)
// An entry is one exercise inside a workout:
//   { id, exerciseId, sets: [set, …], suggestion? }
//   suggestion: the "try heavier" hint shown when it was added (see progression.js)

import { newId } from './ids.js';
import { isDoneSet, val, estimated1RM } from './sets.js';

const round1 = (n) => Math.round(n * 10) / 10;

// meta: optional { name, planId, dayId } when started from a plan day.
export function createWorkout(entries = [], startedAt = new Date().toISOString(), meta = {}) {
  return { id: newId(), startedAt, finishedAt: null, notes: '', entries, ...meta };
}

// Only the hint's kind and text are kept; its suggested sets became `sets`.
export function createEntry(exerciseId, sets, suggestion = null) {
  return { id: newId(), exerciseId, sets, suggestion: suggestion ? { kind: suggestion.kind, text: suggestion.text } : null };
}

// Finished workouts, newest first.
export const finishedWorkouts = (workouts) =>
  workouts.filter((w) => w.finishedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt));

export const activeWorkout = (workouts) => workouts.find((w) => !w.finishedAt) || null;

// Finish a workout: keep only ticked sets, drop exercises left with none.
// Returns { workout, skipped }: workout is null if nothing was done at all;
// skipped is how many unticked sets were left out.
export function finishWorkout(workout, finishedAt = new Date().toISOString()) {
  const allSets = workout.entries.flatMap((e) => e.sets);
  const skipped = allSets.filter((s) => !isDoneSet(s)).length;
  const entries = workout.entries
    .map(({ suggestion, ...entry }) => ({ ...entry, sets: entry.sets.filter(isDoneSet) }))
    .filter((e) => e.sets.length > 0);
  return { workout: entries.length ? { ...workout, entries, finishedAt } : null, skipped };
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
