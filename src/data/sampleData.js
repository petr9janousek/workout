// Sample data for trying the app out: about 8 weeks of training on a
// ready-made plan, with weights going up slowly, a missed week, a few
// personal records and body weight now and then. Settings → For testing. (In data/ because it builds what the database holds.)
// It replaces everything, so it's only for testing.

import { starterExercises, createExercise, typeOf } from '../model/exercises.js';
import { planFromTemplate } from '../model/plans.js';
import { PLAN_TEMPLATES } from '../model/planTemplates.js';
import { withExtras } from '../model/extras.js';
import { createWorkout, createEntry } from '../model/workouts.js';
import { createActivity } from '../model/activities.js';
import { newId } from '../model/ids.js';
import { weightStepFor, settingsToList, DEFAULT_SETTINGS } from '../model/settings.js';
import { dayKey } from '../model/calendar.js';
import { SCHEMA_VERSION } from './migrations.js';

// Starting weights (kg) for a man; a woman's start at about 60%.
const START = {
  'Squat': 60, 'Bench press': 50, 'Deadlift': 80, 'Romanian deadlift': 50, 'Overhead press': 30,
  'Barbell row': 45, 'Lat pulldown': 45, 'Seated cable row': 40, 'Leg press': 100, 'Hip thrust': 60,
  'Incline dumbbell press': 16, 'Lateral raise': 7, 'Leg curl': 30, 'Leg extension': 35, 'Dumbbell curl': 10,
  'Triceps pushdown': 20, 'Calf raise': 40, 'Bulgarian split squat': 12, 'Glute kickback': 15,
  'Cable pull-through': 25, 'Dumbbell shoulder press': 14, 'Cable fly': 12, 'Hip abduction': 35, 'Face pull': 15,
  'Pallof press': 10, 'Single-leg Romanian deadlift': 10, 'Shoulder external rotation': 4, 'Incline bench press': 45,
};

// A small repeatable "random" number from 0 to 1, so the data is the same every time.
const wobble = (n) => (Math.sin(n * 12.9898) * 43758.5453) % 1 + (Math.sin(n * 12.9898) * 43758.5453 < 0 ? 1 : 0);

// One exercise's sets in week `week` (0 = first).
function setsFor(exercise, count, week, body, n) {
  const type = typeOf(exercise);
  const set = (fields, k) => ({ id: newId(), weight: null, reps: null, time: null, rpe: k === count - 1 ? 8 + (wobble(n + k) > 0.5 ? 1 : 0) : null, done: true, doneAt: null, ...fields });
  return Array.from({ length: count }, (_, k) => {
    if (type === 'time') return set({ time: 30 + week * 5 }, k);
    if (type === 'reps') return set({ reps: 8 + week - (k === count - 1 ? 1 : 0) }, k);
    if (type === 'assisted') return set({ weight: -30 + 2.5 * Math.floor(week / 2), reps: 8 }, k);
    const start = (START[exercise.name] || 20) * (body === 'female' ? 0.6 : 1);
    const step = weightStepFor(start);
    const weight = Math.round((start + step * Math.floor(week / 2)) / step) * step;
    return set({ weight, reps: 8 + (week % 2) * 2 - (k === count - 1 ? 1 : 0) }, k);
  });
}

// Everything the database holds: { exercises, workouts, plans, settings: [{ key, value }] }.
// keep: settings to carry over (body, name).
export function sampleData({ body = null, name = '' } = {}, now = new Date()) {
  const template = PLAN_TEMPLATES.find((t) => t.id === (body === 'female' ? 'hourglass-3' : body === 'male' ? 'v-taper-3' : 'full-body-3'));
  const exercises = starterExercises();
  const byName = new Map(exercises.map((e) => [e.name.toLowerCase(), e]));
  const idForName = (name) => {
    if (!byName.has(name.toLowerCase())) {
      const e = createExercise(name);
      exercises.push(e);
      byName.set(name.toLowerCase(), e);
    }
    return byName.get(name.toLowerCase()).id;
  };
  const plan = planFromTemplate(withExtras(template), idForName);
  const byId = new Map(exercises.map((e) => [e.id, e]));

  // Mon / Wed / Fri at 18:00 for the past 8 weeks; week 5 missed, one week only twice.
  const monday = new Date(now);
  monday.setHours(18, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 8 * 7);
  const workouts = [];
  let dayIndex = 0, n = 0;
  for (let week = 0; week < 8; week++) {
    if (week === 4) continue;
    for (const offset of week === 6 ? [0, 3] : [0, 2, 4]) {
      const start = new Date(monday);
      start.setDate(start.getDate() + week * 7 + offset);
      if (start > now) continue;
      const day = plan.days[dayIndex++ % plan.days.length];
      const entries = day.items
        .filter((item) => !item.extra || wobble(++n) > 0.3) // extras sometimes skipped
        .map((item) => {
          const entry = createEntry(item.exerciseId, setsFor(byId.get(item.exerciseId), item.sets, week, body, ++n));
          return item.extra ? { ...entry, extra: true } : entry;
        });
      const workout = createWorkout(entries, start.toISOString(), { name: day.name, planId: plan.id, dayId: day.id });
      workouts.push({ ...workout, finishedAt: new Date(start.getTime() + (50 + 10 * wobble(++n)) * 60000).toISOString() });
    }
  }

  // Other activities: a Saturday run most weeks, a dance class now and then,
  // and a short walk (too short to count as an active day).
  for (let week = 0; week < 8; week++) {
    const day = (offset, hour) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + week * 7 + offset);
      d.setHours(hour, 0, 0, 0);
      return d;
    };
    const saturday = day(5, 9);
    if (week % 4 !== 3 && saturday <= now) {
      workouts.push(createActivity({ activity: 'run', minutes: 30 + 5 * (week % 3), effort: 'moderate', distance: Math.round((4.5 + week * 0.2) * 10) / 10 }, saturday.toISOString()));
    }
    const thursday = day(3, 19);
    if (week % 3 === 1 && thursday <= now) workouts.push(createActivity({ activity: 'dance', minutes: 60, effort: 'hard', notes: 'Salsa' }, thursday.toISOString()));
  }
  const walk = new Date(now.getTime() - 864e5);
  workouts.push(createActivity({ activity: 'walk', minutes: 15, effort: 'easy' }, walk.toISOString()));

  // Body weight about twice a week, drifting down slowly.
  const startWeight = body === 'female' ? 64 : 82;
  const bodyWeights = [];
  for (let d = 56; d >= 0; d -= 3 + (d % 2)) {
    const date = new Date(now.getTime() - d * 864e5);
    bodyWeights.push({ date: dayKey(date), weight: Math.round((startWeight - (56 - d) * 0.03 + (wobble(d * 7 + 3) - 0.5) * 1.2) * 10) / 10 });
  }

  const settings = {
    ...DEFAULT_SETTINGS,
    body,
    name,
    activePlanId: plan.id,
    setupDone: true,
    bodyWeights,
  };
  return {
    exercises,
    workouts,
    plans: [plan],
    settings: [...settingsToList(settings), { key: 'schemaVersion', value: SCHEMA_VERSION }],
  };
}
