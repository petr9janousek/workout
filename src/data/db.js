// The on-phone database (IndexedDB). Nothing leaves the device.
//
// Four "stores" (think: tables), each holding plain objects:
//   exercises  { id, name, type, muscles? }        see model/exercises.js
//   workouts   { id, startedAt, finishedAt, … }    see model/workouts.js
//   plans      { id, name, days: [...] }           see model/plans.js
//   settings   { key, value }                      see model/settings.js
//
// All functions return Promises (IndexedDB is asynchronous).

const DB_NAME = 'workout-app';
const DB_VERSION = 2; // the database structure (2: plans); data changes are handled in migrations.js
export const STORES = ['exercises', 'workouts', 'plans', 'settings'];

let dbPromise = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    // Runs the first time on a phone, and when DB_VERSION goes up: create missing stores.
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: store === 'settings' ? 'key' : 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

// Run work inside one transaction and resolve when it's safely written.
async function transaction(stores, mode, work) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    const result = work(tx);
    tx.oncomplete = () => resolve(result?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Saving was cancelled'));
  });
}

export const getAll = (store) => transaction(store, 'readonly', (tx) => tx.objectStore(store).getAll());
export const put = (store, item) => transaction(store, 'readwrite', (tx) => tx.objectStore(store).put(item));
export const remove = (store, id) => transaction(store, 'readwrite', (tx) => tx.objectStore(store).delete(id));

// Everything at once: { exercises, workouts, plans, settings }
export async function loadAll() {
  const lists = await Promise.all(STORES.map(getAll));
  return Object.fromEntries(STORES.map((store, i) => [store, lists[i]]));
}

// Replace everything (restoring a backup, or saving migrated data) in one go:
// either all of it is written or none of it.
export function replaceAll(data) {
  return transaction(STORES, 'readwrite', (tx) => {
    for (const store of STORES) {
      const s = tx.objectStore(store);
      s.clear();
      for (const item of data[store] || []) s.put(item);
    }
  });
}

// Ask the browser not to delete our data when the phone runs low on space.
export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export const isStoragePersisted = () => navigator.storage?.persisted?.() ?? Promise.resolve(null);
