import Icon from './Icon.jsx'

// Colorful banner at the top of each section page. `tone` picks the section color:
// budget, accounts, loans, goals, or ai. Put buttons/selects in `actions` and stat chips in `children`.
export default function PageHeader({ tone, icon, title, subtitle, actions, children }) {
  return (
    <header className={`page-hero tone-${tone} mb-4`}>
      <div className="d-flex flex-wrap align-items-center gap-3">
        <div className="hero-icon"><Icon name={icon} size={26} /></div>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <h1 className="hero-title">{title}</h1>
          {subtitle && <p className="hero-sub mb-0">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex flex-wrap align-items-end gap-2">{actions}</div>}
      </div>
      {children && <div className="hero-stats">{children}</div>}
    </header>
  )
}

/** A small stat box for the header: label on top, big value below. */
export function HeroStat({ label, value, note, tone }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat-label">{label}</div>
      <div className={`hero-stat-value ${tone ? `text-${tone}` : ''}`}>{value}</div>
      {note && <div className="hero-stat-note">{note}</div>}
    </div>
  )
}
