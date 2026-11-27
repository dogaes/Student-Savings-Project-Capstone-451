import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Icon from './ui/Icon.jsx'

/**
 * The user's name in the top bar. Hovering (or clicking, or tabbing to it) opens a panel
 * with Profile & settings, Help & support, and Sign out.
 */
export default function ProfileMenu({ user, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const closeTimer = useRef(null)
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  // A short delay before closing, so moving the mouse from the name to the panel doesn't close it
  const show = () => { clearTimeout(closeTimer.current); setOpen(true) }
  const hideSoon = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpen(false), 150) }
  const close = () => { clearTimeout(closeTimer.current); setOpen(false) }

  // Escape or a click outside closes it
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') close() }
    const onClick = (e) => { if (!wrapRef.current?.contains(e.target)) close() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [open])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const go = () => { close(); onNavigate?.() }

  return (
    <div className="profile-menu" ref={wrapRef} onMouseEnter={show} onMouseLeave={hideSoon}
      onBlur={(e) => { if (!wrapRef.current?.contains(e.relatedTarget)) close() }}>
      <button type="button" className="profile-trigger" aria-haspopup="true" aria-expanded={open}
        aria-controls="profile-panel" onClick={() => (open ? close() : show())}>
        <span className="profile-avatar" aria-hidden="true">{initials}</span>
        <span className="d-none d-xl-inline">{user.firstName}</span>
        <Icon name="chevron" size={16} />
      </button>

      {open && (
        <div className="profile-panel" id="profile-panel">
          <div className="d-flex align-items-center gap-2 pb-3 mb-2 border-bottom">
            <span className="profile-avatar lg" aria-hidden="true">{initials}</span>
            <div style={{ minWidth: 0 }}>
              <div className="fw-semibold text-truncate">{user.firstName} {user.lastName}</div>
              <div className="small text-muted text-truncate">@{user.username}</div>
            </div>
          </div>
          <NavLink to="/profile" className="panel-link" onClick={go}>
            <Icon name="user" size={18} /><span>Profile &amp; settings<small>Name, contact info, password</small></span>
          </NavLink>
          <NavLink to="/help" className="panel-link" onClick={go}>
            <Icon name="help" size={18} /><span>Help &amp; support<small>Answers to common questions</small></span>
          </NavLink>
          <button type="button" className="panel-link danger" onClick={() => { close(); onSignOut() }}>
            <Icon name="logout" size={18} /><span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  )
}
