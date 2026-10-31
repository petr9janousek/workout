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
import { createPlan, createDay, planFromTemplate, startPlanDay } from '../model/plans.js';
import { settingsFromList } from '../model/settings.js';
import { withExtras } from '../model/extras.js';
import { planFromFile } from '../model/planFile.js';
import { importHandOver } from '../model/partner.js';
import { sampleData } from './sampleData.js';
import { countEvent } from '../analytics.js';

const DataContext = createContext(null);

export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error('useData() must be used inside <DataProvider>');
  return data;
}

// The same data with some parts swapped, for everything inside it. The
// workout screen uses it to show a training partner's part with her own
// exercises, history and settings, so the same components work for both.
export function DataOverride({ changes, children }) {
  const data = useData();
  return <DataContext.Provider value={{ ...data, ...changes }}>{children}</DataContext.Provider>;
}

// Count a first launch only once, even if loading runs twice (React's
// development mode does that on purpose).
let countedFirstOpen = false;

// Read from the database, bring old data up to date, add the starter exercises
// on first launch.
async function loadFromDb() {
  let data = await db.loadAll();
  if (needsMigration(data)) {
    data = migrate(data);
    await db.replaceAll(data);
  }
  if (data.exercises.length === 0) {
    // First launch on this phone.
    data.exercises = starterExercises();
    await Promise.all(data.exercises.map((e) => db.put('exercises', e)));
    if (!countedFirstOpen) countEvent('first-open', 'New user (first launch)');
    countedFirstOpen = true;
  }
  return {
    exercises: data.exercises,
    workouts: data.workouts,
    plans: data.plans,
    settings: settingsFromList(data.settings),
  };
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
    // Start the given day of a plan as today's workout.
    startPlanDay(plan, day) {
      const workout = startPlanDay(plan, day, indexById(state.exercises), state);
      actions.saveWorkout(workout);
      return workout;
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
    savePlan(plan) {
      setState((s) => ({ ...s, plans: upsert(s.plans, plan) }));
      save(db.put('plans', plan));
    },
    deletePlan(id) {
      setState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) }));
      save(db.remove('plans', id));
      if (state.settings.activePlanId === id) actions.setSetting('activePlanId', null);
    },
    // A new plan with empty days, made the active plan. Returns it.
    newPlan(name, dayNames) {
      const plan = createPlan(name, dayNames.map((n) => createDay(n)));
      actions.savePlan(plan);
      actions.setSetting('activePlanId', plan.id);
      return plan;
    },
    // A new plan from a template (planTemplates.js), made the active plan.
    // Exercises the template needs are found by name, or created.
    // With extras: the healthy extras (extras.js) are added to every day.
    newPlanFromTemplate(template, { extras = false } = {}) {
      if (extras) template = withExtras(template);
      const known = new Map(state.exercises.map((e) => [e.name.toLowerCase(), e]));
      const created = [];
      const idForName = (name) => {
        let exercise = known.get(name.toLowerCase());
        if (!exercise) {
          exercise = createExercise(name);
          known.set(name.toLowerCase(), exercise);
          created.push(exercise);
        }
        return exercise.id;
      };
      const plan = planFromTemplate(template, idForName);
      if (created.length) {
        setState((s) => ({ ...s, exercises: [...s.exercises, ...created] }));
        created.forEach((e) => save(db.put('exercises', e)));
      }
      actions.savePlan(plan);
      actions.setSetting('activePlanId', plan.id);
      return plan;
    },
    // A plan from a plan file (planFile.js). Not made active. Returns it.
    importPlan(filePlan) {
      const { plan, created } = planFromFile(filePlan, state.exercises, state.plans);
      if (created.length) {
        setState((s) => ({ ...s, exercises: [...s.exercises, ...created] }));
        created.forEach((e) => save(db.put('exercises', e)));
      }
      actions.savePlan(plan);
      return plan;
    },
    // A workout handed over from a training partner's phone (partner.js).
    // Returns it; throws an Error with a message if it can't be added.
    importWorkout(data) {
      const { workout, created } = importHandOver(data, state.exercises, state.workouts, state.plans);
      if (created.length) {
        setState((s) => ({ ...s, exercises: [...s.exercises, ...created] }));
        created.forEach((e) => save(db.put('exercises', e)));
      }
      actions.saveWorkout(workout);
      return workout;
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
    // For testing (Settings → For testing): replace everything with sample
    // data, or delete everything and start like a new install.
    async loadSampleData() {
      await db.replaceAll(sampleData({ body: state.settings.body, name: state.settings.name }));
      await reload();
    },
    async resetApp() {
      countedFirstOpen = true; // a reset is not a new user for the visit counts
      await db.replaceAll({});
      await reload();
    },
    dismissSaveError: () => setSaveError(null),
  };

  // Values worked out from the data, recalculated only when it changes.
  const exercisesById = useMemo(() => (state ? indexById(state.exercises) : new Map()), [state?.exercises]);
  const current = useMemo(() => (state ? activeWorkout(state.workouts) : null), [state?.workouts]);

  if (!state) return <div className="loading">Loading…</div>;

  const activePlan = state.plans.find((p) => p.id === state.settings.activePlanId) || null;
  const value = { ...state, exercisesById, activeWorkout: current, activePlan, actions, saveError };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
