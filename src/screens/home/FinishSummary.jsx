import WorkoutSummary from '../../components/workout/WorkoutSummary.jsx';
import MuscleCard from '../../components/charts/MuscleCard.jsx';
import Firework from '../../components/ui/Firework.jsx';
import Icon from '../../components/ui/Icon.jsx';
import BackButton from '../../components/ui/BackButton.jsx';
import { useData } from '../../data/DataProvider.jsx';
import { back, openTab } from '../../hooks/useRoute.js';
import { workoutMuscleSets } from '../../model/muscles.js';
import { workoutRecords } from '../../model/records.js';
import { formatDuration } from '../../model/format.js';

// Right after Finish: what you did, in one look. Done goes back to Home.
export default function FinishSummary({ workoutId }) {
  const { workouts, exercisesById } = useData();
  const workout = workouts.find((w) => w.id === workoutId && w.finishedAt);

  if (!workout) {
    return (
      <div>
        <BackButton label="Home" fallback={['home']} />
        <p className="empty">This workout doesn't exist any more.</p>
      </div>
    );
  }

  const hasRecords = workoutRecords(workout, workouts, exercisesById).length > 0;

  return (
    <div className="finish">
      <header className="finish-head">
        <span className="finish-badge">
          <Icon name="check" size={30} />
          {hasRecords && <Firework />}
        </span>
        <h1>Nice work</h1>
        <p className="muted">
          {workout.name || 'Workout'} · {formatDuration(Date.parse(workout.finishedAt) - Date.parse(workout.startedAt))}
        </p>
      </header>

      <WorkoutSummary workout={workout} />
      <MuscleCard id="finish" title="Muscles worked" sets={workoutMuscleSets(workout, exercisesById)} scale="workout" />

      <div className="actions">
        <button className="btn btn-primary btn-wide" onClick={() => back('home')}>Done</button>
        <button className="btn-text small-link center-link" onClick={() => openTab('progress')}>See it in Progress</button>
      </div>
    </div>
  );
}
