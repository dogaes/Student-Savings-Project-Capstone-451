import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { summarizeMonth } from '../ai/assistantApi.js'
import { monthLabel } from '../utils/format.js'

// "Summarize my month" card on the dashboard (UC-AI-01).
export default function AiSummaryCard({ month, d }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // A different month needs a new summary
  useEffect(() => {
    setSummary(null)
    setError('')
  }, [month])

  const handleClick = async () => {
    setLoading(true)
    setError('')
    try {
      setSummary(await summarizeMonth(month, d))
    } catch (err) {
      setError(err.limit ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h2 className="card-title-sm">AI monthly summary</h2>
            {!summary && <div className="small text-muted">Get a plain-language recap of {monthLabel(month)}.</div>}
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={handleClick} disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Summarizing…</>
              ) : summary ? 'Refresh summary' : 'Summarize my month'}
            </button>
            <Link to="/assistant" className="btn btn-outline-primary btn-sm">Ask a question</Link>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{error}</div>}

        {summary && (
          <div className="mt-3" aria-live="polite">
            <p className="mb-1">{summary.text}</p>
            <div className="chat-meta">
              {summary.source === 'fallback' ? 'Automatic summary · AI service not connected' : 'AI summary'}
              {' · Not financial advice'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
