import { useState } from 'react';
import FitHeading from '../../components/ui/FitHeading.jsx';
import Welcome from './Welcome.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import WeekStrip from '../../components/charts/WeekStrip.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useSaveBackup } from '../../hooks/useSaveBackup.js';
import { backupDue } from '../../data/backup.js';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { finishedWorkouts } from '../../model/workouts.js';
import { nextDayIndex, lastPlanWorkout, dayMuscleSets, totalSets } from '../../model/plans.js';
import { exerciseName } from '../../model/exercises.js';
import { formatDate } from '../../model/format.js';

// The start screen, top to bottom: this week at a glance, your plan's next
// day (or an invitation to make a plan), other ways to start, shortcuts,
// a backup reminder when one is due, and recent workouts to repeat.
export default function StartWorkout() {
  const { workouts, plans, activePlan, exercisesById, settings, actions } = useData();
  const finished = finishedWorkouts(workouts);
  const recent = finished.slice(0, 3);

  // A brand-new install: the welcome steps instead.
  if (!settings.setupDone && workouts.length === 0 && plans.length === 0) return <Welcome />;

  return (
    <div className="start">
      <FitHeading>Ready to train</FitHeading>
      <WeekStrip onOpen={() => go('progress')} />

      {activePlan && activePlan.days.length > 0 ? <NextDay plan={activePlan} /> : <MakeAPlan />}

      <button className="btn btn-secondary btn-wide" onClick={() => actions.startWorkout()}>
        Start an empty workout
      </button>

      <div className="shortcuts">
        <button className="shortcut" onClick={() => go('workout', 'exercises')}>
          <Icon name="list" size={20} />
          <span>Exercises</span>
        </button>
        <button className="shortcut" onClick={() => go('workout', 'plans')}>
          <Icon name="plan" size={20} />
          <span>Plans</span>
        </button>
      </div>

      {backupDue(settings.lastBackup, finished.length) && <BackupReminder lastBackup={settings.lastBackup} />}

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

// A nudge to save a backup: everything lives only on this phone.
function BackupReminder({ lastBackup }) {
  const saveBackup = useSaveBackup();
  const [message, setMessage] = useState('');
  return (
    <section className="reminder" role="status">
      <p>
        <strong>Save a backup.</strong>{' '}
        {lastBackup ? `The last one was on ${formatDate(lastBackup)}.` : "You haven't saved one yet."} Your workouts are
        only on this phone.
      </p>
      <button className="btn btn-secondary" onClick={async () => setMessage((await saveBackup()) || '')}>
        Save backup
      </button>
      {message && <p className="message">{message}</p>}
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
