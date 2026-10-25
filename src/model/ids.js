// A unique id for exercises, workouts, entries and sets.
// (crypto.randomUUID only exists on https and localhost, hence the fallback
// for testing on the local network over plain http.)
export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
