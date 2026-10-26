import MonthCalendar from './MonthCalendar.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import WeeksChart from './WeeksChart.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { weeklyGoal, weekStreak, bestWeekStreak, weeklyCounts, daysSinceLast, activeMinutesThisWeek } from '../../model/calendar.js';
import { WHO_WEEKLY_MINUTES } from '../../model/activities.js';

// The habit section of Progress: this week vs the goal, streaks in weeks,
// days since the last workout, the month calendar and the last 12 weeks.
export default function HabitCard() {
  const { workouts, settings, activePlan } = useData();
  const goal = weeklyGoal(settings, activePlan);
  const weeks = weeklyCounts(workouts, 12);
  const since = daysSinceLast(workouts);
  const reached = weeks.filter((w) => w.days >= goal).length;

  const stats = [
    { label: 'This week', value: `${weeks.at(-1).days}/${goal}` },
    { label: 'Streak', value: `${weekStreak(workouts, goal)} wk` },
    { label: 'Best', value: `${bestWeekStreak(workouts, goal)} wk` },
    { label: 'Last active', value: since == null ? '–' : since === 0 ? 'today' : `${since} d ago` },
  ];

  return (
    <section className="card habit-card">
      <CardTitle
        title="Training habit"
        hint="Active days are gym workouts plus other activities of 20 minutes or more. Habits take a few months to form, and a missed day doesn't undo them; long gaps do. So a streak counts weeks that reach your weekly goal, and rest days never break it. The goal follows your plan, or set it in Settings. Active minutes come from other activities: the WHO recommends 150 minutes of moderate activity a week; hard minutes count double, easy ones (you could sing) not at all."
      />
      <div className="totals habit-stats">
        {stats.map((s) => (
          <div key={s.label} className="total">
            <span className="total-value">{s.value}</span>
            <span className="total-label">{s.label}</span>
          </div>
        ))}
      </div>

      <ActiveMinutes minutes={activeMinutesThisWeek(workouts)} />

      <MonthCalendar workouts={workouts} />
      <p className="calendar-legend muted small" aria-hidden="true">
        <span className="legend-dot day-gym" /> Gym <span className="legend-dot day-active" /> Activity <span className="legend-dot day-both" /> Both
      </p>

      <div className="habit-weeks">
        <div className="row-between">
          <h4 className="habit-subtitle">Last 12 weeks</h4>
          <span className="muted small">{reached} of 12 reached {goal} days</span>
        </div>
        <WeeksChart weeks={weeks} goal={goal} />
      </div>
    </section>
  );
}

// This week's active minutes against the WHO's 150 (other activities only:
// moderate counts once, hard twice, easy not at all).
function ActiveMinutes({ minutes }) {
  const share = Math.min(1, minutes / WHO_WEEKLY_MINUTES);
  return (
    <div className="active-minutes">
      <div className="row-between">
        <span className="small">Active minutes this week</span>
        <span className="small">
          <strong>{Math.round(minutes)}</strong> <span className="muted">/ {WHO_WEEKLY_MINUTES}</span>
        </span>
      </div>
      <div className="meter" role="img" aria-label={`${Math.round(minutes)} of ${WHO_WEEKLY_MINUTES} active minutes`}>
        <span style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}
