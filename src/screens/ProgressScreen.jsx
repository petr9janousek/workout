import { useState } from 'react';
import LineChart from '../components/LineChart.jsx';
import Icon from '../components/Icon.jsx';
import { exerciseHistory, formatDate, formatSet, formatSeconds, formatNumber, formatSigned, typeOf, suggestNext, recentSessions, SUGGESTION_ICONS } from '../utils.js';

// What can be charted for each type of exercise.
const METRICS = {
  weight: [
    { id: 'topWeight', label: 'Heaviest set', unit: 'weight', help: 'The heaviest weight you lifted that day.' },
    { id: 'best1RM', label: 'Est. 1-rep max', unit: 'weight', help: 'Estimated max for a single rep, calculated from your best set. Lets sets with different reps be compared.' },
    { id: 'volume', label: 'Volume', unit: 'weight', help: 'Weight × reps, added up over all sets that day.' },
    { id: 'totalReps', label: 'Total reps', unit: 'reps', help: 'All reps added up.' },
  ],
  reps: [
    { id: 'bestReps', label: 'Best set', unit: 'reps', help: 'Most reps in a single set that day.' },
    { id: 'totalReps', label: 'Total reps', unit: 'reps', help: 'All reps added up.' },
  ],
  assisted: [
    { id: 'topWeight', label: 'Best load', unit: 'weight', help: 'Below zero = assistance, above = added weight. Going up is progress.' },
    { id: 'bestReps', label: 'Best set', unit: 'reps', help: 'Most reps in a single set that day.' },
    { id: 'totalReps', label: 'Total reps', unit: 'reps', help: 'All reps added up.' },
  ],
  time: [
    { id: 'longestTime', label: 'Longest hold', unit: 's', help: 'Your longest set that day, in seconds.' },
    { id: 'totalTime', label: 'Total time', unit: 's', help: 'All sets added up, in seconds.' },
  ],
};

export default function ProgressScreen({ exercises, workouts, unit, settings }) {
  const [openId, setOpenId] = useState(null);

  // Exercises that have been done at least once, most recent first.
  const tracked = exercises
    .map((e) => {
      const history = exerciseHistory(workouts, e.id);
      const type = typeOf(e);
      const next = history.length ? suggestNext(recentSessions(workouts, e.id), type, settings) : null;
      return { exercise: e, type, history, next };
    })
    .filter((t) => t.history.length > 0)
    .sort((a, b) => b.history.at(-1).date.localeCompare(a.history.at(-1).date));

  const open = tracked.find((t) => t.exercise.id === openId);
  if (open) return <ExerciseProgress {...open} unit={unit} onBack={() => setOpenId(null)} />;

  return (
    <div>
      <h1>Progress</h1>
      {tracked.length === 0 && <p className="empty">Finish a workout and your exercises will appear here.</p>}
      {tracked.map(({ exercise, history, next, type }) => {
        const latest = history.at(-1);
        return (
          <button key={exercise.id} className="card card-button row-between" onClick={() => setOpenId(exercise.id)}>
            <span>
              <strong>{exercise.name}</strong>
              <span className="muted block small">
                {history.length} {history.length === 1 ? 'session' : 'sessions'} · last {formatDate(latest.date)}
              </span>
              {next && (
                <span className={`next-hint ${next.kind}`}>
                  {SUGGESTION_ICONS[next.kind]} Next: {next.sets.map((s) => formatSet(s, type)).join(' · ')}
                </span>
              )}
            </span>
            <Icon name="chevron" size={18} />
          </button>
        );
      })}
    </div>
  );
}

function ExerciseProgress({ exercise, type, history, next, unit, onBack }) {
  const metrics = METRICS[type];
  const [metric, setMetric] = useState(metrics[0].id);
  const m = metrics.find((x) => x.id === metric) || metrics[0];
  const metricUnit = m.unit === 'weight' ? unit : m.unit;

  // Personal records
  const best = (key) => history.reduce((a, b) => (b[key] > a[key] ? b : a));
  const record = (label, key, format) => ({ label, value: format(best(key)[key]), date: best(key).date });
  const records = {
    weight: [
      record('Heaviest', 'topWeight', (v) => `${v} ${unit}`),
      record('Est. 1RM', 'best1RM', (v) => `${v} ${unit}`),
      record('Best volume', 'volume', (v) => `${formatNumber(v)} ${unit}`),
    ],
    reps: [record('Best set', 'bestReps', (v) => `${v} reps`), record('Most in a day', 'totalReps', (v) => `${v} reps`)],
    assisted: [record('Best load', 'topWeight', (v) => formatSigned(v, unit)), record('Best set', 'bestReps', (v) => `${v} reps`)],
    time: [record('Longest hold', 'longestTime', formatSeconds), record('Most in a day', 'totalTime', formatSeconds)],
  }[type];

  return (
    <div>
      <button className="back" onClick={onBack}>
        <Icon name="back" size={18} /> Progress
      </button>
      <h1>{exercise.name}</h1>

      {next && (
        <div className={`suggestion ${next.kind}`}>
          <span className="suggestion-icon" aria-hidden="true">{SUGGESTION_ICONS[next.kind]}</span>
          <span className="suggestion-text">
            <strong>Next time: {next.sets.map((s) => formatSet(s, type, unit)).join(' · ')}</strong>
            <br />
            {next.text}
          </span>
        </div>
      )}

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
        {metrics.map((x) => (
          <button key={x.id} className={x.id === m.id ? 'chip active' : 'chip'} onClick={() => setMetric(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="muted small">{m.help}</p>

      <section className="card">
        <LineChart
          key={m.id}
          unit={metricUnit}
          points={history.map((h) => ({ date: h.date, value: Math.round(h[m.id] * 10) / 10 }))}
        />
      </section>

      <h2 className="section-title">Sessions</h2>
      {[...history].reverse().map((h) => (
        <div key={h.workoutId} className="session-row">
          <span className="muted">{formatDate(h.date)}</span>
          <span>{h.sets.map((s) => formatSet(s, type)).join(' · ')}</span>
        </div>
      ))}
    </div>
  );
}
