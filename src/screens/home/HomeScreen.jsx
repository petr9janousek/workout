import { useData } from '../../data/DataProvider.jsx';
import Home from './Home.jsx';
import Welcome from './Welcome.jsx';
import FinishSummary from './FinishSummary.jsx';
import ActiveWorkout from '../workout/ActiveWorkout.jsx';
import ActivityForm from '../activities/ActivityForm.jsx';
import SettingsScreen from '../settings/SettingsScreen.jsx';
import ExercisePage from '../exercises/ExercisePage.jsx';

// The Home tab. While a workout runs, Home *is* the workout.
// Addresses (after #/home):
//   (nothing)               home, or the workout in progress
//   add, swap/<entry id>    the exercise picker / swap list over the workout
//   exercise/<id>[/…]       an exercise (from the workout or a record); see ExercisePage
//   done/<workout id>       the summary right after finishing
//   activity                log a run, a swim…
//   settings
export default function HomeScreen({ path }) {
  const { activeWorkout, workouts, plans, settings } = useData();
  const [first, second] = path;

  if (first === 'settings') return <SettingsScreen />;
  if (first === 'activity') return <ActivityForm />;
  if (first === 'done') return <FinishSummary workoutId={second} />;
  if (first === 'exercise') return <ExercisePage key={second} prefix={['home', 'exercise']} path={path.slice(1)} start="how" backLabel={activeWorkout ? 'Workout' : 'Home'} />;
  if (activeWorkout) return <ActiveWorkout workout={activeWorkout} picking={first === 'add'} swapping={first === 'swap' ? second : null} />;
  // A brand-new install: a short welcome first.
  if (!settings.setupDone && workouts.length === 0 && plans.length === 0) return <Welcome />;
  return <Home />;
}
