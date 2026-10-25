import ChipGroup from '../../components/ui/ChipGroup.jsx';
import BackupSettings from './BackupSettings.jsx';
import ExerciseList from './ExerciseList.jsx';
import ExerciseEditor from './ExerciseEditor.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { PROGRESSION_MODES } from '../../model/progression.js';
import { WEIGHT_STEPS } from '../../model/settings.js';

export const APP_VERSION = '0.5';

// The Settings tab.
// Addresses: #/settings, #/settings/exercise/<exercise id>
export default function SettingsScreen({ path }) {
  const { settings, unit, actions } = useData();
  if (path[0] === 'exercise' && path[1]) return <ExerciseEditor exerciseId={path[1]} />;

  const set = (key) => (value) => actions.setSetting(key, value);
  const mode = PROGRESSION_MODES.find((m) => m.id === settings.progression);

  return (
    <div>
      <h1>Settings</h1>

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
        <h3>Suggested weight increase</h3>
        <ChipGroup
          label="Weight increase"
          options={WEIGHT_STEPS.map((step) => ({ value: step, label: `+${step} ${unit}` }))}
          value={settings.weightStep}
          onChange={set('weightStep')}
        />
        <p className="muted small">How much heavier the app suggests when you're ready to go up.</p>
      </section>

      <BackupSettings />
      <ExerciseList />

      <p className="muted small center">Workout v{APP_VERSION} · data stays on this device</p>
    </div>
  );
}
