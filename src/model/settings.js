// App settings and their defaults.
// Saved in the database as separate { key, value } records.

export const DEFAULT_SETTINGS = {
  unit: 'kg', // 'kg' | 'lb', only the label
  trackRpe: true, // show the RPE column when logging
  weightStep: 2.5, // how much heavier a "try heavier" suggestion is
  progression: 'double', // suggestion style, see PROGRESSION_MODES in progression.js
  lastBackup: null, // when a backup was last saved (ISO date text)
  activePlanId: null, // the plan shown on the start screen, see plans.js
  weeklyGoal: null, // training days a week to aim for; null = from the plan (see calendar.js)
};

export const WEIGHT_STEPS = [1, 1.25, 2.5, 5];

// [{ key, value }, …] from the database → { unit: 'kg', … } with defaults filled in.
export function settingsFromList(list = []) {
  const settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of list) if (key in DEFAULT_SETTINGS) settings[key] = value;
  return settings;
}

export const settingsToList = (settings) => Object.entries(settings).map(([key, value]) => ({ key, value }));
