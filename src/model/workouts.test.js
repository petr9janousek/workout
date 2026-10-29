// Tests for workouts.js: finishing a workout, totals and history.

import { describe, it, expect } from 'vitest';
import { finishWorkout, workoutTotals, recentSessions, exerciseHistory, countWorkoutsWith, previousLike } from './workouts.js';

const set = (weight, reps, done = true, extra = {}) => ({ id: Math.random() + '', weight, reps, time: null, rpe: null, done, ...extra });
const workout = (id, startedAt, entries, finishedAt = startedAt) => ({ id, startedAt, finishedAt, notes: '', entries });
const entry = (exerciseId, sets) => ({ id: exerciseId + Math.random(), exerciseId, sets });

describe('Finishing a workout', () => {
  it('keeps only ticked sets and drops exercises left with none', () => {
    const w = workout('w', '2026-10-01', [entry('bench', [set(60, 8), set(60, 8, false)]), entry('squat', [set(80, 5, false)])], null);
    const result = finishWorkout(w, '2026-10-01T11:00:00Z');
    expect(result.skipped).toBe(2);
    expect(result.workout.entries).toHaveLength(1);
    expect(result.workout.entries[0].sets).toHaveLength(1);
    expect(result.workout.finishedAt).toBe('2026-10-01T11:00:00Z');
  });

  it('returns no workout when nothing was ticked', () => {
    const w = workout('w', '2026-10-01', [entry('bench', [set(60, 8, false)])], null);
    expect(finishWorkout(w).workout).toBeNull();
  });

  it('does not count a ticked set with no reps or time', () => {
    const w = workout('w', '2026-10-01', [entry('bench', [set(60, null)])], null);
    expect(finishWorkout(w).workout).toBeNull();
  });
});

describe('Workout totals', () => {
  it('adds up sets, weight × reps and reps of ticked sets only', () => {
    const w = workout('w', '2026-10-01', [entry('bench', [set(60, 8), set(60, 8), set(60, 8, false)])]);
    expect(workoutTotals(w)).toMatchObject({ planned: 3, sets: 2, volume: 960, reps: 16, seconds: 0 });
  });

  it('does not count assistance (negative weight) as weight lifted', () => {
    const w = workout('w', '2026-10-01', [entry('pullup', [set(-30, 8), set(10, 5)])]);
    expect(workoutTotals(w).volume).toBe(50);
  });

  it('adds up time for timed holds', () => {
    const w = workout('w', '2026-10-01', [entry('plank', [set(null, null, true, { time: 45 }), set(null, null, true, { time: 30 })])]);
    expect(workoutTotals(w).seconds).toBe(75);
  });
});

describe('History of one exercise', () => {
  const workouts = [
    workout('a', '2026-10-01', [entry('bench', [set(60, 8)])]),
    workout('b', '2026-10-05', [entry('bench', [set(62.5, 8)]), entry('squat', [set(80, 5)])]),
    workout('c', '2026-10-08', [entry('squat', [set(80, 5)])]),
    workout('d', '2026-10-09', [entry('bench', [set(65, 8)])], null), // still in progress
  ];

  it('lists finished sessions newest first, skipping workouts without the exercise', () => {
    expect(recentSessions(workouts, 'bench').map((s) => s.date)).toEqual(['2026-10-05', '2026-10-01']);
  });

  it('can leave out sessions from a given date on (today)', () => {
    expect(recentSessions(workouts, 'bench', '2026-10-05').map((s) => s.date)).toEqual(['2026-10-01']);
  });

  it('gives chart data oldest first, with the heaviest set per session', () => {
    expect(exerciseHistory(workouts, 'bench').map((h) => h.topWeight)).toEqual([60, 62.5]);
  });

  it('counts the workouts an exercise is used in', () => {
    expect(countWorkoutsWith(workouts, 'squat')).toBe(2);
    expect(countWorkoutsWith(workouts, 'deadlift')).toBe(0);
  });
});

describe('Healthy extras in a workout', () => {
  it("finishing doesn't count unticked extras as skipped sets", () => {
    const w = {
      id: 'w', startedAt: '2026-10-26T10:00:00Z', finishedAt: null, notes: '',
      entries: [
        { id: 'a', exerciseId: 'squat', suggestion: null, sets: [{ id: '1', weight: 60, reps: 8, done: true }, { id: '2', weight: 60, reps: 8, done: false }] },
        { id: 'b', exerciseId: 'plank', suggestion: null, extra: true, sets: [{ id: '3', time: 30, done: false }] },
      ],
    };
    const result = finishWorkout(w);
    expect(result.skipped).toBe(1); // only the squat set
    expect(result.workout.entries.map((e) => e.exerciseId)).toEqual(['squat']);
  });
});

describe('previousLike', () => {
  const a = { ...workout('a', '2026-10-01T10:00:00Z', []), name: 'Push', dayId: 'd1' };
  const b = { ...workout('b', '2026-10-05T10:00:00Z', []), name: 'Pull', dayId: 'd2' };
  const c = { ...workout('c', '2026-10-08T10:00:00Z', []), name: 'Push', dayId: 'd1' };
  const free = { ...workout('f', '2026-10-09T10:00:00Z', []), name: 'Arms' };
  const free2 = { ...workout('g', '2026-10-12T10:00:00Z', []), name: 'Arms' };

  it('finds the last time of the same plan day', () => {
    expect(previousLike([a, b, c], c)).toBe(a);
    expect(previousLike([a, b, c], a)).toBe(null);
  });
  it('without a plan, matches by name', () => {
    expect(previousLike([a, free, free2], free2)).toBe(free);
    expect(previousLike([a, b], { ...workout('x', '2026-10-20T10:00:00Z', []) })).toBe(null);
  });
});
