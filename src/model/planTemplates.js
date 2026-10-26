// Ready-made plans to start from. Every one can be edited after.
//
// Built on what the research agrees on:
//  - What matters most is hard sets per muscle per week. These plans aim for
//    about 10 for each main muscle (chest, back, shoulders, quads, hamstrings,
//    glutes): enough to grow, and sustainable. Want more? Add sets.
//  - How the sets are spread over the week matters little, so more days
//    simply means shorter sessions: 2 days ≈ 65 min, 3 ≈ 50, 4 ≈ 45, 6 ≈ 35.
//  - Training a muscle about twice a week is a small advantage over once.
//  - WHO: strength training for all major muscles on at least 2 days a week.
//
// `focus` shifts sets towards the muscles that shape a look (more: up to
// ~25 a week) and away from others (less: a few sets, still trained).
// `light`: deliberately less than 10 (the health minimum).
// Glutes get counted from every squat, lunge and hip hinge, so they run a
// little higher everywhere.
//
// Exercises are referred to by name; missing ones are created when the plan
// is chosen (type and muscles are guessed from the name).
// Each item: [exercise name, number of sets]. Core and grip work come from
// the optional healthy extras (extras.js), not from here.

export const PLAN_TEMPLATES = [
  // ---- 2 days ----
  {
    id: 'healthy-2',
    name: 'Healthy basics',
    light: true,
    level: 'Beginner',
    about: 'The minimum the WHO recommends for health: every major muscle, twice a week, in two short sessions. About half the sets of the other plans, so it keeps you strong rather than building a lot.',
    days: [
      ['Full body A', [['Squat', 3], ['Bench press', 3], ['Seated cable row', 3], ['Romanian deadlift', 2]]],
      ['Full body B', [['Leg press', 3], ['Overhead press', 2], ['Lat pulldown', 3], ['Hip thrust', 2], ['Push-up', 2]]],
    ],
  },
  {
    id: 'full-body-2',
    name: 'Full body 2×',
    level: 'Beginner – intermediate',
    about: 'Everything twice a week in two longer sessions. The best way to get the full amount of training from only two days.',
    days: [
      ['Full body A', [['Squat', 4], ['Bench press', 4], ['Lat pulldown', 4], ['Romanian deadlift', 3], ['Overhead press', 3], ['Seated cable row', 3]]],
      ['Full body B', [['Leg press', 4], ['Incline dumbbell press', 4], ['Pull-up', 3], ['Leg curl', 4], ['Hip thrust', 3], ['Lateral raise', 3]]],
    ],
  },
  {
    id: 'push-pull-2',
    name: 'Push / Pull 2×',
    level: 'Beginner – intermediate',
    about: 'Two long days: everything that pushes (chest, shoulders, triceps, quads), then everything that pulls (back, biceps, hamstrings, glutes). Each muscle once a week with more sets.',
    days: [
      ['Push', [['Squat', 4], ['Bench press', 4], ['Leg press', 4], ['Incline dumbbell press', 4], ['Overhead press', 2], ['Lateral raise', 3], ['Triceps pushdown', 2]]],
      ['Pull', [['Romanian deadlift', 4], ['Pull-up', 4], ['Seated cable row', 4], ['Leg curl', 4], ['Hip thrust', 3], ['Dumbbell curl', 2]]],
    ],
  },
  // ---- 3 days ----
  {
    id: 'full-body-3',
    name: 'Full body',
    level: 'Beginner',
    about: 'Every muscle three times a week with a few sets each time. The classic way to start, and easy to fit in.',
    days: [
      ['Full body A', [['Squat', 3], ['Bench press', 3], ['Barbell row', 3], ['Romanian deadlift', 3], ['Lateral raise', 2], ['Dumbbell curl', 2]]],
      ['Full body B', [['Deadlift', 2], ['Overhead press', 3], ['Lat pulldown', 3], ['Leg press', 3], ['Incline dumbbell press', 2], ['Triceps pushdown', 2]]],
      ['Full body C', [['Bulgarian split squat', 3], ['Incline dumbbell press', 3], ['Seated cable row', 3], ['Leg curl', 3], ['Lateral raise', 2], ['Calf raise', 2]]],
    ],
  },
  {
    id: 'ppl-3',
    name: 'Push / Pull / Legs',
    level: 'Beginner – intermediate',
    about: 'Pushing muscles, pulling muscles, then legs. Each muscle once a week with more sets per session.',
    days: [
      ['Push', [['Bench press', 4], ['Incline dumbbell press', 4], ['Overhead press', 3], ['Lateral raise', 3], ['Triceps pushdown', 3]]],
      ['Pull', [['Pull-up', 4], ['Barbell row', 3], ['Seated cable row', 3], ['Face pull', 3], ['Dumbbell curl', 3]]],
      ['Legs', [['Squat', 4], ['Romanian deadlift', 4], ['Leg press', 4], ['Leg curl', 4], ['Calf raise', 3]]],
    ],
  },
  {
    id: 'hourglass-3',
    name: 'Hourglass',
    for: 'female',
    focus: { more: ['glutes', 'shoulders'], less: ['quads'] },
    level: 'Beginner – intermediate',
    about: 'Glutes and shoulders on every day, a strong back, and only light work for the thighs (no squats or leg press). Rounder glutes and shoulders make the waist look narrower between them.',
    days: [
      ['Glutes & back', [['Hip thrust', 4], ['Romanian deadlift', 3], ['Lat pulldown', 3], ['Seated cable row', 3], ['Lateral raise', 3], ['Cable fly', 2]]],
      ['Shoulders & glutes', [['Bulgarian split squat', 3], ['Glute kickback', 3], ['Dumbbell shoulder press', 3], ['Incline dumbbell press', 3], ['Lateral raise', 3]]],
      ['Glutes & upper', [['Hip thrust', 3], ['Cable pull-through', 3], ['Assisted pull-up', 3], ['Push-up', 3], ['Lateral raise', 2], ['Hip abduction', 2]]],
    ],
  },
  {
    id: 'v-taper-3',
    name: 'V-taper',
    for: 'male',
    focus: { more: ['lats', 'shoulders'], less: ['quads', 'hamstrings', 'glutes'] },
    level: 'Beginner – intermediate',
    about: 'Wide back and shoulders over a narrow waist: lots of lats and side shoulders, upper chest and arms, and just enough legs. The 3-day version of the 4-day V-taper.',
    days: [
      ['Back & chest', [['Pull-up', 3], ['Lat pulldown', 3], ['Incline bench press', 3], ['Incline dumbbell press', 2], ['Lateral raise', 3], ['Leg press', 3]]],
      ['Shoulders & arms', [['Overhead press', 3], ['Lateral raise', 3], ['Cable lateral raise', 2], ['Barbell curl', 3], ['EZ bar skullcrusher', 3], ['Romanian deadlift', 3]]],
      ['Back & chest', [['Underhand pulldown', 3], ['Seated cable row', 2], ['Wide-grip incline bench press', 3], ['Cable fly', 2], ['Machine lateral raise', 3], ['Leg curl', 2]]],
    ],
  },
  // ---- 4 days ----
  {
    id: 'upper-lower-4',
    name: 'Upper / Lower',
    level: 'Beginner – intermediate',
    about: 'Upper body and lower body on alternate days, each twice a week. A popular all-round split.',
    days: [
      ['Upper A', [['Bench press', 4], ['Barbell row', 3], ['Overhead press', 2], ['Lat pulldown', 2], ['Dumbbell curl', 2], ['Triceps pushdown', 2]]],
      ['Lower A', [['Squat', 3], ['Romanian deadlift', 3], ['Leg extension', 2], ['Leg curl', 2], ['Calf raise', 3]]],
      ['Upper B', [['Incline dumbbell press', 4], ['Seated cable row', 2], ['Pull-up', 3], ['Lateral raise', 3], ['Hammer curl', 2], ['Overhead triceps extension', 2]]],
      ['Lower B', [['Deadlift', 2], ['Bulgarian split squat', 3], ['Hip thrust', 2], ['Leg curl', 2], ['Calf raise', 3]]],
    ],
  },
  {
    id: 'lower-focus-4',
    name: 'Lower-body focus',
    focus: { more: ['glutes', 'quads', 'hamstrings'] },
    level: 'Beginner – intermediate',
    about: 'Two leg days that put glutes and legs first, plus two lighter upper-body days to stay balanced.',
    days: [
      ['Glutes & hamstrings', [['Hip thrust', 4], ['Romanian deadlift', 4], ['Bulgarian split squat', 3], ['Leg curl', 4], ['Hip abduction', 2]]],
      ['Upper A', [['Lat pulldown', 3], ['Incline dumbbell press', 4], ['Seated cable row', 3], ['Lateral raise', 3], ['Triceps pushdown', 2]]],
      ['Quads & glutes', [['Squat', 3], ['Leg press', 3], ['Lunge', 3], ['Leg extension', 3], ['Calf raise', 3]]],
      ['Upper B', [['Overhead press', 3], ['Assisted pull-up', 3], ['Bench press', 4], ['Face pull', 3], ['Dumbbell curl', 2]]],
    ],
  },
  {
    id: 'hourglass-4',
    name: 'Hourglass',
    for: 'female',
    focus: { more: ['glutes', 'shoulders'], less: ['quads'] },
    level: 'Beginner – intermediate',
    about: 'Glutes and shoulders first, a strong back, and only light work for the thighs (no squats or leg press). Rounder glutes and shoulders make the waist look narrower between them.',
    days: [
      ['Glutes & back', [['Hip thrust', 4], ['Romanian deadlift', 3], ['Lat pulldown', 3], ['Seated cable row', 3], ['Hip abduction', 2]]],
      ['Shoulders & arms', [['Dumbbell shoulder press', 3], ['Lateral raise', 4], ['Incline dumbbell press', 3], ['Face pull', 2], ['Dumbbell curl', 2], ['Triceps pushdown', 2]]],
      ['Glutes & hamstrings', [['Bulgarian split squat', 3], ['Glute kickback', 3], ['Cable pull-through', 3], ['Leg curl', 3], ['Hip abduction', 2]]],
      ['Upper & glutes', [['Assisted pull-up', 3], ['Cable lateral raise', 3], ['Push-up', 3], ['Cable fly', 2], ['Hip thrust', 3]]],
    ],
  },
  {
    id: 'v-taper-4',
    name: 'V-taper',
    for: 'male',
    focus: { more: ['lats', 'shoulders'], less: ['quads', 'hamstrings', 'glutes'] },
    level: 'Intermediate',
    about: 'Wide back and shoulders over a narrow waist: lots of lats and side shoulders, upper chest and arms, and just enough legs.',
    days: [
      ['Back & chest', [['Pull-up', 3], ['Lat pulldown', 3], ['Incline bench press', 3], ['Incline dumbbell press', 2], ['Leg press', 3], ['Leg curl', 2]]],
      ['Shoulders & arms', [['EZ bar skullcrusher', 3], ['Overhead triceps extension', 2], ['Lateral raise', 3], ['Cable lateral raise', 3], ['Barbell curl', 3], ['Wrist curl', 2]]],
      ['Chest & back', [['Wide-grip incline bench press', 3], ['Incline machine chest press', 2], ['Underhand pulldown', 3], ['Straight-arm pulldown', 3], ['Romanian deadlift', 3], ['Leg extension', 2]]],
      ['Arms & shoulders', [['EZ bar curl', 3], ['Cable curl', 2], ['Machine lateral raise', 3], ['Seated dumbbell lateral raise', 3], ['Inverted skullcrusher', 3], ['Reverse wrist curl', 2]]],
    ],
  },
  // ---- 5 days ----
  {
    id: 'ulppl-5',
    name: 'Upper / Lower + Push / Pull / Legs',
    level: 'Intermediate',
    about: 'A five-day hybrid used in programs by evidence-based coaches such as Jeff Nippard: each muscle about twice a week.',
    days: [
      ['Upper', [['Bench press', 3], ['Barbell row', 3], ['Overhead press', 2], ['Lat pulldown', 2], ['Dumbbell curl', 2], ['Triceps pushdown', 2]]],
      ['Lower', [['Squat', 3], ['Romanian deadlift', 3], ['Leg extension', 2], ['Leg curl', 2], ['Calf raise', 3]]],
      ['Push', [['Incline dumbbell press', 3], ['Dip', 2], ['Cable fly', 2], ['Lateral raise', 3], ['Overhead triceps extension', 2]]],
      ['Pull', [['Pull-up', 3], ['Seated cable row', 2], ['Face pull', 3], ['Hammer curl', 2], ['Dumbbell curl', 2]]],
      ['Legs', [['Bulgarian split squat', 3], ['Hip thrust', 2], ['Leg curl', 2], ['Leg press', 2], ['Calf raise', 3]]],
    ],
  },
  {
    id: 'bro-5',
    name: 'Body-part split',
    level: 'Intermediate',
    about: 'The classic "bro split": one body part a day, lots of sets for it. Each muscle only once a week, which research suggests is slightly less effective.',
    days: [
      ['Chest', [['Bench press', 4], ['Incline dumbbell press', 3], ['Cable fly', 3]]],
      ['Back', [['Pull-up', 4], ['Barbell row', 3], ['Lat pulldown', 3], ['Face pull', 2]]],
      ['Shoulders', [['Overhead press', 3], ['Lateral raise', 4], ['Shrug', 3]]],
      ['Legs', [['Squat', 4], ['Romanian deadlift', 4], ['Leg press', 3], ['Leg extension', 2], ['Leg curl', 4], ['Calf raise', 3]]],
      ['Arms', [['Dumbbell curl', 3], ['Hammer curl', 3], ['Triceps pushdown', 3], ['Overhead triceps extension', 3]]],
    ],
  },
  // ---- 6 days ----
  {
    id: 'ppl-6',
    name: 'Push / Pull / Legs ×2',
    level: 'Intermediate – advanced',
    about: 'Push, pull and legs twice a week with different exercises each time, in short sessions.',
    days: [
      ['Push A', [['Bench press', 3], ['Overhead press', 2], ['Lateral raise', 2], ['Triceps pushdown', 2]]],
      ['Pull A', [['Pull-up', 3], ['Barbell row', 2], ['Face pull', 2], ['Dumbbell curl', 2]]],
      ['Legs A', [['Squat', 3], ['Romanian deadlift', 3], ['Leg extension', 2], ['Leg curl', 2], ['Calf raise', 3]]],
      ['Push B', [['Incline dumbbell press', 3], ['Dip', 2], ['Cable fly', 2], ['Lateral raise', 2], ['Overhead triceps extension', 2]]],
      ['Pull B', [['Lat pulldown', 3], ['Seated cable row', 2], ['Hammer curl', 2], ['Face pull', 2]]],
      ['Legs B', [['Bulgarian split squat', 2], ['Hip thrust', 2], ['Leg curl', 3], ['Leg press', 2]]],
    ],
  },
  {
    id: 'arnold-6',
    name: 'Arnold split',
    high: true,
    level: 'Advanced',
    about: 'Chest & back, shoulders & arms, legs, twice a week, as Arnold Schwarzenegger trained. Deliberately high volume, about 15–20 sets per muscle a week: for experienced lifters.',
    days: [
      ['Chest & back', [['Bench press', 4], ['Pull-up', 4], ['Incline dumbbell press', 3], ['Barbell row', 3], ['Cable fly', 2]]],
      ['Shoulders & arms', [['Overhead press', 3], ['Lateral raise', 3], ['Dumbbell curl', 3], ['Triceps pushdown', 3], ['Face pull', 2]]],
      ['Legs', [['Squat', 4], ['Romanian deadlift', 3], ['Leg extension', 3], ['Leg curl', 3], ['Calf raise', 4]]],
      ['Chest & back', [['Incline dumbbell press', 4], ['Lat pulldown', 4], ['Dip', 3], ['Seated cable row', 3], ['Cable fly', 2]]],
      ['Shoulders & arms', [['Arnold press', 3], ['Lateral raise', 3], ['Hammer curl', 3], ['Overhead triceps extension', 3], ['Face pull', 2]]],
      ['Legs', [['Deadlift', 3], ['Leg press', 3], ['Bulgarian split squat', 3], ['Leg curl', 3], ['Calf raise', 4]]],
    ],
  },
];

