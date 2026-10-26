import { useEffect, useRef, useState } from 'react';
import { useData } from '../../data/DataProvider.jsx';
import { readBackup } from '../../data/backup.js';
import { useSaveBackup } from '../../hooks/useSaveBackup.js';
import { isStoragePersisted } from '../../data/db.js';
import { formatDate } from '../../model/format.js';

// Save all data to a file, or restore from one.
export default function BackupSettings() {
  const { settings, actions } = useData();
  const saveBackup = useSaveBackup();
  const [message, setMessage] = useState('');
  const [persisted, setPersisted] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    isStoragePersisted().then(setPersisted);
  }, []);

  async function save() {
    const result = await saveBackup();
    if (result) setMessage(result);
  }

  async function restore(event) {
    const file = event.target.files[0];
    event.target.value = ''; // so choosing the same file again still works
    if (!file) return;
    try {
      const data = readBackup(await file.text());
      if (!confirm(`Restore ${data.workouts.length} workouts from this backup? Everything currently in the app will be replaced.`)) return;
      await actions.restore(data);
      setMessage('Backup restored.');
    } catch (err) {
      setMessage(`Could not restore: ${err.message}`);
    }
  }

  return (
    <section className="card">
      <h3>Backup</h3>
      <p className="muted small">
        Your workouts are stored only on this phone. Updates never touch them, but deleting the app from the home
        screen or getting a new phone does. Save a backup now and then: to Files, iCloud Drive or Google Drive, or
        send it to yourself.
      </p>
      <p className="small">Last backup: {settings.lastBackup ? formatDate(settings.lastBackup) : 'never'}</p>
      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={save}>Save backup</button>
        <button className="btn btn-secondary btn-wide" onClick={() => fileInput.current.click()}>Restore from backup</button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json,text/plain,.txt" hidden onChange={restore} />
      {message && <p className="message">{message}</p>}

      {persisted != null && (
        <p className="muted small">
          Storage: {persisted ? 'protected from automatic clean-up ✓' : 'not protected yet (install the app to the home screen)'}
        </p>
      )}
    </section>
  );
}
