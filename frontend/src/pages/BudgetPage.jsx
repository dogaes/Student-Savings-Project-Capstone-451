import { useState } from 'react'
import { api } from '../auth/api.js'
import FormField from '../components/ui/FormField.jsx'
import DeleteButton from '../components/ui/DeleteButton.jsx'
import MonthSelect from '../components/ui/MonthSelect.jsx'
import Icon from '../components/ui/Icon.jsx'
import ProgressRing from '../components/ui/ProgressRing.jsx'
import PageHeader, { HeroStat } from '../components/ui/PageHeader.jsx'
import { useApiData } from '../utils/useApiData.js'
import { useTheme } from '../theme/ThemeContext.jsx'
import { categoryColor, categoryIcon } from '../utils/categoryStyle.js'
import { CATEGORIES, currentMonth, money, monthLabel, previousMonth } from '../utils/format.js'

// Monthly budget (UC-BUD-01): a spending limit per category. Spending comes from transactions
// whose category name matches the budget category.
export default function BudgetPage() {
  const { theme } = useTheme()
  const [month, setMonth] = useState(currentMonth())
  const budgets = useApiData(`/budgets?month=${month}`)
  const [editing, setEditing] = useState(null)
  const [copyMsg, setCopyMsg] = useState('')
  const [copying, setCopying] = useState(false)

  const list = (budgets.data ?? []).map((b) => ({ ...b, budget: Number(b.budget), spent: Number(b.spent), lastMonth: Number(b.lastMonth ?? 0) }))
  const totalBudget = list.reduce((s, b) => s + b.budget, 0)
  const totalSpent = list.reduce((s, b) => s + b.spent, 0)
  const left = totalBudget - totalSpent
  const usedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const overCount = list.filter((b) => b.spent > b.budget).length

  // Days left only make sense for the current month
  const now = new Date()
  const isCurrent = month === currentMonth()
  const daysLeft = isCurrent ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1 : null

  const changeMonth = (m) => { setMonth(m); setEditing(null); setCopyMsg('') }

  // Copy last month's limits into this month (FR-BUD-006)
  const copyLastMonth = async () => {
    setCopying(true)
    setCopyMsg('')
    try {
      const last = await api(`/budgets?month=${previousMonth(month)}`)
      const existing = new Set(list.map((b) => b.name.toLowerCase()))
      const toCopy = last.filter((b) => !existing.has(b.name.toLowerCase()))
      for (const b of toCopy) {
        await api('/budgets', { method: 'POST', body: { month, name: b.name, budget: Number(b.budget) } })
      }
      setCopyMsg(toCopy.length ? `Copied ${toCopy.length} categories from ${monthLabel(previousMonth(month))}.`
        : `Nothing new to copy from ${monthLabel(previousMonth(month))}.`)
      await budgets.reload()
    } catch {
      setCopyMsg("Couldn't copy last month's budget. Please try again.")
    } finally {
      setCopying(false)
    }
  }

  const mood = totalBudget === 0 ? 'Set a few limits to start tracking this month.'
    : left < 0 ? `You're ${money(-left)} over budget. Time to slow down a little.`
      : usedPct >= 80 ? `Careful: only ${money(left)} left${daysLeft ? ` for ${daysLeft} more days` : ''}.`
        : `Nice! ${money(left)} left to spend${daysLeft ? ` with ${daysLeft} days to go` : ''}.`

  return (
    <div className="tone-budget">
      <PageHeader tone="budget" icon="pie" title="Budget" subtitle={mood}
        actions={<MonthSelect value={month} onChange={changeMonth} />}>
        <div className="hero-stat d-flex align-items-center gap-3">
          <ProgressRing value={usedPct} size={64} stroke={7} color={left < 0 ? 'var(--bad)' : 'var(--tone)'} label={`${usedPct}% of budget used`}>
            <span className="ring-pct small">{usedPct}%</span>
          </ProgressRing>
          <div>
            <div className="hero-stat-label">Used</div>
            <div className="hero-stat-note">{money(totalSpent)} of {money(totalBudget)}</div>
          </div>
        </div>
        <HeroStat label="Budget" value={money(totalBudget)} note={`${list.length} categories`} />
        <HeroStat label="Spent" value={money(totalSpent)} note={overCount ? `${overCount} over the limit` : 'All within limits'} />
        <HeroStat label={left < 0 ? 'Over by' : 'Left'} value={money(Math.abs(left))} tone={left < 0 ? 'danger' : undefined}
          note={daysLeft ? `${daysLeft} days left in ${monthLabel(month).split(' ')[0]}` : monthLabel(month)} />
      </PageHeader>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h5 fw-bold mb-0">Categories</h2>
        <button className="btn btn-tone-soft btn-sm d-inline-flex align-items-center gap-1" onClick={copyLastMonth} disabled={copying}>
          <Icon name="copy" size={16} />{copying ? 'Copying…' : `Copy ${monthLabel(previousMonth(month)).split(' ')[0]}'s budget`}
        </button>
      </div>

      {copyMsg && <div className="alert alert-light border py-2 small">{copyMsg}</div>}
      {budgets.error && <div className="alert alert-danger py-2 small">Couldn't load the budget.</div>}

      {editing && (
        <div className="form-panel mb-4">
          <h3 className="h6 fw-bold mb-3">{editing.id ? `Edit ${editing.name}` : 'New category'}</h3>
          <BudgetForm month={month} item={editing} onCancel={() => setEditing(null)}
            onSaved={async () => { setEditing(null); await budgets.reload() }} />
        </div>
      )}

      <div className="row g-3">
        {list.map((b) => (
          <div className="col-md-6 col-xl-4" key={b.id}>
            <CategoryCard b={b} color={categoryColor(b.name, theme)} onEdit={() => setEditing(b)}
              onDelete={async () => { await api(`/budgets/${b.id}`, { method: 'DELETE' }); await budgets.reload() }} />
          </div>
        ))}
        {!editing && (
          <div className="col-md-6 col-xl-4">
            <button className="add-tile h-100" onClick={() => setEditing({})}>
              <Icon name="plus" size={26} />
              Add a category
              {budgets.data && list.length === 0 && <span className="small fw-normal text-muted">or copy last month's budget above</span>}
            </button>
          </div>
        )}
      </div>

      <p className="small text-muted mt-4 mb-0">
        Spending is counted from transactions whose category matches the name here (for example "Groceries").
      </p>
    </div>
  )
}

function CategoryCard({ b, color, onEdit, onDelete }) {
  const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : (b.spent > 0 ? 100 : 0)
  const over = b.spent > b.budget
  const change = b.spent - b.lastMonth
  const status = over ? { cls: 'pill-bad', text: `Over by ${money(b.spent - b.budget)}`, icon: 'alert' }
    : pct >= 100 ? { cls: 'pill-warn', text: 'At the limit', icon: 'flag' }
      : pct >= 80 ? { cls: 'pill-warn', text: 'Almost there', icon: 'clock' }
        : { cls: 'pill-good', text: 'On track', icon: 'check' }

  return (
    <div className="fun-card h-100" style={{ '--cat': color }}>
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="cat-icon"><Icon name={categoryIcon(b.name)} /></div>
          <div className="flex-grow-1 fw-semibold text-truncate">{b.name}</div>
          <span className={`pill ${status.cls}`}><Icon name={status.icon} size={13} strokeWidth={2.5} />{status.text}</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <ProgressRing value={pct} size={76} stroke={8} color={over ? 'var(--bad)' : color} label={`${b.name}: ${pct}% used`}>
            <span className="ring-pct">{pct}%</span>
          </ProgressRing>
          <div style={{ minWidth: 0 }}>
            <div className="fs-5 fw-bold tabular">{money(b.spent)}</div>
            <div className="small text-muted">of {money(b.budget)} limit</div>
            <div className="small mt-1">
              {over ? <span className="fw-semibold" style={{ color: 'var(--bad)' }}>{money(b.spent - b.budget)} over</span>
                : <span className="fw-semibold" style={{ color: 'var(--good)' }}>{money(b.budget - b.spent)} left</span>}
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <span className="small text-muted">
            {change === 0 ? 'Same as last month' : (
              <><span className={`fw-semibold ${change > 0 ? 'trend-up' : 'trend-down'}`}>{change > 0 ? '▲' : '▼'} {money(Math.abs(change))}</span>
                {change > 0 ? ' vs last month' : ' less than last month'}</>
            )}
          </span>
          <span className="d-flex align-items-center gap-1">
            <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${b.name}`} title="Edit"><Icon name="pencil" size={17} /></button>
            <DeleteButton compact what={b.name} onDelete={onDelete} />
          </span>
        </div>
      </div>
    </div>
  )
}

function BudgetForm({ month, item, onCancel, onSaved }) {
  const isNew = !item.id
  const [form, setForm] = useState({ name: item.name ?? '', budget: item.budget !== undefined ? String(item.budget) : '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.budget === '' || Number(form.budget) <= 0) {
      setErrors({ budget: 'Enter a limit greater than $0' }) // FR-BUD-003
      return
    }
    setErrors({})
    setSaving(true)
    try {
      await api(isNew ? '/budgets' : `/budgets/${item.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: { month, name: form.name, budget: Number(form.budget) },
      })
      await onSaved()
    } catch (err) {
      setErrors(err.errors)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="row g-2">
      {errors.form && <div className="alert alert-danger py-2 small mb-1">{errors.form}</div>}
      <FormField id="name" label="Category" className="col-sm-7" list="budget-category-options" maxLength={100}
        placeholder="Groceries" value={form.name} onChange={set} error={errors.name} />
      <datalist id="budget-category-options">
        {CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
      <FormField id="budget" label="Monthly limit ($)" type="number" step="0.01" min="0.01" className="col-sm-5"
        value={form.budget} onChange={set} error={errors.budget || errors.month} />
      <div className="col-12 d-flex gap-2 mt-2">
        <button className="btn btn-tone btn-sm" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add category' : 'Save'}</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
