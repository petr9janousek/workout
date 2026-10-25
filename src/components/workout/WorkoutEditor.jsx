import ExercisePicker from './ExercisePicker.jsx';
import ExerciseCard from './ExerciseCard.jsx';
import Icon from '../ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { planEntry } from '../../model/progression.js';
import { lastSession } from '../../model/workouts.js';

// Edits one workout: its exercises, their sets, and notes.
// Used both for the workout in progress and for fixing old workouts.
// Every change goes to onChange(newWorkout), which saves it.
//
// The exercise picker is opened and closed by the screen (it has its own
// address, so the back button closes it): picking, onOpenPicker, onClosePicker.
export default function WorkoutEditor({ workout, onChange, picking, onOpenPicker, onClosePicker }) {
  const { workouts, settings, exercisesById } = useData();
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

  function removeEntry(entryId) {
    if (!confirm('Remove this exercise from the workout?')) return;
    update({ entries: workout.entries.filter((e) => e.id !== entryId) });
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
          finished={finished}
          onChange={(change) => updateEntry(entry.id, change)}
          onRemove={() => removeEntry(entry.id)}
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
    </div>
  );
}
