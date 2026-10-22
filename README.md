# Workout

A small workout tracker for the two of us. It runs on the phone with no internet, and the data never leaves the phone.

**What version 0.1 can do**

- Log a workout: pick exercises, enter weight and reps, tick each set when it's done
- See what you did **last time** for each exercise. New sets are pre-filled from it, so you only change what's different
- A workout timer, plus a rest timer that starts when you tick a set
- History of past workouts: view, edit, delete, or **repeat** one as today's plan
- Progress per exercise: personal records and a chart (heaviest set, estimated 1-rep max, volume, total reps)
- Create your own exercises, and rename or delete them
- Save a backup file and restore from it

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

0. Move the publishing script into the folder GitHub expects (once). In the VS Code terminal, in this folder:
   ```
   mkdir .github\workflows; move deploy.yml .github\workflows\deploy.yml
   ```
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

```
index.html              The page the browser loads first. Mostly just an empty <div> React fills in
vite.config.js          Build settings, and the PWA settings (app name, icon, colours, offline)
public/                 Icons, copied as-is
src/
  main.jsx              Starting point: starts React
  App.jsx               Holds all the data, saves changes, shows the tab bar and current screen
  db.js                 Saving to and loading from the phone's database (IndexedDB), and backups
  utils.js              Small helpers: formatting dates, "last time", progress calculations
  styles.css            All the look: colours at the top, then each part of the app
  screens/
    WorkoutScreen.jsx   Start screen and the workout in progress (timers, Finish, Discard)
    HistoryScreen.jsx   List of past workouts and the detail view
    ProgressScreen.jsx  Records, chart and sessions for each exercise
    SettingsScreen.jsx  Unit, backup and restore, managing exercises
  components/           Pieces used by several screens
    WorkoutEditor.jsx   Exercises and sets inside a workout (also used to edit old workouts)
    ExercisePicker.jsx  The searchable exercise list
    LineChart.jsx       The progress chart
    Icon.jsx            The small line icons
```

**Where to change things**

- Colours, sizes, spacing → `src/styles.css`. The main colours are at the top (`--accent` is the orange).
- Wording on a screen → the matching file in `src/screens/`
- The starting list of exercises → `STARTER_EXERCISES` in `src/utils.js`. This only applies to a fresh install.
- App name or icon on the home screen → `vite.config.js` and the files in `public/`

**How data is stored:** a workout is saved like this:

```js
{
  id: "…", startedAt: "2026-10-22T18:30:00Z", finishedAt: "…", notes: "",
  entries: [
    { exerciseId: "…", sets: [ { weight: "60", reps: "8", done: true }, … ] }
  ]
}
```

Only sets that are ticked ✓ count. When you finish a workout, unticked sets are left out.
