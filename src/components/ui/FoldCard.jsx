import Icon from './Icon.jsx';
import CardTitle from './CardTitle.jsx';
import { useRemembered } from '../../hooks/useRemembered.js';

// A card that folds open and shut by tapping its title (like the muscle
// map). Open or shut is remembered on this phone, separately for each `id`.
//   <FoldCard id="all" title="All workouts" count={48}>…</FoldCard>
export default function FoldCard({ id, title, count, hint, defaultOpen = false, children }) {
  const [open, setOpen] = useRemembered(`fold.${id}.open`, defaultOpen);

  return (
    <section className="card fold-card">
      <CardTitle
        title={title}
        hint={hint}
        onTitleClick={() => setOpen(!open)}
        expanded={open}
        after={
          <span className="fold-after">
            {count != null && <span className="fold-count">{count}</span>}
            <span className={open ? 'chevron open' : 'chevron'}>
              <Icon name="chevron" size={18} />
            </span>
          </span>
        }
      />
      {open && <div className="fold-body">{children}</div>}
    </section>
  );
}
