import FitHeading from '../../components/ui/FitHeading.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import { DayCountGrid } from '../plans/NewPlan.jsx';
import { useData } from '../../data/DataProvider.jsx';

// First run: shown on the start screen until there's a workout or a plan,
// or it's skipped. Two questions here, then the plan picker (with the plans
// for your body first) does the rest.
export default function Welcome() {
  const { settings, actions } = useData();

  return (
    <div className="start welcome">
      <FitHeading>Let's get started</FitHeading>
      <p className="lead">Two quick questions and a plan, and you're ready to train. Everything stays on this phone.</p>

      <section className="card welcome-step">
        <h3><span className="day-chip-num">1</span> Who's training?</h3>
        <ChipGroup
          label="Who's training"
          options={[{ value: 'female', label: 'Woman' }, { value: 'male', label: 'Man' }]}
          value={settings.body}
          onChange={(body) => actions.setSetting('body', body)}
        />
        <p className="muted small">For the body drawing, recommended plans and rest times. You can change it in Settings.</p>
      </section>

      <section className="card welcome-step">
        <h3><span className="day-chip-num">2</span> How many days a week?</h3>
        <DayCountGrid />
        <p className="muted small">Then pick a ready-made plan. You can change every exercise later.</p>
      </section>

      <button className="btn-text welcome-skip" onClick={() => actions.setSetting('setupDone', true)}>
        Skip, I'll just log workouts
      </button>
    </div>
  );
}
