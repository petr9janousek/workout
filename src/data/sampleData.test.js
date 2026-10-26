// Tests for sampleData.js: the sample data must look like real data.

import { describe, it, expect } from 'vitest';
import { sampleData } from './sampleData.js';
import { migrate, needsMigration } from './migrations.js';
import { weekStreak } from '../model/calendar.js';
import { settingsFromList } from '../model/settings.js';

describe('Sample data', () => {
  const now = new Date('2026-10-26T20:00:00');
  const data = sampleData({ body: 'female' }, now);

  it('is up to date and every workout uses exercises that exist', () => {
    expect(needsMigration(data)).toBe(false);
    const ids = new Set(data.exercises.map((e) => e.id));
    for (const w of data.workouts) for (const e of w.entries) expect(ids.has(e.exerciseId)).toBe(true);
    expect(migrate(data).workouts).toHaveLength(data.workouts.length);
  });

  it('about 8 weeks of finished workouts on the active plan, all in the past', () => {
    expect(data.workouts.filter((w) => w.kind !== 'activity').length).toBeGreaterThanOrEqual(18);
    expect(data.workouts.every((w) => w.finishedAt && new Date(w.startedAt) <= now)).toBe(true);
    const settings = settingsFromList(data.settings);
    expect(settings.activePlanId).toBe(data.plans[0].id);
    expect(settings.body).toBe('female');
    expect(data.plans[0].name).toBe('Hourglass');
  });

  it('includes other activities, some long enough to count and a short one that does not', () => {
    const activities = data.workouts.filter((w) => w.kind === 'activity');
    expect(activities.some((a) => a.minutes >= 20)).toBe(true);
    expect(activities.some((a) => a.minutes < 20)).toBe(true);
  });

  it('has a streak, a missed week and body weight to show', () => {
    expect(weekStreak(data.workouts, 3, now)).toBeGreaterThan(0);
    expect(settingsFromList(data.settings).bodyWeights.length).toBeGreaterThan(10);
  });
});
