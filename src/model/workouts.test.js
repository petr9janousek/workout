// Tests for workouts.js: finishing a workout, totals and history.

import { describe, it, expect } from 'vitest';
import { finishWorkout, workoutTotals, recentSessions, exerciseHistory, countWorkoutsWith, previousLike, finishedWorkouts, lastNoteOf, notesOf } from './workouts.js';

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

describe('Finishing keeps only what was done', () => {
  it('drops the plan from ticked sets', () => {
    const w = workout('w', '2026-10-29T10:00:00Z', [entry('bench', [{ ...set(60, 8), target: { weight: 60, reps: 8, time: null } }])], null);
    const sets = finishWorkout(w).workout.entries[0].sets;
    expect('target' in sets[0]).toBe(false);
  });
});

describe('finishedWorkouts', () => {
  it('gives the same list again for the same workouts, a new one when they change', () => {
    const list = [workout('a', '2026-10-01T10:00:00Z', []), workout('b', '2026-10-02T10:00:00Z', [], null)];
    expect(finishedWorkouts(list)).toBe(finishedWorkouts(list));
    expect(finishedWorkouts(list).map((w) => w.id)).toEqual(['a']);
    expect(finishedWorkouts([...list, workout('c', '2026-10-03T10:00:00Z', [])]).map((w) => w.id)).toEqual(['c', 'a']);
  });
});

describe('finishWorkout and swaps', () => {
  it('forgets which exercise was swapped', () => {
    const w = { id: 'w', startedAt: '2026-11-01T10:00:00Z', entries: [{ id: 'e', exerciseId: 'b', swappedFrom: 'a', swapKept: true, sets: [{ id: 's', weight: 20, reps: 10, done: true }] }] };
    const entry = finishWorkout(w).workout.entries[0];
    expect(entry).not.toHaveProperty('swappedFrom');
    expect(entry).not.toHaveProperty('swapKept');
  });
});

describe('notes per exercise', () => {
  const w = (id, day, note) => ({
    id, startedAt: `2026-11-0${day}T10:00:00Z`, finishedAt: `2026-11-0${day}T11:00:00Z`,
    entries: [{ id: `e${id}`, exerciseId: 'bench', note, sets: [{ id: `s${id}`, weight: 40, reps: 10, done: true }] }],
  });

  it('last time brings its note, notesOf lists them newest first', () => {
    const workouts = [w('a', 1, 'seat 4'), w('b', 3, 'felt heavy'), w('c', 5)];
    expect(lastNoteOf(workouts, 'bench', '2026-11-04T00:00:00Z')).toEqual({ date: '2026-11-03T10:00:00Z', note: 'felt heavy' });
    expect(lastNoteOf(workouts, 'bench')).toBe(null); // the last time (Nov 5) had no note
    expect(notesOf(workouts, 'bench').map((n) => n.note)).toEqual(['felt heavy', 'seat 4']);
  });

  it('finishing keeps a trimmed note and drops an empty one', () => {
    const active = (note) => ({ id: 'x', startedAt: '2026-11-07T10:00:00Z', entries: [{ id: 'e', exerciseId: 'bench', note, sets: [{ id: 's', weight: 40, reps: 10, done: true }] }] });
    expect(finishWorkout(active('  grip wider ')).workout.entries[0].note).toBe('grip wider');
    expect(finishWorkout(active('   ')).workout.entries[0]).not.toHaveProperty('note');
  });

  it('a skipped exercise stays for its note, but a workout of only notes is not kept', () => {
    const set = (done) => ({ id: done ? 'd' : 'u', weight: 40, reps: 10, done });
    const workout = { id: 'x', startedAt: '2026-11-07T10:00:00Z', entries: [
      { id: 'a', exerciseId: 'bench', sets: [set(true)] },
      { id: 'b', exerciseId: 'fly', note: 'machine broken', sets: [set(false)] },
      { id: 'c', exerciseId: 'curl', sets: [set(false)] },
    ] };
    const done = finishWorkout(workout).workout;
    expect(done.entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(done.entries[1].sets).toEqual([]);
    expect(lastNoteOf([done], 'fly').note).toBe('machine broken');
    expect(finishWorkout({ ...workout, entries: workout.entries.slice(1) }).workout).toBe(null);
  });
});
