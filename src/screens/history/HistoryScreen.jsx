import WorkoutDetail from './WorkoutDetail.jsx';
import ActivityDetail from '../activities/ActivityDetail.jsx';
import ActivityForm from '../activities/ActivityForm.jsx';
import { isActivity, activityLabel, activitySummary, distanceUnitFor } from '../../model/activities.js';
import { SportIcon } from '../../components/ui/Icon.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { countRecords } from '../../model/records.js';
import { TotalsLine } from '../../components/workout/Totals.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { finishedWorkouts } from '../../model/workouts.js';
import { exerciseName } from '../../model/exercises.js';
import { formatDate, formatDuration } from '../../model/format.js';

// The History tab: finished workouts and other activities, newest first.
// Addresses: #/history, #/history/<id>[/edit[/add]]
export default function HistoryScreen({ path }) {
  const { workouts, exercisesById, unit } = useData();
  const [workoutId, mode, sheet] = path;
  const activity = workoutId && workouts.find((w) => w.id === workoutId && isActivity(w));
  if (activity) return mode === 'edit' ? <ActivityForm key={activity.id} activity={activity} /> : <ActivityDetail activity={activity} />;
  if (workoutId) return <WorkoutDetail workoutId={workoutId} editing={mode === 'edit'} picking={sheet === 'add'} />;

  const list = finishedWorkouts(workouts);
  return (
    <div>
      <h1>History</h1>
      {list.length === 0 && <p className="empty">Finished workouts and activities will show up here.</p>}
      {list.map((w) =>
        isActivity(w) ? <ActivityItem key={w.id} activity={w} unit={unit} /> : <WorkoutItem key={w.id} workout={w} workouts={workouts} exercisesById={exercisesById} />,
      )}
    </div>
  );
}

function RecordBadge({ count }) {
  if (!count) return null;
  return (
    <span className="record-count small" aria-label={`${count} personal records`}>
      {' · '}<Icon name="trophy" size={13} /> {count}
    </span>
  );
}

function WorkoutItem({ workout: w, workouts, exercisesById }) {
  return (
    <button className="card card-button" onClick={() => go('history', w.id)}>
      <div className="row-between">
        <strong>
          {w.name ? `${w.name} · ` : ''}
          {formatDate(w.startedAt)}
        </strong>
        <span className="muted">{formatDuration(Date.parse(w.finishedAt) - Date.parse(w.startedAt))}</span>
      </div>
      <TotalsLine workout={w} />
      <RecordBadge count={countRecords(w, workouts, exercisesById)} />
      <ul className="summary-list">
        {w.entries.map((e) => (
          <li key={e.id}>
            {exerciseName(exercisesById.get(e.exerciseId))} <span className="muted">× {e.sets.length} sets</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

// A run, a swim…: icon, name, date, and minutes / effort / distance.
function ActivityItem({ activity: a, unit }) {
  return (
    <button className="card card-button activity-item" onClick={() => go('history', a.id)}>
      <strong className="activity-item-title">
        <SportIcon type={a.activity} size={18} />
        {activityLabel(a)} · {formatDate(a.startedAt)}
      </strong>
      <span className="summary-line block">{activitySummary(a, distanceUnitFor(unit))}</span>
    </button>
  );
}
