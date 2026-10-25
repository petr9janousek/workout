import { useState } from 'react';
import FitHeading from '../../components/ui/FitHeading.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { finishedWorkouts } from '../../model/workouts.js';
import { nextDayIndex, lastPlanWorkout, dayMuscleSets, totalSets } from '../../model/plans.js';
import { exerciseName } from '../../model/exercises.js';
import { formatDate } from '../../model/format.js';

// The start screen: your plan's next day front and centre, or an invitation
// to make a plan; then an empty workout or repeating a recent one.
export default function StartWorkout() {
  const { workouts, activePlan, exercisesById, actions } = useData();
  const recent = finishedWorkouts(workouts).slice(0, 3);

  return (
    <div className="start">
      <FitHeading>Ready to train</FitHeading>

      {activePlan && activePlan.days.length > 0 ? <NextDay plan={activePlan} /> : <MakeAPlan />}

      <button className="btn btn-secondary btn-wide" onClick={() => actions.startWorkout()}>
        Start an empty workout
      </button>

      {recent.length > 0 && (
        <section className="recent">
          <h2 className="section-title">Repeat a recent workout</h2>
          {recent.map((w) => (
            <button key={w.id} className="card card-button" onClick={() => actions.startWorkout(w)}>
              <span className="row-between">
                <strong>{w.name || 'Workout'}</strong>
                <span className="muted small">{formatDate(w.startedAt)}</span>
              </span>
              <span className="muted small">{w.entries.map((e) => exerciseName(exercisesById.get(e.exerciseId))).join(', ')}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

// The plan's next day, with a picker for any other day.
function NextDay({ plan }) {
  const { workouts, exercisesById, actions } = useData();
  const next = nextDayIndex(plan, workouts);
  const [chosen, setChosen] = useState(null); // null = the next day
  const index = chosen ?? next;
  const day = plan.days[index];
  const last = lastPlanWorkout(plan, workouts);

  return (
    <section className="plan-hero">
      <div className="plan-hero-top">
        <button className="plan-hero-plan" onClick={() => go('workout', 'plans', plan.id)}>
          {plan.name}
        </button>
        <button className="btn-text small-link" onClick={() => go('workout', 'plans')}>Change plan</button>
      </div>

      <div className="plan-hero-body">
        <div className="plan-hero-text">
          <span className="muted small">
            {index === next ? 'Next up' : 'Chosen'} · day {index + 1} of {plan.days.length}
          </span>
          <h2 className="day-title">{day.name}</h2>
          <span className="muted small">
            {day.items.length} exercises · {totalSets(day)} sets
          </span>
        </div>
        <div className="plan-hero-map">
          <BodyMap sets={dayMuscleSets(day, exercisesById)} compact />
        </div>
      </div>

      {day.items.length > 0 ? (
        <ol className="plan-hero-list">
          {day.items.map((item, i) => (
            <li key={i}>
              <span>{exerciseName(exercisesById.get(item.exerciseId))}</span>
              <span className="muted">{item.sets} sets</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">No exercises planned for this day yet.</p>
      )}

      {day.items.length > 0 ? (
        <button className="btn btn-primary btn-big" onClick={() => actions.startPlanDay(plan, day)}>
          Start {day.name}
        </button>
      ) : (
        <button className="btn btn-primary btn-big" onClick={() => go('workout', 'plans', plan.id, day.id)}>
          Plan {day.name}
        </button>
      )}

      {plan.days.length > 1 && (
        <div className="day-switch" role="radiogroup" aria-label="Choose a day">
          {plan.days.map((d, i) => (
            <button
              key={d.id}
              role="radio"
              aria-checked={i === index}
              className={i === index ? 'day-chip active' : 'day-chip'}
              onClick={() => setChosen(i === next ? null : i)}
            >
              <span className="day-chip-num">{i + 1}</span>
              {d.name}
            </button>
          ))}
        </div>
      )}

      {last && (
        <p className="muted small plan-hero-last">
          Last time: {last.name}, {formatDate(last.startedAt)}
        </p>
      )}
    </section>
  );
}

// No plan yet: invite to make one.
function MakeAPlan() {
  return (
    <section className="plan-hero no-plan">
      <h2 className="day-title">Plan your week</h2>
      <p className="muted">
        Choose how many days a week you train and a split like Push / Pull / Legs or Upper / Lower, or name the days
        yourself. Then starting a workout is one tap.
      </p>
      <button className="btn btn-primary btn-big" onClick={() => go('workout', 'plans', 'new')}>
        Make a plan
      </button>
    </section>
  );
}
