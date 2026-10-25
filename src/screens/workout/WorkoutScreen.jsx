import { useData } from '../../data/DataProvider.jsx';
import StartWorkout from './StartWorkout.jsx';
import ActiveWorkout from './ActiveWorkout.jsx';

// The Workout tab: the workout in progress, or the start screen.
// Addresses: #/workout, #/workout/add (exercise picker open)
export default function WorkoutScreen({ path }) {
  const { activeWorkout } = useData();
  return activeWorkout ? <ActiveWorkout workout={activeWorkout} picking={path[0] === 'add'} /> : <StartWorkout />;
}
