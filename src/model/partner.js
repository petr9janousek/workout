// Training together: one phone logs a partner's sets too, then hands the
// workout over to the partner's phone.
//
//   Before: her phone makes a "pass": her name, the workout her app planned
//           for today (grey values and suggestions included), the exercises
//           in it, and just enough of her history for "last time" and
//           records. Your phone scans it and she appears in your workout.
//   During: your workout keeps her part in workout.partners (see ActiveWorkout).
//   After:  your phone makes a "hand-over" with her finished workout; her
//           phone scans it and saves it like any other workout of hers.
//
// Exercises travel by name (with type and muscles), so they come back to the
// same exercise on her phone, and ones added on your phone are matched by
// name there or created.
// To keep codes small, sets travel as short lists, [weight, reps, time, rpe],
// and entries point to an exercise by its place in `exercises` (ids are long).

import { newId } from './ids.js';
import { newSet, shown, val, estimated1RM, emptySets } from './sets.js';
import { createWorkout, createEntry, finishWorkout, recentSessions } from './workouts.js';
import { startPlanDay } from './plans.js';
import { createExercise, typeOf } from './exercises.js';
import { DEFAULT_SETTINGS } from './settings.js';

const FIELDS = ['weight', 'reps', 'time', 'rpe'];

// { weight: 60, reps: 8, time: null, rpe: null } ⇄ [60, 8]
export function setToWire(set, fields = FIELDS) {
  const values = fields.map((f) => shown(set, f) ?? null);
  while (values.length && values.at(-1) == null) values.pop();
  return values;
}
const wireValues = (values = []) => Object.fromEntries(FIELDS.map((f, i) => [f, values[i] ?? null]));
const planned = ['weight', 'reps', 'time'];

const exerciseToWire = (e) => ({
  name: e.name,
  type: typeOf(e),
  ...(e.muscles ? { muscles: e.muscles } : {}),
  ...(e.weightStep ? { weightStep: e.weightStep } : {}),
  ...(e.notes ? { notes: e.notes } : {}),
});

// The few sets that hold every record so far: the heaviest (with the most
// reps at that weight), the best estimated 1RM, the most reps, the longest
// hold. Beating these is the same as beating the whole history.
function recordKeepers(sets) {
  const most = (score) => sets.reduce((a, b) => (score(b) > score(a) ? b : a));
  const keepers = [
    most((s) => val(s.weight) * 1000 + val(s.reps)),
    most(estimated1RM),
    most((s) => val(s.reps)),
    most((s) => val(s.time)),
  ];
  return [...new Set(keepers)];
}

// The suggestion's own copy of the sets is left out when it's the same as
// the planned sets (it usually is).
function suggestionToWire(entry) {
  const sets = entry.suggestion.sets.map((s) => setToWire(s, planned));
  const same = JSON.stringify(sets) === JSON.stringify(entry.sets.map((s) => setToWire(s, planned)));
  return { ...entry.suggestion, sets: same ? undefined : sets };
}

// Her side, before: the pass. plan and day may be null (an empty workout).
export function makePass({ name, settings, exercisesById, workouts, plan = null, day = null, now = new Date().toISOString() }) {
  const ctx = { workouts, settings };
  const workout = plan && day ? startPlanDay(plan, day, exercisesById, ctx, now) : createWorkout([], now);
  const ids = [...new Set(workout.entries.map((e) => e.exerciseId))];
  return {
    kind: 'pass',
    name,
    settings: {
      progression: settings.progression,
      weightStep: settings.weightStep,
      restSeconds: settings.restSeconds,
      trackRpe: settings.trackRpe,
      body: settings.body,
    },
    workout: {
      ...(workout.name ? { name: workout.name, planId: workout.planId, dayId: workout.dayId } : {}),
      entries: workout.entries.map((e) => ({
        exercise: ids.indexOf(e.exerciseId),
        sets: e.sets.map((s) => setToWire(s, planned)),
        ...(e.extra ? { extra: true } : {}),
        ...(e.suggestion ? { suggestion: suggestionToWire(e) } : {}),
      })),
    },
    exercises: ids.map((id) => exerciseToWire(exercisesById.get(id))),
    past: ids.flatMap((id, i) => {
      const sessions = recentSessions(workouts, id, now, Infinity);
      if (!sessions.length) return [];
      return [{
        exercise: i,
        date: sessions[0].date,
        last: sessions[0].sets.map((s) => setToWire(s)),
        best: recordKeepers(sessions.flatMap((s) => s.sets)).map((s) => setToWire(s)),
      }];
    }),
  };
}

