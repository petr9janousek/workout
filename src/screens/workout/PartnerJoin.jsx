import { useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import ScanCode from '../../components/ui/ScanCode.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { back } from '../../hooks/useRoute.js';
import { partnerFromPass, joinYourWorkout } from '../../model/partner.js';
import { showPerson } from './ActiveWorkout.jsx';

// Adding a training partner to the workout in progress (#/home/partner):
//   Join: just a name; they do your exercises (no code, no app needed).
//   Scan: their code from their phone brings their own plan day, weights and
//         suggestions. The camera starts only when you ask for it.
export default function PartnerJoin({ workout }) {
  const { actions } = useData();
  const [name, setName] = useState('');
  const [scanning, setScanning] = useState(false);

  function add(partner) {
    actions.saveWorkout({ ...workout, partners: [...(workout.partners || []), partner] });
    showPerson(workout.id, partner.id);
    back('home');
  }

  function receive(data) {
    if (data.kind !== 'pass') throw new Error("That's a finished workout. Scan the code from Home → Train together → Show my code on their phone.");
    add(partnerFromPass(data));
  }

  return (
    <div className="together">
      <BackButton label="Workout" fallback={['home']} />
      <h1>Training partner</h1>
      <p className="lead">Log someone's sets on this phone too. At the end, their workout goes to their phone with a code.</p>

      <section className="card together-option">
        <h3><Icon name="people" size={20} /> Same workout as you</h3>
        <p className="muted small">They do your exercises today and fill in their own weights.</p>
        <form
          className="row-gap"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) add(joinYourWorkout(name.trim(), workout));
          }}
        >
          <input className="search" value={name} onChange={(e) => setName(e.target.value)} placeholder="Their name" aria-label="Partner's name" />
          <button className="btn btn-primary" disabled={!name.trim()}>Join</button>
        </form>
      </section>

      <section className="card together-option">
        <h3><Icon name="qr" size={20} /> Their own plan</h3>
        <p className="muted small">
          On their phone: <strong>Home → Train together → Show my code</strong>. Their plan day, weights and suggestions
          come along.
        </p>
        {scanning ? (
          <ScanCode onData={receive} />
        ) : (
          <button className="btn btn-secondary btn-wide" onClick={() => setScanning(true)}>Scan their code</button>
        )}
      </section>
    </div>
  );
}
