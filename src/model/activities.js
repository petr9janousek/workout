// Other activities: a run, a swim, a dance class… logged next to gym
// workouts so the week shows all the moving you did.
//
// Stored with the workouts (same database list, so backups include them):
//   { id, kind: 'activity', activity: 'run', name (for 'other'), startedAt,
//     finishedAt, minutes, effort: 'easy' | 'moderate' | 'hard',
//     distance (km or mi), calories, heartRate (average bpm), notes, entries: [] }
//   distance, calories and heartRate are optional (null).
//
// For the weekly goal and streak, an activity counts as an active day when
// it's at least 20 minutes, so a short stroll doesn't keep a streak alive.
//
// "Active minutes" follow the WHO: 150–300 minutes a week of moderate
// activity, or half that of vigorous. So moderate minutes count once, hard
// ones twice, and easy ones (light activity) don't count toward the 150,
// though they're still good for you.

import { newId } from './ids.js';

// Icons: components/ui/sportIcons.js, by the same ids.
export const ACTIVITY_TYPES = [
  { id: 'run', label: 'Running' },
  { id: 'walk', label: 'Walking' },
  { id: 'cycle', label: 'Cycling' },
  { id: 'swim', label: 'Swimming' },
  { id: 'dance', label: 'Dancing' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'hike', label: 'Hiking' },
  { id: 'sport', label: 'Team sport' },
  { id: 'climb', label: 'Climbing' },
  { id: 'other', label: 'Other' },
];

// How hard it was, by the "talk test" (WHO / CDC).
export const EFFORTS = [
  { id: 'easy', label: 'Easy', help: 'You could sing.', whoFactor: 0 },
  { id: 'moderate', label: 'Moderate', help: 'You can talk, but not sing.', whoFactor: 1 },
  { id: 'hard', label: 'Hard', help: 'Only a few words at a time.', whoFactor: 2 },
];

export const MIN_ACTIVE_MINUTES = 20;
export const WHO_WEEKLY_MINUTES = 150;

export const isActivity = (w) => w?.kind === 'activity';
export const activityType = (w) => ACTIVITY_TYPES.find((t) => t.id === w.activity) || ACTIVITY_TYPES.at(-1);

// What to call it: the type, or the name you typed for "Other".
export const activityLabel = (w) => (w.activity === 'other' && w.name?.trim()) || activityType(w).label;

export function createActivity({ activity, name = '', minutes, effort = 'moderate', distance = null, calories = null, heartRate = null, notes = '' }, startedAt) {
  return {
    id: newId(),
    kind: 'activity',
    activity,
    name: activity === 'other' ? name : '',
    startedAt,
    finishedAt: new Date(Date.parse(startedAt) + minutes * 60000).toISOString(),
    minutes,
    effort,
    distance,
    calories,
    heartRate,
    notes,
    entries: [],
  };
}

// The same activity with some fields changed (keeps finishedAt in step).
export function updateActivity(activity, changes) {
  const next = { ...activity, ...changes };
  return { ...next, finishedAt: new Date(Date.parse(next.startedAt) + next.minutes * 60000).toISOString() };
}

// Does this workout or activity make the day an active day?
export const countsAsActiveDay = (w) => !isActivity(w) || w.minutes >= MIN_ACTIVE_MINUTES;

// Minutes towards the WHO's 150 a week.
export const whoMinutes = (w) => (isActivity(w) ? w.minutes * (EFFORTS.find((e) => e.id === w.effort)?.whoFactor ?? 1) : 0);

// Pace for things done on foot: "5:42 /km", or null.
export function pace(w) {
  if (!['run', 'walk', 'hike'].includes(w.activity) || !(w.distance > 0) || !(w.minutes > 0)) return null;
  const perUnit = Math.round((w.minutes * 60) / w.distance);
  return `${Math.floor(perUnit / 60)}:${String(perUnit % 60).padStart(2, '0')} /km`;
}

// "45 min · Moderate · 7.2 km · 6:15 /km · 420 kcal"
export function activitySummary(w) {
  const parts = [`${w.minutes} min`, EFFORTS.find((e) => e.id === w.effort)?.label];
  if (w.distance) parts.push(`${Math.round(w.distance * 100) / 100} km`);
  parts.push(pace(w));
  if (w.calories) parts.push(`${w.calories} kcal`);
  return parts.filter(Boolean).join(' · ');
}

