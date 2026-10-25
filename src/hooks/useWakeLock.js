import { useEffect } from 'react';

// Keeps the screen on while `active` (Screen Wake Lock: Android Chrome,
// iPhone Safari 16.4+). The phone drops the lock when the app goes to the
// background, so it's asked for again when the app comes back.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let stopped = false;

    async function request() {
      try {
        if (document.visibilityState !== 'visible') return;
        lock = await navigator.wakeLock.request('screen');
        if (stopped) lock.release();
      } catch {
        // Not allowed right now (e.g. battery saver): just let the phone lock.
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
