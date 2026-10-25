import { useData } from '../../data/DataProvider.jsx';
import { finishedWorkouts } from '../../model/workouts.js';
import { exerciseName } from '../../model/exercises.js';
import { formatDate } from '../../model/format.js';

// Shown when no workout is running: start empty, or repeat a recent one.
export default function StartWorkout() {
  const { workouts, exercisesById, actions } = useData();
  const recent = finishedWorkouts(workouts).slice(0, 3);

  return (
    <div className="start">
      <h1>Ready to train?</h1>
      <button className="btn btn-primary btn-big" onClick={() => actions.startWorkout()}>
        Start empty workout
      </button>

      {recent.length > 0 && (
        <>
          <h2 className="section-title">Repeat a recent workout</h2>
          {recent.map((w) => (
            <button key={w.id} className="card card-button" onClick={() => actions.startWorkout(w)}>
              <strong>{formatDate(w.startedAt)}</strong>
              <span className="muted">{w.entries.map((e) => exerciseName(exercisesById.get(e.exerciseId))).join(', ')}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
