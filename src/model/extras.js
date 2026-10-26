// Healthy extras: a short finisher at the end of each day of a plan, for the
// things muscle-building plans usually skip. Optional (on by default when you
// choose a ready-made plan), about 5–8 minutes, and easy to remove later.
//
//   core        supports the back and posture; helps with lower-back pain
//   grip        grip strength goes along with better health as people age
//   upper back  balances all the pushing; posture and shoulder health
//   balance     one-leg strength and balance; prevents falls later in life
//
// Each day gets one core exercise plus one from grip / upper back / balance,
// in turn, so a week covers all of them without repeating the same thing.

export const EXTRAS = {
  core: [['Plank', 2], ['Dead bug', 2], ['Side plank', 2], ['Pallof press', 2], ['Bird dog', 2]],
  grip: [['Dead hang', 2], ['Plate pinch hold', 2]],
  upperBack: [['Band pull-apart', 2], ['Face pull', 2], ['Shoulder external rotation', 2]],
  balance: [['Single-leg Romanian deadlift', 2], ['Step-up', 2]],
};
const ROTATION = ['grip', 'upperBack', 'balance'];

// The first exercise of `list` from position `start` on (wrapping round)
// that the day doesn't have yet.
function pick(list, start, taken) {
  for (let k = 0; k < list.length; k++) {
    const item = list[(start + k) % list.length];
    if (!taken.has(item[0].toLowerCase())) return item;
  }
  return null;
}

// A template (planTemplates.js) with the extras added to every day.
// Extra items carry a third value, true, so the plan can mark them.
export function withExtras(template) {
  const days = template.days.map(([name, items], i) => {
    const taken = new Set(items.map(([n]) => n.toLowerCase()));
    const category = ROTATION[i % ROTATION.length];
    const extra = [pick(EXTRAS.core, i, taken), pick(EXTRAS[category], Math.floor(i / ROTATION.length), taken)]
      .filter(Boolean)
      .map(([n, sets]) => [n, sets, true]);
    return [name, [...items, ...extra]];
  });
  return { ...template, days };
}
