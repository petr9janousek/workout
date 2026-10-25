import { useData } from '../data/DataProvider.jsx';
import { createBackup, shareOrDownload } from '../data/backup.js';

// Returns save(): makes a backup file of everything and hands it to the phone
// (share sheet or download), then remembers when. Resolves to a message to show,
// or null if the user cancelled. Call it straight from a tap (iPhones need that).
export function useSaveBackup() {
  const { exercises, workouts, plans, settings, actions } = useData();

  return async function save() {
    try {
      // Built from what's in memory, so the share sheet opens straight after the tap.
      const shared = await shareOrDownload(createBackup({ exercises, workouts, plans, settings }));
      if (!shared) return null;
      actions.setSetting('lastBackup', new Date().toISOString());
      return 'Backup created.';
    } catch (err) {
      return `Backup failed: ${err.message}`;
    }
  };
}
