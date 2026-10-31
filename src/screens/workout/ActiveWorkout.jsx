import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import WorkoutEditor, { useNewEntry } from '../../components/workout/WorkoutEditor.jsx';
import Totals from '../../components/workout/Totals.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useData, DataOverride } from '../../data/DataProvider.jsx';
import { useNow } from '../../hooks/useNow.js';
import { useWakeLock } from '../../hooks/useWakeLock.js';
import { go, back } from '../../hooks/useRoute.js';
import { finishWorkout, workoutTotals } from '../../model/workouts.js';
import { workoutMuscleSets } from '../../model/muscles.js';
import { indexById } from '../../model/exercises.js';
import { handOver, partnerLibrary } from '../../model/partner.js';
import { formatDate, formatClock, formatTotal, keepLastWord } from '../../model/format.js';
import { countEvent } from '../../analytics.js';

// Whose page is on screen ('me' or a partner's id), remembered while you
// look at other screens: { workoutId, person }.
let shown = { workoutId: null, person: 'me' };
export const showPerson = (workoutId, person) => (shown = { workoutId, person });

// Colours for training partners' pages (you are orange); see styles.css.
const PARTNER_COLORS = ['var(--person-2)', 'var(--person-3)', 'var(--person-4)'];

// The workout in progress: totals and timers pinned on top, muscle map,
// the exercises, and Finish / Discard.
// With training partners (partner.js) each person gets the same page side by
// side: swipe between them, or tap a name on top. Each page has a stripe in
// that person's colour down its side, and the names on top show everyone's
// sets and weight.
export default function ActiveWorkout({ workout, picking, swapping }) {
  const { exercises, exercisesById, settings, actions } = useData();
  useWakeLock(settings.keepAwake);
  const partners = workout.partners || [];
  const [person, setPerson] = useState(() => (shown.workoutId === workout.id ? shown.person : 'me'));
  const choose = (id) => {
    showPerson(workout.id, id);
    setPerson(id);
  };

  // A partner's page uses her data (DataOverride): her exercises first, then
  // yours, her history and her settings.
  const scopes = useMemo(
    () =>
      partners.map((p) => {
        const library = partnerLibrary(p, exercises);
        return { workouts: p.history, settings: p.settings, exercises: library, exercisesById: indexById(library) };
      }),
    [partners, exercises],
  );

  function finish() {
    const result = finishWorkout(workout);
    const handOvers = partners.map((p) => handOver(p, exercisesById)).filter(Boolean);
    const skipped = result.skipped + partners.reduce((n, p) => n + finishWorkout(p.workout).skipped, 0);
    if (!result.workout && !handOvers.length) {
      if (confirm('No sets are ticked as done, so there is nothing to save. Discard this workout?')) actions.deleteWorkout(workout.id);
      return;
    }
    if (skipped && !confirm(`${skipped} set(s) not ticked as done will be left out. Finish workout?`)) return;
    const mine = result.workout && { ...result.workout };
    if (mine) delete mine.partners; // they go to the outbox instead
    if (handOvers.length) {
      const waiting = handOvers.map((data) => ({ id: data.workout.id, workoutId: mine?.id ?? null, data }));
      actions.setSetting('outbox', [...settings.outbox, ...waiting]);
    }
    countEvent('workout-finished', 'Workout finished');
    if (mine) {
      actions.saveWorkout(mine);
      go('home', 'done', mine.id); // the summary; back from it is Home
    } else {
      // Only partners trained: nothing of yours to save, straight to the hand-over.
      actions.deleteWorkout(workout.id);
      go('home', 'send', handOvers[0].workout.id);
    }
  }

  function discard() {
    if (confirm('Discard this workout? Nothing from it will be saved.')) actions.deleteWorkout(workout.id);
  }

  const updatePartner = (p) => actions.saveWorkout({ ...workout, partners: partners.map((x) => (x.id === p.id ? p : x)) });
  function removePartner(partner) {
    if (!confirm(`Remove ${partner.name} from this workout? Their sets from today will be lost.`)) return;
    actions.saveWorkout({ ...workout, partners: partners.filter((x) => x.id !== partner.id) });
    choose('me');
  }

  const people = [
    { id: 'me', name: settings.name || 'You', color: 'var(--accent)', workout, onChange: actions.saveWorkout },
    ...partners.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: PARTNER_COLORS[i % PARTNER_COLORS.length],
      workout: p.workout,
      onChange: (w) => updatePartner({ ...p, workout: w }),
      scope: scopes[i],
      partner: p,
    })),
  ];

  // One person's page: the same as a workout on your own.
  const page = (p) => (
    <>
      <MuscleCard id="workout" title="Muscles worked" sets={workoutMuscleSets(p.workout, p.scope?.exercisesById || exercisesById)} scale="workout" />
      {p.partner && <SameAsYou partner={p} you={people[0]} yours={exercisesById} />}
      <WorkoutEditor
        workout={p.workout}
        onChange={p.onChange}
        picking={picking === p.id}
        onOpenPicker={() => go('home', 'add', p.id)}
        onClosePicker={() => back('home')}
        swapping={swapping}
        onOpenSwap={(entryId) => go('home', 'swap', entryId)}
        onCloseSwap={() => back('home')}
        onOpenExercise={p.partner ? null : (id) => go('home', 'exercise', id)}
      />
      {p.partner && (
        <button className="btn-text small-link center-link remove-partner" onClick={() => removePartner(p.partner)}>
          Remove {p.name} from this workout
        </button>
      )}
    </>
  );

  return (
    <div>
      <header className="workout-header">
        <h1>{keepLastWord(workout.name || 'Workout')}</h1>
        <p className="muted">{formatDate(workout.startedAt)}</p>
      </header>

      {/* Stays at the top while you scroll */}
      <div className="sticky-bar">
        {partners.length ? (
          <div className="people" role="group" aria-label="Whose page">
            {people.map((p) => (
              <PersonChip key={p.id} person={p} on={person === p.id} onClick={() => choose(p.id)} />
            ))}
          </div>
        ) : (
          <Totals workout={workout} live />
        )}
        <div className="timers">
          <WorkoutClock startedAt={workout.startedAt} />
        </div>
      </div>

      {partners.length ? (
        <PeoplePages people={people} shown={person} onSwipe={choose}>
          {(p) => (p.scope ? <DataOverride changes={p.scope}>{page(p)}</DataOverride> : page(p))}
        </PeoplePages>
      ) : (
        page(people[0])
      )}

      <div className="actions">
        <button className="btn btn-secondary btn-wide" onClick={() => go('home', 'partner')}>
          <Icon name="people" size={18} /> {partners.length ? 'Another training partner' : 'Training partner'}
        </button>
        <button className="btn btn-primary btn-wide" onClick={finish}>Finish workout</button>
        <button className="btn btn-danger-ghost btn-wide" onClick={discard}>Discard</button>
      </div>

      {/* room so the rest timer (in App.jsx) never covers Finish */}
      <div className="rest-space" aria-hidden="true" />
    </div>
  );
}

