import { useEffect } from 'react';

// A tiny burst of sparks, for a new personal record. Plays once when it
// appears; place it inside an element with position: relative.
const SPARKS = 12;

export default function Firework() {
  useEffect(() => {
    navigator.vibrate?.([40, 60, 40]); // a little double buzz (Android)
  }, []);

  return (
    <span className="firework" aria-hidden="true">
      {Array.from({ length: SPARKS }, (_, i) => (
        <i key={i} style={{ '--angle': `${(360 / SPARKS) * i}deg`, '--distance': `${i % 2 ? 22 : 30}px` }} />
      ))}
    </span>
  );
}
