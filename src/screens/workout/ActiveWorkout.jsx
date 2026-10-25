import WorkoutEditor from '../../components/workout/WorkoutEditor.jsx';
import Totals from '../../components/workout/Totals.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { useNow } from '../../hooks/useNow.js';
import { go, back, switchTab } from '../../hooks/useRoute.js';
import { finishWorkout } from '../../model/workouts.js';
import { workoutMuscleSets } from '../../model/muscles.js';
import { formatDate, formatClock } from '../../model/format.js';

// The workout in progress: totals and timers pinned on top, muscle map,
// the exercises, and Finish / Discard.
export default function ActiveWorkout({ workout, picking }) {
  const { exercisesById, actions } = useData();
  const now = useNow();

  // Rest timer: time since the most recently ticked set.
  const lastDone = Math.max(0, ...workout.entries.flatMap((e) => e.sets).map((s) => (s.done && s.doneAt ? Date.parse(s.doneAt) : 0)));

  function finish() {
    const result = finishWorkout(workout);
    if (!result.workout) {
      if (confirm('No sets are ticked as done, so there is nothing to save. Discard this workout?')) actions.deleteWorkout(workout.id);
      return;
    }
    if (result.skipped && !confirm(`${result.skipped} set(s) not ticked as done will be left out. Finish workout?`)) return;
    actions.saveWorkout(result.workout);
    switchTab('history');
  }

  function discard() {
    if (confirm('Discard this workout? Nothing from it will be saved.')) actions.deleteWorkout(workout.id);
  }

  return (
    <div>
      <header className="workout-header">
        <h1>{workout.name || 'Workout'}</h1>
        <p className="muted">{formatDate(workout.startedAt)}</p>
      </header>

      {/* Stays at the top while you scroll */}
      <div className="sticky-bar">
        <Totals workout={workout} live />
        <div className="timers">
          <span className="timer" aria-label="Workout duration">{formatClock(now - Date.parse(workout.startedAt))}</span>
          {lastDone > 0 && <span className="timer rest">Rest {formatClock(now - lastDone)}</span>}
        </div>
      </div>

      <MuscleCard id="workout" title="Muscles worked" sets={workoutMuscleSets(workout, exercisesById)} scale="workout" />

      <WorkoutEditor
        workout={workout}
        onChange={actions.saveWorkout}
        picking={picking}
        onOpenPicker={() => go('workout', 'add')}
        onClosePicker={() => back('workout')}
      />

      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={finish}>Finish workout</button>
        <button className="btn btn-danger-ghost btn-wide" onClick={discard}>Discard</button>
      </div>
    </div>
  );
}
