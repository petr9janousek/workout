import { describe, it, expect } from 'vitest';
import { tipsFor, TIP_NAMES } from './tips.js';
import { STARTER_EXERCISES } from './exercises.js';
import { PLAN_TEMPLATES } from './planTemplates.js';
import { EXTRAS } from './extras.js';

describe('tipsFor', () => {
  it('has tips for every exercise the app creates', () => {
    const names = new Set(STARTER_EXERCISES);
    for (const t of PLAN_TEMPLATES) for (const [, items] of t.days) for (const [n] of items) names.add(n);
    for (const list of Object.values(EXTRAS)) for (const [n] of list) names.add(n);
    const missing = [...names].filter((n) => !tipsFor({ name: n }));
    expect(missing).toEqual([]);
    expect(TIP_NAMES.length).toBeGreaterThanOrEqual(names.size);
  });
  it('finds them regardless of case, and none for your own', () => {
    expect(tipsFor({ name: 'HIP THRUST ' }).cues).toHaveLength(3);
    expect(tipsFor({ name: 'My weird exercise' })).toBe(null);
  });
});
