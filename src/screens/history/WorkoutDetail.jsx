import WorkoutEditor from '../../components/workout/WorkoutEditor.jsx';
import Totals from '../../components/workout/Totals.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import BackButton from '../../components/ui/BackButton.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, back, openTab } from '../../hooks/useRoute.js';
import { workoutMuscleSets } from '../../model/muscles.js';
import { typeOf, exerciseName } from '../../model/exercises.js';
import { isDoneSet, formatSet } from '../../model/sets.js';
import { formatDate, formatDuration, formatTime } from '../../model/format.js';
import { recordSetIds, setsBefore, countRecords } from '../../model/records.js';
import Icon from '../../components/ui/Icon.jsx';

// One finished workout: totals, muscles, sets. Repeat, edit or delete it.
export default function WorkoutDetail({ workoutId, editing, picking }) {
  const { workouts, exercisesById, unit, activeWorkout, actions } = useData();
  const workout = workouts.find((w) => w.id === workoutId && w.finishedAt);

  if (!workout) {
    return (
      <div>
        <BackButton label="History" fallback={['history']} />
        <p className="empty">This workout doesn't exist any more.</p>
      </div>
    );
  }

  function remove() {
    if (!confirm('Delete this workout permanently?')) return;
    actions.deleteWorkout(workout.id);
    back('history');
  }

  function repeat() {
    if (activeWorkout) {
      alert('Finish or discard the workout in progress first.');
      return;
    }
    actions.startWorkout(workout);
    openTab('workout');
  }

  return (
    <div>
      <BackButton label="History" fallback={['history']} />
      <h1>{workout.name || formatDate(workout.startedAt)}</h1>
      <p className="muted">
        {workout.name && `${formatDate(workout.startedAt)} · `}
        {formatTime(workout.startedAt)} · {formatDuration(Date.parse(workout.finishedAt) - Date.parse(workout.startedAt))}
      </p>
      <Totals workout={workout} />
      <RecordLine count={countRecords(workout, workouts, exercisesById)} />
      <MuscleCard id="history" title="Muscles worked" sets={workoutMuscleSets(workout, exercisesById)} scale="workout" />

      {editing ? (
        <>
          <WorkoutEditor
            workout={workout}
            onChange={actions.saveWorkout}
            picking={picking}
            onOpenPicker={() => go('history', workout.id, 'edit', 'add')}
            onClosePicker={() => back('history', workout.id, 'edit')}
          />
          <button className="btn btn-primary btn-wide" onClick={() => back('history', workout.id)}>Done editing</button>
        </>
      ) : (
        <>
          {workout.entries.map((e) => {
            const exercise = exercisesById.get(e.exerciseId);
            const records = recordSetIds(e.sets, setsBefore(workouts, e.exerciseId, workout.startedAt), typeOf(exercise));
            return (
              <section key={e.id} className="card">
                <h3>{exerciseName(exercise)}</h3>
                <ol className="set-list">
                  {e.sets.filter(isDoneSet).map((s) => (
                    <li key={s.id}>
                      {formatSet(s, typeOf(exercise), unit)}
                      {records.has(s.id) && (
                        <span className="record-count" role="img" aria-label="Personal record"> <Icon name="trophy" size={14} /></span>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
          {workout.notes && <p className="card notes-view">{workout.notes}</p>}

          <div className="actions">
            <button className="btn btn-primary btn-wide" onClick={repeat}>Repeat this workout</button>
            <button className="btn btn-secondary btn-wide" onClick={() => go('history', workout.id, 'edit')}>Edit</button>
            <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
}

// "🏆 2 personal records", shown only when there are some.
export function RecordLine({ count }) {
  if (!count) return null;
  return (
    <p className="record-count">
      <Icon name="trophy" size={16} /> {count} personal {count === 1 ? 'record' : 'records'}
    </p>
  );
}
