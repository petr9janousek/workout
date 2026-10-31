import { describe, it, expect } from 'vitest';
import { weightComparison } from './comparisons.js';

describe('weightComparison', () => {
  it('picks the closest thing', () => {
    expect(weightComparison(4100)).toBe('about an Asian elephant');
    expect(weightComparison(1450)).toBe('almost a hippo');
    expect(weightComparison(1600)).toBe('about a hippo');
  });
  it('counts several when far above one thing but not near the next', () => {
    expect(weightComparison(200)).toBe('about 3 washing machines');
    expect(weightComparison(100)).toBe('more than a washing machine');
  });
  it('works for huge totals', () => {
    expect(weightComparison(15e6)).toBe('about 2 Eiffel Towers');
  });
  it('says nothing for very little', () => {
    expect(weightComparison(0)).toBe(null);
    expect(weightComparison(2)).toBe(null);
  });
});
