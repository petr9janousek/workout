// Bringing data saved by older versions of the app up to date.
//
// Used when the app starts and when a backup is restored, so old backups
// keep working. Pure functions: data in, data out, no database access.
//
// Versions:
//   1 (v0.1)     exercises have no type
//   2 (v0.2–0.3) numbers in sets are saved as typed text ("62,5", "-30", "")
//   3 (v0.4)     numbers are numbers, empty is null; hints store only kind + text

import { guessType } from '../model/exercises.js';
import { parseNumber } from '../model/format.js';

export const SCHEMA_VERSION = 3;

// "62,5" → 62.5, "" / "-" / undefined → null, numbers stay as they are.
const toNumber = (v) => (typeof v === 'number' ? v : parseNumber(v) ?? null);

function migrateSet(set) {
  return {
    id: set.id,
    weight: toNumber(set.weight),
    reps: toNumber(set.reps),
    time: toNumber(set.time),
    rpe: toNumber(set.rpe),
    done: Boolean(set.done),
    doneAt: set.doneAt ?? null,
  };
}

function migrateWorkout(workout) {
  return {
    id: workout.id,
    startedAt: workout.startedAt,
    finishedAt: workout.finishedAt ?? null,
    notes: workout.notes ?? '',
    entries: (workout.entries || []).map((entry) => ({
      id: entry.id,
      exerciseId: entry.exerciseId,
      sets: (entry.sets || []).map(migrateSet),
      suggestion: entry.suggestion ? { kind: entry.suggestion.kind, text: entry.suggestion.text } : null,
    })),
  };
}

function migrateExercise(exercise) {
  return { ...exercise, type: exercise.type || guessType(exercise.name) };
}

// data: { exercises, workouts, settings: [{ key, value }] }, as saved in the
// database or in a backup. Returns the same shape, up to date.
export function migrate(data) {
  const settings = (data.settings || []).filter((s) => s.key !== 'schemaVersion');
  return {
    exercises: (data.exercises || []).map(migrateExercise),
    workouts: (data.workouts || []).map(migrateWorkout),
    settings: [...settings, { key: 'schemaVersion', value: SCHEMA_VERSION }],
  };
}

export const schemaVersionOf = (data) => (data.settings || []).find((s) => s.key === 'schemaVersion')?.value || 1;

export const needsMigration = (data) => schemaVersionOf(data) < SCHEMA_VERSION;
