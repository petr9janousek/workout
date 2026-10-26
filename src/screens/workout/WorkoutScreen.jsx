import { useData } from '../../data/DataProvider.jsx';
import StartWorkout from './StartWorkout.jsx';
import ActiveWorkout from './ActiveWorkout.jsx';
import PlansScreen from '../plans/PlansScreen.jsx';
import ExerciseLibrary from '../exercises/ExerciseLibrary.jsx';
import ExerciseDetail from '../exercises/ExerciseDetail.jsx';
import ActivityForm from '../activities/ActivityForm.jsx';

// The Workout tab: the workout in progress, or the start screen; plans live here too.
// Addresses: #/workout, #/workout/add (exercise picker open), #/workout/plans/…,
//            #/workout/exercises[/<exercise id>] (the exercise library),
//            #/workout/activity (log a run, a swim…), #/workout/swap/<entry id>
export default function WorkoutScreen({ path }) {
  const { activeWorkout } = useData();
  if (path[0] === 'plans') return <PlansScreen path={path.slice(1)} />;
  if (path[0] === 'activity') return <ActivityForm />;
  if (path[0] === 'exercises') return path[1] ? <ExerciseDetail key={path[1]} exerciseId={path[1]} /> : <ExerciseLibrary />;
  if (!activeWorkout) return <StartWorkout />;
  return <ActiveWorkout workout={activeWorkout} picking={path[0] === 'add'} swapping={path[0] === 'swap' ? path[1] : null} />;
}