const doneSet = (values) => ({ ...newSet(wireValues(values), true), rpe: wireValues(values).rpe });
const plannedSet = (values) => ({ ...newSet(), target: Object.fromEntries(planned.map((f, i) => [f, values[i] ?? null])) });

// Your side: the partner as she joins your workout. Without a pass (she has
// no app, or no code at hand) she starts empty, with your exercises.
// The history is a stand-in made from the pass: her last session of each
// exercise, and an old "workout" holding her record sets, which is all the
// workout screen needs for "last time" and the trophies.
export function partnerFromPass(pass, now = new Date().toISOString()) {
  const exercises = (pass.exercises || []).map((e) => ({ ...e, ...createExercise(e.name, e.type) }));
  const idOf = (i) => exercises[i]?.id;
  const past = (pass.past || []).filter((p) => idOf(p.exercise));
  const history = past.map((p, i) => ({
    id: `last-${i}`, startedAt: p.date, finishedAt: p.date, notes: '',
    entries: [{ id: `last-${i}`, exerciseId: idOf(p.exercise), sets: p.last.map(doneSet) }],
  }));
  if (past.length) {
    const longAgo = '2000-01-01T00:00:00.000Z';
    history.push({
      id: 'records', startedAt: longAgo, finishedAt: longAgo, notes: '',
      entries: past.map((p) => ({ id: `best-${p.exercise}`, exerciseId: idOf(p.exercise), sets: p.best.map(doneSet) })),
    });
  }
  const { name, planId, dayId, entries = [] } = pass.workout || {};
  return {
    id: newId(),
    name: pass.name || 'Partner',
    settings: { ...DEFAULT_SETTINGS, ...pass.settings },
    exercises,
    history,
    workout: createWorkout(
      entries.filter((e) => idOf(e.exercise)).map((e) => {
        const suggestion = e.suggestion && { ...e.suggestion, sets: (e.suggestion.sets || e.sets).map((v) => wireValues(v)) };
        const entry = createEntry(idOf(e.exercise), e.sets.map(plannedSet), suggestion);
        return e.extra ? { ...entry, extra: true } : entry;
      }),
      now,
      name ? { name, planId, dayId } : {},
    ),
  };
}

export const newPartner = (name, now) => partnerFromPass({ name }, now);

// Someone who just joins your workout (no code needed): your exercises with
// as many sets each, left empty for their own weights. They pick from your
// exercises, so the names and how-to tips are the same.
export function joinYourWorkout(name, workout, now) {
  const partner = { ...newPartner(name, now), turns: true }; // same workout: you take turns (nextTurn)
  const entries = workout.entries.map((e) => {
    const entry = createEntry(e.exerciseId, emptySets(e.sets.length));
    return e.extra ? { ...entry, extra: true } : entry;
  });
  return { ...partner, workout: { ...partner.workout, entries, ...(workout.name ? { name: workout.name } : {}) } };
}

// What the partner can pick from: her own exercises first, then yours that
// she doesn't have.
export function partnerLibrary(partner, yourExercises) {
  const names = new Set(partner.exercises.map((e) => e.name.toLowerCase()));
  return [...partner.exercises, ...yourExercises.filter((e) => !names.has(e.name.toLowerCase()))];
}