// The main muscles every plan is balanced on, and the weekly sets to aim for.
export const MAIN_MUSCLES = ['chest', 'lats', 'shoulders', 'quads', 'hamstrings', 'glutes'];
export function targetRange(template, muscle) {
  if (template.focus?.more?.includes(muscle)) return [10, 25];
  if (template.focus?.less?.includes(muscle)) return [3, 9];
  if (template.light) return muscle === 'glutes' ? [3, 10] : [3, 8];
  if (template.high) return [12, 24];
  return muscle === 'glutes' ? [8, 16] : [8, 13];
}

// Ready-made plans for `count` days a week (all of them without a count).
// With `body` ('female' | 'male'), the ones made for it come first. `for`
// marks a plan's look: 'female' = hourglass (glutes, shoulders, back),
// 'male' = V-taper (lats, shoulders, arms); anyone can use any plan.
export function templatesForDays(count = null, body = null) {
  const list = PLAN_TEMPLATES.filter((t) => !count || t.days.length === count);
  const rank = (t) => (body && t.for === body ? 0 : t.for ? 2 : 1);
  return [...list].sort((a, b) => a.days.length - b.days.length || rank(a) - rank(b));
}

export const isRecommended = (template, body) => Boolean(body && template.for === body);

// Ideas for naming days in a plan of your own.
export const DAY_NAME_IDEAS = [
  'Full body', 'Upper', 'Lower', 'Push', 'Pull', 'Legs',
  'Chest & back', 'Shoulders & arms', 'Glutes & hamstrings', 'Quads & glutes', 'Arms', 'Core',
];

// Sensible default names for a plan of your own with `count` days.
export function defaultDayNames(count) {
  const presets = {
    1: ['Full body'],
    2: ['Full body A', 'Full body B'],
    3: ['Push', 'Pull', 'Legs'],
    4: ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
    5: ['Upper', 'Lower', 'Push', 'Pull', 'Legs'],
    6: ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'],
  };
  return presets[count] || Array.from({ length: count }, (_, i) => `Day ${i + 1}`);
}
