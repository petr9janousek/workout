# Workout

A small workout tracker for the two of us. It runs on the phone with no internet, and the data never leaves the phone.

**What version 0.4 can do**

- Log a workout: pick exercises, enter values, tick each set when it's done
- Four kinds of exercise: **weight × reps** (bench press), **bodyweight reps** (push-ups), **assisted / weighted ±** (machine or band pull-ups with − assistance, or + added weight), **timed holds** (plank)
- Optional **RPE** per set (how hard it felt, 1–10). Can be turned off in Settings
- New exercises start with 3 sets. Ones you've done before start from **last time, with a suggestion applied**, in one of three styles (Settings → Progression style): **Reps, then weight** (default: add a rep each session; 2 sessions in a row at +2 reps → add weight and go back to the starting reps), **Weight only**, or **By RPE**. It also suggests repeating after a near-max set and going lighter when you stall. ▲▼ next to each set compares it with last time
- Totals at the top of the workout (sets, weight lifted, reps, time), plus a workout timer and rest timer
- **Muscle map**: a front/back body that turns redder as each muscle gets more sets, live during the workout, per workout in History, and for the last 7 days in Progress. Main muscles count 1 set, helping muscles ½. Muscles are guessed from the exercise name and can be changed in Settings → Exercises
- History: totals per workout; view, edit, delete, or **repeat** a workout
- Progress per exercise: personal records, a chart, and what to aim for next time
- Backup to a file and restore from it
- The phone's back button/gesture works inside the app

---

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

**Updates:** after you push a new version, open the app while online, close it and open it again, and the new version loads.

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
- **Navigation:** every screen has its own address after `#` (e.g. `#/history/<id>/edit`), so the phone's back button works. See `src/hooks/useRoute.js`.

```
index.html                 The page the browser loads first; shows errors instead of a blank page
vite.config.js             Build settings, and the PWA settings (app name, icon, colours, offline)
public/                    Icons, copied as-is
src/
  main.jsx                 Starting point: starts React
  App.jsx                  The frame: current screen + tab bar (+ a banner if saving fails)
  styles.css               All the look: colours at the top, then each part of the app

  model/                   ── the rules (pure functions, tested) ──
    format.js              Numbers and dates to text, typed text to numbers
    ids.js                 Unique ids
    exercises.js           Exercises and their 4 types, starter list, guessing the type from the name
    sets.js                Sets: creating, showing ("60 kg × 8 @8"), comparing with last time
    workouts.js            Workouts: finishing, totals, history of an exercise
    progression.js         "What to try next time": the three progression styles
    muscles.js             Which muscles an exercise works, sets per muscle, map colours
    settings.js            Settings and their defaults
    *.test.js              Tests (see below)

  data/                    ── the data ──
    DataProvider.jsx       The store: loads, keeps and saves all data; useData()
    db.js                  The phone's database (IndexedDB)
    migrations.js          Updates data saved by older versions of the app
    backup.js              Backup files: making, reading, sharing

  hooks/                   ── small reusable React helpers ──
    useRoute.js            Navigation and the back button
    useNow.js              The current time, ticking (timers)
    useRemembered.js       A setting remembered on this phone (e.g. folded cards)

  components/              ── pieces used by several screens ──
    ui/                    Icon, ChipGroup (pill buttons), NumberInput (+ ± input), BackButton, Suggestion
    charts/                LineChart, BodyMap (+ bodyShapes.js, the drawing), MuscleCard
    workout/               WorkoutEditor → ExerciseCard → SetRow; ExercisePicker; Totals

  screens/                 ── one folder per tab ──
    workout/               WorkoutScreen → StartWorkout or ActiveWorkout
    history/               HistoryScreen (list) → WorkoutDetail
    progress/              ProgressScreen (list) → ExerciseProgress
    settings/              SettingsScreen, BackupSettings, ExerciseList → ExerciseEditor
```

**Where to change things**

- Colours, sizes, spacing → `src/styles.css`. The main colours are at the top (`--accent` is the orange, `--heat-*` the muscle map).
- Wording on a screen → the matching file in `src/screens/`
- How suggestions work → `src/model/progression.js` (and its tests)
- Which muscles an exercise works → `RULES` in `src/model/muscles.js`
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

**Changing how data is stored:** raise `SCHEMA_VERSION` in `src/data/migrations.js` and add the conversion to `migrate()`. It runs when the app starts and when a backup is restored, so the phones' existing data and old backup files keep working. Add a test for it in `migrations.test.js`.

## Tests

```
npm test
```

runs all tests in a second or two and prints what passed. Each test is a short, plain-language scenario, for example *"adds a rep each session, confirms the goal once, then adds weight and goes back to the starting reps"*. The tests sit next to the code they check:

| File | What it checks |
|---|---|
| `model/progression.test.js` | The three progression styles, the safety rules (RPE 9.5+, dropping reps, plateaus), assisted / bodyweight / timed exercises, starting an exercise in today's workout |
| `model/workouts.test.js` | Finishing a workout, totals, an exercise's history |
| `model/sets.test.js` | Reading typed numbers ("62,5"), showing sets, ▲▼ comparisons |
| `model/muscles.test.js` | Guessing muscles, counting sets per muscle, map colours |
| `data/migrations.test.js` | Data and backups from older versions still load correctly |

Run them before pushing a change to the rules in `model/`. When a test fails, it shows which scenario broke and the expected and actual values. `npm run test:watch` re-runs them on every save while you work.
