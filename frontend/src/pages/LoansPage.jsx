import { useState } from 'react'
import { api } from '../auth/api.js'
import FormField from '../components/ui/FormField.jsx'
import DeleteButton from '../components/ui/DeleteButton.jsx'
import Icon from '../components/ui/Icon.jsx'
import ProgressRing from '../components/ui/ProgressRing.jsx'
import PageHeader, { HeroStat } from '../components/ui/PageHeader.jsx'
import { useApiData } from '../utils/useApiData.js'
import { date, money } from '../utils/format.js'

/** Whole days from today until an ISO date (negative if it's in the past). */
function daysUntil(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(y, m - 1, d) - start) / 86400000)
}
const dueText = (n) => (n < 0 ? `${-n} day${n === -1 ? '' : 's'} late` : n === 0 ? 'Due today' : `Due in ${n} day${n === 1 ? '' : 's'}`)

// Loans (UC-LOAN-01). Payoff estimates use monthly interest = balance × APR ÷ 12.
export default function LoansPage() {
  const loans = useApiData('/loans')
  const [editing, setEditing] = useState(null)
  const list = loans.data?.loans ?? []
  const next = loans.data?.next
  const monthlyTotal = list.reduce((s, l) => s + Number(l.monthlyPayment), 0)
  const principalTotal = list.reduce((s, l) => s + Number(l.principal), 0)
  const balanceTotal = Number(loans.data?.totalBalance ?? 0)
  const paidPct = principalTotal > 0 ? Math.round(((principalTotal - balanceTotal) / principalTotal) * 100) : 0

  return (
    <div className="tone-loans">
      <PageHeader tone="loans" icon="grad" title="Loans" subtitle="Track your student and personal loans, and see when they'll be paid off."
        actions={!editing && (
          <button className="btn btn-tone d-inline-flex align-items-center gap-1" onClick={() => setEditing({})}>
            <Icon name="plus" size={18} />Add loan
          </button>
        )}>
        <div className="hero-stat d-flex align-items-center gap-3">
          <ProgressRing value={paidPct} size={64} stroke={7} color="var(--tone)" label={`${paidPct}% of all loans paid off`}>
            <span className="ring-pct small">{paidPct}%</span>
          </ProgressRing>
          <div>
            <div className="hero-stat-label">Paid off</div>
            <div className="hero-stat-note">{money(principalTotal - balanceTotal)} of {money(principalTotal)}</div>
          </div>
        </div>
        <HeroStat label="Still owed" value={money(balanceTotal)} note={`${list.length} loan${list.length === 1 ? '' : 's'}`} />
        <HeroStat label="Monthly payments" value={money(monthlyTotal)} note="All loans together" />
        <HeroStat label="Next payment" value={next ? money(next.amount) : '—'}
          note={next ? `${next.name} · ${dueText(daysUntil(next.dueDate))}` : 'Nothing due'} />
      </PageHeader>

      {editing && (
        <div className="form-panel mb-4">
          <h3 className="h6 fw-bold mb-3">{editing.id ? `Edit ${editing.name}` : 'Add a loan'}</h3>
          <LoanForm loan={editing} onCancel={() => setEditing(null)}
            onSaved={async () => { setEditing(null); await loans.reload() }} />
        </div>
      )}

      {loans.error && <div className="alert alert-danger py-2 small">Couldn't load loans.</div>}

      <div className="row g-3">
        {list.map((l) => (
          <div className="col-lg-6" key={l.id}>
            <LoanCard loan={l} onEdit={() => setEditing(l)}
              onDelete={async () => { await api(`/loans/${l.id}`, { method: 'DELETE' }); await loans.reload() }} />
          </div>
        ))}
        {!editing && loans.data && list.length === 0 && (
          <div className="col-lg-6">
            <button className="add-tile" onClick={() => setEditing({})}>
              <Icon name="plus" size={26} />Add your first loan
              <span className="small fw-normal text-muted">Made-up numbers only</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function LoanCard({ loan: l, onEdit, onDelete }) {
  const principal = Number(l.principal)
  const balance = Number(l.remainingBalance)
  const apr = Number(l.interestRate)
  const payment = Number(l.monthlyPayment)
  const paidPct = principal > 0 ? Math.max(0, Math.min(100, Math.round(((principal - balance) / principal) * 100))) : 0
  const est = payoff(balance, apr, payment)
  const interest = (balance * apr) / 100 / 12
  const due = daysUntil(l.nextDueDate)

  return (
    <div className="fun-card h-100">
      <div className="card-body">
        <div className="d-flex align-items-start gap-2 mb-3">
          <div className="cat-icon" style={{ '--cat': 'var(--tone)' }}><Icon name="bank" /></div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="fw-bold text-truncate">{l.name}</div>
            {l.lender && <div className="small text-muted text-truncate">{l.lender}</div>}
          </div>
          {balance === 0 ? <span className="pill pill-good"><Icon name="trophy" size={13} />Paid off</span>
            : <span className={`pill ${due < 0 ? 'pill-bad' : due <= 7 ? 'pill-warn' : 'pill-tone'}`}><Icon name="calendar" size={13} />{dueText(due)}</span>}
        </div>

        <div className="d-flex align-items-center gap-3 mb-3">
          <ProgressRing value={paidPct} size={96} stroke={10} color="var(--tone)" label={`${l.name}: ${paidPct}% paid off`}>
            <span className="ring-pct fs-5">{paidPct}%</span>
            <span className="small text-muted">paid</span>
          </ProgressRing>
          <div style={{ minWidth: 0 }}>
            <div className="small text-muted">Left to pay</div>
            <div className="fs-4 fw-bold tabular">{money(balance)}</div>
            <div className="small text-muted">of {money(principal)} borrowed</div>
          </div>
        </div>

        <div className="mini-grid mb-3">
          <div className="mini"><div className="mini-label">Interest rate</div><div className="mini-value">{apr}% APR</div></div>
          <div className="mini"><div className="mini-label">Monthly payment</div><div className="mini-value">{money(payment)}</div></div>
          <div className="mini"><div className="mini-label">Next due</div><div className="mini-value">{date(l.nextDueDate)}</div></div>
          <div className="mini"><div className="mini-label">Paid off by</div>
            <div className="mini-value" style={est.never ? { color: 'var(--bad)' } : undefined}>{est.label}</div></div>
        </div>

        {balance > 0 && interest > 0 && (
          <p className="small text-muted mb-2">
            <Icon name="bulb" size={15} className="me-1" />About {money(interest)} of interest builds up each month at this balance.
          </p>
        )}
        {est.never && (
          <div className="alert alert-warning py-2 small mb-2">
            This payment doesn't cover the monthly interest, so the balance would never go down.
          </div>
        )}
        <div className="d-flex justify-content-end align-items-center gap-1 pt-2 border-top">
          <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${l.name}`} title="Edit"><Icon name="pencil" size={17} /></button>
          <DeleteButton compact what={l.name} onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}

/** Months to pay off with a fixed payment, and the estimated month (FR-LOAN-003). */
function payoff(balance, apr, payment) {
  if (balance <= 0) return { label: 'Paid off' }
  if (payment <= 0) return { label: 'Add a payment', never: false }
  const r = apr / 100 / 12
  let months
  if (r === 0) {
    months = Math.ceil(balance / payment)
  } else {
    if (payment <= balance * r) return { label: 'Never at this rate', never: true }
    months = Math.ceil(-Math.log(1 - (r * balance) / payment) / Math.log(1 + r))
  }
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  const when = d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
  return { label: `${when} (${months} mo)` }
}

function LoanForm({ loan, onCancel, onSaved }) {
  const isNew = !loan.id
  const str = (v) => (v === undefined || v === null ? '' : String(v))
  const [form, setForm] = useState({
    name: str(loan.name), lender: str(loan.lender), principal: str(loan.principal),
    remainingBalance: str(loan.remainingBalance), interestRate: str(loan.interestRate),
    monthlyPayment: str(loan.monthlyPayment), nextDueDate: str(loan.nextDueDate),
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const n = (v) => (v === '' ? null : Number(v))

  const submit = async (e) => {
    e.preventDefault()
    if (form.principal !== '' && form.remainingBalance !== '' && Number(form.remainingBalance) > Number(form.principal)) {
      setErrors({ remainingBalance: "Remaining balance can't be more than the original amount" })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      await api(isNew ? '/loans' : `/loans/${loan.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: {
          name: form.name, lender: form.lender || null,
          principal: n(form.principal), remainingBalance: n(form.remainingBalance),
          interestRate: n(form.interestRate), monthlyPayment: n(form.monthlyPayment),
          nextDueDate: form.nextDueDate || null,
        },
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
      <FormField id="name" label="Loan name" className="col-sm-6" maxLength={100} placeholder="Fed Unsub Loan A"
        value={form.name} onChange={set} error={errors.name} />
      <FormField id="lender" label="Lender (optional)" className="col-sm-6" maxLength={100} placeholder="Fictional Loan Servicer"
        value={form.lender} onChange={set} error={errors.lender} />
      <FormField id="principal" label="Original amount ($)" type="number" step="0.01" min="0" className="col-sm-4"
        value={form.principal} onChange={set} error={errors.principal} />
      <FormField id="remainingBalance" label="Remaining balance ($)" type="number" step="0.01" min="0" className="col-sm-4"
        value={form.remainingBalance} onChange={set} error={errors.remainingBalance} />
      <FormField id="interestRate" label="Interest rate (APR %)" type="number" step="0.01" min="0" max="100" className="col-sm-4"
        value={form.interestRate} onChange={set} error={errors.interestRate} />
      <FormField id="monthlyPayment" label="Monthly payment ($)" type="number" step="0.01" min="0" className="col-sm-6"
        value={form.monthlyPayment} onChange={set} error={errors.monthlyPayment} />
      <FormField id="nextDueDate" label="Next due date" type="date" className="col-sm-6"
        value={form.nextDueDate} onChange={set} error={errors.nextDueDate} />
      <div className="col-12 d-flex gap-2 mt-2">
        <button className="btn btn-tone btn-sm" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add loan' : 'Save'}</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
