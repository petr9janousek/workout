// Everything the app remembers is saved here, on the phone itself,
// in the browser's built-in database (IndexedDB). Nothing leaves the device.
//
// There are three "stores" (think: tables):
//   exercises  - { id, name }
//   workouts   - { id, startedAt, finishedAt, notes, entries: [...] }
//   settings   - { key, value }   e.g. { key: 'unit', value: 'kg' }

const DB_NAME = 'workout-app';
const DB_VERSION = 1;
const STORES = ['exercises', 'workouts', 'settings'];

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      // Runs the first time (and whenever DB_VERSION goes up): create the stores.
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('workouts')) db.createObjectStore('workouts', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

// Small helper: run one operation in a transaction and wait for it to finish.
async function run(storeName, mode, operation) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = operation(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const getAll = (store) => run(store, 'readonly', (s) => s.getAll());
export const put = (store, item) => run(store, 'readwrite', (s) => s.put(item));
export const remove = (store, id) => run(store, 'readwrite', (s) => s.delete(id));

// ---- Backup -------------------------------------------------------------

export async function exportAll() {
  const data = { app: 'workout', version: 1, exportedAt: new Date().toISOString() };
  for (const store of STORES) data[store] = await getAll(store);
  return data;
}

// Replaces everything on this phone with the contents of a backup.
export async function importAll(data) {
  if (!data || data.app !== 'workout' || !Array.isArray(data.workouts)) {
    throw new Error('This file is not a Workout backup.');
  }
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const store of STORES) {
      const s = tx.objectStore(store);
      s.clear();
      for (const item of data[store] || []) s.put(item);
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// Ask the browser not to delete our data when the phone is low on space.
// Returns true if the data is protected.
export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
