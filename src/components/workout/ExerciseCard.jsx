import Icon from '../ui/Icon.jsx';
import Suggestion from '../ui/Suggestion.jsx';
import SetRow from './SetRow.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { typeOf, exerciseName, startsNegative } from '../../model/exercises.js';
import { copySets, nextSet, formatSet, compareSets } from '../../model/sets.js';
import { formatDate } from '../../model/format.js';
import { recordSetIds } from '../../model/records.js';

// The input columns for each exercise type (besides set number, RPE and ✓).
const COLUMNS = {
  weight: [
    { field: 'weight', label: (unit) => unit, decimal: true },
    { field: 'reps', label: () => 'Reps' },
  ],
  reps: [{ field: 'reps', label: () => 'Reps' }],
  assisted: [
    { field: 'weight', label: (unit) => `± ${unit}`, decimal: true, signed: true },
    { field: 'reps', label: () => 'Reps' },
  ],
  time: [{ field: 'time', label: () => 'Sec' }],
};

// One exercise inside a workout: last time, the suggestion, and its sets.
// onChange(fn): fn gets the entry and returns the changed entry.
// earlier: every set of this exercise before this workout (for records).
export default function ExerciseCard({ entry, exercise, last, earlier = [], finished, onChange, onRemove }) {
  const { settings } = useData();
  const type = typeOf(exercise);
  const name = exerciseName(exercise);
  const columns = COLUMNS[type];

  const gridTemplateColumns = [
    '34px',
    ...columns.map(() => 'minmax(0, 1fr)'),
    ...(settings.trackRpe ? ['minmax(0, 0.8fr)'] : []),
    '44px',
    '28px',
  ].join(' ');

  const setSets = (change) => onChange((e) => ({ ...e, sets: change(e.sets) }));
  const updateSet = (id, changes) => setSets((sets) => sets.map((s) => (s.id === id ? { ...s, ...changes } : s)));
  const toggleDone = (set) => updateSet(set.id, { done: !set.done, doneAt: set.done ? null : new Date().toISOString() });
  const addSet = () => setSets((sets) => [...sets, nextSet(sets, finished)]);
  const removeSet = (id) => setSets((sets) => sets.filter((s) => s.id !== id));
  // Back to exactly what was done last time, ignoring the suggestion.
  const useLastTime = () => onChange((e) => ({ ...e, suggestion: null, sets: copySets(last.sets) }));

  const { suggestion } = entry;
  const canUndoSuggestion = suggestion && !['hold', 'confirm'].includes(suggestion.kind) && last && !entry.sets.some((s) => s.done);
  // The set from last time to compare with (same position, or the last one).
  const previousSet = (i) => last && (last.sets[i] || last.sets[last.sets.length - 1]);
  const records = recordSetIds(entry.sets, earlier, type);

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
        <Suggestion suggestion={suggestion}>
          {canUndoSuggestion && (
            <button className="btn-text small-link" onClick={useLastTime}>
              Use last time
            </button>
          )}
        </Suggestion>
      )}

      <div className="set-grid" style={{ gridTemplateColumns }}>
        <span className="set-head">Set</span>
        {columns.map((c) => (
          <span key={c.field} className="set-head">{c.label(settings.unit)}</span>
        ))}
        {settings.trackRpe && <span className="set-head">RPE</span>}
        <span />
        <span />
        {entry.sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={i + 1}
            set={set}
            columns={columns}
            showRpe={settings.trackRpe}
            defaultNegative={startsNegative(exercise)}
            trend={compareSets(set, previousSet(i), type)}
            record={records.has(set.id)}
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
