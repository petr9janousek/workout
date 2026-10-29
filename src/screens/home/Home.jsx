import { useState } from 'react';
import FitHeading from '../../components/ui/FitHeading.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import WeekStrip from '../../components/charts/WeekStrip.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { NumberInput } from '../../components/ui/NumberInput.jsx';
import { useSaveBackup } from '../../hooks/useSaveBackup.js';
import { backupDue } from '../../data/backup.js';
import { useData } from '../../data/DataProvider.jsx';
import { go, openTab } from '../../hooks/useRoute.js';
import { finishedWorkouts } from '../../model/workouts.js';
import { nextDayIndex, lastPlanWorkout, dayMuscleSets, totalSets, sessionMinutes } from '../../model/plans.js';
import { restTarget } from '../../model/settings.js';
import { exerciseName, typeOf } from '../../model/exercises.js';
import { recentRecords } from '../../model/records.js';
import { logBodyWeight } from '../../model/bodyWeight.js';
import { dayKey, workoutsByDay, thisWeek, dayMarks, weeklyGoal } from '../../model/calendar.js';
import { formatSet } from '../../model/sets.js';
import { formatDate, formatNumber, keepLastWord } from '../../model/format.js';

// Home: today. Top to bottom: this week, ways to start (your plan's next day
// is one of them, never the only one), a quick weigh-in, this week's
// records, a backup reminder when one is due, and Settings. While a workout
// runs, the workout replaces this screen (see HomeScreen.jsx).
export default function Home() {
  const { workouts, activePlan, settings, actions } = useData();
  const finished = finishedWorkouts(workouts);
  const trainedToday = finished.some((w) => dayKey(new Date(w.startedAt)) === dayKey(new Date()));
  const hasPlan = activePlan && activePlan.days.length > 0;

  return (
    <div className="home">
      <FitHeading>{trainedToday ? 'Nice work today' : 'Ready to train'}</FitHeading>

      <WeekStrip onOpen={() => openTab('progress')} />
      <GoalNote />

      {hasPlan && <NextDay plan={activePlan} />}

      <div className="start-actions">
        <button className="start-action" onClick={() => actions.startWorkout()}>
          <span className="start-action-icon"><Icon name="plus" size={24} /></span>
          <span className="start-action-title">Empty workout</span>
          <span className="muted small">Pick exercises as you go</span>
        </button>
        <button className="start-action" onClick={() => go('home', 'activity')}>
          <span className="start-action-icon"><Icon name="activity" size={24} /></span>
          <span className="start-action-title">Log activity</span>
          <span className="muted small">Run, swim, dance…</span>
        </button>
      </div>

      {!hasPlan && (
        <button className="card card-button row-between get-plan" onClick={() => openTab('plans', 'library')}>
          <span>
            <strong>Want a plan?</strong>
            <span className="muted block small">Ready-made plans for 2 to 6 days a week. Optional.</span>
          </span>
          <Icon name="chevron" size={18} />
        </button>
      )}

      {settings.trackBodyWeight && <WeighIn />}
      <RecentRecords />
      {backupDue(settings.lastBackup, finished.length) && <BackupReminder lastBackup={settings.lastBackup} />}


      <button className="card card-button row-between settings-link" onClick={() => go('home', 'settings')}>
        <span className="settings-link-main">
          <Icon name="settings" size={20} />
          <span>
            <strong>Settings</strong>
            <span className="muted block small">Backup, units, rest time and more</span>
          </span>
        </span>
        <Icon name="chevron" size={18} />
      </button>
    </div>
  );
}

// Under the week strip, once this week's goal is reached.
function GoalNote() {
  const { workouts, settings, activePlan } = useData();
  const byDay = workoutsByDay(workouts);
  const done = thisWeek().filter((d) => {
    const { gym, active } = dayMarks(byDay[dayKey(d)]);
    return gym || active;
  }).length;
  if (done < weeklyGoal(settings, activePlan)) return null;
  return <p className="goal-note small">Weekly goal reached. Rest days count too; a walk is a good one.</p>;
}

