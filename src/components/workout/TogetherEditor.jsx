import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon.jsx';
import { EntryCard, EntryPickers, WorkoutNotes, useNewEntry } from './WorkoutEditor.jsx';
import { useData, DataOverride } from '../../data/DataProvider.jsx';
import { pairRows } from '../../model/partner.js';

// Two (or more) people training together on one phone (partner.js): one row
// per exercise, and each row is a little stack of cards, one per person,
// that you swipe sideways. Every card has the person's colour stripe and
// name. The same exercise shares a row; where someone has none, their card
// offers to add it. `show` (from the switch on top) swipes every row to that
// person; showCount changes each time it's tapped, even for the same person.
//
// people: [{ id, name, color, workout, onChange, exercisesById, scope }]
//   scope: that person's data for DataOverride (null for you)
export default function TogetherEditor({ people, show, showCount, picking, onOpenPicker, onClosePicker, swapping, onOpenSwap, onCloseSwap, onOpenExercise }) {
  const list = useRef(null);
  const names = new Map(people.flatMap((p) => p.workout.entries.map((e) => [e.id, p.exercisesById.get(e.exerciseId)?.name || ''])));
  const rows = pairRows(people.map((p) => ({ id: p.id, entries: p.workout.entries })), (e) => names.get(e.id));
  const showIndex = Math.max(0, people.findIndex((p) => p.id === show));

  useEffect(() => {
    for (const row of list.current.querySelectorAll('.swipe-row')) {
      row.scrollTo({ left: row.children[showIndex]?.offsetLeft ?? 0, behavior: 'smooth' });
    }
  }, [showIndex, showCount, rows.length]);

  return (
    <div className="editor together-editor" ref={list}>
      {rows.map((row, i) => {
        const any = Object.values(row)[0];
        return (
          <div className="swipe-row" key={i}>
            {people.map((p) => (
              <div className="swipe-slide" key={p.id}>
                <Scope person={p}>
                  {row[p.id] ? (
                    <EntryCard
                      workout={p.workout}
                      entry={row[p.id]}
                      onChange={p.onChange}
                      onOpenSwap={onOpenSwap}
                      onOpenExercise={p.scope ? null : onOpenExercise}
                      person={p}
                    />
                  ) : (
                    <AddSame person={p} name={names.get(any.id)} sets={any.sets.length} />
                  )}
                </Scope>
              </div>
            ))}
          </div>
        );
      })}

      {people.map((p) => (
        <Scope key={p.id} person={p}>
          <PersonActions person={p} first={people[0]} onOpenPicker={() => onOpenPicker(p.id)} names={names} />
          <EntryPickers
            workout={p.workout}
            onChange={p.onChange}
            picking={picking === p.id}
            onClosePicker={onClosePicker}
            swapping={swapping}
            onCloseSwap={onCloseSwap}
          />
        </Scope>
      ))}

      <WorkoutNotes workout={people[0].workout} onChange={people[0].onChange} />
    </div>
  );
}

// Inside it, the data is this person's (her exercises, history, settings).
function Scope({ person, children }) {
  return person.scope ? <DataOverride changes={person.scope}>{children}</DataOverride> : children;
}

// The card where someone has no exercise in this row: add the same one.
function AddSame({ person, name, sets }) {
  const { exercises } = useData();
  const newEntry = useNewEntry(person.workout);
  const exercise = exercises.find((e) => e.name.toLowerCase() === name.toLowerCase());
  const add = () => person.onChange({ ...person.workout, entries: [...person.workout.entries, newEntry(exercise, sets)] });

  return (
    <section className="card exercise-card for-person add-same" style={{ '--person': person.color }}>
      <span className="person-name">{person.name}</span>
      {exercise ? (
        <button className="btn btn-secondary btn-wide" onClick={add}>
          <Icon name="plus" size={18} /> {name} for {person.name}
        </button>
      ) : (
        <p className="muted small">{name} isn't in {person.scope ? `${person.name}'s` : 'your'} exercises.</p>
      )}
    </section>
  );
}

// Below the rows, for each person: add an exercise, and for a partner who
// has nothing yet, "Same exercises as" the first person in one tap.
function PersonActions({ person, first, onOpenPicker, names }) {
  const { exercises } = useData();
  const newEntry = useNewEntry(person.workout);
  const same = person !== first && person.workout.entries.length === 0 && first.workout.entries.length > 0;

  function addSame() {
    const byName = new Map(exercises.map((e) => [e.name.toLowerCase(), e]));
    const entries = first.workout.entries
      .map((e) => [byName.get(names.get(e.id).toLowerCase()), e.sets.length])
      .filter(([exercise]) => exercise)
      .map(([exercise, sets]) => newEntry(exercise, sets));
    person.onChange({ ...person.workout, entries });
  }

  return (
    <div className="person-actions" style={{ '--person': person.color }}>
      {same && (
        <button className="btn btn-secondary btn-wide" onClick={addSame}>
          {person.name}: same exercises as {first.name === 'You' ? 'you' : first.name}
        </button>
      )}
      <button className="btn btn-secondary btn-wide person-add" onClick={onOpenPicker}>
        <Icon name="plus" size={18} /> Exercise for {person.name}
      </button>
    </div>
  );
}
