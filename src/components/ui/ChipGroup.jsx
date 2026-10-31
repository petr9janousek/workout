// A row of pill buttons where one is selected (like radio buttons).
//   <ChipGroup options={[{ value: 'female', label: 'Woman' }, …]} value={body} onChange={setBody} />
// options may also be plain values: [2, 3, 4]
export default function ChipGroup({ options, value, onChange, label }) {
  const items = options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }));
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {items.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'chip active' : 'chip'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
