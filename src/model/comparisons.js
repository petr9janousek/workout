// "That's about an Asian elephant": the total weight lifted, compared with
// something you can picture. Rough, rounded weights; it's for fun.

const THINGS = [
  [4, 'a cat', 'cats'],
  [30, 'a big dog', 'big dogs'],
  [70, 'a washing machine', 'washing machines'],
  [250, 'an upright piano', 'upright pianos'],
  [500, 'a horse', 'horses'],
  [700, 'a cow', 'cows'],
  [1000, 'a small car', 'small cars'],
  [1500, 'a hippo', 'hippos'],
  [2300, 'a rhino', 'rhinos'],
  [4000, 'an Asian elephant', 'Asian elephants'],
  [6000, 'an African elephant', 'African elephants'],
  [8000, 'a T. rex', 'T. rexes'],
  [12000, 'a city bus', 'city buses'],
  [30000, 'a humpback whale', 'humpback whales'],
  [40000, 'a loaded truck', 'loaded trucks'],
  [150000, 'a blue whale', 'blue whales'],
  [400000, 'a full jumbo jet', 'full jumbo jets'],
  [7300000, 'the Eiffel Tower', 'Eiffel Towers'],
].map(([kg, one, many]) => ({ kg, one, many }));

const LB_TO_KG = 0.4536;

// kg (or lb with unit 'lb') → "about a hippo", "almost a rhino",
// "about 3 cows"… or null when it's too little to compare.
export function weightComparison(amount, unit = 'kg') {
  const kg = unit === 'lb' ? amount * LB_TO_KG : amount;
  if (!(kg >= THINGS[0].kg)) return null;
  const i = THINGS.findLastIndex((t) => t.kg <= kg);
  const thing = THINGS[i];
  const next = THINGS[i + 1];
  const times = kg / thing.kg;
  if (times < 1.15) return `about ${thing.one}`;
  if (next && kg / next.kg >= 0.85) return `almost ${next.one}`;
  if (times >= 1.75) return `about ${Math.round(times)} ${thing.many}`;
  return `more than ${thing.one}`;
}
