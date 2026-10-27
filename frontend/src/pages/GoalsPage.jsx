import { useState } from 'react'
import { api } from '../auth/api.js'
import FormField from '../components/ui/FormField.jsx'
import DeleteButton from '../components/ui/DeleteButton.jsx'
import Icon from '../components/ui/Icon.jsx'
import ProgressRing from '../components/ui/ProgressRing.jsx'
import PageHeader, { HeroStat } from '../components/ui/PageHeader.jsx'
import { useApiData } from '../utils/useApiData.js'
import { date, money, today } from '../utils/format.js'

const QUICK_ADD = [10, 25, 50]

// Savings goals (UC-GOAL-01) with a simple savings plan (UC-GOAL-02).
export default function GoalsPage() {
  const goals = useApiData('/goals')
  const [editing, setEditing] = useState(null)
  const list = goals.data ?? []
  const saved = list.reduce((s, g) => s + Number(g.saved), 0)
  const target = list.reduce((s, g) => s + Number(g.target), 0)
  const achieved = list.filter((g) => Number(g.saved) >= Number(g.target)).length

  const save = (g, changes) => api(`/goals/${g.id}`, {
    method: 'PUT',
    body: { name: g.name, saved: Number(g.saved), target: Number(g.target), targetDate: g.targetDate, ...changes },
  })

  return (
    <div className="tone-goals">
      <PageHeader tone="goals" icon="target" title="Savings goals"
        subtitle={list.length ? `You've saved ${money(saved)} so far. Keep it going!` : 'Pick something to save for and watch it grow.'}
        actions={!editing && (
          <button className="btn btn-tone d-inline-flex align-items-center gap-1" onClick={() => setEditing({})}>
            <Icon name="plus" size={18} />New goal
          </button>
        )}>
        <HeroStat label="Saved" value={money(saved)} note={target ? `${Math.round((saved / target) * 100)}% of all targets` : 'No goals yet'} />
        <HeroStat label="Still to save" value={money(Math.max(0, target - saved))} note={`${list.length} goal${list.length === 1 ? '' : 's'}`} />
        <HeroStat label="Goals reached" value={`${achieved} of ${list.length}`} note={achieved ? 'Nice work!' : 'Your first one is coming'} />
      </PageHeader>

      {editing && (
        <div className="form-panel mb-4">
          <h3 className="h6 fw-bold mb-3">{editing.id ? `Edit ${editing.name}` : 'New goal'}</h3>
          <GoalForm goal={editing} onCancel={() => setEditing(null)}
            onSaved={async () => { setEditing(null); await goals.reload() }} />
        </div>
      )}

      {goals.error && <div className="alert alert-danger py-2 small">Couldn't load goals.</div>}

      <div className="row g-3">
        {list.map((g) => (
          <div className="col-md-6 col-xl-4" key={g.id}>
            <GoalCard goal={g} onEdit={() => setEditing(g)}
              onAdd={async (amount) => { await save(g, { saved: Number(g.saved) + amount }); await goals.reload() }}
              onDelete={async () => { await api(`/goals/${g.id}`, { method: 'DELETE' }); await goals.reload() }} />
          </div>
        ))}
        {!editing && (
          <div className="col-md-6 col-xl-4">
            <button className="add-tile h-100" style={{ minHeight: 260 }} onClick={() => setEditing({})}>
              <Icon name="plus" size={26} />Start a new goal
              <span className="small fw-normal text-muted">Emergency fund, spring break, a new laptop…</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function GoalCard({ goal, onEdit, onAdd, onDelete }) {
  const saved = Number(goal.saved)
  const target = Number(goal.target)
  const pct = Math.min(100, Math.round((saved / target) * 100))
  const remaining = Math.max(0, target - saved)
  const achieved = saved >= target
  const plan = savingsPlan(remaining, goal.targetDate)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (value) => {
    if (!value || Number(value) <= 0) { setError('Enter an amount greater than $0'); return }
    setError('')
    setBusy(true)
    try {
      await onAdd(Number(value))
      setAmount('')
    } catch {
      setError("Couldn't add that. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`fun-card h-100 ${achieved ? 'goal-done' : ''}`}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-start gap-2">
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="fw-bold fs-6 text-truncate">{goal.name}</div>
            <div className="small text-muted"><Icon name="flag" size={13} className="me-1" />by {date(goal.targetDate)}</div>
          </div>
          {achieved && <span className="pill pill-good"><Icon name="trophy" size={13} />Reached!</span>}
        </div>

        <div className="d-flex justify-content-center my-3">
          <ProgressRing value={pct} size={132} stroke={12} color="var(--tone)" label={`${goal.name}: ${pct}% saved`}>
            {achieved ? <Icon name="trophy" size={34} style={{ color: 'var(--tone)' }} /> : <span className="ring-pct fs-3">{pct}%</span>}
            <span className="small text-muted">{money(saved)}</span>
          </ProgressRing>
        </div>

        <div className="milestones" aria-hidden="true">
          {[25, 50, 75, 100].map((m) => (
            <span key={m} className={`milestone ${pct >= m ? 'hit' : ''}`}>{pct >= m && <Icon name="check" size={11} strokeWidth={3.5} />}</span>
          ))}
        </div>
        <div className="milestone-labels mb-3"><span>25%</span><span>50%</span><span>75%</span><span>{money(target)}</span></div>

        {achieved ? (
          <p className="small text-center mb-3">You hit your target. Time to celebrate (on budget)!</p>
        ) : (
          <>
            <p className="small text-center text-muted mb-2">{money(remaining)} to go · {plan}</p>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-2">
              {QUICK_ADD.map((v) => (
                <button key={v} type="button" className="chip-btn" disabled={busy} onClick={() => add(v)}>+{money(v).replace('.00', '')}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); add(amount) }} noValidate className="d-flex gap-2 align-items-start mb-2">
              <div className="flex-grow-1">
                <label htmlFor={`add-${goal.id}`} className="visually-hidden">Amount to add to {goal.name}</label>
                <input id={`add-${goal.id}`} type="number" step="0.01" min="0.01" placeholder="Other amount ($)"
                  className={`form-control form-control-sm ${error ? 'is-invalid' : ''}`}
                  value={amount} onChange={(e) => setAmount(e.target.value)} />
                <div className="invalid-feedback">{error}</div>
              </div>
              <button className="btn btn-tone btn-sm text-nowrap" disabled={busy}>{busy ? 'Adding…' : 'Add money'}</button>
            </form>
          </>
        )}
        <div className="d-flex justify-content-end align-items-center gap-1 pt-2 border-top mt-auto">
          <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${goal.name}`} title="Edit"><Icon name="pencil" size={17} /></button>
          <DeleteButton compact what={goal.name} onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}

/** How much to save per month to hit the target date (FR-GOAL-004). */
function savingsPlan(remaining, targetDate) {
  const [y, m] = targetDate.split('-').map(Number)
  const now = new Date()
  const months = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth())
  if (months <= 0) return 'target date has passed'
  return `save ${money(remaining / months)}/month for ${months} month${months === 1 ? '' : 's'}`
}

function GoalForm({ goal, onCancel, onSaved }) {
  const isNew = !goal.id
  const str = (v) => (v === undefined || v === null ? '' : String(v))
  const [form, setForm] = useState({
    name: str(goal.name), target: str(goal.target), saved: isNew ? '0' : str(goal.saved), targetDate: str(goal.targetDate),
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.target || Number(form.target) <= 0) errs.target = 'Target must be greater than $0'
    if (Number(form.saved) > Number(form.target)) errs.saved = "Saved amount can't be more than the target"
    if (isNew && form.targetDate && form.targetDate <= today()) errs.targetDate = 'Pick a date in the future'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      await api(isNew ? '/goals' : `/goals/${goal.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: { name: form.name, saved: Number(form.saved || 0), target: Number(form.target), targetDate: form.targetDate || null },
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
      <FormField id="name" label="Goal name" className="col-sm-6" maxLength={100} placeholder="Spring break trip"
        value={form.name} onChange={set} error={errors.name} />
      <FormField id="targetDate" label="Target date" type="date" className="col-sm-6"
        value={form.targetDate} onChange={set} error={errors.targetDate} />
      <FormField id="target" label="Target amount ($)" type="number" step="0.01" min="0.01" className="col-sm-6"
        value={form.target} onChange={set} error={errors.target} />
      <FormField id="saved" label="Already saved ($)" type="number" step="0.01" min="0" className="col-sm-6"
        value={form.saved} onChange={set} error={errors.saved} />
      <div className="col-12 d-flex gap-2 mt-2">
        <button className="btn btn-tone btn-sm" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create goal' : 'Save'}</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
