// Plans (splits): a list of training days you go through in order,
// e.g. Push → Pull → Legs → Push → …
//
// A plan is a plain object, saved as one record in the database:
//   { id, name, templateId, createdAt, days: [day, …] }
//   day:  { id, name, items: [{ exerciseId, sets, extra? }] }
//         sets = planned number of sets; extra = a healthy extra (extras.js)
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
    createDay(
      name,
      items.map(([exerciseName, sets, extra]) => ({ exerciseId: idForName(exerciseName), sets, ...(extra ? { extra: true } : {}) })),
    ),
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

// About how long a session takes: each set ≈ 45 s of work plus your rest
// time, extras ≈ 1½ min a set (short holds, little rest), plus ~5 min to
// warm up. Rounded to 5 minutes.
export function sessionMinutes(items, restSeconds = 120) {
  const minutes = items.reduce((sum, i) => sum + i.sets * (i.extra ? 1.5 : (45 + restSeconds) / 60), 5);
  return Math.round(minutes / 5) * 5;
}

// "~45 min", or "~45–55 min" when the days differ.
// "8 exercises · 20 sets · ~45 min", each number kept with its word when the
// line wraps. withExercises: false leaves out the exercise count.
export function dayLine(day, restSeconds, withExercises = true) {
  const parts = [`${totalSets(day)}\u00a0sets`];
  if (withExercises) parts.unshift(`${day.items.length}\u00a0exercises`);
  if (day.items.length) parts.push(`~${sessionMinutes(day.items, restSeconds)}\u00a0min`);
  return parts.join(' · ');
}

export function minutesLabel(days, restSeconds) {
  const all = days.filter((d) => d.items.length).map((d) => sessionMinutes(d.items, restSeconds));
  if (!all.length) return '';
  const lo = Math.min(...all), hi = Math.max(...all);
  return lo === hi ? `~${lo}\u00a0min` : `~${lo}–${hi}\u00a0min`; // \u00a0: "min" never wraps alone
}

// Template days ([name, [[exercise, sets, extra?]]]) in the shape above.
export const templateDays = (template) =>
  template.days.map(([name, items]) => ({ name, items: items.map(([, sets, extra]) => ({ sets, extra })) }));

// Today's workout for a plan day: each exercise with the planned number of
// sets, filled from last time with the progression suggestion applied.
// ctx: { workouts, settings }
export function startPlanDay(plan, day, exercisesById, ctx, startedAt = new Date().toISOString()) {
  const entries = day.items
    .filter((item) => exercisesById.has(item.exerciseId))
    .map((item) => {
      const entry = planEntry(exercisesById.get(item.exerciseId), { ...ctx, startedAt }, false, item.sets);
      return item.extra ? { ...entry, extra: true } : entry;
    });
  return createWorkout(entries, startedAt, { name: day.name, planId: plan.id, dayId: day.id });
}

// Is an exercise used anywhere in these plans? (Then it can't be deleted.)
export const plansUsing = (plans, exerciseId) =>
  plans.filter((p) => p.days.some((d) => d.items.some((i) => i.exerciseId === exerciseId)));

// ---- Editing (each returns a new plan/day; nothing is changed in place) ----

export const updateDay = (plan, dayId, change) => ({ ...plan, days: plan.days.map((d) => (d.id === dayId ? change(d) : d)) });

// A new exercise goes before the healthy extras, which stay last as a finisher.
export function addItem(day, exerciseId, sets = 3) {
  const at = day.items.findIndex((i) => i.extra);
  const items = [...day.items];
  items.splice(at === -1 ? items.length : at, 0, { exerciseId, sets });
  return { ...day, items };
}

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
