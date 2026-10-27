import { useEffect, useRef, useState } from 'react'
import { askAssistant } from '../ai/assistantApi.js'
import { SUGGESTED_QUESTIONS } from '../ai/fallbackAnswers.js'
import { useAuth } from '../auth/AuthContext.jsx'
import Icon from '../components/ui/Icon.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

const MAX_LENGTH = 500
const SUGGESTION_ICONS = ['grad', 'cart', 'pie', 'percent', 'bulb', 'coins']

// AI financial assistant (UC-AI-02). The conversation lives only in this page's
// memory, so it disappears on refresh or sign-out (FR-AI-007).
export default function AssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  const send = async (text) => {
    const question = text.trim()
    if (!question || thinking) return
    if (question.length > MAX_LENGTH) {
      setError(`Questions can be up to ${MAX_LENGTH} characters.`)
      return
    }
    setError('')
    const history = messages.map((m) => ({ role: m.role, content: m.text }))
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setThinking(true)
    try {
      const reply = await askAssistant(question, history)
      setMessages((m) => [...m, { role: 'assistant', text: reply.text, source: reply.source }])
    } catch (err) {
      setError(err.limit ?? 'Something went wrong. Please try again.')
    } finally {
      setThinking(false)
    }
  }

  const handleKeyDown = (e) => {
    // Enter sends; Shift + Enter makes a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9">
        <PageHeader tone="ai" icon="sparkles" title="AI Assistant"
          subtitle={`Hi ${user.firstName}! Ask me anything about budgeting, saving, or student loans.`}
          actions={messages.length > 0 && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { setMessages([]); setError('') }}>
              New chat
            </button>
          )} />

        <div className="fun-card chat-shell">
          <div className="chat-body" aria-live="polite">
            {messages.length === 0 && !thinking && (
              <div className="py-2">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="avatar"><Icon name="bot" size={18} /></span>
                  <div className="chat-bubble chat-assistant">
                    Hey! I'm your money coach. Pick a question to start, or type your own below.
                  </div>
                </div>
                <div className="row g-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <div className="col-sm-6" key={q}>
                      <button className="suggest h-100" onClick={() => send(q)}>
                        <span className="cat-icon"><Icon name={SUGGESTION_ICONS[i % SUGGESTION_ICONS.length]} size={18} /></span>
                        <span className="small fw-semibold">{q}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-row ${m.role === 'user' ? 'me' : ''}`}>
                {m.role === 'assistant' && <span className="avatar"><Icon name="bot" size={18} /></span>}
                <div className={`chat-bubble ${m.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                  <div className="visually-hidden">{m.role === 'user' ? 'You said:' : 'Assistant said:'}</div>
                  {m.text}
                  {m.role === 'assistant' && (
                    <div className="chat-meta">
                      {m.source === 'fallback' ? 'Built-in answer · AI service not connected' : 'AI answer'}
                      {' · Not financial advice'}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="chat-row">
                <span className="avatar"><Icon name="bot" size={18} /></span>
                <div className="chat-bubble chat-assistant">
                  <span className="typing" aria-label="Thinking"><span /><span /><span /></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-top p-3">
            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); send(input) }}>
              <label htmlFor="question" className="visually-hidden">Your question</label>
              <div className="composer">
                <textarea id="question" className="form-control" rows={1} maxLength={MAX_LENGTH}
                  placeholder="Ask a question…"
                  value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
                <button type="submit" className="send-btn" disabled={!input.trim() || thinking} aria-label="Send">
                  <Icon name="send" size={18} />
                </button>
              </div>
              <div className="d-flex justify-content-between form-text px-1">
                <span>Enter to send · Shift + Enter for a new line</span>
                <span>{input.length}/{MAX_LENGTH}</span>
              </div>
            </form>
            <p className="small text-muted mb-0 mt-2">
              <Icon name="alert" size={14} className="me-1" />
              General education only, not financial advice. Never share real account numbers, passwords, or personal info.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
