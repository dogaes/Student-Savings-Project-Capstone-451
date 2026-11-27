import { useTheme } from './ThemeContext.jsx'

// Sliding on/off switch for dark mode.
export default function ThemeToggle({ id = 'dark-mode-switch', className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <div className={`form-check form-switch theme-switch mb-0 ${className}`}>
      <input className="form-check-input" type="checkbox" role="switch" id={id}
        checked={dark} onChange={toggle} />
      <label className="form-check-label small" htmlFor={id}>Dark mode</label>
    </div>
  )
}
