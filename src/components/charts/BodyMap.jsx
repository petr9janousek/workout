import { useState } from 'react';
import BodyFigure from './BodyFigure.jsx';
import { MUSCLES, muscleLabel, level, SCALES } from '../../model/muscles.js';
import { formatSets } from '../../model/format.js';

// The muscle map: each muscle coloured by how many sets it got.
// sets: { chest: 3, triceps: 1.5, … }
// scale: 'workout' (one session) or 'week' (last 7 days)
// compact: just the small picture, no tapping, legend or list (for previews)
export default function BodyMap({ sets, scale = 'workout', compact = false }) {
  const [selected, setSelected] = useState(null);
  const steps = SCALES[scale];
  const trained = MUSCLES.filter((m) => sets[m.id] > 0).sort((a, b) => sets[b.id] - sets[a.id]);
  const label = trained.length ? `Muscles worked: ${trained.map((m) => `${m.label} ${formatSets(sets[m.id])} sets`).join(', ')}` : 'No muscles worked yet';
  const levelOf = (muscle) => level(sets[muscle], scale);

  if (compact) {
    return (
      <div className="body-map compact">
        <BodyFigure levelOf={levelOf} captions={false} label={label} />
      </div>
    );
  }

  return (
    <div className="body-map">
      <BodyFigure levelOf={levelOf} selected={selected} onTap={(m) => setSelected(selected === m ? null : m)} label={label} />

      <p className="body-readout">
        {selected ? (
          <>
            <strong>{muscleLabel(selected)}</strong>: {formatSets(sets[selected] || 0)} sets
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

      {trained.length > 0 && <p className="muscle-list">{trained.map((m) => `${m.label} ${formatSets(sets[m.id])}`).join(' · ')}</p>}
    </div>
  );
}
