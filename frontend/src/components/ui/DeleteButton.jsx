import { useState } from 'react'
import Icon from './Icon.jsx'

// Two-step delete: the first click asks to confirm, the second actually deletes (NFR-UI-005).
// `compact` shows a small trash-can button instead of the word "Delete".
export default function DeleteButton({ onDelete, label = 'Delete', compact = false, what = '' }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!confirming) {
    return compact ? (
      <button type="button" className="icon-btn danger" onClick={() => setConfirming(true)}
        aria-label={`Delete ${what}`.trim()} title="Delete">
        <Icon name="trash" size={17} />
      </button>
    ) : (
      <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => setConfirming(true)}>
        {label}
      </button>
    )
  }
  return (
    <span className="d-inline-flex gap-2 align-items-center">
      <button type="button" className="btn btn-danger btn-sm py-0" disabled={busy}
        onClick={async () => { setBusy(true); try { await onDelete() } finally { setBusy(false); setConfirming(false) } }}>
        {busy ? 'Deleting…' : 'Confirm delete'}
      </button>
      <button type="button" className="btn btn-link btn-sm p-0 text-reset" onClick={() => setConfirming(false)}>Cancel</button>
    </span>
  )
}