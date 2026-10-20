import { fallbackAnswer } from './fallbackAnswers.js'
import { money, monthLabel } from '../utils/format.js'

// Talks to the AI back end. If the AI service isn't available (not built yet, down,
// or slower than 15 seconds), it falls back to built-in answers so the page still works.
//
// Back-end contract (for the AI back end, UC-AI-01 / UC-AI-02):
//   POST /api/ai/chat     { question, history: [{ role: 'user'|'assistant', content }] }
//                          -> { answer }
//   POST /api/ai/summary  { month, totals }   (anonymized numbers only, no name or email)
//                          -> { summary }
//   Daily limit reached    -> 429 { errors: { form: "..." } }

const TIMEOUT_MS = 15000

async function post(path, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => null)
    if (res.status === 429) {
      const err = new Error('limit')
      err.limit = data?.errors?.form ?? "You've reached today's limit for AI questions. Try again tomorrow."
      throw err
    }
    if (!res.ok || !data) return null // AI service not available -> use fallback
    return data
  } catch (err) {
    if (err.limit) throw err
    return null // network error or timeout -> use fallback
  } finally {
    clearTimeout(timer)
  }
}

/** Returns { text, source: 'ai' | 'fallback' }. */
export async function askAssistant(question, history) {
  const data = await post('/ai/chat', { question, history })
  if (data?.answer) return { text: data.answer, source: 'ai' }
  return { text: fallbackAnswer(question), source: 'fallback' }
}

/** Returns { text, source: 'ai' | 'fallback' } for the dashboard's selected month. */
export async function summarizeMonth(month, d) {
  // Only anonymized numbers are sent: no name, email, or account names (FR-AI-004).
  const totals = {
    income: d.income,
    budget: d.budget,
    spent: d.spent,
    categories: d.categories.map((c) => ({ name: c.name, budget: c.budget, spent: c.spent, lastMonth: c.lastMonth })),
    loanBalance: d.loans.totalBalance,
    goals: d.goals.map((g) => ({ saved: g.saved, target: g.target })),
  }
  const data = await post('/ai/summary', { month, totals })
  if (data?.summary) return { text: data.summary, source: 'ai' }
  return { text: ruleBasedSummary(month, d), source: 'fallback' }
}

// Automatic summary built from the same numbers the dashboard shows.
export function ruleBasedSummary(month, d) {
  const pct = Math.round((d.spent / d.budget) * 100)
  const parts = [`In ${monthLabel(month)} you spent ${money(d.spent)} of your ${money(d.budget)} budget (${pct}%).`]

  const over = d.categories.filter((c) => c.spent > c.budget)
  if (over.length) {
    const list = over.map((c) => `${c.name} (${money(c.spent - c.budget)} over)`).join(' and ')
    parts.push(`You went over budget in ${list}.`)
  } else {
    parts.push('You stayed within budget in every category. Nice work!')
  }

  const lastMonthTotal = d.categories.reduce((s, c) => s + c.lastMonth, 0)
  const change = d.spent - lastMonthTotal
  if (Math.abs(change) >= 1) {
    parts.push(`That's ${money(Math.abs(change))} ${change > 0 ? 'more' : 'less'} than last month.`)
  }

  const biggest = [...d.categories].sort((a, b) => b.spent - a.spent)[0]
  if (biggest) {
    parts.push(`Your biggest expense was ${biggest.name} at ${Math.round((biggest.spent / d.spent) * 100)}% of spending.`)
  }

  const saved = d.income - d.spent
  parts.push(saved >= 0
    ? `You have ${money(saved)} left from your income this month.`
    : `You spent ${money(-saved)} more than you earned this month.`)

  return parts.join(' ')
}