// Your side, after: her finished workout, ready to hand over, or null if she
// didn't tick anything. yourExercisesById: for exercises she did from your list.
export function handOver(partner, yourExercisesById, finishedAt = new Date().toISOString()) {
  const { workout } = finishWorkout(partner.workout, finishedAt);
  if (!workout) return null;
  const known = new Map([...yourExercisesById, ...partner.exercises.map((e) => [e.id, e])]);
  const ids = [...new Set(workout.entries.map((e) => e.exerciseId))];
  return {
    kind: 'workout',
    to: partner.name,
    workout: {
      id: workout.id,
      startedAt: workout.startedAt,
      finishedAt: workout.finishedAt,
      ...(workout.name ? { name: workout.name, planId: workout.planId, dayId: workout.dayId } : {}),
      ...(workout.notes ? { notes: workout.notes } : {}),
      entries: workout.entries.map((e) => ({
        exercise: ids.indexOf(e.exerciseId),
        sets: e.sets.map((s) => setToWire(s)),
        ...(e.extra ? { extra: true } : {}),
      })),
    },
    exercises: ids.map((id) => exerciseToWire(known.get(id) || { name: 'Exercise' })),
  };
}

// Her side, after: the hand-over becomes one of her workouts. Exercises are
// found by name (any capitalisation), or created. The plan day counts only if
// she still has that plan. Returns { workout, created }; throws if she
// already has it (scanned twice).
export function importHandOver(data, exercises, workouts, plans = []) {
  if (data?.kind !== 'workout' || !data.workout?.entries) throw new Error("This isn't a workout from a training partner.");
  if (workouts.some((w) => w.id === data.workout.id)) throw new Error('You already have this workout.');
  const byName = new Map(exercises.map((e) => [e.name.toLowerCase(), e]));
  const created = [];
  const ids = []; // place in data.exercises → her exercise id
  for (const def of data.exercises || []) {
    let exercise = byName.get(def.name.toLowerCase());
    if (!exercise) {
      exercise = { ...createExercise(def.name, def.type), ...(def.muscles ? { muscles: def.muscles } : {}) };
      byName.set(exercise.name.toLowerCase(), exercise);
      created.push(exercise);
    }
    ids.push(exercise.id);
  }
  const { id, startedAt, finishedAt, name, planId, dayId, notes = '' } = data.workout;
  const plan = plans.find((p) => p.id === planId && p.days.some((d) => d.id === dayId));
  const workout = {
    id, startedAt, finishedAt, notes,
    entries: data.workout.entries
      .filter((e) => ids[e.exercise])
      .map((e) => ({ id: newId(), exerciseId: ids[e.exercise], sets: e.sets.map(doneSet), ...(e.extra ? { extra: true } : {}) })),
    ...(name ? { name } : {}),
    ...(plan ? { planId, dayId } : {}),
  };
  return { workout, created };
}

// ---- Taking turns ---------------------------------------------------------
// Doing the same workout (joinYourWorkout), you share the machine: after you
// tick a set it's her turn on that exercise, then yours again. workout.turn
// says whose turn it is: { person, exercise, label, at }
//   person:   'me' or a partner's id; exercise: the name in lower case (so
//             it matches across your and her exercises); label: as shown;
//   at:       when the turn started (the screen switches pages on a new one).

// The exercise of a set that became ticked between two versions of a
// workout's entries, or null (nothing newly ticked; unticking doesn't count).
export function newlyTicked(before, after) {
  const wasDone = new Set(before.flatMap((e) => e.sets.filter((s) => s.done).map((s) => s.id)));
  return after.find((e) => e.sets.some((s) => s.done && !wasDone.has(s.id)))?.exerciseId ?? null;
}

// After `personId` ticked a set of `exerciseName`: whose turn is next, going
// round people in order, among those with an unticked set of it; null when
// nobody else has one (then it's just a normal rest).
// people: [{ id, entries, nameOf(exerciseId) }] in order, you first.
export function nextTurn(people, personId, exerciseName, at = new Date().toISOString()) {
  const name = exerciseName.toLowerCase();
  const start = people.findIndex((p) => p.id === personId);
  for (let k = 1; k <= people.length; k++) {
    const p = people[(start + k) % people.length];
    const left = p.entries.some((e) => p.nameOf(e.exerciseId)?.toLowerCase() === name && e.sets.some((s) => !s.done));
    if (left && p.id !== personId) return { person: p.id, exercise: name, label: exerciseName, at };
  }
  return null;
}
