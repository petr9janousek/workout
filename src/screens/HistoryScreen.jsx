import { useState } from 'react';
import WorkoutEditor from '../components/WorkoutEditor.jsx';
import Icon from '../components/Icon.jsx';
import Totals from '../components/Totals.jsx';
import MuscleCard from '../components/MuscleCard.jsx';
import { workoutMuscleSets } from '../muscles.js';
import {
  finishedWorkouts, formatDate, formatDuration, formatSet, isDoneSet, typeOf, workoutTotals, formatNumber,
} from '../utils.js';

export default function HistoryScreen(props) {
  const { workouts, exercises, unit } = props;
  const [openId, setOpenId] = useState(null);
  const list = finishedWorkouts(workouts);
  const open = list.find((w) => w.id === openId);
  const nameOf = (id) => exercises.find((e) => e.id === id)?.name || 'Deleted exercise';
  const typeOfId = (id) => typeOf(exercises.find((e) => e.id === id));

  if (open) return <WorkoutDetail {...props} workout={open} nameOf={nameOf} typeOfId={typeOfId} onBack={() => setOpenId(null)} />;

  return (
    <div>
      <h1>History</h1>
      {list.length === 0 && <p className="empty">Finished workouts will show up here.</p>}
      {list.map((w) => (
        <button key={w.id} className="card card-button" onClick={() => setOpenId(w.id)}>
          <div className="row-between">
            <strong>{formatDate(w.startedAt)}</strong>
            <span className="muted">{formatDuration(new Date(w.finishedAt) - new Date(w.startedAt))}</span>
          </div>
          <SummaryLine workout={w} unit={unit} />
          <ul className="summary-list">
            {w.entries.map((e) => (
              <li key={e.id}>
                {nameOf(e.exerciseId)} <span className="muted">× {e.sets.filter(isDoneSet).length} sets</span>
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}

// "9 sets · 3,420 kg" under each workout in the list.
function SummaryLine({ workout, unit }) {
  const t = workoutTotals(workout);
  const parts = [`${t.sets} sets`];
  if (t.volume > 0) parts.push(`${formatNumber(t.volume)} ${unit}`);
  return <span className="summary-line">{parts.join(' · ')}</span>;
}

function WorkoutDetail({ workout, nameOf, typeOfId, onBack, exercises, workouts, unit, settings, saveWorkout, deleteWorkout, startWorkout, addExercise, activeWorkout }) {
  const [editing, setEditing] = useState(false);

  function remove() {
    if (confirm('Delete this workout permanently?')) {
      deleteWorkout(workout.id);
      onBack();
    }
  }

  function repeat() {
    if (activeWorkout) {
      alert('Finish or discard the workout in progress first.');
      return;
    }
    startWorkout(workout);
  }

  return (
    <div>
      <button className="back" onClick={onBack}>
        <Icon name="back" size={18} /> History
      </button>
      <h1>{formatDate(workout.startedAt)}</h1>
      <p className="muted">
        {new Date(workout.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
        {formatDuration(new Date(workout.finishedAt) - new Date(workout.startedAt))}
      </p>
      <Totals workout={workout} unit={unit} />
      <MuscleCard id="history" title="Muscles worked" sets={workoutMuscleSets(workout, exercises)} scale="workout" />

      {editing ? (
        <>
          <WorkoutEditor
            workout={workout}
            exercises={exercises}
            workouts={workouts}
            settings={settings}
            onChange={saveWorkout}
            addExercise={addExercise}
          />
          <button className="btn btn-primary btn-wide" onClick={() => setEditing(false)}>Done editing</button>
        </>
      ) : (
        <>
          {workout.entries.map((e) => (
            <section key={e.id} className="card">
              <h3>{nameOf(e.exerciseId)}</h3>
              <ol className="set-list">
                {e.sets.filter(isDoneSet).map((s) => (
                  <li key={s.id}>{formatSet(s, typeOfId(e.exerciseId), unit)}</li>
                ))}
              </ol>
            </section>
          ))}
          {workout.notes && <p className="card notes-view">{workout.notes}</p>}

          <div className="actions">
            <button className="btn btn-primary btn-wide" onClick={repeat}>Repeat this workout</button>
            <button className="btn btn-secondary btn-wide" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
}
