import { useEffect, useRef, useState } from 'react'
import { api } from '../auth/api.js'
import Icon from './ui/Icon.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'
import { categoryColor, categoryIcon } from '../utils/categoryStyle.js'
import { date, money, monthLabel } from '../utils/format.js'

/**
 * Side drawer with every transaction for one account, across all months, newest first.
 * Opens when you click an account card on the Accounts page.
 */
export default function AccountHistory({ account, onClose }) {
  const { theme } = useTheme()
  const [txns, setTxns] = useState(null)
  const [error, setError] = useState(false)
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Load each month that has data, then keep only this account's transactions
  useEffect(() => {
    let alive = true
    setTxns(null)
    setError(false)
    api('/months')
      .then((months) => Promise.all((months ?? []).map((m) => api(`/transactions?month=${m}`))))
      .then((lists) => {
        if (!alive) return
        const mine = lists.flat()
          .filter((t) => t.accountId === account.id)
          .map((t) => ({ ...t, amount: Number(t.amount) }))
          .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        setTxns(mine)
      })
      .catch(() => alive && setError(true))
    return () => { alive = false }
  }, [account.id])

  // Escape closes; focus the close button when it opens
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const list = txns ?? []
  const moneyIn = list.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const moneyOut = list.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0)
  const balance = Number(account.balance)

  // Group by month
  const groups = []
  for (const t of list) {
    const m = t.date.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === m) last.items.push(t)
    else groups.push({ month: m, items: [t] })
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer tone-accounts" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="drawer-head">
          <div style={{ minWidth: 0 }}>
            <div className="small text-muted">{account.type}</div>
            <h2 id="history-title" className="h5 fw-bold mb-0 text-truncate">{account.name}</h2>
          </div>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="plus" size={22} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="mini-grid mb-3">
            <div className="mini"><div className="mini-label">{balance < 0 ? 'Amount owed' : 'Balance'}</div>
              <div className="mini-value" style={balance < 0 ? { color: 'var(--bad)' } : undefined}>{money(Math.abs(balance))}</div></div>
            <div className="mini"><div className="mini-label">Transactions</div><div className="mini-value">{txns ? list.length : '…'}</div></div>
            <div className="mini"><div className="mini-label">Money in</div><div className="mini-value" style={{ color: 'var(--good)' }}>+{money(moneyIn)}</div></div>
            <div className="mini"><div className="mini-label">Money out</div><div className="mini-value">−{money(moneyOut)}</div></div>
          </div>

          {error && <div className="alert alert-danger py-2 small">Couldn't load this account's history. Please try again.</div>}
          {!txns && !error && <p className="text-muted small"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Loading history…</p>}
          {txns && list.length === 0 && (
            <div className="text-center text-muted py-5">
              <Icon name="calendar" size={30} />
              <p className="mt-2 mb-0">No transactions for this account yet.</p>
            </div>
          )}

          {groups.map((g) => {
            const net = g.items.reduce((s, t) => s + t.amount, 0)
            return (
              <div key={g.month} className="mb-2">
                <div className="txn-day d-flex justify-content-between">
                  <span>{monthLabel(g.month)}</span>
                  <span className={net >= 0 ? 'text-success' : ''}>{net >= 0 ? '+' : '−'}{money(Math.abs(net))}</span>
                </div>
                {g.items.map((t) => (
                  <div className="txn-row" key={t.id} style={{ '--cat': categoryColor(t.category, theme) }}>
                    <div className="cat-icon sm"><Icon name={categoryIcon(t.category)} size={18} /></div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-truncate">{t.description}</div>
                      <div className="small text-muted text-truncate">{date(t.date)} · {t.category}</div>
                    </div>
                    <div className={`txn-amt ${t.amount > 0 ? 'in' : ''}`}>{t.amount > 0 ? '+' : '−'}{money(Math.abs(t.amount))}</div>
                  </div>
                ))}
              </div>
            )
          })}
          {txns && list.length > 0 && (
            <p className="small text-muted mt-3 mb-0">
              Starting balance when added: {money(Math.abs(Number(account.openingBalance ?? 0)))}{Number(account.openingBalance) < 0 ? ' owed' : ''}
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
