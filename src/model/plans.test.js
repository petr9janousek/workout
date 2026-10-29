// Tests for plans.js and planTemplates.js: going through a plan's days, starting
// a plan day, and checking that every ready-made plan is sensible.

import { describe, it, expect } from 'vitest';
import { createPlan, createDay, nextDayIndex, startPlanDay, planFromTemplate, planMuscleSets, moveItem, setItemSets, plansUsing, sessionMinutes, templateDays, addItem } from './plans.js';
import { withExtras, EXTRAS } from './extras.js';
import { PLAN_TEMPLATES, templatesForDays, defaultDayNames, isRecommended, MAIN_MUSCLES, targetRange } from './planTemplates.js';
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
    expect(w.entries[0].sets.map((s) => [s.target.weight, s.target.reps])).toEqual([[60, 9], [60, 9], [60, 9], [60, 9]]); // grey plans
  });
  it('remembers the plan, the day and its name', () => {
    expect(startPlanDay(plan, pull, exercises, ctx)).toMatchObject({ name: 'Pull', planId: plan.id, dayId: pull.id, finishedAt: null });
  });
  it('starts a new exercise with the planned number of empty sets', () => {
    const w = startPlanDay(plan, pull, exercises, ctx);
    expect(w.entries[0].sets).toHaveLength(3);
    expect(w.entries[0].sets[0].weight).toBeNull();
  });
  it('healthy extras stay marked in the workout, so they can be skipped', () => {
    const p = createPlan('x', [createDay('A', [{ exerciseId: 'row', sets: 3 }, { exerciseId: 'bench', sets: 2, extra: true }])]);
    expect(startPlanDay(p, p.days[0], exercises, ctx).entries.map((e) => Boolean(e.extra))).toEqual([false, true]);
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

  it('every plan gives each main muscle about 10 sets a week (or what its focus says)', () => {
    for (const t of PLAN_TEMPLATES) {
      const { weekly } = build(t);
      for (const muscle of MAIN_MUSCLES) {
        const [lo, hi] = targetRange(t, muscle);
        expect(weekly[muscle] || 0, `${t.name} (${t.days.length} days): ${muscle}`).toBeGreaterThanOrEqual(lo);
        expect(weekly[muscle] || 0, `${t.name} (${t.days.length} days): ${muscle}`).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('more days means shorter sessions, for the same weekly work', () => {
    const minutes = (id) => Math.max(...templateDays(PLAN_TEMPLATES.find((t) => t.id === id)).map((d) => sessionMinutes(d.items)));
    expect(minutes('full-body-2')).toBeGreaterThan(minutes('full-body-3'));
    expect(minutes('full-body-3')).toBeGreaterThan(minutes('ppl-6'));
    expect(minutes('ppl-6')).toBeLessThanOrEqual(40);
  });

  it('healthy extras add a core exercise and one of grip / upper back / balance to every day', () => {
    for (const t of PLAN_TEMPLATES) {
      for (const [, items] of withExtras(t).days) {
        const extras = items.filter((i) => i[2]);
        expect(extras, t.name).toHaveLength(2);
        expect(EXTRAS.core.map(([n]) => n)).toContain(extras[0][0]);
        expect(new Set(items.map(([n]) => n)).size, `${t.name}: no exercise twice in a day`).toBe(items.length);
      }
    }
  });

  it('extras rotate: a 3-day plan covers grip, upper back and balance', () => {
    const extraNames = withExtras(PLAN_TEMPLATES.find((t) => t.id === 'full-body-3')).days.map(([, items]) => items.at(-1)[0]);
    expect(extraNames).toEqual([EXTRAS.grip[0][0], EXTRAS.upperBack[0][0], EXTRAS.balance[0][0]]);
  });

  it('an exercise added to a day goes before its healthy extras', () => {
    const day = createDay('A', [{ exerciseId: 'squat', sets: 3 }, { exerciseId: 'plank', sets: 2, extra: true }]);
    expect(addItem(day, 'bench').items.map((i) => i.exerciseId)).toEqual(['squat', 'bench', 'plank']);
    expect(addItem(createDay('B'), 'bench').items).toEqual([{ exerciseId: 'bench', sets: 3 }]);
  });

  it('extras are marked in the plan made from the template', () => {
    const { plan } = build(withExtras(PLAN_TEMPLATES[0]));
    expect(plan.days[0].items.filter((i) => i.extra)).toHaveLength(2);
    expect(plan.days[0].items[0].extra).toBeUndefined();
  });

  it('there is a ready-made plan for 2 to 6 days a week', () => {
    for (const days of [2, 3, 4, 5, 6]) expect(templatesForDays(days).length, `${days} days`).toBeGreaterThan(0);
  });

  it('Hourglass: glutes and shoulders get the most work, thighs only a little, no heavy oblique work', () => {
    for (const t of PLAN_TEMPLATES.filter((t) => t.for === 'female')) {
      const { weekly } = build(t);
      const ranked = Object.keys(weekly).sort((a, b) => weekly[b] - weekly[a]);
      expect(ranked[0], t.id).toBe('glutes');
      expect(weekly.shoulders, t.id).toBeGreaterThanOrEqual(10);
      expect(weekly.quads, t.id).toBeLessThanOrEqual(4);
      expect(weekly.obliques || 0, t.id).toBeLessThanOrEqual(2);
    }
  });

  it('V-taper: lats and shoulders get far more work than legs', () => {
    for (const t of PLAN_TEMPLATES.filter((t) => t.for === 'male')) {
      const { weekly } = build(t);
      expect(weekly.lats, t.id).toBeGreaterThanOrEqual(10);
      expect(weekly.shoulders, t.id).toBeGreaterThanOrEqual(15);
      expect(weekly.quads, t.id).toBeLessThan(weekly.lats);
    }
  });

  it('plans made for your body come first; the others are still shown', () => {
    const forHer = templatesForDays(3, 'female');
    expect(forHer[0].id).toBe('hourglass-3');
    expect(isRecommended(forHer[0], 'female')).toBe(true);
    expect(forHer.length).toBe(templatesForDays(3).length);
    expect(templatesForDays(4, 'male')[0].id).toBe('v-taper-4');
    // Without a body chosen, the general plans come first.
    expect(templatesForDays(3)[0].for).toBeUndefined();
  });

  it('suggests day names for a plan of your own', () => {
    expect(defaultDayNames(3)).toEqual(['Push', 'Pull', 'Legs']);
    expect(defaultDayNames(7)).toHaveLength(7);
  });
});
