import { useState } from 'react';
import ExercisePicker from './ExercisePicker.jsx';
import Icon from './Icon.jsx';
import { newId, lastTimeSets, formatSet, formatDate } from '../utils.js';

// Edits one workout: its exercises, their sets, and notes.
// Used both for the workout in progress and for fixing old workouts.
// Every change is passed up through onChange, which saves it.
export default function WorkoutEditor({ workout, exercises, workouts, unit, onChange, addExercise }) {
  const [picking, setPicking] = useState(false);
  // When fixing an old workout, new sets count as done straight away.
  const finished = Boolean(workout.finishedAt);

  const nameOf = (id) => exercises.find((e) => e.id === id)?.name || 'Deleted exercise';

  function update(changes) {
    onChange({ ...workout, ...changes });
  }

  function updateEntry(entryId, changeFn) {
    update({ entries: workout.entries.map((e) => (e.id === entryId ? changeFn(e) : e)) });
  }

  function addEntry(exercise) {
    setPicking(false);
    // Start with the same sets as last time (not ticked yet), so you
    // only need to change what's different today.
    const last = lastTimeSets(workouts, exercise.id, workout.startedAt);
    const sets = last
      ? last.sets.map((s) => ({ id: newId(), weight: s.weight, reps: s.reps, done: finished }))
      : [{ id: newId(), weight: '', reps: '', done: finished }];
    update({ entries: [...workout.entries, { id: newId(), exerciseId: exercise.id, sets }] });
  }

  function removeEntry(entryId) {
    if (!confirm('Remove this exercise from the workout?')) return;
    update({ entries: workout.entries.filter((e) => e.id !== entryId) });
  }

  return (
    <div className="editor">
      {workout.entries.length === 0 && (
        <p className="empty">Add your first exercise to get going.</p>
      )}

      {workout.entries.map((entry) => (
        <ExerciseCard
          key={entry.id}
          name={nameOf(entry.exerciseId)}
          entry={entry}
          unit={unit}
          finished={finished}
          last={lastTimeSets(workouts, entry.exerciseId, workout.startedAt)}
          onChange={(fn) => updateEntry(entry.id, fn)}
          onRemove={() => removeEntry(entry.id)}
        />
      ))}

      <button className="btn btn-secondary btn-wide" onClick={() => setPicking(true)}>
        <Icon name="plus" size={18} /> Add exercise
      </button>

      <label className="notes">
        <span>Notes</span>
        <textarea
          rows={2}
          placeholder="How did it feel?"
          value={workout.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </label>

      {picking && (
        <ExercisePicker
          exercises={exercises}
          onPick={addEntry}
          onCreate={addExercise}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

// One exercise inside a workout, with its list of sets.
function ExerciseCard({ name, entry, unit, finished, last, onChange, onRemove }) {
  function updateSet(setId, changes) {
    onChange((e) => ({
      ...e,
      sets: e.sets.map((s) => (s.id === setId ? { ...s, ...changes } : s)),
    }));
  }

  function toggleDone(set) {
    updateSet(set.id, { done: !set.done, doneAt: !set.done ? new Date().toISOString() : null });
  }

  function addSet() {
    onChange((e) => {
      const prev = e.sets[e.sets.length - 1];
      const set = { id: newId(), weight: prev?.weight ?? '', reps: prev?.reps ?? '', done: finished };
      return { ...e, sets: [...e.sets, set] };
    });
  }

  function removeSet(setId) {
    onChange((e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) }));
  }

  return (
    <section className="card exercise-card">
      <header className="card-header">
        <h3>{name}</h3>
        <button className="icon-btn subtle" onClick={onRemove} aria-label={`Remove ${name}`}>
          <Icon name="trash" size={18} />
        </button>
      </header>

      {last && (
        <p className="last-time">
          Last time ({formatDate(last.date)}): {last.sets.map(formatSet).join(' · ')}
        </p>
      )}

      <div className="set-grid">
        <span className="set-head">Set</span>
        <span className="set-head">{unit}</span>
        <span className="set-head">Reps</span>
        <span />
        <span />
        {entry.sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={i + 1}
            set={set}
            onChange={(changes) => updateSet(set.id, changes)}
            onToggle={() => toggleDone(set)}
            onRemove={() => removeSet(set.id)}
          />
        ))}
      </div>

      <button className="btn btn-ghost" onClick={addSet}>
        <Icon name="plus" size={16} /> Add set
      </button>
    </section>
  );
}

function SetRow({ index, set, onChange, onToggle, onRemove }) {
  const cls = set.done ? 'done' : '';
  return (
    <>
      <span className={`set-num ${cls}`}>{index}</span>
      <input
        className={`set-input ${cls}`}
        inputMode="decimal"
        placeholder="0"
        value={set.weight}
        onChange={(e) => onChange({ weight: e.target.value })}
        aria-label={`Set ${index} weight`}
      />
      <input
        className={`set-input ${cls}`}
        inputMode="numeric"
        placeholder="0"
        value={set.reps}
        onChange={(e) => onChange({ reps: e.target.value })}
        aria-label={`Set ${index} reps`}
      />
      <button
        className={`check-btn ${cls}`}
        onClick={onToggle}
        aria-label={set.done ? `Undo set ${index}` : `Mark set ${index} done`}
      >
        <Icon name="check" size={20} />
      </button>
      <button className="icon-btn subtle small" onClick={onRemove} aria-label={`Delete set ${index}`}>
        <Icon name="close" size={16} />
      </button>
    </>
  );
}
