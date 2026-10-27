import { useTheme } from './ThemeContext.jsx'

// Moon / sun button that switches between light and dark mode.
export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button type="button" className={`btn btn-outline-secondary btn-sm theme-toggle ${className}`} onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  )
}
