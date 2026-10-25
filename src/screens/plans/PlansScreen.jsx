import PlanList from './PlanList.jsx';
import NewPlan from './NewPlan.jsx';
import PlanOverview from './PlanOverview.jsx';
import DayEditor from './DayEditor.jsx';

// Plans, inside the Workout tab. Addresses (after #/workout/plans):
//   (nothing)               your plans
//   new[/<days>[/own]]      making a new plan: how many days → a split or your own names
//   <plan id>               one plan: its days and weekly muscle balance
//   <plan id>/<day id>[/add] planning one day (add = exercise picker open)
export default function PlansScreen({ path }) {
  const [first, second, third] = path;
  if (!first) return <PlanList />;
  if (first === 'new') return <NewPlan days={Number(second) || null} own={third === 'own'} />;
  if (second) return <DayEditor planId={first} dayId={second} picking={third === 'add'} />;
  return <PlanOverview planId={first} />;
}
