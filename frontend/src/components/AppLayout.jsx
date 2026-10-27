import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import ThemeToggle from '../theme/ThemeToggle.jsx'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/budget', label: 'Budget' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/loans', label: 'Loans' },
  { to: '/goals', label: 'Goals' },
  { to: '/assistant', label: 'AI Assistant' },
]

// Top navigation shared by every signed-in page.
export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body border-bottom sticky-top">
        <div className="container">
          <NavLink to="/dashboard" className="navbar-brand brand fw-semibold">Student Savings</NavLink>
          <button className="navbar-toggler" type="button" aria-label="Toggle navigation"
            aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="navbar-toggler-icon" />
          </button>
          <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
            <ul className="navbar-nav me-auto">
              {LINKS.map((l) => (
                <li className="nav-item" key={l.to}>
                  <NavLink to={l.to} className="nav-link" onClick={() => setOpen(false)}>{l.label}</NavLink>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center gap-3 pb-2 pb-lg-0">
              <NavLink to="/profile" className="nav-link text-secondary" onClick={() => setOpen(false)}>
                {user.firstName} {user.lastName}
              </NavLink>
              <ThemeToggle />
              <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        <Outlet />
      </main>
    </>
  )
}
