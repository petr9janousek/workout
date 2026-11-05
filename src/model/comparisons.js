// "That's about Michelangelo's David": the total weight lifted in a workout,
// compared with one famous heavy thing you could picture on a crane hook,
// the kind that makes you think "wait, that weighs that much?". Rough,
// rounded weights; it's for fun.
//
// A whole workout is usually somewhere between 1 and 30 tonnes (a short or
// light session less, a big leg day more), so the list covers that with a
// step every ×1.1–1.5. Below 1 tonne it says nothing.

const THINGS = [
  [900, 'the Curiosity Mars rover'],
  [1250, 'a Mini Cooper'],
  [1575, 'a Lamborghini Aventador'],
  [2300, 'a Spitfire'],
  [2500, 'a Mercedes-Benz G-Class'],
  [3200, "Wall Street's Charging Bull"],
  [4800, 'a Black Hawk helicopter'],
  [5700, "Michelangelo's David"],
  [8600, 'an F-16 fighter jet'],
  [11100, 'the Hubble Space Telescope'],
  [12500, 'an Easter Island head'],
  [16000, "the Titanic's anchor"],
  [19300, 'a cubic metre of gold'],
  [25000, 'a Stonehenge stone'],
  [30000, 'a Sherman tank'],
  [41000, 'an empty Boeing 737'],
].map(([kg, name]) => ({ kg, name }));

const FROM = 1000; // less says nothing
const CLOSE = 0.1; // within 10% counts as "about" / "almost"

// kg → "about a hippo", "almost an orca", "heavier than Big Ben's bell"…
// or null below a tonne.
export function weightComparison(kg) {
  if (!(kg >= FROM)) return null;
  const below = THINGS.findLast((t) => t.kg <= kg);
  const above = THINGS.find((t) => t.kg > kg);
  if (kg <= below.kg * (1 + CLOSE)) return `about ${below.name}`;
  if (above && kg >= above.kg * (1 - CLOSE)) return `almost ${above.name}`;
  return `heavier than ${below.name}`;
}
