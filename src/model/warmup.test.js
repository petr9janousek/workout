import { describe, it, expect } from 'vitest';
import { MOVES, warmUpFor, stretchesFor, doseOf, minutesFor, moveById } from './warmup.js';
import { MUSCLES, plannedMuscleSets } from './muscles.js';
import { finishWorkout } from './workouts.js';
import { indexById } from './exercises.js';

const ids = (moves) => moves.map((m) => m.id);
const legDay = { quads: 9, glutes: 7, hamstrings: 4, adductors: 2 };
const upperDay = { chest: 6, triceps: 4, lats: 6, biceps: 3, shoulders: 3 };

describe('moves', () => {
  it('have unique ids, real muscles and three cues', () => {
    expect(new Set(ids(MOVES)).size).toBe(MOVES.length);
    const known = new Set(MUSCLES.map((m) => m.id));
    for (const m of MOVES) {
      for (const x of m.muscles) expect(known.has(x), `${m.id}: ${x}`).toBe(true);
      expect(m.cues).toHaveLength(3);
      expect(m.avoid).toBeTruthy();
    }
  });

  it('cover every muscle with a stretch', () => {
    const covered = new Set(MOVES.filter((m) => m.kind === 'stretch').flatMap((m) => m.muscles));
    for (const { id } of MUSCLES) expect(covered.has(id), id).toBe(true);
  });
});

describe('warmUpFor', () => {
  it('starts with easy cardio, then 3 moves for the day', () => {
    const legs = warmUpFor(legDay);
    expect(legs[0].id).toBe('easy-cardio');
    expect(legs).toHaveLength(4);
    expect(legs.slice(1).every((m) => m.muscles.some((x) => x in legDay))).toBe(true);
    expect(ids(warmUpFor(upperDay)).slice(1).every((id) => !['bodyweight-squats', 'leg-swings'].includes(id))).toBe(true);
  });

  it('warms up the whole body for an empty workout', () => {
    expect(warmUpFor({})).toHaveLength(4);
  });
});

describe('stretchesFor', () => {
  it('quick: 4 for the muscles trained most', () => {
    const s = stretchesFor(legDay, 'quick');
    expect(s).toHaveLength(4);
    expect(s.every((m) => m.kind === 'stretch')).toBe(true);
    expect(s.flatMap((m) => m.muscles)).toEqual(expect.arrayContaining(['quads', 'glutes', 'hamstrings', 'adductors']));
  });

  it('thorough: more, always with hips and upper back', () => {
    const s = ids(stretchesFor(upperDay, 'thorough'));
    expect(s.length).toBeGreaterThan(4);
    expect(s).toEqual(expect.arrayContaining(['hip-flexor', 'thread-the-needle']));
    expect(new Set(s).size).toBe(s.length);
  });

  it('off: nothing', () => {
    expect(stretchesFor(legDay, 'off')).toEqual([]);
  });
});

describe('doseOf and minutesFor', () => {
  it('stretches by size and sides', () => {
    expect(doseOf(moveById('figure-four'), 'quick')).toBe('30 s each side');
    expect(doseOf(moveById('childs-pose'), 'thorough')).toBe('2 × 30 s');
    expect(doseOf(moveById('cat-cow'))).toBe('10 reps');
  });

  it('adds up roughly', () => {
    expect(minutesFor(warmUpFor(legDay))).toBe(8);
    expect(minutesFor(stretchesFor(upperDay, 'thorough'), 'thorough')).toBeLessThanOrEqual(13);
    expect(minutesFor(stretchesFor(legDay, 'quick'), 'quick')).toBeLessThanOrEqual(5);
    expect(minutesFor(stretchesFor(legDay, 'thorough'), 'thorough')).toBeGreaterThanOrEqual(8);
  });
});

describe('the workout side', () => {
  const byId = indexById([{ id: 'sq', name: 'Squat' }, { id: 'pl', name: 'Plank' }]);
  const set = { weight: 60, reps: 8, done: false };
  const workout = {
    id: 'w',
    startedAt: '2026-11-01T10:00:00Z',
    entries: [
      { id: 'a', exerciseId: 'sq', sets: [set, set, { ...set, done: true }] },
      { id: 'b', exerciseId: 'pl', sets: [{ time: 30, done: true }], extra: true },
    ],
    movesDone: ['easy-cardio'],
    movesSkipped: ['stretch'],
  };

  it('plans by all sets, without the healthy extras', () => {
    const load = plannedMuscleSets(workout, byId);
    expect(load.quads).toBe(3);
    expect(load.abs).toBeUndefined();
  });

  it('forgets the ticks when finished', () => {
    const done = finishWorkout(workout).workout;
    expect(done).not.toHaveProperty('movesDone');
    expect(done).not.toHaveProperty('movesSkipped');
  });
});
