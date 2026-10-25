import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { back } from '../../hooks/useRoute.js';
import { EXERCISE_TYPES, typeOf } from '../../model/exercises.js';
import { MUSCLES, musclesOf, cycleMuscle } from '../../model/muscles.js';
import { countWorkoutsWith } from '../../model/workouts.js';

// Edit one exercise: name, type, muscles; or delete it.
export default function ExerciseEditor({ exerciseId }) {
  const { exercisesById, workouts, actions } = useData();
  const exercise = exercisesById.get(exerciseId);
  const [name, setName] = useState(exercise?.name ?? '');

  if (!exercise) {
    return (
      <div>
        <BackButton label="Settings" fallback={['settings']} />
        <p className="empty">This exercise doesn't exist any more.</p>
      </div>
    );
  }

  const update = (changes) => actions.updateExercise(exercise.id, changes);
  const muscles = musclesOf(exercise);

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
    if (!confirm(`Delete “${exercise.name}”?`)) return;
    actions.deleteExercise(exercise.id);
    back('settings');
  }

  return (
    <div>
      <BackButton label="Settings" fallback={['settings']} />
      <h1>{exercise.name}</h1>

      <section className="card exercise-form">
        <label className="field">
          <span className="small">Name</span>
          <input className="search" value={name} onChange={(e) => rename(e.target.value)} aria-label="Exercise name" />
        </label>

        <span className="small">Type</span>
        <ChipGroup
          label="Exercise type"
          options={EXERCISE_TYPES.map((t) => ({ value: t.id, label: t.label }))}
          value={typeOf(exercise)}
          onChange={(type) => update({ type })}
        />

        <span className="small">
          Muscles worked <span className="muted">(tap: off → helping ½ → main)</span>
        </span>
        <div className="chips">
          {MUSCLES.map((m) => {
            const weight = muscles[m.id] || 0;
            return (
              <button
                key={m.id}
                className={`chip ${weight === 1 ? 'active' : weight ? 'half' : ''}`}
                onClick={() => update({ muscles: cycleMuscle(muscles, m.id) })}
              >
                {m.label}
                {weight === 0.5 && ' ½'}
              </button>
            );
          })}
        </div>
        {exercise.muscles && (
          <button className="btn-text small-link" onClick={() => update({ muscles: undefined })}>
            Reset muscles to automatic
          </button>
        )}
      </section>

      <div className="actions">
        <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete exercise</button>
      </div>
    </div>
  );
}
