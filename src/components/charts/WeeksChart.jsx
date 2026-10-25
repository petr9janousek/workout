import { useState } from 'react';
import { formatShortDate } from '../../model/format.js';

// Training days per week as bars, with the weekly goal as a dashed line.
// Bars that reached the goal are orange; tap a bar for its numbers.
// weeks: [{ start: Date, days }] oldest first (calendar.js weeklyCounts)
export default function WeeksChart({ weeks, goal }) {
  const [active, setActive] = useState(weeks.length - 1);
  const W = 320, H = 110, pad = { top: 10, bottom: 18, left: 4, right: 4 };
  const max = Math.max(7, goal);
  const slot = (W - pad.left - pad.right) / weeks.length;
  const barW = slot - 6;
  const y = (v) => pad.top + (H - pad.top - pad.bottom) * (1 - v / max);
  const reached = weeks.filter((w) => w.days >= goal).length;
  const a = weeks[active];

  return (
    <div className="weeks-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${reached} of the last ${weeks.length} weeks reached your goal of ${goal} days.`}>
        {weeks.map((w, i) => {
          const x = pad.left + i * slot + 3;
          const top = y(Math.max(w.days, 0.15)); // a sliver for 0, so the week is visible
          return (
            <g key={i} onClick={() => setActive(i)} className="week-bar-hit">
              <rect x={x - 3} y={pad.top} width={slot} height={H - pad.top - pad.bottom} fill="transparent" />
              <rect
                x={x}
                y={top}
                width={barW}
                height={y(0) - top}
                rx="3"
                className={`week-bar${w.days >= goal ? ' reached' : ''}${i === active ? ' active' : ''}`}
              />
            </g>
          );
        })}
        <line x1={pad.left} x2={W - pad.right} y1={y(goal)} y2={y(goal)} className="goal-line" />
        <text x={W - pad.right} y={y(goal) - 3} textAnchor="end" className="axis">goal {goal}</text>
        <text x={pad.left} y={H - 4} className="axis">{formatShortDate(weeks[0].start)}</text>
        <text x={W - pad.right} y={H - 4} textAnchor="end" className="axis">this week</text>
      </svg>
      <p className="chart-readout">
        <strong>{a.days} {a.days === 1 ? 'day' : 'days'}</strong>{' '}
        <span className="muted">· week of {formatShortDate(a.start)}{a.days >= goal ? ' · goal reached' : ''}</span>
      </p>
    </div>
  );
}
