// The app's data store: loads everything from the database once, keeps it in
// memory, and saves every change. Any component can use it with useData():
//
//   const { workouts, settings, actions } = useData();
//   actions.saveWorkout(workout);
//
// Changes show on screen immediately and are written to the database in the
// background. If a write fails, `saveError` is set and App shows a banner.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import { migrate, needsMigration } from './migrations.js';
import { createExercise, indexById, starterExercises } from '../model/exercises.js';
import { activeWorkout } from '../model/workouts.js';
import { planWorkout } from '../model/progression.js';
import { settingsFromList } from '../model/settings.js';

const DataContext = createContext(null);

export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error('useData() must be used inside <DataProvider>');
  return data;
}

// Read from the database, bring old data up to date, add the starter exercises
// on first launch.
async function loadFromDb() {
  let data = await db.loadAll();
  if (needsMigration(data)) {
    data = migrate(data);
    await db.replaceAll(data);
  }
  if (data.exercises.length === 0) {
    data.exercises = starterExercises();
    await Promise.all(data.exercises.map((e) => db.put('exercises', e)));
  }
  return { exercises: data.exercises, workouts: data.workouts, settings: settingsFromList(data.settings) };
}

export function DataProvider({ children }) {
  const [state, setState] = useState(null); // null while loading
  const [saveError, setSaveError] = useState(null);

  const reload = useCallback(() => loadFromDb().then(setState), []);

  useEffect(() => {
    reload().catch((err) => window.showStartupError?.(err));
  }, [reload]);

  // Write in the background; report failures instead of losing them silently.
  const save = (promise) => promise.catch((err) => setSaveError(err.message || String(err)));

  // Update one list in memory: replace the item with the same id, or add it.
  const upsert = (list, item, key = 'id') =>
    list.some((x) => x[key] === item[key]) ? list.map((x) => (x[key] === item[key] ? item : x)) : [...list, item];

  const actions = {
    saveWorkout(workout) {
      setState((s) => ({ ...s, workouts: upsert(s.workouts, workout) }));
      save(db.put('workouts', workout));
    },
    deleteWorkout(id) {
      setState((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }));
      save(db.remove('workouts', id));
    },
    // Start a new workout, optionally repeating the exercises of `template`.
    startWorkout(template = null) {
      const workout = planWorkout(template, indexById(state.exercises), state);
      actions.saveWorkout(workout);
      return workout;
    },
    addExercise(name, type) {
      const exercise = createExercise(name, type);
      setState((s) => ({ ...s, exercises: [...s.exercises, exercise] }));
      save(db.put('exercises', exercise));
      return exercise;
    },
    // changes: any of { name, type, muscles }. muscles: undefined = back to automatic.
    updateExercise(id, changes) {
      const exercise = { ...state.exercises.find((e) => e.id === id), ...changes };
      if (exercise.muscles === undefined) delete exercise.muscles;
      setState((s) => ({ ...s, exercises: upsert(s.exercises, exercise) }));
      save(db.put('exercises', exercise));
    },
    deleteExercise(id) {
      setState((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) }));
      save(db.remove('exercises', id));
    },
    setSetting(key, value) {
      setState((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
      save(db.put('settings', { key, value }));
    },
    // Replace everything with a backup (already checked by readBackup()).
    async restore(data) {
      await db.replaceAll(data);
      await reload();
    },
    dismissSaveError: () => setSaveError(null),
  };

  // Values worked out from the data, recalculated only when it changes.
  const exercisesById = useMemo(() => (state ? indexById(state.exercises) : new Map()), [state?.exercises]);
  const current = useMemo(() => (state ? activeWorkout(state.workouts) : null), [state?.workouts]);

  if (!state) return <div className="loading">Loading…</div>;

  const value = { ...state, unit: state.settings.unit, exercisesById, activeWorkout: current, actions, saveError };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
