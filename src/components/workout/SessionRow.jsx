import Icon, { SportIcon } from '../ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { isActivity, activityLabel, activitySummary } from '../../model/activities.js';
import { workoutTotals } from '../../model/workouts.js';
import { countRecords } from '../../model/records.js';
import { formatDate, formatTime, formatDuration, formatTotal } from '../../model/format.js';

// One finished workout or activity as a row in a list. The round icon uses
// the calendar's colours: a filled circle for the gym, a ring for activities.
// showDate: false when the list is already one day (shows the time instead).

// Numbers stay with their units when the line wraps: "5.7 km", "55 min".
const keepUnits = (text) => text.replace(/ (min|h|km|mi|kcal|\/km|\/mi)\b/g, '\u00a0$1');

export default function SessionRow({ workout: w, onOpen, showDate = true }) {
  const { workouts, exercisesById } = useData();
  const when = showDate ? formatDate(w.startedAt) : formatTime(w.startedAt);

  if (isActivity(w)) {
    return (
      <button className="session-row-btn" onClick={onOpen}>
        <span className="session-icon ring"><SportIcon type={w.activity} size={18} /></span>
        <span className="session-text">
          <strong>{activityLabel(w)}</strong>
          <span className="muted small">{when} · {keepUnits(activitySummary(w))}</span>
        </span>
        <Icon name="chevron" size={16} />
      </button>
    );
  }

  const t = workoutTotals(w);
  const records = countRecords(w, workouts, exercisesById);
  const parts = [when, formatDuration(Date.parse(w.finishedAt) - Date.parse(w.startedAt)), `${t.sets} sets`];
  if (t.volume > 0) parts.push(`${formatTotal(t.volume)} kg`);
  return (
    <button className="session-row-btn" onClick={onOpen}>
      <span className="session-icon filled"><Icon name="exercises" size={18} /></span>
      <span className="session-text">
        <strong>{w.name || 'Workout'}</strong>
        <span className="muted small">
          {keepUnits(parts.join(' · '))}
          {records > 0 && (
            <>
              {' · '}
              <span className="record-count" aria-label={`${records} personal records`}>
                <Icon name="trophy" size={12} />
                {records}
              </span>
            </>
          )}
        </span>
      </span>
      <Icon name="chevron" size={16} />
    </button>
  );
}
