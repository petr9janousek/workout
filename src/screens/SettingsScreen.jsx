import { useEffect, useRef, useState } from 'react';
import * as db from '../db.js';
import { formatDate, EXERCISE_TYPES, typeOf, PROGRESSION_MODES } from '../utils.js';
import { MUSCLES, musclesOf } from '../muscles.js';

const STEPS = [1, 1.25, 2.5, 5];

export default function SettingsScreen({ unit, settings, setSetting, exercises, workouts, updateExercise, deleteExercise, reload }) {
  const [persisted, setPersisted] = useState(null);
  const [lastBackup, setLastBackup] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted);
    db.getAll('settings').then((s) => setLastBackup(s.find((x) => x.key === 'lastBackup')?.value || null));
  }, []);

  // ---- Backup -------------------------------------------------------------

  async function exportBackup() {
    // Built straight from what's on screen, so the phone's share sheet
    // opens immediately after the tap (iPhones require that).
    const data = {
      app: 'workout',
      version: 1,
      exportedAt: new Date().toISOString(),
      exercises,
      workouts,
      settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
    };
    const name = `workout-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([JSON.stringify(data, null, 1)], name, { type: 'application/json' });

    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Workout backup' });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // closed the share sheet
      setMessage(`Backup failed: ${err.message}`);
      return;
    }
    const now = new Date().toISOString();
    db.put('settings', { key: 'lastBackup', value: now });
    setLastBackup(now);
    setMessage('Backup created.');
  }

  async function importBackup(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const count = data.workouts?.length ?? 0;
      if (!confirm(`Restore ${count} workouts from this backup? Everything currently in the app will be replaced.`)) return;
      await db.importAll(data);
      await reload();
      setMessage('Backup restored.');
    } catch (err) {
      setMessage(`Could not restore: ${err.message}`);
    }
  }

  // ---- Exercises ----------------------------------------------------------

  const usage = (id) => workouts.filter((w) => w.entries.some((e) => e.exerciseId === id)).length;

  function remove(exercise) {
    const used = usage(exercise.id);
    if (used) {
      alert(`“${exercise.name}” is used in ${used} workout(s), so it can't be deleted. You can rename it instead.`);
      return;
    }
    if (confirm(`Delete “${exercise.name}”?`)) deleteExercise(exercise.id);
  }

  // off → ½ (helping) → 1 (main) → off
  function cycleMuscle(exercise, muscle) {
    const muscles = { ...musclesOf(exercise) };
    const next = { 0: 0.5, 0.5: 1, 1: 0 }[muscles[muscle] || 0];
    if (next) muscles[muscle] = next;
    else delete muscles[muscle];
    updateExercise(exercise.id, { muscles });
  }

  const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1>Settings</h1>

      <section className="card">
        <h3>Weight unit</h3>
        <div className="chips">
          {['kg', 'lb'].map((u) => (
            <button key={u} className={u === unit ? 'chip active' : 'chip'} onClick={() => setSetting('unit', u)}>{u}</button>
          ))}
        </div>
        <p className="muted small">Only changes the label. Numbers you've logged are not converted.</p>
      </section>

      <section className="card">
        <h3>RPE (how hard a set felt)</h3>
        <div className="chips">
          {[true, false].map((on) => (
            <button key={String(on)} className={settings.trackRpe === on ? 'chip active' : 'chip'} onClick={() => setSetting('trackRpe', on)}>
              {on ? 'Show RPE column' : 'Hide'}
            </button>
          ))}
        </div>
        <p className="muted small">
          Rate each set from 1 to 10: 10 = couldn't do another rep, 9 = one left in the tank, 8 = two left.
          Optional. When filled in, it makes the "try heavier" suggestions smarter.
        </p>
      </section>

      <section className="card">
        <h3>Progression style</h3>
        <div className="chips">
          {PROGRESSION_MODES.map((m) => (
            <button key={m.id} className={settings.progression === m.id ? 'chip active' : 'chip'} onClick={() => setSetting('progression', m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="muted small">{PROGRESSION_MODES.find((m) => m.id === settings.progression)?.help}</p>
        <p className="muted small">In every style: after a set at RPE 9.5+ it suggests repeating, and if your reps drop twice in a row, or stop improving for 4 sessions, it suggests going a step lighter.</p>
      </section>

      <section className="card">
        <h3>Suggested weight increase</h3>
        <div className="chips">
          {STEPS.map((step) => (
            <button key={step} className={settings.weightStep === step ? 'chip active' : 'chip'} onClick={() => setSetting('weightStep', step)}>
              +{step} {unit}
            </button>
          ))}
        </div>
        <p className="muted small">How much heavier the app suggests when you're ready to go up.</p>
      </section>

      <section className="card">
        <h3>Backup</h3>
        <p className="muted small">
          Your workouts are stored only on this phone. Save a backup now and then (to Files, Google Drive…)
          so you can restore it if the app is removed or you get a new phone.
        </p>
        <p className="small">Last backup: {lastBackup ? formatDate(lastBackup) : 'never'}</p>
        <div className="actions">
          <button className="btn btn-primary btn-wide" onClick={exportBackup}>Save backup</button>
          <button className="btn btn-secondary btn-wide" onClick={() => fileInput.current.click()}>Restore from backup</button>
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importBackup} />
        {message && <p className="message">{message}</p>}
        {persisted != null && (
          <p className="muted small">
            Storage: {persisted ? 'protected from automatic clean-up ✓' : 'not protected yet (install the app to the home screen)'}
          </p>
        )}
      </section>

      <section className="card">
        <h3>Exercises</h3>
        <p className="muted small">Tap an exercise to rename it, or change its type or muscles. New exercises can be added while logging a workout.</p>
        <ul className="exercise-list">
          {sorted.map((e) =>
            editingId === e.id ? (
              <li key={e.id} className="exercise-edit">
                <input
                  className="search"
                  defaultValue={e.name}
                  aria-label="Exercise name"
                  onBlur={(ev) => ev.target.value.trim() && ev.target.value.trim() !== e.name && updateExercise(e.id, { name: ev.target.value.trim() })}
                />
                <div className="chips">
                  {EXERCISE_TYPES.map((t) => (
                    <button key={t.id} className={typeOf(e) === t.id ? 'chip active' : 'chip'} onClick={() => updateExercise(e.id, { type: t.id })}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <span className="small">
                  Muscles worked <span className="muted">(tap: off → helping ½ → main)</span>
                </span>
                <div className="chips">
                  {MUSCLES.map((m) => {
                    const weight = musclesOf(e)[m.id] || 0;
                    return (
                      <button key={m.id} className={`chip ${weight === 1 ? 'active' : weight ? 'half' : ''}`} onClick={() => cycleMuscle(e, m.id)}>
                        {m.label}
                        {weight === 0.5 && ' ½'}
                      </button>
                    );
                  })}
                </div>
                {e.muscles && (
                  <button className="btn-text small-link" onClick={() => updateExercise(e.id, { muscles: undefined })}>
                    Reset muscles to automatic
                  </button>
                )}
                <div className="row-between">
                  <button className="btn-text danger" onClick={() => remove(e)}>Delete exercise</button>
                  <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Done</button>
                </div>
              </li>
            ) : (
              <li key={e.id}>
                <button className="link" onClick={() => setEditingId(e.id)}>{e.name}</button>
                <span className="tag">{EXERCISE_TYPES.find((t) => t.id === typeOf(e)).label}</span>
              </li>
            ),
          )}
        </ul>
      </section>

      <p className="muted small center">Workout v0.3 · data stays on this device</p>
    </div>
  );
}
