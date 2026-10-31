// Tests for partner.js and transfer.js: logging a training partner's sets on
// your phone and handing the workout over to hers.

import { describe, it, expect } from 'vitest';
import { makePass, partnerFromPass, newPartner, partnerLibrary, handOver, importHandOver, setToWire } from './partner.js';
import { pack, unpack } from '../data/transfer.js';
import { createExercise, indexById } from './exercises.js';
import { createDay, createPlan, startPlanDay } from './plans.js';
import { DEFAULT_SETTINGS } from './settings.js';
import { lastSession, finishedWorkouts } from './workouts.js';
import { setsBefore, recordSetIds } from './records.js';
import { tickSet } from './sets.js';

// Her phone: a plan day with hip thrusts and push-ups, and three sessions.
const thrust = createExercise('Hip thrust');
const pushUp = createExercise('Push-up', 'reps');
const day = createDay('Glutes', [{ exerciseId: thrust.id, sets: 3 }, { exerciseId: pushUp.id, sets: 2, extra: true }]);
const plan = createPlan('Her plan', [day]);
const set = (weight, reps, rpe = null) => ({ id: Math.random() + '', weight, reps, time: null, rpe, done: true });
const session = (date, thrustSets, pushUps) => ({
  id: date, startedAt: date, finishedAt: date, notes: '', planId: plan.id, dayId: day.id,
  entries: [{ id: 'a' + date, exerciseId: thrust.id, sets: thrustSets }, { id: 'b' + date, exerciseId: pushUp.id, sets: pushUps }],
});
const herWorkouts = [
  session('2026-10-01T17:00:00Z', [set(50, 6), set(45, 10)], [set(null, 12)]), // the records: 50 kg and 12 push-ups
  session('2026-10-08T17:00:00Z', [set(45, 10), set(45, 10)], [set(null, 10)]),
  session('2026-10-15T17:00:00Z', [set(45, 10), set(45, 10, 8)], [set(null, 11)]),
];
const herSettings = { ...DEFAULT_SETTINGS, body: 'female', progression: 'double' };
const pass = () => makePass({ name: 'Anna', settings: herSettings, exercisesById: indexById([thrust, pushUp]), workouts: herWorkouts, plan, day, now: '2026-10-20T17:00:00Z' });

describe('Before: her code', () => {
  it("carries her plan day as her own app would start it: grey values and the suggestion", () => {
    const partner = partnerFromPass(pass(), '2026-10-20T17:05:00Z');
    const [t, p] = partner.workout.entries;
    expect(partner.name).toBe('Anna');
    expect(partner.workout.name).toBe('Glutes');
    expect(partner.exercises.map((e) => e.name)).toEqual(['Hip thrust', 'Push-up']);
    expect(t.sets).toHaveLength(3);
    const own = startPlanDay(plan, day, indexById([thrust, pushUp]), { workouts: herWorkouts, settings: herSettings }).entries[0];
    expect(t.sets[0].weight).toBeNull(); // grey until ticked
    expect(t.sets.map((s) => s.target)).toEqual(own.sets.map((s) => s.target));
    expect(t.suggestion).toEqual(own.suggestion);
    expect(t.sets[0].target).toMatchObject({ weight: 45, reps: 11 }); // one more rep
    expect(p.extra).toBe(true);
    expect(partner.settings.body).toBe('female');
  });

  it('brings enough history for "last time" and for the trophies', () => {
    const partner = partnerFromPass(pass());
    const [t, p] = partner.workout.entries;
    const last = lastSession(partner.history, t.exerciseId, partner.workout.startedAt);
    expect(last.sets.map((s) => [s.weight, s.reps, s.rpe])).toEqual([[45, 10, null], [45, 10, 8]]);
    // 12 push-ups was her record, so 12 again is no trophy, 13 is.
    const earlier = setsBefore(partner.history, p.exerciseId, partner.workout.startedAt);
    expect(recordSetIds([set(null, 12)], earlier, 'reps').size).toBe(0);
    expect(recordSetIds([set(null, 13)], earlier, 'reps').size).toBe(1);
    // and 50 kg was her heaviest hip thrust
    expect(recordSetIds([set(50, 5)], setsBefore(partner.history, t.exerciseId, partner.workout.startedAt), 'weight').size).toBe(0);
  });

  it('fits in one QR code', async () => {
    expect((await pack(pass())).length).toBeLessThan(700);
  });

  it('without a code, a partner starts empty and can use your exercises', () => {
    const partner = newPartner('Tom');
    expect(partner.workout.entries).toEqual([]);
    const yours = [createExercise('Hip thrust'), createExercise('Bench press')];
    const her = partnerFromPass(pass());
    expect(partnerLibrary(partner, yours).map((e) => e.name)).toEqual(['Hip thrust', 'Bench press']);
    expect(partnerLibrary(her, yours).map((e) => e.name)).toEqual(['Hip thrust', 'Push-up', 'Bench press']); // hers first, no doubles
  });
});

