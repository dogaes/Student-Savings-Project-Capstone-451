import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import ThemeToggle from '../theme/ThemeToggle.jsx'

// The demo code shown in the pretend text message. It must match TWO_FACTOR_CODE on the server
// (default 123456).
const DEMO_CODE = '123456'

// Sign in (UC-AUTH-03) in two steps: password, then a code sent by "text message".
export default function LoginPage() {
  const { user, login, verifyCode, resendCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Coming from sign-up: fill in the new username and show a success message
  const registered = location.state?.registered
  const [usernameOrEmail, setUsernameOrEmail] = useState(registered ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState('password') // 'password' or 'code'
  const [sentTo, setSentTo] = useState('')
  const [textKey, setTextKey] = useState(0) // changes each time a "text" is sent, to replay the popup

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      const res = await login(usernameOrEmail, password)
      setSentTo(res?.sentTo ?? 'your phone')
      setStep('code')
      setTextKey((k) => k + 1)
    } catch (err) {
      setErrors(err.errors)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  const backToPassword = (message) => {
    setStep('password')
    setPassword('')
    setErrors(message ? { form: message } : {})
  }

  return (
    <main className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="position-fixed top-0 end-0 p-3"><ThemeToggle /></div>
      {step === 'code' && <FakeText key={textKey} code={DEMO_CODE} />}

      <div className="card shadow-sm w-100 auth-card">
        <div className="card-body p-4">
          <img src="/logo.png" alt="" width="112" height="112" className="auth-logo" />
          <h1 className="h3 mb-1 brand text-center">Student Savings</h1>

          {step === 'password' ? (
            <>
              <p className="text-muted mb-4 text-center">Sign in to your account</p>

              {registered && !errors.form && (
                <div className="alert alert-success" role="status">Your account is ready. Sign in to get started.</div>
              )}
              {new URLSearchParams(location.search).has('deleted') && !errors.form && (
                <div className="alert alert-success" role="status">Your account was deleted.</div>
              )}
              {errors.form && <div className="alert alert-danger" role="alert">{errors.form}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="login" className="form-label">Username or email</label>
                  <input id="login" className={`form-control ${errors.usernameOrEmail ? 'is-invalid' : ''}`}
                    autoComplete="username" value={usernameOrEmail} autoFocus={!registered}
                    onChange={(e) => setUsernameOrEmail(e.target.value)} />
                  <div className="invalid-feedback" aria-live="polite">{errors.usernameOrEmail}</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input id="password" type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    autoComplete="current-password" value={password} autoFocus={!!registered}
                    onChange={(e) => setPassword(e.target.value)} />
                  <div className="invalid-feedback" aria-live="polite">{errors.password}</div>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                  {submitting ? 'Checking…' : 'Continue'}
                </button>
              </form>

              <p className="text-center mt-4 mb-0">
                New here? <Link to="/register">Create an account</Link>
              </p>
            </>
          ) : (
            <CodeStep sentTo={sentTo} verifyCode={verifyCode}
              onVerified={() => navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true })}
              onResend={async () => { await resendCode(); setTextKey((k) => k + 1) }}
              onStartOver={backToPassword} />
          )}
        </div>
      </div>
    </main>
  )
}

/** Step 2: type the 6-digit code from the text message. */
function CodeStep({ sentTo, verifyCode, onVerified, onResend, onStartOver }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code'); return }
    setError('')
    setBusy(true)
    try {
      await verifyCode(code)
      onVerified()
    } catch (err) {
      if (err.status === 401) {
        onStartOver(err.errors?.form ?? 'Please sign in again.') // expired or too many tries
        return
      }
      setError(err.errors?.code ?? err.errors?.form ?? 'That code isn\'t right.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      await onResend()
      setResent(true)
    } catch (err) {
      onStartOver(err.errors?.form ?? 'Please sign in again.')
    }
  }

  return (
    <>
      <p className="text-muted mb-4 text-center">
        We texted a 6-digit code to <strong>{sentTo}</strong>. Enter it below to finish signing in.
      </p>
      {resent && !error && <div className="alert alert-success py-2 small" role="status">We sent a new code.</div>}
      <form onSubmit={submit} noValidate>
        <label htmlFor="code" className="form-label">Verification code</label>
        <input id="code" className={`form-control code-input ${error ? 'is-invalid' : ''}`} autoFocus
          inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        <div className="invalid-feedback" aria-live="polite">{error}</div>
        <button type="submit" className="btn btn-primary w-100 mt-3" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify and sign in'}
        </button>
      </form>
      <div className="d-flex justify-content-between mt-3 small">
        <button type="button" className="btn btn-link btn-sm p-0" onClick={resend}>Send a new code</button>
        <button type="button" className="btn btn-link btn-sm p-0 text-muted" onClick={() => onStartOver()}>Use a different account</button>
      </div>
      <p className="small text-muted text-center mt-3 mb-0">
        Demo: no real text is sent. The code is always <strong>{DEMO_CODE}</strong>.
      </p>
    </>
  )
}

/** A pretend phone notification that slides in with the code. */
function FakeText({ code }) {
  const [visible, setVisible] = useState(true)
  const timer = useRef(null)
  useEffect(() => {
    timer.current = setTimeout(() => setVisible(false), 12000)
    return () => clearTimeout(timer.current)
  }, [])
  if (!visible) return null
  return (
    <div className="fake-text" role="status" aria-live="polite">
      <div className="fake-text-head">
        <span className="fake-text-app">Messages</span>
        <span>now</span>
        <button type="button" className="fake-text-close" aria-label="Dismiss" onClick={() => setVisible(false)}>×</button>
      </div>
      <div className="fake-text-from">Student Savings</div>
      <div>Your sign-in code is <strong className="tabular">{code}</strong>. It expires in 5 minutes. Don't share it with anyone.</div>
    </div>
  )
}
