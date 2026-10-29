import BackButton from '../../components/ui/BackButton.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, back } from '../../hooks/useRoute.js';
import { activityLabel, activitySummary, distanceUnitFor, countsAsActiveDay, whoMinutes, MIN_ACTIVE_MINUTES } from '../../model/activities.js';
import { SportIcon } from '../../components/ui/Icon.jsx';
import { formatDate, formatTime } from '../../model/format.js';

// One logged activity: what, when, how long and hard; change or delete it.
// Address: #/history/<id>
export default function ActivityDetail({ activity }) {
  const { unit, actions } = useData();
  const label = activityLabel(activity);

  function remove() {
    if (!confirm(`Delete “${label}” on this day?`)) return;
    actions.deleteWorkout(activity.id);
    back('progress');
  }

  return (
    <div>
      <BackButton label="Progress" fallback={['progress']} />
      <h1 className="activity-title">
        <span className="activity-title-icon" aria-hidden="true">
          <SportIcon type={activity.activity} size={30} />
        </span>
        {label}
      </h1>
      <p className="muted">
        {formatDate(activity.startedAt)} · {formatTime(activity.startedAt)}
      </p>

      <section className="card">
        <p className="activity-summary">{activitySummary(activity, distanceUnitFor(unit))}</p>
        {activity.heartRate > 0 && <p className="small">Average heart rate: {activity.heartRate} bpm</p>}
        <p className="muted small">
          {countsAsActiveDay(activity)
            ? `Counts as an active day${whoMinutes(activity) ? `, and ${whoMinutes(activity)} active minutes toward the WHO's 150 a week` : ''}.`
            : `Shorter than ${MIN_ACTIVE_MINUTES} minutes, so it doesn't count as an active day.`}
        </p>
        {activity.notes && <p className="notes-view">{activity.notes}</p>}
      </section>

      <div className="actions">
        <button className="btn btn-secondary btn-wide" onClick={() => go('progress', 'workout', activity.id, 'edit')}>Edit</button>
        <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete</button>
      </div>
    </div>
  );
}
