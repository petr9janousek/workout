// The coloured hint box: "▲ Felt manageable (RPE 8), so try 62.5 kg".
// suggestion: { kind, text } from model/progression.js
// children: optional extra content (e.g. a button) on the right.

export const SUGGESTION_ICONS = { up: '▲', reps: '▲', confirm: '↻', hold: '=', down: '▼' };

export default function Suggestion({ suggestion, title, children }) {
  return (
    <div className={`suggestion ${suggestion.kind}`}>
      <span className="suggestion-icon" aria-hidden="true">{SUGGESTION_ICONS[suggestion.kind]}</span>
      <span className="suggestion-text">
        {title && (
          <>
            <strong>{title}</strong>
            <br />
          </>
        )}
        {suggestion.text}
      </span>
      {children}
    </div>
  );
}
