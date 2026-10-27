import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import ThemeToggle from '../theme/ThemeToggle.jsx'

const FIELDS = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name', half: true },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name', half: true },
  { name: 'username', label: 'Username', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password',
    help: 'At least 8 characters, with a letter and a number.' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
]

export default function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map((f) => [f.name, ''])))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const { confirmPassword, ...body } = form
      await register(body)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrors(err.errors)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container d-flex justify-content-center align-items-center min-vh-100 py-4">
      <div className="position-fixed top-0 end-0 p-3"><ThemeToggle /></div>
      <div className="card shadow-sm w-100 auth-card">
        <div className="card-body p-4">
          <h1 className="h3 mb-1 brand">Create an account</h1>
          <p className="text-muted mb-4">Use made-up financial data only. Never enter real account or card numbers.</p>

          {errors.form && <div className="alert alert-danger" role="alert">{errors.form}</div>}

          <form onSubmit={handleSubmit} noValidate className="row g-3">
            {FIELDS.map((f) => (
              <div key={f.name} className={f.half ? 'col-6' : 'col-12'}>
                <label htmlFor={f.name} className="form-label">{f.label}</label>
                <input id={f.name} name={f.name} type={f.type ?? 'text'} autoComplete={f.autoComplete}
                  className={`form-control ${errors[f.name] ? 'is-invalid' : ''}`}
                  value={form[f.name]} onChange={update} />
                {f.help && !errors[f.name] && <div className="form-text">{f.help}</div>}
                <div className="invalid-feedback" aria-live="polite">{errors[f.name]}</div>
              </div>
            ))}
            <div className="col-12">
              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="text-center mt-4 mb-0">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
