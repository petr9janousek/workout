// Backups: all data in one JSON file the user keeps (Files, Google Drive…).

import { migrate, SCHEMA_VERSION } from './migrations.js';
import { settingsToList } from '../model/settings.js';

// The backup object for { exercises, workouts, settings } (settings as an object).
export function createBackup({ exercises, workouts, settings }) {
  return {
    app: 'workout',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
    settings: settingsToList(settings),
  };
}

// Backup file text → up-to-date data, or an Error if it isn't a backup.
// Older backups are converted by migrate().
export function readBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a Workout backup.');
  }
  if (!data || data.app !== 'workout' || !Array.isArray(data.workouts) || !Array.isArray(data.exercises)) {
    throw new Error('This file is not a Workout backup.');
  }
  return migrate(data);
}

// Hand the file to the phone: the share sheet where available (save to Files,
// Drive…), otherwise a normal download. Resolves to false if the user cancelled.
// Must be called straight from a tap: iPhones only allow sharing then.
export async function shareOrDownload(backup) {
  const name = `workout-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([JSON.stringify(backup, null, 1)], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Workout backup' });
    } else {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return true;
  } catch (err) {
    if (err.name === 'AbortError') return false; // closed the share sheet
    throw err;
  }
}
