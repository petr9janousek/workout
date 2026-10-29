import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import SessionRow from '../workout/SessionRow.jsx';
import { monthGrid, dayKey, workoutsByDay, dayMarks } from '../../model/calendar.js';
import { go } from '../../hooks/useRoute.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// A month of training days: solid orange = gym, orange ring = another
// activity (20+ min), both = ring around the circle; a dot marks today.
// Tap a day to see what you did underneath; ‹ › change the month.
// It opens on the last day you trained this month.
export default function MonthCalendar({ workouts }) {
  const now = new Date();
  const today = dayKey(now);
  const byDay = workoutsByDay(workouts);
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(() => lastTrainedDay(byDay, today));
  const weeks = monthGrid(month.year, month.month);
  const title = new Date(month.year, month.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const inMonth = (d) => d.getMonth() === month.month;
  const marksOf = (d) => dayMarks(byDay[dayKey(d)]);
  const trainedInMonth = weeks.flat().filter((d) => inMonth(d) && (marksOf(d).gym || marksOf(d).active)).length;
  const sessions = (selected && byDay[selected]) || [];

  function shift(by) {
    const d = new Date(month.year, month.month + by, 1);
    setMonth({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(null);
  }

  return (
    <div className="month-calendar">
      <div className="month-head">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">
          <Icon name="back" size={18} />
        </button>
        <span className="month-title">
          {title}
          <span className="muted small"> · {trainedInMonth} {trainedInMonth === 1 ? 'day' : 'days'}</span>
        </span>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="Next month">
          <Icon name="chevron" size={18} />
        </button>
      </div>

      <div className="month-grid" role="grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="month-weekday">{w[0]}</span>
        ))}
        {weeks.flat().map((d) => {
          const key = dayKey(d);
          const trained = byDay[key];
          const { gym, active } = dayMarks(trained);
          const cls = ['month-day', inMonth(d) ? '' : 'outside', gym ? 'day-gym' : '', active ? 'day-active' : '', key === today ? 'today' : '', key === selected ? 'selected' : ''].join(' ');
          return (
            <button
              key={key}
              className={cls}
              disabled={!trained}
              onClick={() => setSelected(key === selected ? null : key)}
              aria-pressed={key === selected}
              aria-label={`${d.toLocaleDateString()}${trained ? `: ${trained.length} ${trained.length > 1 ? 'sessions' : 'session'}` : ''}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p className="calendar-legend muted small" aria-hidden="true">
        <span className="legend-dot day-gym" /> Gym <span className="legend-dot day-active" /> Activity <span className="legend-dot day-both" /> Both
      </p>

      {sessions.length > 0 ? (
        <div className="day-sessions">
          <p className="day-sessions-title">{new Date(`${selected}T12:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          {sessions.map((w) => (
            <SessionRow key={w.id} workout={w} showDate={false} onOpen={() => go('progress', 'workout', w.id)} />
          ))}
        </div>
      ) : (
        <p className="muted small center day-sessions-hint">Tap a day to see what you did</p>
      )}
    </div>
  );
}

// The most recent day this month with something logged (today counts), or null.
function lastTrainedDay(byDay, today) {
  const days = Object.keys(byDay).filter((k) => k <= today && k.startsWith(today.slice(0, 7))).sort();
  return days.at(-1) ?? null;
}
