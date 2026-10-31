import { useData } from '../../data/DataProvider.jsx';
import Home from './Home.jsx';
import Welcome from './Welcome.jsx';
import FinishSummary from './FinishSummary.jsx';
import ActiveWorkout from '../workout/ActiveWorkout.jsx';
import ActivityForm from '../activities/ActivityForm.jsx';
import SettingsScreen from '../settings/SettingsScreen.jsx';
import ExercisePage from '../exercises/ExercisePage.jsx';
import TogetherScreen from './TogetherScreen.jsx';
import HandOverScreen from './HandOverScreen.jsx';
import PartnerJoin from '../workout/PartnerJoin.jsx';

// The Home tab. While a workout runs, Home *is* the workout.
// Addresses (after #/home):
//   (nothing)               home, or the workout in progress
//   add[/<person>], swap/<entry id>   the exercise picker (for you or a training partner) / swap list
//   exercise/<id>[/…]       an exercise (from the workout or a record); see ExercisePage
//   done/<workout id>       the summary right after finishing
//   activity                log a run, a swim…
//   settings
//   together[/…]            train together: start, show your code, get your workout (see TogetherScreen)
//   partner                 add a training partner to the workout in progress
//   send/<id>               a partner's finished workout, as a code for her phone
export default function HomeScreen({ path }) {
  const { activeWorkout, workouts, plans, settings } = useData();
  const [first, second] = path;

  if (first === 'settings') return <SettingsScreen />;
  if (first === 'activity') return <ActivityForm />;
  if (first === 'together') return <TogetherScreen path={path.slice(1)} />;
  if (first === 'send') return <HandOverScreen id={second} />;
  if (first === 'partner' && activeWorkout) return <PartnerJoin workout={activeWorkout} />;
  if (first === 'done') return <FinishSummary workoutId={second} />;
  if (first === 'exercise') return <ExercisePage key={second} prefix={['home', 'exercise']} path={path.slice(1)} start="how" backLabel={activeWorkout ? 'Workout' : 'Home'} />;
  if (activeWorkout) return <ActiveWorkout workout={activeWorkout} picking={first === 'add' ? second || 'me' : null} swapping={first === 'swap' ? second : null} />;
  // A brand-new install: a short welcome first.
  if (!settings.setupDone && workouts.length === 0 && plans.length === 0) return <Welcome />;
  return <Home />;
}
