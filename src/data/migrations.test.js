// Tests for migrations.js and backup.js: data saved by older versions of the
// app (on the phones, or in old backup files) must keep working.

import { describe, it, expect } from 'vitest';
import { migrate, needsMigration, SCHEMA_VERSION } from './migrations.js';
import { readBackup, createBackup, backupDue } from './backup.js';

// Data as v0.1 saved it: exercises without a type, numbers as typed text.
const v01 = {
  exercises: [{ id: 'starter-0', name: 'Bench press' }, { id: 'starter-5', name: 'Pull-up' }],
  workouts: [
    {
      id: 'w1', startedAt: '2026-10-22T18:00:00Z', finishedAt: '2026-10-22T19:00:00Z', notes: '',
      entries: [{ id: 'e1', exerciseId: 'starter-0', sets: [{ id: 's1', weight: '62,5', reps: '8', done: true, doneAt: '2026-10-22T18:10:00Z' }] }],
    },
  ],
  settings: [{ key: 'unit', value: 'kg' }],
};

describe('Updating old data', () => {
  it('recognises data that needs updating', () => {
    expect(needsMigration(v01)).toBe(true);
    expect(needsMigration(migrate(v01))).toBe(false);
  });

  it('gives exercises from v0.1 a type guessed from the name', () => {
    expect(migrate(v01).exercises.map((e) => e.type)).toEqual(['weight', 'reps']);
  });

  it('turns typed text into numbers, and empty or "-" into null', () => {
    const data = migrate({
      ...v01,
      workouts: [{ ...v01.workouts[0], entries: [{ id: 'e', exerciseId: 'x', sets: [{ id: 's', weight: '-', reps: '', time: '45', rpe: '8,5', done: true }] }] }],
    });
    expect(data.workouts[0].entries[0].sets[0]).toMatchObject({ weight: null, reps: null, time: 45, rpe: 8.5 });
    expect(migrate(v01).workouts[0].entries[0].sets[0]).toMatchObject({ weight: 62.5, reps: 8, done: true });
  });

  it('keeps hints short: only kind and text', () => {
    const data = migrate({
      ...v01,
      workouts: [{ ...v01.workouts[0], finishedAt: null, entries: [{ id: 'e', exerciseId: 'x', sets: [], suggestion: { kind: 'up', text: 'Try 65', sets: [{}] } }] }],
    });
    expect(data.workouts[0].entries[0].suggestion).toEqual({ kind: 'up', text: 'Try 65' });
  });

  it('keeps plans, and which plan day a workout came from', () => {
    const plan = { id: 'p', name: 'PPL', days: [{ id: 'd', name: 'Push', items: [{ exerciseId: 'starter-0', sets: 4 }] }] };
    const data = migrate({ ...v01, plans: [plan], workouts: [{ ...v01.workouts[0], planId: 'p', dayId: 'd', name: 'Push' }] });
    expect(data.plans).toEqual([plan]);
    expect(data.workouts[0]).toMatchObject({ planId: 'p', dayId: 'd', name: 'Push' });
  });

  it('gives data from before plans an empty list of plans', () => {
    expect(migrate(v01).plans).toEqual([]);
  });

  it('changes nothing more when run again on up-to-date data', () => {
    const once = migrate(v01);
    expect(migrate(once)).toEqual(once);
  });

  it('keeps settings and records the new version', () => {
    const settings = migrate(v01).settings;
    expect(settings).toContainEqual({ key: 'unit', value: 'kg' });
    expect(settings).toContainEqual({ key: 'schemaVersion', value: SCHEMA_VERSION });
  });
});

describe('Backup files', () => {
  it('restores a backup made by v0.1', () => {
    const data = readBackup(JSON.stringify({ app: 'workout', version: 1, ...v01 }));
    expect(data.workouts[0].entries[0].sets[0].weight).toBe(62.5);
  });

  it('a new backup reads back the same', () => {
    const current = migrate(v01);
    const backup = createBackup({ exercises: current.exercises, workouts: current.workouts, settings: { unit: 'lb' } });
    const restored = readBackup(JSON.stringify(backup));
    expect(restored.workouts).toEqual(current.workouts);
    expect(restored.settings).toContainEqual({ key: 'unit', value: 'lb' });
  });

  it('reminds about a backup after 3 workouts, then every two weeks', () => {
    const now = Date.parse('2026-10-25T12:00:00Z');
    expect(backupDue(null, 2, now)).toBe(false);
    expect(backupDue(null, 3, now)).toBe(true);
    expect(backupDue('2026-10-20T12:00:00Z', 10, now)).toBe(false);
    expect(backupDue('2026-10-01T12:00:00Z', 10, now)).toBe(true);
  });

  it('refuses files that are not backups', () => {
    expect(() => readBackup('not json')).toThrow(/not a Workout backup/);
    expect(() => readBackup('{"hello": 1}')).toThrow(/not a Workout backup/);
  });
});


describe('Plans keep their healthy-extra marks', () => {
  it('an extra stays marked through migrate()', () => {
    const data = { exercises: [], workouts: [], settings: [], plans: [{ id: 'p', name: 'P', days: [{ id: 'd', name: 'A', items: [{ exerciseId: 'x', sets: 2, extra: true }, { exerciseId: 'y', sets: 3 }] }] }] };
    expect(migrate(data).plans[0].days[0].items).toEqual([{ exerciseId: 'x', sets: 2, extra: true }, { exerciseId: 'y', sets: 3 }]);
  });
});
