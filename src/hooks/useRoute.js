// Navigation using the part of the address after "#", e.g.
//   #/progress                     the Progress tab
//   #/progress/workout/abc123      one finished workout
//   #/home/add                     the exercise picker over the workout
// Because every screen has its own address, the phone's back button/gesture
// goes back to the previous screen instead of closing the app.
//
//   const { tab, path, go, switchTab, openTab, back } = useRoute();
//   tab:  'home' | 'progress' | 'plans' | 'exercises'
//   path: the rest of the address, as a list: ['workout', 'abc123']

import { useEffect, useState } from 'react';

export const TABS = ['home', 'progress', 'plans', 'exercises'];

// Addresses from before v0.12 (bookmarks, an app reopened on an old page).
function upgrade(parts) {
  const [first, ...rest] = parts;
  if (first === 'workout') return rest[0] === 'plans' || rest[0] === 'exercises' ? rest : ['home', ...rest];
  if (first === 'history') return rest.length ? ['progress', 'workout', ...rest] : ['progress'];
  if (first === 'settings') return ['home', 'settings'];
  return parts;
}

function current() {
  const parts = upgrade(location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent));
  const known = TABS.includes(parts[0]);
  return { tab: known ? parts[0] : 'home', path: known ? parts.slice(1) : [] };
}

const toHash = (segments) => '#/' + segments.map(encodeURIComponent).join('/');
const notify = () => window.dispatchEvent(new Event('routechange'));

// Each history entry remembers how deep it is: 0 = the first screen the app
// opened on, 1 = a tab opened with openTab(), and one more for every screen
// opened with go(). That's how openTab() knows how far back to go.
const levelNow = () => history.state?.level || 0;

// Go back to the history entry at `level`, then run `then`.
// If the phone doesn't go back for some reason, `then` still runs, so a tab
// tap always does something.
function backTo(level, then) {
  const steps = levelNow() - level;
  if (steps <= 0) return then();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener('popstate', finish);
    then();
  };
  window.addEventListener('popstate', finish);
  setTimeout(finish, 1000);
  history.go(-steps);
}

// Open a screen; the back button returns to the current one.
export function go(...segments) {
  history.pushState({ inApp: true, level: levelNow() + 1 }, '', toHash(segments));
  notify();
}

// Show a different screen in place of the current one (no new back step),
// e.g. a plan replacing the "new plan" steps that made it.
export function switchTab(...segments) {
  history.replaceState(history.state, '', toHash(segments));
  notify();
}

// The tab bar, like in Android apps: back from Progress, Plans or Exercises
// goes to Home; back from Home leaves the app.
// The back history is always just [Home] or [Home, other tab, …].
export function openTab(tab, ...rest) {
  if (tab === 'home') {
    backTo(0, () => switchTab('home', ...rest));
    return;
  }
  if (levelNow() === 0) {
    history.replaceState({ level: 0 }, '', toHash(['home']));
    history.pushState({ inApp: true, level: 1 }, '', toHash([tab, ...rest]));
    notify();
    return;
  }
  backTo(1, () => switchTab(tab, ...rest));
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

  return { ...route, go, switchTab, openTab, back };
}
