import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import MusclePicker from '../../components/charts/MusclePicker.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, back } from '../../hooks/useRoute.js';
import { EXERCISE_TYPES, typeOf } from '../../model/exercises.js';
import { musclesOf } from '../../model/muscles.js';
import { countWorkoutsWith, recentSessions } from '../../model/workouts.js';
import { plansUsing } from '../../model/plans.js';
import { formatDate } from '../../model/format.js';

// One exercise: name, type, the muscles it works (tap the body), how often
// you've done it, and deleting it.
export default function ExerciseDetail({ exerciseId }) {
  const { exercisesById, workouts, plans, actions } = useData();
  const exercise = exercisesById.get(exerciseId);
  const [name, setName] = useState(exercise?.name ?? '');

  if (!exercise) {
    return (
      <div>
        <BackButton label="Exercises" fallback={['workout', 'exercises']} />
        <p className="empty">This exercise doesn't exist any more.</p>
      </div>
    );
  }

  const update = (changes) => actions.updateExercise(exercise.id, changes);
  const sessions = recentSessions(workouts, exercise.id, null, 999);
  const inPlans = plansUsing(plans, exercise.id);

  function rename(text) {
    setName(text);
    if (text.trim()) update({ name: text.trim() });
  }

  function remove() {
    const used = countWorkoutsWith(workouts, exercise.id);
    if (used) {
      alert(`“${exercise.name}” is used in ${used} workout(s), so it can't be deleted. You can rename it instead.`);
      return;
    }
    if (inPlans.length) {
      alert(`“${exercise.name}” is part of the plan “${inPlans[0].name}”. Remove it from the plan first.`);
      return;
    }
    if (!confirm(`Delete “${exercise.name}”?`)) return;
    actions.deleteExercise(exercise.id);
    back('workout', 'exercises');
  }

  return (
    <div>
      <BackButton label="Exercises" fallback={['workout', 'exercises']} />
      <h1>{exercise.name}</h1>

      <p className="exercise-stats">
        {sessions.length ? (
          <>
            <span>
              Done {sessions.length}× · last {formatDate(sessions[0].date)}
            </span>
            <button className="btn-text small-link" onClick={() => go('progress', exercise.id)}>See progress</button>
          </>
        ) : (
          <span className="muted">Not done yet</span>
        )}
      </p>
      {inPlans.length > 0 && <p className="muted small">In your plan{inPlans.length > 1 ? 's' : ''}: {inPlans.map((p) => p.name).join(', ')}</p>}

      <section className="card exercise-form">
        <label className="field">
          <span className="small">Name</span>
          <input className="search" value={name} onChange={(e) => rename(e.target.value)} aria-label="Exercise name" />
        </label>
        <span className="small">How it's logged</span>
        <ChipGroup
          label="Exercise type"
          options={EXERCISE_TYPES.map((t) => ({ value: t.id, label: t.label }))}
          value={typeOf(exercise)}
          onChange={(type) => update({ type })}
        />
      </section>

      <section className="card">
        <h3>Muscles worked</h3>
        <MusclePicker muscles={musclesOf(exercise)} onChange={(muscles) => update({ muscles })} />
        {exercise.muscles ? (
          <button className="btn-text small-link" onClick={() => update({ muscles: undefined })}>
            Reset to automatic (from the name)
          </button>
        ) : (
          <p className="muted small">Guessed from the name. Tap the body to change it.</p>
        )}
      </section>

      <div className="actions">
        <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete exercise</button>
      </div>
    </div>
  );
}
