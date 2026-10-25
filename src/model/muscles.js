// Which muscles each exercise works, and how much each muscle was trained.
//
// Every exercise has muscles with a weight:
//   1   = primary (the muscle doing most of the work, e.g. chest in bench press)
//   0.5 = secondary (helping, e.g. triceps in bench press)
// A done set then counts 1 set for primary muscles and ½ set for secondary
// ones. This "fractional" counting is how training research counts volume.

import { isDoneSet } from './sets.js';

export const MUSCLES = [
  { id: 'chest', label: 'Chest' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'rearDelts', label: 'Rear shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'forearms', label: 'Forearms' },
  { id: 'traps', label: 'Traps' },
  { id: 'lats', label: 'Lats / back' },
  { id: 'lowerBack', label: 'Lower back' },
  { id: 'abs', label: 'Abs' },
  { id: 'obliques', label: 'Obliques' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'adductors', label: 'Inner thighs' },
  { id: 'calves', label: 'Calves' },
];

export const muscleLabel = (id) => MUSCLES.find((m) => m.id === id)?.label || id;

// Rules for guessing muscles from an exercise's name. The first rule that
// matches wins, so the more specific names come first ("leg curl" before "curl").
const RULES = [
  [/leg curl|hamstring curl|nordic/, { hamstrings: 1 }],
  [/leg extension/, { quads: 1 }],
  [/side plank|russian twist|wood ?chop|oblique|pallof/, { obliques: 1, abs: 0.5 }],
  [/plank|crunch|sit-?up|leg raise|hollow|ab wheel|\babs?\b|dead bug/, { abs: 1, obliques: 0.5 }],
  [/romanian|\brdl\b|stiff/, { hamstrings: 1, glutes: 1, lowerBack: 0.5 }],
  [/deadlift/, { glutes: 1, hamstrings: 1, lowerBack: 1, quads: 0.5, traps: 0.5, forearms: 0.5 }],
  [/hip thrust|glute bridge|kickback/, { glutes: 1, hamstrings: 0.5 }],
  [/back extension|hyperextension|good morning/, { lowerBack: 1, glutes: 0.5, hamstrings: 0.5 }],
  [/lunge|split squat|step-?up/, { quads: 1, glutes: 1, adductors: 0.5 }],
  [/leg press|hack/, { quads: 1, glutes: 0.5, adductors: 0.5 }],
  [/squat/, { quads: 1, glutes: 1, adductors: 0.5, lowerBack: 0.5 }],
  [/adduct/, { adductors: 1 }],
  [/abduct/, { glutes: 1 }],
  [/calf/, { calves: 1 }],
  [/dip/, { triceps: 1, chest: 0.5, shoulders: 0.5 }],
  [/incline/, { chest: 1, shoulders: 0.5, triceps: 0.5 }],
  [/fly|flye|pec deck|crossover/, { chest: 1, shoulders: 0.5 }],
  [/bench|chest press|push-?up/, { chest: 1, triceps: 0.5, shoulders: 0.5 }],
  [/lateral raise|side raise|upright row/, { shoulders: 1, traps: 0.5 }],
  [/face pull|rear delt|reverse fly/, { rearDelts: 1, traps: 0.5 }],
  [/overhead press|shoulder press|military|arnold|\bohp\b|front raise/, { shoulders: 1, triceps: 0.5 }],
  [/shrug/, { traps: 1, forearms: 0.5 }],
  [/chin-?up/, { lats: 1, biceps: 1, rearDelts: 0.5 }],
  [/pull-?up|pulldown|pull-?down|pullover/, { lats: 1, biceps: 0.5, rearDelts: 0.5 }],
  [/row/, { lats: 1, traps: 0.5, rearDelts: 0.5, biceps: 0.5 }],
  [/triceps|pushdown|push-?down|skull|close-?grip|extension/, { triceps: 1 }],
  [/curl/, { biceps: 1, forearms: 0.5 }],
  [/hang|farmer|carry|wrist|grip/, { forearms: 1, lats: 0.5 }],
];

export function guessMuscles(name = '') {
  const n = name.toLowerCase();
  for (const [pattern, muscles] of RULES) if (pattern.test(n)) return { ...muscles };
  return {};
}

// An exercise's muscles: the ones you set in Settings, or a guess from the name.
export const musclesOf = (exercise) => exercise?.muscles || guessMuscles(exercise?.name);

// Change one muscle: off → ½ (helping) → 1 (main) → off. Returns new muscles.
export function cycleMuscle(muscles, muscle) {
  const next = { ...muscles };
  const weight = { 0: 0.5, 0.5: 1, 1: 0 }[next[muscle] || 0];
  if (weight) next[muscle] = weight;
  else delete next[muscle];
  return next;
}

// { chest: 3, triceps: 1.5, … } — sets per muscle in one workout (done sets only).
// exercisesById: a Map from indexById() in exercises.js
export function workoutMuscleSets(workout, exercisesById) {
  const load = {};
  for (const entry of workout.entries) {
    const muscles = musclesOf(exercisesById.get(entry.exerciseId));
    const sets = entry.sets.filter(isDoneSet).length;
    for (const [m, weight] of Object.entries(muscles)) load[m] = (load[m] || 0) + sets * weight;
  }
  return load;
}

// Sets per muscle over the last `days` days, including a workout in progress.
export function recentMuscleSets(workouts, exercisesById, days = 7, now = Date.now()) {
  const since = new Date(now - days * 864e5).toISOString();
  const load = {};
  for (const w of workouts) {
    if (w.startedAt < since) continue;
    for (const [m, sets] of Object.entries(workoutMuscleSets(w, exercisesById))) load[m] = (load[m] || 0) + sets;
  }
  return load;
}

// How red a muscle gets. Levels 0–4 by number of sets.
// One workout: ~8 sets for a muscle is a full session, so that's the reddest.
// One week: research finds growth keeps improving up to roughly 10–20 sets
// per muscle per week, with smaller gains towards the top of that range.
export const SCALES = {
  workout: [1, 3, 5, 8],
  week: [3, 6, 10, 15],
};

export function level(sets, scale) {
  if (!sets) return 0;
  const steps = SCALES[scale];
  let lvl = 1;
  for (let i = 1; i < steps.length; i++) if (sets >= steps[i]) lvl = i + 1;
  return lvl;
}

