// Circular progress meter. `value` is 0–100 (anything above 100 shows a full ring).
// Put a label in the middle with children.
export default function ProgressRing({ value, size = 72, stroke = 8, color = 'var(--bs-primary)', label, children }) {
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const pct = Math.max(0, Math.min(100, value || 0))
    return (
      <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(value || 0)}%`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} className="ring-bar" />
        </svg>
        <div className="ring-center">{children}</div>
      </div>
    )
  }
  