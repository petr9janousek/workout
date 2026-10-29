import ExercisePicker from './ExercisePicker.jsx';
import ExerciseCard from './ExerciseCard.jsx';
import Icon from '../ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { planEntry } from '../../model/progression.js';
import { lastSession } from '../../model/workouts.js';
import { setsBefore } from '../../model/records.js';
import { similarExercises } from '../../model/muscles.js';
import { exerciseName } from '../../model/exercises.js';

// Edits one workout: its exercises, their sets, and notes.
// Used both for the workout in progress and for fixing old workouts.
// Every change goes to onChange(newWorkout), which saves it.
//
// The exercise picker is opened and closed by the screen (it has its own
// address, so the back button closes it): picking, onOpenPicker, onClosePicker.
// Swapping works the same way: swapping (an entry id), onOpenSwap(entryId),
// onCloseSwap. Without onOpenSwap (fixing an old workout) there's no Swap.
// onOpenExercise(id): tap an exercise's name to see how to do it.
export default function WorkoutEditor({ workout, onChange, picking, onOpenPicker, onClosePicker, swapping, onOpenSwap, onCloseSwap, onOpenExercise }) {
  const { workouts, settings, exercises, exercisesById } = useData();
  // When fixing an old workout, new sets count as done straight away.
  const finished = Boolean(workout.finishedAt);

  const update = (changes) => onChange({ ...workout, ...changes });
  const updateEntry = (entryId, change) =>
    update({ entries: workout.entries.map((e) => (e.id === entryId ? change(e) : e)) });

  function addExercise(exercise) {
    const entry = planEntry(exercise, { workouts, settings, startedAt: workout.startedAt }, finished);
    update({ entries: [...workout.entries, entry] });
    onClosePicker();
  }

  // Machine taken: today's workout gets another exercise in the same place,
  // with as many sets, filled from its own history. The plan is unchanged.
  function swapEntry(entryId, exercise) {
    update({
      entries: workout.entries.map((e) => {
        if (e.id !== entryId) return e;
        const entry = planEntry(exercise, { workouts, settings, startedAt: workout.startedAt }, false, e.sets.length);
        return e.extra ? { ...entry, extra: true } : entry;
      }),
    });
    onCloseSwap();
  }
  const swapEntryNow = swapping && workout.entries.find((e) => e.id === swapping);

  // The bin on an exercise. Healthy extras are optional, so it says so;
  // either way only this workout changes, never the plan.
  function removeEntry(entry) {
    const name = exerciseName(exercisesById.get(entry.exerciseId));
    const question = entry.extra
      ? `Skip ${name} today? It's an optional healthy extra and stays in your plan.`
      : finished
        ? `Remove ${name} from this workout?`
        : `Remove ${name} from today's workout?${workout.planId ? ' Your plan stays the same.' : ''}`;
    if (!confirm(question)) return;
    update({ entries: workout.entries.filter((e) => e.id !== entry.id) });
  }

  return (
    <div className="editor">
      {workout.entries.length === 0 && <p className="empty">Add your first exercise to get going.</p>}

      {workout.entries.map((entry) => (
        <ExerciseCard
          key={entry.id}
          entry={entry}
          exercise={exercisesById.get(entry.exerciseId)}
          last={lastSession(workouts, entry.exerciseId, workout.startedAt)}
          earlier={setsBefore(workouts, entry.exerciseId, workout.startedAt)}
          finished={finished}
          onChange={(change) => updateEntry(entry.id, change)}
          onRemove={() => removeEntry(entry)}
          onSwap={onOpenSwap && (() => onOpenSwap(entry.id))}
          onOpen={onOpenExercise && (() => onOpenExercise(entry.exerciseId))}
        />
      ))}

      <button className="btn btn-secondary btn-wide" onClick={onOpenPicker}>
        <Icon name="plus" size={18} /> Add exercise
      </button>

      <label className="notes">
        <span>Notes</span>
        <textarea rows={2} placeholder="How did it feel?" value={workout.notes} onChange={(e) => update({ notes: e.target.value })} />
      </label>

      {picking && <ExercisePicker onPick={addExercise} onClose={onClosePicker} />}
      {swapEntryNow && (
        <ExercisePicker
          onPick={(exercise) => swapEntry(swapEntryNow.id, exercise)}
          onClose={onCloseSwap}
          placeholder="Search all exercises"
          suggestionsTitle={`Instead of ${exerciseName(exercisesById.get(swapEntryNow.exerciseId))}, same muscles:`}
          suggestions={similarExercises(
            exercisesById.get(swapEntryNow.exerciseId) || { name: '' },
            exercises,
            new Set(workout.entries.map((e) => e.exerciseId)),
          ).slice(0, 6)}
        />
      )}
    </div>
  );
}
