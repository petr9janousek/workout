import { useData } from '../../data/DataProvider.jsx';
import { workoutTotals } from '../../model/workouts.js';
import { formatTotal, formatSeconds } from '../../model/format.js';

// A row of totals for a workout: sets, weight lifted, reps, time held.
// live: for a workout in progress, show sets as "done/planned".
export default function Totals({ workout, live = false }) {
  const { unit } = useData();
  const t = workoutTotals(workout);
  const items = [
    { label: 'Sets', value: live ? `${t.sets}/${t.planned}` : t.sets, show: true },
    { label: `${unit} lifted`, value: formatTotal(t.volume), show: t.volume > 0 || live },
    { label: 'Reps', value: t.reps, show: t.reps > 0 },
    { label: 'Time held', value: formatSeconds(t.seconds), show: t.seconds > 0 },
  ].filter((i) => i.show);

  return (
    <div className="totals">
      {items.map((i) => (
        <div key={i.label} className="total">
          <span className="total-value">{i.value}</span>
          <span className="total-label">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

// "9 sets · 3,420 kg": the short version for lists.
export function TotalsLine({ workout }) {
  const { unit } = useData();
  const t = workoutTotals(workout);
  const parts = [`${t.sets} sets`];
  if (t.volume > 0) parts.push(`${formatTotal(t.volume)} ${unit}`);
  return <span className="summary-line">{parts.join(' · ')}</span>;
}
