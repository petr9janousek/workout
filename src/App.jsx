import { useEffect, useState } from 'react';
import * as db from './db.js';
import { newId, STARTER_EXERCISES, guessType, typeOf, plannedSets } from './utils.js';
import WorkoutScreen from './screens/WorkoutScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import ProgressScreen from './screens/ProgressScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import Icon from './components/Icon.jsx';

export const DEFAULT_SETTINGS = {
  unit: 'kg',
  trackRpe: true, // show the RPE column when logging
  weightStep: 2.5, // how much heavier a "try heavier" suggestion is
  progression: 'double', // which suggestion style: see PROGRESSION_MODES in utils.js
};

const TABS = [
  { id: 'workout', label: 'Workout' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Settings' },
];

// App holds all the data in memory (React "state") and saves every change
// to the phone's database. The screens receive the data and these functions.
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('workout');
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  // App settings, with their defaults. Saved in the 'settings' store.
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load everything from the database once, when the app opens.
  async function loadAll() {
    let ex = await db.getAll('exercises');
    if (ex.length === 0) {
      // First launch: add some common exercises so the list isn't empty.
      // Fixed ids, so if this runs twice it overwrites instead of duplicating.
      ex = STARTER_EXERCISES.map((name, i) => ({ id: `starter-${i}`, name, type: guessType(name) }));
      for (const e of ex) await db.put('exercises', e);
    }
    // Exercises saved before types existed: guess their type once and save it.
    for (const e of ex.filter((e) => !e.type)) {
      e.type = guessType(e.name);
      await db.put('exercises', e);
    }
    const saved = await db.getAll('settings');
    const loadedSettings = { ...DEFAULT_SETTINGS };
    for (const { key, value } of saved) if (key in DEFAULT_SETTINGS) loadedSettings[key] = value;
    setExercises(ex);
    setWorkouts(await db.getAll('workouts'));
    setSettings(loadedSettings);
    setLoaded(true);
  }

  useEffect(() => {
    loadAll().catch((err) => window.showStartupError?.(err));
  }, []);

  // ---- Actions the screens can call --------------------------------------

  function saveWorkout(workout) {
    setWorkouts((list) => {
      const exists = list.some((w) => w.id === workout.id);
      return exists ? list.map((w) => (w.id === workout.id ? workout : w)) : [...list, workout];
    });
    db.put('workouts', workout);
  }

  function deleteWorkout(id) {
    setWorkouts((list) => list.filter((w) => w.id !== id));
    db.remove('workouts', id);
  }

  // Start a new workout, optionally copying the exercises of an earlier one.
  // Each exercise starts from last time's sets, with the suggestion applied.
  function startWorkout(template) {
    const startedAt = new Date().toISOString();
    const entries = (template?.entries || []).map((entry) => {
      const type = typeOf(exercises.find((e) => e.id === entry.exerciseId));
      const plan = plannedSets(workouts, entry.exerciseId, type, settings, startedAt);
      return { id: newId(), exerciseId: entry.exerciseId, sets: plan.sets, suggestion: plan.suggestion };
    });
    const workout = { id: newId(), startedAt, finishedAt: null, notes: '', entries };
    saveWorkout(workout);
    setTab('workout');
  }

  function addExercise(name, type = 'weight') {
    const exercise = { id: newId(), name: name.trim(), type };
    setExercises((list) => [...list, exercise]);
    db.put('exercises', exercise);
    return exercise;
  }

  // changes: { name } and/or { type }
  function updateExercise(id, changes) {
    const exercise = { ...exercises.find((e) => e.id === id), ...changes };
    setExercises((list) => list.map((e) => (e.id === id ? exercise : e)));
    db.put('exercises', exercise);
  }

  function deleteExercise(id) {
    setExercises((list) => list.filter((e) => e.id !== id));
    db.remove('exercises', id);
  }

  function setSetting(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
    db.put('settings', { key, value });
  }

  if (!loaded) return <div className="loading">Loading…</div>;

  const unit = settings.unit;
  const shared = { exercises, workouts, unit, settings, saveWorkout, deleteWorkout, startWorkout, addExercise };
  const activeWorkout = workouts.find((w) => !w.finishedAt);

  return (
    <div className="app">
      <main className="screen">
        {tab === 'workout' && <WorkoutScreen {...shared} activeWorkout={activeWorkout} goTo={setTab} />}
        {tab === 'history' && <HistoryScreen {...shared} activeWorkout={activeWorkout} />}
        {tab === 'progress' && <ProgressScreen {...shared} />}
        {tab === 'settings' && (
          <SettingsScreen
            {...shared}
            setSetting={setSetting}
            updateExercise={updateExercise}
            deleteExercise={deleteExercise}
            reload={loadAll}
          />
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.id} />
            <span>{t.label}</span>
            {t.id === 'workout' && activeWorkout && tab !== 'workout' && <span className="tab-dot" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
