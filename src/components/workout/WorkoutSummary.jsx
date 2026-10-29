import Totals from './Totals.jsx';
import Icon from '../ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { workoutTotals, previousLike } from '../../model/workouts.js';
import { workoutRecords } from '../../model/records.js';
import { weightComparison } from '../../model/comparisons.js';
import { typeOf, exerciseName } from '../../model/exercises.js';
import { formatSet } from '../../model/sets.js';
import { formatDate } from '../../model/format.js';

// The top of a finished workout: totals, "that's about a hippo", how it
// compares with the last time you did the same day, and the new records.
// Shown right after finishing and when you open the workout later.
export default function WorkoutSummary({ workout }) {
  const { workouts, exercisesById, unit } = useData();
  const totals = workoutTotals(workout);
  const comparison = weightComparison(totals.volume, unit);
  const records = workoutRecords(workout, workouts, exercisesById);
  const change = changeSince(previousLike(workouts, workout), totals);

  return (
    <section className="card summary-card">
      <Totals workout={workout} />
      {comparison && <p className="comparison">That's {comparison}.</p>}
      {change && <p className="small muted summary-change">{change}</p>}

      {records.length > 0 && (
        <div className="summary-records">
          <h4 className="record-count">
            <Icon name="trophy" size={16} /> {records.length} new {records.length === 1 ? 'record' : 'records'}
          </h4>
          <ul>
            {records.map(({ exerciseId, set }) => {
              const exercise = exercisesById.get(exerciseId);
              return (
                <li key={set.id}>
                  <span>{exerciseName(exercise)}</span>
                  <strong>{formatSet(set, typeOf(exercise), unit)}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

// "8% more weight than last time (Mon, Oct 19)", by weight lifted, or by
// reps for bodyweight-only workouts.
function changeSince(previous, now) {
  if (!previous) return null;
  const before = workoutTotals(previous);
  const [a, b, what] = now.volume > 0 && before.volume > 0 ? [now.volume, before.volume, 'weight'] : [now.reps, before.reps, 'reps'];
  if (!a || !b) return null;
  const pct = Math.round((a / b - 1) * 100);
  const when = formatDate(previous.startedAt);
  if (pct === 0) return `Same ${what} as last time (${when})`;
  return `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} ${what} than last time (${when})`;
}
