import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import DaysPicker from '../../components/ui/DaysPicker.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { switchTab } from '../../hooks/useRoute.js';
import { defaultDayNames, DAY_NAME_IDEAS } from '../../model/planTemplates.js';

// A plan of your own: a name, how many days, and a name for each day.
// The exercises come next, day by day, in the plan.
export default function NewPlan() {
  const { actions } = useData();
  const [name, setName] = useState('My plan');
  const [dayNames, setDayNames] = useState(() => defaultDayNames(3));
  const [focused, setFocused] = useState(0);

  const setCount = (count) =>
    setDayNames((current) => [...current.slice(0, count), ...defaultDayNames(count).slice(current.length)].slice(0, count));
  const setDayName = (i, value) => setDayNames(dayNames.map((n, j) => (j === i ? value : n)));
  const ready = name.trim() && dayNames.every((n) => n.trim());

  function create() {
    const plan = actions.newPlan(name.trim(), dayNames.map((n) => n.trim()));
    switchTab('workout', 'plans', plan.id); // replaces this page in the back history
  }

  return (
    <div>
      <BackButton label="Plans" fallback={['workout', 'plans']} />
      <h1>My own plan</h1>

      <label className="field">
        <span className="small">Plan name</span>
        <input className="search" value={name} onChange={(e) => setName(e.target.value)} aria-label="Plan name" />
      </label>

      <p className="lead spaced">How many different days does it have?</p>
      <DaysPicker from={1} to={6} value={dayNames.length} onChange={setCount} label="Number of days" />
      <p className="muted small">
        You go through the days in order, whenever you train: there are no fixed weekdays.
      </p>

      <p className="lead spaced">Name the days, in the order you'll do them.</p>
      {dayNames.map((n, i) => (
        <label key={i} className="field day-name-field">
          <span className="plan-day-num">{i + 1}</span>
          <input className="search" value={n} onFocus={() => setFocused(i)} onChange={(e) => setDayName(i, e.target.value)} aria-label={`Day ${i + 1} name`} />
        </label>
      ))}

      <p className="muted small">Ideas for day {focused + 1}:</p>
      <div className="chips">
        {DAY_NAME_IDEAS.map((idea) => (
          <button key={idea} className="chip" onClick={() => setDayName(focused, idea)}>
            {idea}
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-wide create-plan" disabled={!ready} onClick={create}>
        Create plan
      </button>
    </div>
  );
}
