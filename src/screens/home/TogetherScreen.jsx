import { useMemo, useState } from 'react';
import BackButton from '../../components/ui/BackButton.jsx';
import QrCode from '../../components/ui/QrCode.jsx';
import ScanCode from '../../components/ui/ScanCode.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { shareFile } from '../../data/backup.js';
import { openTab } from '../../hooks/useRoute.js';
import { makePass } from '../../model/partner.js';

// Train together (partner.js), the pages behind the buttons on Home
// (TogetherActions, under the Start button):
//   #/home/together/code/<day id|none>  your code for the other phone
//   #/home/together/get                 after training: get your workout from their phone
export default function TogetherScreen({ path = [] }) {
  const [page, id] = path;
  if (page === 'get') return <GetWorkout />;
  return <ShowCode dayId={page === 'code' && id !== 'none' ? id : null} />;
}

function ShowCode({ dayId }) {
  const { settings, activePlan, workouts, exercisesById, actions } = useData();
  const day = activePlan?.days.find((d) => d.id === dayId) || null;
  const [name, setName] = useState(settings.name);
  const trimmed = settings.name; // the code uses the saved name

  // Made once per name and day, not on every redraw (the code would be redrawn too).
  const pass = useMemo(
    () => trimmed && makePass({ name: trimmed, settings, exercisesById, workouts, plan: day && activePlan, day }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trimmed, day?.id],
  );

  return (
    <div className="together">
      <BackButton label="Home" fallback={['home']} />
      <h1>My code</h1>

      {pass ? (
        <>
          <p className="lead">
            On their phone: <strong>Train together → Start together</strong>, then scan this.
          </p>
          <section className="card qr-card">
            <QrCode data={pass} label="Your code for the other phone" />
            <p className="muted small center">
              {settings.name} · {day ? day.name : 'following their workout'}
            </p>
            <button className="btn-text small-link center-link" onClick={() => shareFile({ app: 'workout', ...pass }, 'workout-partner', 'My workout code')}>
              Can't scan? Send it as a file
            </button>
          </section>
        </>
      ) : (
        <section className="card welcome-step">
          <h3>Your name first</h3>
          <p className="muted small">So the other phone shows whose sets are whose. You only do this once.</p>
          <input className="search" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name or nickname" aria-label="Your name" />
          <button className="btn btn-primary btn-wide" disabled={!name.trim()} onClick={() => actions.setSetting('name', name.trim())}>
            Show my code
          </button>
        </section>
      )}
    </div>
  );
}

function GetWorkout() {
  const { settings, actions } = useData();

  function receive(data) {
    if (data.kind === 'pass') throw new Error("That's a code for starting together. Scan the one their phone shows after finishing.");
    if (data.to && settings.name && data.to.toLowerCase() !== settings.name.toLowerCase()) {
      if (!confirm(`This workout is for ${data.to}. Save it on this phone anyway?`)) throw new Error('Not saved.');
    }
    const workout = actions.importWorkout(data);
    openTab('home', 'done', workout.id); // its summary, with Done going Home
  }

  return (
    <div className="together">
      <BackButton label="Home" fallback={['home']} />
      <h1>Get my workout</h1>
      <p className="lead">On their phone, after finishing: open your workout's code, and point this camera at it.</p>
      <ScanCode onData={receive} />
    </div>
  );
}
