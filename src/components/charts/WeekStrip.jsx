import { thisWeek, dayKey, workoutsByDay, weeklyGoal, weekStreak } from '../../model/calendar.js';
import { useData } from '../../data/DataProvider.jsx';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// This week at a glance: Monday to Sunday, trained days filled, today ringed,
// plus "2 of 3 days" and the streak. onOpen: tap to see the full calendar.
export default function WeekStrip({ onOpen }) {
  const { workouts, settings, activePlan } = useData();
  const byDay = workoutsByDay(workouts);
  const days = thisWeek();
  const today = dayKey(new Date());
  const goal = weeklyGoal(settings, activePlan);
  const done = days.filter((d) => byDay[dayKey(d)]).length;
  const streak = weekStreak(workouts, goal);

  return (
    <button className="week-strip" onClick={onOpen} aria-label={`This week: ${done} of ${goal} training days. ${streak}-week streak. Open the calendar.`}>
      <span className="week-days" aria-hidden="true">
        {days.map((d, i) => {
          const key = dayKey(d);
          const cls = [byDay[key] ? 'trained' : '', key === today ? 'today' : '', key > today ? 'future' : ''].join(' ');
          return (
            <span key={key} className={`week-day ${cls}`}>
              {LETTERS[i]}
            </span>
          );
        })}
      </span>
      <span className="week-text">
        <strong>
          {done}/{goal}
        </strong>
        <span className="muted small">{streak > 0 ? `${streak}-week streak` : 'this week'}</span>
      </span>
    </button>
  );
}
