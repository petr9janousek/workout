// Tests for settings.js: weight jumps and rest between sets.

import { describe, it, expect } from 'vitest';
import { weightStepFor, settingsFor, restTarget, settingsFromList } from './settings.js';

describe('Weight jumps', () => {
  it('automatic: small jumps for light weights, bigger for heavy ones', () => {
    const kg = { weightStep: 'auto', unit: 'kg' };
    expect([4, 9, 10, 20, 25, 60, 80, 140].map((w) => weightStepFor(w, kg))).toEqual([1, 1, 2, 2, 2.5, 2.5, 5, 5]);
  });

  it('automatic in pounds: 2.5, 5 or 10 lb', () => {
    const lb = { weightStep: 'auto', unit: 'lb' };
    expect([10, 50, 200].map((w) => weightStepFor(w, lb))).toEqual([2.5, 5, 10]);
  });

  it('assisted exercises use the size of the assistance', () => {
    expect(weightStepFor(-40, { weightStep: 'auto' })).toBe(2.5);
  });

  it('a fixed step is used for every weight', () => {
    expect(weightStepFor(4, { weightStep: 2.5 })).toBe(2.5);
  });

  it("an exercise's own jump wins over the general one", () => {
    const settings = { weightStep: 'auto', unit: 'kg' };
    expect(settingsFor(settings, { weightStep: 1.25 }).weightStep).toBe(1.25);
    expect(settingsFor(settings, { weightStep: null })).toBe(settings);
  });

  it('new installs use automatic jumps', () => {
    expect(settingsFromList([]).weightStep).toBe('auto');
  });
});

describe('Rest between sets', () => {
  const auto = { restSeconds: null };
  it('automatic: 2:00 after big lifts, 1:30 after the rest', () => {
    for (const name of ['Squat', 'Bench press', 'Romanian deadlift', 'Barbell row', 'Pull-up', 'Lat pulldown', 'Hip thrust', 'Arnold press'])
      expect(restTarget(auto, { name })).toBe(120);
    for (const name of ['Lateral raise', 'Dumbbell curl', 'Pallof press', 'Band pull-apart', 'Face pull', 'Calf raise', 'Plank'])
      expect(restTarget(auto, { name })).toBe(90);
  });
  it('without an exercise (session estimates): in between', () => {
    expect(restTarget(auto)).toBe(105);
  });

  it('a chosen rest time wins', () => {
    expect(restTarget({ restSeconds: 60 }, { name: 'Squat' })).toBe(60);
  });
});
