import WorkoutDetail from './WorkoutDetail.jsx';
import ActivityDetail from '../activities/ActivityDetail.jsx';
import ActivityForm from '../activities/ActivityForm.jsx';
import ExercisePage from '../exercises/ExercisePage.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import HabitCard from '../../components/charts/HabitCard.jsx';
import BodyWeightCard from '../../components/charts/BodyWeightCard.jsx';
import SessionRow from '../../components/workout/SessionRow.jsx';
import FoldCard from '../../components/ui/FoldCard.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { SUGGESTION_ICONS } from '../../components/ui/Suggestion.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { finishedWorkouts, exerciseHistory, recentSessions } from '../../model/workouts.js';
import { isActivity } from '../../model/activities.js';
import { suggestNext } from '../../model/progression.js';
import { settingsFor } from '../../model/settings.js';
import { recentMuscleSets } from '../../model/muscles.js';
import { typeOf } from '../../model/exercises.js';
import { formatSetList } from '../../model/sets.js';
import { formatDate } from '../../model/format.js';

// The Progress tab: you over time. The habit card with the calendar (tap a
// day to see what you did), body weight, muscles this week, then two folding
// lists: every workout and activity, and every exercise you've done.
// Addresses (after #/progress):
//   workout/<id>[/edit[/add]]   one finished workout or activity
//   exercise/<id>[/how|/edit…]  your progress on one exercise, linked to how to do it
export default function ProgressScreen({ path }) {
  const { workouts, settings, exercisesById } = useData();
  const [first, id, mode, sheet] = path;

  if (first === 'workout') {
    const activity = workouts.find((w) => w.id === id && isActivity(w));
    if (activity) return mode === 'edit' ? <ActivityForm key={id} activity={activity} /> : <ActivityDetail activity={activity} />;
    return <WorkoutDetail workoutId={id} editing={mode === 'edit'} picking={sheet === 'add'} />;
  }
  if (first === 'exercise') return <ExercisePage key={id} prefix={['progress', 'exercise']} path={path.slice(1)} start="progress" backLabel="Progress" />;

  return (
    <div>
      <h1>Progress</h1>
      <HabitCard />
      {settings.trackBodyWeight && <BodyWeightCard />}
      <MuscleCard
        id="week"
        title="Muscles: last 7 days"
        sets={recentMuscleSets(workouts, exercisesById, 7)}
        scale="week"
        note="Sets per muscle. Helping muscles count as ½ a set. Research suggests roughly 10–20 sets per muscle a week for growth."
      />
      <AllWorkouts />
      <ExerciseList />
    </div>
  );
}

// Every finished workout and activity, newest first, by month.
function AllWorkouts() {
  const { workouts } = useData();
  const list = finishedWorkouts(workouts);
  const months = [];
  for (const w of list) {
    const month = new Date(w.startedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (months.at(-1)?.month !== month) months.push({ month, items: [] });
    months.at(-1).items.push(w);
  }

  return (
    <FoldCard id="allWorkouts" title="All workouts" count={list.length}>
      {list.length === 0 && <p className="muted small">Finished workouts and activities will show up here.</p>}
      {months.map(({ month, items }) => (
        <div key={month} className="month-group">
          <h4 className="month-group-title">{month}</h4>
          {items.map((w) => (
            <SessionRow key={w.id} workout={w} onOpen={() => go('progress', 'workout', w.id)} />
          ))}
        </div>
      ))}
    </FoldCard>
  );
}

// Exercises done at least once, most recent first, with the next suggestion.
function ExerciseList() {
  const { exercises, workouts, settings } = useData();
  const tracked = exercises
    .map((exercise) => ({ exercise, history: exerciseHistory(workouts, exercise.id) }))
    .filter((t) => t.history.length > 0)
    .map((t) => ({ ...t, next: suggestNext(recentSessions(workouts, t.exercise.id), typeOf(t.exercise), settingsFor(settings, t.exercise)) }))
    .sort((a, b) => b.history.at(-1).date.localeCompare(a.history.at(-1).date));

  return (
    <FoldCard id="exercises" title="Exercises" count={tracked.length}>
      {tracked.length === 0 && <p className="muted small">Finish a workout and your exercises will appear here.</p>}
      {tracked.map(({ exercise, history, next }) => (
        <button key={exercise.id} className="list-row" onClick={() => go('progress', 'exercise', exercise.id)}>
          <span className="list-row-text">
            <strong>{exercise.name}</strong>
            <span className="muted small">
              {history.length} {history.length === 1 ? 'session' : 'sessions'} · last {formatDate(history.at(-1).date)}
            </span>
            <span className={`next-hint ${next.kind}`}>
              {SUGGESTION_ICONS[next.kind]} Next: {formatSetList(next.sets, typeOf(exercise))}
            </span>
          </span>
          <Icon name="chevron" size={16} />
        </button>
      ))}
    </FoldCard>
  );
}
