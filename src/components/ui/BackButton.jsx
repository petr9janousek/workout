import Icon from './Icon.jsx';
import { back } from '../../hooks/useRoute.js';

// "‹ History": goes back, or to `fallback` (e.g. ['history']) if the app was
// opened directly on this page.
export default function BackButton({ label, fallback }) {
  return (
    <button className="back" onClick={() => back(...fallback)}>
      <Icon name="back" size={18} /> {label}
    </button>
  );
}
