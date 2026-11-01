// Warm-up and stretching: a short checklist at the start of a workout and an
// optional one at the end, picked from the muscles the workout trains. Each
// move is just ticked off ("Done"); nothing is logged or counted.
//
// Why (sources in DOCUMENTATION.md):
//   warm-up   Warming up improved performance in most studies (79% of the
//             measures in a meta-analysis) with little sign of harm; dynamic
//             warm-ups help strength and power. ACSM: 5–10 min at light to
//             moderate effort, then moves for what you're about to train.
//             So: easy cardio, then a few dynamic moves for today's muscles.
//   stretch   Holds of 15–30 s (ACSM), about 60 s per muscle in total for
//             more flexibility over time. It does little for soreness or
//             injuries, so it's optional, and off unless you turn it on.
//
// A move: { id, name, kind, muscles, dose?, sides?, cues, avoid }
//   kind:    'cardio' | 'warmup' | 'stretch'
//   muscles: the muscles it's for (muscles.js ids)
//   dose:    how much, for warm-up moves ("10 reps"); stretches get theirs
//            from the stretching size (see doseOf)
//   sides:   a stretch done on each side

const move = (kind) => (id, name, muscles, extra, cues, avoid) => ({ id, name, kind, muscles, ...extra, cues, avoid });
const warm = move('warmup');
const stretch = move('stretch');

export const EASY_CARDIO = {
  id: 'easy-cardio',
  name: 'Easy cardio',
  kind: 'cardio',
  muscles: [],
  dose: '5 min',
  cues: [
    'Bike, rower, cross-trainer, or a brisk walk on the treadmill',
    'Easy pace: warm and breathing a bit faster, but you can still talk',
    'If you wear a watch: roughly 100–120 heartbeats a minute',
  ],
  avoid: 'Going so hard you are tired before the first set',
};

