// Plans (splits): a list of training days you go through in order,
// e.g. Push → Pull → Legs → Push → …
//
// A plan is a plain object, saved as one record in the database:
//   { id, name, templateId, createdAt, days: [day, …] }
//   day:  { id, name, items: [{ exerciseId, sets }] }   sets = planned number of sets
//
// Days have no weekday on purpose: the next day is simply the one after the
// last one you did, so a missed gym day never breaks the plan.

import { newId } from './ids.js';
import { finishedWorkouts, createWorkout } from './workouts.js';
import { planEntry } from './progression.js';
import { muscleSets, addLoads } from './muscles.js';

export const createDay = (name, items = []) => ({ id: newId(), name, items });

export function createPlan(name, days = [], templateId = null) {
  return { id: newId(), name, templateId, createdAt: new Date().toISOString(), days };
}

// A plan from a template (planTemplates.js).
// idForName(name) → the id of the exercise with that name (creating it if needed).
export function planFromTemplate(template, idForName) {
  const days = template.days.map(([name, items]) =>
    createDay(name, items.map(([exerciseName, sets]) => ({ exerciseId: idForName(exerciseName), sets }))),
  );
  return createPlan(template.name, days, template.id);
}

// The most recent finished workout that was a day of this plan.
export const lastPlanWorkout = (plan, workouts) => finishedWorkouts(workouts).find((w) => w.planId === plan.id) || null;

// Which day is next: the one after the last one done (wrapping round), or the first.
export function nextDayIndex(plan, workouts) {
  const last = lastPlanWorkout(plan, workouts);
  const index = last ? plan.days.findIndex((d) => d.id === last.dayId) : -1;
  return plan.days.length ? (index + 1) % plan.days.length : 0;
}

// Planned sets per muscle for one day, and for the whole plan (one round = one week).
export const dayMuscleSets = (day, exercisesById) => muscleSets(day.items, exercisesById);
export const planMuscleSets = (plan, exercisesById) => addLoads(plan.days.map((d) => dayMuscleSets(d, exercisesById)));

export const totalSets = (day) => day.items.reduce((sum, item) => sum + item.sets, 0);

// Today's workout for a plan day: each exercise with the planned number of
// sets, filled from last time with the progression suggestion applied.
// ctx: { workouts, settings }
export function startPlanDay(plan, day, exercisesById, ctx, startedAt = new Date().toISOString()) {
  const entries = day.items
    .filter((item) => exercisesById.has(item.exerciseId))
    .map((item) => planEntry(exercisesById.get(item.exerciseId), { ...ctx, startedAt }, false, item.sets));
  return createWorkout(entries, startedAt, { name: day.name, planId: plan.id, dayId: day.id });
}

// Is an exercise used anywhere in these plans? (Then it can't be deleted.)
export const plansUsing = (plans, exerciseId) =>
  plans.filter((p) => p.days.some((d) => d.items.some((i) => i.exerciseId === exerciseId)));

// ---- Editing (each returns a new plan/day; nothing is changed in place) ----

export const updateDay = (plan, dayId, change) => ({ ...plan, days: plan.days.map((d) => (d.id === dayId ? change(d) : d)) });

export const addItem = (day, exerciseId, sets = 3) => ({ ...day, items: [...day.items, { exerciseId, sets }] });

export const setItemSets = (day, index, sets) => ({
  ...day,
  items: day.items.map((item, i) => (i === index ? { ...item, sets: Math.max(1, Math.min(10, sets)) } : item)),
});

export const removeItem = (day, index) => ({ ...day, items: day.items.filter((_, i) => i !== index) });

// Move an item up (−1) or down (+1).
export function moveItem(day, index, by) {
  const to = index + by;
  if (to < 0 || to >= day.items.length) return day;
  const items = [...day.items];
  [items[index], items[to]] = [items[to], items[index]];
  return { ...day, items };
}
