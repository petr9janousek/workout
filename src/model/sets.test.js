// Tests for sets.js and format.js: reading typed numbers and showing sets.

import { describe, it, expect } from 'vitest';
import { parseNumber, formatSigned, formatSeconds, formatNumber, keepLastWord } from './format.js';
import { formatSet, compareSets, isDoneSet, nextSet, formatSetList, asTarget, tickSet, planBelow, shown } from './sets.js';

describe('Reading typed numbers', () => {
  it('accepts a decimal comma as well as a dot', () => {
    expect(parseNumber('62,5')).toBe(62.5);
    expect(parseNumber('62.5')).toBe(62.5);
  });
  it('treats an empty field as no value (null)', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('  ')).toBeNull();
  });
  it('reports text that is not a number yet as undefined, so it is not saved', () => {
    expect(parseNumber('-')).toBeUndefined();
    expect(parseNumber('abc')).toBeUndefined();
  });
  it('accepts a number still being typed, like "62,"', () => {
    expect(parseNumber('62,')).toBe(62);
  });
});

describe('Showing sets', () => {
  const s = (weight, reps, extra = {}) => ({ weight, reps, time: null, rpe: null, ...extra });
  it('weight × reps, with unit and RPE', () => {
    expect(formatSet(s(62.5, 8, { rpe: 8 }), 'weight', 'kg')).toBe('62.5 kg × 8 (RPE 8)');
  });
  it('a weight exercise done without weight shows only reps', () => {
    expect(formatSet(s(null, 12), 'weight')).toBe('12 reps');
  });
  it('assisted: minus for assistance, plus for added weight, BW for none', () => {
    expect(formatSet(s(-20, 8), 'assisted', 'kg')).toBe('−20 kg × 8');
    expect(formatSet(s(10, 6), 'assisted', 'kg')).toBe('+10 kg × 6');
    expect(formatSet(s(0, 6), 'assisted', 'kg')).toBe('BW × 6');
  });
  it('timed holds in seconds, minutes from 60 s', () => {
    expect(formatSet(s(null, null, { time: 45 }), 'time')).toBe('45 s');
    expect(formatSeconds(90)).toBe('1:30');
  });
  it('numbers without needless decimals', () => {
    expect(formatNumber(60)).toBe('60');
    expect(formatNumber(62.5)).toBe('62.5');
    expect(formatSigned(-2.5)).toBe('−2.5');
  });
});

describe('Comparing with last time (▲▼)', () => {
  const s = (weight, reps) => ({ weight, reps });
  it('heavier is better, then more reps', () => {
    expect(compareSets(s(62.5, 6), s(60, 8), 'weight')).toBe(1);
    expect(compareSets(s(60, 9), s(60, 8), 'weight')).toBe(1);
    expect(compareSets(s(60, 7), s(60, 8), 'weight')).toBe(-1);
    expect(compareSets(s(60, 8), s(60, 8), 'weight')).toBe(0);
  });
  it('assisted: less assistance is better', () => {
    expect(compareSets(s(-25, 8), s(-30, 8), 'assisted')).toBe(1);
  });
  it('no arrow when there was no set last time', () => {
    expect(compareSets(s(60, 8), undefined, 'weight')).toBe(0);
  });
});

describe('Sets', () => {
  it('a set counts only when ticked and with reps or time', () => {
    expect(isDoneSet({ done: true, reps: 8 })).toBe(true);
    expect(isDoneSet({ done: false, reps: 8 })).toBe(false);
    expect(isDoneSet({ done: true, reps: null, time: 30 })).toBe(true);
    expect(isDoneSet({ done: true, reps: null, time: null })).toBe(false);
  });
  it('"Add set" plans the values of the last set (grey), but not its RPE or tick', () => {
    const added = nextSet([{ id: 'a', weight: 60, reps: 8, time: null, rpe: 9, done: true }]);
    expect(added).toMatchObject({ weight: null, reps: null, rpe: null, done: false, target: { weight: 60, reps: 8 } });
    expect(added.id).not.toBe('a');
  });
  it('in a finished workout, "Add set" copies the last set as done', () => {
    expect(nextSet([{ weight: 60, reps: 8 }], true)).toMatchObject({ weight: 60, reps: 8, done: true });
  });
});

describe('keepLastWord', () => {
  it('ties a short last word to the one before', () => {
    expect(keepLastWord('Full body A')).toBe('Full body\u00a0A');
    expect(keepLastWord('Day 1')).toBe('Day\u00a01');
  });
  it('leaves longer names and single words alone', () => {
    expect(keepLastWord('Glutes & upper')).toBe('Glutes & upper');
    expect(keepLastWord('Legs')).toBe('Legs');
    expect(keepLastWord(undefined)).toBe('');
  });
});

describe('Planned (grey) values', () => {
  const planned = asTarget({ id: 'a', weight: 60, reps: 9, time: null, rpe: null, done: false });

  it('a plan keeps its values aside until the set is ticked', () => {
    expect([planned.weight, planned.reps]).toEqual([null, null]);
    expect([shown(planned, 'weight'), shown(planned, 'reps')]).toEqual([60, 9]);
    const ticked = tickSet(planned, '2026-10-29T10:00:00Z');
    expect([ticked.weight, ticked.reps, ticked.done]).toEqual([60, 9, true]);
  });

  it('what you type wins over the plan when ticking', () => {
    expect(tickSet({ ...planned, reps: 7 }).reps).toBe(7);
  });

  it('typing into one set plans the empty sets below it, not the ones above or done', () => {
    const sets = [{ id: '1', weight: null, done: true, target: {} }, { id: '2', weight: null, target: {} }, { id: '3', weight: null, target: {} }, { id: '4', weight: 50, target: {} }];
    const out = planBelow(sets, 1, 'weight', 40);
    expect(out.map((s) => s.target.weight)).toEqual([undefined, undefined, 40, undefined]);
    expect(planBelow(sets, 1, 'rpe', 8)).toBe(sets); // RPE is never planned
  });

  it('▲▼ compare the planned values too', () => {
    expect(compareSets(planned, { weight: 60, reps: 8 }, 'weight')).toBe(1);
  });
});

describe('Several sets in one line', () => {
  const w = (weight, reps, rpe = null) => ({ weight, reps, time: null, rpe });
  it('groups sets of the same weight and shows the hardest RPE', () => {
    expect(formatSetList([w(42.5, 10), w(42.5, 10, 7), w(42.5, 9, 8)], 'weight', 'kg')).toBe('42.5 kg × 10, 10, 9 (RPE 8)');
    expect(formatSetList([w(40, 10), w(42.5, 8), w(42.5, 8)], 'weight', 'kg')).toBe('40 kg × 10 · 42.5 kg × 8, 8');
  });
  it('bodyweight, assisted and timed sets', () => {
    expect(formatSetList([w(null, 12), w(null, 10)], 'reps')).toBe('12, 10 reps');
    expect(formatSetList([w(-20, 8), w(-20, 7)], 'assisted', 'kg')).toBe('−20 kg × 8, 7');
    expect(formatSetList([{ time: 45 }, { time: 40 }], 'time')).toBe('45 s, 40 s');
  });
});
