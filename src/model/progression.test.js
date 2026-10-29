// Tests for the "what to try next time" suggestions (progression.js).
// Each test describes a situation in the gym and what the app should suggest.
// Run all tests with: npm test

import { describe, it, expect } from 'vitest';
import { suggestNext, planEntry } from './progression.js';

// A session of sets, e.g. session(60, [8, 8, 7]) or with RPE: session(60, [8, 8, 8], [7, 8, 8])
const session = (weight, reps, rpe = []) => ({
  date: '2026-10-01T10:00:00Z',
  sets: reps.map((r, i) => ({ weight, reps: r, time: null, rpe: rpe[i] ?? null, done: true })),
});
// Sessions are given oldest first here (easier to read) and reversed to newest first.
const history = (...sessions) => sessions.reverse();
const weights = (s) => s.sets.map((x) => x.weight);
const reps = (s) => s.sets.map((x) => x.reps);
const settings = (progression = 'double') => ({ unit: 'kg', weightStep: 2.5, progression });

// Train exactly as suggested for n sessions; returns what was suggested each time.
function follow(first, n, mode) {
  const done = [first];
  const suggestions = [];
  for (let i = 0; i < n; i++) {
    const s = suggestNext([...done].reverse(), 'weight', settings(mode));
    suggestions.push(s);
    done.push({ date: '', sets: s.sets.map((x) => ({ ...x, done: true })) });
  }
  return suggestions;
}

describe('Reps, then weight (default)', () => {
  it('adds a rep each session, confirms the goal once, then adds weight and goes back to the starting reps', () => {
    const s = follow(session(60, [8, 8, 8]), 4, 'double');
    expect(s.map((x) => x.kind)).toEqual(['reps', 'reps', 'confirm', 'up']);
    expect(reps(s[0])).toEqual([9, 9, 9]);
    expect(reps(s[1])).toEqual([10, 10, 10]);
    expect(reps(s[2])).toEqual([10, 10, 10]); // repeat to confirm
    expect(weights(s[3])).toEqual([62.5, 62.5, 62.5]);
    expect(reps(s[3])).toEqual([8, 8, 8]); // back to the starting reps
  });

  it('does not add a rep to a set that is already at the goal', () => {
    const s = suggestNext(history(session(60, [8, 8, 8]), session(60, [10, 9, 9])), 'weight', settings());
    expect(reps(s)).toEqual([10, 10, 10]);
  });
});

describe('Suggestion titles say what to do today, with the numbers', () => {
  it('one more rep', () => {
    expect(suggestNext(history(session(60, [8, 8, 8])), 'weight', settings()).title).toBe('One more rep: 60 kg × 9, 9, 9');
  });
  it('heavier, with the change and the reps to start from', () => {
    const s = follow(session(60, [8, 8, 8]), 4, 'double').at(-1);
    expect(s.title).toBe('Heavier: 62.5 kg (+2.5), back to 8 reps');
  });
});

describe('Easier than expected (a set 4+ reps above the session before)', () => {
  const auto = { unit: 'kg', weightStep: 'auto', progression: 'double' };

  it('goes heavier next time, back to the usual reps', () => {
    // 4 kg lateral raises: 10, 10, 10, then a day of 10, 16, 10
    const s = suggestNext(history(session(4, [10, 10, 10]), session(4, [10, 16, 10])), 'weight', auto);
    expect(s.kind).toBe('up');
    expect(weights(s)).toEqual([5, 5, 5]);
    expect(reps(s)).toEqual([10, 10, 10]);
    expect(s.title).toMatch(/16 reps was 6 more/);
  });

  it('jumps further when the set shows a lot more strength, up to 3 steps', () => {
    const s = suggestNext(history(session(20, [10, 10]), session(20, [25, 22])), 'weight', settings());
    expect(weights(s)[0]).toBe(27.5); // 20 kg × 25 ≈ 27 kg × 10, so 3 steps of 2.5
  });

  it('high reps on their own are fine: steady 15s keep building reps', () => {
    const s = suggestNext(history(session(10, [15, 15, 14]), session(10, [15, 15, 15])), 'weight', settings());
    expect(s.kind).not.toBe('up');
    expect(suggestNext(history(session(4, [10, 16, 10])), 'weight', auto).kind).toBe('reps'); // first time: no comparison yet
  });

  it('applies in every style, but a set at RPE 9.5+ still means repeat', () => {
    for (const mode of ['double', 'linear', 'rpe']) expect(suggestNext(history(session(30, [10, 10]), session(30, [15, 12])), 'weight', settings(mode)).kind).toBe('up');
    expect(suggestNext(history(session(4, [10]), session(4, [16], [10])), 'weight', auto).kind).toBe('hold');
  });
});

