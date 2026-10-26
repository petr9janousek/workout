import { useState } from 'react';

// A card's title with an optional "?" that shows an explanation underneath.
//   <CardTitle title="Body weight" hint="Weigh at the same time of day…" />
//   onTitleClick + after: make the title itself a button (e.g. fold a card)
export default function CardTitle({ title, hint, onTitleClick, after, expanded }) {
  const [open, setOpen] = useState(false);
  const heading = <h3>{title}</h3>;

  return (
    <>
      <div className="card-title">
        {onTitleClick ? (
          <button className="card-title-main" onClick={onTitleClick} aria-expanded={expanded}>
            {heading}
            {after}
          </button>
        ) : (
          <div className="card-title-main">
            {heading}
            {after}
          </div>
        )}
        {hint && <HintButton open={open} onToggle={() => setOpen(!open)} about={title} />}
      </div>
      {hint && open && <p className="hint-text">{hint}</p>}
    </>
  );
}

// The round "?" button itself, for places that show the text themselves.
export function HintButton({ open, onToggle, about }) {
  return (
    <button className={open ? 'hint-btn open' : 'hint-btn'} onClick={onToggle} aria-expanded={open} aria-label={`About ${about}`}>
      ?
    </button>
  );
}
