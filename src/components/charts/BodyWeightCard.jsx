import { useState } from 'react';
import LineChart from './LineChart.jsx';
import { NumberInput } from '../ui/NumberInput.jsx';
import Icon from '../ui/Icon.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { logBodyWeight, bodyWeightChange } from '../../model/bodyWeight.js';
import { dayKey } from '../../model/calendar.js';
import { formatDate, formatNumber, formatSigned } from '../../model/format.js';

// Body weight in Progress (can be turned off in Settings): note today's
// weight, see the trend. One entry per day; saving again replaces today's.
export default function BodyWeightCard() {
  const { settings, unit, actions } = useData();
  const list = settings.bodyWeights || [];
  const today = dayKey(new Date());
  const todays = list.find((e) => e.date === today);
  const [value, setValue] = useState(todays?.weight ?? null);
  const change = bodyWeightChange(list, 30);
  const asDate = (key) => `${key}T12:00`; // a calendar day, read as midday so time zones can't shift it

  const save = () => value != null && actions.setSetting('bodyWeights', logBodyWeight(list, today, value));
  const remove = (date) => actions.setSetting('bodyWeights', logBodyWeight(list, date, null));
  const unsaved = value != null && value !== todays?.weight;

  return (
    <section className="card body-weight">
      <CardTitle
        title="Body weight"
        hint="Weigh at the same time of day, e.g. in the morning. It goes up and down by a kilo or two from day to day, so watch the line, not single days. One entry per day; saving again replaces it. You can turn this card off in Settings."
      />
      <div className="body-weight-row">
        <NumberInput value={value} onChange={setValue} decimal placeholder={list.length ? formatNumber(list.at(-1).weight) : unit} label="Today's body weight" />
        <span className="muted">{unit}</span>
        <button className="btn btn-primary" onClick={save} disabled={!unsaved}>
          {todays && !unsaved ? 'Saved ✓' : todays ? 'Update today' : 'Save today'}
        </button>
      </div>

      {list.length > 0 && <LineChart unit={unit} points={list.map((e) => ({ date: asDate(e.date), value: e.weight }))} />}
      {change != null && <p className="small">Last 30 days: {change === 0 ? 'no change' : formatSigned(change, unit)}</p>}

      {list.length > 0 && (
        <ul className="weight-list">
          {list.slice(-5).reverse().map((e) => (
            <li key={e.date}>
              <span>{formatDate(asDate(e.date))}</span>
              <strong>{formatNumber(e.weight)} {unit}</strong>
              <button className="icon-btn subtle small" onClick={() => remove(e.date)} aria-label={`Remove ${formatDate(asDate(e.date))}`}>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
