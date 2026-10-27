import { useState } from 'react'
import { api } from '../auth/api.js'
import FormField from '../components/ui/FormField.jsx'
import DeleteButton from '../components/ui/DeleteButton.jsx'
import MonthSelect from '../components/ui/MonthSelect.jsx'
import Icon from '../components/ui/Icon.jsx'
import PageHeader, { HeroStat } from '../components/ui/PageHeader.jsx'
import { useApiData } from '../utils/useApiData.js'
import { useTheme } from '../theme/ThemeContext.jsx'
import { categoryColor, categoryIcon } from '../utils/categoryStyle.js'
import { CATEGORIES, currentMonth, money, monthLabel, today } from '../utils/format.js'

const TYPES = ['Checking', 'Savings', 'Credit card']
const typeClass = (t) => (t === 'Savings' ? 'type-savings' : t === 'Credit card' ? 'type-credit' : 'type-checking')
const typeIcon = (t) => (t === 'Savings' ? 'coins' : t === 'Credit card' ? 'card' : 'wallet')

// Accounts (UC-ACC-01) and their transactions (UC-ACC-02). Fabricated data only (BR-001).
export default function AccountsPage() {
  const accounts = useApiData('/accounts')
  const [month, setMonth] = useState(currentMonth())
  const transactions = useApiData(`/transactions?month=${month}`)

  // Adding or changing a transaction changes account balances too
  const reloadAll = () => Promise.all([accounts.reload(), transactions.reload()])
  const [adding, setAdding] = useState(false)

  const list = (accounts.data ?? []).map((a) => ({ ...a, balance: Number(a.balance) }))
  const net = list.reduce((s, a) => s + a.balance, 0)
  const cash = list.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const owed = list.filter((a) => a.balance < 0).reduce((s, a) => s - a.balance, 0)

  return (
    <div className="tone-accounts">
      <PageHeader tone="accounts" icon="wallet" title="Accounts"
        subtitle="Your simulated accounts and spending. Made-up numbers only, never real account or card numbers."
        actions={!adding && (
          <button className="btn btn-tone d-inline-flex align-items-center gap-1" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} />Add account
          </button>
        )}>
        <HeroStat label="Net total" value={money(net)} note={`${list.length} account${list.length === 1 ? '' : 's'}`} />
        <HeroStat label="Cash" value={money(cash)} note="Checking and savings" />
        <HeroStat label="Owed on cards" value={money(owed)} tone={owed > 0 ? 'danger' : undefined} note="Credit card balance" />
      </PageHeader>

      <AccountsSection state={accounts} list={list} onChange={reloadAll} adding={adding} setAdding={setAdding} />
      <TransactionsSection state={transactions} accounts={list} month={month} setMonth={setMonth} onChange={reloadAll} />
    </div>
  )
}

/* ---------------- Accounts ---------------- */

