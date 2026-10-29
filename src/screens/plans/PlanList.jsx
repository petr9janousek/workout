import { useRef, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go, openTab } from '../../hooks/useRoute.js';
import { finishedWorkouts } from '../../model/workouts.js';
import { isActivity } from '../../model/activities.js';
import { exerciseName } from '../../model/exercises.js';
import { formatDate } from '../../model/format.js';
import { readPlanFile } from '../../model/planFile.js';

// The Plans tab: your plans (the active one marked), three ways to get a new
// one (ready-made, your own, a plan file someone sent you), and recent
// workouts to repeat.
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
      go('plans', plan.id);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1>Plans</h1>

      <h2 className="section-title">My plans</h2>
      {plans.length === 0 && <p className="empty">No plans yet. Pick a ready-made one or make your own.</p>}
      {plans.map((plan) => (
        <button key={plan.id} className="card card-button row-between" onClick={() => go('plans', plan.id)}>
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
        <button className="btn btn-primary btn-wide" onClick={() => go('plans', 'library')}>
          <Icon name="list" size={18} /> Ready-made plans
        </button>
        <button className="btn btn-secondary btn-wide" onClick={() => go('plans', 'new')}>
          <Icon name="plus" size={18} /> Make my own
        </button>
        <button className="btn-text small-link import-link" onClick={() => fileInput.current.click()}>
          Import a plan file
        </button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json,text/plain,.txt" hidden onChange={importFile} />
      {message && <p className="warning small">{message}</p>}

      <RecentWorkouts />
    </div>
  );
}

// Your last few gym workouts, to do again as they were (no plan needed).
function RecentWorkouts() {
  const { workouts, exercisesById, activeWorkout, actions } = useData();
  const recent = finishedWorkouts(workouts).filter((w) => !isActivity(w)).slice(0, 3);
  if (!recent.length) return null;

  function repeat(workout) {
    if (activeWorkout) {
      alert('Finish or discard the workout in progress first.');
      return;
    }
    actions.startWorkout(workout);
    openTab('home');
  }

  return (
    <section className="recent">
      <h2 className="section-title">Repeat a recent workout</h2>
      {recent.map((w) => (
        <button key={w.id} className="card card-button" onClick={() => repeat(w)}>
          <span className="row-between">
            <strong>{w.name || 'Workout'}</strong>
            <span className="muted small">{formatDate(w.startedAt)}</span>
          </span>
          <span className="muted small">{w.entries.map((e) => exerciseName(exercisesById.get(e.exerciseId))).join(', ')}</span>
        </button>
      ))}
    </section>
  );
}
