import { useState } from 'react';
import LineChart from '../components/LineChart.jsx';
import Icon from '../components/Icon.jsx';
import { exerciseHistory, formatDate, formatSet } from '../utils.js';

const METRICS = [
  { id: 'topWeight', label: 'Heaviest set', help: 'The heaviest weight you lifted that day.' },
  { id: 'best1RM', label: 'Est. 1-rep max', help: 'Estimated max for a single rep, calculated from your best set. Lets sets with different reps be compared.' },
  { id: 'volume', label: 'Volume', help: 'Weight × reps, added up over all sets that day.' },
  { id: 'totalReps', label: 'Total reps', help: 'All reps added up. Useful for bodyweight exercises.' },
];

export default function ProgressScreen({ exercises, workouts, unit }) {
  const [openId, setOpenId] = useState(null);

  // Exercises that have been done at least once, most recent first.
  const tracked = exercises
    .map((e) => ({ exercise: e, history: exerciseHistory(workouts, e.id) }))
    .filter((t) => t.history.length > 0)
    .sort((a, b) => b.history.at(-1).date.localeCompare(a.history.at(-1).date));

  const open = tracked.find((t) => t.exercise.id === openId);
  if (open) return <ExerciseProgress {...open} unit={unit} onBack={() => setOpenId(null)} />;

  return (
    <div>
      <h1>Progress</h1>
      {tracked.length === 0 && <p className="empty">Finish a workout and your exercises will appear here.</p>}
      {tracked.map(({ exercise, history }) => {
        const latest = history.at(-1);
        return (
          <button key={exercise.id} className="card card-button row-between" onClick={() => setOpenId(exercise.id)}>
            <span>
              <strong>{exercise.name}</strong>
              <span className="muted block">
                {history.length} {history.length === 1 ? 'session' : 'sessions'} · last {formatDate(latest.date)}
              </span>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        );
      })}
    </div>
  );
}

function ExerciseProgress({ exercise, history, unit, onBack }) {
  const usesWeight = history.some((h) => h.topWeight > 0);
  const [metric, setMetric] = useState(usesWeight ? 'topWeight' : 'totalReps');
  const m = METRICS.find((x) => x.id === metric);
  const metricUnit = metric === 'totalReps' ? 'reps' : unit;

  // Personal records
  const best = (key) => history.reduce((a, b) => (b[key] > a[key] ? b : a));
  const records = usesWeight
    ? [
        { label: 'Heaviest', value: `${best('topWeight').topWeight} ${unit}`, date: best('topWeight').date },
        { label: 'Est. 1RM', value: `${best('best1RM').best1RM} ${unit}`, date: best('best1RM').date },
        { label: 'Best volume', value: `${Math.round(best('volume').volume)} ${unit}`, date: best('volume').date },
      ]
    : [{ label: 'Most reps in a session', value: best('totalReps').totalReps, date: best('totalReps').date }];

  return (
    <div>
      <button className="back" onClick={onBack}>
        <Icon name="back" size={18} /> Progress
      </button>
      <h1>{exercise.name}</h1>

      <div className="records">
        {records.map((r) => (
          <div key={r.label} className="record">
            <span className="record-label">{r.label}</span>
            <span className="record-value">{r.value}</span>
            <span className="muted small">{formatDate(r.date)}</span>
          </div>
        ))}
      </div>

      <div className="chips" role="tablist">
        {METRICS.filter((x) => usesWeight || x.id === 'totalReps').map((x) => (
          <button key={x.id} className={x.id === metric ? 'chip active' : 'chip'} onClick={() => setMetric(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="muted small">{m.help}</p>

      <section className="card">
        <LineChart
          key={metric}
          unit={metricUnit}
          points={history.map((h) => ({ date: h.date, value: Math.round(h[metric] * 10) / 10 }))}
        />
      </section>

      <h2 className="section-title">Sessions</h2>
      {[...history].reverse().map((h) => (
        <div key={h.workoutId} className="session-row">
          <span className="muted">{formatDate(h.date)}</span>
          <span>{h.sets.map(formatSet).join(' · ')}</span>
        </div>
      ))}
    </div>
  );
}
