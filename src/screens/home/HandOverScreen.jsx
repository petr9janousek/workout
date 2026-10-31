import BackButton from '../../components/ui/BackButton.jsx';
import NotFound from '../../components/ui/NotFound.jsx';
import QrCode from '../../components/ui/QrCode.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { shareFile } from '../../data/backup.js';
import { back } from '../../hooks/useRoute.js';
import { formatDate } from '../../model/format.js';

// A training partner's finished workout, as a code for her phone
// (#/home/send/<id>). It waits in settings.outbox until you say she has it.
export default function HandOverScreen({ id }) {
  const { settings, actions } = useData();
  const item = settings.outbox.find((o) => o.id === id);
  if (!item) return <NotFound what="hand-over" label="Home" fallback={['home']} />;

  const { to, workout } = item.data;
  const sets = workout.entries.reduce((n, e) => n + e.sets.length, 0);

  function done() {
    actions.setSetting('outbox', settings.outbox.filter((o) => o.id !== id));
    back('home');
  }

  return (
    <div className="together">
      <BackButton label="Back" fallback={['home']} />
      <h1>{to}'s workout</h1>
      <p className="lead">
        On {to}'s phone: <strong>Train together → Get my workout</strong>, then scan this.
      </p>
      <section className="card qr-card">
        <QrCode data={item.data} label={`${to}'s workout`} />
        <p className="muted small center">
          {workout.name || 'Workout'} · {formatDate(workout.startedAt)} · {workout.entries.length}{' '}
          {workout.entries.length === 1 ? 'exercise' : 'exercises'}, {sets} {sets === 1 ? 'set' : 'sets'}
        </p>
        <button
          className="btn-text small-link center-link"
          onClick={() => shareFile({ app: 'workout', ...item.data }, `workout-for-${to.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Workout for ${to}`)}
        >
          Can't scan? Send it as a file
        </button>
      </section>
      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={done}>{to} has it</button>
        <button className="btn-text small-link center-link" onClick={() => back('home')}>Later</button>
      </div>
    </div>
  );
}
