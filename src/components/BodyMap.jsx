import { useState } from 'react';
import { FRONT, BACK, FRONT_LINES, BACK_LINES, HEAD } from './bodyShapes.js';
import { MUSCLES, muscleLabel, level, SCALES } from '../muscles.js';

// Front and back body, each muscle coloured by how many sets it got.
// sets: { chest: 3, triceps: 1.5, … }
// scale: 'workout' (one session) or 'week' (last 7 days)
export default function BodyMap({ sets, scale = 'workout' }) {
  const [selected, setSelected] = useState(null);
  const steps = SCALES[scale];
  const fmt = (n) => (Math.round(n * 2) / 2).toString(); // nearest ½ set

  const trained = MUSCLES.filter((m) => sets[m.id] > 0).sort((a, b) => sets[b.id] - sets[a.id]);

  function figure(shapes, lines, offsetX, label) {
    const drawHalf = (mirror) => (
      <g transform={mirror ? 'translate(120,0) scale(-1,1)' : undefined}>
        {shapes.map((s, i) => {
          if (!s.muscle) return <path key={i} d={s.d} className="body-skin" />;
          const lvl = level(sets[s.muscle], scale);
          return (
            <path
              key={i}
              d={s.d}
              className={`body-muscle heat-${lvl}${selected === s.muscle ? ' selected' : ''}`}
              onClick={() => setSelected(selected === s.muscle ? null : s.muscle)}
            />
          );
        })}
        {lines.map((d, i) => <path key={`l${i}`} d={d} className="body-line" />)}
      </g>
    );
    return (
      <g transform={`translate(${offsetX},0)`}>
        <path d={HEAD} className="body-skin" />
        {drawHalf(false)}
        {drawHalf(true)}
        <text x="60" y="216" className="body-caption" textAnchor="middle">{label}</text>
      </g>
    );
  }

  return (
    <div className="body-map">
      <svg
        viewBox="0 0 250 220"
        role="img"
        aria-label={trained.length ? `Muscles worked: ${trained.map((m) => `${m.label} ${fmt(sets[m.id])} sets`).join(', ')}` : 'No muscles worked yet'}
      >
        {figure(FRONT, FRONT_LINES, 0, 'Front')}
        {figure(BACK, BACK_LINES, 130, 'Back')}
      </svg>

      <p className="body-readout">
        {selected ? (
          <>
            <strong>{muscleLabel(selected)}</strong>: {fmt(sets[selected] || 0)} sets
            {scale === 'week' && ' this week'}
          </>
        ) : (
          <span className="muted">Tap a muscle to see its sets</span>
        )}
      </p>

      <div className="heat-legend" aria-hidden="true">
        <span className="muted">Sets:</span>
        {steps.map((n, i) => (
          <span key={n} className="heat-key">
            <span className={`heat-swatch heat-${i + 1}`} />
            {i === 0 ? `under ${steps[1]}` : `${n}+`}
          </span>
        ))}
      </div>

      {trained.length > 0 && (
        <p className="muscle-list">
          {trained.map((m) => `${m.label} ${fmt(sets[m.id])}`).join(' · ')}
        </p>
      )}
    </div>
  );
}
