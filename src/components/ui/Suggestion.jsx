// The coloured hint box: "▲ One more rep on every set" + why underneath.
// suggestion: { kind, title, text } from model/progression.js
// title: replaces the suggestion's own title (e.g. "Next time: 60 kg × 9 …")
// children: optional extra content (e.g. a button) on the right.

export const SUGGESTION_ICONS = { up: '▲', reps: '▲', confirm: '↻', hold: '=', down: '▼' };

export default function Suggestion({ suggestion, title = suggestion.title, children }) {
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
