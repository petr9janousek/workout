// Exercises and their types.
//
// An exercise is a plain object:
//   { id, name, type, muscles? }
//   type:    'weight' | 'reps' | 'assisted' | 'time'   (see EXERCISE_TYPES)
//   muscles: optional { chest: 1, triceps: 0.5, … }, see muscles.js.
//            When missing, muscles are guessed from the name.

import { newId } from './ids.js';

export const EXERCISE_TYPES = [
  { id: 'weight', label: 'Weight × reps' }, //       bench press: weight and reps
  { id: 'reps', label: 'Bodyweight reps' }, //       push-ups: reps only
  { id: 'assisted', label: 'Assisted / weighted ±' }, // pull-ups with − assistance or + added weight.
  //   The weight is a signed number, so going up is always progress: −30 → −25 → 0 → +5
  { id: 'time', label: 'Timed hold' }, //            plank: seconds
];

export const STARTER_EXERCISES = [
  'Bench press', 'Squat', 'Deadlift', 'Overhead press', 'Barbell row',
  'Pull-up', 'Lat pulldown', 'Seated cable row', 'Leg press', 'Romanian deadlift',
  'Hip thrust', 'Lunge', 'Leg curl', 'Leg extension', 'Calf raise',
  'Dumbbell curl', 'Triceps pushdown', 'Lateral raise', 'Incline dumbbell press', 'Push-up',
  'Plank', 'Dead hang',
];

// Guess an exercise's type from its name.
export function guessType(name = '') {
  const n = name.toLowerCase();
  if (/plank|hold|hang|wall sit|l-sit|hollow|isometric/.test(n)) return 'time';
  if (/assist|band(ed)?[ -](pull-?up|chin-?up|dip)|weighted (pull|chin|dip|push)/.test(n)) return 'assisted';
  if (/pull-?up|chin-?up|push-?up|\bdips?\b|sit-?up|crunch|burpee|pistol|inverted row|leg raise|dead ?bug|bird ?dog|pull-?apart/.test(n)) return 'reps';
  return 'weight';
}

export const typeOf = (exercise) => exercise?.type || guessType(exercise?.name);

export function createExercise(name, type = guessType(name), id = newId()) {
  return { id, name: name.trim(), type };
}

// The starter list, with fixed ids so creating it twice can't duplicate it.
export const starterExercises = () => STARTER_EXERCISES.map((name, i) => createExercise(name, guessType(name), `starter-${i}`));

// A fast lookup by id: byId.get(id) → exercise. Build it once, use it everywhere.
export const indexById = (exercises) => new Map(exercises.map((e) => [e.id, e]));

export const exerciseName = (exercise) => exercise?.name || 'Deleted exercise';

// Exercises done for the first time with a name like "Assisted pull-up" or
// "Band pull-up" start with the weight on − (assistance).
export const startsNegative = (exercise) => typeOf(exercise) === 'assisted' && /assist|band/i.test(exercise?.name || '');

// Search and filter exercises: by text in the name, and/or by a muscle they
// work (main or helping; main ones first). Sorted by name otherwise.
// musclesOf: pass muscles.js's musclesOf (kept as a parameter so this file
// doesn't depend on muscles.js).
export function findExercises(exercises, { query = '', muscle = null, musclesOf } = {}) {
  const q = query.trim().toLowerCase();
  const weight = (e) => (muscle ? musclesOf(e)[muscle] || 0 : 1);
  return exercises
    .filter((e) => e.name.toLowerCase().includes(q) && weight(e) > 0)
    .sort((a, b) => weight(b) - weight(a) || a.name.localeCompare(b.name));
}
