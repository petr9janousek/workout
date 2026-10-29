import Icon from '../ui/Icon.jsx';
import Firework from '../ui/Firework.jsx';
import { NumberInput, SignedInput } from '../ui/NumberInput.jsx';
import { formatNumber } from '../../model/format.js';

// A record set ticked in the last few seconds gets the firework.
const FRESH_MS = 4000;

// One set: number (with ▲▼ vs last time, or a trophy for a personal record),
// its values, RPE, ✓ and delete.
// It renders grid cells, so it must sit inside ExerciseCard's .set-grid.
export default function SetRow({ index, set, columns, showRpe, defaultNegative, trend, record, onChange, onToggle, onRemove }) {
  const done = set.done ? 'done' : '';
  const label = (field) => `Set ${index} ${field}`;
  const fresh = record && set.doneAt && Date.now() - Date.parse(set.doneAt) < FRESH_MS;

  return (
    <>
      <span className={`set-num ${done}`}>
        {index}
        {record ? (
          <span className={`trophy${fresh ? ' fresh' : ''}`} title="Personal record" role="img" aria-label="Personal record">
            <Icon name="trophy" size={15} />
            {fresh && <Firework />}
          </span>
        ) : (
          <>
            {trend > 0 && <span className="trend up" title="More than last time">▲</span>}
            {trend < 0 && <span className="trend down" title="Less than last time">▼</span>}
          </>
        )}
      </span>

      {/* An empty field shows the planned value in grey; ticking ✓ takes it. */}
      {columns.map((c) => {
        const planned = set.target?.[c.field];
        const props = { value: set[c.field], onChange: (v) => onChange({ [c.field]: v }), label: label(c.field), className: done };
        return c.signed ? (
          <SignedInput key={c.field} {...props} planned={planned} defaultNegative={defaultNegative} />
        ) : (
          <NumberInput key={c.field} {...props} decimal={c.decimal} placeholder={planned != null ? formatNumber(planned) : ''} />
        );
      })}

      {showRpe && (
        <NumberInput value={set.rpe} onChange={(rpe) => onChange({ rpe })} decimal placeholder="–" label={`Set ${index} RPE`} className={`rpe ${done}`} />
      )}

      <button className={`check-btn ${done}`} onClick={onToggle} aria-label={set.done ? `Undo set ${index}` : `Mark set ${index} done`}>
        <Icon name="check" size={20} />
      </button>
      <button className="icon-btn subtle small" onClick={onRemove} aria-label={`Delete set ${index}`}>
        <Icon name="close" size={16} />
      </button>
    </>
  );
}
