import { HEAD, figureFor } from './bodyShapes.js';
import { useData } from '../../data/DataProvider.jsx';

// The front + back body drawing. Used by the muscle map (colours by sets)
// and the muscle picker (colours by main / helping).
//   levelOf(muscleId) → 0–4: how strongly to colour it (heat-0 … heat-4)
//   onTap(muscleId):   optional; makes muscles tappable
//   selected:          a muscle to outline
//   captions:          show "Front" / "Back" under the figures
//   label:             what a screen reader says for the picture
// The figure is female or male following Settings → About you.
export default function BodyFigure({ levelOf, onTap, selected, captions = true, label }) {
  const { settings } = useData();
  const shapes = figureFor(settings.body);

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

  const hair = (d) => d && [false, true].map((mirror) => (
    <path key={String(mirror)} d={d} className="body-hair" transform={mirror ? 'translate(120,0) scale(-1,1)' : undefined} />
  ));

  const figure = (parts, lines, offsetX, caption, hairBehind, hairOver) => (
    <g transform={`translate(${offsetX},0)`}>
      {hair(hairBehind)}
      <path d={HEAD} className="body-skin" />
      {half(parts, lines, false)}
      {half(parts, lines, true)}
      {hair(hairOver)}
      {captions && <text x="60" y="216" className="body-caption" textAnchor="middle">{caption}</text>}
    </g>
  );

  return (
    <svg viewBox={captions ? '0 0 250 220' : '0 0 250 208'} role="img" aria-label={label}>
      {figure(shapes.front, shapes.frontLines, 0, 'Front', shapes.hairFront, null)}
      {figure(shapes.back, shapes.backLines, 130, 'Back', null, shapes.hairBack)}
    </svg>
  );
}
