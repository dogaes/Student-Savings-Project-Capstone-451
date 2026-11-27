import { useEffect, useState } from 'react'
import { api } from '../../auth/api.js'
import { currentMonth, monthLabel } from '../../utils/format.js'

const DATA_CHANGED = 'months-data-changed'

/** Call after adding/removing a transaction or budget, so month dropdowns refresh. */
export function notifyDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED))
}

/** Months that have data (from GET /api/months), newest first. Empty array until loaded. */
export function useDataMonths() {
  const [months, setMonths] = useState([])
  useEffect(() => {
    let alive = true
    const load = () => api('/months').then((m) => { if (alive) setMonths(m ?? []) }).catch(() => {})
    load()
    window.addEventListener(DATA_CHANGED, load)
    return () => { alive = false; window.removeEventListener(DATA_CHANGED, load) }
  }, [])
  return months
}

/**
 * Month dropdown that only offers months with data, plus this month (so you can start
 * adding things) and whichever month is selected. Newest first.
 */
export default function MonthSelect({ value, onChange, id = 'month' }) {
  const dataMonths = useDataMonths()
  const options = [...new Set([...dataMonths, currentMonth(), value])].sort().reverse()
  return (
    <div>
      <label htmlFor={id} className="form-label small text-muted mb-1">Month</label>
      <select id={id} className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
      </select>
    </div>
  )
}
