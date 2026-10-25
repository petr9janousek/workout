import Icon from '../ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { EXERCISE_TYPES, guessType } from '../../model/exercises.js';

// "Create “Wall sit” as: [Weight × reps] [Bodyweight reps] …"
// Shown when a search finds no exercise with that name. The guessed type is
// highlighted. onCreated(exercise) gets the new exercise.
export default function CreateExercise({ name, onCreated }) {
  const { actions } = useData();
  const guessed = guessType(name);

  return (
    <div className="create-box">
      <span className="create-title">
        <Icon name="plus" size={18} /> Create “{name.trim()}” as:
      </span>
      <div className="chips">
        {EXERCISE_TYPES.map((t) => (
          <button key={t.id} className={t.id === guessed ? 'chip active' : 'chip'} onClick={() => onCreated(actions.addExercise(name, t.id))}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
