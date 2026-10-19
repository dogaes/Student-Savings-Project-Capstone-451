import { SAMPLE_ACCOUNTS, SAMPLE_GOALS, SAMPLE_HISTORY, SAMPLE_LOANS, SAMPLE_MONTHS } from './sampleDashboard.js'

// One place to swap sample data for the real API later, e.g.
//   const data = await api(`/dashboard?month=${month}`)
export function useDashboardData(month) {
  const m = SAMPLE_MONTHS[month]
  if (!m) return { months: Object.keys(SAMPLE_MONTHS), empty: true }

  const budget = m.categories.reduce((s, c) => s + c.budget, 0)
  const spent = m.categories.reduce((s, c) => s + c.spent, 0)
  return {
    months: Object.keys(SAMPLE_MONTHS),
    empty: false,
    income: m.income,
    budget,
    spent,
    remaining: budget - spent,
    categories: m.categories,
    transactions: m.transactions,
    accounts: SAMPLE_ACCOUNTS,
    loans: SAMPLE_LOANS,
    goals: SAMPLE_GOALS,
    history: SAMPLE_HISTORY.filter((h) => h.month <= month).slice(-6),
  }
}
