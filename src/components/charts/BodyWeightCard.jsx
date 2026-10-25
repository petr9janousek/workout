import LineChart from './LineChart.jsx';
import { NumberInput } from '../ui/NumberInput.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { logBodyWeight, bodyWeightChange } from '../../model/bodyWeight.js';
import { dayKey } from '../../model/calendar.js';
import { formatDate, formatNumber, formatSigned } from '../../model/format.js';

// Body weight in Progress (only when turned on in Settings): today's weight
// and a chart. Weigh at the same time of day for comparable numbers.
export default function BodyWeightCard() {
  const { settings, unit, actions } = useData();
  const list = settings.bodyWeights || [];
  const today = dayKey(new Date());
  const todays = list.find((e) => e.date === today);
  const last = list.at(-1);
  const change = bodyWeightChange(list, 30);

  const save = (weight) => actions.setSetting('bodyWeights', logBodyWeight(list, today, weight));

  return (
    <section className="card body-weight">
      <h3>Body weight</h3>
      <div className="body-weight-row">
        <label className="field body-weight-input">
          <span className="small">Today ({unit})</span>
          <NumberInput value={todays?.weight ?? null} onChange={save} decimal placeholder={last ? formatNumber(last.weight) : '–'} label="Today's body weight" />
        </label>
        <p className="muted small">
          {last && last.date !== today && <>Last: {formatNumber(last.weight)} {unit}, {formatDate(`${last.date}T12:00`)}<br /></>}
          {change != null && <>30 days: {change === 0 ? 'no change' : formatSigned(change, unit)}</>}
        </p>
      </div>
      {list.length >= 2 && <LineChart unit={unit} points={list.map((e) => ({ date: `${e.date}T12:00`, value: e.weight }))} />}
      <p className="muted small">
        Weigh at the same time of day, e.g. in the morning. It goes up and down by a kilo or two from day to day,
        so watch the trend, not single days.
      </p>
    </section>
  );
}
