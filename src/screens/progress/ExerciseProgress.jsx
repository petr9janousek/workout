import { useState } from 'react';
import LineChart from '../../components/charts/LineChart.jsx';
import BackButton from '../../components/ui/BackButton.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import Suggestion from '../../components/ui/Suggestion.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { exerciseHistory, recentSessions } from '../../model/workouts.js';
import { suggestNext } from '../../model/progression.js';
import { settingsFor } from '../../model/settings.js';
import { typeOf } from '../../model/exercises.js';
import { formatSet } from '../../model/sets.js';
import { formatDate, formatNumber, formatTotal, formatSigned, formatSeconds } from '../../model/format.js';

// What can be charted for each exercise type. `unit: 'weight'` = kg or lb.
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

// Personal records for each exercise type: [label, field, format].
const RECORDS = {
  weight: [
    ['Heaviest', 'topWeight', (v, unit) => `${formatNumber(v)} ${unit}`],
    ['Est. 1RM', 'best1RM', (v, unit) => `${formatNumber(v)} ${unit}`],
    ['Best volume', 'volume', (v, unit) => `${formatTotal(v)} ${unit}`],
  ],
  reps: [
    ['Best set', 'bestReps', (v) => `${v} reps`],
    ['Most in a day', 'totalReps', (v) => `${v} reps`],
  ],
  assisted: [
    ['Best load', 'topWeight', (v, unit) => formatSigned(v, unit)],
    ['Best set', 'bestReps', (v) => `${v} reps`],
  ],
  time: [
    ['Longest hold', 'longestTime', formatSeconds],
    ['Most in a day', 'totalTime', formatSeconds],
  ],
};

// One exercise: what to do next time, records, a chart and every session.
export default function ExerciseProgress({ exerciseId }) {
  const { workouts, exercisesById, settings, unit } = useData();
  const exercise = exercisesById.get(exerciseId);
  const type = typeOf(exercise);
  const metrics = METRICS[type];
  const [metricId, setMetricId] = useState(metrics[0].id);

  const history = exercise ? exerciseHistory(workouts, exerciseId) : [];
  if (!history.length) {
    return (
      <div>
        <BackButton label="Progress" fallback={['progress']} />
        <p className="empty">No sessions of this exercise yet.</p>
      </div>
    );
  }

  const next = suggestNext(recentSessions(workouts, exerciseId), type, settingsFor(settings, exercise));
  const metric = metrics.find((m) => m.id === metricId) || metrics[0];
  const best = (field) => history.reduce((a, b) => (b[field] > a[field] ? b : a));

  return (
    <div>
      <BackButton label="Progress" fallback={['progress']} />
      <h1>{exercise.name}</h1>

      <Suggestion suggestion={next} title={`Next time: ${next.sets.map((s) => formatSet(s, type, unit)).join(' · ')}`} />

      <div className="records">
        {RECORDS[type].map(([label, field, format]) => (
          <div key={label} className="record">
            <span className="record-label">{label}</span>
            <span className="record-value">{format(best(field)[field], unit)}</span>
            <span className="muted small">{formatDate(best(field).date)}</span>
          </div>
        ))}
      </div>

      <ChipGroup label="Chart" options={metrics.map((m) => ({ value: m.id, label: m.label }))} value={metric.id} onChange={setMetricId} />
      <p className="muted small">{metric.help}</p>

      <section className="card">
        <LineChart
          key={metric.id}
          unit={metric.unit === 'weight' ? unit : metric.unit}
          points={history.map((h) => ({ date: h.date, value: Math.round(h[metric.id] * 10) / 10 }))}
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
