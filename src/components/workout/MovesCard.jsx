import CardTitle from '../ui/CardTitle.jsx';
import Icon from '../ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { go } from '../../hooks/useRoute.js';
import { plannedMuscleSets } from '../../model/muscles.js';
import { warmUpFor, stretchesFor, doseOf, minutesFor } from '../../model/warmup.js';

// The "?" texts, also used in Settings (in a workout they also say where Settings is).
export const WARMUP_HINT =
  "Five minutes of easy cardio, then three moves for the muscles in today's workout. Studies find warming up helps " +
  'strength and power, with hardly any downside. Before a heavy lift, one or two lighter sets of it help too.';
const SETTINGS_NOTE = 'You can change this in Settings (at the bottom of Home).';
export const STRETCH_HINT =
  'A few stretches for the muscles you trained, at the end. Quick: 4 stretches, 30 s each (about 5 min). Thorough: ' +
  'each held twice, plus hips and upper back (about 12 min). Done regularly, stretching makes you more flexible, ' +
  'but it does little for soreness. Lifting through the full range of motion improves mobility too.';

// A checklist in the workout in progress: the warm-up at the top
// (part="warmup") or the stretches at the end (part="stretch"), picked from
// the workout's muscles (warmup.js). Tick each one off, or skip it for
// today; the ticks live on the workout until it's finished. When everything
// is ticked, the card shrinks to one line.
// settings, exercisesById: whose to use (default: the current page's); a
// partner taking turns shows your checklist, so both pages line up.
export default function MovesCard({ part, workout, onChange, ...yours }) {
  const data = useData();
  const { settings, exercisesById } = { ...data, ...yours };
  const size = settings.stretching;
  const on = part === 'warmup' ? settings.warmUp : size !== 'off';
  const done = workout.movesDone || [];
  if (!on || workout.movesSkipped?.includes(part)) return null;

  const load = plannedMuscleSets(workout, exercisesById);
  const moves = part === 'warmup' ? warmUpFor(load) : stretchesFor(load, size);
  const title = part === 'warmup' ? 'Warm-up' : 'Stretching';

  if (moves.every((m) => done.includes(m.id))) {
    return (
      <p className={`moves-done ${part}`}>
        <Icon name="check" size={18} /> {title} done
      </p>
    );
  }

  const toggle = (id) => onChange({ ...workout, movesDone: done.includes(id) ? done.filter((x) => x !== id) : [...done, id] });
  const skip = () => onChange({ ...workout, movesSkipped: [...(workout.movesSkipped || []), part] });

  return (
    <section className={`card moves-card ${part}`}>
      <CardTitle
        title={title}
        hint={`${part === 'warmup' ? WARMUP_HINT : STRETCH_HINT} ${SETTINGS_NOTE}`}
        after={<span className="fold-count">about {minutesFor(moves, size)} min</span>}
      />
      <ul className="moves">
        {moves.map((m) => {
          const ticked = done.includes(m.id);
          return (
            <li key={m.id} className={ticked ? 'move done' : 'move'}>
              <button className="move-name" onClick={() => go('home', 'move', m.id)}>
                <strong>{m.name}</strong>
                <span className="muted small">{doseOf(m, size)}</span>
              </button>
              <button className={ticked ? 'check-btn done' : 'check-btn'} onClick={() => toggle(m.id)} aria-label={ticked ? `Undo ${m.name}` : `${m.name} done`}>
                <Icon name="check" size={20} />
              </button>
            </li>
          );
        })}
      </ul>
      <button className="btn-text small-link muted moves-skip" onClick={skip}>
        Skip {part === 'warmup' ? 'the warm-up' : 'stretching'} today
      </button>
    </section>
  );
}
