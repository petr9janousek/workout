import { useRef, useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { readPlanFile } from '../../model/planFile.js';

// Your plans (the active one marked), and three ways to get a new one:
// the ready-made library, one of your own, or a plan file someone sent you.
export default function PlanList() {
  const { plans, settings, actions } = useData();
  const fileInput = useRef(null);
  const [message, setMessage] = useState('');

  async function importFile(event) {
    const file = event.target.files[0];
    event.target.value = ''; // so choosing the same file again still works
    if (!file) return;
    try {
      const filePlan = readPlanFile(await file.text());
      const plan = actions.importPlan(filePlan);
      go('workout', 'plans', plan.id);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <BackButton label="Workout" fallback={['workout']} />
      <h1>Plans</h1>

      <h2 className="section-title">My plans</h2>
      {plans.length === 0 && <p className="empty">No plans yet. Pick a ready-made one or make your own.</p>}
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

      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={() => go('workout', 'plans', 'library')}>
          <Icon name="list" size={18} /> Ready-made plans
        </button>
        <button className="btn btn-secondary btn-wide" onClick={() => go('workout', 'plans', 'new')}>
          <Icon name="plus" size={18} /> Make my own
        </button>
        <button className="btn-text small-link import-link" onClick={() => fileInput.current.click()}>
          Import a plan file
        </button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json,text/plain,.txt" hidden onChange={importFile} />
      {message && <p className="warning small">{message}</p>}
    </div>
  );
}
