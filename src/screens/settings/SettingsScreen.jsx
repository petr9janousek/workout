import ChipGroup from '../../components/ui/ChipGroup.jsx';
import CardTitle from '../../components/ui/CardTitle.jsx';
import BackupSettings from './BackupSettings.jsx';
import { APP_VERSION } from '../../version.js';
import BackButton from '../../components/ui/BackButton.jsx';
import { openTab } from '../../hooks/useRoute.js';
import { useData } from '../../data/DataProvider.jsx';
import { PROGRESSION_MODES } from '../../model/progression.js';
import { WEIGHT_STEPS, REST_OPTIONS, restTarget } from '../../model/settings.js';
import { formatClock } from '../../model/format.js';


// Settings, opened from the bottom of Home.
// Address: #/home/settings
export default function SettingsScreen() {
  const { settings, unit, actions } = useData();

  const set = (key) => (value) => actions.setSetting(key, value);
  const mode = PROGRESSION_MODES.find((m) => m.id === settings.progression);

  return (
    <div>
      <BackButton label="Home" fallback={['home']} />
      <h1>Settings</h1>

      <section className="card">
        <CardTitle
          title="About you"
          hint={
            <>
              Changes the body drawing, which ready-made plans are recommended for you, and the automatic rest time.
              Everything else works the same: research finds women and men gain muscle and strength at similar rates.
            </>
          }
        />
        <ChipGroup
          label="Body"
          options={[{ value: 'female', label: 'Woman' }, { value: 'male', label: 'Man' }]}
          value={settings.body}
          onChange={set('body')}
        />
      </section>

      <section className="card">
        <CardTitle
          title="Body weight"
          hint={
            <>
              A card in Progress where you note your weight now and then and see it as a line.
            </>
          }
        />
        <ChipGroup
          label="Body weight"
          options={[{ value: true, label: 'Track in Progress' }, { value: false, label: 'Off' }]}
          value={settings.trackBodyWeight}
          onChange={set('trackBodyWeight')}
        />
      </section>

      <section className="card">
        <CardTitle
          title="Screen during a workout"
          hint={
            <>
              Keeps the phone from locking while a workout is open, so the timers and your sets stay in view. The phone
              goes back to normal when you finish.
            </>
          }
        />
        <ChipGroup
          label="Screen during a workout"
          options={[{ value: true, label: 'Keep it on' }, { value: false, label: 'Normal' }]}
          value={settings.keepAwake}
          onChange={set('keepAwake')}
        />
      </section>

      <section className="card">
        <CardTitle
          title="Weight unit"
          hint={
            <>
              Only changes the label. Numbers you've logged are not converted.
            </>
          }
        />
        <ChipGroup label="Weight unit" options={['kg', 'lb']} value={unit} onChange={set('unit')} />
      </section>

      <section className="card">
        <CardTitle
          title="RPE (how hard a set felt)"
          hint={
            <>
              Rate each set from 1 to 10: 10 = couldn't do another rep, 9 = one left in the tank, 8 = two left.
              Optional. When filled in, it makes the "try heavier" suggestions smarter.
            </>
          }
        />
        <ChipGroup
          label="RPE column"
          options={[{ value: true, label: 'Show RPE column' }, { value: false, label: 'Hide' }]}
          value={settings.trackRpe}
          onChange={set('trackRpe')}
        />
      </section>

      <section className="card">
        <CardTitle
          title="Progression style"
          hint={
            <>
              {mode?.help}{' '}In every style: after a set at RPE 9.5+ it suggests repeating, and if your reps drop twice in a row, or stop
              improving for 4 sessions, it suggests going a step lighter.
            </>
          }
        />
        <ChipGroup
          label="Progression style"
          options={PROGRESSION_MODES.map((m) => ({ value: m.id, label: m.label }))}
          value={settings.progression}
          onChange={set('progression')}
        />
      </section>

      <section className="card">
        <CardTitle
          title="Weekly goal"
          hint={
            <>
              How many days a week you aim to train. Streaks count weeks that reach it, so rest days never break them.
              "From my plan" uses the number of days in your active plan (or 2 without a plan).
            </>
          }
        />
        <ChipGroup
          label="Training days a week"
          options={[{ value: null, label: 'From my plan' }, ...[2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} days` }))]}
          value={settings.weeklyGoal}
          onChange={set('weeklyGoal')}
        />
      </section>

      <section className="card">
        <CardTitle
          title="Suggested weight increase"
          hint={
            <>
              How much heavier the app suggests when you're ready to go up. Auto suits the weight:{' '}
              {unit === 'lb' ? '+2.5 lb under 25 lb, +5 lb under 150 lb, then +10 lb' : '+1 kg under 10 kg, +2 kg under 25 kg, +2.5 kg under 80 kg, then +5 kg'}
              . An exercise can have its own jump: Exercises, open it, Edit.
            </>
          }
        />
        <ChipGroup
          label="Weight increase"
          options={WEIGHT_STEPS.map((step) => ({ value: step, label: step === 'auto' ? 'Auto' : `+${step} ${unit}` }))}
          value={settings.weightStep}
          onChange={set('weightStep')}
        />
      </section>

      <section className="card">
        <CardTitle
          title="Rest between sets"
          hint={
            <>
              The rest timer turns green when it's time for the next set. Auto is 1:30 for women and 2:00 for men: women
              recover faster between sets. For big lifts like squats, resting longer is fine.
            </>
          }
        />
        <ChipGroup
          label="Rest between sets"
          options={REST_OPTIONS.map((sec) => ({ value: sec, label: sec == null ? `Auto (${formatClock(restTarget({ ...settings, restSeconds: null }) * 1000)})` : formatClock(sec * 1000) }))}
          value={settings.restSeconds}
          onChange={set('restSeconds')}
        />
      </section>

      <BackupSettings />

      <TestingTools />

      <p className="muted small center">
        Workout v{APP_VERSION} · your workouts stay on this phone
        <br />
        The app counts visits anonymously (no cookies, no workout data).
      </p>
    </div>
  );
}

// Tools for trying the app out. Both replace everything on this phone, so
// they're tucked away and ask first.
function TestingTools() {
  const { actions } = useData();

  async function sample() {
    if (!confirm('Replace everything on this phone with sample data (8 weeks of made-up workouts)? Your own workouts and plans will be deleted. Save a backup first if you want to keep them.')) return;
    await actions.loadSampleData();
    openTab('home');
  }

  async function reset() {
    if (!confirm('Delete ALL workouts, plans and settings on this phone and start like a new install? This cannot be undone.')) return;
    await actions.resetApp();
    openTab('home');
  }

  return (
    <details className="card testing">
      <summary>For testing</summary>
      <p className="muted small">Both replace everything on this phone. Save a backup first if you want to keep your data.</p>
      <div className="actions">
        <button className="btn btn-secondary btn-wide" onClick={sample}>Fill with sample data</button>
        <button className="btn btn-danger-ghost btn-wide" onClick={reset}>Reset the app</button>
      </div>
    </details>
  );
}
