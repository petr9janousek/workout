import { useEffect, useRef, useState } from 'react';
import * as db from '../db.js';
import { formatDate } from '../utils.js';

export default function SettingsScreen({ unit, setUnit, exercises, workouts, renameExercise, deleteExercise, reload }) {
  const [persisted, setPersisted] = useState(null);
  const [lastBackup, setLastBackup] = useState(null);
  const [message, setMessage] = useState('');
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
      settings: [{ key: 'unit', value: unit }],
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

  function rename(exercise) {
    const name = prompt('Rename exercise', exercise.name);
    if (name && name.trim()) renameExercise(exercise.id, name);
  }

  function remove(exercise) {
    const used = usage(exercise.id);
    if (used) {
      alert(`“${exercise.name}” is used in ${used} workout(s), so it can't be deleted. You can rename it instead.`);
      return;
    }
    if (confirm(`Delete “${exercise.name}”?`)) deleteExercise(exercise.id);
  }

  const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1>Settings</h1>

      <section className="card">
        <h3>Weight unit</h3>
        <div className="chips">
          {['kg', 'lb'].map((u) => (
            <button key={u} className={u === unit ? 'chip active' : 'chip'} onClick={() => setUnit(u)}>{u}</button>
          ))}
        </div>
        <p className="muted small">Only changes the label. Numbers you've logged are not converted.</p>
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
        <p className="muted small">Tap a name to rename it. New exercises can be added while logging a workout.</p>
        <ul className="exercise-list">
          {sorted.map((e) => (
            <li key={e.id}>
              <button className="link" onClick={() => rename(e)}>{e.name}</button>
              <button className="btn-text danger" onClick={() => remove(e)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted small center">Workout v0.1 · data stays on this device</p>
    </div>
  );
}
