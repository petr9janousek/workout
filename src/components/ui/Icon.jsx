// Simple line icons drawn with SVG, so they look the same on every phone.
import { SPORT_ICONS } from './sportIcons.js';
const PATHS = {
  workout: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12',
  history: 'M4 6h16M4 12h16M4 18h10',
  progress: 'M4 19l5-6 4 3 7-9M14 7h6v6',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  check: 'M5 12l5 5L19 7',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 18l-6-6 6-6',
  chevron: 'M9 6l6 6-6 6',
  up: 'M6 15l6-6 6 6',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  plan: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4',
  down: 'M6 9l6 6 6-6',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9.5 17h5',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  home: 'M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5',
  timer: 'M12 9v4l2.5 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9.5 2.5h5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  play: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 8.5v7l6-3.5z',
  exercises: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12',
  plans: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4',
};

// name: one of PATHS above. paths: draw these instead (e.g. a sport icon).
export default function Icon({ name, paths, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {[].concat(paths ?? PATHS[name]).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// The icon for an activity type (activities.js), e.g. <SportIcon type="run" />.
export const SportIcon = ({ type, size = 22 }) => <Icon paths={SPORT_ICONS[type] || SPORT_ICONS.other} size={size} />;