export const MOVES = [
  EASY_CARDIO,
  warm('arm-circles', 'Arm circles', ['shoulders', 'rearDelts', 'chest'], { dose: '10 each way' },
    ['Arms straight out to the sides', 'Small circles growing into big ones', 'Forwards, then backwards'], 'Shrugging the shoulders up'),
  warm('arm-swings', 'Cross-body arm swings', ['chest', 'rearDelts'], { dose: '10 reps' },
    ['Stand tall, arms out wide', 'Swing them across your chest, one over the other', 'Open wide again and swap which arm is on top'], 'Forcing the end of the swing'),
  warm('wall-slides', 'Wall slides', ['shoulders', 'traps', 'rearDelts'], { dose: '10 reps' },
    ['Back, head and arms against a wall, elbows bent like a goalpost', 'Slide the arms up as far as they stay on the wall', 'Slide down, pulling the shoulder blades down'], 'Arching the lower back off the wall'),
  warm('scapular-push-ups', 'Scapular push-ups', ['chest', 'shoulders', 'traps'], { dose: '10 reps' },
    ['Push-up position, arms straight', 'Let the chest sink between the shoulder blades', 'Push the floor away to spread them apart'], 'Bending the elbows'),
  warm('elbow-wrist-circles', 'Elbow and wrist circles', ['biceps', 'triceps', 'forearms'], { dose: '10 each way' },
    ['Arms in front, bend and straighten the elbows a few times', 'Then circle the wrists, both ways', 'Finish by opening and closing the hands'], 'Rushing it'),
  warm('cat-cow', 'Cat-cow', ['lowerBack', 'abs'], { dose: '10 reps' },
    ['On all fours, hands under the shoulders', 'Round the back up, chin to chest', 'Then let the belly drop and look up, slowly'], 'Moving only the neck'),
  warm('open-books', 'Open books', ['lats', 'obliques', 'traps'], { dose: '8 each side' },
    ['Lie on your side, knees bent up, arms straight in front', 'Open the top arm over to the other side, eyes following the hand', 'Keep the knees together on the floor'], 'Letting the knees lift'),
  warm('inchworm', 'Inchworm', ['hamstrings', 'shoulders', 'abs', 'chest'], { dose: '6 reps' },
    ['Stand, bend down and put your hands on the floor', 'Walk the hands out to a push-up position', 'Walk the feet in towards the hands and stand up'], 'Letting the hips sag in the push-up position'),
  warm('bodyweight-squats', 'Bodyweight squats', ['quads', 'glutes', 'adductors'], { dose: '10 reps' },
    ['Feet shoulder-width, arms out in front', 'Sit down between the heels as deep as is comfortable', 'Stand up, knees going the same way as the toes'], 'Heels lifting off the floor'),
  warm('leg-swings', 'Leg swings', ['hamstrings', 'adductors', 'glutes'], { dose: '10 each way' },
    ['Hold on to something and stand on one leg', 'Swing the other leg forward and back, then side to side', 'Let the swings grow, then switch legs'], 'Swinging so hard the back rounds'),
  warm('worlds-greatest-stretch', "World's greatest stretch", ['quads', 'glutes', 'hamstrings', 'obliques'], { dose: '5 each side' },
    ['Big lunge forward, both hands on the floor inside the front foot', 'Drop the elbow towards the ankle, then turn and reach the arm up', 'Straighten the front leg for a moment, then switch sides'], 'Letting the back knee drop to the floor'),
  warm('glute-bridges', 'Glute bridges', ['glutes', 'hamstrings', 'lowerBack'], { dose: '10 reps' },
    ['On your back, knees bent, feet flat', 'Push through the heels and lift the hips', 'Squeeze the glutes at the top, lower slowly'], 'Arching the lower back at the top'),
  warm('ankle-rocks', 'Ankle rocks', ['calves'], { dose: '10 each side' },
    ['Half-kneeling, front foot flat', 'Rock the knee forward over the toes, heel stays down', 'Back and forth, then switch'], 'The heel lifting'),

  stretch('doorway-chest', 'Doorway chest stretch', ['chest', 'shoulders'], { sides: true },
    ['Forearm on a door frame, elbow at shoulder height', 'Step through gently until you feel the chest stretch', 'Breathe slowly and relax into it'], 'Pushing until it hurts'),
  stretch('cross-body-shoulder', 'Cross-body shoulder stretch', ['rearDelts'], { sides: true },
    ['Bring one arm straight across your chest', 'Hold it above the elbow with the other hand', 'Keep the shoulder down, away from the ear'], 'Turning the body instead of the arm'),
  stretch('overhead-triceps', 'Overhead triceps stretch', ['triceps', 'lats'], { sides: true },
    ['Reach one hand down between the shoulder blades', 'Gently push the elbow back with the other hand', 'Stand tall, ribs down'], 'Arching the lower back'),
  stretch('biceps-wall', 'Biceps wall stretch', ['biceps'], { sides: true },
    ['Palm flat on a wall behind you, arm straight at shoulder height', 'Turn your body slowly away from the wall', 'Stop when you feel it along the front of the arm'], 'Bending the elbow'),
  stretch('forearm-stretch', 'Forearm stretch', ['forearms'], { sides: true },
    ['Arm straight in front, palm up', 'Gently pull the fingers down with the other hand', 'Then turn the palm down and stretch the other way'], 'Pulling hard on the fingers'),
  stretch('lat-stretch', 'Lat stretch', ['lats'], { sides: true },
    ['Hold a rack or door frame at hip height with one hand', 'Sit the hips back and away, arm straight', 'Feel it along the side of the back'], 'Shrugging the shoulder up to the ear'),
  stretch('childs-pose', "Child's pose", ['lowerBack', 'lats'], {},
    ['Kneel and sit back towards the heels', 'Walk the hands forward, forehead down', 'Breathe into the back and relax'], 'Holding your breath'),
  stretch('neck-side', 'Neck side stretch', ['traps'], { sides: true },
    ['Sit or stand tall, one hand behind your back', 'Tilt the ear towards the other shoulder', 'Let the shoulder sink down'], 'Pulling the head with the hand'),
  stretch('thread-the-needle', 'Thread the needle', ['rearDelts', 'traps'], { sides: true },
    ['On all fours', 'Slide one arm under the body along the floor, shoulder down', 'Rest there, then switch sides'], 'Sitting the hips off to the side'),
  stretch('cobra', 'Cobra', ['abs'], {},
    ['Lie face down, hands under the shoulders', 'Push up gently, hips stay on the floor', 'Look ahead, shoulders down'], 'Pushing up so far it pinches the lower back'),
  stretch('side-bend', 'Standing side bend', ['obliques', 'lats'], { sides: true },
    ['Stand tall, one arm overhead', 'Lean to the other side, reaching up and over', 'Keep both feet on the floor'], 'Leaning forward instead of sideways'),
  stretch('figure-four', 'Figure-4 glute stretch', ['glutes'], { sides: true },
    ['On your back, cross one ankle over the other knee', 'Pull the lower leg towards your chest', 'Push the top knee gently away'], 'Lifting the head and tensing the neck'),
  stretch('hip-flexor', 'Kneeling hip flexor stretch', ['quads'], { sides: true },
    ['Kneel on one knee, the other foot forward', 'Squeeze the glute of the back leg, tuck the hips under', 'Shift forward a little until you feel the front of the hip'], 'Arching the lower back'),
  stretch('quad-stretch', 'Standing quad stretch', ['quads'], { sides: true },
    ['Hold on to something and bend one knee', 'Hold the ankle and bring the heel to the glute', 'Knees together, hips pushed slightly forward'], 'Leaning forward'),
  stretch('hamstring-stretch', 'Seated hamstring stretch', ['hamstrings'], { sides: true },
    ['Sit with one leg straight, the other foot against its thigh', 'Hinge forward from the hips, back long', 'Reach for the shin or foot, wherever you get to'], 'Rounding the back to reach further'),
  stretch('butterfly', 'Butterfly stretch', ['adductors'], {},
    ['Sit with the soles of the feet together, knees out', 'Hold the feet and sit tall', 'Let the knees sink and lean forward a little'], 'Bouncing the knees'),
  stretch('calf-wall', 'Wall calf stretch', ['calves'], { sides: true },
    ['Hands on a wall, one foot back', 'Back leg straight, heel pressed down', 'Lean in until you feel the calf'], 'The heel lifting off the floor'),
];

