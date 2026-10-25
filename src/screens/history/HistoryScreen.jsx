import WorkoutDetail from './WorkoutDetail.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { countRecords } from '../../model/records.js';
import { TotalsLine } from '../../components/workout/Totals.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { finishedWorkouts } from '../../model/workouts.js';
import { exerciseName } from '../../model/exercises.js';
import { formatDate, formatDuration } from '../../model/format.js';

// The History tab: list of finished workouts.
// Addresses: #/history, #/history/<workout id>[/edit[/add]]
export default function HistoryScreen({ path }) {
  const { workouts, exercisesById } = useData();
  const [workoutId, mode, sheet] = path;
  if (workoutId) return <WorkoutDetail workoutId={workoutId} editing={mode === 'edit'} picking={sheet === 'add'} />;

  const list = finishedWorkouts(workouts);
  return (
    <div>
      <h1>History</h1>
      {list.length === 0 && <p className="empty">Finished workouts will show up here.</p>}
      {list.map((w) => (
        <button key={w.id} className="card card-button" onClick={() => go('history', w.id)}>
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
      ))}
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
