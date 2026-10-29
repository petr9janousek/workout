// Personal records: a set that beats every earlier set of the same exercise.
//
//   weight × reps:  heavier than ever, or a higher estimated 1RM
//                   (more reps at a weight, e.g. 60×8 → 60×9)
//   bodyweight:     more reps than ever in one set
//   timed hold:     longer than ever
//   assisted ±:     a better load (less assistance or more added weight),
//                   or more reps at your best load
//
// Earlier sets of the same workout count too, so repeating a record on the
// next set doesn't give a second trophy. The first time you do an exercise
// there's nothing to beat, so no records.

import { estimated1RM, isDoneSet, val } from './sets.js';
import { recentSessions, finishedWorkouts } from './workouts.js';
import { typeOf } from './exercises.js';

const EMPTY = { weight: -Infinity, oneRM: 0, reps: 0, time: 0, repsAtTop: 0 };

// The best so far, after adding one more set.
export function addToBest(best, set, type) {
  const weight = val(set.weight);
  return {
    weight: Math.max(best.weight, weight),
    oneRM: Math.max(best.oneRM, estimated1RM(set)),
    reps: Math.max(best.reps, val(set.reps)),
    time: Math.max(best.time, val(set.time)),
    repsAtTop: weight > best.weight ? val(set.reps) : weight === best.weight ? Math.max(best.repsAtTop, val(set.reps)) : best.repsAtTop,
  };
}

export const bestOf = (sets, type) => sets.reduce((best, s) => addToBest(best, s, type), EMPTY);

// Does this set beat the best so far?
export function beats(set, best, type) {
  if (type === 'time') return val(set.time) > best.time;
  if (type === 'reps') return val(set.reps) > best.reps;
  const weight = val(set.weight);
  if (type === 'assisted') return weight > best.weight || (weight === best.weight && val(set.reps) > best.repsAtTop);
  if (weight <= 0 || !val(set.reps)) return false;
  return weight > best.weight || estimated1RM(set) > best.oneRM + 0.01;
}

// Ids of the record sets in a list of sets (in order), given all earlier sets.
export function recordSetIds(sets, earlierSets, type) {
  const ids = new Set();
  if (!earlierSets.length) return ids;
  let best = bestOf(earlierSets, type);
  for (const set of sets.filter(isDoneSet)) {
    if (beats(set, best, type)) ids.add(set.id);
    best = addToBest(best, set, type);
  }
  return ids;
}

// Every set of an exercise in finished workouts that started before `beforeIso`.
export const setsBefore = (workouts, exerciseId, beforeIso) =>
  recentSessions(workouts, exerciseId, beforeIso, Infinity).flatMap((s) => s.sets);

// How many records a workout has, over all its exercises.
export function countRecords(workout, workouts, exercisesById) {
  return workout.entries.reduce((count, entry) => {
    const type = typeOf(exercisesById.get(entry.exerciseId));
    return count + recordSetIds(entry.sets, setsBefore(workouts, entry.exerciseId, workout.startedAt), type).size;
  }, 0);
}

// The record sets of a workout: [{ exerciseId, set }, …] in workout order.
export function workoutRecords(workout, workouts, exercisesById) {
  return workout.entries.flatMap((entry) => {
    const type = typeOf(exercisesById.get(entry.exerciseId));
    const ids = recordSetIds(entry.sets, setsBefore(workouts, entry.exerciseId, workout.startedAt), type);
    return entry.sets.filter((s) => ids.has(s.id)).map((set) => ({ exerciseId: entry.exerciseId, set }));
  });
}

// Records from workouts in the last `days` days, newest workout first:
// [{ workout, exerciseId, set }, …]
export function recentRecords(workouts, exercisesById, days = 7, now = Date.now()) {
  const since = now - days * 864e5;
  return finishedWorkouts(workouts)
    .filter((w) => !w.kind && Date.parse(w.startedAt) >= since)
    .flatMap((workout) => workoutRecords(workout, workouts, exercisesById).map((r) => ({ workout, ...r })));
}
