import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import ScanCode from '../../components/ui/ScanCode.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { back } from '../../hooks/useRoute.js';
import { partnerFromPass, newPartner } from '../../model/partner.js';
import { showPerson } from './ActiveWorkout.jsx';

// Adding a training partner to the workout in progress (#/home/partner):
// scan the code on her phone, or just type a name (no app, or no code).
export default function PartnerJoin({ workout }) {
  const { actions } = useData();
  const [name, setName] = useState('');

  function add(partner) {
    actions.saveWorkout({ ...workout, partners: [...(workout.partners || []), partner] });
    showPerson(workout.id, partner.id);
    back('home');
  }

  function receive(data) {
    if (data.kind !== 'pass') throw new Error("That's a finished workout. Scan the code from Train together → Show my code on their phone.");
    add(partnerFromPass(data));
  }

  return (
    <div className="together">
      <BackButton label="Workout" fallback={['home']} />
      <h1>Training partner</h1>
      <p className="lead">
        Log someone's sets on this phone too. On their phone: <strong>Home → Train together → Show my code</strong>,
        then scan it. Their plan, weights and suggestions come along.
      </p>
      <ScanCode onData={receive} />

      <section className="card">
        <h3>No app, or no code?</h3>
        <p className="muted small">Add them by name and pick their exercises as you go.</p>
        <div className="row-gap">
          <input className="search" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Partner's name" />
          <button className="btn btn-secondary" disabled={!name.trim()} onClick={() => add(newPartner(name.trim()))}>
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