describe('After: handing the workout over', () => {
  const yourBench = createExercise('Bench press');
  function doneWorkout() {
    const partner = partnerFromPass(pass(), '2026-10-20T17:05:00Z');
    const [t, p] = partner.workout.entries;
    partner.workout.entries = [
      { ...t, sets: [tickSet(t.sets[0]), tickSet({ ...t.sets[1], reps: 9, rpe: 9 }), t.sets[2]] }, // last set not done
      p, // skipped
      { id: 'x', exerciseId: yourBench.id, sets: [tickSet({ ...t.sets[0], weight: 30, reps: 8 })] }, // from your list
    ];
    return handOver(partner, indexById([yourBench]), '2026-10-20T18:00:00Z');
  }

  it('sends only what she ticked, and exercises by name', () => {
    const data = doneWorkout();
    expect(data.to).toBe('Anna');
    expect(data.exercises.map((e) => e.name)).toEqual(['Hip thrust', 'Bench press']);
    expect(data.workout.entries.map((e) => e.sets)).toEqual([[[45, 11], [45, 9, null, 9]], [[30, 8]]]);
  });

  it('nothing ticked, nothing to hand over', () => {
    expect(handOver(partnerFromPass(pass()), new Map())).toBeNull();
  });

  it('on her phone it becomes her workout: her exercises, her plan day, new ones created', async () => {
    const data = await unpack(await pack(doneWorkout()));
    const { workout, created } = importHandOver(data, [{ ...thrust, name: 'hip thrust' }, pushUp], herWorkouts, [plan]);
    expect(created.map((e) => e.name)).toEqual(['Bench press']);
    expect(workout.entries[0].exerciseId).toBe(thrust.id);
    expect(workout.entries[1].exerciseId).toBe(created[0].id);
    expect(workout.entries[0].sets.map((s) => [s.weight, s.reps, s.rpe, s.done])).toEqual([[45, 11, null, true], [45, 9, 9, true]]);
    expect([workout.planId, workout.dayId, workout.name]).toEqual([plan.id, day.id, 'Glutes']);
    expect(finishedWorkouts([workout])).toHaveLength(1);
  });

  it("forgets the plan day if she deleted that plan, and refuses the same workout twice", () => {
    const data = doneWorkout();
    const { workout } = importHandOver(data, [thrust], herWorkouts, []);
    expect(workout.planId).toBeUndefined();
    expect(() => importHandOver(data, [thrust], [...herWorkouts, workout], [])).toThrow('already');
  });
});

describe('Codes', () => {
  it('survive the trip', async () => {
    expect(await unpack(await pack({ kind: 'test', n: [1, 2.5, null] }))).toEqual({ kind: 'test', n: [1, 2.5, null] });
  });

  it("say so when a code isn't ours", async () => {
    await expect(unpack(new TextEncoder().encode('https://example.com'))).rejects.toThrow("isn't from the Workout app");
  });

  it('sets are short lists', () => {
    expect(setToWire({ weight: 60, reps: 8, time: null, rpe: null })).toEqual([60, 8]);
    expect(setToWire({ weight: null, reps: null, time: 45, rpe: 8 })).toEqual([null, null, 45, 8]);
  });
});
