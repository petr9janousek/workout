import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { monthGrid, dayKey, workoutsByDay } from '../../model/calendar.js';
import { go } from '../../hooks/useRoute.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// A month of training days: filled = trained, ring = today.
// Tap a trained day to see what you did; ‹ › change the month.
export default function MonthCalendar({ workouts }) {
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(null);
  const byDay = workoutsByDay(workouts);
  const weeks = monthGrid(month.year, month.month);
  const today = dayKey(now);
  const title = new Date(month.year, month.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const inMonth = (d) => d.getMonth() === month.month;
  const trainedInMonth = weeks.flat().filter((d) => inMonth(d) && byDay[dayKey(d)]).length;

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
          const cls = ['month-day', inMonth(d) ? '' : 'outside', trained ? 'trained' : '', key === today ? 'today' : '', key === selected ? 'selected' : ''].join(' ');
          return (
            <button
              key={key}
              className={cls}
              disabled={!trained}
              onClick={() => setSelected(key === selected ? null : key)}
              aria-label={`${d.toLocaleDateString()}${trained ? `: ${trained.length} workout${trained.length > 1 ? 's' : ''}` : ''}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {selected && (
        <ul className="month-day-list">
          {byDay[selected].map((w) => (
            <li key={w.id}>
              <button className="btn-text small-link" onClick={() => go('history', w.id)}>
                {w.name || 'Workout'}: {w.entries.length} exercises
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
