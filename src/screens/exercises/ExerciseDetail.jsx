import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import MusclePicker from '../../components/charts/MusclePicker.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, back } from '../../hooks/useRoute.js';
import { EXERCISE_TYPES, typeOf } from '../../model/exercises.js';
import { musclesOf } from '../../model/muscles.js';
import { countWorkoutsWith, recentSessions } from '../../model/workouts.js';
import { plansUsing } from '../../model/plans.js';
import { formatDate, formatNumber } from '../../model/format.js';
import { weightStepFor } from '../../model/settings.js';

// Weight jumps an exercise can have of its own (null = like in Settings).
const OWN_STEPS = { kg: [null, 1, 1.25, 2, 2.5, 5], lb: [null, 2.5, 5, 10] };

// The fields you can edit. `muscles` undefined = guessed from the name.
const editable = (e) => ({ name: e.name, type: typeOf(e), weightStep: e.weightStep ?? null, muscles: e.muscles });

// One exercise: name, type, the muscles it works (tap the body), how often
// you've done it, and deleting it. Changes are a draft until you tap Save,
// so nothing changes by accident.
export default function ExerciseDetail({ exerciseId }) {
  const { exercisesById, workouts, plans, settings, unit, actions } = useData();
  const exercise = exercisesById.get(exerciseId);
  const [draft, setDraft] = useState(() => (exercise ? editable(exercise) : null));

  if (!exercise) {
    return (
      <div>
        <BackButton label="Exercises" fallback={['workout', 'exercises']} />
        <p className="empty">This exercise doesn't exist any more.</p>
      </div>
    );
  }

  const update = (changes) => setDraft((d) => ({ ...d, ...changes }));
  const changed = JSON.stringify(draft) !== JSON.stringify(editable(exercise));
  const valid = draft.name.trim() !== '';
  const sessions = recentSessions(workouts, exercise.id, null, 999);
  const type = draft.type;
  const lastWeight = Math.max(0, ...(sessions[0]?.sets.map((s) => Math.abs(s.weight || 0)) || [0]));
  const generalStep = settings.weightStep === 'auto' ? `Auto${lastWeight ? ` (+${formatNumber(weightStepFor(lastWeight, settings))})` : ''}` : `+${formatNumber(settings.weightStep)}`;
  const inPlans = plansUsing(plans, exercise.id);

  function save() {
    actions.updateExercise(exercise.id, { ...draft, name: draft.name.trim() });
  }

  function remove() {
    const used = countWorkoutsWith(workouts, exercise.id);
    if (used) {
      alert(`“${exercise.name}” is used in ${used} workout(s), so it can't be deleted. You can rename it instead.`);
      return;
    }
    if (inPlans.length) {
      alert(`“${exercise.name}” is part of the plan “${inPlans[0].name}”. Remove it from the plan first.`);
      return;
    }
    if (!confirm(`Delete “${exercise.name}”?`)) return;
    actions.deleteExercise(exercise.id);
    back('workout', 'exercises');
  }

  return (
    <div>
      <BackButton label="Exercises" fallback={['workout', 'exercises']} />
      <h1>{exercise.name}</h1>

      <p className="exercise-stats">
        {sessions.length ? (
          <>
            <span>
              Done {sessions.length}× · last {formatDate(sessions[0].date)}
            </span>
            <button className="btn-text small-link" onClick={() => go('progress', exercise.id)}>See progress</button>
          </>
        ) : (
          <span className="muted">Not done yet</span>
        )}
      </p>
      {inPlans.length > 0 && <p className="muted small">In your plan{inPlans.length > 1 ? 's' : ''}: {inPlans.map((p) => p.name).join(', ')}</p>}

      <section className="card exercise-form">
        <label className="field">
          <span className="small">Name</span>
          <input className="search" value={draft.name} onChange={(e) => update({ name: e.target.value })} aria-label="Exercise name" />
        </label>
        <span className="small">How it's logged</span>
        <ChipGroup
          label="Exercise type"
          options={EXERCISE_TYPES.map((t) => ({ value: t.id, label: t.label }))}
          value={type}
          onChange={(type) => update({ type })}
        />
        {(type === 'weight' || type === 'assisted') && (
          <>
            <span className="small">Weight jump when you're ready to go up</span>
            <ChipGroup
              label="Weight jump"
              options={(OWN_STEPS[unit] || OWN_STEPS.kg).map((step) => ({
                value: step,
                label: step == null ? `Like Settings: ${generalStep}` : `+${formatNumber(step)} ${unit}`,
              }))}
              value={draft.weightStep}
              onChange={(weightStep) => update({ weightStep })}
            />
          </>
        )}
      </section>

      <section className="card">
        <h3>Muscles worked</h3>
        <MusclePicker muscles={musclesOf({ ...exercise, ...draft })} onChange={(muscles) => update({ muscles })} />
        {draft.muscles ? (
          <button className="btn-text small-link" onClick={() => update({ muscles: undefined })}>
            Reset to automatic (from the name)
          </button>
        ) : (
          <p className="muted small">Guessed from the name. Tap the body to change it.</p>
        )}
      </section>

      <div className="actions">
        <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete exercise</button>
      </div>

      {changed && (
        <div className="save-bar">
          <button className="btn btn-secondary" onClick={() => setDraft(editable(exercise))}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!valid}>Save changes</button>
        </div>
      )}
    </div>
  );
}
