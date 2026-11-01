import BackButton from '../../components/ui/BackButton.jsx';
import BodyMap from '../../components/charts/BodyMap.jsx';
import NotFound from '../../components/ui/NotFound.jsx';
import { HowTo } from './ExercisePage.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { moveById, doseOf } from '../../model/warmup.js';
import { muscleLabel } from '../../model/muscles.js';

// A warm-up move or a stretch (warmup.js): what it's for, how much, and how
// to do it. Nothing to log, so no progress or notes like an exercise has.
export default function MovePage({ id, backLabel, fallback }) {
  const { settings } = useData();
  const move = moveById(id);
  if (!move) return <NotFound what="exercise" label={backLabel} fallback={fallback} />;

  return (
    <div className="exercise-page">
      <BackButton label={backLabel} fallback={fallback} />
      <h1>{move.name}</h1>

      <section className="exercise-top">
        <dl className="exercise-facts">
          <dt>For</dt>
          <dd>{move.muscles.length ? move.muscles.map(muscleLabel).join(', ') : 'The whole body'}</dd>
          <dt>Part of</dt>
          <dd>{move.kind === 'stretch' ? 'Stretching' : 'Warm-up'}</dd>
          <dt>How much</dt>
          <dd>{doseOf(move, settings.stretching)}</dd>
        </dl>
        <div className="exercise-top-map">
          <BodyMap sets={Object.fromEntries(move.muscles.map((m) => [m, 8]))} compact />
        </div>
      </section>

      <HowTo exercise={move} tips={move} />
      <p className="muted small center">Nothing to log: tick it off in the workout's checklist.</p>
    </div>
  );
}
