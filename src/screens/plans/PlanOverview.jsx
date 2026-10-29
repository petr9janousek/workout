import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, switchTab } from '../../hooks/useRoute.js';
import { dayMuscleSets, planMuscleSets, totalSets, createDay, nextDayIndex, sessionMinutes } from '../../model/plans.js';
import { restTarget } from '../../model/settings.js';
import { planToFile } from '../../model/planFile.js';
import { shareFile } from '../../data/backup.js';
import { MUSCLES } from '../../model/muscles.js';
import { formatSets, keepLastWord } from '../../model/format.js';

// Major muscles that should get some work every week (WHO: all major muscle groups).
const MAJOR = ['chest', 'lats', 'shoulders', 'quads', 'glutes', 'hamstrings'];

// One plan: its days in order, the muscles it trains in a week, and settings.
export default function PlanOverview({ planId }) {
  const { plans, workouts, exercisesById, settings, actions } = useData();
  const plan = plans.find((p) => p.id === planId);
  const [renaming, setRenaming] = useState(false);

  if (!plan) {
    return (
      <div>
        <BackButton label="Plans" to={['plans']} />
        <p className="empty">This plan doesn't exist any more.</p>
      </div>
    );
  }

  const active = settings.activePlanId === plan.id;
  const weekly = planMuscleSets(plan, exercisesById);
  const missing = MAJOR.filter((m) => (weekly[m] || 0) < 3);
  const next = nextDayIndex(plan, workouts);

  function addDay() {
    const day = createDay(`Day ${plan.days.length + 1}`);
    actions.savePlan({ ...plan, days: [...plan.days, day] });
    go('plans', plan.id, day.id);
  }

  // Send the plan to someone (they import it in Plans). No workouts or weights.
  function share() {
    const slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan';
    shareFile(planToFile(plan, exercisesById), `workout-plan-${slug}`, plan.name);
  }

  function remove() {
    if (!confirm(`Delete the plan “${plan.name}”? Your finished workouts stay in History.`)) return;
    actions.deletePlan(plan.id);
    switchTab('plans');
  }

  return (
    <div>
      <BackButton label="Plans" to={['plans']} />

      {renaming ? (
        <input
          className="search plan-rename"
          autoFocus
          defaultValue={plan.name}
          aria-label="Plan name"
          onBlur={(e) => {
            if (e.target.value.trim()) actions.savePlan({ ...plan, name: e.target.value.trim() });
            setRenaming(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        />
      ) : (
        <h1 className="plan-title" onClick={() => setRenaming(true)}>
          {plan.name}
        </h1>
      )}

      <div className="plan-actions">
        {active ? (
          <span className="badge big">Active plan</span>
        ) : (
          <button className="btn btn-primary" onClick={() => actions.setSetting('activePlanId', plan.id)}>
            Use this plan
          </button>
        )}
        <button className="btn-text small-link" onClick={() => setRenaming(true)}>Rename</button>
      </div>

      <h2 className="section-title">Days, in order</h2>
      <ol className="plan-days">
        {plan.days.map((day, i) => (
          <li key={day.id}>
            <button className="card card-button plan-day" onClick={() => go('plans', plan.id, day.id)}>
              <span className="plan-day-num">{i + 1}</span>
              <span className="plan-day-text">
                <span className="day-title small-title">
                  {keepLastWord(day.name)}
                  {active && i === next && <span className="badge">Next</span>}
                </span>
                <span className="muted small">
                  {day.items.length
                    ? `${day.items.length}\u00a0exercises · ${totalSets(day)}\u00a0sets · ~${sessionMinutes(day.items, restTarget(settings))}\u00a0min`
                    : 'Not planned yet'}
                </span>
              </span>
              <span className="plan-day-map">
                <BodyMap sets={dayMuscleSets(day, exercisesById)} compact />
              </span>
            </button>
          </li>
        ))}
      </ol>
      <button className="btn btn-ghost" onClick={addDay}>
        <Icon name="plus" size={16} /> Add a day
      </button>

      <MuscleCard
        id="plan-week"
        title="Planned sets per week"
        sets={weekly}
        scale="week"
        note="Every day of the plan done once. Research suggests roughly 10–20 sets per muscle a week for growth; fewer still keeps you strong and healthy."
      />
      {missing.length > 0 && plan.days.some((d) => d.items.length) && (
        <p className="warning small">
          Not much for: {missing.map((m) => MUSCLES.find((x) => x.id === m).label.toLowerCase()).join(', ')}
          {' '}({missing.map((m) => formatSets(weekly[m] || 0)).join(', ')} sets a week). Consider adding an exercise for them.
        </p>
      )}

      <div className="actions">
        <button className="btn btn-secondary btn-wide" onClick={share}>Share plan</button>
        <p className="muted small">
          Sends the plan as a file (to a partner, a trainee…). They import it in Plans. Your workouts and weights stay
          here.
        </p>
        <button className="btn btn-danger-ghost btn-wide" onClick={remove}>Delete plan</button>
      </div>
    </div>
  );
}
