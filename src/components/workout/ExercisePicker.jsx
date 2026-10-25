import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { EXERCISE_TYPES, guessType, typeOf } from '../../model/exercises.js';

const TYPE_TAGS = { reps: 'Bodyweight', time: 'Timed', assisted: 'Assisted ±' };

// A full-screen list for choosing an exercise, with search.
// If what you type isn't in the list, you can create it and pick its type.
export default function ExercisePicker({ onPick, onClose }) {
  const { exercises, actions } = useData();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const matches = exercises
    .filter((e) => e.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === q);
  const guessed = guessType(query);

  return (
    <div className="sheet" role="dialog" aria-label="Choose exercise">
      <div className="sheet-header">
        <input
          className="search"
          autoFocus
          placeholder="Search or create exercise"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <ul className="pick-list">
        {q && !exactMatch && (
          <li className="create-box">
            <span className="create-title">
              <Icon name="plus" size={18} /> Create “{query.trim()}” as:
            </span>
            <div className="chips">
              {EXERCISE_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={t.id === guessed ? 'chip active' : 'chip'}
                  onClick={() => onPick(actions.addExercise(query, t.id))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </li>
        )}
        {matches.map((e) => (
          <li key={e.id}>
            <button className="pick-item" onClick={() => onPick(e)}>
              <span>{e.name}</span>
              {TYPE_TAGS[typeOf(e)] && <span className="tag">{TYPE_TAGS[typeOf(e)]}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
