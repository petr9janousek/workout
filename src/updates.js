// App updates, without a button and without interrupting anyone.
//
// How a PWA updates: the phone downloads the new version in the background
// (the service worker), but the open app keeps running the old code until it
// reloads. iPhones often resume the app from the background instead of
// restarting it, so without help people can stay on an old version for days.
//
// What we do: check for a new version whenever the app comes to the front,
// and once one is downloaded, switch to it at a moment nobody notices:
//   - right away if the app was opened in the last few seconds, or
//   - the next time the app goes to the background (phone locked, other app).
//
// An update only replaces the app's code. Workouts live in the phone's
// database and stay untouched; every change is saved the moment you make it,
// so even reloading in the middle of a workout loses nothing.

import { registerSW } from 'virtual:pwa-register';

const JUST_OPENED_MS = 4000;

export function startUpdates() {
  if (!('serviceWorker' in navigator)) return;
  const openedAt = Date.now();
  let ready = false;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      ready = true;
      if (Date.now() - openedAt < JUST_OPENED_MS) apply();
    },
    onRegisteredSW(_url, registration) {
      // Look for a new version each time the app comes back to the front.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration?.update().catch(() => {});
      });
    },
  });

  function apply() {
    ready = false;
    updateSW(true); // activate the new version and reload
  }

  document.addEventListener('visibilitychange', () => {
    if (ready && document.visibilityState === 'hidden') apply();
  });
}