describe('Weight only', () => {
  it('adds weight after all reps are done two sessions in a row', () => {
    const s = follow(session(60, [8, 8, 8]), 4, 'linear');
    expect(s.map((x) => x.kind)).toEqual(['confirm', 'up', 'confirm', 'up']);
    expect(weights(s[1])).toEqual([62.5, 62.5, 62.5]);
    expect(weights(s[3])).toEqual([65, 65, 65]);
    expect(reps(s[3])).toEqual([8, 8, 8]);
  });

  it('stays at the weight when the last set fell short', () => {
    const s = suggestNext(history(session(60, [8, 8, 6])), 'weight', settings('linear'));
    expect(s.kind).toBe('hold');
    expect(reps(s)).toEqual([8, 8, 8]);
  });
});

describe('By RPE', () => {
  it('adds weight straight away when every set felt easy', () => {
    const s = suggestNext(history(session(60, [8, 8, 8], [6, 7, 7])), 'weight', settings('rpe'));
    expect(s.kind).toBe('up');
    expect(weights(s)).toEqual([62.5, 62.5, 62.5]);
  });

  it('adds a rep when the effort was moderate', () => {
    const s = suggestNext(history(session(60, [8, 8, 8], [8, 8.5, 9])), 'weight', settings('rpe'));
    expect(s.kind).toBe('reps');
    expect(reps(s)).toEqual([9, 9, 9]);
  });

  it('works like "Reps, then weight" when no RPE was logged, and says so', () => {
    const s = suggestNext(history(session(60, [8, 8, 8])), 'weight', settings('rpe'));
    expect(s.kind).toBe('reps');
    expect(s.text).toMatch(/no RPE logged/);
  });
});

describe('Safety rules (every style)', () => {
  it('repeats the session after a set at RPE 9.5 or higher', () => {
    for (const mode of ['double', 'linear', 'rpe']) {
      const s = suggestNext(history(session(60, [8, 8, 8], [8, 9, 10])), 'weight', settings(mode));
      expect(s.kind).toBe('hold');
      expect(weights(s)).toEqual([60, 60, 60]);
      expect(reps(s)).toEqual([8, 8, 8]);
    }
  });

  it('suggests a step lighter when reps drop 2+ below the start, two sessions in a row', () => {
    const s = suggestNext(history(session(60, [8, 8, 8]), session(60, [6, 6, 5]), session(60, [6, 5, 5])), 'weight', settings());
    expect(s.kind).toBe('down');
    expect(weights(s)).toEqual([57.5, 57.5, 57.5]);
    expect(reps(s)).toEqual([8, 8, 8]);
  });

  it('does not react to one bad day', () => {
    const s = suggestNext(history(session(60, [8, 8, 8]), session(60, [9, 9, 9]), session(60, [10, 10, 10]), session(60, [5, 5, 5])), 'weight', settings());
    expect(s.kind).not.toBe('down');
  });

  it('suggests a step lighter after a plateau of 4 sessions with no more reps', () => {
    const stuck = () => session(60, [9, 9, 7]);
    const s = suggestNext(history(session(60, [8, 8, 7]), stuck(), stuck(), stuck(), stuck()), 'weight', settings());
    expect(s.kind).toBe('down');
    expect(weights(s)).toEqual([57.5, 57.5, 57.5]);
  });
});

