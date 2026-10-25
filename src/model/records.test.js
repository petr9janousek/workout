// Tests for records.js: which sets get a trophy.

import { describe, it, expect } from 'vitest';
import { recordSetIds, countRecords } from './records.js';

let n = 0;
const set = (weight, reps, extra = {}) => ({ id: `s${++n}`, weight, reps, time: null, rpe: null, done: true, ...extra });
const ids = (sets, earlier, type = 'weight') => [...recordSetIds(sets, earlier, type)];

describe('Personal records', () => {
  const before = [set(60, 8), set(60, 8), set(57.5, 9)];

  it('heavier than ever is a record', () => {
    const s = set(62.5, 6);
    expect(ids([s], before)).toEqual([s.id]);
  });

  it('one more rep at the same weight is a record (higher estimated 1RM)', () => {
    const s = set(60, 9);
    expect(ids([s], before)).toEqual([s.id]);
  });

  it('matching your best, or a lighter set, is not', () => {
    expect(ids([set(60, 8), set(55, 8)], before)).toEqual([]);
  });

  it('repeating a record on the next set gives only one trophy; beating it again gives another', () => {
    const a = set(60, 9), b = set(60, 9), c = set(60, 10);
    expect(ids([a, b, c], before)).toEqual([a.id, c.id]);
  });

  it('sets not ticked as done never count', () => {
    expect(ids([set(80, 5, { done: false })], before)).toEqual([]);
  });

  it('no records the first time you do an exercise', () => {
    expect(ids([set(60, 8)], [])).toEqual([]);
  });

  it('bodyweight: more reps; timed: longer hold', () => {
    const r = set(null, 13);
    expect(ids([set(null, 12), r], [set(null, 12)], 'reps')).toEqual([r.id]);
    const t = set(null, null, { time: 65 });
    expect(ids([t], [set(null, null, { time: 60 })], 'time')).toEqual([t.id]);
  });

  it('assisted: less assistance, or more reps at your best load', () => {
    const earlier = [set(-30, 8), set(-25, 6)];
    const less = set(-20, 5);
    const moreReps = set(-25, 7);
    expect(ids([less], earlier, 'assisted')).toEqual([less.id]);
    expect(ids([moreReps], earlier, 'assisted')).toEqual([moreReps.id]);
    expect(ids([set(-30, 8)], earlier, 'assisted')).toEqual([]);
  });

  it('counts the records of a finished workout against the workouts before it', () => {
    const bench = { id: 'bench', name: 'Bench press' };
    const byId = new Map([['bench', bench]]);
    const w = (id, startedAt, sets) => ({ id, startedAt, finishedAt: startedAt, entries: [{ id: 'e' + id, exerciseId: 'bench', sets }] });
    const old = w('1', '2026-10-01T10:00:00Z', [set(60, 8)]);
    const newer = w('2', '2026-10-08T10:00:00Z', [set(62.5, 8), set(62.5, 8)]);
    expect(countRecords(newer, [newer, old], byId)).toBe(1);
    expect(countRecords(old, [newer, old], byId)).toBe(0); // later workouts don't count
  });
});
