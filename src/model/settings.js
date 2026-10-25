// App settings and their defaults.
// Saved in the database as separate { key, value } records.

export const DEFAULT_SETTINGS = {
  unit: 'kg', // 'kg' | 'lb', only the label
  trackRpe: true, // show the RPE column when logging
  weightStep: 'auto', // how much heavier a "try heavier" suggestion is: 'auto' or a number, see weightStepFor()
  progression: 'double', // suggestion style, see PROGRESSION_MODES in progression.js
  lastBackup: null, // when a backup was last saved (ISO date text)
  activePlanId: null, // the plan shown on the start screen, see plans.js
  weeklyGoal: null, // training days a week to aim for; null = from the plan (see calendar.js)
  body: null, // 'female' | 'male' | null: the body drawing, recommended plans, default rest
  restSeconds: null, // rest between sets to aim for; null = automatic, see restTarget()
};

export const WEIGHT_STEPS = ['auto', 1, 1.25, 2.5, 5];
export const REST_OPTIONS = [null, 60, 90, 120, 180];

// Rest between sets. Women recover faster between sets than men at the same
// effort (they are more fatigue resistant), so the automatic target is shorter.
export const restTarget = (settings) => settings.restSeconds ?? (settings.body === 'female' ? 90 : 120);

// How much heavier (or lighter) a suggestion is, for a set at `weight`.
// A fixed step, or 'auto': a jump that suits the weight. +2.5 kg is a 4% jump
// on a 60 kg squat but 60% on 4 kg dumbbells, so light lifts get small jumps,
// matching what gyms have (light dumbbells go up by 1 kg, heavier by 2 kg,
// barbells by 2.5 kg plates). Edit the tables to taste: [below this weight, jump]
const AUTO_STEPS = {
  kg: [[10, 1], [25, 2], [80, 2.5], [Infinity, 5]],
  lb: [[25, 2.5], [150, 5], [Infinity, 10]],
};
// Assisted exercises use the size of the assistance (−20 kg → ±2).
export function weightStepFor(weight, { weightStep = 'auto', unit = 'kg' } = {}) {
  if (typeof weightStep === 'number') return weightStep;
  const w = Math.abs(weight || 0);
  return (AUTO_STEPS[unit] || AUTO_STEPS.kg).find(([below]) => w < below)[1];
}

// Settings for one exercise: its own weight jump (set in the exercise library)
// wins over the general one.
export const settingsFor = (settings, exercise) =>
  exercise?.weightStep ? { ...settings, weightStep: exercise.weightStep } : settings;

// [{ key, value }, …] from the database → { unit: 'kg', … } with defaults filled in.
export function settingsFromList(list = []) {
  const settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of list) if (key in DEFAULT_SETTINGS) settings[key] = value;
  return settings;
}

export const settingsToList = (settings) => Object.entries(settings).map(([key, value]) => ({ key, value }));
