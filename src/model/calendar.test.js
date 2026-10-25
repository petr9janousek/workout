// Tests for calendar.js: days on the calendar, weekly goals and streaks.
// Dates are local times; 2026-10-26 is a Monday.

import { describe, it, expect } from 'vitest';
import { dayKey, weekStart, monthGrid, weeklyCounts, weekStreak, bestWeekStreak, daysSinceLast, workoutsByDay, weeklyGoal } from './calendar.js';

const at = (y, m, d, h = 18) => new Date(y, m - 1, d, h).toISOString();
const workout = (iso, finished = true) => ({ id: iso, startedAt: iso, finishedAt: finished ? iso : null, entries: [] });
// Workouts on these days of a month (Oct 2026 unless given).
const on = (days, m = 10) => days.map((d) => workout(at(2026, m, d)));

describe('Days and weeks', () => {
  it('uses the local date for a day', () => {
    expect(dayKey(new Date(2026, 9, 25, 23, 30))).toBe('2026-10-25');
  });
  it('weeks start on Monday', () => {
    expect(dayKey(weekStart(new Date(2026, 9, 25)))).toBe('2026-10-19'); // Sunday → previous Monday
    expect(dayKey(weekStart(new Date(2026, 9, 26)))).toBe('2026-10-26'); // Monday → itself
  });
  it('a month is shown as whole weeks, Monday first', () => {
    const grid = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(grid.every((week) => week.length === 7 && week[0].getDay() === 1)).toBe(true);
    expect(dayKey(grid[0][0])).toBe('2026-09-28');
    expect(dayKey(grid.at(-1)[6])).toBe('2026-11-01');
    expect(grid).toHaveLength(5);
  });
  it('groups finished workouts by day, ignoring the one in progress', () => {
    const byDay = workoutsByDay([...on([5, 5, 7]), workout(at(2026, 10, 8), false)]);
    expect(Object.keys(byDay).sort()).toEqual(['2026-10-05', '2026-10-07']);
    expect(byDay['2026-10-05']).toHaveLength(2);
  });
});

describe('Weekly goal and streaks', () => {
  const now = new Date(2026, 9, 28, 12); // Wednesday 28 Oct

  it('counts training days per week, two workouts on one day as one', () => {
    const weeks = weeklyCounts([...on([19, 19, 21]), ...on([26])], 2, now);
    expect(weeks.map((w) => w.days)).toEqual([2, 1]);
  });

  it('counts weeks in a row that reached the goal', () => {
    // 3 days a week for the 3 weeks before this one
    const workouts = on([5, 7, 9, 12, 14, 16, 19, 21, 23]);
    expect(weekStreak(workouts, 3, now)).toBe(3);
  });

  it('this week does not break the streak while it is still going', () => {
    const workouts = on([12, 14, 16, 19, 21, 23, 26]); // this week: only 1 so far
    expect(weekStreak(workouts, 3, now)).toBe(2);
  });

  it('this week counts once the goal is reached', () => {
    const workouts = on([19, 21, 23, 26, 27, 28]);
    expect(weekStreak(workouts, 3, now)).toBe(2);
  });

  it('a week below the goal ends the streak, a rest day does not', () => {
    const workouts = on([5, 7, 9, 12, 19, 21, 23]); // week of 12th: only 1 day
    expect(weekStreak(workouts, 3, now)).toBe(1);
    expect(bestWeekStreak(workouts, 3, now)).toBe(1);
    expect(bestWeekStreak(on([5, 7, 9, 12, 14, 16]), 3, now)).toBe(2);
  });

  it('days since the last workout', () => {
    expect(daysSinceLast(on([25]), now)).toBe(3);
    expect(daysSinceLast(on([28]), now)).toBe(0);
    expect(daysSinceLast([], now)).toBeNull();
  });

  it('the weekly goal: from Settings, else the plan\'s days, else 2 (WHO minimum)', () => {
    expect(weeklyGoal({ weeklyGoal: 4 }, { days: [1, 2, 3] })).toBe(4);
    expect(weeklyGoal({ weeklyGoal: null }, { days: [1, 2, 3] })).toBe(3);
    expect(weeklyGoal({ weeklyGoal: null }, null)).toBe(2);
  });
});
