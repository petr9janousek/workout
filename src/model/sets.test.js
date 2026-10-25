// Tests for sets.js and format.js: reading typed numbers and showing sets.

import { describe, it, expect } from 'vitest';
import { parseNumber, formatSigned, formatSeconds, formatNumber } from './format.js';
import { formatSet, compareSets, isDoneSet, nextSet } from './sets.js';

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
    expect(formatSet(s(62.5, 8, { rpe: 8 }), 'weight', 'kg')).toBe('62.5 kg × 8 @8');
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
  it('"Add set" copies the values of the last set but not its RPE or tick', () => {
    const added = nextSet([{ id: 'a', weight: 60, reps: 8, time: null, rpe: 9, done: true }]);
    expect(added).toMatchObject({ weight: 60, reps: 8, rpe: null, done: false });
    expect(added.id).not.toBe('a');
  });
});
