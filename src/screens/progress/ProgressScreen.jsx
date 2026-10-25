import ExerciseProgress from './ExerciseProgress.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import HabitCard from '../../components/charts/HabitCard.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { SUGGESTION_ICONS } from '../../components/ui/Suggestion.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { exerciseHistory, recentSessions } from '../../model/workouts.js';
import { suggestNext } from '../../model/progression.js';
import { settingsFor } from '../../model/settings.js';
import { recentMuscleSets } from '../../model/muscles.js';
import { typeOf } from '../../model/exercises.js';
import { formatSet } from '../../model/sets.js';
import { formatDate } from '../../model/format.js';

// The Progress tab: muscles this week, and every exercise you've done.
// Addresses: #/progress, #/progress/<exercise id>
export default function ProgressScreen({ path }) {
  const { exercises, workouts, settings, exercisesById } = useData();
  if (path[0]) return <ExerciseProgress exerciseId={path[0]} />;

  // Exercises done at least once, most recent first, with the next suggestion.
  const tracked = exercises
    .map((exercise) => ({ exercise, history: exerciseHistory(workouts, exercise.id) }))
    .filter((t) => t.history.length > 0)
    .map((t) => ({ ...t, next: suggestNext(recentSessions(workouts, t.exercise.id), typeOf(t.exercise), settingsFor(settings, t.exercise)) }))
    .sort((a, b) => b.history.at(-1).date.localeCompare(a.history.at(-1).date));

  return (
    <div>
      <h1>Progress</h1>
      <HabitCard />
      <MuscleCard
        id="week"
        title="Muscles: last 7 days"
        sets={recentMuscleSets(workouts, exercisesById, 7)}
        scale="week"
        note="Sets per muscle. Helping muscles count as ½ a set. Research suggests roughly 10–20 sets per muscle a week for growth."
      />
      {tracked.length === 0 && <p className="empty">Finish a workout and your exercises will appear here.</p>}
      {tracked.map(({ exercise, history, next }) => (
        <button key={exercise.id} className="card card-button row-between" onClick={() => go('progress', exercise.id)}>
          <span>
            <strong>{exercise.name}</strong>
            <span className="muted block small">
              {history.length} {history.length === 1 ? 'session' : 'sessions'} · last {formatDate(history.at(-1).date)}
            </span>
            <span className={`next-hint ${next.kind}`}>
              {SUGGESTION_ICONS[next.kind]} Next: {next.sets.map((s) => formatSet(s, typeOf(exercise))).join(' · ')}
            </span>
          </span>
          <Icon name="chevron" size={18} />
        </button>
      ))}
    </div>
  );
}
