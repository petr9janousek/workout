import { useState } from 'react';
import BodyMap from './BodyMap.jsx';
import Icon from './Icon.jsx';

// A card with the body map that can be folded away.
// The open/closed state is remembered on this phone (per `id`).
export default function MuscleCard({ id, title, sets, scale, note }) {
  const storageKey = `muscle-card-${id}`;
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== 'closed';
    } catch {
      return true;
    }
  });

  function toggle() {
    setOpen(!open);
    try {
      localStorage.setItem(storageKey, open ? 'closed' : 'open');
    } catch {
      // storage unavailable: just don't remember
    }
  }

  return (
    <section className="card muscle-card">
      <button className="muscle-card-header" onClick={toggle} aria-expanded={open}>
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
