import { useData } from '../data/DataProvider.jsx';
import { openTab } from './useRoute.js';

// Start a workout from another screen (a plan day, a recent one to repeat)
// and show it on Home. One workout at a time: if one is running, say so.
//   const start = useStartWorkout();
//   start(() => actions.startPlanDay(plan, day));
export function useStartWorkout() {
  const { activeWorkout } = useData();
  return (begin) => {
    if (activeWorkout) {
      alert('Finish or discard the workout in progress first.');
      return;
    }
    begin();
    openTab('home');
  };
}