describe('Other exercise types', () => {
  it('assisted: less assistance counts as heavier, and the title says so', () => {
    const last = suggestNext(
      history(session(-30, [6, 6, 6]), session(-30, [7, 7, 7]), session(-30, [8, 8, 8]), session(-30, [8, 8, 8])),
      'assisted',
      settings(),
    );
    expect(weights(last)).toEqual([-27.5, -27.5, -27.5]);
    expect(last.title).toMatch(/less assistance/);
  });

  it('bodyweight reps: one more rep per set', () => {
    const s = suggestNext(history(session(null, [10, 8])), 'reps', settings());
    expect(reps(s)).toEqual([11, 9]);
  });

  it('timed holds: 5 s longer, or 10 s once holds reach a minute', () => {
    const hold = (sec) => ({ date: '', sets: [{ weight: null, reps: null, time: sec, rpe: null, done: true }] });
    expect(suggestNext([hold(45)], 'time', settings()).sets[0].time).toBe(50);
    expect(suggestNext([hold(60)], 'time', settings()).sets[0].time).toBe(70);
  });

  it('respects the weight step from Settings', () => {
    const s = suggestNext(history(session(20, [8, 8, 8], [6, 6, 6])), 'weight', { ...settings('rpe'), weightStep: 1 });
    expect(weights(s)).toEqual([21, 21, 21]);
  });
});

describe('Adding an exercise to today\'s workout (planEntry)', () => {
  const workout = (id, startedAt, sets) => ({
    id, startedAt, finishedAt: startedAt, notes: '',
    entries: [{ id: 'e' + id, exerciseId: 'bench', sets }],
  });
  const bench = { id: 'bench', name: 'Bench press', type: 'weight' };
  const done = (weight, r) => ({ id: 's', weight, reps: r, time: null, rpe: null, done: true });

  it('starts a new exercise with 3 empty sets and no hint', () => {
    const entry = planEntry(bench, { workouts: [], settings: settings(), startedAt: '2026-10-10' });
    expect(entry.sets).toHaveLength(3);
    expect(entry.sets.every((s) => s.weight === null && s.reps === null && !s.done)).toBe(true);
    expect(entry.suggestion).toBeNull();
  });

  it('starts from last time with the suggestion applied, ignoring today\'s own workout', () => {
    const workouts = [
      workout('old', '2026-10-01', [done(60, 8), done(60, 8)]),
      workout('today', '2026-10-10', [done(100, 1)]), // must not count as "last time"
    ];
    const entry = planEntry(bench, { workouts, settings: settings(), startedAt: '2026-10-10' });
    // the suggestion is the plan: grey targets, the fields themselves still empty
    expect(entry.sets.map((s) => [s.target.weight, s.target.reps])).toEqual([[60, 9], [60, 9]]);
    expect(entry.sets.every((s) => s.weight === null && s.reps === null && !s.done)).toBe(true);
    expect(entry.suggestion).toMatchObject({ kind: 'reps', title: 'One more rep: 60 kg × 9, 9', text: expect.any(String) });
    expect(entry.suggestion.sets).toEqual([{ weight: 60, reps: 9, time: null }, { weight: 60, reps: 9, time: null }]);
  });

  it('a plan day with more sets than last time repeats the last set as a plan', () => {
    const workouts = [workout('old', '2026-10-01', [done(60, 8), done(60, 8)])];
    const entry = planEntry(bench, { workouts, settings: settings(), startedAt: '2026-10-10' }, false, 3);
    expect(entry.sets).toHaveLength(3);
    expect(entry.sets.every((s) => !s.done && s.target.reps === 9)).toBe(true);
  });
});

describe('Weight jumps', () => {
  // Ready to go up: 10 reps twice after starting at 8.
  const ready = (w) => history(session(w, [8, 8, 8]), session(w, [9, 9, 9]), session(w, [10, 10, 10]), session(w, [10, 10, 10]));
  const auto = { unit: 'kg', weightStep: 'auto', progression: 'double' };

  it('automatic jumps are small for light dumbbells and bigger for heavy lifts', () => {
    expect(weights(suggestNext(ready(4), 'weight', auto))[0]).toBe(5); // +1 kg, not 4 → 6.5
    expect(weights(suggestNext(ready(30), 'weight', auto))[0]).toBe(32.5);
    expect(weights(suggestNext(ready(100), 'weight', auto))[0]).toBe(105);
  });

  it('a fixed jump in Settings is used as it is', () => {
    expect(weights(suggestNext(ready(4), 'weight', settings()))[0]).toBe(6.5);
  });
});
