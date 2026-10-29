import ExerciseLibrary from './ExerciseLibrary.jsx';
import ExercisePage from './ExercisePage.jsx';

// The Exercises tab. Addresses (after #/exercises):
//   (nothing)        every exercise, searchable, filter by muscle
//   <id>             one exercise: how to do it and your notes
//   <id>/progress    your progress on it (…/how goes back the other way)
//   …/edit           change its name, type, weight jump, muscles
export default function ExercisesScreen({ path }) {
  if (path[0]) return <ExercisePage key={path[0]} prefix={['exercises']} path={path} start="how" backLabel="Exercises" />;
  return <ExerciseLibrary />;
}
