// A row of "2 days", "3 days"… buttons. value null = "Any" (when `any`).
//   <DaysPicker from={2} to={6} value={days} onChange={setDays} any />
export default function DaysPicker({ from = 1, to = 6, value, onChange, any = false, label = 'Days a week' }) {
  const options = [...(any ? [null] : []), ...Array.from({ length: to - from + 1 }, (_, i) => from + i)];
  return (
    <div className="days-picker" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((n) => (
        <button key={String(n)} role="radio" aria-checked={value === n} className={value === n ? 'days-option active' : 'days-option'} onClick={() => onChange(n)}>
          <span className="days-num">{n ?? 'Any'}</span>
          {n != null && <span className="days-label">{n === 1 ? 'day' : 'days'}</span>}
        </button>
      ))}
    </div>
  );
}
