import { useCallback, useEffect, useState } from 'react'
import { api } from '../auth/api.js'

// Loads everything the dashboard shows from GET /api/dashboard?month=YYYY-MM (Joey's endpoint)
// and adds the totals the cards need.
export function useDashboardData(month) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    api(`/dashboard?month=${month}`)
      .then((d) => setData(withTotals(d, month)))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [month])

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load }
}

const num = (n) => Number(n) || 0

function withTotals(d, month) {
  const categories = d.categories.map((c) => ({
    ...c, budget: num(c.budget), spent: num(c.spent), lastMonth: num(c.lastMonth),
  }))
  const history = d.history.map((h) => ({ ...h, income: num(h.income), spending: num(h.spending) }))
  const thisMonth = history.find((h) => h.month === month)

  const budget = categories.reduce((s, c) => s + c.budget, 0)
  // Total spending includes categories without a budget, so take it from the monthly history.
  const spent = thisMonth ? thisMonth.spending : categories.reduce((s, c) => s + c.spent, 0)

  return {
    ...d,
    // Newest first for the dropdown; always include the selected month
    months: [...new Set([...d.months, month])].sort().reverse(),
    income: num(d.income),
    categories,
    history,
    transactions: d.transactions.map((t) => ({ ...t, amount: num(t.amount) })),
    accounts: d.accounts.map((a) => ({ ...a, balance: num(a.balance) })),
    loans: { totalBalance: num(d.loans?.totalBalance), next: d.loans?.next ?? null },
    goals: d.goals.map((g) => ({ ...g, saved: num(g.saved), target: num(g.target) })),
    budget,
    spent,
    remaining: budget - spent,
  }
}
