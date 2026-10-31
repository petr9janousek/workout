import { useState } from 'react';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import CardTitle from '../../components/ui/CardTitle.jsx';
import BackupSettings from './BackupSettings.jsx';
import { APP_VERSION } from '../../version.js';
import BackButton from '../../components/ui/BackButton.jsx';
import { openTab } from '../../hooks/useRoute.js';
import { useData } from '../../data/DataProvider.jsx';
import { PROGRESSION_MODES } from '../../model/progression.js';
import { WEIGHT_STEPS, REST_OPTIONS } from '../../model/settings.js';
import { formatClock } from '../../model/format.js';

// Settings, opened from the bottom of Home.
// Address: #/home/settings
export default function SettingsScreen() {
  const { settings } = useData();
  const mode = PROGRESSION_MODES.find((m) => m.id === settings.progression);

  return (
    <div>
      <BackButton label="Home" fallback={['home']} />
      <h1>Settings</h1>

      <NameSetting />

      <Setting
        name="body"
        title="About you"
        label="Body"
        options={[{ value: 'female', label: 'Woman' }, { value: 'male', label: 'Man' }]}
        hint={
          <>
            Changes the body drawing, which ready-made plans are recommended for you, and the automatic rest time.
            Everything else works the same: research finds women and men gain muscle and strength at similar rates.
          </>
        }
      />

      <Setting
        name="trackBodyWeight"
        title="Body weight"
        options={onOff('Track in Progress', 'Off')}
        hint="A card in Progress where you note your weight now and then and see it as a line."
      />

      <Setting
        name="keepAwake"
        title="Screen during a workout"
        options={onOff('Keep it on', 'Normal')}
        hint={
          <>
            Keeps the phone from locking while a workout is open, so the timers and your sets stay in view. The phone
            goes back to normal when you finish.
          </>
        }
      />

      <Setting
        name="trackRpe"
        title="RPE (how hard a set felt)"
        label="RPE column"
        options={onOff('Show RPE column', 'Hide')}
        hint={
          <>
            Rate each set from 1 to 10: 10 = couldn't do another rep, 9 = one left in the tank, 8 = two left.
            Optional. When filled in, it makes the "try heavier" suggestions smarter.
          </>
        }
      />

      <Setting
        name="progression"
        title="Progression style"
        options={PROGRESSION_MODES.map((m) => ({ value: m.id, label: m.label }))}
        hint={
          <>
            {mode?.help}{' '}In every style: after a set at RPE 9.5+ it suggests repeating; a set 4+ reps above the time before means the weight got
            easy, so it goes heavier; and if your reps drop twice in a row, or stop improving for 4 sessions, it suggests going a step
            lighter. The suggestion is filled in grey: tick ✓ to take it, type what you really did, or tap the line above the sets for
            "Same as last time instead".
          </>
        }
      />

      <Setting
        name="weeklyGoal"
        title="Weekly goal"
        label="Training days a week"
        options={[{ value: null, label: 'From my plan' }, ...[2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} days` }))]}
        hint={
          <>
            How many days a week you aim to train. Streaks count weeks that reach it, so rest days never break them.
            "From my plan" uses the number of days in your active plan (or 2 without a plan).
          </>
        }
      />

      <Setting
        name="weightStep"
        title="Suggested weight increase"
        label="Weight increase"
        options={WEIGHT_STEPS.map((step) => ({ value: step, label: step === 'auto' ? 'Auto' : `+${step} kg` }))}
        hint={
          <>
            How much heavier the app suggests when you're ready to go up. Auto suits the weight: +1 kg under 10 kg,
            +2 kg under 25 kg, +2.5 kg under 80 kg, then +5 kg. An exercise can have its own jump: Exercises, open it, Edit.
          </>
        }
      />

      <Setting
        name="restSeconds"
        title="Rest between sets"
        options={REST_OPTIONS.map((sec) => ({ value: sec, label: sec == null ? 'Auto (1:30–2:00)' : formatClock(sec * 1000) }))}
        hint={
          <>
            After you tick a set, a small timer shows the rest left. Auto is 2:00 after big lifts (squats, deadlifts,
            presses, rows, pull-ups) and 1:30 after everything else: resting at least a minute helps muscles grow, and
            big lifts give more reps in the next set after a longer rest. Waiting longer never hurts.
          </>
        }
      />

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

// Your name or nickname, for training together (partner.js). Saved when you
// leave the field.
function NameSetting() {
  const { settings, actions } = useData();
  const [name, setName] = useState(settings.name);
  return (
    <section className="card">
      <CardTitle title="Your name" hint="Only for training together: when someone logs your sets on their phone, it shows whose are whose." />
      <input
        className="search"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() !== settings.name && actions.setSetting('name', name.trim())}
        placeholder="Name or nickname"
        aria-label="Your name"
      />
    </section>
  );
}

// One card per setting: title, "?" hint and the choices.
// name: the key in settings.
function Setting({ name, title, label = title, hint, options }) {
  const { settings, actions } = useData();
  return (
    <section className="card">
      <CardTitle title={title} hint={hint} />
      <ChipGroup label={label} options={options} value={settings[name]} onChange={(v) => actions.setSetting(name, v)} />
    </section>
  );
}

const onOff = (on, off) => [{ value: true, label: on }, { value: false, label: off }];

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
