import PlanList from './PlanList.jsx';
import PlanLibrary from './PlanLibrary.jsx';
import NewPlan from './NewPlan.jsx';
import PlanOverview from './PlanOverview.jsx';
import DayEditor from './DayEditor.jsx';

// The Plans tab. Addresses (after #/plans):
//   (nothing)                 your plans, and ways to get a new one
//   library[/<days>]          ready-made plans, optionally only for that many days a week
//   new                       a plan of your own: name it and its days
//   <plan id>                 one plan: its days and weekly muscle balance
//   <plan id>/<day id>[/add]  planning one day (add = exercise picker open)
export default function PlansScreen({ path }) {
  const [first, second, third] = path;
  if (!first) return <PlanList />;
  if (first === 'library') return <PlanLibrary days={Number(second) || null} />;
  if (first === 'new') return <NewPlan />;
  if (second) return <DayEditor planId={first} dayId={second} picking={third === 'add'} />;
  return <PlanOverview planId={first} />;
}
