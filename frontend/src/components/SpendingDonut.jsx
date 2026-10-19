import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CATEGORY_COLORS, OTHER_COLOR } from '../utils/chartColors.js'
import { money } from '../utils/format.js'

// Spending by category as a donut. Shows the 5 biggest categories that have a
// fixed color; everything else is grouped as "Other" so the chart stays readable.
export default function SpendingDonut({ categories }) {
  const total = categories.reduce((s, c) => s + c.spent, 0)
  const sorted = [...categories].filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent)

  const slices = []
  let other = 0
  for (const c of sorted) {
    if (slices.length < 5 && CATEGORY_COLORS[c.name]) {
      slices.push({ name: c.name, value: c.spent, color: CATEGORY_COLORS[c.name] })
    } else {
      other += c.spent
    }
  }
  if (other > 0) slices.push({ name: 'Other', value: other, color: OTHER_COLOR })

  const pct = (v) => `${Math.round((v / total) * 100)}%`

  return (
    <div className="row align-items-center g-3">
      <div className="col-sm-5">
        <div style={{ position: 'relative', height: 220 }}
          role="img" aria-label={`Spending by category, total ${money(total)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%"
                startAngle={90} endAngle={-270} stroke="#ffffff" strokeWidth={2} isAnimationActive={false}>
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
