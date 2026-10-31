import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { SUGGESTION_ICONS } from '../ui/Suggestion.jsx';
import { formatSetList } from '../../model/sets.js';
import { formatDate } from '../../model/format.js';

// The line above an exercise's sets: what to do today, in one line
// ("▲ One more rep: 42.5 kg × 11, 11, 10"). Tap it for why and last time,
// and to do the same as last time instead (onChoose('same'), or null to go
// back to the suggestion); that rewrites the grey plan of the sets not done.
// suggestion: entry.suggestion { kind, title, text, sets, chosen }
// last: last time's session { date, sets }, or null the first time
export default function CoachLine({ suggestion, last, type, onChoose }) {
  const [open, setOpen] = useState(false);

  // First time: how to pick a starting weight.
  if (!suggestion) {
    if (last || (type !== 'weight' && type !== 'assisted')) return null;
    return (
      <Line kind="first" icon="○" title="First time: pick a weight for about 10 good reps" open={open} onToggle={() => setOpen(!open)}>
        <p>Choose a weight you could lift about 10 times, stopping with a rep or two left. Too easy after the first set? Go heavier on the next one.</p>
        <p>Fill in the first set; the others follow.</p>
      </Line>
    );
  }

  // "Same as last time" instead of the suggestion, and back again.
  const same = suggestion.chosen === 'same';
  const canSwitch = last && !['hold', 'confirm'].includes(suggestion.kind);
  const kind = same ? 'hold' : suggestion.kind;
  const title = same ? `Same as last time: ${formatSetList(last.sets.map((s) => ({ ...s, rpe: null })), type)}` : suggestion.title;

  return (
    <Line kind={kind} icon={SUGGESTION_ICONS[kind]} title={title} open={open} onToggle={() => setOpen(!open)}>
      <p>{same ? `Your choice for today. The suggestion was: ${suggestion.title.charAt(0).toLowerCase()}${suggestion.title.slice(1)}` : suggestion.text}.</p>
      {last && !same && (
        <p className="muted">
          Last time ({formatDate(last.date)}): {formatSetList(last.sets, type)}
        </p>
      )}
      {canSwitch && (
        <button
          className="btn-text small-link coach-switch"
          onClick={() => {
            onChoose(same ? null : 'same');
            setOpen(false);
          }}
        >
          {same ? 'Back to the suggestion' : 'Same as last time instead'}
        </button>
      )}
    </Line>
  );
}

function Line({ kind, icon, title, open, onToggle, children }) {
  return (
    <div className={`coach ${kind}${open ? ' open' : ''}`}>
      <button className="coach-line" onClick={onToggle} aria-expanded={open}>
        <span className="coach-icon" aria-hidden="true">{icon}</span>
        <span className="coach-title">{title}</span>
        <span className={open ? 'chevron down open' : 'chevron down'}>
          <Icon name="down" size={16} />
        </span>
      </button>
      {open && <div className="coach-more small">{children}</div>}
    </div>
  );
}
