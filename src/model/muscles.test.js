// Tests for muscles.js: which muscles an exercise works and how sets are counted.

import { describe, it, expect } from 'vitest';
import { guessMuscles, workoutMuscleSets, recentMuscleSets, level, cycleMuscle, musclesOf, similarExercises } from './muscles.js';
import { indexById, findExercises, createExercise } from './exercises.js';

describe('Guessing muscles from the exercise name', () => {
  it('knows common exercises', () => {
    expect(guessMuscles('Bench press')).toEqual({ chest: 1, triceps: 0.5, shoulders: 0.5 });
    expect(guessMuscles('Romanian deadlift')).toMatchObject({ hamstrings: 1, glutes: 1 });
  });
  it('picks the specific exercise over a similar name', () => {
    expect(guessMuscles('Leg curl')).toEqual({ hamstrings: 1 }); // not biceps
    expect(guessMuscles('Side plank')).toMatchObject({ obliques: 1 }); // not abs first
    expect(guessMuscles('Cable fly')).toEqual({ chest: 1, shoulders: 0.5 }); // no triceps
  });
  it('returns nothing for an unknown exercise', () => {
    expect(guessMuscles('Mystery move')).toEqual({});
  });
});

describe('Counting sets per muscle', () => {
  const exercises = indexById([
    { id: 'bench', name: 'Bench press', type: 'weight' },
    { id: 'ohp', name: 'Overhead press', type: 'weight', muscles: { shoulders: 1 } }, // set by hand
  ]);
  const done = { done: true, reps: 8 };
  const workout = (startedAt, entries) => ({ startedAt, entries });

  it('counts main muscles as 1 set and helping muscles as ½, ticked sets only', () => {
    const w = workout('2026-10-01', [{ exerciseId: 'bench', sets: [done, done, done, { done: false, reps: 8 }] }]);
    expect(workoutMuscleSets(w, exercises)).toEqual({ chest: 3, triceps: 1.5, shoulders: 1.5 });
  });

  it('uses muscles set by hand instead of the guess', () => {
    const w = workout('2026-10-01', [{ exerciseId: 'ohp', sets: [done, done] }]);
    expect(workoutMuscleSets(w, exercises)).toEqual({ shoulders: 2 });
  });

  it('adds up the last 7 days only', () => {
    const now = Date.parse('2026-10-10T12:00:00Z');
    const workouts = [
      workout('2026-10-09T10:00:00Z', [{ exerciseId: 'ohp', sets: [done] }]),
      workout('2026-10-01T10:00:00Z', [{ exerciseId: 'ohp', sets: [done, done] }]), // 9 days ago
    ];
    expect(recentMuscleSets(workouts, exercises, 7, now)).toEqual({ shoulders: 1 });
  });
});

describe('Colour levels', () => {
  it('one workout: grey at 0, deepest red from 8 sets', () => {
    expect([0, 0.5, 3, 5, 8, 12].map((n) => level(n, 'workout'))).toEqual([0, 1, 2, 3, 4, 4]);
  });
  it('one week: deepest red from 15 sets', () => {
    expect([2, 6, 10, 15].map((n) => level(n, 'week'))).toEqual([1, 2, 3, 4]);
  });
});

describe('Editing muscles in Settings', () => {
  it('a tap cycles off → helping ½ → main → off', () => {
    let m = {};
    m = cycleMuscle(m, 'chest');
    expect(m).toEqual({ chest: 0.5 });
    m = cycleMuscle(m, 'chest');
    expect(m).toEqual({ chest: 1 });
    m = cycleMuscle(m, 'chest');
    expect(m).toEqual({});
  });
});

describe('Finding exercises in the library', () => {
  const list = [
    { id: '1', name: 'Bench press' },
    { id: '2', name: 'Triceps pushdown' },
    { id: '3', name: 'Squat' },
  ];
  it('filters by a muscle, main muscle first', () => {
    expect(findExercises(list, { muscle: 'triceps', musclesOf }).map((e) => e.name)).toEqual(['Triceps pushdown', 'Bench press']);
  });
  it('filters by text in the name', () => {
    expect(findExercises(list, { query: 'pre', musclesOf }).map((e) => e.name)).toEqual(['Bench press']);
  });
});

describe('Swapping an exercise (machine taken)', () => {
  const ex = (name) => createExercise(name);
  const list = ['Lat pulldown', 'Pull-up', 'Seated cable row', 'Bench press', 'Dumbbell curl', 'Assisted pull-up'].map(ex);
  const [pulldown] = list;

  it('suggests exercises for the same main muscles, most similar first', () => {
    const names = similarExercises(pulldown, list).map((e) => e.name);
    expect(names.slice(0, 2).sort()).toEqual(['Assisted pull-up', 'Pull-up']); // same muscles exactly
    expect(names).toContain('Seated cable row'); // also lats
    expect(names).not.toContain('Bench press'); // different muscles
    expect(names).not.toContain('Dumbbell curl'); // biceps only help in a pulldown
  });

  it("leaves out exercises already in today's workout", () => {
    const pullUp = list[1];
    expect(similarExercises(pulldown, list, new Set([pullUp.id])).map((e) => e.name)).not.toContain('Pull-up');
  });
});
