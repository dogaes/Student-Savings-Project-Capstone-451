// Shared formatting so every page shows money as $1,234.56 and dates as MM/DD/YYYY (NFR-UI-004).
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const money = (n) => usd.format(Number(n) || 0)

export const date = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

export const monthLabel = (yyyyMm) => {
  const [y, m] = yyyyMm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

const pad = (n) => String(n).padStart(2, '0')

/** This month as "2026-10" */
export const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** Today as "2026-10-23" (local time, not UTC) */
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The month before "2026-10" -> "2026-09" */
export const previousMonth = (yyyyMm) => {
  const [y, m] = yyyyMm.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// Default categories (SRS BR-007). Users can still type their own.
export const CATEGORIES = [
  'Housing', 'Groceries', 'Dining Out', 'Transportation',
  'Tuition and Books', 'Loan Payments', 'Entertainment', 'Other',
]
