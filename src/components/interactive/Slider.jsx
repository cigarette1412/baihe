export default function Slider({ label, value, min, max, step, onChange, hint, labelWidth }) {
  return (
    <div className="row" style={{ marginBottom: '.45rem' }}>
      <span className="stat" style={{ width: labelWidth || '5.2rem', flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: '1 1 8rem', accentColor: '#2b5c4e' }}
      />
      <span
        className="stat"
        style={{ width: '4.8rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
      >
        {hint}
      </span>
    </div>
  );
}
