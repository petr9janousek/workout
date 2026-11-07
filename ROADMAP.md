# Roadmap

The backlog, easiest first. Done items move to "Features in detail" in [DOCUMENTATION.md](DOCUMENTATION.md).
Size: S = an evening, M = a few evenings, L = a week or more.

## Now
1. **Backups that are hard to lose** (no server): restore from the welcome screen on a new phone; a reminder when 5 workouts aren't backed up or a week has passed, also right after Finish; a warning when the app isn't installed to the home screen (Safari deletes site data after 7 days without a visit); daily copies kept on the phone to undo mistakes
2. **Smarter progression:** analyse Petr's own history first (a backup file), then propose changes before building

## Backlog
1. **Partner names fit on small phones** (320 px: the second name hides under the clock) · S
2. **Settings tidy:** progression style, weight increase, rest, RPE and weekly goal in one "Suggestions" fold · S
3. **Together summary at Finish:** both people on one card, "4th workout together this month" · S
4. **Together streak:** weeks in a row you trained together · S
5. **Fair comparison between partners:** progress in % since the start or this month, instead of kilos · S
6. **Spot me:** mark heavy sets so the partner stands behind you, with how-to-spot tips for bench and squat · S
7. **Plate calculator:** which plates go on each side · S
8. **Plateau hint:** "Bench hasn't moved in 4 sessions", with what to try · M
9. **Monthly recap:** "October: 13 workouts, hip thrust +15 kg, 3 records" · M
10. **A strength plan** (5×5 style) in the library · M
11. **Partner exercises and a "Together" plan:** partner stretches, medicine-ball passes, plank high-fives, assisted pull-ups; "I go, you go" format · M
12. **Balance check:** push vs pull, front vs back, quads vs hamstrings over the last weeks · M
13. **Export to CSV, import from other apps** (Strong, Hevy) · M
14. **Share a plan as a link** (the plan is stored inside the link) · M
15. **Goals with an estimated date:** "Hip thrust 80 kg, on track for February" · M
16. **Weekly summary, deload week suggestions** · M
17. **Travel mode:** today's plan with dumbbell or bodyweight swaps · M
18. **Bigger exercise library** (59 with tips now; common machines, cable and dumbbell versions) · M–L
19. **Supersets** · M–L
20. **"Lose fat" focus:** 2–3 full-body days, ~250 min of activity a week (ACSM), the body weight trend, a clear note that food decides most of it, no calorie counting · L
21. **Progress photos** (makes backups big) · L
22. **TypeScript or type-checked JSDoc** · L

## Open decisions
- **Own domain, then hosting on Cloudflare:** do it before sending the link around widely. Moving people later means export on the old site, import on the new one.
- **A small relay server, no accounts** (Cloudflare Worker, free at our size): handing over by code or link instead of QR, automatic encrypted backups, two phones in one workout with taking turns, the partner's week, "gym tonight?" notifications, licence keys. The app must keep working fully offline.
- **App Store and Google Play** via Capacitor (same code): rest timer alerts on a locked phone, the phone's own backups, Health sync. Needs a Mac (or a cloud build) for iPhone, $99 a year (Apple), $25 once (Google).
- **Other activities** (runs, swims): keep only if someone actually logs them.
