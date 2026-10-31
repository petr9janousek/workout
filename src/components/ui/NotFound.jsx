import BackButton from './BackButton.jsx';

// A page whose plan, day, exercise or workout was deleted (or an old link).
// what: 'plan', 'exercise'… The rest goes to BackButton.
export default function NotFound({ what, ...back }) {
  return (
    <div>
      <BackButton {...back} />
      <p className="empty">This {what} doesn't exist any more.</p>
    </div>
  );
}
