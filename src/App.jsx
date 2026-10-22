import { useEffect, useState } from 'react';
import * as db from './db.js';
import { newId, STARTER_EXERCISES, lastTimeSets } from './utils.js';
import WorkoutScreen from './screens/WorkoutScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import ProgressScreen from './screens/ProgressScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import Icon from './components/Icon.jsx';

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
  const [unit, setUnitState] = useState('kg');

  // Load everything from the database once, when the app opens.
  async function loadAll() {
    let ex = await db.getAll('exercises');
    if (ex.length === 0) {
      // First launch: add some common exercises so the list isn't empty.
      // Fixed ids, so if this runs twice it overwrites instead of duplicating.
      ex = STARTER_EXERCISES.map((name, i) => ({ id: `starter-${i}`, name }));
      for (const e of ex) await db.put('exercises', e);
    }
    const settings = await db.getAll('settings');
    setExercises(ex);
    setWorkouts(await db.getAll('workouts'));
    setUnitState(settings.find((s) => s.key === 'unit')?.value || 'kg');
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
  function startWorkout(template) {
    const startedAt = new Date().toISOString();
    const entries = (template?.entries || []).map((entry) => {
      const last = lastTimeSets(workouts, entry.exerciseId);
      const source = last ? last.sets : entry.sets;
      return {
        id: newId(),
        exerciseId: entry.exerciseId,
        sets: source.map((s) => ({ id: newId(), weight: s.weight, reps: s.reps, done: false })),
      };
    });
    const workout = { id: newId(), startedAt, finishedAt: null, notes: '', entries };
    saveWorkout(workout);
    setTab('workout');
  }

  function addExercise(name) {
    const exercise = { id: newId(), name: name.trim() };
    setExercises((list) => [...list, exercise]);
    db.put('exercises', exercise);
    return exercise;
  }

  function renameExercise(id, name) {
    const exercise = { id, name: name.trim() };
    setExercises((list) => list.map((e) => (e.id === id ? exercise : e)));
    db.put('exercises', exercise);
  }

  function deleteExercise(id) {
    setExercises((list) => list.filter((e) => e.id !== id));
    db.remove('exercises', id);
  }

  function setUnit(value) {
    setUnitState(value);
    db.put('settings', { key: 'unit', value });
  }

  if (!loaded) return <div className="loading">Loading…</div>;

  const shared = { exercises, workouts, unit, saveWorkout, deleteWorkout, startWorkout, addExercise };
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
            setUnit={setUnit}
            renameExercise={renameExercise}
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
