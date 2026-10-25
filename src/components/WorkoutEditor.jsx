import { useState } from 'react';
import ExercisePicker from './ExercisePicker.jsx';
import Icon from './Icon.jsx';
import { newId, lastTimeSets, plannedSets, formatSet, formatDate, typeOf, compareSets, SUGGESTION_ICONS } from '../utils.js';

// Edits one workout: its exercises, their sets, and notes.
// Used both for the workout in progress and for fixing old workouts.
// Every change is passed up through onChange, which saves it.
export default function WorkoutEditor({ workout, exercises, workouts, settings, onChange, addExercise }) {
  const [picking, setPicking] = useState(false);
  // When fixing an old workout, new sets count as done straight away.
  const finished = Boolean(workout.finishedAt);

  const exerciseOf = (id) => exercises.find((e) => e.id === id);

  function update(changes) {
    onChange({ ...workout, ...changes });
  }

  function updateEntry(entryId, changeFn) {
    update({ entries: workout.entries.map((e) => (e.id === entryId ? changeFn(e) : e)) });
  }

  function addEntry(exercise) {
    setPicking(false);
    // Start from last time's sets with the suggestion applied
    // (or 3 empty sets for an exercise you haven't done before).
    const plan = plannedSets(workouts, exercise.id, typeOf(exercise), settings, workout.startedAt);
    // Assisted exercise done for the first time: start the weight as "−" (assistance).
    const startNegative = !plan.last && typeOf(exercise) === 'assisted' && /assist|band/i.test(exercise.name);
    const sets = plan.sets.map((s) => ({ ...s, done: finished, ...(startNegative ? { weight: '-' } : {}) }));
    const entry = { id: newId(), exerciseId: exercise.id, sets, suggestion: finished ? null : plan.suggestion };
    update({ entries: [...workout.entries, entry] });
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

      {workout.entries.map((entry) => {
        const exercise = exerciseOf(entry.exerciseId);
        return (
          <ExerciseCard
            key={entry.id}
            name={exercise?.name || 'Deleted exercise'}
            type={typeOf(exercise)}
            entry={entry}
            settings={settings}
            finished={finished}
            last={lastTimeSets(workouts, entry.exerciseId, workout.startedAt)}
            onChange={(fn) => updateEntry(entry.id, fn)}
            onRemove={() => removeEntry(entry.id)}
          />
        );
      })}

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

// Which input columns each exercise type shows.
const COLUMNS = {
  weight: [
    { field: 'weight', label: (unit) => unit, mode: 'decimal' },
    { field: 'reps', label: () => 'Reps', mode: 'numeric' },
  ],
  reps: [{ field: 'reps', label: () => 'Reps', mode: 'numeric' }],
  assisted: [
    { field: 'weight', label: (unit) => `± ${unit}`, mode: 'decimal', signed: true },
    { field: 'reps', label: () => 'Reps', mode: 'numeric' },
  ],
  time: [{ field: 'time', label: () => 'Sec', mode: 'numeric' }],
};

// One exercise inside a workout, with its list of sets.
function ExerciseCard({ name, type, entry, settings, finished, last, onChange, onRemove }) {
  const columns = COLUMNS[type];
  const showRpe = settings.trackRpe;
  const gridTemplateColumns = [
    '34px',
    ...columns.map(() => 'minmax(0, 1fr)'),
    ...(showRpe ? ['minmax(0, 0.8fr)'] : []),
    '44px',
    '28px',
  ].join(' ');

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
      const prev = e.sets[e.sets.length - 1] || {};
      const set = { id: newId(), weight: prev.weight ?? '', reps: prev.reps ?? '', time: prev.time ?? '', rpe: '', done: finished };
      return { ...e, sets: [...e.sets, set] };
    });
  }

  function removeSet(setId) {
    onChange((e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) }));
  }

  // Go back to exactly what was done last time, ignoring the suggestion.
  function useLastTime() {
    onChange((e) => ({
      ...e,
      suggestion: null,
      sets: last.sets.map((s) => ({ id: newId(), weight: s.weight ?? '', reps: s.reps ?? '', time: s.time ?? '', rpe: '', done: false })),
    }));
  }

  const suggestion = entry.suggestion;
  const anyDone = entry.sets.some((s) => s.done);

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
          Last time ({formatDate(last.date)}): {last.sets.map((s) => formatSet(s, type)).join(' · ')}
        </p>
      )}

      {suggestion && !finished && (
        <div className={`suggestion ${suggestion.kind}`}>
          <span className="suggestion-icon" aria-hidden="true">{SUGGESTION_ICONS[suggestion.kind]}</span>
          <span className="suggestion-text">{suggestion.text}</span>
          {!['hold', 'confirm'].includes(suggestion.kind) && !anyDone && last && (
            <button className="btn-text small-link" onClick={useLastTime}>Use last time</button>
          )}
        </div>
      )}

      <div className="set-grid" style={{ gridTemplateColumns }}>
        <span className="set-head">Set</span>
        {columns.map((c) => <span key={c.field} className="set-head">{c.label(settings.unit)}</span>)}
        {showRpe && <span className="set-head">RPE</span>}
        <span />
        <span />
        {entry.sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={i + 1}
            set={set}
            columns={columns}
            showRpe={showRpe}
            trend={last ? compareSets(set, last.sets[i] || last.sets[last.sets.length - 1], type) : 0}
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

function SetRow({ index, set, columns, showRpe, trend, onChange, onToggle, onRemove }) {
  const cls = set.done ? 'done' : '';
  return (
    <>
      <span className={`set-num ${cls}`}>
        {index}
        {trend > 0 && <span className="trend up" title="More than last time">▲</span>}
        {trend < 0 && <span className="trend down" title="Less than last time">▼</span>}
      </span>
      {columns.map((c) =>
        c.signed ? (
          <SignedInput
            key={c.field}
            className={cls}
            value={set[c.field] ?? ''}
            onChange={(value) => onChange({ [c.field]: value })}
            label={`Set ${index} ${c.field}`}
          />
        ) : (
          <input
            key={c.field}
            className={`set-input ${cls}`}
            inputMode={c.mode}
            placeholder="0"
            value={set[c.field] ?? ''}
            onChange={(e) => onChange({ [c.field]: e.target.value })}
            aria-label={`Set ${index} ${c.field}`}
          />
        ),
      )}
      {showRpe && (
        <input
          className={`set-input rpe ${cls}`}
          inputMode="decimal"
          placeholder="–"
          value={set.rpe ?? ''}
          onChange={(e) => onChange({ rpe: e.target.value })}
          aria-label={`Set ${index} RPE`}
        />
      )}
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

// A number with a − / + button in front, for assisted (−) or weighted (+) sets.
// Phone number keypads often have no minus key, hence the button.
// The value is saved as text like "-20", "15" or "-" (minus, no number yet).
function SignedInput({ value, onChange, className, label }) {
  const negative = String(value).startsWith('-');
  const digits = String(value).replace(/^[-+]/, '');
  const build = (neg, d) => (neg ? '-' : '') + d;

  return (
    <div className={`signed-input ${className} ${negative ? 'negative' : 'positive'}`}>
      <button
        type="button"
        className="sign-btn"
        onClick={() => onChange(build(!negative, digits))}
        aria-label={negative ? `${label}: assistance (tap for added weight)` : `${label}: added weight (tap for assistance)`}
      >
        {negative ? '−' : '+'}
      </button>
      <input
        inputMode="decimal"
        placeholder="0"
        value={digits}
        onChange={(e) => onChange(build(negative, e.target.value.replace(/^[-+]/, '')))}
        aria-label={label}
      />
    </div>
  );
}
