// Ready-made plans (splits) to start from. Every one can be edited after.
//
// Built on what the research and well-known coaches agree on:
//  - WHO: strength training for all major muscles on at least 2 days a week.
//  - Training a muscle about twice a week is a small advantage over once,
//    at the same number of weekly sets (most splits here do that).
//  - Roughly 10–20 hard sets per muscle per week for growth; these plans aim
//    for the lower-middle of that so they're sustainable. Add sets later.
//  - The split matters less than weekly sets and sticking to it, so pick the
//    one that fits your week.
//  - The aesthetic plans (Hourglass, V-taper) only shift sets towards the
//    muscles that shape the look; muscles can't be "toned" or slimmed one at
//    a time, so they still train everything.
//
// Exercises are referred to by name; missing ones are created when the
// plan is made (type and muscles are guessed from the name).
// Each item: [exercise name, number of sets]

export const PLAN_TEMPLATES = [
  {
    id: 'healthy-2',
    name: 'Healthy basics',
    level: 'Beginner',
    about: 'The minimum the WHO recommends for health: every major muscle, twice a week, in two short sessions.',
    days: [
      ['Full body A', [['Squat', 3], ['Bench press', 3], ['Seated cable row', 3], ['Romanian deadlift', 2], ['Plank', 2]]],
      ['Full body B', [['Leg press', 3], ['Overhead press', 3], ['Lat pulldown', 3], ['Hip thrust', 2], ['Push-up', 2]]],
    ],
  },
  {
    id: 'full-body-3',
    name: 'Full body',
    level: 'Beginner',
    about: 'Every muscle three times a week with few sets each time. The classic way to start, and easy to fit in.',
    days: [
      ['Full body A', [['Squat', 3], ['Bench press', 3], ['Barbell row', 3], ['Romanian deadlift', 2], ['Lateral raise', 2], ['Plank', 2]]],
      ['Full body B', [['Deadlift', 2], ['Overhead press', 3], ['Lat pulldown', 3], ['Leg press', 3], ['Dumbbell curl', 2], ['Triceps pushdown', 2]]],
      ['Full body C', [['Bulgarian split squat', 3], ['Incline dumbbell press', 3], ['Seated cable row', 3], ['Hip thrust', 3], ['Calf raise', 2], ['Leg raise', 2]]],
    ],
  },
  {
    id: 'ppl-3',
    name: 'Push / Pull / Legs',
    level: 'Beginner – intermediate',
    about: 'Pushing muscles, pulling muscles, then legs. Each muscle once a week with more sets per session.',
    days: [
      ['Push', [['Bench press', 3], ['Overhead press', 3], ['Incline dumbbell press', 3], ['Lateral raise', 3], ['Triceps pushdown', 3]]],
      ['Pull', [['Pull-up', 3], ['Barbell row', 3], ['Seated cable row', 2], ['Face pull', 3], ['Dumbbell curl', 3]]],
      ['Legs', [['Squat', 3], ['Romanian deadlift', 3], ['Leg press', 3], ['Leg curl', 3], ['Calf raise', 3]]],
    ],
  },
  {
    id: 'hourglass-3',
    name: 'Hourglass',
    for: 'female',
    level: 'Beginner – intermediate',
    about: 'Glutes and shoulders on every day, a strong back, and only light work for the thighs (no squats or leg press). Rounder glutes and shoulders make the waist look narrower between them. Core work without heavy side bends.',
    days: [
      ['Glutes & back', [['Hip thrust', 4], ['Romanian deadlift', 3], ['Lat pulldown', 3], ['Seated cable row', 3], ['Lateral raise', 3]]],
      ['Shoulders & glutes', [['Bulgarian split squat', 3], ['Glute kickback', 3], ['Dumbbell shoulder press', 3], ['Lateral raise', 3], ['Face pull', 2], ['Dead bug', 2]]],
      ['Glutes & upper', [['Hip thrust', 3], ['Cable pull-through', 3], ['Assisted pull-up', 3], ['Incline dumbbell press', 3], ['Lateral raise', 2], ['Hip abduction', 3]]],
    ],
  },
  {
    id: 'upper-lower-4',
    name: 'Upper / Lower',
    level: 'Beginner – intermediate',
    about: 'Upper body and lower body on alternate days, each twice a week. A popular all-round split.',
    days: [
      ['Upper A', [['Bench press', 3], ['Barbell row', 3], ['Overhead press', 2], ['Lat pulldown', 3], ['Dumbbell curl', 2], ['Triceps pushdown', 2]]],
      ['Lower A', [['Squat', 3], ['Romanian deadlift', 3], ['Leg extension', 2], ['Leg curl', 2], ['Calf raise', 3], ['Plank', 2]]],
      ['Upper B', [['Incline dumbbell press', 3], ['Seated cable row', 3], ['Pull-up', 3], ['Lateral raise', 3], ['Hammer curl', 2], ['Overhead triceps extension', 2]]],
      ['Lower B', [['Deadlift', 2], ['Bulgarian split squat', 3], ['Hip thrust', 3], ['Leg curl', 2], ['Calf raise', 3], ['Leg raise', 2]]],
    ],
  },
  {
    id: 'lower-focus-4',
    name: 'Lower-body focus',
    level: 'Beginner – intermediate',
    about: 'Two leg days that put glutes and legs first, plus two lighter upper-body days to stay balanced.',
    days: [
      ['Glutes & hamstrings', [['Hip thrust', 4], ['Romanian deadlift', 3], ['Bulgarian split squat', 3], ['Leg curl', 3], ['Hip abduction', 3]]],
      ['Upper A', [['Lat pulldown', 3], ['Incline dumbbell press', 3], ['Seated cable row', 3], ['Lateral raise', 3], ['Triceps pushdown', 2]]],
      ['Quads & glutes', [['Squat', 3], ['Leg press', 3], ['Lunge', 3], ['Leg extension', 3], ['Calf raise', 3]]],
      ['Upper B', [['Overhead press', 3], ['Assisted pull-up', 3], ['Push-up', 3], ['Face pull', 3], ['Dumbbell curl', 2]]],
    ],
  },
  {
    id: 'v-taper-4',
    name: 'V-taper',
    for: 'male',
    level: 'Intermediate',
    about: 'Wide back and shoulders over a narrow waist: lots of lats and side shoulders, upper chest and arms, and just enough legs. Modelled on the upper-body-focused templates by Renaissance Periodization (RP), with a few leg exercises added.',
    days: [
      ['Back & chest', [['Pull-up', 3], ['Lat pulldown', 3], ['Incline bench press', 3], ['Incline dumbbell press', 3], ['Leg press', 3], ['Leg curl', 2]]],
      ['Shoulders & arms', [['EZ bar skullcrusher', 3], ['Overhead triceps extension', 2], ['Lateral raise', 3], ['Cable lateral raise', 3], ['Barbell curl', 3], ['Wrist curl', 2]]],
      ['Chest & back', [['Wide-grip incline bench press', 3], ['Incline machine chest press', 3], ['Underhand pulldown', 3], ['Straight-arm pulldown', 3], ['Romanian deadlift', 3], ['Leg extension', 2]]],
      ['Arms & shoulders', [['EZ bar curl', 3], ['Cable curl', 2], ['Machine lateral raise', 3], ['Seated dumbbell lateral raise', 3], ['Inverted skullcrusher', 3], ['Reverse wrist curl', 2]]],
    ],
  },
  {
    id: 'hourglass-4',
    name: 'Hourglass',
    for: 'female',
    level: 'Beginner – intermediate',
    about: 'Glutes and shoulders first, a strong back, and only light work for the thighs (no squats or leg press). Rounder glutes and shoulders make the waist look narrower between them. Core work without heavy side bends.',
    days: [
      ['Glutes & back', [['Hip thrust', 4], ['Romanian deadlift', 3], ['Lat pulldown', 3], ['Seated cable row', 3], ['Hip abduction', 2]]],
      ['Shoulders & arms', [['Dumbbell shoulder press', 3], ['Lateral raise', 4], ['Incline dumbbell press', 3], ['Face pull', 2], ['Dumbbell curl', 2], ['Triceps pushdown', 2]]],
      ['Glutes & hamstrings', [['Bulgarian split squat', 3], ['Glute kickback', 3], ['Cable pull-through', 3], ['Leg curl', 3], ['Hip abduction', 2]]],
      ['Upper & glutes', [['Assisted pull-up', 3], ['Cable lateral raise', 3], ['Push-up', 2], ['Hip thrust', 3], ['Dead bug', 2]]],
    ],
  },
  {
    id: 'ulppl-5',
    name: 'Upper / Lower + Push / Pull / Legs',
    level: 'Intermediate',
    about: 'A five-day hybrid used in programs by evidence-based coaches such as Jeff Nippard: each muscle about twice a week.',
    days: [
      ['Upper', [['Bench press', 3], ['Barbell row', 3], ['Overhead press', 2], ['Lat pulldown', 3], ['Dumbbell curl', 2], ['Triceps pushdown', 2]]],
      ['Lower', [['Squat', 3], ['Romanian deadlift', 3], ['Leg extension', 2], ['Leg curl', 2], ['Calf raise', 3]]],
      ['Push', [['Incline dumbbell press', 3], ['Dip', 3], ['Cable fly', 2], ['Lateral raise', 3], ['Overhead triceps extension', 2]]],
      ['Pull', [['Pull-up', 3], ['Seated cable row', 3], ['Face pull', 3], ['Hammer curl', 2], ['Dumbbell curl', 2]]],
      ['Legs', [['Deadlift', 2], ['Bulgarian split squat', 3], ['Hip thrust', 3], ['Leg curl', 2], ['Calf raise', 3], ['Leg raise', 2]]],
    ],
  },
  {
    id: 'bro-5',
    name: 'Body-part split',
    level: 'Intermediate',
    about: 'The classic "bro split": one body part a day, lots of sets for it. Each muscle only once a week, which research suggests is slightly less effective.',
    days: [
      ['Chest', [['Bench press', 4], ['Incline dumbbell press', 3], ['Cable fly', 3], ['Dip', 3]]],
      ['Back', [['Pull-up', 4], ['Barbell row', 3], ['Lat pulldown', 3], ['Seated cable row', 3]]],
      ['Shoulders', [['Overhead press', 4], ['Lateral raise', 4], ['Face pull', 3], ['Shrug', 3]]],
      ['Legs', [['Squat', 4], ['Romanian deadlift', 3], ['Leg press', 3], ['Leg curl', 3], ['Calf raise', 4]]],
      ['Arms', [['Dumbbell curl', 3], ['Hammer curl', 3], ['Triceps pushdown', 3], ['Overhead triceps extension', 3], ['Leg raise', 3]]],
    ],
  },
  {
    id: 'ppl-6',
    name: 'Push / Pull / Legs ×2',
    level: 'Intermediate – advanced',
    about: 'Push, pull and legs twice a week with different exercises each time. A lot of training: six days.',
    days: [
      ['Push A', [['Bench press', 3], ['Overhead press', 3], ['Incline dumbbell press', 2], ['Lateral raise', 3], ['Triceps pushdown', 3]]],
      ['Pull A', [['Pull-up', 3], ['Barbell row', 3], ['Face pull', 3], ['Dumbbell curl', 3]]],
      ['Legs A', [['Squat', 3], ['Romanian deadlift', 3], ['Leg extension', 2], ['Calf raise', 3]]],
      ['Push B', [['Incline dumbbell press', 3], ['Dip', 3], ['Cable fly', 2], ['Lateral raise', 3], ['Overhead triceps extension', 3]]],
      ['Pull B', [['Lat pulldown', 3], ['Seated cable row', 3], ['Chin-up', 2], ['Face pull', 2], ['Hammer curl', 3]]],
      ['Legs B', [['Deadlift', 2], ['Bulgarian split squat', 3], ['Hip thrust', 3], ['Leg curl', 3], ['Leg raise', 2]]],
    ],
  },
  {
    id: 'arnold-6',
    name: 'Arnold split',
    level: 'Advanced',
    about: 'Chest & back, shoulders & arms, legs, twice a week, as Arnold Schwarzenegger trained. High volume: for experienced lifters.',
    days: [
      ['Chest & back', [['Bench press', 4], ['Pull-up', 4], ['Incline dumbbell press', 3], ['Barbell row', 3], ['Cable fly', 2]]],
      ['Shoulders & arms', [['Overhead press', 4], ['Lateral raise', 3], ['Dumbbell curl', 3], ['Triceps pushdown', 3], ['Face pull', 2]]],
      ['Legs', [['Squat', 4], ['Romanian deadlift', 3], ['Leg extension', 3], ['Leg curl', 3], ['Calf raise', 4]]],
      ['Chest & back', [['Incline dumbbell press', 4], ['Lat pulldown', 4], ['Dip', 3], ['Seated cable row', 3], ['Cable fly', 2]]],
      ['Shoulders & arms', [['Arnold press', 4], ['Lateral raise', 3], ['Hammer curl', 3], ['Overhead triceps extension', 3], ['Face pull', 2]]],
      ['Legs', [['Deadlift', 3], ['Leg press', 3], ['Bulgarian split squat', 3], ['Leg curl', 3], ['Calf raise', 4]]],
    ],
  },
];

// Ready-made plans for `count` days a week. With `body` ('female' | 'male'),
// the ones made for it come first. `for` marks a plan's aesthetic goal:
// 'female' = hourglass (glutes, shoulders, back), 'male' = V-taper (lats,
// shoulders, arms); anyone can use any plan.
export function templatesForDays(count, body = null) {
  const list = PLAN_TEMPLATES.filter((t) => t.days.length === count);
  const rank = (t) => (body && t.for === body ? 0 : t.for ? 2 : 1);
  return [...list].sort((a, b) => rank(a) - rank(b));
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
