import { useState } from 'react';
import BodyFigure from './BodyFigure.jsx';
import { MUSCLES, muscleLabel, cycleMuscle } from '../../model/muscles.js';

// Pick which muscles an exercise works by tapping the body:
// each tap goes off → helping (½) → main → off.
// muscles: { chest: 1, triceps: 0.5 }   onChange(newMuscles)
// The same choices are also available as a list, for small muscles.
export default function MusclePicker({ muscles, onChange }) {
  const [showList, setShowList] = useState(false);
  const main = MUSCLES.filter((m) => muscles[m.id] === 1);
  const helping = MUSCLES.filter((m) => muscles[m.id] === 0.5);
  // main = deepest red, helping = lighter
  const levelOf = (m) => (muscles[m] === 1 ? 4 : muscles[m] ? 2 : 0);
  const tap = (m) => onChange(cycleMuscle(muscles, m));

  return (
    <div className="muscle-picker">
      <BodyFigure
        levelOf={levelOf}
        onTap={tap}
        label={`Main: ${main.map((m) => m.label).join(', ') || 'none'}. Helping: ${helping.map((m) => m.label).join(', ') || 'none'}.`}
      />

      <div className="picker-legend">
        <span className="heat-key"><span className="heat-swatch heat-4" /> Main</span>
        <span className="heat-key"><span className="heat-swatch heat-2" /> Helping (½ set)</span>
        <span className="muted small">Tap a muscle to change it</span>
      </div>

      <dl className="picker-summary">
        <dt>Main</dt>
        <dd>{main.map((m) => m.label).join(', ') || <span className="muted">none yet</span>}</dd>
        <dt>Helping</dt>
        <dd>{helping.map((m) => m.label).join(', ') || <span className="muted">none</span>}</dd>
      </dl>

      <button className="btn-text small-link" onClick={() => setShowList(!showList)} aria-expanded={showList}>
        {showList ? 'Hide the list' : 'Pick from a list instead'}
      </button>
      {showList && (
        <div className="chips">
          {MUSCLES.map((m) => {
            const weight = muscles[m.id] || 0;
            return (
              <button key={m.id} className={`chip ${weight === 1 ? 'active' : weight ? 'half' : ''}`} onClick={() => tap(m.id)}>
                {muscleLabel(m.id)}
                {weight === 0.5 && ' ½'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
