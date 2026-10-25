import BodyMap from './BodyMap.jsx';
import Icon from '../ui/Icon.jsx';
import { useRemembered } from '../../hooks/useRemembered.js';

// A card with the body map that can be folded away.
// Folded or not is remembered on this phone, separately for each `id`.
export default function MuscleCard({ id, title, sets, scale, note }) {
  const [open, setOpen] = useRemembered(`muscleCard.${id}.open`, true);

  return (
    <section className="card muscle-card">
      <button className="muscle-card-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <h3>{title}</h3>
        <span className={open ? 'chevron open' : 'chevron'}>
          <Icon name="chevron" size={18} />
        </span>
      </button>
      {open && (
        <>
          {note && <p className="muted small">{note}</p>}
          <BodyMap sets={sets} scale={scale} />
        </>
      )}
    </section>
  );
}
