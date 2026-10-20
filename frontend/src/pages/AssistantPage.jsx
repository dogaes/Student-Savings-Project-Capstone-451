import { useEffect, useRef, useState } from 'react'
import { askAssistant } from '../ai/assistantApi.js'
import { SUGGESTED_QUESTIONS } from '../ai/fallbackAnswers.js'

const MAX_LENGTH = 500

// AI financial assistant (UC-AI-02). The conversation lives only in this page's
// memory, so it disappears on refresh or sign-out (FR-AI-007).
export default function AssistantPage() {
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
        <div className="d-flex justify-content-between align-items-end mb-3">
          <div>
            <h1 className="h3 mb-1">AI Assistant</h1>
            <p className="text-muted mb-0">Ask questions about budgeting, saving, and student loans.</p>
          </div>
          {messages.length > 0 && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { setMessages([]); setError('') }}>
              Clear chat
            </button>
          )}
        </div>

        <div className="alert alert-light border small mb-3" role="note">
          Answers are general education only, not financial advice. Never share real account numbers,
          passwords, or other personal information here.
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body chat-body" aria-live="polite">
            {messages.length === 0 && !thinking && (
              <div className="text-center text-muted py-4">
                <p className="mb-3">Try one of these to get started:</p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button key={q} className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`d-flex mb-3 ${m.role === 'user' ? 'justify-content-end' : ''}`}>
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
              <div className="d-flex mb-3">
                <div className="chat-bubble chat-assistant text-muted">
                  <span className="spinner-grow spinner-grow-sm me-2" aria-hidden="true" />Thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="card-footer bg-white border-top p-3">
            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); send(input) }}>
              <label htmlFor="question" className="visually-hidden">Your question</label>
              <div className="d-flex gap-2 align-items-end">
                <textarea id="question" className="form-control" rows={2} maxLength={MAX_LENGTH}
                  placeholder="Ask a question… (Enter to send, Shift + Enter for a new line)"
                  value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
                <button type="submit" className="btn btn-primary" disabled={!input.trim() || thinking}>
                  Send
                </button>
              </div>
              <div className="form-text text-end">{input.length}/{MAX_LENGTH}</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
