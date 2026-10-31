import WorkoutEditor from '../../components/workout/WorkoutEditor.jsx';
import WorkoutSummary from '../../components/workout/WorkoutSummary.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import BackButton from '../../components/ui/BackButton.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { useStartWorkout } from '../../hooks/useStartWorkout.js';
import { go, back } from '../../hooks/useRoute.js';
import { workoutMuscleSets } from '../../model/muscles.js';
import { typeOf, exerciseName } from '../../model/exercises.js';
import { isDoneSet, formatSet } from '../../model/sets.js';
import { formatDate, formatDuration, formatTime, keepLastWord } from '../../model/format.js';
import { recordSetIds, setsBefore } from '../../model/records.js';
import Icon from '../../components/ui/Icon.jsx';

// One finished workout: summary, muscles, sets. Repeat, edit or delete it.
// Addresses: #/progress/workout/<id>[/edit[/add]]
export default function WorkoutDetail({ workoutId, editing, picking }) {
  const { workouts, exercisesById, unit, actions } = useData();
  const startWorkout = useStartWorkout();
  const workout = workouts.find((w) => w.id === workoutId && w.finishedAt);

  if (!workout) {
    return (
      <div>
        <BackButton label="Progress" fallback={['progress']} />
        <p className="empty">This workout doesn't exist any more.</p>
      </div>
    );
  }

  function remove() {
    if (!confirm('Delete this workout permanently?')) return;
    actions.deleteWorkout(workout.id);
    back('progress');
  }

  const repeat = () => startWorkout(() => actions.startWorkout(workout));

  return (
    <div>
      <BackButton label="Progress" fallback={['progress']} />
      <h1>{keepLastWord(workout.name || formatDate(workout.startedAt))}</h1>
      <p className="muted">
        {workout.name && `${formatDate(workout.startedAt)} · `}
        {formatTime(workout.startedAt)} · {formatDuration(Date.parse(workout.finishedAt) - Date.parse(workout.startedAt))}
      </p>
      <WorkoutSummary workout={workout} />
      <MuscleCard id="history" title="Muscles worked" sets={workoutMuscleSets(workout, exercisesById)} scale="workout" />

      {editing ? (
        <>
          <WorkoutEditor
            workout={workout}
            onChange={actions.saveWorkout}
            picking={picking}
            onOpenPicker={() => go('progress', 'workout', workout.id, 'edit', 'add')}
            onClosePicker={() => back('progress', 'workout', workout.id, 'edit')}
          />
          <button className="btn btn-primary btn-wide" onClick={() => back('progress', 'workout', workout.id)}>Done editing</button>
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
            <button className="btn btn-secondary btn-wide" onClick={() => go('progress', 'workout', workout.id, 'edit')}>Edit</button>
            <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
}
