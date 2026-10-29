import { useEffect, useState } from 'react';
import { parseNumber, formatNumber } from '../../model/format.js';

// A number field that works with numbers (or null when empty), while letting
// the user type freely: "62," stays on screen until it becomes "62,5".
// The text being typed is kept locally; only valid numbers go to onChange.
function useNumberText(value, onChange) {
  const [text, setText] = useState(formatNumber(value));

  // The value changed from outside (e.g. "Use last time"): show it.
  useEffect(() => {
    if (parseNumber(text) !== value) setText(formatNumber(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleText(next) {
    setText(next);
    const n = parseNumber(next);
    if (n !== undefined) onChange(n); // undefined = not a number (yet)
  }

  return [text, handleText];
}

// decimal: allow "62.5" (weights, RPE); otherwise whole numbers (reps, seconds)
export function NumberInput({ value, onChange, decimal = false, placeholder = '0', label, className = '' }) {
  const [text, setText] = useNumberText(value, onChange);
  return (
    <input
      className={`set-input ${className}`}
      inputMode={decimal ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      aria-label={label}
    />
  );
}

// A weight with a − / + button in front: − for assistance, + for added weight.
// Phone number keypads often have no minus key, hence the button.
// planned: the grey value while the field is empty (its sign shows too).
// defaultNegative: which sign to show while the field is empty and unplanned.
export function SignedInput({ value, onChange, planned = null, defaultNegative = false, label, className = '' }) {
  const [signWhenEmpty, setSignWhenEmpty] = useState(null); // null = from the plan, or the default
  const negative = value ? value < 0 : signWhenEmpty ?? (planned ? planned < 0 : defaultNegative);
  const signed = (abs, neg) => (abs == null ? null : neg ? -abs : abs);
  const [text, setText] = useNumberText(value == null ? null : Math.abs(value), (abs) => onChange(signed(abs, negative)));

  function flip() {
    setSignWhenEmpty(!negative);
    if (value) onChange(-value);
  }

  return (
    <div className={`signed-input ${className} ${negative ? 'negative' : 'positive'}`}>
      <button
        type="button"
        className="sign-btn"
        onClick={flip}
        aria-label={negative ? `${label}: assistance (tap for added weight)` : `${label}: added weight (tap for assistance)`}
      >
        {negative ? '−' : '+'}
      </button>
      <input inputMode="decimal" placeholder={planned != null ? formatNumber(Math.abs(planned)) : ''} value={text} onChange={(e) => setText(e.target.value.replace(/^[-+−]/, ''))} aria-label={label} />
    </div>
  );
}
