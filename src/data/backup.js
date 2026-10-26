// Backups: all data in one JSON file the user keeps (Files, Google Drive…).

import { migrate, SCHEMA_VERSION } from './migrations.js';
import { settingsToList } from '../model/settings.js';

// The backup object for { exercises, workouts, plans, settings } (settings as an object).
export function createBackup({ exercises, workouts, plans, settings }) {
  return {
    app: 'workout',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
    plans,
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
  if (data?.app === 'workout' && data.kind === 'plan') {
    throw new Error('This is a plan, not a backup. Import it in Workout → Plans.');
  }
  if (!data || data.app !== 'workout' || !Array.isArray(data.workouts) || !Array.isArray(data.exercises)) {
    throw new Error('This file is not a Workout backup.');
  }
  return migrate(data);
}

// Time for a backup reminder? After 3+ workouts, if there's never been a
// backup or the last one is over two weeks old.
export function backupDue(lastBackup, finishedCount, now = Date.now()) {
  if (finishedCount < 3) return false;
  return !lastBackup || now - Date.parse(lastBackup) > 14 * 864e5;
}

// Hand the file to the phone: the share sheet where available (save to Files,
// Drive, send to yourself…), otherwise a normal download. Resolves to false if
// the user closed the share sheet. Call it straight from a tap: phones only
// allow sharing then.
//
// Shared as .txt: Chrome on Android refuses to share .json files
// ("Permission denied"), but text files are allowed everywhere. The content
// is the same JSON, and restoring accepts both.
export function shareOrDownload(backup) {
  const date = new Date().toISOString().slice(0, 10);
  return shareFile(backup, `workout-backup-${date}`, 'Workout backup');
}

// Any of our files (backups, plans): `name` without the extension.
export async function shareFile(data, name, title) {
  const text = JSON.stringify(data, null, 1);
  const file = new File([text], `${name}.txt`, { type: 'text/plain' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false; // closed the share sheet
      // Sharing refused: fall back to a download below.
    }
  }
  download(new File([text], `${name}.json`, { type: 'application/json' }));
  return true;
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
