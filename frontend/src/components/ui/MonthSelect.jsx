import { monthLabel } from '../../utils/format.js'

const pad = (n) => String(n).padStart(2, '0')

/** The last 12 months up to this month (newest first), plus the selected one if it's older. */
export function recentMonths(selected) {
  const now = new Date()
  const list = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
  }
  if (selected && !list.includes(selected)) list.push(selected)
  return list
}

export default function MonthSelect({ value, onChange, months, id = 'month' }) {
  return (
    <div>
      <label htmlFor={id} className="form-label small text-muted mb-1">Month</label>
      <select id={id} className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {(months ?? recentMonths(value)).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
      </select>
    </div>
  )
}
