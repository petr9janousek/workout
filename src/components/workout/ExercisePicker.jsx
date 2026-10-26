import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import CreateExercise from './CreateExercise.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { typeOf } from '../../model/exercises.js';
import { musclesOf, muscleLabel } from '../../model/muscles.js';

// "Lats / back, Biceps ½": main muscles, then helping ones.
const muscleSummary = (e) =>
  Object.entries(musclesOf(e))
    .sort((a, b) => b[1] - a[1])
    .map(([m, w]) => (w === 1 ? muscleLabel(m) : `${muscleLabel(m)} ½`))
    .join(', ');

const TYPE_TAGS = { reps: 'Bodyweight', time: 'Timed', assisted: 'Assisted ±' };

// A full-screen list for choosing an exercise, with search.
// If what you type isn't in the list, you can create it and pick its type.
// suggestions + suggestionsTitle: shown first (e.g. alternatives when swapping).
export default function ExercisePicker({ onPick, onClose, suggestions = [], suggestionsTitle, placeholder = 'Search or create exercise' }) {
  const { exercises } = useData();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const matches = exercises
    .filter((e) => e.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === q);

  return (
    <div className="sheet" role="dialog" aria-label="Choose exercise">
      <div className="sheet-header">
        <input
          className="search"
          autoFocus={!suggestions.length}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      {!q && suggestions.length > 0 && (
        <>
          <h3 className="pick-heading">{suggestionsTitle}</h3>
          <ul className="pick-list suggestions">
            {suggestions.map((e) => (
              <li key={e.id}>
                <button className="pick-item" onClick={() => onPick(e)}>
                  <span>
                    {e.name}
                    <span className="muted small block">{muscleSummary(e)}</span>
                  </span>
                  {TYPE_TAGS[typeOf(e)] && <span className="tag">{TYPE_TAGS[typeOf(e)]}</span>}
                </button>
              </li>
            ))}
          </ul>
          <h3 className="pick-heading">All exercises</h3>
        </>
      )}
      <ul className="pick-list">
        {q && !exactMatch && (
          <li>
            <CreateExercise name={query} onCreated={onPick} />
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
