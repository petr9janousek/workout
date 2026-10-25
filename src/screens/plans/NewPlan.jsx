import { useMemo, useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, switchTab } from '../../hooks/useRoute.js';
import { templatesForDays, defaultDayNames, DAY_NAME_IDEAS, isRecommended } from '../../model/planTemplates.js';
import { guessMuscles } from '../../model/muscles.js';

const DAY_OPTIONS = [
  { days: 2, note: 'The minimum for health' },
  { days: 3, note: 'Most popular to start' },
  { days: 4, note: 'Each muscle twice a week' },
  { days: 5, note: 'For a bigger training habit' },
  { days: 6, note: 'A lot of training' },
];

// Making a plan, in three steps with their own addresses (so back works):
//   1. how many days a week   2. pick a ready-made split   (or) 3. name the days yourself
export default function NewPlan({ days, own }) {
  if (!days) return <ChooseDays />;
  if (own) return <OwnPlan days={days} />;
  return <ChooseSplit days={days} />;
}

function ChooseDays() {
  return (
    <div>
      <BackButton label="Plans" fallback={['workout', 'plans']} />
      <h1>New plan</h1>
      <p className="lead">How many days a week do you want to train?</p>
      <div className="day-count-grid">
        {DAY_OPTIONS.map((o) => (
          <button key={o.days} className="day-count" onClick={() => go('workout', 'plans', 'new', o.days)}>
            <span className="day-count-num">{o.days}</span>
            <span className="day-count-label">days</span>
            <span className="muted small">{o.note}</span>
          </button>
        ))}
      </div>
      <p className="muted small">
        The WHO recommends strength training for all major muscles at least 2 days a week. More days lets you spread the
        work out, but the best plan is the one you keep doing.
      </p>
    </div>
  );
}

function ChooseSplit({ days }) {
  const { settings, actions } = useData();
  const templates = templatesForDays(days, settings.body);

  function use(template) {
    const plan = actions.newPlanFromTemplate(template);
    // Replace the wizard steps in the back history with the new plan.
    switchTab('workout', 'plans', plan.id);
  }

  return (
    <div>
      <BackButton label="Days" fallback={['workout', 'plans', 'new']} />
      <h1>{days} days a week</h1>
      <p className="lead">Pick a split to start from. You can change every exercise afterwards.</p>

      <div className="for-row">
        <span className="small muted">Recommend plans for</span>
        <ChipGroup
          label="Recommend plans for"
          options={[{ value: 'female', label: 'Woman' }, { value: 'male', label: 'Man' }]}
          value={settings.body}
          onChange={(body) => actions.setSetting('body', body)}
        />
      </div>

      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} recommended={isRecommended(t, settings.body)} onUse={() => use(t)} />
      ))}

      <button className="card card-button own-plan" onClick={() => go('workout', 'plans', 'new', days, 'own')}>
        <strong>Name the days myself</strong>
        <span className="muted small">Start with {days} empty days and choose every exercise.</span>
      </button>
    </div>
  );
}

// One ready-made split: what it's for, its days, and the muscles it trains in a week.
function TemplateCard({ template, recommended, onUse }) {
  // Weekly sets per muscle, guessed from the exercise names (nothing is created yet).
  const weekly = useMemo(() => {
    const load = {};
    for (const [, items] of template.days) {
      for (const [name, sets] of items) {
        for (const [m, w] of Object.entries(guessMuscles(name))) load[m] = (load[m] || 0) + sets * w;
      }
    }
    return load;
  }, [template]);

  return (
    <section className={`card template-card${recommended ? ' recommended' : ''}`}>
      <div className="template-head">
        <div>
          {recommended && <span className="badge">Recommended for you</span>}
          <h2 className="template-name">{template.name}</h2>
          <span className="muted small">{template.level}</span>
        </div>
        <div className="template-map">
          <BodyMap sets={weekly} scale="week" compact />
        </div>
      </div>
      <p className="small">{template.about}</p>
      <ol className="template-days">
        {template.days.map(([name, items], i) => (
          <li key={i}>
            <span className="day-chip-num">{i + 1}</span>
            {name}
            <span className="muted small"> · {items.length} exercises</span>
          </li>
        ))}
      </ol>
      <button className="btn btn-primary btn-wide" onClick={onUse}>Use {template.name}</button>
    </section>
  );
}

// Your own plan: a name and a name for each day.
function OwnPlan({ days }) {
  const { actions } = useData();
  const [name, setName] = useState('My plan');
  const [dayNames, setDayNames] = useState(() => defaultDayNames(days));
  const [focused, setFocused] = useState(0);

  const setDayName = (i, value) => setDayNames(dayNames.map((n, j) => (j === i ? value : n)));
  const ready = name.trim() && dayNames.every((n) => n.trim());

  function create() {
    const plan = actions.newPlan(name.trim(), dayNames.map((n) => n.trim()));
    switchTab('workout', 'plans', plan.id);
  }

  return (
    <div>
      <BackButton label="Splits" fallback={['workout', 'plans', 'new', days]} />
      <h1>Your own plan</h1>

      <label className="field">
        <span className="small">Plan name</span>
        <input className="search" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <p className="lead spaced">Name your {days} training days, in the order you'll do them.</p>
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
