import { useState } from 'react';

// Like useState, but remembered on this phone between visits (localStorage).
// For small conveniences only (e.g. a folded card); real data goes in the database.
export function useRemembered(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? initial : JSON.parse(saved);
    } catch {
      return initial;
    }
  });

  function update(next) {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode…): just don't remember.
    }
  }

  return [value, update];
}
