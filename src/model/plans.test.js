// Tests for plans.js and planTemplates.js: going through a plan's days, starting
// a plan day, and checking that every ready-made plan is sensible.

import { describe, it, expect } from 'vitest';
import { createPlan, createDay, nextDayIndex, startPlanDay, planFromTemplate, planMuscleSets, moveItem, setItemSets, plansUsing } from './plans.js';
import { PLAN_TEMPLATES, templatesForDays, defaultDayNames } from './planTemplates.js';
import { createExercise, indexById, typeOf } from './exercises.js';
import { guessMuscles } from './muscles.js';

const bench = { id: 'bench', name: 'Bench press', type: 'weight' };
const row = { id: 'row', name: 'Barbell row', type: 'weight' };
const exercises = indexById([bench, row]);
const plan = createPlan('PPL', [createDay('Push', [{ exerciseId: 'bench', sets: 4 }]), createDay('Pull', [{ exerciseId: 'row', sets: 3 }]), createDay('Legs')]);
const [push, pull, legs] = plan.days;
const done = (w, r) => ({ id: Math.random() + '', weight: w, reps: r, time: null, rpe: null, done: true });
const workout = (date, day, extra = {}) => ({
  id: date, startedAt: date, finishedAt: date, notes: '', planId: plan.id, dayId: day.id, name: day.name, entries: [], ...extra,
});

describe('Which day is next', () => {
  it('starts with the first day', () => {
    expect(nextDayIndex(plan, [])).toBe(0);
  });
  it('is the day after the last one done', () => {
    expect(nextDayIndex(plan, [workout('2026-10-01', push), workout('2026-10-03', pull)])).toBe(2);
  });
  it('goes back to the first day after the last one', () => {
    expect(nextDayIndex(plan, [workout('2026-10-05', legs)])).toBe(0);
  });
  it('ignores workouts from other plans and unfinished ones', () => {
    const other = workout('2026-10-06', legs, { planId: 'other' });
    const inProgress = workout('2026-10-07', pull, { finishedAt: null });
    expect(nextDayIndex(plan, [workout('2026-10-01', push), other, inProgress])).toBe(1);
  });
});

describe('Starting a plan day', () => {
  const ctx = { workouts: [{ ...workout('2026-10-01', push), entries: [{ id: 'e', exerciseId: 'bench', sets: [done(60, 8), done(60, 8)] }] }], settings: {} };

  it('uses the planned number of sets, filled from last time with the suggestion', () => {
    const w = startPlanDay(plan, push, exercises, ctx, '2026-10-08');
    expect(w.entries[0].sets).toHaveLength(4); // planned 4, last time only 2
    expect(w.entries[0].sets.map((s) => [s.weight, s.reps])).toEqual([[60, 9], [60, 9], [60, 9], [60, 9]]);
  });
  it('remembers the plan, the day and its name', () => {
    expect(startPlanDay(plan, pull, exercises, ctx)).toMatchObject({ name: 'Pull', planId: plan.id, dayId: pull.id, finishedAt: null });
  });
  it('starts a new exercise with the planned number of empty sets', () => {
    const w = startPlanDay(plan, pull, exercises, ctx);
    expect(w.entries[0].sets).toHaveLength(3);
    expect(w.entries[0].sets[0].weight).toBeNull();
  });
  it('skips exercises that were deleted', () => {
    const p = createPlan('x', [createDay('A', [{ exerciseId: 'gone', sets: 3 }, { exerciseId: 'row', sets: 3 }])]);
    expect(startPlanDay(p, p.days[0], exercises, ctx).entries).toHaveLength(1);
  });
});

describe('Editing a day', () => {
  const day = createDay('A', [{ exerciseId: 'a', sets: 3 }, { exerciseId: 'b', sets: 3 }]);
  it('moves exercises up and down, not past the ends', () => {
    expect(moveItem(day, 1, -1).items.map((i) => i.exerciseId)).toEqual(['b', 'a']);
    expect(moveItem(day, 0, -1)).toBe(day);
  });
  it('keeps the number of sets between 1 and 10', () => {
    expect(setItemSets(day, 0, 0).items[0].sets).toBe(1);
    expect(setItemSets(day, 0, 12).items[0].sets).toBe(10);
  });
  it('knows which plans use an exercise', () => {
    expect(plansUsing([plan], 'row')).toEqual([plan]);
    expect(plansUsing([plan], 'squat')).toEqual([]);
  });
});

describe('Ready-made plans', () => {
  // Build each template with fresh exercises, like the app does.
  const build = (template) => {
    const list = [];
    const idForName = (name) => (list.find((e) => e.name === name) || list[list.push(createExercise(name)) - 1]).id;
    const p = planFromTemplate(template, idForName);
    return { plan: p, weekly: planMuscleSets(p, indexById(list)) };
  };

  it('only use exercise names the app recognises (type and muscles)', () => {
    for (const t of PLAN_TEMPLATES) {
      for (const [, items] of t.days) {
        for (const [name] of items) {
          expect(Object.keys(guessMuscles(name)), name).not.toHaveLength(0);
          expect(typeOf({ name }), name).toBeTruthy();
        }
      }
    }
  });

  it('every plan trains all major muscles every week (WHO: all major muscle groups)', () => {
    for (const t of PLAN_TEMPLATES) {
      const { weekly } = build(t);
      for (const muscle of ['chest', 'lats', 'shoulders', 'quads', 'glutes', 'hamstrings']) {
        expect(weekly[muscle] || 0, `${t.name}: ${muscle}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('no plan asks for an unreasonable amount (over 25 sets a week for one muscle)', () => {
    for (const t of PLAN_TEMPLATES) {
      for (const [muscle, sets] of Object.entries(build(t).weekly)) {
        expect(sets, `${t.name}: ${muscle}`).toBeLessThanOrEqual(25);
      }
    }
  });

  it('there is a ready-made plan for 2 to 6 days a week', () => {
    for (const days of [2, 3, 4, 5, 6]) expect(templatesForDays(days).length, `${days} days`).toBeGreaterThan(0);
  });

  it('suggests day names for a plan of your own', () => {
    expect(defaultDayNames(3)).toEqual(['Push', 'Pull', 'Legs']);
    expect(defaultDayNames(7)).toHaveLength(7);
  });
});
