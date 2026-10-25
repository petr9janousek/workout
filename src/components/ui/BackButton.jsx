import Icon from './Icon.jsx';
import { back, switchTab } from '../../hooks/useRoute.js';

// "‹ History": goes back, or to `fallback` (e.g. ['history']) if the app was
// opened directly on this page.
// to: always go to this address instead of back (for pages reached through a
//     multi-step flow, where "back" would replay the steps).
export default function BackButton({ label, fallback, to }) {
  return (
    <button className="back" onClick={() => (to ? switchTab(...to) : back(...fallback))}>
      <Icon name="back" size={18} /> {label}
    </button>
  );
}
