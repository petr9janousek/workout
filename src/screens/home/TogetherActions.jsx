import Icon from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { useRemembered } from '../../hooks/useRemembered.js';
import { go, openTab } from '../../hooks/useRoute.js';

// "Train together" on Home, under the Start button (partner.js): it folds
// open into the three things you can do, all for the day chosen above.
//   Start together: start it here and add your partner (scan or a name)
//   Show my code:   your sets are logged on their phone
//   Get my workout: afterwards, from their phone
// plan, day: the day chosen on Home, or none (an empty workout).
export default function TogetherActions({ plan = null, day = null }) {
  const { actions } = useData();
  const [open, setOpen] = useRemembered('home.together.open', false);

  function start() {
    if (day) actions.startPlanDay(plan, day);
    else actions.startWorkout();
    openTab('home', 'partner'); // back from there is the workout
  }

  return (
    <div className={open ? 'together-actions open' : 'together-actions'}>
      <button className="together-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="people" size={18} /> Train together
        <span className={open ? 'chevron down open' : 'chevron down'}>
          <Icon name="down" size={16} />
        </span>
      </button>
      {open && (
        <div className="together-list">
          <button className="together-item" onClick={start}>
            <strong>Start together</strong>
            <span className="muted small">This phone logs you both. Scan their code or type a name.</span>
          </button>
          <button className="together-item" onClick={() => go('home', 'together', 'code', day?.id ?? 'none')}>
            <strong>Show my code</strong>
            <span className="muted small">
              {day ? `Their phone logs your ${day.name}, with your weights.` : 'Their phone logs you; you follow their workout.'}
            </span>
          </button>
          <button className="together-item" onClick={() => go('home', 'together', 'get')}>
            <strong>Get my workout</strong>
            <span className="muted small">After training on their phone: scan their code.</span>
          </button>
        </div>
      )}
    </div>
  );
}
