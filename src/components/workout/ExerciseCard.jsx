import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import Suggestion from '../ui/Suggestion.jsx';
import SetRow from './SetRow.jsx';
import CoachLine from './CoachLine.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { typeOf, exerciseName, startsNegative } from '../../model/exercises.js';
import { nextSet, formatSetList, compareSets, asTarget, tickSet, planBelow, shown, val } from '../../model/sets.js';
import { heavierFor, HIGH_REPS, WAY_ABOVE } from '../../model/progression.js';
import { settingsFor } from '../../model/settings.js';
import { formatDate, formatNumber } from '../../model/format.js';
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
// onSwap: offer other exercises for the same muscles (machine taken).
// onOpen: show how to do the exercise (the name becomes a button).
export default function ExerciseCard({ entry, exercise, last, earlier = [], finished, onChange, onRemove, onSwap, onOpen }) {
  const { settings } = useData();
  const [dismissed, setDismissed] = useState(null); // id of a too-light set whose hint was closed
  const type = typeOf(exercise);
  const name = exerciseName(exercise);
  const columns = COLUMNS[type];

  const gridTemplateColumns = [
    '30px',
    // the ± weight field also holds the sign button, so it gets more room
    ...columns.map((c) => (c.signed ? 'minmax(0, 1.4fr)' : 'minmax(0, 1fr)')),
    ...(settings.trackRpe ? ['minmax(0, 0.8fr)'] : []),
    '44px',
    '28px',
  ].join(' ');

  const setSets = (change) => onChange((e) => ({ ...e, sets: change(e.sets) }));
  // Typing a value also plans it for the empty sets below (see planBelow).
  const updateSet = (id, changes) =>
    setSets((sets) => {
      const i = sets.findIndex((s) => s.id === id);
      let next = sets.map((s) => (s.id === id ? { ...s, ...changes } : s));
      for (const [field, value] of Object.entries(changes)) next = planBelow(next, i, field, value);
      return next;
    });
  // Ticking takes the grey planned values; unticking keeps them as typed.
  const toggleDone = (set) =>
    setSets((sets) => sets.map((s) => (s.id !== set.id ? s : s.done ? { ...s, done: false, doneAt: null } : tickSet(s))));
  const addSet = () => setSets((sets) => [...sets, nextSet(sets, finished)]);
  const removeSet = (id) => setSets((sets) => sets.filter((s) => s.id !== id));
  // "Same as last time" ('same') or back to the suggestion (null): the sets
  // not done yet get those values as their grey plan.
  const choose = (chosen) =>
    onChange((e) => {
      const plan = chosen === 'same' ? last.sets : e.suggestion.sets || last.sets;
      const values = (i) => {
        const { weight, reps, time } = plan[i] || plan.at(-1);
        return { weight, reps, time };
      };
      return { ...e, suggestion: { ...e.suggestion, chosen }, sets: e.sets.map((s, i) => (s.done ? s : asTarget({ ...s, ...values(i) }))) };
    });

  const { suggestion } = entry;
  // The set from last time to compare with (same position, or the last one).
  const previousSet = (i) => last && (last.sets[i] || last.sets[last.sets.length - 1]);
  const records = recordSetIds(entry.sets, earlier, type);
  const weighted = type === 'weight' || type === 'assisted';
  const tooLight = weighted && !finished ? tooLightSet(entry.sets, dismissed) : null;
  const heavierWeight = tooLight && heavierFor(val(tooLight.weight), val(tooLight.reps), 10, type, settingsFor(settings, exercise));

  // The sets after the too-light one become plans at the heavier weight.
  function goHeavier() {
    setSets((sets) => {
      const after = sets.findIndex((s) => s.id === tooLight.id);
      return sets.map((s, i) => (i > after && !s.done ? { ...s, weight: null, reps: null, target: { ...s.target, weight: heavierWeight, reps: 10 } } : s));
    });
  }

  return (
    <section className="card exercise-card">
      <header className="card-header">
        <h3>
          {onOpen ? (
            <button className="exercise-name-btn" onClick={onOpen} aria-label={`${name}: how to do it`}>
              {name} <Icon name="info" size={17} />
            </button>
          ) : (
            name
          )}
          {entry.extra && <span className="badge extra-badge">Healthy extra</span>}
        </h3>
        <span className="card-header-actions">
          {onSwap && !finished && !entry.sets.some((s) => s.done) && (
            <button className="btn-text small-link" onClick={onSwap}>Swap</button>
          )}
          <button className="icon-btn subtle" onClick={onRemove} aria-label={`Remove ${name}`}>
            <Icon name="trash" size={18} />
          </button>
        </span>
      </header>

      {exercise?.notes && <p className="exercise-notes-line">{exercise.notes}</p>}

      {finished
        ? last && (
            <p className="last-time">
              Last time ({formatDate(last.date)}): {formatSetList(last.sets, type, settings.unit)}
            </p>
          )
        : !(entry.sets.some((s) => s.done) && !suggestion) && (
            <CoachLine suggestion={suggestion} last={last} type={type} unit={settings.unit} onChoose={choose} />
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

      {tooLight && (
        <Suggestion
          suggestion={{
            kind: 'up',
            title: tooLight.target?.reps ? `${val(tooLight.reps)} reps, ${val(tooLight.reps) - tooLight.target.reps} more than planned` : `${val(tooLight.reps)} reps. Felt easy?`,
            text: 'Go heavier for the next sets, about 10 reps each?',
          }}
        >
          <span className="hint-actions">
            <button className="btn-text small-link" onClick={goHeavier}>Use {formatNumber(heavierWeight)} {settings.unit}</button>
            <button className="btn-text small-link muted" onClick={() => setDismissed(tooLight.id)}>No</button>
          </span>
        </Suggestion>
      )}

      <button className="btn btn-ghost" onClick={addSet}>
        <Icon name="plus" size={16} /> Add set
      </button>
    </section>
  );
}

// The last ticked set that was much easier than planned (4+ reps over its
// plan, or 15+ reps when there was no plan), if sets after it are still to
// do at no more than its weight (so the hint goes away once they're heavier).
const wayAbove = (s) => (s.target?.reps ? val(s.reps) >= s.target.reps + WAY_ABOVE : val(s.reps) >= HIGH_REPS);
function tooLightSet(sets, dismissed) {
  const i = sets.findLastIndex((s) => s.done && wayAbove(s));
  if (i < 0 || sets[i].id === dismissed) return null;
  const rest = sets.slice(i + 1).filter((s) => !s.done);
  return rest.length && rest.every((s) => val(shown(s, 'weight')) <= val(sets[i].weight)) ? sets[i] : null;
}
