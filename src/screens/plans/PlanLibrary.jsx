import { useMemo, useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import DaysPicker from '../../components/ui/DaysPicker.jsx';
import { HintButton } from '../../components/ui/CardTitle.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { switchTab } from '../../hooks/useRoute.js';
import { templatesForDays, isRecommended } from '../../model/planTemplates.js';
import { withExtras } from '../../model/extras.js';
import { minutesLabel, templateDays } from '../../model/plans.js';
import { restTarget } from '../../model/settings.js';
import { guessMuscles } from '../../model/muscles.js';

// The ready-made plans. Choosing one copies it into your plans (then it's
// yours to change); the others stay here, not in your list.
export default function PlanLibrary({ days }) {
  const { settings, actions } = useData();
  const templates = templatesForDays(days, settings.body);
  const extras = settings.planExtras;
  const [help, setHelp] = useState(false);

  function use(template) {
    const plan = actions.newPlanFromTemplate(template, { extras });
    switchTab('plans', plan.id); // replaces the library in the back history
  }

  return (
    <div>
      <BackButton label="Plans" fallback={['plans']} />
      <h1>Ready-made plans</h1>
      <p className="lead">
        Each gives every main muscle about 10 hard sets a week. More days just means shorter sessions. You can change
        everything afterwards.
      </p>

      <DaysPicker from={2} to={6} any value={days} onChange={(n) => switchTab(...['plans', 'library', ...(n ? [n] : [])])} />

      <div className="library-options">
        <div className="for-row">
          <span className="small muted">Healthy extras</span>
          <HintButton open={help} onToggle={() => setHelp(!help)} about="healthy extras" />
          <ChipGroup
            label="Healthy extras"
            options={[{ value: true, label: 'Add' }, { value: false, label: 'No' }]}
            value={extras}
            onChange={(v) => actions.setSetting('planExtras', v)}
          />
        </div>
        {help && (
          <p className="hint-text">
            A short finisher each day for core, grip, upper back and balance, the things muscle plans usually skip.
            About 5 minutes, and you can skip them during a workout.
          </p>
        )}
      </div>

      {templates.map((t) => (
        <TemplateCard key={t.id} template={extras ? withExtras(t) : t} recommended={isRecommended(t, settings.body)} onUse={() => use(t)} />
      ))}
    </div>
  );
}

// One ready-made plan: what it's for, its days, session length, and the
// muscles it trains in a week.
function TemplateCard({ template, recommended, onUse }) {
  const { settings } = useData();
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
  const count = template.days.length;

  return (
    <section className={`card template-card${recommended ? ' recommended' : ''}`}>
      <div className="template-head">
        <div>
          {recommended && <span className="badge">Recommended for you</span>}
          <h2 className="template-name">{template.name}</h2>
          <span className="muted small">
            {count} days a week · {minutesLabel(templateDays(template), restTarget(settings))}
          </span>
          <span className="muted small block">{template.level}</span>
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
