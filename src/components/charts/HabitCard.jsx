import MonthCalendar from './MonthCalendar.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import WeeksChart from './WeeksChart.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { weeklyGoal, weekStreak, bestWeekStreak, weeklyCounts, daysSinceLast } from '../../model/calendar.js';

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
    { label: 'Last workout', value: since == null ? '–' : since === 0 ? 'today' : `${since} d ago` },
  ];

  return (
    <section className="card habit-card">
      <CardTitle
        title="Training habit"
        hint="Habits take a few months to form, and a missed day doesn't undo them; long gaps do. So a streak counts weeks that reach your weekly goal, and rest days never break it. The goal follows your plan, or set it in Settings."
      />
      <div className="totals habit-stats">
        {stats.map((s) => (
          <div key={s.label} className="total">
            <span className="total-value">{s.value}</span>
            <span className="total-label">{s.label}</span>
          </div>
        ))}
      </div>

      <MonthCalendar workouts={workouts} />

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
