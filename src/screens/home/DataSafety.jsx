import { useEffect, useState } from 'react';
import { useData } from '../../data/DataProvider.jsx';
import { useSaveBackup } from '../../hooks/useSaveBackup.js';
import { backupDue } from '../../data/backup.js';
import { finishedWorkouts } from '../../model/workouts.js';
import { formatDate } from '../../model/format.js';

// One card on Home about keeping the data safe, at most one at a time:
//   1. Install the app: on a phone where it's open in the browser. Safari
//      deletes a site's data after 7 days of use without a visit; Chrome may
//      clear it when space runs low. Installed, it's kept (iOS: home screen
//      apps have their own counter; Chrome: installed sites get protected
//      storage). Chrome offers its own Install button (beforeinstallprompt).
//   2. Save a backup: when one is due (backupDue).
// "Not now" puts the install card off until the next finished workout (Safari's
// 7 days restart with every visit, so it should come back while you train),
// the backup card for 7 days.

const isPhone = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const installed = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// Chrome's install prompt arrives once, early, so it's caught when this file loads.
let installPrompt = null;
const watchers = new Set();
const changed = () => watchers.forEach((f) => f());
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // our card offers it instead of Chrome's own bar
  installPrompt = e;
  changed();
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  changed();
});

const putOffFor = (iso, days) => Boolean(iso) && Date.now() - Date.parse(iso) < days * 864e5;
const putOffUntilWorkout = (iso, finished) => Boolean(iso) && !finished.some((w) => w.finishedAt > iso);

export default function DataSafety() {
  const { settings, workouts, actions } = useData();
  const later = (key) => actions.setSetting(key, new Date().toISOString());

  const finished = finishedWorkouts(workouts);
  if (isPhone() && !installed() && !putOffUntilWorkout(settings.installHintHidden, finished)) {
    return <InstallCard onLater={() => later('installHintHidden')} />;
  }
  const due = backupDue(settings.lastBackup, finished.length) && !putOffFor(settings.backupReminderHidden, 7);
  if (due) return <BackupCard lastBackup={settings.lastBackup} onLater={() => later('backupReminderHidden')} />;
  return null;
}

function InstallCard({ onLater }) {
  const [, update] = useState(0);
  useEffect(() => {
    const f = () => update((n) => n + 1);
    watchers.add(f);
    return () => watchers.delete(f);
  }, []);

  const install = async () => {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    changed();
  };

  const text = isIos()
    ? 'Safari might delete it after 7 days of inactivity. In Safari, tap Share, then Add to Home Screen.'
    : installPrompt
      ? 'The browser might clear it when the phone runs low on space.'
      : 'The browser might clear it when the phone runs low on space. In the browser menu, tap Install app or Add to Home screen.';
  return <Nudge title="Install the app to keep your data." text={text} action={installPrompt && 'Install'} onAction={install} onLater={onLater} />;
}

function BackupCard({ lastBackup, onLater }) {
  const saveBackup = useSaveBackup();
  const [message, setMessage] = useState('');
  const text = `${lastBackup ? `The last one was on ${formatDate(lastBackup)}.` : "You haven't saved one yet."} Your workouts are only on this phone.`;
  return (
    <Nudge title="Save a backup." text={text} action="Save backup" onAction={async () => setMessage((await saveBackup()) || '')} onLater={onLater} message={message} />
  );
}

// The card itself: the same look for both.
function Nudge({ title, text, action, onAction, onLater, message }) {
  return (
    <section className="reminder" role="status">
      <p>
        <strong>{title}</strong> {text}
      </p>
      <div className="nudge-actions">
        {action && <button className="btn btn-primary btn-small" onClick={onAction}>{action}</button>}
        <button className="btn-text small-link muted" onClick={onLater}>Not now</button>
      </div>
      {message && <p className="message">{message}</p>}
    </section>
  );
}
