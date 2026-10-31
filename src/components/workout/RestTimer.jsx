import { useEffect, useRef, useState } from 'react';
import { HintButton } from '../ui/CardTitle.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { useNow } from '../../hooks/useNow.js';
import { restTarget } from '../../model/settings.js';
import { formatClock } from '../../model/format.js';

// After a ticked set: a small card above the tab bar with the rest left,
// on every screen while the workout runs (it lives in App.jsx). It drains;
// when it's empty the card says "Ready" and fades away. Tap it to hide it;
// −30 s / +30 s change only this rest.
// The rest is timed from the most recently ticked set, against the rest for
// that exercise (big lifts rest longer, see restTarget in settings.js).
const READY_MS = 3000; // how long "Ready" stays before it fades away

export default function RestTimer({ workout }) {
  const { settings, exercisesById } = useData();
  const now = useNow();
  const [hiddenFor, setHiddenFor] = useState(null);
  const [hint, setHint] = useState(false);
  const [extra, setExtra] = useState({ for: 0, ms: 0 }); // ±30 s, for one rest only

  const startedAt = Math.max(0, ...workout.entries.flatMap((e) => e.sets).map((s) => (s.done && s.doneAt ? Date.parse(s.doneAt) : 0)));
  const entry = workout.entries.find((e) => e.sets.some((s) => s.done && s.doneAt && Date.parse(s.doneAt) === startedAt));
  const extraMs = extra.for === startedAt ? extra.ms : 0;
  const goal = Math.max(15000, restTarget(settings, exercisesById.get(entry?.exerciseId)) * 1000 + extraMs);
  const rest = now - startedAt;
  const over = rest - goal;
  const onAdjust = (ms) => setExtra({ for: startedAt, ms: extraMs + ms });

  // A short buzz when the rest is over (Android; iPhones don't allow it).
  // Only right when it happens, not when reopening the workout later.
  const buzzedFor = useRef(0);
  useEffect(() => {
    if (startedAt && over >= 0 && over < 5000 && buzzedFor.current !== startedAt) {
      buzzedFor.current = startedAt;
      navigator.vibrate?.(200);
    }
  }, [startedAt, over]);

  if (!startedAt || hiddenFor === startedAt || over > READY_MS) return null;
  const ready = over >= 0;
  const left = ready ? 0 : Math.max(0, 1 - rest / goal);

  return (
    <div className={ready ? 'rest-timer ready' : 'rest-timer'} role="timer" style={{ '--left': `${(left * 100).toFixed(1)}%` }}>
      {hint && (
        <p className="hint-text rest-hint">
          Resting at least a minute helps muscles grow; past about 90 s the extra gain is small, but big lifts like squats
          or rows give more reps in the next set after about 2 minutes. Waiting a bit longer never hurts. The usual rest
          is in Settings; −30 s / +30 s change only this rest.
        </p>
      )}
      <div className="rest-row">
        <button className="rest-main" onClick={() => setHiddenFor(startedAt)} aria-label="Hide the rest timer">
          <Ring left={ready ? 1 : left} ready={ready} />
          <span className="rest-text">
            <strong>{ready ? 'Ready' : formatClock(goal - rest)}</strong>
            <span>{ready ? 'next set when you are' : `rest · ${formatClock(goal)}`}</span>
          </span>
        </button>
        <HintButton open={hint} onToggle={() => setHint(!hint)} about="rest" />
        {!ready && (
          <span className="rest-adjust">
            <button className="chip" onClick={() => onAdjust(-30000)} aria-label="30 seconds less rest">−30 s</button>
            <button className="chip" onClick={() => onAdjust(30000)} aria-label="30 seconds more rest">+30 s</button>
          </span>
        )}
      </div>
    </div>
  );
}

// The rest left as a ring (orange, draining); a green ring with a ✓ when ready.
function Ring({ left, ready }) {
  const r = 16;
  const full = 2 * Math.PI * r;
  return (
    <svg className="rest-ring" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={r} className="rest-ring-track" />
      <circle cx="20" cy="20" r={r} className="rest-ring-left" strokeDasharray={`${full * Math.max(0, left)} ${full}`} transform="rotate(-90 20 20)" />
      {ready && <path d="M13 20.5l5 5 9-10" className="rest-ring-check" />}
    </svg>
  );
}
