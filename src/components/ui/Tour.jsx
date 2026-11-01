import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../data/DataProvider.jsx';

// A short walkthrough over the real screen: the page dims, one thing on it
// stays lit, and a bubble next to it says what it is. Next / Skip.
// Shown once per `id` (remembered in settings.toursSeen; Settings can show
// them again). Steps whose thing isn't on the screen are left out.
//   <Tour id="home" steps={[{ target: '.plan-hero', text: 'Your next workout…' }]} />
//
// A step with `tap: true` asks you to tap the lit thing itself (a tab): it
// works, this page's part ends, and the next page's part begins. That's how
// one tour goes Home → Progress → Plans → Exercises (TOUR_PAGES).
// Skip ends the whole tour, not just this page's part.
export const TOUR_PAGES = ['home', 'progress', 'plans', 'exercises'];

export default function Tour({ id, steps }) {
  const { settings, actions } = useData();
  const seen = settings.toursSeen.includes(id);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState(null); // the lit area, in screen pixels

  // Only the steps with something to point at, once the screen is drawn.
  const [shown, setShown] = useState(null);
  useLayoutEffect(() => {
    if (!seen) setShown(steps.filter((s) => document.querySelector(s.target)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const step = shown?.[index];

  const done = (ids) => actions.setSetting('toursSeen', [...new Set([...settings.toursSeen, ...ids])]);
  const finish = () => done([id]);
  const skip = () => done(TOUR_PAGES.includes(id) ? TOUR_PAGES : [id]);

  // Bring the thing into view, then light it (again on scroll or resize).
  useLayoutEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  // A tap step: tapping the thing itself ends this page's part.
  useEffect(() => {
    if (!step?.tap) return;
    const el = document.querySelector(step.target);
    el?.addEventListener('click', finish);
    return () => el?.removeEventListener('click', finish);
  });

  if (seen || !step || !box) return null;
  const last = index === shown.length - 1;

  // The bubble goes under the lit thing or above it, where there's room;
  // if it's too tall for either (a big card), the bubble sits at the bottom
  // of the screen, over it. Either way the buttons are always on screen.
  const room = 190;
  const vh = window.innerHeight;
  const place =
    vh - (box.top + box.height) >= room ? { top: box.top + box.height + 12 }
    : box.top >= room ? { bottom: vh - box.top + 12 }
    : { bottom: 'calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 12px)' };

  // Taps are caught everywhere but the bubble, and the lit thing of a tap step.
  const { top, left, width, height } = box;
  const shields = step.tap
    ? [
        { top: 0, left: 0, right: 0, height: Math.max(0, top) },
        { top: top + height, left: 0, right: 0, bottom: 0 },
        { top, left: 0, width: Math.max(0, left), height },
        { top, left: left + width, right: 0, height },
      ]
    : [{ inset: 0 }];

  return createPortal(
    <div className="tour" role="dialog" aria-modal="true" aria-label="Walkthrough">
      {shields.map((style, i) => <div key={i} className="tour-shield" style={style} />)}
      <div className={step.tap ? 'tour-hole tap' : 'tour-hole'} style={box} />
      <div className="tour-bubble" style={place}>
        <p>{step.text}</p>
        <div className="tour-actions">
          <span className="muted small">{index + 1} of {shown.length}</span>
          {(step.tap || !last) && <button className="btn-text small-link muted tour-skip" onClick={skip}>Skip</button>}
          {!step.tap && (
            <button className="btn btn-primary" onClick={() => (last ? finish() : setIndex(index + 1))}>{last ? 'Got it' : 'Next'}</button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
