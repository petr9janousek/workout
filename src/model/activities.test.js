// Tests for activities.js and how activities count in the calendar.

import { describe, it, expect } from 'vitest';
import { createActivity, countsAsActiveDay, whoMinutes, updateActivity, activitySummary, activityLabel, pace } from './activities.js';
import { weeklyCounts, activeMinutesThisWeek, dayKind, dayMarks, workoutsByDay, daysSinceLast } from './calendar.js';
import { migrate } from '../data/migrations.js';

const at = (iso) => new Date(iso).toISOString();
const gym = (iso) => ({ id: 'g' + iso, startedAt: at(iso), finishedAt: at(iso), notes: '', entries: [] });
const now = new Date('2026-10-30T20:00:00'); // a Friday

describe('Other activities', () => {
  it('a 20-minute activity is an active day; a 15-minute stroll is not', () => {
    expect(countsAsActiveDay(createActivity({ activity: 'run', minutes: 20 }, at('2026-10-27T07:00:00')))).toBe(true);
    expect(countsAsActiveDay(createActivity({ activity: 'walk', minutes: 15 }, at('2026-10-27T07:00:00')))).toBe(false);
  });

  it('count toward the week: gym days plus activity days, each day once', () => {
    const workouts = [
      gym('2026-10-26T18:00:00'), // Mon gym
      createActivity({ activity: 'run', minutes: 30 }, at('2026-10-26T07:00:00')), // Mon run too: still one day
      createActivity({ activity: 'swim', minutes: 45 }, at('2026-10-28T19:00:00')), // Wed swim
      createActivity({ activity: 'walk', minutes: 10 }, at('2026-10-29T12:00:00')), // Thu short walk: doesn't count
    ];
    expect(weeklyCounts(workouts, 1, now)[0].days).toBe(2);
  });

  it('calendar days: gym, active, light', () => {
    const byDay = workoutsByDay([
      gym('2026-10-26T18:00:00'),
      createActivity({ activity: 'swim', minutes: 45 }, at('2026-10-28T19:00:00')),
      createActivity({ activity: 'walk', minutes: 10 }, at('2026-10-29T12:00:00')),
    ]);
    expect([dayKind(byDay['2026-10-26']), dayKind(byDay['2026-10-28']), dayKind(byDay['2026-10-29']), dayKind(byDay['2026-10-30'])]).toEqual(['gym', 'active', 'light', null]);
  });

  it('calendar marks stack: gym and an activity on the same day show both; short ones show nothing', () => {
    const byDay = workoutsByDay([
      gym('2026-10-26T18:00:00'),
      createActivity({ activity: 'run', minutes: 30 }, at('2026-10-26T07:00:00')),
      createActivity({ activity: 'swim', minutes: 45 }, at('2026-10-28T19:00:00')),
      createActivity({ activity: 'walk', minutes: 10 }, at('2026-10-29T12:00:00')),
    ]);
    expect(dayMarks(byDay['2026-10-26'])).toEqual({ gym: true, active: true });
    expect(dayMarks(byDay['2026-10-28'])).toEqual({ gym: false, active: true });
    expect(dayMarks(byDay['2026-10-29'])).toEqual({ gym: false, active: false });
  });

  it('WHO minutes: moderate counts once, hard twice, easy not at all', () => {
    expect(whoMinutes(createActivity({ activity: 'run', minutes: 30, effort: 'moderate' }, at('2026-10-27T07:00:00')))).toBe(30);
    expect(whoMinutes(createActivity({ activity: 'run', minutes: 30, effort: 'hard' }, at('2026-10-27T07:00:00')))).toBe(60);
    expect(whoMinutes(createActivity({ activity: 'walk', minutes: 30, effort: 'easy' }, at('2026-10-27T07:00:00')))).toBe(0);
  });

  it('active minutes this week only count this week', () => {
    const workouts = [
      createActivity({ activity: 'run', minutes: 30, effort: 'hard' }, at('2026-10-27T07:00:00')),
      createActivity({ activity: 'run', minutes: 40 }, at('2026-10-20T07:00:00')), // last week
    ];
    expect(activeMinutesThisWeek(workouts, now)).toBe(60);
  });

  it('days since the last active day skips short strolls', () => {
    const workouts = [gym('2026-10-27T18:00:00'), createActivity({ activity: 'walk', minutes: 10 }, at('2026-10-29T12:00:00'))];
    expect(daysSinceLast(workouts, now)).toBe(3);
  });

  it('editing the minutes moves the end time along', () => {
    const a = createActivity({ activity: 'run', minutes: 30 }, at('2026-10-27T07:00:00'));
    expect(updateActivity(a, { minutes: 60 }).finishedAt).toBe(at('2026-10-27T08:00:00'));
  });

  it('a short summary for lists', () => {
    const a = createActivity({ activity: 'run', minutes: 45, distance: 7.25, calories: 420 }, at('2026-10-27T07:00:00'));
    expect(activitySummary(a, 'km')).toBe('45 min · Moderate · 7.25 km · 6:12 /km · 420 kcal');
  });

  it('pace only for things done on foot', () => {
    expect(pace(createActivity({ activity: 'run', minutes: 30, distance: 6 }, at('2026-10-27T07:00:00')), 'km')).toBe('5:00 /km');
    expect(pace(createActivity({ activity: 'cycle', minutes: 30, distance: 12 }, at('2026-10-27T07:00:00')), 'km')).toBeNull();
  });

  it('"Other" uses the name you typed', () => {
    expect(activityLabel(createActivity({ activity: 'other', name: 'Bouldering', minutes: 60 }, at('2026-10-27T07:00:00')))).toBe('Bouldering');
    expect(activityLabel(createActivity({ activity: 'other', minutes: 60 }, at('2026-10-27T07:00:00')))).toBe('Other');
    expect(activityLabel(createActivity({ activity: 'swim', name: 'ignored', minutes: 60 }, at('2026-10-27T07:00:00')))).toBe('Swimming');
  });

  it('activities survive a backup and restore', () => {
    const a = createActivity({ activity: 'dance', minutes: 60, effort: 'hard', notes: 'salsa' }, at('2026-10-27T19:00:00'));
    expect(migrate({ exercises: [], workouts: [a], plans: [], settings: [] }).workouts[0]).toEqual(a);
  });
});
