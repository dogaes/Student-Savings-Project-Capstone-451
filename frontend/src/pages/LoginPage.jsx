import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import ThemeToggle from '../theme/ThemeToggle.jsx'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      await login(usernameOrEmail, password)
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true })
    } catch (err) {
      setErrors(err.errors)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="position-fixed top-0 end-0 p-3"><ThemeToggle /></div>
      <div className="card shadow-sm w-100 auth-card">
        <div className="card-body p-4">
          <h1 className="h3 mb-1 brand">Student Savings</h1>
          <p className="text-muted mb-4">Sign in to your account</p>

          {new URLSearchParams(location.search).has('deleted') && !errors.form && (
            <div className="alert alert-success" role="status">Your account was deleted.</div>
          )}
          {errors.form && <div className="alert alert-danger" role="alert">{errors.form}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="login" className="form-label">Username or email</label>
              <input id="login" className={`form-control ${errors.usernameOrEmail ? 'is-invalid' : ''}`}
                autoComplete="username" value={usernameOrEmail} autoFocus
                onChange={(e) => setUsernameOrEmail(e.target.value)} />
              <div className="invalid-feedback" aria-live="polite">{errors.usernameOrEmail}</div>
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input id="password" type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
              <div className="invalid-feedback" aria-live="polite">{errors.password}</div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center mt-4 mb-0">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  )
}