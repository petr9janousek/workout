import { FRONT, BACK, FRONT_LINES, BACK_LINES, HEAD } from './bodyShapes.js';

// The front + back body drawing. Used by the muscle map (colours by sets)
// and the muscle picker (colours by main / helping).
//   levelOf(muscleId) → 0–4: how strongly to colour it (heat-0 … heat-4)
//   onTap(muscleId):   optional; makes muscles tappable
//   selected:          a muscle to outline
//   captions:          show "Front" / "Back" under the figures
//   label:             what a screen reader says for the picture
export default function BodyFigure({ levelOf, onTap, selected, captions = true, label }) {
  function half(shapes, lines, mirror) {
    return (
      <g transform={mirror ? 'translate(120,0) scale(-1,1)' : undefined}>
        {shapes.map((s, i) =>
          s.muscle ? (
            <path
              key={i}
              d={s.d}
              className={`body-muscle heat-${levelOf(s.muscle)}${selected === s.muscle ? ' selected' : ''}${onTap ? ' tappable' : ''}`}
              onClick={onTap ? () => onTap(s.muscle) : undefined}
            />
          ) : (
            <path key={i} d={s.d} className="body-skin" />
          ),
        )}
        {lines.map((d, i) => <path key={`l${i}`} d={d} className="body-line" />)}
      </g>
    );
  }

  const figure = (shapes, lines, offsetX, caption) => (
    <g transform={`translate(${offsetX},0)`}>
      <path d={HEAD} className="body-skin" />
      {half(shapes, lines, false)}
      {half(shapes, lines, true)}
      {captions && <text x="60" y="216" className="body-caption" textAnchor="middle">{caption}</text>}
    </g>
  );

  return (
    <svg viewBox={captions ? '0 0 250 220' : '0 0 250 208'} role="img" aria-label={label}>
      {figure(FRONT, FRONT_LINES, 0, 'Front')}
      {figure(BACK, BACK_LINES, 130, 'Back')}
    </svg>
  );
}