// The plan's next day, with a picker for any other day.
function NextDay({ plan }) {
  const { workouts, exercisesById, settings, actions } = useData();
  const next = nextDayIndex(plan, workouts);
  const [chosen, setChosen] = useState(null); // null = the next day
  const index = chosen ?? next;
  const day = plan.days[index];
  const last = lastPlanWorkout(plan, workouts);

  return (
    <section className="plan-hero">
      <div className="plan-hero-top">
        <button className="plan-hero-plan" onClick={() => openTab('plans', plan.id)}>
          {plan.name}
        </button>
        <button className="btn-text small-link" onClick={() => openTab('plans')}>Change plan</button>
      </div>

      <div className="plan-hero-body">
        <div className="plan-hero-text">
          <span className="muted small">
            {index === next ? 'Next up' : 'Chosen'} · day {index + 1} of {plan.days.length}
          </span>
          <h2 className="day-title">{keepLastWord(day.name)}</h2>
          <span className="muted small">
            {day.items.length}&nbsp;exercises · {totalSets(day)}&nbsp;sets{day.items.length > 0 && ` · ~${sessionMinutes(day.items, restTarget(settings))} min`}
          </span>
        </div>
        <div className="plan-hero-map">
          <BodyMap sets={dayMuscleSets(day, exercisesById)} compact />
        </div>
      </div>

      {day.items.length > 0 ? (
        <DayList key={day.id} items={day.items} />
      ) : (
        <p className="muted small">No exercises planned for this day yet.</p>
      )}

      {day.items.length > 0 ? (
        <button className="btn btn-primary btn-big" onClick={() => actions.startPlanDay(plan, day)}>
          Start {day.name}
        </button>
      ) : (
        <button className="btn btn-primary btn-big" onClick={() => openTab('plans', plan.id, day.id)}>
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

// The day's exercises. Long days show the first few, with a button to
// unfold the rest (and fold them again).
const SHOWN = 5;
function DayList({ items }) {
  const { exercisesById } = useData();
  const [open, setOpen] = useState(false);
  const foldable = items.length > SHOWN + 1; // never fold away just one
  const shown = foldable && !open ? items.slice(0, SHOWN) : items;
  return (
    <div>
      <ol className="plan-hero-list">
        {shown.map((item, i) => (
          <li key={i}>
            <span>{exerciseName(exercisesById.get(item.exerciseId))}</span>
            <span className="muted">{item.sets} sets</span>
          </li>
        ))}
      </ol>
      {foldable && (
        <button className="show-more" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Show less' : `Show all ${items.length} exercises`}
          <span className={open ? 'chevron down open' : 'chevron down'}>
            <Icon name="down" size={16} />
          </span>
        </button>
      )}
    </div>
  );
}

// Today's body weight in one line, until it's saved for today.
function WeighIn() {
  const { settings, unit, actions } = useData();
  const list = settings.bodyWeights || [];
  const today = dayKey(new Date());
  const [value, setValue] = useState(null);
  const [saved, setSaved] = useState(null);
  const todays = list.find((e) => e.date === today);
  if (todays && saved == null) return null; // weighed already, nothing to do

  function save() {
    if (value == null) return;
    actions.setSetting('bodyWeights', logBodyWeight(list, today, value));
    setSaved(value);
  }

  return (
    <section className="card weigh-in">
      {saved != null ? (
        <p className="weigh-in-done">
          <Icon name="check" size={18} /> Saved {formatNumber(saved)} {unit} for today
        </p>
      ) : (
        <div className="weigh-in-row">
          <span className="weigh-in-label">
            <strong>Weigh in?</strong>
            <span className="muted small">Body weight today</span>
          </span>
          <NumberInput value={value} onChange={setValue} decimal placeholder={list.length ? formatNumber(list.at(-1).weight) : unit} label="Today's body weight" />
          <button className="btn btn-primary" onClick={save} disabled={value == null}>Save</button>
        </div>
      )}
    </section>
  );
}

// Personal records from the last 7 days; tap one to see the exercise.
function RecentRecords() {
  const { workouts, exercisesById, unit } = useData();
  const records = recentRecords(workouts, exercisesById, 7);
  if (!records.length) return null;
  const shown = records.slice(0, 3);

  return (
    <section className="card records-card">
      <h3 className="record-count">
        <Icon name="trophy" size={18} /> {records.length === 1 ? 'A new record this week' : `${records.length} new records this week`}
      </h3>
      <ul className="records-list">
        {shown.map(({ workout, exerciseId, set }) => {
          const exercise = exercisesById.get(exerciseId);
          return (
            <li key={set.id}>
              <button className="records-item" onClick={() => go('home', 'exercise', exerciseId)}>
                <span>{exerciseName(exercise)}</span>
                <strong>{formatSet(set, typeOf(exercise), unit)}</strong>
                <span className="muted small">{dayKey(new Date(workout.startedAt)) === dayKey(new Date()) ? 'Today' : formatDate(workout.startedAt).split(',')[0]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {records.length > shown.length && <p className="muted small">and {records.length - shown.length} more</p>}
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
