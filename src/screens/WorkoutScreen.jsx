import { useEffect, useState } from 'react';
import WorkoutEditor from '../components/WorkoutEditor.jsx';
import Totals from '../components/Totals.jsx';
import MuscleCard from '../components/MuscleCard.jsx';
import { workoutMuscleSets } from '../muscles.js';
import { finishedWorkouts, formatDate, formatClock, isDoneSet } from '../utils.js';

export default function WorkoutScreen(props) {
  const { activeWorkout } = props;
  return activeWorkout ? <ActiveWorkout {...props} workout={activeWorkout} /> : <StartScreen {...props} />;
}

// Shown when no workout is running.
function StartScreen({ workouts, exercises, startWorkout }) {
  const recent = finishedWorkouts(workouts).slice(0, 3);
  const nameOf = (id) => exercises.find((e) => e.id === id)?.name || 'Deleted exercise';

  return (
    <div className="start">
      <h1>Ready to train?</h1>
      <button className="btn btn-primary btn-big" onClick={() => startWorkout()}>
        Start empty workout
      </button>

      {recent.length > 0 && (
        <>
          <h2 className="section-title">Repeat a recent workout</h2>
          {recent.map((w) => (
            <button key={w.id} className="card card-button" onClick={() => startWorkout(w)}>
              <strong>{formatDate(w.startedAt)}</strong>
              <span className="muted">{w.entries.map((e) => nameOf(e.exerciseId)).join(', ')}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// Shown while a workout is in progress.
function ActiveWorkout({ workout, exercises, workouts, unit, settings, saveWorkout, deleteWorkout, addExercise, goTo }) {
  const now = useNow();
  const elapsed = now - new Date(workout.startedAt).getTime();

  // Rest timer: time since the most recently ticked set.
  const lastDone = workout.entries
    .flatMap((e) => e.sets)
    .filter((s) => s.done && s.doneAt)
    .map((s) => new Date(s.doneAt).getTime())
    .sort((a, b) => b - a)[0];

  function finish() {
    // Keep only sets that were ticked, and drop exercises left with none.
    const entries = workout.entries
      .map(({ suggestion, ...e }) => ({ ...e, sets: e.sets.filter(isDoneSet) }))
      .filter((e) => e.sets.length > 0);

    if (entries.length === 0) {
      if (confirm('No sets are ticked as done, so there is nothing to save. Discard this workout?')) {
        deleteWorkout(workout.id);
      }
      return;
    }
    const skipped = workout.entries.flatMap((e) => e.sets).filter((s) => !isDoneSet(s)).length;
    if (skipped && !confirm(`${skipped} set(s) not ticked as done will be left out. Finish workout?`)) return;

    saveWorkout({ ...workout, entries, finishedAt: new Date().toISOString() });
    goTo('history');
  }

  function discard() {
    if (confirm('Discard this workout? Nothing from it will be saved.')) deleteWorkout(workout.id);
  }

  return (
    <div>
      <header className="workout-header">
        <div>
          <h1>Workout</h1>
          <p className="muted">{formatDate(workout.startedAt)}</p>
        </div>
      </header>

      {/* Stays at the top while you scroll */}
      <div className="sticky-bar">
        <Totals workout={workout} unit={unit} live />
        <div className="timers">
          <span className="timer" aria-label="Workout duration">{formatClock(elapsed)}</span>
          {lastDone && <span className="timer rest">Rest {formatClock(now - lastDone)}</span>}
        </div>
      </div>

      <MuscleCard id="workout" title="Muscles worked" sets={workoutMuscleSets(workout, exercises)} scale="workout" />

      <WorkoutEditor
        workout={workout}
        exercises={exercises}
        workouts={workouts}
        settings={settings}
        onChange={saveWorkout}
        addExercise={addExercise}
      />

      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={finish}>Finish workout</button>
        <button className="btn btn-danger-ghost btn-wide" onClick={discard}>Discard</button>
      </div>
    </div>
  );
}

// Re-renders every second so the timers tick.
function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
