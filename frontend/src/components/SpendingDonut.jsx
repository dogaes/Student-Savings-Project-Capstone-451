import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { chartTheme } from '../utils/chartColors.js'
import { money } from '../utils/format.js'
import { useTheme } from '../theme/ThemeContext.jsx'

// Spending by category as a donut. Shows the 5 biggest categories; the rest are grouped
// as "Other" so the chart stays readable. Default categories always keep the same color.
export default function SpendingDonut({ categories }) {
  const { theme } = useTheme()
  const c = chartTheme(theme)

  const withSpending = categories.filter((x) => x.spent > 0)
  const total = withSpending.reduce((s, x) => s + x.spent, 0)
  if (total === 0) {
    return <p className="text-muted small mb-0">No spending recorded for this month yet.</p>
  }

  const top = [...withSpending].sort((a, b) => b.spent - a.spent).slice(0, 5)
  const otherTotal = total - top.reduce((s, x) => s + x.spent, 0)

  // Fixed colors first; custom categories get the slots that are still free (alphabetical, so it's stable).
  const used = new Set(top.map((x) => c.categoryColor(x.name)).filter(Boolean))
  const free = c.slots.filter((s) => !used.has(s))
  const custom = top.filter((x) => !c.categoryColor(x.name)).map((x) => x.name).sort()
  const colorOf = (name) => c.categoryColor(name) ?? free[custom.indexOf(name)] ?? c.other

  const slices = top.map((x) => ({ name: x.name, value: x.spent, color: colorOf(x.name) }))
  if (otherTotal > 0.004) slices.push({ name: 'Other', value: otherTotal, color: c.other })

  const pct = (v) => `${Math.round((v / total) * 100)}%`

  return (
    <div className="row align-items-center g-3">
      <div className="col-sm-5">
        <div style={{ position: 'relative', height: 220 }}
          role="img" aria-label={`Spending by category, total ${money(total)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%"
                startAngle={90} endAngle={-270} stroke={c.chrome.surface} strokeWidth={2} isAnimationActive={false}>
                {slices.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip content={<DonutTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <div className="small text-muted">Total spent</div>
            <div className="fw-semibold">{money(total)}</div>
          </div>
        </div>
      </div>
      <div className="col-sm-7">
        {/* Legend doubles as the data table: every slice's name, amount, and share. */}
        <ul className="list-unstyled mb-0 small">
          {slices.map((s) => (
            <li key={s.name} className="d-flex align-items-center py-1">
              <span className="legend-swatch me-2" style={{ background: s.color }} aria-hidden="true" />
              <span className="flex-grow-1">{s.name}</span>
              <span className="text-muted me-2">{pct(s.value)}</span>
              <span className="fw-medium tabular">{money(s.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DonutTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="chart-tooltip">
      <div className="fw-semibold">{name}</div>
      <div>{money(value)} · {Math.round((value / total) * 100)}%</div>
    </div>
  )
}
