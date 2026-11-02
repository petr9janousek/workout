# Roadmap

What we've agreed to build next. Done items move to "Features in detail" in [DOCUMENTATION.md](DOCUMENTATION.md).

## Next
- Nothing big: friends start using it, and what they (and we) run into in the gym decides what comes next.

## Later
- **"Lose fat" focus:** 2–3 full-body strength days to keep muscle, an activity target (~250 min a week, per ACSM), the body weight trend, and a clear note that food decides most of the result. No calorie counting.
- **Share a plan as a link** (the plan is stored inside the link; same data as the file)
- **A strength plan** (5×5 style) in the library
- **Automatic backup** to the user's own Google Drive (optional)

## Ideas, not decided
- **Live sharing and automatic backup with a tiny server (or a free relay such as ntfy.sh / Nostr):** an encrypted box (e.g. a free Cloudflare Worker). Phones pair by QR code, the key stays on the phones, the server only ever sees scrambled data. No accounts. Costs nothing at our size, but it's a server to look after and it changes "everything stays on your phone".
- Plateau hint: "Bench hasn't moved in 4 sessions", with what to try
- Balance check: push vs pull, front vs back, quads vs hamstrings over the last weeks
- Monthly recap ("October: 13 workouts, hip thrust +15 kg, 3 records")
- Goals with an estimated date ("Hip thrust 80 kg, on track for February")
- Progress photos (camera works in the app; photos make backups big)
- Travel mode: today's plan with dumbbell or bodyweight swaps
- Plate calculator, supersets
- Weekly summary, deload week suggestions
- TypeScript or type-checked JSDoc

## Dropped
- Czech: one friend asked, we both prefer English. Back on the list if more people ask (it touches every text: UI, plurals, exercise names, tips, warm-up moves).
- Period tracking: dedicated apps already do it.
- A "Tools" tab: not enough in it.
