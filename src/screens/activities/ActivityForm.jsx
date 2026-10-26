import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import { NumberInput } from '../../components/ui/NumberInput.jsx';
import { SportIcon } from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { back, openTab } from '../../hooks/useRoute.js';
import { ACTIVITY_TYPES, EFFORTS, MIN_ACTIVE_MINUTES, createActivity, updateActivity, distanceUnitFor } from '../../model/activities.js';
import { dayKey } from '../../model/calendar.js';
import { countEvent } from '../../analytics.js';

const QUICK_MINUTES = [20, 30, 45, 60, 90];

// When it happened: today = it just ended now; another day = midday.
function startFor(date, minutes) {
  if (date === dayKey(new Date())) return new Date(Date.now() - minutes * 60000).toISOString();
  return new Date(`${date}T12:00`).toISOString();
}

// Logging a run, a swim, a dance class… or changing one (`activity` given).
// Address: #/workout/activity (new) or #/history/<id>/edit (existing).
export default function ActivityForm({ activity }) {
  const { unit, actions } = useData();
  const editing = Boolean(activity);
  const [form, setForm] = useState(() => ({
    activity: activity?.activity ?? null,
    name: activity?.name ?? '',
    date: activity ? dayKey(activity.startedAt) : dayKey(new Date()),
    minutes: activity?.minutes ?? null,
    effort: activity?.effort ?? 'moderate',
    distance: activity?.distance ?? null,
    calories: activity?.calories ?? null,
    heartRate: activity?.heartRate ?? null,
    notes: activity?.notes ?? '',
  }));
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const ready = form.activity && form.minutes > 0;
  const hasDetails = Boolean(activity && (activity.distance || activity.calories || activity.heartRate || activity.notes));
  const distanceUnit = distanceUnitFor(unit);
  const effort = EFFORTS.find((e) => e.id === form.effort);

  function save() {
    const { date, ...fields } = form;
    const startedAt = editing && date === dayKey(activity.startedAt) ? activity.startedAt : startFor(date, form.minutes);
    if (editing) {
      actions.saveWorkout(updateActivity(activity, { ...fields, startedAt }));
      back('history', activity.id);
    } else {
      actions.saveWorkout(createActivity(fields, startedAt));
      countEvent('activity-logged', 'Activity logged');
      openTab('history');
    }
  }

  return (
    <div>
      <BackButton label={editing ? 'Back' : 'Workout'} fallback={editing ? ['history', activity.id] : ['workout']} />
      <h1>{editing ? 'Edit activity' : 'Log an activity'}</h1>

      <div className="activity-types" role="radiogroup" aria-label="Activity">
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={form.activity === t.id}
            className={form.activity === t.id ? 'activity-type active' : 'activity-type'}
            onClick={() => set('activity')(t.id)}
          >
            <span className="activity-icon" aria-hidden="true">
              <SportIcon type={t.id} size={26} />
            </span>
            {t.label}
          </button>
        ))}
      </div>

      <section className="card activity-form">
        {form.activity === 'other' && (
          <label className="field">
            <span className="small">What was it?</span>
            <input className="search" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Bouldering, tennis, skating" aria-label="Activity name" />
          </label>
        )}
        <label className="field">
          <span className="small">When</span>
          <input className="search" type="date" value={form.date} max={dayKey(new Date())} onChange={(e) => e.target.value && set('date')(e.target.value)} aria-label="Date" />
        </label>

        <span className="small">How long (minutes)</span>
        <div className="minutes-row">
          <NumberInput value={form.minutes} onChange={set('minutes')} label="Minutes" placeholder="min" />
          <div className="chips">
            {QUICK_MINUTES.map((m) => (
              <button key={m} className={form.minutes === m ? 'chip active' : 'chip'} onClick={() => set('minutes')(m)}>
                {m}
              </button>
            ))}
          </div>
        </div>
        {form.minutes > 0 && form.minutes < MIN_ACTIVE_MINUTES && (
          <p className="muted small">Under {MIN_ACTIVE_MINUTES} minutes: it's saved, but doesn't count as an active day.</p>
        )}

        <span className="small">How hard</span>
        <ChipGroup label="How hard" options={EFFORTS.map((e) => ({ value: e.id, label: e.label }))} value={form.effort} onChange={set('effort')} />
        <p className="muted small">{effort.help}</p>

        <details className="more-details" open={hasDetails}>
          <summary>More details (optional)</summary>
          <div className="optional-row">
            <label className="field">
              <span className="small">Distance ({distanceUnit})</span>
              <NumberInput value={form.distance} onChange={set('distance')} decimal label="Distance" placeholder="–" />
            </label>
            <label className="field">
              <span className="small">Calories</span>
              <NumberInput value={form.calories} onChange={set('calories')} label="Calories" placeholder="kcal" />
            </label>
            <label className="field">
              <span className="small">Avg heart rate</span>
              <NumberInput value={form.heartRate} onChange={set('heartRate')} label="Average heart rate" placeholder="bpm" />
            </label>
          </div>
          <p className="muted small">From a watch or fitness tracker, if you have one.</p>
          <label className="notes">
            <span className="small">Notes</span>
            <textarea rows={2} placeholder="Where, with whom, how it felt…" value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
          </label>
        </details>
      </section>

      <button className="btn btn-primary btn-wide" disabled={!ready} onClick={save}>
        {editing ? 'Save changes' : 'Save activity'}
      </button>
    </div>
  );
}