// A name on top: whose page it is, with their sets and weight so far.
function PersonChip({ person, on, onClick }) {
  const t = workoutTotals(person.workout);
  return (
    <button className="person-chip" style={{ '--person': person.color }} aria-pressed={on} onClick={onClick}>
      <span className="person-chip-name">{person.name}</span>
      <span className="person-chip-totals">
        {t.sets}/{t.planned} sets{t.volume > 0 ? ` · ${formatTotal(t.volume)} kg` : ''}
      </span>
    </button>
  );
}

// Everyone's pages side by side; swipe sideways between them. The pages are
// as tall as the one on screen, so Finish sits right below it.
// shown: the person whose page is on screen; onSwipe(id) after a swipe.
function PeoplePages({ people, shown, onSwipe, children }) {
  const box = useRef(null);
  const index = Math.max(0, people.findIndex((p) => p.id === shown));

  // Tapping a name (or opening the workout) brings that page into view.
  useEffect(() => {
    const el = box.current;
    const left = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) > 2) el.scrollTo({ left, behavior: 'smooth' });
  }, [index]);

  // Height follows the page on screen, also when it grows (a set added).
  useLayoutEffect(() => {
    const el = box.current;
    const page = el.children[index];
    const fit = () => (el.style.height = `${page.offsetHeight}px`);
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(page);
    return () => watch.disconnect();
  }, [index]);

  // After a swipe settles, the page on screen becomes the chosen one.
  function onScroll() {
    const el = box.current;
    clearTimeout(el.settle);
    el.settle = setTimeout(() => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (people[i] && i !== index) onSwipe(people[i].id);
    }, 120);
  }

  return (
    <div className="people-pages" ref={box} onScroll={onScroll}>
      {people.map((p) => (
        <section key={p.id} className="person-page" style={{ '--person': p.color }} aria-label={`${p.name}'s exercises`}>
          {children(p)}
        </section>
      ))}
    </div>
  );
}

// On a partner's page while it's empty: start with your exercises (found
// by name in hers, so her history plans them). yours: your exercises by id.
function SameAsYou({ partner, you, yours }) {
  const { exercises } = useData(); // hers, inside her page
  const newEntry = useNewEntry(partner.workout);
  if (partner.workout.entries.length || !you.workout.entries.length) return null;

  function add() {
    const byName = new Map(exercises.map((e) => [e.name.toLowerCase(), e]));
    const entries = you.workout.entries
      .map((e) => [byName.get(yours.get(e.exerciseId)?.name.toLowerCase()), e.sets.length])
      .filter(([exercise]) => exercise)
      .map(([exercise, sets]) => newEntry(exercise, sets));
    partner.onChange({ ...partner.workout, entries });
  }

  return (
    <button className="btn btn-secondary btn-wide same-as-you" onClick={add}>
      Same exercises as {you.name === 'You' ? 'you' : you.name}
    </button>
  );
}

// The workout's running time. Its own component, so only this ticks every
// second, not the whole workout.
function WorkoutClock({ startedAt }) {
  const now = useNow();
  return <span className="timer" aria-label="Workout duration">{formatClock(now - Date.parse(startedAt))}</span>;
}
