// Tests for planFile.js: sending a plan to someone else's phone.

import { describe, it, expect } from 'vitest';
import { planToFile, readPlanFile, planFromFile } from './planFile.js';
import { createDay, createPlan } from './plans.js';
import { createExercise, indexById } from './exercises.js';

const bench = createExercise('Bench press');
const kickback = { ...createExercise('Glute kickback'), muscles: { glutes: 1 } };
const plan = createPlan('Upper / Lower', [
  createDay('Upper', [{ exerciseId: bench.id, sets: 4 }]),
  createDay('Lower', [{ exerciseId: kickback.id, sets: 3 }, { exerciseId: bench.id, sets: 2, extra: true }]),
]);
const text = JSON.stringify(planToFile(plan, indexById([bench, kickback])));

describe('Plan files', () => {
  it('a plan survives the trip: names, sets, extras and your own muscle choices', () => {
    const fromFile = readPlanFile(text);
    expect(fromFile.name).toBe('Upper / Lower');
    expect(fromFile.days[1].items).toEqual([
      { name: 'Glute kickback', type: 'weight', muscles: { glutes: 1 }, sets: 3 },
      { name: 'Bench press', type: 'weight', sets: 2, extra: true },
    ]);
  });

  it('on the other phone, exercises with the same name are reused and the rest created', () => {
    const theirBench = createExercise('bench PRESS');
    const { plan: imported, created } = planFromFile(readPlanFile(text), [theirBench]);
    expect(created.map((e) => e.name)).toEqual(['Glute kickback']);
    expect(created[0].muscles).toEqual({ glutes: 1 });
    expect(imported.days[0].items[0].exerciseId).toBe(theirBench.id);
    expect(imported.days[1].items[1].extra).toBe(true);
    expect(imported.id).not.toBe(plan.id); // a new plan, not a copy of the ids
  });

  it("doesn't clash with a plan you already have", () => {
    const { plan: imported } = planFromFile(readPlanFile(text), [], [{ name: 'Upper / Lower' }]);
    expect(imported.name).toBe('Upper / Lower (2)');
  });

  it('says clearly when the file is something else', () => {
    expect(() => readPlanFile('hello')).toThrow('not a Workout plan');
    expect(() => readPlanFile(JSON.stringify({ app: 'workout', workouts: [] }))).toThrow('This is a backup');
  });
});
