// Plan files: a plan you can send to someone (a partner, a trainee) and they
// import it. Exercises go by name, with their type and muscles, so the plan
// works on a phone that has never seen them. No workouts, no weights.
//
//   { app: 'workout', kind: 'plan', version: 1,
//     plan: { name, days: [{ name, items: [{ name, type, muscles?, sets, extra? }] }] } }

import { createExercise, typeOf } from './exercises.js';
import { createDay, createPlan } from './plans.js';

export function planToFile(plan, exercisesById) {
  return {
    app: 'workout',
    kind: 'plan',
    version: 1,
    plan: {
      name: plan.name,
      days: plan.days.map((day) => ({
        name: day.name,
        items: day.items
          .filter((item) => exercisesById.has(item.exerciseId))
          .map((item) => {
            const e = exercisesById.get(item.exerciseId);
            return {
              name: e.name,
              type: typeOf(e),
              ...(e.muscles ? { muscles: e.muscles } : {}),
              sets: item.sets,
              ...(item.extra ? { extra: true } : {}),
            };
          }),
      })),
    },
  };
}

// File text → the plan in the file, or an Error saying what's wrong.
export function readPlanFile(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a Workout plan.');
  }
  if (data?.app === 'workout' && data.kind !== 'plan') throw new Error('This is a backup, not a plan. Restore it in Settings → Backup.');
  const plan = data?.plan;
  if (data?.app !== 'workout' || data.kind !== 'plan' || !plan?.name || !Array.isArray(plan.days)) {
    throw new Error('This file is not a Workout plan.');
  }
  for (const day of plan.days) {
    if (!day?.name || !Array.isArray(day.items) || day.items.some((i) => !i?.name || !(i.sets > 0))) {
      throw new Error('This plan file is damaged.');
    }
  }
  return plan;
}

// A plan from a file, using your exercises where the names match (any
// capitalisation) and creating the others. Returns { plan, created }.
// The plan's name gets " (2)", " (3)"… if you already have one called that.
export function planFromFile(filePlan, exercises, plans = []) {
  const known = new Map(exercises.map((e) => [e.name.toLowerCase(), e]));
  const created = [];
  const idFor = (item) => {
    let exercise = known.get(item.name.toLowerCase());
    if (!exercise) {
      exercise = { ...createExercise(item.name, item.type), ...(item.muscles ? { muscles: item.muscles } : {}) };
      known.set(item.name.toLowerCase(), exercise);
      created.push(exercise);
    }
    return exercise.id;
  };
  const days = filePlan.days.map((d) =>
    createDay(d.name, d.items.map((i) => ({ exerciseId: idFor(i), sets: Math.min(10, Math.round(i.sets)), ...(i.extra ? { extra: true } : {}) }))),
  );
  const names = new Set(plans.map((p) => p.name));
  let name = filePlan.name;
  for (let n = 2; names.has(name); n++) name = `${filePlan.name} (${n})`;
  return { plan: createPlan(name, days), created };
}
