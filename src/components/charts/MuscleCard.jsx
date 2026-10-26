import BodyMap from './BodyMap.jsx';
import Icon from '../ui/Icon.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import { useRemembered } from '../../hooks/useRemembered.js';

// A card with the body map that can be folded away (tap the title).
// Folded or not is remembered on this phone, separately for each `id`.
// note: the explanation behind the "?".
export default function MuscleCard({ id, title, sets, scale, note }) {
  const [open, setOpen] = useRemembered(`muscleCard.${id}.open`, true);

  return (
    <section className="card muscle-card">
      <CardTitle
        title={title}
        hint={note}
        onTitleClick={() => setOpen(!open)}
        expanded={open}
        after={
          <span className={open ? 'chevron open' : 'chevron'}>
            <Icon name="chevron" size={18} />
          </span>
        }
      />
      {open && <BodyMap sets={sets} scale={scale} />}
    </section>
  );
}
