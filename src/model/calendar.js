// Training days on a calendar, and habit tracking.
//
// Habits are counted in weeks, not days: research on habit forming found
// that missing a single day doesn't hurt, while long gaps do. So a "streak"
// is the number of weeks in a row that reached your weekly goal, and rest
// days never break it.
//
// Active days are gym workouts plus other activities of 20+ minutes
// (activities.js). Weeks start on Monday. Dates are the phone's local dates.

import { finishedWorkouts } from './workouts.js';
import { countsAsActiveDay, isActivity, whoMinutes } from './activities.js';

const DAY = 864e5;

// Local date as "2026-10-25", for grouping by day.
export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Midnight at the start of the Monday of that week (local time).
export function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Sunday = 6 days after Monday
  return d;
}

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

// { '2026-10-25': [workout or activity, …], … } for finished ones.
export function workoutsByDay(workouts) {
  const days = {};
  for (const w of finishedWorkouts(workouts)) (days[dayKey(w.startedAt)] ||= []).push(w);
  return days;
}

// What a day looks like on the calendar: 'gym' (any workout), 'active'
// (only activities, 20+ minutes), 'light' (only shorter activities, which
// don't count), or null (nothing).
export function dayKind(list = []) {
  if (!list.length) return null;
  if (list.some((w) => !isActivity(w))) return 'gym';
  return list.some(countsAsActiveDay) ? 'active' : 'light';
}
const isActiveDay = (list) => ['gym', 'active'].includes(dayKind(list));

// For drawing a day on the calendar, both can be true at once:
//   gym:    a gym workout that day          (solid orange circle)
//   active: another activity of 20+ minutes  (orange ring around it)
export function dayMarks(list = []) {
  return { gym: list.some((w) => !isActivity(w)), active: list.some((w) => isActivity(w) && countsAsActiveDay(w)) };
}

// The days to show for a month: whole weeks, Monday first, including the
// days of the previous/next month that fill the first and last week.
// → [[Date × 7], …]
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const weeks = [];
  for (let start = weekStart(first); start.getMonth() === month || start < first; start = addDays(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
  }
  return weeks;
}

// The 7 days of the week containing `now`, Monday first.
export const thisWeek = (now = new Date()) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(now), i));

// Active days per week for the last `count` weeks, oldest first:
// [{ start: Date, days: 3 }, …]. Two workouts on one day count as one day.
export function weeklyCounts(workouts, count = 12, now = new Date()) {
  const byDay = workoutsByDay(workouts);
  const current = weekStart(now);
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(current, -7 * (count - 1 - i));
    const days = Array.from({ length: 7 }, (_, d) => dayKey(addDays(start, d))).filter((k) => isActiveDay(byDay[k])).length;
    return { start, days };
  });
}

// Weeks in a row that reached the goal, counting back from last week.
// This week counts once it reaches the goal; until then it doesn't break the streak.
export function weekStreak(workouts, goal, now = new Date()) {
  const weeks = weeklyCounts(workouts, 104, now);
  const thisWeekDone = weeks[weeks.length - 1].days >= goal;
  let streak = thisWeekDone ? 1 : 0;
  for (let i = weeks.length - 2; i >= 0 && weeks[i].days >= goal; i--) streak++;
  return streak;
}

// The longest run of weeks that reached the goal (last two years).
export function bestWeekStreak(workouts, goal, now = new Date()) {
  let best = 0;
  let run = 0;
  for (const w of weeklyCounts(workouts, 104, now)) {
    run = w.days >= goal ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

// Whole days since the last active day (0 = today), or null if none yet.
export function daysSinceLast(workouts, now = new Date()) {
  const last = finishedWorkouts(workouts).find(countsAsActiveDay);
  if (!last) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const then = new Date(last.startedAt);
  then.setHours(0, 0, 0, 0);
  return Math.round((today - then) / DAY);
}

// WHO-style active minutes this week (activities.js: moderate ×1, hard ×2).
export function activeMinutesThisWeek(workouts, now = new Date()) {
  const start = weekStart(now).getTime();
  return finishedWorkouts(workouts)
    .filter((w) => isActivity(w) && Date.parse(w.startedAt) >= start && Date.parse(w.startedAt) <= now.getTime())
    .reduce((sum, w) => sum + whoMinutes(w), 0);
}

// The weekly goal: set in Settings, or the number of days in the active plan,
// or 2 (the WHO minimum for strength training).
export const weeklyGoal = (settings, activePlan) => settings.weeklyGoal || activePlan?.days.length || 2;
