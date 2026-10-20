import { useEffect, useState } from 'react'
import { api } from '../auth/api.js'
import { useAuth } from '../auth/AuthContext.jsx'

// Profile and settings (UC-PROF-01): edit profile, change password, delete account.
export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    api('/users/me').then(setProfile).catch(() => setLoadError(true))
  }, [])

  if (loadError) {
    return <div className="alert alert-danger">We couldn't load your profile. Please refresh the page.</div>
  }
  if (!profile) return <div className="text-center py-5 text-muted">Loading…</div>

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1">Profile and settings</h1>
        {profile.createdAt && (
          <p className="text-muted mb-0">Member since {new Date(profile.createdAt).toLocaleDateString('en-US')}</p>
        )}
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <ProfileForm profile={profile} onSaved={setProfile} />
        </div>
        <div className="col-lg-5">
          <PasswordForm />
          <DeleteAccount />
        </div>
      </div>
    </>
  )
}

const PROFILE_FIELDS = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name', half: true },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name', half: true },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone (optional)', type: 'tel', autoComplete: 'tel' },
  { name: 'address', label: 'Address (optional)', autoComplete: 'street-address' },
]

const toForm = (p) => Object.fromEntries(PROFILE_FIELDS.map((f) => [f.name, p[f.name] ?? '']))

function ProfileForm({ profile, onSaved }) {
  const { updateUser } = useAuth()
  const [form, setForm] = useState(toForm(profile))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const changed = PROFILE_FIELDS.some((f) => form[f.name] !== (profile[f.name] ?? ''))

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      const p = await api('/users/me', { method: 'PUT', body: form })
      onSaved(p)
      setForm(toForm(p))
      updateUser({ firstName: p.firstName, lastName: p.lastName, email: p.email })
      setSaved(true)
    } catch (err) {
      setErrors(err.errors)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h2 className="card-title-sm mb-3">Profile</h2>

        {saved && <div className="alert alert-success py-2" role="status">Your profile was saved.</div>}
        {errors.form && <div className="alert alert-danger py-2" role="alert">{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate className="row g-3">
          {PROFILE_FIELDS.slice(0, 2).map((f) => (
            <Field key={f.name} f={f} value={form[f.name]} error={errors[f.name]} onChange={update} />
          ))}
          <div className="col-12">
            <label htmlFor="username" className="form-label">Username</label>
            <input id="username" className="form-control" value={profile.username} disabled readOnly />
            <div className="form-text">Usernames can't be changed.</div>
          </div>
          {PROFILE_FIELDS.slice(2).map((f) => (
            <Field key={f.name} f={f} value={form[f.name]} error={errors[f.name]} onChange={update} />
          ))}
          <div className="col-12 d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={!changed || saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {changed && (
              <button type="button" className="btn btn-outline-secondary"
                onClick={() => { setForm(toForm(profile)); setErrors({}) }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function PasswordForm() {
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setDone(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      await api('/users/me/password', {
        method: 'PUT',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      })
      setForm(empty)
      setDone(true)
    } catch (err) {
      setErrors(err.errors)
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { name: 'currentPassword', label: 'Current password', type: 'password', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'New password', type: 'password', autoComplete: 'new-password',
      help: 'At least 8 characters, with a letter and a number.' },
    { name: 'confirmPassword', label: 'Confirm new password', type: 'password', autoComplete: 'new-password' },
  ]

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body p-4">
        <h2 className="card-title-sm mb-3">Change password</h2>

        {done && <div className="alert alert-success py-2" role="status">Your password was changed.</div>}
        {errors.form && <div className="alert alert-danger py-2" role="alert">{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate className="row g-3">
          {fields.map((f) => (
            <Field key={f.name} f={f} value={form[f.name]} error={errors[f.name]} onChange={update} />
          ))}
          <div className="col-12">
            <button type="submit" className="btn btn-primary"
              disabled={saving || !form.currentPassword || !form.newPassword}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e) => {
    e.preventDefault()
    setErrors({})
    setDeleting(true)
    try {
      await api('/users/me/delete', { method: 'POST', body: { password } })
      // Full page reload so every bit of signed-in state is cleared.
      window.location.assign('/login?deleted=1')
    } catch (err) {
      setErrors(err.errors)
      setDeleting(false)
    }
  }

  return (
    <div className="card shadow-sm border border-danger-subtle">
      <div className="card-body p-4">
        <h2 className="card-title-sm text-danger mb-2">Delete account</h2>
        <p className="small text-muted">
          This permanently deletes your account and all of your data. It can't be undone.
        </p>

        {!confirming ? (
          <button className="btn btn-outline-danger" onClick={() => setConfirming(true)}>
            Delete my account
          </button>
        ) : (
          <form onSubmit={handleDelete} noValidate>
            {errors.form && <div className="alert alert-danger py-2" role="alert">{errors.form}</div>}
            <label htmlFor="deletePassword" className="form-label">Enter your password to confirm</label>
            <div className="mb-3">
              <input id="deletePassword" type="password" autoComplete="current-password" autoFocus
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="invalid-feedback" aria-live="polite">{errors.password}</div>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-danger" disabled={deleting || !password}>
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button type="button" className="btn btn-outline-secondary"
                onClick={() => { setConfirming(false); setPassword(''); setErrors({}) }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ f, value, error, onChange }) {
  return (
    <div className={f.half ? 'col-sm-6' : 'col-12'}>
      <label htmlFor={f.name} className="form-label">{f.label}</label>
      <input id={f.name} name={f.name} type={f.type ?? 'text'} autoComplete={f.autoComplete}
        className={`form-control ${error ? 'is-invalid' : ''}`} value={value} onChange={onChange} />
      {f.help && !error && <div className="form-text">{f.help}</div>}
      <div className="invalid-feedback" aria-live="polite">{error}</div>
    </div>
  )
}