export const moveById = (id) => MOVES.find((m) => m.id === id) || null;

// Stretching sizes (settings.stretching).
export const STRETCHING = [
  { value: 'off', label: 'Off' },
  { value: 'quick', label: 'Quick' },
  { value: 'thorough', label: 'Thorough' },
];

// Thorough always adds these: hips and upper back stiffen from sitting.
const ALWAYS_THOROUGH = ['hip-flexor', 'thread-the-needle'];

// When the workout has no exercises yet: a bit of everything.
const WHOLE_BODY = { chest: 1, shoulders: 1, lats: 1, quads: 1, glutes: 1, hamstrings: 1 };

// Up to `count` moves of `kind` that cover the most of `load` (sets per
// muscle): each pick takes the move for the most sets not covered yet.
// A covered muscle still counts a tenth, so once every muscle has a move,
// the next picks go to the muscles trained most again.
function cover(kind, load, count) {
  const left = { ...load };
  const chosen = [];
  while (chosen.length < count) {
    let best = null;
    let bestScore = 0;
    for (const m of MOVES) {
      if (m.kind !== kind || chosen.includes(m)) continue;
      const score = m.muscles.reduce((sum, x) => sum + (left[x] || 0), 0);
      if (score > bestScore) [best, bestScore] = [m, score];
    }
    if (!best) break;
    chosen.push(best);
    for (const x of best.muscles) left[x] /= 10;
  }
  return chosen;
}

const isEmpty = (load) => !Object.values(load).some((n) => n > 0);

// The warm-up: easy cardio, then 3 moves for the muscles trained most.
export const warmUpFor = (load) => [EASY_CARDIO, ...cover('warmup', isEmpty(load) ? WHOLE_BODY : load, 3)];

// Stretches for the end: Quick = 4 for the muscles trained most, one hold
// each (~5 min); Thorough = the same 4 held twice, plus hips and upper back
// (~12 min). Nothing when off.
export function stretchesFor(load, size) {
  if (size === 'quick') return cover('stretch', isEmpty(load) ? WHOLE_BODY : load, 4);
  if (size !== 'thorough') return [];
  const chosen = cover('stretch', isEmpty(load) ? WHOLE_BODY : load, 4);
  for (const id of ALWAYS_THOROUGH) if (!chosen.some((m) => m.id === id)) chosen.push(moveById(id));
  return chosen;
}

// How much of a move: its own dose, or for a stretch, 30 s (Quick) or
// 2 × 30 s (Thorough), on each side where that applies.
export function doseOf(move, size = 'quick') {
  if (move.kind !== 'stretch') return move.dose;
  return `${size === 'thorough' ? '2 × 30 s' : '30 s'}${move.sides ? ' each side' : ''}`;
}

// Roughly how many minutes a list takes: warm-up moves ~1 min each, a
// stretch 30 s per hold (and side), cardio its 5 min.
export function minutesFor(moves, size = 'quick') {
  const sec = moves.reduce((s, m) => {
    if (m.kind === 'cardio') return s + 300;
    if (m.kind === 'warmup') return s + 60;
    return s + 30 * (size === 'thorough' ? 2 : 1) * (m.sides ? 2 : 1) + 10;
  }, 0);
  return Math.max(1, Math.round(sec / 60));
}
