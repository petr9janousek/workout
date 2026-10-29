// How to do the built-in exercises: three short cues and the most common
// mistake. Written by hand, so exercises you add yourself have none (they
// have your own notes instead). Looked up by name, because the same exercise
// can have different ids on different phones (plans create them by name).

const TIPS = {
  'arnold press': [['Start with palms facing you at chin height', 'Turn the palms forward as you press up', 'Reverse the turn on the way down'], 'Leaning back to finish the press'],
  'assisted pull-up': [['Hang with straight arms, shoulders pulled down first', 'Pull your chest to the bar, elbows down to the sides', 'Lower slowly all the way'], 'Half reps that never straighten the arms'],
  'band pull-apart': [['Arms straight out at shoulder height', 'Pull the band to your chest by squeezing the shoulder blades', 'Return slowly, keep tension'], 'Shrugging the shoulders up to the ears'],
  'barbell curl': [['Elbows pinned to your sides', 'Curl up, squeeze at the top', 'Lower slowly to straight arms'], 'Swinging the weight up with your back'],
  'barbell row': [['Hinge forward, back flat, knees soft', 'Pull the bar to your lower ribs', 'Lower under control, don’t stand up between reps'], 'Rounding the lower back'],
  'bench press': [['Shoulder blades squeezed together, feet planted', 'Lower the bar to mid-chest, elbows about 45° from the body', 'Press up and slightly back over the shoulders'], 'Bouncing the bar off the chest'],
  'bird dog': [['On all fours, back flat like a table', 'Reach one arm and the opposite leg out long', 'Pause, return slowly, switch sides'], 'Twisting the hips or arching the back'],
  'bulgarian split squat': [['Back foot on a bench, front foot far enough forward', 'Lower straight down until the back knee nearly touches the floor', 'Push up through the whole front foot'], 'Pushing off mostly with the back leg'],
  'cable curl': [['Elbows still at your sides', 'Curl up and squeeze', 'Let the cable pull your arms straight slowly'], 'Letting the elbows drift forward'],
  'cable fly': [['Slight bend in the elbows, keep it fixed', 'Bring the hands together in a wide hug', 'Open slowly until you feel a stretch in the chest'], 'Turning it into a press by bending the elbows more'],
  'cable lateral raise': [['Stand side-on, cable crossing in front of you', 'Raise the arm out to the side to shoulder height', 'Lower slowly, keep tension at the bottom'], 'Leaning away to swing the weight up'],
  'cable pull-through': [['Face away from the cable, rope between the legs', 'Push the hips back, back flat, slight knee bend', 'Drive the hips forward and squeeze the glutes'], 'Pulling with the arms or squatting it'],
  'calf raise': [['Balls of the feet on the edge, heels free', 'Rise as high as you can, pause', 'Lower slowly into a full stretch'], 'Short, bouncy reps'],
  'dead bug': [['On your back, arms up, knees over the hips', 'Lower the opposite arm and leg slowly', 'Keep the lower back pressed into the floor'], 'Letting the back arch off the floor'],
  'dead hang': [['Grip the bar shoulder-width', 'Hang with straight arms, shoulders slightly active', 'Breathe calmly and hold'], 'Kipping or swinging'],
  'deadlift': [['Bar over mid-foot, shins close', 'Back flat, chest up, push the floor away', 'Stand tall, then lower the bar along the legs'], 'Rounding the lower back'],
  'dip': [['Shoulders down, lean slightly forward', 'Lower until the upper arms are about level with the floor', 'Press back up to straight arms'], 'Going too deep with the shoulders rolling forward'],
  'dumbbell curl': [['Elbows at your sides, palms forward', 'Curl up without moving the elbows', 'Lower all the way, slowly'], 'Swinging the body'],
  'dumbbell shoulder press': [['Dumbbells at shoulder height, core tight', 'Press up until the arms are straight', 'Lower to about chin level'], 'Arching the lower back'],
  'ez bar curl': [['Grip the angled parts, elbows at your sides', 'Curl up and squeeze', 'Lower to straight arms, slowly'], 'Swinging with the hips'],
  'ez bar skullcrusher': [['Lying down, arms straight over the shoulders', 'Bend only the elbows, bar towards the forehead', 'Straighten the arms without moving the elbows'], 'Elbows flaring out wide'],
  'face pull': [['Rope at face height, thumbs pointing back', 'Pull towards your forehead, elbows high', 'Finish with the hands beside your ears'], 'Using too much weight and leaning back'],
  'glute kickback': [['Hinge slightly forward, hold on for balance', 'Kick the leg back and up, squeeze the glute', 'Return slowly without touching down'], 'Arching the lower back to get higher'],
  'hammer curl': [['Palms facing each other', 'Curl up with the elbows at your sides', 'Lower slowly'], 'Swinging the weights'],
  'hip abduction': [['Sit tall, or lean slightly forward for more glute', 'Push the knees out against the pads', 'Return slowly, don’t let the plates slam'], 'Bouncing out of the bottom'],
  'hip thrust': [['Upper back on a bench, feet flat, chin tucked', 'Drive through the heels, hips up to a straight line', 'Squeeze the glutes for a second at the top'], 'Arching the lower back at the top'],
  'incline bench press': [['Bench at about 30°, shoulder blades back', 'Lower the bar to the upper chest', 'Press up over the shoulders'], 'Too steep a bench, turning it into a shoulder press'],
  'incline dumbbell press': [['Bench at about 30°, dumbbells at chest height', 'Press up and slightly together', 'Lower slowly to a stretch in the chest'], 'Lowering too fast and losing control'],
  'incline machine chest press': [['Handles at upper-chest height', 'Press out to straight arms', 'Return slowly until you feel a stretch'], 'Lifting the shoulders off the pad'],
  'inverted skullcrusher': [['Hands on a bar or rings, body straight like a plank', 'Bend the elbows to bring the head under the bar', 'Straighten the arms to push back'], 'Letting the hips sag'],
  'lat pulldown': [['Thighs locked under the pad, chest up', 'Pull the bar to the upper chest, elbows down', 'Let it up slowly to straight arms'], 'Leaning far back and pulling with momentum'],
  'lateral raise': [['Slight bend in the elbows', 'Raise the arms out to the side to shoulder height', 'Lower slowly, don’t rest at the bottom'], 'Shrugging or swinging the weights up'],
  'leg curl': [['Knees in line with the machine’s pivot', 'Curl the heels towards the glutes', 'Lower slowly to almost straight'], 'Hips lifting off the pad'],
  'leg extension': [['Knees in line with the machine’s pivot', 'Straighten the legs and squeeze the quads', 'Lower slowly'], 'Kicking the weight up fast'],
  'leg press': [['Feet shoulder-width, flat on the plate', 'Lower until the knees are near the chest, lower back stays down', 'Push through the whole foot'], 'Lower back rolling off the seat at the bottom'],
  'lunge': [['Long step, upper body tall', 'Lower until the back knee nearly touches the floor', 'Push back up through the front foot'], 'Front knee caving inwards'],
  'machine lateral raise': [['Elbows against the pads, seat set so shoulders line up', 'Raise the arms out to shoulder height', 'Lower slowly'], 'Shrugging the shoulders up'],
  'overhead press': [['Bar on the front of the shoulders, core and glutes tight', 'Press straight up, head moves back then through', 'Finish with the bar over the middle of the foot'], 'Leaning back into a standing bench press'],
  'overhead triceps extension': [['Arms up, elbows pointing forward', 'Lower the weight behind the head', 'Straighten the arms without moving the elbows'], 'Elbows flaring wide'],
  'pallof press': [['Stand side-on to the cable, hands at your chest', 'Press straight out and hold', 'Don’t let the cable twist you'], 'Turning the hips towards the cable'],
  'plank': [['Elbows under the shoulders', 'Squeeze glutes and abs, body in one line', 'Breathe and hold'], 'Hips sagging or piking up'],
  'plate pinch hold': [['Pinch two smooth plates together, smooth sides out', 'Stand tall, arm straight at your side', 'Hold until the grip slips'], 'Letting the plates rest against the leg'],
  'pull-up': [['Hang with straight arms, pull the shoulders down first', 'Pull the chest to the bar', 'Lower slowly all the way'], 'Kipping or half reps'],
  'push-up': [['Hands under the shoulders, body in one line', 'Lower the chest to the floor, elbows about 45°', 'Push back up to straight arms'], 'Hips sagging'],
  'reverse wrist curl': [['Forearms on your thighs, palms down', 'Lift the back of the hands up', 'Lower slowly'], 'Using too much weight and jerking'],
  'romanian deadlift': [['Soft knees, push the hips back', 'Bar slides down the thighs, back flat', 'Stop at a strong stretch in the hamstrings, then stand up'], 'Rounding the back to reach lower'],
  'seated cable row': [['Sit tall, chest up', 'Pull the handle to your belly, elbows close', 'Let the arms go forward slowly, stay upright'], 'Rocking back and forth'],
  'seated dumbbell lateral raise': [['Sit tall, dumbbells at your sides', 'Raise the arms out to shoulder height', 'Lower slowly'], 'Swinging the weights up'],
  'shoulder external rotation': [['Elbow at your side, bent 90°', 'Rotate the hand outwards, elbow stays put', 'Return slowly'], 'Using too much weight; keep it light'],
  'shrug': [['Arms straight, weights at your sides', 'Lift the shoulders straight up to the ears', 'Pause, lower slowly'], 'Rolling the shoulders round'],
  'side plank': [['Elbow under the shoulder, legs stacked', 'Lift the hips, body in one line', 'Hold, then switch sides'], 'Hips dropping towards the floor'],
  'single-leg romanian deadlift': [['Stand on one leg, slight knee bend', 'Hinge forward, back leg reaches behind', 'Stand up by squeezing the standing glute'], 'Twisting the hips open'],
  'squat': [['Feet about shoulder-width, toes slightly out', 'Sit down between the heels, knees follow the toes', 'Stand up through the whole foot, chest up'], 'Knees caving in'],
  'step-up': [['Whole foot on a box or bench', 'Push up through the top foot, not the bottom one', 'Lower slowly'], 'Pushing off the floor with the back leg'],
  'straight-arm pulldown': [['Arms almost straight, slight forward lean', 'Sweep the bar down to the thighs', 'Let it up slowly to above the head'], 'Bending the elbows into a pushdown'],
  'triceps pushdown': [['Elbows pinned at your sides', 'Push down until the arms are straight', 'Let it up slowly to about chest height'], 'Elbows moving forward and back'],
  'underhand pulldown': [['Palms facing you, shoulder-width', 'Pull to the upper chest, elbows down', 'Let it up slowly'], 'Leaning far back'],
  'wide-grip incline bench press': [['Bench at about 30°, wider grip', 'Lower to the upper chest', 'Press up over the shoulders'], 'Elbows flaring straight out to the sides'],
  'wrist curl': [['Forearms on your thighs, palms up', 'Curl the wrists up', 'Lower slowly into a stretch'], 'Lifting the forearms off the thighs'],
};

// { cues: [...], avoid: '...' } for a built-in exercise, or null.
export function tipsFor(exercise) {
  const tip = TIPS[exercise?.name?.trim().toLowerCase()];
  return tip ? { cues: tip[0], avoid: tip[1] } : null;
}

// A link that searches YouTube for a demonstration.
export const videoSearchUrl = (exercise) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise form`)}`;

export const TIP_NAMES = Object.keys(TIPS);
