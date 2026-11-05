import { describe, it, expect } from 'vitest';
import { weightComparison } from './comparisons.js';

describe('weightComparison', () => {
  it('about, almost, or heavier than one thing', () => {
    expect(weightComparison(5800)).toBe("about Michelangelo's David");
    expect(weightComparison(8000)).toBe('almost an F-16 fighter jet');
    expect(weightComparison(1800)).toBe('heavier than a Lamborghini Aventador');
  });

  it('covers big days', () => {
    expect(weightComparison(60000)).toBe('heavier than an empty Boeing 737');
  });

  it('says nothing under a tonne', () => {
    expect(weightComparison(0)).toBe(null);
    expect(weightComparison(999)).toBe(null);
    expect(weightComparison(1000)).toBe('heavier than the Curiosity Mars rover');
  });
});
