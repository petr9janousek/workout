import { useState } from 'react';
import Icon from './Icon.jsx';

// A full-screen list for choosing an exercise, with search.
// If what you type isn't in the list, you can create it.
export default function ExercisePicker({ exercises, onPick, onCreate, onClose }) {
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
          <li>
            <button className="pick-item create" onClick={() => onPick(onCreate(query))}>
              <Icon name="plus" size={18} /> Create “{query.trim()}”
            </button>
          </li>
        )}
        {matches.map((e) => (
          <li key={e.id}>
            <button className="pick-item" onClick={() => onPick(e)}>
              {e.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
