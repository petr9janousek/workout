import FitHeading from '../../components/ui/FitHeading.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import { openTab } from '../../hooks/useRoute.js';
import { useData } from '../../data/DataProvider.jsx';

// First run: one question, then you're in. A plan is offered, not required.
// Shown on Home until there's a workout or a plan, or it's dismissed.
export default function Welcome() {
  const { settings, actions } = useData();
  const done = () => actions.setSetting('setupDone', true);

  return (
    <div className="welcome">
      <FitHeading>Welcome</FitHeading>
      <p className="lead">Log your workouts and it suggests a bit more each time. No account, and everything stays on this phone.</p>

      <section className="card welcome-step">
        <h3>Who's training?</h3>
        <ChipGroup
          label="Who's training"
          options={[{ value: 'female', label: 'Woman' }, { value: 'male', label: 'Man' }]}
          value={settings.body}
          onChange={(body) => actions.setSetting('body', body)}
        />
        <p className="muted small">For the body drawing, recommended plans and rest times. You can change it in Settings.</p>
      </section>

      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={done}>Start</button>
        <button
          className="btn btn-secondary btn-wide"
          onClick={() => {
            done();
            openTab('plans', 'library');
          }}
        >
          Pick a ready-made plan first
        </button>
      </div>
    </div>
  );
}
