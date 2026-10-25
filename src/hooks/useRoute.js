// Navigation using the part of the address after "#", e.g.
//   #/history            the History tab
//   #/history/abc123     one workout
//   #/workout/add        the exercise picker over the workout
// Because every screen has its own address, the phone's back button/gesture
// goes back to the previous screen instead of closing the app.
//
//   const { tab, path, go, switchTab, back } = useRoute();
//   tab:  'workout' | 'history' | 'progress' | 'settings'
//   path: the rest of the address, as a list: ['abc123', 'edit']

import { useEffect, useState } from 'react';

export const TABS = ['workout', 'history', 'progress', 'settings'];

function current() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const known = TABS.includes(parts[0]);
  return { tab: known ? parts[0] : 'workout', path: known ? parts.slice(1) : [] };
}

const toHash = (segments) => '#/' + segments.map(encodeURIComponent).join('/');
const notify = () => window.dispatchEvent(new Event('routechange'));

// Open a screen; the back button returns to the current one.
export function go(...segments) {
  history.pushState({ inApp: true }, '', toHash(segments));
  notify();
}

// Switch tabs without adding to the back history, so back from a tab
// leaves the app like in other apps.
export function switchTab(...segments) {
  history.replaceState(null, '', toHash(segments));
  notify();
}

// Back to the previous screen. If there is none inside the app (e.g. after
// reopening the app on a detail page), go to `fallback` instead.
export function back(...fallback) {
  if (history.state?.inApp) history.back();
  else switchTab(...fallback);
}

export function useRoute() {
  const [route, setRoute] = useState(current);

  useEffect(() => {
    const update = () => setRoute(current());
    const events = ['popstate', 'hashchange', 'routechange'];
    events.forEach((e) => window.addEventListener(e, update));
    return () => events.forEach((e) => window.removeEventListener(e, update));
  }, []);

  return { ...route, go, switchTab, back };
}
