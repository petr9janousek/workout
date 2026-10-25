import BackButton from '../../components/ui/BackButton.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';

// All your plans. Tap one to see it; the active one is marked.
export default function PlanList() {
  const { plans, settings } = useData();

  return (
    <div>
      <BackButton label="Workout" fallback={['workout']} />
      <h1>Plans</h1>

      {plans.length === 0 && <p className="empty">No plans yet. Make one to have your next workout ready on the start screen.</p>}

      {plans.map((plan) => (
        <button key={plan.id} className="card card-button row-between" onClick={() => go('workout', 'plans', plan.id)}>
          <span>
            <strong>{plan.name}</strong>
            {plan.id === settings.activePlanId && <span className="badge">Active</span>}
            <span className="muted block small">
              {plan.days.length} {plan.days.length === 1 ? 'day' : 'days'}: {plan.days.map((d) => d.name).join(', ')}
            </span>
          </span>
          <Icon name="chevron" size={18} />
        </button>
      ))}

      <button className="btn btn-primary btn-wide" onClick={() => go('workout', 'plans', 'new')}>
        <Icon name="plus" size={18} /> New plan
      </button>
    </div>
  );
}
