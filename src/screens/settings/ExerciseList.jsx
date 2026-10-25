import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { EXERCISE_TYPES, typeOf } from '../../model/exercises.js';

const typeLabel = (exercise) => EXERCISE_TYPES.find((t) => t.id === typeOf(exercise))?.label;

// All exercises, alphabetically. Tap one to edit it.
export default function ExerciseList() {
  const { exercises } = useData();
  const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="card">
      <h3>Exercises</h3>
      <p className="muted small">
        Tap an exercise to rename it, or change its type or muscles. New exercises can be added while logging a workout.
      </p>
      <ul className="exercise-list">
        {sorted.map((e) => (
          <li key={e.id}>
            <button className="link" onClick={() => go('settings', 'exercise', e.id)}>{e.name}</button>
            <span className="tag">{typeLabel(e)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
