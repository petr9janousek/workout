// Turning numbers and dates into text for the screen, and text typed by the
// user back into numbers. No app logic here.

// ---- Numbers ----------------------------------------------------------------

// Text typed into a number field → number, null (empty) or undefined (not a
// number yet, e.g. "-" or "abc"). Accepts "62,5" as well as "62.5".
export function parseNumber(text) {
  const t = String(text ?? '').trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

// A number for display, without trailing zeros: 62.5 → "62.5", 60 → "60".
export const formatNumber = (n) => (n == null ? '' : String(Math.round(n * 100) / 100));

// A title that never leaves a short last word alone on its own line:
// "Full body A" wraps as "Full / body A", not "Full body / A".
export const keepLastWord = (text) => String(text ?? '').replace(/ (\S{1,3})$/, '\u00a0$1');

// Big totals with thousands separators: 12345 → "12,345".
export const formatTotal = (n) => Math.round(n).toLocaleString();

// Sets can be fractional (helping muscles count ½): 2.5 → "2.5", 3 → "3".
export const formatSets = (n) => String(Math.round(n * 2) / 2);

// −20 → "−20 kg", 10 → "+10 kg", 0 → "BW" (bodyweight).
export function formatSigned(n, unit = '') {
  if (!n) return 'BW';
  return `${n < 0 ? '−' : '+'}${formatNumber(Math.abs(n))}${unit ? ' ' + unit : ''}`;
}

// Seconds: 45 → "45 s", 90 → "1:30".
export function formatSeconds(sec) {
  const s = Math.round(sec || 0);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- Dates and times --------------------------------------------------------

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// 3 900 000 ms → "1 h 5 min"
export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

// A running timer: 75 000 ms → "1:15"
export function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
