import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import ExercisePicker from '../../components/workout/ExercisePicker.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, back, openTab } from '../../hooks/useRoute.js';
import { updateDay, addItem, setItemSets, removeItem, moveItem, dayMuscleSets, totalSets, sessionMinutes } from '../../model/plans.js';
import { exerciseName, typeOf, EXERCISE_TYPES, findExercises } from '../../model/exercises.js';
import { musclesOf, muscleLabel } from '../../model/muscles.js';
import { restTarget } from '../../model/settings.js';

// Planning one day of a plan: which exercises, in which order, how many sets.
// No weights or reps here: those come from your history when you start the day.
export default function DayEditor({ planId, dayId, picking }) {
  const { plans, exercises, exercisesById, activeWorkout, settings, actions } = useData();
  const plan = plans.find((p) => p.id === planId);
  const day = plan?.days.find((d) => d.id === dayId);
  const [name, setName] = useState(day?.name ?? '');
  const [muscle, setMuscle] = useState(null); // tapped on the body: show ideas for it

  if (!day) {
    return (
      <div>
        <BackButton label="Plan" fallback={['plans', planId]} />
        <p className="empty">This day doesn't exist any more.</p>
      </div>
    );
  }

  const index = plan.days.indexOf(day);
  const change = (fn) => actions.savePlan(updateDay(plan, day.id, fn));

  function rename(text) {
    setName(text);
    if (text.trim()) change((d) => ({ ...d, name: text.trim() }));
  }

  function removeDay() {
    if (!confirm(`Remove “${day.name}” from the plan?`)) return;
    actions.savePlan({ ...plan, days: plan.days.filter((d) => d.id !== day.id) });
    back('plans', plan.id);
  }

  function start() {
    if (activeWorkout) {
      alert('Finish or discard the workout in progress first.');
      return;
    }
    actions.startPlanDay(plan, day);
    openTab('home');
  }

  return (
    <div>
      <BackButton label={plan.name} fallback={['plans', plan.id]} />

      <div className="day-editor-head">
        <span className="plan-day-num">{index + 1}</span>
        <input className="day-name-input" value={name} onChange={(e) => rename(e.target.value)} aria-label="Day name" />
      </div>

      <section className="card day-summary">
        <BodyMap sets={dayMuscleSets(day, exercisesById)} onSelect={setMuscle}>
          {muscle && <Ideas muscle={muscle} exercises={exercises} day={day} onAdd={(e) => change((d) => addItem(d, e.id))} />}
        </BodyMap>
      </section>

      <h2 className="section-title">
        Exercises{' '}
        <span className="muted small">
          · {totalSets(day)}&nbsp;sets{day.items.length > 0 && ` · ~${sessionMinutes(day.items, restTarget(settings))}\u00a0min`}
        </span>
      </h2>
      {day.items.length === 0 && <p className="empty">Add the exercises for this day. Weights and reps come later, at the gym.</p>}
      <ul className="plan-items">
        {day.items.map((item, i) => {
          const exercise = exercisesById.get(item.exerciseId);
          const type = EXERCISE_TYPES.find((t) => t.id === typeOf(exercise))?.label;
          return (
            <li key={`${item.exerciseId}-${i}`} className="plan-item">
              <div className="plan-item-order">
                <button className="icon-btn subtle small" disabled={i === 0} onClick={() => change((d) => moveItem(d, i, -1))} aria-label="Move up">
                  <Icon name="up" size={16} />
                </button>
                <button className="icon-btn subtle small" disabled={i === day.items.length - 1} onClick={() => change((d) => moveItem(d, i, 1))} aria-label="Move down">
                  <Icon name="down" size={16} />
                </button>
              </div>
              <div className="plan-item-name">
                <strong>{exerciseName(exercise)}</strong>
                <span className="muted small">
                  {type}
                  {item.extra && <span className="badge extra-badge">Healthy extra</span>}
                </span>
              </div>
              <div className="stepper" aria-label={`${exerciseName(exercise)} sets`}>
                <button onClick={() => change((d) => setItemSets(d, i, item.sets - 1))} aria-label="One set less">−</button>
                <span>{item.sets}</span>
                <button onClick={() => change((d) => setItemSets(d, i, item.sets + 1))} aria-label="One set more">+</button>
              </div>
              <button className="icon-btn subtle small" onClick={() => change((d) => removeItem(d, i))} aria-label={`Remove ${exerciseName(exercise)}`}>
                <Icon name="close" size={16} />
              </button>
            </li>
          );
        })}
      </ul>

      <button className="btn btn-secondary btn-wide" onClick={() => go('plans', plan.id, day.id, 'add')}>
        <Icon name="plus" size={18} /> Add exercise
      </button>

      <div className="actions">
        {day.items.length > 0 && (
          <button className="btn btn-primary btn-wide" onClick={start}>Start {day.name} now</button>
        )}
        <button className="btn btn-danger-ghost btn-wide" onClick={removeDay}>Remove this day</button>
      </div>

      {picking && (
        <ExercisePicker
          onPick={(exercise) => {
            change((d) => addItem(d, exercise.id));
            back('plans', plan.id, day.id);
          }}
          onClose={() => back('plans', plan.id, day.id)}
        />
      )}
    </div>
  );
}

// A few exercises for the muscle tapped on the body, main movers first,
// leaving out the ones the day already has. Tap one to add it (3 sets).
function Ideas({ muscle, exercises, day, onAdd }) {
  const inDay = new Set(day.items.map((i) => i.exerciseId));
  const ideas = findExercises(exercises, { muscle, musclesOf })
    .filter((e) => !inDay.has(e.id))
    .slice(0, 4);
  if (!ideas.length) return <p className="muted small center">Every exercise for {muscleLabel(muscle).toLowerCase()} is already in this day.</p>;
  return (
    <div className="muscle-ideas">
      <span className="small muted">Ideas for {muscleLabel(muscle).toLowerCase()}:</span>
      <div className="chips">
        {ideas.map((e) => (
          <button key={e.id} className="chip" onClick={() => onAdd(e)}>
            + {e.name}
          </button>
        ))}
      </div>
    </div>
  );
}
