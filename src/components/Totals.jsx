import { workoutTotals, formatNumber, formatSeconds } from '../utils.js';

// A row of totals for a workout: sets, weight lifted, reps, time.
// `live` shows sets as "done / planned" for a workout in progress.
export default function Totals({ workout, unit, live = false }) {
  const t = workoutTotals(workout);
  const items = [
    { label: 'Sets', value: live ? `${t.sets}/${t.planned}` : t.sets },
    { label: `${unit} lifted`, value: formatNumber(t.volume), show: t.volume > 0 || live },
    { label: 'Reps', value: t.reps, show: t.reps > 0 },
    { label: 'Time held', value: formatSeconds(t.seconds), show: t.seconds > 0 },
  ].filter((i) => i.show !== false);

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
