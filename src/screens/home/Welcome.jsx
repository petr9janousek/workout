import { useState } from 'react';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { openTab } from '../../hooks/useRoute.js';
import { useData } from '../../data/DataProvider.jsx';

// First run, two short steps: who's training, then a name (optional, for
// training together). A plan is offered, not required. Shown on Home until
// there's a workout or a plan, or it's finished.
export default function Welcome() {
  const { settings, actions } = useData();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(settings.name);

  function done(thenPlans = false) {
    if (name.trim()) actions.setSetting('name', name.trim());
    actions.setSetting('setupDone', true);
    if (thenPlans) openTab('plans', 'library');
  }

  if (step === 1) {
    return (
      <div className="welcome">
        <img className="welcome-icon" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="72" height="72" />
        <h1>Welcome</h1>
        <p className="lead">Log your workouts and it suggests a bit more each time. No account, and everything stays on this phone.</p>

        <section className="card welcome-step">
          <h3>Who's training?</h3>
          <ChipGroup
            label="Who's training"
            options={[{ value: 'female', label: 'Woman' }, { value: 'male', label: 'Man' }]}
            value={settings.body}
            onChange={(body) => actions.setSetting('body', body)}
          />
          <p className="muted small">For the body drawing, recommended plans and rest times.</p>
        </section>

        <button className="btn btn-primary btn-wide" onClick={() => setStep(2)}>Next</button>
        <StepDots step={1} />
      </div>
    );
  }

  return (
    <div className="welcome">
      <button className="back" onClick={() => setStep(1)}>
        <Icon name="back" size={18} /> Back
      </button>
      <h1>Your name</h1>
      <p className="lead">For training together: when someone logs your sets on their phone, this tells whose are whose.</p>

      <section className="card welcome-step">
        <input
          className="search"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name or nickname"
          aria-label="Your name"
          autoComplete="given-name"
        />
        <p className="muted small">Optional. You can change it in Settings.</p>
      </section>

      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={() => done()}>{name.trim() ? 'Start' : 'Skip and start'}</button>
        <button className="btn btn-secondary btn-wide" onClick={() => done(true)}>Pick a ready-made plan first</button>
      </div>
      <StepDots step={2} />
    </div>
  );
}

function StepDots({ step }) {
  return (
    <div className="step-dots" aria-label={`Step ${step} of 2`}>
      <span className={step === 1 ? 'on' : ''} />
      <span className={step === 2 ? 'on' : ''} />
    </div>
  );
}
