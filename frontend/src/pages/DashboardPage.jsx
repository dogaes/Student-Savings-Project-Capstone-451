import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDashboardData } from '../data/useDashboardData.js'
import { date, money, monthLabel } from '../utils/format.js'
import SpendingDonut from '../components/SpendingDonut.jsx'
import IncomeSpendingChart from '../components/IncomeSpendingChart.jsx'
import AiSummaryCard from '../components/AiSummaryCard.jsx'

// Dashboard / spending summary (UC-SPEND-01). Uses fabricated sample data for now.
export default function DashboardPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState('2026-10')
  const d = useDashboardData(month)

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Welcome back, {user.firstName}</h1>
          <p className="text-muted mb-0">Here's your money at a glance.</p>
        </div>
        <div>
          <label htmlFor="month" className="form-label small text-muted mb-1">Month</label>
          <select id="month" className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {d.months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      {d.empty ? <EmptyState /> : (
        <>
          <SummaryCards d={d} />

          <AiSummaryCard month={month} d={d} />

          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <ChartCard title="Spending by category"><SpendingDonut categories={d.categories} /></ChartCard>
            </div>
            <div className="col-lg-7">
              <ChartCard title="Income vs. spending (last 6 months)"><IncomeSpendingChart history={d.history} /></ChartCard>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-8"><BudgetCard categories={d.categories} /></div>
            <div className="col-lg-4"><AccountsCard accounts={d.accounts} /></div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6"><LoansCard loans={d.loans} /></div>
            <div className="col-md-6"><GoalsCard goals={d.goals} /></div>
          </div>

          <TransactionsCard transactions={d.transactions} />
        </>
      )}
    </>
  )
}

function SummaryCards({ d }) {
  const usedPct = Math.round((d.spent / d.budget) * 100)
  const cards = [
    { label: 'Income', value: money(d.income) },
    { label: 'Spending', value: money(d.spent), note: `${usedPct}% of your ${money(d.budget)} budget` },
    {
      label: 'Budget remaining',
      value: money(d.remaining),
      note: d.remaining < 0 ? 'Over budget this month' : 'Left to spend this month',
      danger: d.remaining < 0,
    },
  ]
  return (
    <div className="row g-4 mb-4">
      {cards.map((c) => (
        <div className="col-md-4" key={c.label}>
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="stat-label">{c.label}</div>
              <div className={`stat-value ${c.danger ? 'text-danger' : ''}`}>{c.value}</div>
              {c.note && <div className={`small ${c.danger ? 'text-danger' : 'text-muted'}`}>{c.note}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Budget vs. spending per category, with over-budget highlighted (FR-SPEND-002)
// and change from last month (FR-SPEND-003). Bars include the numbers as text,
// so screen readers get the same information (NFR-ACC-002).
function BudgetCard({ categories }) {
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="card-title-sm">Budget vs. spending</h2>
          <Link to="/budget" className="small">Edit budget</Link>
        </div>
        {categories.map((c) => {
          const pct = Math.min(100, Math.round((c.spent / c.budget) * 100))
          const over = c.spent > c.budget
          const change = c.spent - c.lastMonth
          return (
            <div className="mb-3" key={c.name}>
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-medium">{c.name}</span>
                <span className={over ? 'text-danger fw-semibold' : 'text-muted'}>
                  {money(c.spent)} of {money(c.budget)}
                  {over && ` · ${money(c.spent - c.budget)} over`}
                </span>
              </div>
              <div className="progress" role="progressbar" aria-label={`${c.name} spending`}
                aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                <div className={`progress-bar ${over ? 'bg-danger' : pct >= 80 ? 'bg-warning' : ''}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="small text-muted mt-1">
                {change === 0 ? 'Same as last month' : (
                  // Red ▲ = spent more than last month, green ▼ = spent less
                  <>
                    <span className={`fw-semibold ${change > 0 ? 'trend-up' : 'trend-down'}`}>
                      {change > 0 ? '▲' : '▼'} {money(Math.abs(change))}
                    </span>
                    {change > 0 ? ' more than last month' : ' less than last month'}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AccountsCard({ accounts }) {
  const total = accounts.reduce((s, a) => s + a.balance, 0)
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="card-title-sm">Accounts</h2>
          <Link to="/accounts" className="small">View all</Link>
        </div>
        <ul className="list-unstyled mb-0">
          {accounts.map((a) => (
            <li key={a.name} className="d-flex justify-content-between py-2 border-bottom">
              <div>
                <div className="fw-medium">{a.name}</div>
                <div className="small text-muted">{a.type}</div>
              </div>
              <div className={`text-end ${a.balance < 0 ? 'text-danger' : ''}`}>
                {a.balance < 0 ? `${money(-a.balance)} owed` : money(a.balance)}
              </div>
            </li>
          ))}
          <li className="d-flex justify-content-between pt-2 fw-semibold">
            <span>Net total</span><span>{money(total)}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function LoansCard({ loans }) {
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="card-title-sm">Loans</h2>
          <Link to="/loans" className="small">View loans</Link>
        </div>
        <div className="stat-label">Total balance</div>
        <div className="stat-value mb-3">{money(loans.totalBalance)}</div>
        <div className="alert alert-light border mb-0 small">
          Next payment: <strong>{money(loans.next.amount)}</strong> to {loans.next.name},
          due <strong>{date(loans.next.dueDate)}</strong>
        </div>
      </div>
    </div>
  )
}

function GoalsCard({ goals }) {
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="card-title-sm">Savings goals</h2>
          <Link to="/goals" className="small">View goals</Link>
        </div>
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100)
          return (
            <div className="mb-3" key={g.name}>
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-medium">{g.name}</span>
                <span className="text-muted">{pct}% · {money(g.saved)} of {money(g.target)}</span>
              </div>
              <div className="progress" role="progressbar" aria-label={`${g.name} progress`}
                aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar bg-success" style={{ width: `${pct}%` }} />
              </div>
              <div className="small text-muted mt-1">Target date {date(g.targetDate)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <h2 className="card-title-sm mb-3">{title}</h2>
        {children}
      </div>
    </div>
  )
}

function TransactionsCard({ transactions }) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="card-title-sm">Recent transactions</h2>
          <Link to="/accounts" className="small">See all</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th className="text-end">Amount</th></tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i}>
                  <td>{date(t.date)}</td>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td>{t.account}</td>
                  <td className={`text-end ${t.amount > 0 ? 'text-success' : ''}`}>
                    {t.amount > 0 ? '+' : '−'}{money(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card shadow-sm border-0 text-center py-5">
      <div className="card-body">
        <h2 className="h5">No data for this month yet</h2>
        <p className="text-muted">Add an account, create a budget, and record a few transactions to see your summary.</p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/accounts" className="btn btn-primary">Add account</Link>
          <Link to="/budget" className="btn btn-outline-primary">Create budget</Link>
        </div>
      </div>
    </div>
  )
}