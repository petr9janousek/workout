# Workout: developer documentation

How to run, change and publish the app. For what the app is, see the [README](README.md).

**Contents:** [Setup](#1-one-time-setup-on-windows) · [Run](#2-run-it-on-your-computer) · [Publish](#3-put-it-online-free-github-pages) · [Install](#4-install-it-on-the-phones) · [Code](#how-the-code-is-organised) · [Tests](#tests) · [Features in detail](#features-in-detail)

## 1. One-time setup on Windows

You need **Node.js 20.19 or newer** and **Git**. Open a terminal in VS Code (*Terminal → New Terminal*) and check:

```
node -v
git --version
```

If `node -v` shows something older than v20.19 (or "not recognized"), install the **LTS** version from <https://nodejs.org>, then close and reopen VS Code.

> If PowerShell says *"running scripts is disabled on this system"* when you run `npm`, run this once and try again:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

Then, in this folder, download the libraries the project uses (into a `node_modules` folder):

```
npm install
```

## 2. Run it on your computer

```
npm run dev
```

Open the `http://localhost:5173` link it prints. To see it phone-sized in Chrome, press **F12**, then **Ctrl+Shift+M**.

While this runs, every time you save a file the page updates by itself. Stop it with **Ctrl+C**.

**Trying it on a phone during development:** the terminal also prints a `Network:` address like `http://192.168.1.23:5173`. Open that on a phone on the same Wi-Fi. If Windows asks about the firewall, allow access on private networks. This is fine for testing, but it can't be *installed* from there: that needs the real https address from step 3.

## 3. Put it online (free, GitHub Pages)

The phones need to load the app once from an https address. GitHub hosts it for free. Only the app's code goes there, never your workouts.

1. On <https://github.com>, create a new **public** repository, e.g. `workout`. Don't add a README.
2. In this folder:
   ```
   git init
   git add .
   git commit -m "First version"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/workout.git
   git push -u origin main
   ```
3. On GitHub, open the repository → **Settings → Pages**, and under *Build and deployment → Source* choose **GitHub Actions**.
4. Open the **Actions** tab. The *Deploy to GitHub Pages* job runs, and after about a minute the app is live at
   `https://YOUR-NAME.github.io/workout/`

From then on, every `git push` publishes the new version automatically. That's what `.github/workflows/deploy.yml` does.

## 4. Install it on the phones

- **Pixel (Chrome):** open the link → ⋮ menu → **Install app** (or *Add to home screen*).
- **iPhone (Safari, not Chrome):** open the link → **Share** button → **Add to Home Screen**.

Always open it from the home-screen icon. On iPhone, the home-screen app keeps its data separately from Safari, and that's the copy that is protected from automatic clean-up.

**Updates:** after you push, the phones switch to the new version by themselves (when the app goes to the background, or right after opening it; see `src/updates.js`).

**Backups:** *Settings → Save backup* saves a file you can keep in Files or Google Drive. *Restore from backup* loads it back, for example on a new phone.

---

## How the code is organised

The app is a React app, written in plain JavaScript (no classes). The code is in three layers. Each layer only uses the layers below it:

```
 screens/  components/  hooks/     what you see: React components (functions that return the screen)
        │  read data with useData(), change it with actions.…
        ▼
 data/                             the store: keeps all data in memory, saves changes to the phone
        │
        ▼
 model/                            the rules: plain data + pure functions, no screen, no database
```

- **model/** is the core: what a workout or a set is, how totals, progress suggestions and muscle counts are worked out. It's all *pure functions*: data in, data out, nothing else. That's what makes it easy to test, and the place to look first when the app calculates something wrong.
- **data/** owns the data. `DataProvider.jsx` loads everything from the phone's database once, keeps it in memory, and saves every change. Any component gets it with `useData()`:
  ```js
  const { workouts, settings, exercisesById, actions } = useData();
  actions.saveWorkout(workout);
  ```
  Data is never changed in place: changes always build a new object (`{ ...workout, notes }`). React notices changes by checking whether it's a *different object*, so this is how the screen knows to update.
- **screens/** and **components/** are the UI. A component is a function that gets data and returns what to show; React calls it again whenever the data changes.
- **Navigation:** four tabs, each with one job: **Home** (today, and the workout itself while one runs; Settings at the bottom), **Progress** (you over time: calendar, all workouts, exercises), **Plans** and **Exercises**. Every screen has its own address after `#` (e.g. `#/progress/workout/<id>/edit`), so the phone's back button works. See `src/hooks/useRoute.js`; each tab's main file lists its addresses.

```
index.html                 The page the browser loads first; shows errors instead of a blank page
vite.config.js             Build settings, and the PWA settings (app name, icon, colours, offline)
public/                    Icons, copied as-is
src/
  main.jsx                 Starting point: starts React and the update checks
  version.js               The version number (shown in Settings)
  updates.js               Installs new versions quietly (service worker)
  analytics.js             Anonymous counts (GoatCounter; the script is in index.html)
  App.jsx                  The frame: current screen + tab bar (+ the rest timer during a workout, a banner if saving fails)
  styles.css               All the look: colours at the top, then each part of the app
  assets/                  Pictures bundled with the app (the welcome photo)

  model/                   ── the rules (pure functions, tested) ──
    format.js              Numbers and dates to text, typed text to numbers
    ids.js                 Unique ids
    exercises.js           Exercises and their 4 types, starter list, guessing the type from the name
    sets.js                Sets: creating, showing ("60 kg × 8 @8"), comparing with last time, planned (grey) values
    workouts.js            Workouts: finishing, totals, history of an exercise
    progression.js         "What to try next time": the three progression styles
    plans.js               Plans: days in order, which day is next, starting a plan day, minutes per session
    planTemplates.js       The ready-made plans, and the research they're based on (~10 sets per muscle a week)
    extras.js              Healthy extras: the core / grip / upper back / balance finisher
    planFile.js            Plan files: sharing a plan with someone, importing one
    partner.js             Train together: a partner's code (pass), her part of your workout, handing it over, importing it, taking turns
    bodyWeight.js          Body weight log: one entry per day, the 30-day change
    activities.js          Other activities (run, swim…): types, effort, what counts as an active day, WHO minutes
    muscles.js             Which muscles an exercise works, sets per muscle, map colours
    calendar.js            Days, weeks and months: training days, weekly counts, streaks, weekly goal
    settings.js            Settings and their defaults, weight jumps (weightStepFor), rest time
    records.js             Personal records: which sets beat everything before, records in a workout / this week
    tips.js                How to do the built-in exercises: three cues and the common mistake each
    warmup.js              Warm-up moves and stretches (with how-to), and which ones a workout gets from its muscles
    *.test.js              Tests (see below)

  data/                    ── the data ──
    DataProvider.jsx       The store: loads, keeps and saves all data; useData()
    db.js                  The phone's database (IndexedDB)
    migrations.js          Updates data saved by older versions of the app
    backup.js              Backup files: making, reading, sharing (the format: BACKUP-FORMAT.md)
    sampleData.js          Sample data for testing (Settings → For testing; only on localhost / npm run dev)
    transfer.js            Data ⇄ a few hundred bytes for a QR code (JSON, deflated); the channel can change later

  hooks/                   ── small reusable React helpers ──
    useRoute.js            Navigation and the back button
    useNow.js              The current time, ticking (timers)
    useRemembered.js       A setting remembered on this phone (e.g. folded cards)
    useSaveBackup.js       Save a backup file (used by Settings and the reminder on Home)
    useStartWorkout.js     Start a workout from another screen (plan day, repeat); one at a time
    useWakeLock.js         Keep the screen on during a workout

  components/              ── pieces used by several screens ──
    ui/                    Tour (the walkthrough overlay), Icon, ChipGroup (pill buttons), NumberInput (+ ± input), BackButton, Suggestion, FitHeading, Firework, DaysPicker, CardTitle (title + "?" hint), FoldCard (a card that folds open),
                           LinkCard (a card that opens another page), NotFound (a deleted plan, exercise or workout),
                           QrCode (show a code), ScanCode (camera, or a file instead; the QR libraries load only when used);
                           sportIcons.js (activity icons from Tabler Icons, MIT license)
    charts/                BodyFigure (the drawing, + bodyShapes.js with the female version) used by BodyMap (heat map) and MusclePicker (tap to pick muscles);
                           MuscleCard, LineChart; WeekStrip, MonthCalendar, WeeksChart, HabitCard (training habit); BodyWeightCard
    workout/               WorkoutEditor → ExerciseCard → CoachLine + SetRow; RestTimer; ExercisePicker; CreateExercise; Totals;
                           WorkoutSummary (totals, change since last time, records); SessionRow (a workout or activity in a list);
                           MovesCard (the warm-up / stretching checklist)

  screens/                 ── one folder per tab, plus the screens they share ──
    home/                  HomeScreen → Home (today), Welcome (new phone: one screen), FinishSummary (after Finish), TogetherActions (the Train together fold under Start), TogetherScreen (your code, get your workout),
                           HandOverScreen (a partner's finished workout as a code); or the workout
    workout/               ActiveWorkout (the workout in progress, shown on Home), PartnerJoin (add a training partner)
    progress/              ProgressScreen (calendar, all workouts, exercises) → WorkoutDetail
    plans/                 PlansScreen → PlanList (my plans), PlanLibrary (ready-made), NewPlan (my own), PlanOverview, DayEditor
    exercises/             ExercisesScreen → ExerciseLibrary → ExercisePage (How to page ⇄ Progress page) → ExerciseEditor; MovePage (a warm-up move or stretch)
    activities/            ActivityForm (log or edit an activity), ActivityDetail
    settings/              SettingsScreen, BackupSettings (opened from the bottom of Home)
```

**Where to change things**

- Colours, sizes, spacing → `src/styles.css`. The main colours are at the top (`--accent` is the orange, `--heat-*` the muscle map).
- Wording on a screen → the matching file in `src/screens/`
- How-to tips for an exercise → `TIPS` in `src/model/tips.js`
- How suggestions work → `src/model/progression.js` (and its tests)
- Which muscles an exercise works → `RULES` in `src/model/muscles.js`
- Automatic weight jumps → `AUTO_STEPS` in `src/model/settings.js`; automatic rest → `restTarget` in the same file (which exercises count as big lifts → `isBigLift` in `src/model/exercises.js`)
- The shape of the female figure → `FEMALE_WIDTH` in `src/components/charts/bodyShapes.js` (how much narrower or wider the body is at each height)
- The ready-made plans → `PLAN_TEMPLATES` in `src/model/planTemplates.js`. The tests check every plan gives each main muscle about 10 sets a week (8–13), or what its `focus` says. Run `npm test` after changing one
- The healthy extras → `EXTRAS` in `src/model/extras.js`
- How long a session is estimated to take → `sessionMinutes` in `src/model/plans.js`
- The starting list of exercises → `STARTER_EXERCISES` in `src/model/exercises.js` (only for a fresh install)
- A new setting → add it with its default to `src/model/settings.js`, then use `settings.yourSetting` and `actions.setSetting('yourSetting', value)`
- App name or icon on the home screen → `vite.config.js` and the files in `public/`

**How data is stored:** a workout is one record:

```js
{
  id: "…", startedAt: "2026-10-22T18:30:00Z", finishedAt: "…",   // finishedAt: null while in progress
  notes: "",
  entries: [
    { id: "…", exerciseId: "…", suggestion: null,
      sets: [ { id: "…", weight: 60, reps: 8, time: null, rpe: 8, done: true, doneAt: "…" }, … ] }
  ]
}
```

Numbers are numbers; an empty field is `null`. Only ticked ✓ sets count, and unticked ones are dropped when the workout is finished.

**Releasing a new version:** just push. The deploy runs the tests first (a failing test stops it, so a version that would break saved data never reaches the phones), and the phones switch to the new version by themselves. Raise `APP_VERSION` in `src/version.js` when you want to see which version a phone runs.

**Changing how data is stored:** raise `SCHEMA_VERSION` in `src/data/migrations.js` and add the conversion to `migrate()`. It runs when the app starts and when a backup is restored, so the phones' existing data and old backup files keep working. Add a test for it in `migrations.test.js`.

## Tests

```
npm test
```

runs all tests in a second or two and prints what passed. Each test is a short, plain-language scenario, for example *"adds a rep each session, confirms the goal once, then adds weight and goes back to the starting reps"*. The tests sit next to the code they check:

| File | What it checks |
|---|---|
| `model/progression.test.js` | The three progression styles, the safety rules (RPE 9.5+, dropping reps, plateaus), easier than expected (4+ reps over the time before → heavier, sized by 1RM; high reps alone are fine), titles with numbers, assisted / bodyweight / timed exercises, starting an exercise in today's workout (as grey plans) |
| `model/workouts.test.js` | Finishing a workout, totals, an exercise's history, the last time of the same plan day, the remembered list of finished workouts |
| `model/plans.test.js` | Which plan day is next, starting a plan day, editing days; every ready-made plan gives each main muscle ~10 sets a week (or what its focus says); more days = shorter sessions; healthy extras rotate and are marked; plans for your body come first |
| `data/sampleData.test.js` | The sample data looks like real data: current format, exercises exist, ~8 weeks of workouts, a streak, body weight |
| `model/planFile.test.js` | Sharing a plan: names, sets, extras and muscles survive; the other phone reuses its exercises and creates missing ones; clear messages for wrong files |
| `model/sets.test.js` | Reading typed numbers ("62,5"), showing sets and grouped set lists, ▲▼ comparisons; planned values: ticking takes them, typing wins, typing plans the empty sets below |
| `model/muscles.test.js` | Guessing muscles, main and helping muscle names, counting sets per muscle, map colours, searching the exercise library, suggesting a swap for the same muscles |
| `model/records.test.js` | Which sets are personal records: heavier, more reps, longer holds, assisted; only one trophy for repeating a record; none the first time; records of a workout and of the last days |
| `model/partner.test.js` | Train together: her code carries her plan day exactly as her app plans it, enough history for "last time" and trophies, fits one QR code; only ticked sets are handed over; on her phone exercises match by name or are created, her plan day counts, the same workout can't be added twice |
| `model/tips.test.js` | Every exercise the app creates (starter list, plans, extras) has how-to tips |
| `model/bodyWeight.test.js` | One body weight per day, removing a day, the change over 30 days |
| `model/activities.test.js` | Activities of 20+ minutes count as active days (one per day), easy / moderate / hard WHO minutes, calendar day kinds, they survive backup and restore |
| `model/settings.test.js` | Automatic weight jumps, an exercise's own jump, automatic rest (2:00 big lifts, 1:30 the rest) |
| `model/calendar.test.js` | Weeks start on Monday, training days per week, streaks (rest days don't break them, a missed week does), the weekly goal |
| `data/migrations.test.js` | Data and backups from older versions still load correctly; a workout in progress survives a backup (grey plans, coach line, name); when to remind about a backup |

Run them before pushing a change to the rules in `model/`. When a test fails, it shows which scenario broke and the expected and actual values. `npm run test:watch` re-runs them on every save while you work.

---

## Features in detail

Everything the app does, roughly newest first. Planned next: see [ROADMAP.md](ROADMAP.md).

- **v0.29.1, keeping data safe on the phone:** one card under the week on Home, at most one at a time, both with "Not now". First "Install the app to keep your data" on a phone where the app is open in the browser (iPhone: "Safari might delete it after 7 days of inactivity. In Safari, tap Share, then Add to Home Screen."; Android: the browser might clear it when space runs low, with an **Install** button when Chrome offers one, otherwise "In the browser menu, tap Install app"). Installed, iOS keeps a separate use counter for home screen apps and Chrome gives installed sites protected storage. Once installed, or put off (until the next finished workout, since Safari's 7 days restart with every visit), "Save a backup" appears when one is due (every two weeks after 3 workouts; "Not now" = 7 days). Settings → Backup: shorter text, last backup and storage status together
- **v0.29, notes per exercise per workout:** a note icon on each exercise card in a workout (a dot on it when there's a note). It opens last time's note ("Last time (Nov 3): seat on 4, felt heavy") and a field for today's. Notes are saved as you type and stay with the workout, also on an exercise you skipped (it's kept in the finished workout with no sets, shown as "Skipped" with its note). They go along when a partner's workout is handed over, and are kept in backups. The exercise's page lists all of them ("Notes from workouts"), each deletable. "Your notes" on the exercise's page stay for permanent things (seat height, pin). The backup format is described in [BACKUP-FORMAT.md](BACKUP-FORMAT.md), as a guide for converting other data into it
- **v0.28, taking turns:** training together on the same workout ("Same workout as you"), you take turns on each exercise. When you tick a set, the card above the tabs says "Diana's turn" in her colour (instead of a rest timer: her set is your rest) and the screen swipes to her page, with that exercise at the same height on screen. When she ticks her set, it says "Your turn" and swipes back to you. Only when the other person has that exercise with sets left (matched by name); three or more people go round in order; otherwise the normal rest timer shows. Her page shows your warm-up and stretching checklist too (the same ticks), so both pages line up. A partner who scanned in with her own plan isn't part of it
- **v0.27, leaner:** the weigh-in left Home (body weight is logged in Progress, as before). Warm-up and stretching are set only in Settings; in a workout their "?" says so. "For testing" (sample data, reset) only shows on your own computer, so nobody wipes their workouts by accident. The "that's about a …" weight comparison after a workout is gone.
- **v0.26.1:** Edit on an exercise's page is an orange button. After swapping an exercise of today's plan day, its card says "Instead of X today. Keep in plan" (a link) (changes that day of the plan for next time; sets and healthy-extra marks stay). Not on a training partner's page
- **v0.26, warm-up and stretching:** a warm-up checklist under the muscle map (on by default): 5 min easy cardio, then 3 moves for the muscles in today's workout, each ticked off with ✓, or "Skip the warm-up today". Optional stretching at the end, after Add exercise and above the notes (Off / Quick: 4 stretches, 30 s, ~5 min / Thorough: held twice, plus hips and upper back, ~12 min). Picked from the workout's planned sets (healthy extras left out), so a leg day gets leg moves. Nothing is logged: the ticks disappear when the workout is finished. Only on your own page when training together. 13 warm-up moves and 17 stretches with how-to pages in Exercises → "Warm-up & stretch" (a search finds them too). Settings turns them on or off, each with a "?"
  - Why: warming up improved performance in 79% of measures in a meta-analysis, with little sign of harm ([Fradkin et al. 2010](https://www.bisp-surf.de/Record/PU201102000946)); dynamic, load-building warm-ups help upper-body strength and power, short static stretching does nothing for power ([McCrary et al. 2015](https://bjsm.bmj.com/content/49/14/935.abstract)); structured warm-ups cut leg injuries in young athletes ([Herman et al. 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3408383)); ACSM: 5–10 min light to moderate, dynamic before, static stretches (15–30 s) after. Static stretching under 60 s per muscle barely affects strength ([Behm et al. 2019](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2019.01468/pdf)); a cool-down doesn't reduce soreness or injuries ([Van Hooren & Peake 2018](https://rd.springer.com/content/pdf/10.1007/s40279-018-0916-2.pdf)), so stretching is off by default and its "?" says what it's for; lifting through a full range improves mobility about as much as stretching (Alizadeh et al. 2023)
- **v0.25, one walkthrough through the whole app:** it starts on Home (next workout, Start, empty workout and activities, Settings), then asks you to tap Progress (the lit tab pulses and works, everything else waits), goes on there (calendar, muscles, all workouts, exercises), then Plans (your plans, ready-made, make your own), then Exercises (search, muscle filter, how-to pages), and ends with "That's it". Skip ends all of it. Settings → "Show the walkthrough again" is now a button, above For testing
- **v0.24.1:** the welcome photo is gone again (plain background, larger body drawings)
- **v0.24, clearer first steps:** the welcome's three choices (who's training, your name, how to start) have clear space between them, and the days-a-week question is gone: the weekly goal comes from the plan (or 2 without one) and can be changed in Settings. The walkthrough on Home now has one step per tab (Progress, Plans, Exercises), and Progress has its own the first time you open it (habit, body weight, muscles, all workouts, exercises). The bubble always stays on screen, even next to a card taller than the screen. The "plan ready" card no longer touches the Active plan row
- **v0.23, welcome photo:** the notebook photo (src/assets/welcome-gym.webp: a leather training notebook with the app's dumbbell on it) fills the free space at the bottom of the welcome, fading in from the page (on short screens it just gets smaller, so nothing scrolls); "No account, no tracking"; days a week explains that a weekly goal helps training become a habit (weeks that reach it keep the streak going), that it's optional, and that a plan's days can set it instead (tap again to unset)
- **v0.22, welcome polish:** "Getting ready" on top (Home then says "Ready to train"), Man first then Woman (also in Settings), a new choice of days a week (ready-made plans are filtered to it, your own plan starts with that many days, and without a plan it's your weekly goal), and the faint rings of a weight plate in the background
- **v0.21, new welcome and a walkthrough:** the first screen is redone in the app's own look and fits one screen: two body drawings to tap (woman / man; the chosen one warms up like the muscle map), "A bit more each time", an optional name, and three ways to start: a ready-made plan, your own plan, or just start. Then a short walkthrough over the real screen (the page dims, one thing stays lit, a bubble explains it, Next / Skip): on Home the next workout, Start, the start tiles, the week and the tabs; in the first workout the coach line, the sets and Finish. Each is shown once; Settings → "Show the walkthrough again"
- **v0.20, first steps:** the welcome is one screen that fits without scrolling: the app icon, how it works in three short steps (start a workout; tick ✓ each set, grey numbers are the plan; next time it suggests a bit more), who's training, an optional name, then **Pick a ready-made plan** or **Start without a plan**. Right after choosing or making a plan, its page says it's ready (or that the days still need exercises) with a **Done** button back to Home
- **v0.19, after trying it in the gym:** the rest timer moves up above the keyboard while you type, so it stays in view; it times only your own sets (a partner's sets don't start it). A partner can just **join your workout** by name: no code, your exercises with as many sets, their own weights (scanning their code is still there, for their own plan). A partner's exercises that you also have (same name) get the ⓘ to their how-to page
- **v0.18, training together, simpler:** "Train together" folds open on Home under the day choice: **Start together** (starts the chosen day and adds your partner: scan or a name), **Show my code** (their phone logs your chosen day; with no plan you follow theirs), **Get my workout** (afterwards). Your name is asked once (welcome, or Settings → Your name). In the workout each person has the same page as a workout on your own, side by side: swipe sideways between them or tap a name on top. Each page has a stripe in that person's colour down its side, and the names on top show everyone's sets and kg so far, on one line with the clock. An empty partner page offers "Same exercises as you". The welcome is two short steps in the app's style (who's training, then a name with "Skip and start"). Scanning is more reliable: each camera frame is read at a different size
- **v0.16, train together:** one phone logs two (or more) people. On her phone, Home → Train together shows a QR code with her name and today's plan day, already planned by her app (grey values, suggestions), plus her last session and records of those exercises. On your phone, in the workout, ＋ Training partner scans it and a "You | Anna" switch appears on top; her part works like yours (coach line, rest timer, trophies, her body drawing), and she can do exercises from your list too. Someone without the app can be added by name. Finish saves your workout, and hers waits as a code ("Anna's workout is waiting" on Home) until her phone scans it in Train together → Get my workout; there it's a normal workout of hers (records, streak, plan day). Exercises go by name, so nothing has to match between the phones. No server, no account, works offline; a file can be sent instead of scanning. The data and the channel are separate (transfer.js), so the QR code can be swapped for something else later
- **kg only:** the kg / lb setting is gone, and so are miles

- **v0.15.3, fixes from a code review:** repeating a workout keeps its name and plan day (it used to become "Workout"); restoring a backup keeps a workout in progress as it was (grey plans, the coach line, its name); long histories open faster (the sorted list of workouts is worked out once, not for every row), and a running workout no longer redraws every exercise each second (only the clock does)

- **Rest timer card:** after you tick a set, a small card above the tabs (on every screen, while the workout runs) shows the rest left: it starts as a warm orange glow with a bright edge and drains from right to left, easy to see from a few steps away, with a draining ring next to the time, "−30 s / +30 s" for just this rest, and a "?" with why rest matters. When rest is over it shows a green ✓ "Ready" and fades away after 3 s; tap it to hide it sooner. Automatic rest is now by exercise: 2:00 after big lifts (squats, deadlifts, presses, rows, pull-ups), 1:30 after everything else (no longer by woman / man). The rest chip in the workout's header is gone

- **v0.13, planned values in grey:** in a workout, the values from last time plus the suggestion are only a plan, shown grey in empty fields. Tick ✓ and they become your values (white); type a number and yours counts instead. Whatever you type also becomes the grey plan for the empty sets below, so for a new exercise you fill in the first set and the rest follow. RPE is never pre-filled
- **Coach line:** one line above each exercise's sets says what to do today, with the numbers: "One more rep: 42.5 kg × 11, 11, 10", "Heavier: 45 kg (+2.5), back to 8 reps", "Same again: once more, then heavier". Tap it for why and last time, and "Same as last time instead" for a tired day (it rewrites the grey plan of the sets not done yet; "Back to the suggestion" undoes it). Anything else, just type it: it flows to the sets below. The first time you do an exercise it says how to pick a starting weight
- **Easier than expected:** high reps are fine on their own (muscle grows across a wide range of reps). But a set 4+ reps over its plan (or 15+ reps the first time) brings up "16 reps, 6 more than planned. Use 24 kg?" for the remaining sets, and a set 4+ reps above the time before makes the next suggestion heavier (1 to 3 steps, by estimated 1-rep max)
- Sets read shorter everywhere: "42.5 kg × 10, 10, 9 (RPE 8)" instead of "42.5 × 10 · 42.5 × 10 · 42.5 × 9 @8"

- **v0.12, clearer navigation:** four tabs, one job each. **Home** is today: this week, ways to start (the plan's next day is one choice next to an empty workout and logging an activity, never required; long exercise lists fold after five), a quick weigh-in, this week's records, the backup reminder, and Settings at the bottom. While a workout runs, the Home tab *is* the workout and shows its clock. **Progress** took in History: tap a calendar day and what you did shows underneath; "All workouts" (by month) and "Exercises" fold open at the bottom. **Plans** and **Exercises** are tabs of their own; Plans also has recent workouts to repeat. The first start asks only Woman / Man; a plan is offered, not required
- **Finish summary:** after Finish, the totals, how it compares with the last time you did that day, the new records and the muscles worked. The same summary is at the top of every workout in Progress
- **Exercise pages:** each exercise has two pages that link to each other. **How to** (opened from Exercises, or by tapping an exercise's name during a workout): main and helping muscles, three cues and the common mistake for all built-in exercises, a YouTube link, **your own notes** (seat height, pin…, shown under the exercise during workouts), Edit at the top right, and a "Your progress" line. **Progress** (opened from Progress): next time, records, chart, sessions, and a "How to do it" line
- **Plan day on Home:** long days show the first 5 exercises and "Show all 8 exercises"
- **Body weight** in Progress: the chart is the list; tap a point to see it or remove it

- **Other activities** (Home → Log activity): running, walking, cycling, swimming, dancing, yoga, hiking, team sport, climbing, or other (with its own name), with minutes and how hard (talk test); distance, calories, average heart rate and notes under "More details". Pace is worked out for running, walking and hiking. Shown in Progress and on the calendar as an orange ring (gym days are solid orange). 20+ minutes counts as an active day for the weekly goal and streak. Progress shows active minutes this week against the WHO's 150 (moderate ×1, hard ×2, easy not counted)
- **Swap** an exercise during a workout when the machine is taken: suggestions that work the same main muscles, most similar first, or search all. Only today's workout changes, not the plan
- **For testing** (Settings, folded at the bottom, only when running on your computer: `npm run dev` / `npm run preview`): fill the app with ~8 weeks of sample data, or reset it to a fresh install. Both replace everything and ask first
- **Body weight** is on by default: type it, tap Save, and see a chart (points spaced by date)
- **Healthy extras can be skipped** during a workout (the bin, which says the extra is optional and stays in the plan), and unticked extras don't trigger the "sets not ticked" question
- **V-taper and Hourglass** both come in 3 and 4 days a week. Woman / Man is asked once (first start, or Settings), not in the plan library
- **Plans menu:** My plans, ready-made plans (a library you pick from; only the one you choose is copied to your plans) and Make my own. Ready-made plans give each main muscle about 10 hard sets a week; more days a week just means shorter sessions, and every plan and day shows about how long it takes. New: Full body 2× and Push / Pull 2×
- **Healthy extras:** an optional short finisher on every day (core, plus grip, upper back or balance in turn), marked in the plan
- **Share a plan** as a file; the other person imports it in Plans (exercises are matched by name, missing ones created)
- **Exercise ideas:** tap a muscle on the body in the day editor to get exercises for it
- **Exercise editor** has Save / Cancel, so nothing changes by accident
- **Quiet updates:** a new version installs by itself while the app is in the background (or right after opening it), never in the middle of using it. Updates never touch your workouts
- **Back button / gesture** works like in other Android apps: back from Progress, Plans or Exercises goes to Home; back from Home closes the app
- **Backups work on Android** (shared as a .txt file, which Chrome allows; restore accepts .txt and .json)
- **Anonymous visit counts** with GoatCounter (no cookies, never any workout data): https://dvdsnpi.goatcounter.com

- **Personal records:** a set that beats everything you've done before (heavier, more reps at a weight, a longer hold) gets a 🏆 and a tiny firework. Progress shows how many records each workout had
- **First-run setup** on a new phone: woman or man, then start, or pick a ready-made plan first
- **Keep the screen on** during a workout (Settings, on by default)
- **Body weight** (optional, Settings): note it in Progress and see the trend
- Deploys run the tests first: if one fails, the phones keep the last good version
- **About you** (Settings): Woman or Man. Changes the body drawing (a female figure), which ready-made plans are recommended, and the automatic rest time. Training works the same for both
- **Hourglass** plans (3 or 4 days) for women: glutes and shoulders first, a strong back, light thigh work, no heavy oblique work. **V-taper** (4 days) for men: lats, side shoulders, upper chest and arms
- **Smaller weight jumps:** "Auto" picks a jump that suits the weight (+1 kg for light dumbbells up to +5 kg for heavy lifts), and each exercise can have its own jump
- **Rest target:** the rest timer counts towards 1:30 (women) or 2:00 (men), or your own choice, turns green and buzzes (Android) when it's time for the next set
- **Home:** a big READY TO TRAIN heading, this week at a glance (Mon–Sun, days trained vs. your weekly goal, streak), the next day of your plan with one-tap start, and a backup reminder
- **Exercise library** (Exercises tab): search, filter by muscle, add your own, rename, change the type, see stats and which plans use it. Pick the **main and helping muscles by tapping the body** (tap once = helping, twice = main, three times = off), or from a list
- **Training habit** (Progress): a month calendar of training days (tap a day to see what you did), the last 12 weeks against your weekly goal, streak in weeks, best streak, days since the last workout. The weekly goal is the number of days in your plan, or set it in Settings
- **Plans (splits):** choose how many days a week you train, then a ready-made split (Healthy basics, Full body, Push / Pull / Legs, Upper / Lower, Lower-body focus, Upper / Lower + PPL, Body-part split, PPL ×2, Arnold split) or name the days yourself. Plan each day's exercises and sets, with a body map per day and for the whole week. The start screen shows the next day, ready to start with one tap
- Log a workout: pick exercises, enter values, tick each set when it's done
- Four kinds of exercise: **weight × reps** (bench press), **bodyweight reps** (push-ups), **assisted / weighted ±** (machine or band pull-ups with − assistance, or + added weight), **timed holds** (plank)
- Optional **RPE** per set (how hard it felt, 1–10). Can be turned off in Settings
- New exercises start with 3 sets. Ones you've done before start from **last time, with a suggestion applied**, in one of three styles (Settings → Progression style): **Reps, then weight** (default: add a rep each session; 2 sessions in a row at +2 reps → add weight and go back to the starting reps), **Weight only**, or **By RPE**. It also suggests repeating after a near-max set and going lighter when you stall. ▲▼ next to each set compares it with last time
- Totals at the top of the workout (sets, weight lifted, reps, time), plus a workout timer and rest timer
- **Muscle map**: a front/back body that turns redder as each muscle gets more sets, live during the workout, per finished workout, and for the last 7 days in Progress. Main muscles count 1 set, helping muscles ½. Muscles are guessed from the exercise name and can be changed in the exercise library
- Every workout in Progress: summary, view, edit, delete, or **repeat** it
- Progress per exercise: personal records, a chart, and what to aim for next time
- Backup to a file and restore from it
- The phone's back button/gesture works inside the app