function AccountsSection({ state, list, onChange, adding, setAdding }) {
  const [editingAccount, setEditingAccount] = useState(null)
  // The form is open for a new account (from the header button) or for one being edited
  const editing = adding ? {} : editingAccount
  const setEditing = (a) => {
    if (a && !a.id) { setAdding(true); setEditingAccount(null) } else { setAdding(false); setEditingAccount(a) }
  }

  return (
    <section className="mb-5">
      <h2 className="h5 fw-bold mb-3">Your accounts</h2>
      {state.error && <div className="alert alert-danger py-2 small">Couldn't load accounts.</div>}

      {editing && (
        <div className="form-panel mb-3">
          <h3 className="h6 fw-bold mb-3">{editing.id ? `Edit ${editing.name}` : 'New account'}</h3>
          <AccountForm account={editing} onCancel={() => setEditing(null)}
            onSaved={async () => { setEditing(null); await onChange() }} />
        </div>
      )}

      <div className="row g-3">
        {list.map((a) => (
          <div className="col-md-6 col-xl-4" key={a.id}>
            <div className={`bank-card ${typeClass(a.type)}`}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="bc-type d-flex align-items-center gap-1"><Icon name={typeIcon(a.type)} size={15} />{a.type}</div>
                  <div className="bc-name">{a.name}</div>
                </div>
                <div className="bc-chip" aria-hidden="true" />
              </div>
              <div>
                <div className="bc-type">{a.balance < 0 ? 'Amount owed' : 'Balance'}</div>
                <div className="bc-balance">{money(Math.abs(a.balance))}</div>
              </div>
            </div>
            <div className="d-flex justify-content-end align-items-center gap-1 mt-1 px-1">
              <button className="icon-btn" onClick={() => setEditing(a)} aria-label={`Edit ${a.name}`} title="Edit"><Icon name="pencil" size={17} /></button>
              <DeleteButton compact what={a.name}
                onDelete={async () => { await api(`/accounts/${a.id}`, { method: 'DELETE' }); await onChange() }} />
            </div>
          </div>
        ))}
        {!editing && state.data && list.length === 0 && (
          <div className="col-md-6 col-xl-4">
            <button className="add-tile" style={{ minHeight: 170 }} onClick={() => setEditing({})}>
              <Icon name="plus" size={26} />
              Add an account
              <span className="small fw-normal text-muted">Start with a checking account</span>
            </button>
          </div>
        )}
      </div>
      {list.length > 0 && <p className="small text-muted mt-2 mb-0">Deleting an account also deletes its transactions.</p>}
    </section>
  )
}

function AccountForm({ account, onCancel, onSaved }) {
  const isNew = !account.id
  const isCard = (t) => t === 'Credit card'
  const [form, setForm] = useState({
    name: account.name ?? '',
    type: account.type ?? 'Checking',
    // Credit cards are entered as "amount owed" (a positive number) and stored as negative
    opening: account.openingBalance !== undefined
      ? String(isCard(account.type) ? Math.abs(account.openingBalance) : account.openingBalance) : '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    const opening = form.opening === '' ? 0 : Number(form.opening)
    const body = {
      name: form.name,
      type: form.type,
      openingBalance: isCard(form.type) ? -Math.abs(opening) : opening,
    }
    setSaving(true)
    try {
      await api(isNew ? '/accounts' : `/accounts/${account.id}`, { method: isNew ? 'POST' : 'PUT', body })
      await onSaved()
    } catch (err) {
      setErrors({ ...err.errors, opening: err.errors?.openingBalance })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="row g-2">
      {errors.form && <div className="alert alert-danger py-2 small mb-1">{errors.form}</div>}
      <FormField id="name" label="Account name" className="col-md-5" value={form.name} onChange={set} error={errors.name}
        placeholder="Campus Checking" maxLength={100} />
      <FormField id="type" label="Type" as="select" className="col-md-3" value={form.type} onChange={set} error={errors.type}>
        {TYPES.map((t) => <option key={t}>{t}</option>)}
      </FormField>
      <FormField id="opening" className="col-md-4" label={isCard(form.type) ? 'Amount owed when added ($)' : 'Starting balance ($)'}
        type="number" step="0.01" value={form.opening} onChange={set} error={errors.opening}
        help={isCard(form.type) ? 'What you owed on the card when you added it.' : 'The balance before any transactions you add here.'} />
      <div className="col-12 d-flex gap-2 mt-2">
        <button className="btn btn-tone btn-sm" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add account' : 'Save'}</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

/* ---------------- Transactions ---------------- */

function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (iso === today()) return 'Today'
  const yest = new Date(); yest.setDate(yest.getDate() - 1)
  if (date.toDateString() === yest.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function TransactionsSection({ state, accounts, month, setMonth, onChange }) {
  const { theme } = useTheme()
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('All')
  const all = (state.data ?? []).map((t) => ({ ...t, amount: Number(t.amount) }))
  const moneyIn = all.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const moneyOut = all.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0)
  const shown = all
    .filter((t) => filter === 'All' || (filter === 'Income' ? t.amount > 0 : t.amount < 0))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)

  // Group by day, newest first
  const days = []
  for (const t of shown) {
    const last = days[days.length - 1]
    if (last && last.date === t.date) last.items.push(t)
    else days.push({ date: t.date, items: [t] })
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <h2 className="h5 fw-bold mb-0">Transactions</h2>
        <div className="d-flex flex-wrap align-items-end gap-2">
          <MonthSelect id="txnMonth" value={month} onChange={setMonth} />
          {!editing && (
            <button className="btn btn-tone d-inline-flex align-items-center gap-1" disabled={accounts.length === 0}
              title={accounts.length === 0 ? 'Add an account first' : undefined} onClick={() => setEditing({})}>
              <Icon name="plus" size={18} />Add transaction
            </button>
          )}
        </div>
      </div>

      {accounts.length === 0 && <div className="alert alert-light border small">Add an account first, then you can record transactions.</div>}

      {editing && (
        <div className="form-panel mb-3">
          <h3 className="h6 fw-bold mb-3">{editing.id ? 'Edit transaction' : 'New transaction'}</h3>
          <TransactionForm txn={editing} accounts={accounts} onCancel={() => setEditing(null)}
            onSaved={async () => { setEditing(null); await onChange() }} />
        </div>
      )}

      <div className="fun-card">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-1">
            <div className="seg" role="group" aria-label="Show">
              {['All', 'Spending', 'Income'].map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="d-flex gap-3 small">
              <span>In <strong style={{ color: 'var(--good)' }}>+{money(moneyIn)}</strong></span>
              <span>Out <strong>−{money(moneyOut)}</strong></span>
            </div>
          </div>

          {state.error && <div className="alert alert-danger py-2 small mt-3">Couldn't load transactions.</div>}
          {state.data && shown.length === 0 && (
            <div className="text-center text-muted py-5">
              <Icon name="calendar" size={32} />
              <p className="mt-2 mb-0">No {filter === 'All' ? '' : `${filter.toLowerCase()} `}transactions in {monthLabel(month)}.</p>
            </div>
          )}

          {days.map((d) => (
            <div key={d.date}>
              <div className="txn-day">{dayLabel(d.date)}</div>
              {d.items.map((t) => (
                <div className="txn-row" key={t.id} style={{ '--cat': categoryColor(t.category, theme) }}>
                  <div className="cat-icon sm"><Icon name={categoryIcon(t.category)} size={18} /></div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-truncate">{t.description}</div>
                    <div className="small text-muted text-truncate">{t.category} · {t.account}</div>
                  </div>
                  <div className="txn-actions d-flex">
                    <button className="icon-btn" onClick={() => setEditing(t)} aria-label={`Edit ${t.description}`} title="Edit"><Icon name="pencil" size={16} /></button>
                    <DeleteButton compact what={t.description}
                      onDelete={async () => { await api(`/transactions/${t.id}`, { method: 'DELETE' }); await onChange() }} />
                  </div>
                  <div className={`txn-amt ${t.amount > 0 ? 'in' : ''}`}>
                    {t.amount > 0 ? '+' : '−'}{money(Math.abs(t.amount))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TransactionForm({ txn, accounts, onCancel, onSaved }) {
  const isNew = !txn.id
  const [form, setForm] = useState({
    kind: txn.amount > 0 ? 'Income' : 'Expense',
    accountId: String(txn.accountId ?? accounts[0]?.id ?? ''),
    date: txn.date ?? today(),
    description: txn.description ?? '',
    category: txn.amount > 0 ? 'Income' : (txn.category ?? ''),
    amount: txn.amount !== undefined ? String(Math.abs(txn.amount)) : '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const setKind = (kind) => setForm({ ...form, kind, category: kind === 'Income' ? 'Income' : '' })

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter an amount greater than $0'
    if (form.date > today()) errs.date = "Date can't be in the future"
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const amount = Math.abs(Number(form.amount))
    const body = {
      accountId: Number(form.accountId),
      date: form.date,
      description: form.description,
      category: form.kind === 'Income' ? 'Income' : form.category,
      amount: form.kind === 'Income' ? amount : -amount, // spending is stored as a negative number
    }
    setSaving(true)
    try {
      await api(isNew ? '/transactions' : `/transactions/${txn.id}`, { method: isNew ? 'POST' : 'PUT', body })
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
      <div className="col-12 mb-1">
        <div className="seg" role="group" aria-label="Transaction type">
          {['Expense', 'Income'].map((k) => (
            <button key={k} type="button" aria-pressed={form.kind === k} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>
      </div>
      <FormField id="amount" label="Amount ($)" type="number" step="0.01" min="0.01" className="col-sm-4"
        value={form.amount} onChange={set} error={errors.amount} />
      <FormField id="date" label="Date" type="date" max={today()} className="col-sm-4"
        value={form.date} onChange={set} error={errors.date} />
      <FormField id="accountId" label="Account" as="select" className="col-sm-4"
        value={form.accountId} onChange={set} error={errors.accountId}>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </FormField>
      <FormField id="description" label="Description" className="col-sm-7" maxLength={255}
        placeholder={form.kind === 'Income' ? 'Part-time job paycheck' : 'Campus Market'}
        value={form.description} onChange={set} error={errors.description} />
      {form.kind === 'Expense' ? (
        <FormField id="category" label="Category" className="col-sm-5" list="category-options" maxLength={100}
          placeholder="Groceries" value={form.category} onChange={set} error={errors.category}
          help="Pick one or type your own." />
      ) : (
        <FormField id="category" label="Category" className="col-sm-5" value="Income" readOnly disabled />
      )}
      <datalist id="category-options">
        {CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
      <div className="col-12 d-flex gap-2 mt-2">
        <button className="btn btn-tone btn-sm" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add transaction' : 'Save'}</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
