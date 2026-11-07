# Backup format

A Workout backup is one JSON file: **Settings → Backup → Save backup** makes it, and **Restore from backup** reads it. This page describes the format, so data from anywhere else (another app's export, a spreadsheet) can be converted into it, by hand, with a script or with an AI.

The app's own code is the final word: `src/data/backup.js` (reading and writing), `src/data/migrations.js` (how each record is cleaned up on restore), and the comments at the top of the files in `src/model/`.

## The file

- JSON, UTF-8. The app saves it as `.txt` on phones (Android refuses to share `.json`) or `.json`; restoring accepts both.
- **Restoring replaces everything in the app.** To add old workouts to what's already there, start from a fresh backup of the app, add the converted records to its lists, and restore that.

```json
{
  "app": "workout",
  "version": 4,
  "exportedAt": "2026-11-07T18:00:00.000Z",
  "exercises": [ … ],
  "workouts":  [ … ],
  "plans":     [ … ],
  "settings":  [ … ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `app` | yes | Always `"workout"`. Files without it are refused. |
| `version` | no | Data version, currently `4`. Older data is brought up to date on restore. |
| `exportedAt` | no | When the backup was made. |
| `exercises` | yes | List of exercises (may be empty). |
| `workouts` | yes | List of workouts and activities (may be empty). |
| `plans` | no | List of plans. |
| `settings` | no | List of `{ "key", "value" }`. Unknown keys are ignored. |

## General rules

- **IDs** are strings, unique within their list. Any unique text works (the app uses UUIDs). Workouts point to exercises by `exerciseId`, so these must match.
- **Dates** are ISO 8601 text in UTC with a time, e.g. `"2026-11-07T17:30:00.000Z"`.
- **Units:** weight in **kg**, time in **seconds**. Numbers are JSON numbers; an empty value is `null`.
- Fields the app doesn't know are dropped on restore.

## Exercises

```json
{ "id": "ex-bench", "name": "Bench press", "type": "weight" }
```

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique id. |
| `name` | yes | The exercise's name. |
| `type` | no | How it's logged (below). If missing, it's guessed from the name. |
| `muscles` | no | `{ "chest": 1, "triceps": 0.5 }`: 1 = main muscle, 0.5 = helping. If missing, guessed from the name. |
| `notes` | no | Your permanent notes (seat height, pin…), shown during workouts. |
| `weightStep` | no | How much heavier a "try heavier" suggestion goes for this exercise, in kg (e.g. `2.5`). |

**Types:**

| `type` | For | Set fields used |
|---|---|---|
| `weight` | weight × reps (bench press) | `weight`, `reps` |
| `reps` | bodyweight reps (push-ups) | `reps` (`weight` is `null`) |
| `assisted` | assisted or weighted bodyweight (pull-ups) | `weight` as a signed number: **−20** = 20 kg of help, **+10** = 10 kg added; `reps` |
| `time` | timed holds (plank) | `time` in seconds |

**Muscle ids:** `chest`, `shoulders`, `rearDelts`, `biceps`, `triceps`, `forearms`, `traps`, `lats`, `lowerBack`, `abs`, `obliques`, `glutes`, `quads`, `hamstrings`, `adductors`, `calves`.

**Names:** using these names (any capitalisation) gives the exercise its built-in how-to tips and muscles. Map other apps' names onto them where they mean the same exercise:

> arnold press, assisted pull-up, band pull-apart, barbell curl, barbell row, bench press, bird dog, bulgarian split squat, cable curl, cable fly, cable lateral raise, cable pull-through, calf raise, dead bug, dead hang, deadlift, dip, dumbbell curl, dumbbell shoulder press, ez bar curl, ez bar skullcrusher, face pull, glute kickback, hammer curl, hip abduction, hip thrust, incline bench press, incline dumbbell press, incline machine chest press, inverted skullcrusher, lat pulldown, lateral raise, leg curl, leg extension, leg press, lunge, machine lateral raise, overhead press, overhead triceps extension, pallof press, plank, plate pinch hold, pull-up, push-up, reverse wrist curl, romanian deadlift, seated cable row, seated dumbbell lateral raise, shoulder external rotation, shrug, side plank, single-leg romanian deadlift, squat, step-up, straight-arm pulldown, triceps pushdown, underhand pulldown, wide-grip incline bench press, wrist curl

Other names work too; they just have no tips, and their muscles are guessed.

## Workouts

```json
{
  "id": "w-2026-11-03",
  "startedAt": "2026-11-03T17:05:00.000Z",
  "finishedAt": "2026-11-03T18:10:00.000Z",
  "notes": "",
  "name": "Push A",
  "entries": [
    {
      "id": "w-2026-11-03-1",
      "exerciseId": "ex-bench",
      "note": "Felt strong, arch better",
      "sets": [
        { "id": "w-2026-11-03-1-1", "weight": 60, "reps": 8, "time": null, "rpe": 8, "done": true, "doneAt": null },
        { "id": "w-2026-11-03-1-2", "weight": 60, "reps": 7, "time": null, "rpe": 9, "done": true, "doneAt": null }
      ]
    }
  ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique id. |
| `startedAt` | yes | When it started. Workouts are listed and counted by this date. |
| `finishedAt` | yes | When it ended. `null` means a workout still in progress, so converted workouts must have a time here (if unknown, use `startedAt` plus about an hour). |
| `notes` | no | A note on the whole workout. |
| `name` | no | Shown in the history, e.g. the plan day's name. |
| `planId`, `dayId` | no | The plan and day it came from (see Plans). Leave out for imported history. |
| `entries` | yes | The exercises done, in order. |

**Entries** (one exercise in a workout):

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique id (unique across all workouts). |
| `exerciseId` | yes | The `id` of an exercise in `exercises`. |
| `sets` | yes | The sets, in order. |
| `note` | no | Your note on this exercise in this workout; shown next time and listed on the exercise's page. |
| `extra` | no | `true` for a "healthy extra" finisher from a plan. |

**Sets:**

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique id (keep it unique across the whole file, e.g. workout id + entry + number). |
| `weight` | no | kg, or `null`. Signed for `assisted` exercises. |
| `reps` | no | Number, or `null`. |
| `time` | no | Seconds, or `null`. |
| `rpe` | no | How hard it was, 1–10 (10 = no rep left), or `null`. |
| `done` | yes | `true` for every set that was actually done. Only done sets count anywhere. |
| `doneAt` | no | When it was ticked; `null` is fine for imported history. |

Converting notes:
- **Warm-up sets** marked as such in another app: leave them out. There's no warm-up flag, so they would count towards records and totals.
- **Dropsets, supersets, circuits:** just sets and entries in order. The same exercise can appear in several entries of one workout.
- **Distance or cardio inside a gym workout:** log it as an activity (below), or leave it out.
- **Pounds:** convert to kg (× 0.4536) and round to the nearest 0.25.

## Activities (runs, swims, classes…)

Stored in the same `workouts` list, marked with `"kind": "activity"`:

```json
{
  "id": "a-1", "kind": "activity", "activity": "run", "name": "",
  "startedAt": "2026-11-04T06:30:00.000Z", "finishedAt": "2026-11-04T07:05:00.000Z",
  "minutes": 35, "effort": "moderate",
  "distance": 6.2, "calories": null, "heartRate": 152,
  "notes": "", "entries": []
}
```

| Field | Meaning |
|---|---|
| `activity` | `run`, `walk`, `cycle`, `swim`, `dance`, `yoga`, `hike`, `sport`, `climb`… or `other` with a `name`. The full list is `ACTIVITY_TYPES` in `src/model/activities.js`. |
| `minutes` | How long. 20+ minutes counts as an active day. |
| `effort` | `easy`, `moderate` or `hard`. |
| `distance`, `calories`, `heartRate` | Optional (km, kcal, average bpm), or `null`. |

## Plans

```json
{
  "id": "p-1", "name": "Push / Pull / Legs", "templateId": null, "createdAt": "2026-11-01T10:00:00.000Z",
  "days": [
    { "id": "d-push", "name": "Push", "items": [ { "exerciseId": "ex-bench", "sets": 3 } ] }
  ]
}
```

Days have no weekday: the next day is the one after the last one done. `items[].sets` is the planned number of sets; `extra: true` marks a healthy extra. To make a plan the one shown on Home, set the `activePlanId` setting to its `id`.

## Settings

A list of `{ "key": "…", "value": … }`. Everything is optional; the useful ones when converting:

| Key | Value |
|---|---|
| `name` | Your first name (for training together). |
| `body` | `"male"` or `"female"` (body drawing, recommended plans). |
| `bodyWeights` | `[{ "date": "2026-11-07", "weight": 82.5 }]`, kg, one per day. |
| `activePlanId` | The `id` of the plan shown on Home. |
| `setupDone` | `true`, to skip the welcome screen. |

The rest are the app's preferences (rest time, progression style…); the defaults and their meaning are in `src/model/settings.js`.

## A complete minimal file

```json
{
  "app": "workout",
  "version": 4,
  "exercises": [
    { "id": "ex-squat", "name": "Squat", "type": "weight" },
    { "id": "ex-pullup", "name": "Pull-up", "type": "assisted" },
    { "id": "ex-plank", "name": "Plank", "type": "time" }
  ],
  "workouts": [
    {
      "id": "w1", "startedAt": "2026-10-01T17:00:00.000Z", "finishedAt": "2026-10-01T18:00:00.000Z", "notes": "",
      "entries": [
        { "id": "w1-1", "exerciseId": "ex-squat", "sets": [
          { "id": "w1-1-1", "weight": 80, "reps": 5, "time": null, "rpe": null, "done": true, "doneAt": null },
          { "id": "w1-1-2", "weight": 80, "reps": 5, "time": null, "rpe": null, "done": true, "doneAt": null }
        ] },
        { "id": "w1-2", "exerciseId": "ex-pullup", "sets": [
          { "id": "w1-2-1", "weight": -15, "reps": 8, "time": null, "rpe": null, "done": true, "doneAt": null }
        ] },
        { "id": "w1-3", "exerciseId": "ex-plank", "sets": [
          { "id": "w1-3-1", "weight": null, "reps": null, "time": 60, "rpe": null, "done": true, "doneAt": null }
        ] }
      ]
    }
  ],
  "settings": [ { "key": "setupDone", "value": true } ]
}
```
