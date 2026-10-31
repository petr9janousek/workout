import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import Icon from '../../components/ui/Icon.jsx';
import LinkCard from '../../components/ui/LinkCard.jsx';
import NotFound from '../../components/ui/NotFound.jsx';
import ExerciseProgress, { bestLine } from './ExerciseProgress.jsx';
import ExerciseEditor from './ExerciseEditor.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { EXERCISE_TYPES, typeOf } from '../../model/exercises.js';
import { musclesOf, musclesByRole } from '../../model/muscles.js';
import { exerciseHistory } from '../../model/workouts.js';
import { plansUsing } from '../../model/plans.js';
import { tipsFor, videoSearchUrl } from '../../model/tips.js';
import { formatDate } from '../../model/format.js';

// One exercise, two pages that link to each other:
//   How to:   the muscles, three cues and the common mistake, your notes,
//             Edit, and a line with your best that opens…
//   Progress: what to do next time, records, chart, sessions, and a line
//             back to How to.
// Used in three tabs: Exercises and a workout (Home) open How to first,
// Progress opens Progress first.
// prefix: the tab's address before the id, e.g. ['progress', 'exercise'].
// path: [id, …] where the rest is 'how' / 'progress' / 'edit' steps.
export default function ExercisePage({ prefix, path, start, backLabel }) {
  const { exercisesById } = useData();
  const [id, ...rest] = path;
  const here = [...prefix, ...path];
  const last = rest.at(-1);
  const exercise = exercisesById.get(id);

  if (last === 'edit') return <ExerciseEditor exerciseId={id} base={here.slice(0, -1)} />;
  if (!exercise) {
    return <NotFound what="exercise" label={backLabel} fallback={[prefix[0]]} />;
  }

  // Deeper than the first page, "back" returns to the other page of this exercise.
  const back = <BackButton label={rest.length ? exercise.name : backLabel} fallback={[prefix[0]]} />;
  const view = last === 'progress' || last === 'how' ? last : start;
  return view === 'progress' ? (
    <ProgressPage exercise={exercise} back={back} onHowTo={() => go(...here, 'how')} />
  ) : (
    <HowToPage exercise={exercise} back={back} onEdit={() => go(...here, 'edit')} onProgress={() => go(...here, 'progress')} />
  );
}

function HowToPage({ exercise, back, onEdit, onProgress }) {
  const { workouts, plans } = useData();
  const muscles = musclesOf(exercise);
  const { main, helping } = musclesByRole(muscles);
  const mapSets = Object.fromEntries(Object.entries(muscles).map(([m, w]) => [m, w === 1 ? 8 : 3]));
  const history = exerciseHistory(workouts, exercise.id);
  const inPlans = plansUsing(plans, exercise.id);

  return (
    <div className="exercise-page">
      <div className="page-top">
        {back}
        <button className="btn-text small-link" onClick={onEdit}>Edit</button>
      </div>
      <h1>{exercise.name}</h1>

      <section className="exercise-top">
        <dl className="exercise-facts">
          <dt>Main</dt>
          <dd>{main.join(', ') || '–'}</dd>
          {helping.length > 0 && (
            <>
              <dt>Helping</dt>
              <dd>{helping.join(', ')}</dd>
            </>
          )}
          <dt>Logged as</dt>
          <dd>{EXERCISE_TYPES.find((t) => t.id === typeOf(exercise))?.label}</dd>
          {inPlans.length > 0 && (
            <>
              <dt>In plan</dt>
              <dd>{inPlans.map((p) => p.name).join(', ')}</dd>
            </>
          )}
        </dl>
        <div className="exercise-top-map">
          <BodyMap sets={mapSets} compact />
        </div>
      </section>

      <HowTo exercise={exercise} />
      <Notes key={exercise.id} exercise={exercise} />

      {history.length > 0 ? (
        <LinkCard title="Your progress" sub={bestLine(exercise, history)} onClick={onProgress} />
      ) : (
        <p className="muted small center">Not done yet. Your progress will show up here.</p>
      )}
    </div>
  );
}

function ProgressPage({ exercise, back, onHowTo }) {
  const { workouts } = useData();
  const history = exerciseHistory(workouts, exercise.id);

  return (
    <div className="exercise-page">
      {back}
      <h1>{exercise.name}</h1>
      {history.length > 0 ? (
        <>
          <p className="muted page-subtitle">
            {history.length} {history.length === 1 ? 'session' : 'sessions'} · last {formatDate(history.at(-1).date)}
          </p>
          <ExerciseProgress exercise={exercise} />
        </>
      ) : (
        <p className="empty">No sessions of this exercise yet.</p>
      )}

      <LinkCard title="How to do it" sub="Tips, muscles and your notes" onClick={onHowTo} />
    </div>
  );
}

// Three cues and the most common mistake, plus a video search.
function HowTo({ exercise }) {
  const tips = tipsFor(exercise);
  return (
    <section className="card how-to">
      <h3>How to do it</h3>
      {tips ? (
        <>
          <ol className="how-to-cues">
            {tips.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ol>
          <p className="how-to-avoid">
            <strong>Avoid:</strong> {tips.avoid.charAt(0).toLowerCase() + tips.avoid.slice(1)}
          </p>
        </>
      ) : (
        <p className="muted small">No tips for exercises you added yourself. Your notes below show up during workouts.</p>
      )}
      <a className="video-link" href={videoSearchUrl(exercise)} target="_blank" rel="noreferrer">
        <Icon name="play" size={18} /> Watch how it's done
        <span className="muted small"> (YouTube)</span>
      </a>
    </section>
  );
}

// Your own notes (seat height, pin, which cable…). Saved when you leave the
// field; shown under the exercise's name during workouts.
function Notes({ exercise }) {
  const { actions } = useData();
  const [text, setText] = useState(exercise.notes || '');
  const [saved, setSaved] = useState(false);

  function save() {
    const notes = text.trim();
    if (notes === (exercise.notes || '')) return;
    actions.updateExercise(exercise.id, { notes: notes || undefined });
    setSaved(true);
  }

  return (
    <section className="card exercise-notes">
      <div className="row-between">
        <h3>Your notes</h3>
        {saved && <span className="muted small">Saved</span>}
      </div>
      <textarea
        rows={2}
        value={text}
        placeholder="Seat height, pin, which cable… Shown during your workouts."
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        onBlur={save}
        aria-label="Your notes"
      />
    </section>
  );
}
