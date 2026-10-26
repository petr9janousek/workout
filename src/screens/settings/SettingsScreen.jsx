import ChipGroup from '../../components/ui/ChipGroup.jsx';
import BackupSettings from './BackupSettings.jsx';
import { APP_VERSION } from '../../version.js';
import Icon from '../../components/ui/Icon.jsx';
import { go } from '../../hooks/useRoute.js';
import { useData } from '../../data/DataProvider.jsx';
import { PROGRESSION_MODES } from '../../model/progression.js';
import { WEIGHT_STEPS, REST_OPTIONS, restTarget } from '../../model/settings.js';
import { formatClock } from '../../model/format.js';


// The Settings tab.
// Address: #/settings
export default function SettingsScreen() {
  const { settings, unit, exercises, actions } = useData();

  const set = (key) => (value) => actions.setSetting(key, value);
  const mode = PROGRESSION_MODES.find((m) => m.id === settings.progression);

  return (
    <div>
      <h1>Settings</h1>

      <section className="card">
        <h3>About you</h3>
        <ChipGroup
          label="Body"
          options={[{ value: 'female', label: 'Woman' }, { value: 'male', label: 'Man' }]}
          value={settings.body}
          onChange={set('body')}
        />
        <p className="muted small">
          Changes the body drawing, which ready-made plans are recommended for you, and the automatic rest time.
          Everything else works the same: research finds women and men gain muscle and strength at similar rates.
        </p>
      </section>

      <section className="card">
        <h3>Body weight</h3>
        <ChipGroup
          label="Body weight"
          options={[{ value: true, label: 'Track in Progress' }, { value: false, label: 'Off' }]}
          value={settings.trackBodyWeight}
          onChange={set('trackBodyWeight')}
        />
        <p className="muted small">Optional. Adds a card to Progress where you can note your weight and see it as a chart.</p>
      </section>

      <section className="card">
        <h3>Screen during a workout</h3>
        <ChipGroup
          label="Screen during a workout"
          options={[{ value: true, label: 'Keep it on' }, { value: false, label: 'Normal' }]}
          value={settings.keepAwake}
          onChange={set('keepAwake')}
        />
        <p className="muted small">
          Keeps the phone from locking while a workout is open, so the timers and your sets stay in view. The phone
          goes back to normal when you finish.
        </p>
      </section>

      <section className="card">
        <h3>Weight unit</h3>
        <ChipGroup label="Weight unit" options={['kg', 'lb']} value={unit} onChange={set('unit')} />
        <p className="muted small">Only changes the label. Numbers you've logged are not converted.</p>
      </section>

      <section className="card">
        <h3>RPE (how hard a set felt)</h3>
        <ChipGroup
          label="RPE column"
          options={[{ value: true, label: 'Show RPE column' }, { value: false, label: 'Hide' }]}
          value={settings.trackRpe}
          onChange={set('trackRpe')}
        />
        <p className="muted small">
          Rate each set from 1 to 10: 10 = couldn't do another rep, 9 = one left in the tank, 8 = two left.
          Optional. When filled in, it makes the "try heavier" suggestions smarter.
        </p>
      </section>

      <section className="card">
        <h3>Progression style</h3>
        <ChipGroup
          label="Progression style"
          options={PROGRESSION_MODES.map((m) => ({ value: m.id, label: m.label }))}
          value={settings.progression}
          onChange={set('progression')}
        />
        <p className="muted small">{mode?.help}</p>
        <p className="muted small">
          In every style: after a set at RPE 9.5+ it suggests repeating, and if your reps drop twice in a row, or stop
          improving for 4 sessions, it suggests going a step lighter.
        </p>
      </section>

      <section className="card">
        <h3>Weekly goal</h3>
        <ChipGroup
          label="Training days a week"
          options={[{ value: null, label: 'From my plan' }, ...[2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} days` }))]}
          value={settings.weeklyGoal}
          onChange={set('weeklyGoal')}
        />
        <p className="muted small">
          How many days a week you aim to train. Streaks count weeks that reach it, so rest days never break them.
          "From my plan" uses the number of days in your active plan (or 2 without a plan).
        </p>
      </section>

      <section className="card">
        <h3>Suggested weight increase</h3>
        <ChipGroup
          label="Weight increase"
          options={WEIGHT_STEPS.map((step) => ({ value: step, label: step === 'auto' ? 'Auto' : `+${step} ${unit}` }))}
          value={settings.weightStep}
          onChange={set('weightStep')}
        />
        <p className="muted small">
          How much heavier the app suggests when you're ready to go up. Auto suits the weight:{' '}
          {unit === 'lb' ? '+2.5 lb under 25 lb, +5 lb under 150 lb, then +10 lb' : '+1 kg under 10 kg, +2 kg under 25 kg, +2.5 kg under 80 kg, then +5 kg'}
          . An exercise can have its own jump: open it in Exercises.
        </p>
      </section>

      <section className="card">
        <h3>Rest between sets</h3>
        <ChipGroup
          label="Rest between sets"
          options={REST_OPTIONS.map((sec) => ({ value: sec, label: sec == null ? `Auto (${formatClock(restTarget({ ...settings, restSeconds: null }) * 1000)})` : formatClock(sec * 1000) }))}
          value={settings.restSeconds}
          onChange={set('restSeconds')}
        />
        <p className="muted small">
          The rest timer turns green when it's time for the next set. Auto is 1:30 for women and 2:00 for men: women
          recover faster between sets. For big lifts like squats, resting longer is fine.
        </p>
      </section>

      <BackupSettings />

      <button className="card card-button row-between" onClick={() => go('workout', 'exercises')}>
        <span>
          <strong>Exercises</strong>
          <span className="muted block small">{exercises.length} exercises: add your own, change types and muscles</span>
        </span>
        <Icon name="chevron" size={18} />
      </button>

      <p className="muted small center">
        Workout v{APP_VERSION} · your workouts stay on this phone
        <br />
        The app counts visits anonymously (no cookies, no workout data).
      </p>
    </div>
  );
}
