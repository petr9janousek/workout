import { useRef, useState } from 'react';
import { formatShortDate, formatDate, formatNumber } from '../../model/format.js';

// A small line chart drawn with SVG. Tap or drag on it to see each value.
// points: [{ date, value }] oldest first.
export default function LineChart({ points, unit }) {
  const svgRef = useRef(null);
  const [active, setActive] = useState(null);

  const W = 340, H = 200;
  const pad = { top: 16, right: 14, bottom: 26, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  // Don't let the axis dip below zero, unless the values do (assisted exercises).
  const allPositive = min >= 0;
  if (min === max) { min -= 5; max += 5; }
  const span = max - min;
  min = allPositive ? Math.max(0, min - span * 0.15) : min - span * 0.15;
  max = max + span * 0.15;

  const x = (i) => pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => pad.top + innerH - ((v - min) / (max - min)) * innerH;
  const ticks = niceTicks(min, max, 4);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');

  // Find the point nearest to where the finger is.
  function handlePointer(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setActive(best);
  }

  const a = active != null ? points[active] : null;

  return (
    <div className="chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Progress chart"
        onPointerDown={handlePointer}
        onPointerMove={(e) => e.buttons && handlePointer(e)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} />
            <text className="axis" x={pad.left - 6} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        <text className="axis" x={x(0)} y={H - 6} textAnchor={points.length === 1 ? 'middle' : 'start'}>
          {formatShortDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text className="axis" x={x(points.length - 1)} y={H - 6} textAnchor="end">
            {formatShortDate(points[points.length - 1].date)}
          </text>
        )}

        {a && <line className="crosshair" x1={x(active)} x2={x(active)} y1={pad.top} y2={pad.top + innerH} />}
        <path className="line" d={path} />
        {points.map((p, i) => (
          <circle key={i} className={i === active ? 'dot active' : 'dot'} cx={x(i)} cy={y(p.value)} r={i === active ? 6 : 4} />
        ))}
      </svg>
      <p className="chart-readout">
        {a ? (
          <><strong>{formatNumber(a.value)} {unit}</strong> <span className="muted">· {formatDate(a.date)}</span></>
        ) : (
          <span className="muted">Tap the chart to see values</span>
        )}
      </p>
    </div>
  );
}

// Round, evenly spaced numbers for the axis (e.g. 40, 50, 60).
function niceTicks(min, max, count) {
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const ticks = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(Math.round(t * 100) / 100);
  return ticks;
}
