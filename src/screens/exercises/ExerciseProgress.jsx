import { useState } from 'react';
import LineChart from '../../components/charts/LineChart.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import Suggestion from '../../components/ui/Suggestion.jsx';
import FoldCard from '../../components/ui/FoldCard.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { exerciseHistory, recentSessions } from '../../model/workouts.js';
import { suggestNext } from '../../model/progression.js';
import { settingsFor } from '../../model/settings.js';
import { typeOf } from '../../model/exercises.js';
import { formatSetList } from '../../model/sets.js';
import { formatDate, formatNumber, formatTotal, formatSigned, formatSeconds } from '../../model/format.js';

// What can be charted for each exercise type.
const METRICS = {
  weight: [
    { id: 'topWeight', label: 'Heaviest set', unit: 'kg', help: 'The heaviest weight you lifted that day.' },
    { id: 'best1RM', label: 'Est. 1-rep max', unit: 'kg', help: 'Estimated max for a single rep, calculated from your best set. Lets sets with different reps be compared.' },
    { id: 'volume', label: 'Volume', unit: 'kg', help: 'Weight × reps, added up over all sets that day.' },
    { id: 'totalReps', label: 'Total reps', unit: 'reps', help: 'All reps added up.' },
  ],
  reps: [
    { id: 'bestReps', label: 'Best set', unit: 'reps', help: 'Most reps in a single set that day.' },
    { id: 'totalReps', label: 'Total reps', unit: 'reps', help: 'All reps added up.' },
  ],
  assisted: [
    { id: 'topWeight', label: 'Best load', unit: 'kg', help: 'Below zero = assistance, above = added weight. Going up is progress.' },
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
    ['Heaviest', 'topWeight', (v) => `${formatNumber(v)} kg`],
    ['Est. 1RM', 'best1RM', (v) => `${formatNumber(v)} kg`],
    ['Best volume', 'volume', (v) => `${formatTotal(v)} kg`],
  ],
  reps: [
    ['Best set', 'bestReps', (v) => `${v} reps`],
    ['Most in a day', 'totalReps', (v) => `${v} reps`],
  ],
  assisted: [
    ['Best load', 'topWeight', (v) => formatSigned(v, 'kg')],
    ['Best set', 'bestReps', (v) => `${v} reps`],
  ],
  time: [
    ['Longest hold', 'longestTime', formatSeconds],
    ['Most in a day', 'totalTime', formatSeconds],
  ],
};

// "Heaviest 45 kg · 13 sessions": the first record and how often, in one line.
export function bestLine(exercise, history) {
  const [label, field, format] = RECORDS[typeOf(exercise)][0];
  const best = history.reduce((a, b) => (b[field] > a[field] ? b : a));
  return `${label} ${format(best[field])} · ${history.length} ${history.length === 1 ? 'session' : 'sessions'}`;
}

// Your progress on one exercise: what to do next time, records, a chart and
// every session. The exercise's Progress page; nothing if it was never done.
export default function ExerciseProgress({ exercise }) {
  const { workouts, settings } = useData();
  const type = typeOf(exercise);
  const metrics = METRICS[type];
  const [metricId, setMetricId] = useState(metrics[0].id);
  const history = exerciseHistory(workouts, exercise.id);
  if (!history.length) return null;

  const next = suggestNext(recentSessions(workouts, exercise.id), type, settingsFor(settings, exercise));
  const metric = metrics.find((m) => m.id === metricId) || metrics[0];
  const best = (field) => history.reduce((a, b) => (b[field] > a[field] ? b : a));

  return (
    <section className="exercise-progress">
      <Suggestion suggestion={next} title={`Next time: ${formatSetList(next.sets, type)}`} />

      <div className="records">
        {RECORDS[type].map(([label, field, format]) => (
          <div key={label} className="record">
            <span className="record-label">{label}</span>
            <span className="record-value">{format(best(field)[field])}</span>
            <span className="muted small">{formatDate(best(field).date)}</span>
          </div>
        ))}
      </div>

      <section className="card">
        <ChipGroup label="Chart" options={metrics.map((m) => ({ value: m.id, label: m.label }))} value={metric.id} onChange={setMetricId} />
        <p className="muted small">{metric.help}</p>
        <LineChart
          key={metric.id}
          unit={metric.unit}
          points={history.map((h) => ({ date: h.date, value: Math.round(h[metric.id] * 10) / 10 }))}
        />
      </section>

      <FoldCard id="exerciseSessions" title="Sessions" count={history.length}>
        {[...history].reverse().map((h) => (
          <div key={h.workoutId} className="session-row">
            <span className="muted">{formatDate(h.date)}</span>
            <span>{formatSetList(h.sets, type)}</span>
          </div>
        ))}
      </FoldCard>
    </section>
  );
}
