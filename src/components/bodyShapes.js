// Shapes for the muscle map, as SVG paths (an original, simplified figure).
//
// Each figure is 120 × 216 units, centered on x = 60. Only the left half is
// written out; BodyMap.jsx mirrors it to draw the right half.
// `muscle` links a shape to an id in muscles.js; null = skin (not a muscle).

const HEAD = 'M60,3.5 C66,3.5 69.5,8.5 69.5,15 C69.5,22 65.5,26.5 60,26.5 C54.5,26.5 50.5,22 50.5,15 C50.5,8.5 54,3.5 60,3.5 Z';

// Half-figure shapes (x ≤ 60)
const NECK = 'M55.5,24 L60,25 L60,36 L54,35 Z';
const HAND = 'M27.5,111 Q22,113 22,121 Q24,127 28.5,124.5 Q31.5,118 30.5,111 Z';
const FOOT = 'M46,197 Q44,203 46,206.5 L56,206.5 Q57.5,201 55,197 Z';
const KNEE = 'M46.5,149 Q45.5,155 47.5,158 L55,158 Q56,153 55,149 Z';
const FOREARM = 'M30,88 Q26,94 23.5,108.5 L29.5,110 Q34,100 35.5,89 Z';
const UPPER_ARM = 'M35.5,61 Q30,63 29,72 Q28.5,80 30,85.5 L35.5,85.5 Q38.5,76 38,64 Z';
const DELT = 'M42,37.5 Q34,37 30,44.5 Q28,52 30,59.5 L35.5,59 Q38,50 46.5,40.5 Z';

export const FRONT = [
  { muscle: null, d: NECK },
  { muscle: null, d: HAND },
  { muscle: null, d: KNEE },
  { muscle: null, d: FOOT },
  { muscle: null, d: 'M60,100.5 L53,99.5 Q50,101 56.5,104 L59.5,106 Z' }, // groin
  { muscle: 'traps', d: 'M55,31 Q48,35 41,38 L54.5,38.5 Z' },
  { muscle: 'shoulders', d: DELT },
  { muscle: 'chest', d: 'M59.5,40 L47.5,40 Q39.5,45 38.5,53 Q40,61 50,62.5 Q56,62.5 59.5,60.5 Z' },
  { muscle: 'biceps', d: UPPER_ARM },
  { muscle: 'forearms', d: FOREARM },
  { muscle: 'abs', d: 'M59.5,64 L53,65 Q51.5,82 52.5,98 L59.5,100.5 Z' },
  { muscle: 'obliques', d: 'M51.5,64.5 L41,62.5 Q39.5,72 41.5,84 Q44.5,95 51,99 Q50,82 51.5,64.5 Z' },
  { muscle: 'quads', d: 'M54.5,103.5 Q49,100.5 44,105 Q40.5,120 43,137 Q44.5,145 47,147.5 L55,147.5 Q54.5,141 55,137 Q53.5,120 54.5,103.5 Z' },
  { muscle: 'adductors', d: 'M59.5,108 L56,104.5 Q54.8,120 56,135 Q59.5,124 59.5,108 Z' },
  { muscle: 'calves', d: 'M46.5,159.5 Q44,172 46,188 L48.5,195.5 L54,195.5 Q56.5,178 55,159.5 Z' },
];

// Thin lines drawn over the muscles for detail (six-pack, chest line).
export const FRONT_LINES = [
  'M52.5,73.5 L59.5,73', 'M52.3,82.5 L59.5,82', 'M52.6,91 L59.5,90.5',
];

export const BACK = [
  { muscle: null, d: NECK },
  { muscle: null, d: HAND },
  { muscle: null, d: KNEE },
  { muscle: null, d: FOOT },
  { muscle: 'traps', d: 'M59.5,27 L55,29 Q48,35 40,38.5 L49,44 Q54,52 59.5,66 Z' },
  { muscle: 'rearDelts', d: DELT },
  { muscle: 'lats', d: 'M48.5,46 L40.5,43 Q38,56 42,72 Q47,84 55,90 L56.5,74 Q52,60 48.5,46 Z' },
  { muscle: 'triceps', d: UPPER_ARM },
  { muscle: 'forearms', d: FOREARM },
  { muscle: 'lowerBack', d: 'M59.5,68 L56,72 Q54.5,85 54,97 L59.5,99 Z' },
  { muscle: 'obliques', d: 'M41.5,73 Q42,86 47,94 L53,97 Q53.5,88 55,90 Q47,84 41.5,73 Z' },
  { muscle: 'glutes', d: 'M59.5,101 L53,99 Q44,100 43,111 Q44,122 52,124 Q57.5,123.5 59.5,119 Z' },
  { muscle: 'hamstrings', d: 'M55.5,126.5 Q50,127.5 44.5,125 Q41.5,138 45.5,148 L55,148 Q54.2,138 55.5,126.5 Z' },
  { muscle: 'adductors', d: 'M59.5,124.5 L56.5,126.5 Q55.2,136 56,143 Q59.5,134 59.5,124.5 Z' },
  { muscle: 'calves', d: 'M46.5,159.5 Q41.5,167 43.5,180 Q46.5,191 51.5,191 Q57,179 55,159.5 Z' },
];

export const BACK_LINES = [];

export { HEAD };
