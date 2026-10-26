// Anonymous counts for the GoatCounter dashboard (see index.html).
// Only "something happened" goes out, never what: no names, weights or dates.
// Offline, or if the script is blocked, nothing is sent and nothing breaks.
//
// Events:
//   first-open        a new phone opened the app for the first time (new users)
//   workout-finished  someone finished a workout (is it actually used?)

export function countEvent(name, title = name, tries = 10) {
  try {
    if (window.goatcounter?.count) {
      window.goatcounter.count({ path: name, title, event: true });
    } else if (tries > 0) {
      // The counter script loads in the background; wait for it a little.
      setTimeout(() => countEvent(name, title, tries - 1), 1000);
    }
  } catch {
    // Counting must never break the app.
  }
}
