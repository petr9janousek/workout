import { useState } from 'react';
import CreateExercise from '../../components/workout/CreateExercise.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Tour from '../../components/ui/Tour.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { useRemembered } from '../../hooks/useRemembered.js';
import { findExercises, typeOf, EXERCISE_TYPES } from '../../model/exercises.js';
import { MUSCLES, musclesOf, musclesByRole, muscleLabel } from '../../model/muscles.js';
import { recentSessions } from '../../model/workouts.js';

// The walkthrough's last part (Tour.jsx).
const EXERCISES_TOUR = [
  { target: '.screen > div > .search', text: 'Find any exercise by name. A name that isn\u2019t here becomes a new exercise of your own.' },
  { target: '.filter-row', text: 'Or pick a muscle to see the exercises for it, the main ones first.' },
  { target: '.library-item', text: 'Tap an exercise for how to do it: three tips, the common mistake and a video. Your progress on it is one tap further.' },
  { target: '.tabbar .tab:nth-child(1)', text: "That's it. Your next workout waits on Home. In Settings you can show this walkthrough again." },
];

// The Exercises tab: everything in the app, searchable and filterable by
// muscle. Tap an exercise to see how to do it and your progress; type a new
// name to create one.
export default function ExerciseLibrary() {
  const { exercises, workouts } = useData();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useRemembered('library.muscle', null);

  const list = findExercises(exercises, { query, muscle, musclesOf });
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase());
  const open = (exercise) => go('exercises', exercise.id);

  return (
    <div>
      <h1>Exercises</h1>

      <input className="search" placeholder="Search, or type a new exercise" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search exercises" />

      <div className="filter-row" role="radiogroup" aria-label="Filter by muscle">
        {[{ id: null, label: 'All' }, ...MUSCLES].map((m) => (
          <button key={m.id ?? 'all'} role="radio" aria-checked={muscle === m.id} className={muscle === m.id ? 'chip active' : 'chip'} onClick={() => setMuscle(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {query.trim() && !exactMatch && <CreateExercise name={query} onCreated={open} />}

      <p className="muted small">
        {list.length} {list.length === 1 ? 'exercise' : 'exercises'}
        {muscle && ` for ${muscleLabel(muscle).toLowerCase()}, main ones first`}
      </p>

      <ul className="library">
        {list.map((e) => {
          const { main, helping } = musclesByRole(musclesOf(e));
          const sessions = recentSessions(workouts, e.id, null, 999).length;
          return (
            <li key={e.id}>
              <button className="library-item" onClick={() => open(e)}>
                <span className="library-text">
                  <strong>{e.name}</strong>
                  <span className="muted small">
                    {main.join(', ') || 'No muscles set'}
                    {helping.length > 0 && <span className="helping"> + {helping.join(', ')}</span>}
                  </span>
                </span>
                <span className="library-meta">
                  <span className="tag">{EXERCISE_TYPES.find((t) => t.id === typeOf(e))?.label}</span>
                  {sessions > 0 && <span className="muted small">{sessions}×</span>}
                </span>
                <Icon name="chevron" size={16} />
              </button>
            </li>
          );
        })}
      </ul>
      <Tour id="exercises" steps={EXERCISES_TOUR} />
    </div>
  );
}
