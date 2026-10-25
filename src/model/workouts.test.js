// Tests for workouts.js: finishing a workout, totals and history.

import { describe, it, expect } from 'vitest';
import { finishWorkout, workoutTotals, recentSessions, exerciseHistory, countWorkoutsWith } from './workouts.js';

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
