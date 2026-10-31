# Roadmap

What we've agreed to build next. Done items move to "Features in detail" in [DOCUMENTATION.md](DOCUMENTATION.md).

## Next

### Czech and English
- Switch in Settings and on the welcome screen. Default from the phone's language.
- All UI text, dates and numbers in Czech, with proper Czech plurals (1 cvik, 2 cviky, 5 cviků).
- Exercise names: separate setting (Czech or English), since many people in Czech gyms use the English names anyway. Exercises you add yourself keep the name you typed.
- Plan and day names get the language that was active when the plan was created.
- Also the exercise tips (tips.js) and the weight comparisons.

### Train together, later steps
Done in v0.16 (one phone logs both, QR hand-over; see DOCUMENTATION.md). Possible next:
- A text summary for someone without the app ("Copy as text" on the hand-over screen).
- Supersets: alternate between your exercise and your partner's without switching back and forth.
- Another channel instead of QR if scanning is a hassle (the data side is ready for it, see transfer.js).

## Later
- **Share progress with a partner, no server:** "Share my week" shows a QR code or card; the other phone shows it next to its own week (streak, workouts, records). A snapshot, not live.
- **"Lose fat" focus:** 2–3 full-body strength days to keep muscle, an activity target (~250 min a week, per ACSM), the body weight trend, and a clear note that food decides most of the result. No calorie counting.
- **Share a plan as a link** (the plan is stored inside the link; same data as the file)
- **Weekly goal optional** ("no goal")
- **A strength plan** (5×5 style) in the library
- **Mobility exercises** in the exercise library (timed holds), not in plans
- **Automatic backup** to the user's own Google Drive (optional)

## Ideas, not decided
- **Live sharing and automatic backup with a tiny server (or a free relay such as ntfy.sh / Nostr):** an encrypted box (e.g. a free Cloudflare Worker). Phones pair by QR code, the key stays on the phones, the server only ever sees scrambled data. No accounts. Costs nothing at our size, but it's a server to look after and it changes "everything stays on your phone".
- Plateau hint: "Bench hasn't moved in 4 sessions", with what to try
- Balance check: push vs pull, front vs back, quads vs hamstrings over the last weeks
- Monthly recap ("October: 13 workouts, hip thrust +15 kg, 3 records")
- Goals with an estimated date ("Hip thrust 80 kg, on track for February")
- Progress photos (camera works in the app; photos make backups big)
- Travel mode: today's plan with dumbbell or bodyweight swaps
- Warm-up sets, plate calculator, supersets
- Weekly summary, deload week suggestions
- TypeScript or type-checked JSDoc

## Dropped
- Period tracking: dedicated apps already do it.
- A "Tools" tab: not enough in it.
