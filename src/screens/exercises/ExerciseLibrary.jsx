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
import { MOVES, doseOf } from '../../model/warmup.js';

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

  // "Warm-up & stretch" is a filter too: the moves of warmup.js, which are
  // ticked off in a workout, not logged. A search also finds them.
  const moving = muscle === 'moves';
  const q = query.trim().toLowerCase();
  const list = moving ? [] : findExercises(exercises, { query, muscle, musclesOf });
  const moves = moving || (q && !muscle) ? MOVES.filter((m) => m.name.toLowerCase().includes(q)) : [];
  const exactMatch = [...exercises, ...MOVES].some((e) => e.name.toLowerCase() === q);
  const open = (exercise) => go('exercises', exercise.id);

  return (
    <div>
      <h1>Exercises</h1>

      <input className="search" placeholder="Search, or type a new exercise" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search exercises" />

      <div className="filter-row" role="radiogroup" aria-label="Filter by muscle">
        {[{ id: null, label: 'All' }, { id: 'moves', label: 'Warm-up & stretch' }, ...MUSCLES].map((m) => (
          <button key={m.id ?? 'all'} role="radio" aria-checked={muscle === m.id} className={muscle === m.id ? 'chip active' : 'chip'} onClick={() => setMuscle(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {query.trim() && !exactMatch && <CreateExercise name={query} onCreated={open} />}

      {moving ? (
        <p className="muted small">For the checklists at the start and end of a workout (Settings → Warm-up, Stretching).</p>
      ) : (
        <p className="muted small">
          {list.length} {list.length === 1 ? 'exercise' : 'exercises'}
          {muscle && ` for ${muscleLabel(muscle).toLowerCase()}, main ones first`}
        </p>
      )}

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

      {moves.length > 0 && <MoveList moves={moves} titled={!moving} />}
      <Tour id="exercises" steps={EXERCISES_TOUR} />
    </div>
  );
}

// Warm-up moves and stretches, in two groups.
// titled: with a heading on top (under the search results).
function MoveList({ moves, titled }) {
  const groups = [
    ['Warm-up', moves.filter((m) => m.kind !== 'stretch')],
    ['Stretching', moves.filter((m) => m.kind === 'stretch')],
  ].filter(([, list]) => list.length);
  return (
    <>
      {titled && <h2 className="moves-title">Warm-up &amp; stretch</h2>}
      {groups.map(([title, list]) => (
        <section key={title} className="move-group">
          <h3 className="muted small">{title}</h3>
          <ul className="library">
            {list.map((m) => (
              <li key={m.id}>
                <button className="library-item" onClick={() => go('exercises', 'move', m.id)}>
                  <span className="library-text">
                    <strong>{m.name}</strong>
                    <span className="muted small">{m.muscles.map(muscleLabel).join(', ') || 'The whole body'}</span>
                  </span>
                  <span className="library-meta">
                    <span className="tag">{doseOf(m)}</span>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
