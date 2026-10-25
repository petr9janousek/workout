// Tests for bodyWeight.js.

import { describe, it, expect } from 'vitest';
import { logBodyWeight, bodyWeightChange } from './bodyWeight.js';

describe('Body weight', () => {
  it('keeps one entry per day, oldest first', () => {
    let list = logBodyWeight([], '2026-10-20', 63);
    list = logBodyWeight(list, '2026-10-10', 63.5);
    list = logBodyWeight(list, '2026-10-20', 62.8); // corrected the same day
    expect(list).toEqual([
      { date: '2026-10-10', weight: 63.5 },
      { date: '2026-10-20', weight: 62.8 },
    ]);
  });

  it('clearing the field removes that day', () => {
    expect(logBodyWeight([{ date: '2026-10-20', weight: 63 }], '2026-10-20', null)).toEqual([]);
  });

  it('change over the last 30 days', () => {
    const list = [
      { date: '2026-08-01', weight: 70 }, // too old
      { date: '2026-10-01', weight: 64 },
      { date: '2026-10-24', weight: 63.2 },
    ];
    expect(bodyWeightChange(list, 30, new Date('2026-10-25T12:00:00Z'))).toBe(-0.8);
    expect(bodyWeightChange(list.slice(0, 2), 30, new Date('2026-10-25T12:00:00Z'))).toBeNull();
  });
});
