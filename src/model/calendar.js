// Training days on a calendar, and habit tracking.
//
// Habits are counted in weeks, not days: research on habit forming found
// that missing a single day doesn't hurt, while long gaps do. So a "streak"
// is the number of weeks in a row that reached your weekly goal, and rest
// days never break it.
//
// Weeks start on Monday. Dates are the phone's local dates.

import { finishedWorkouts } from './workouts.js';

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

// { '2026-10-25': [workout, …], … } for finished workouts.
export function workoutsByDay(workouts) {
  const days = {};
  for (const w of finishedWorkouts(workouts)) (days[dayKey(w.startedAt)] ||= []).push(w);
  return days;
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

// Training days per week for the last `count` weeks, oldest first:
// [{ start: Date, days: 3 }, …]. Two workouts on one day count as one day.
export function weeklyCounts(workouts, count = 12, now = new Date()) {
  const byDay = workoutsByDay(workouts);
  const current = weekStart(now);
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(current, -7 * (count - 1 - i));
    const days = Array.from({ length: 7 }, (_, d) => dayKey(addDays(start, d))).filter((k) => byDay[k]).length;
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

// Whole days since the last finished workout (0 = today), or null if none yet.
export function daysSinceLast(workouts, now = new Date()) {
  const last = finishedWorkouts(workouts)[0];
  if (!last) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const then = new Date(last.startedAt);
  then.setHours(0, 0, 0, 0);
  return Math.round((today - then) / DAY);
}

// The weekly goal: set in Settings, or the number of days in the active plan,
// or 2 (the WHO minimum for strength training).
export const weeklyGoal = (settings, activePlan) => settings.weeklyGoal || activePlan?.days.length || 2;
