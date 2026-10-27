import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartTheme } from '../utils/chartColors.js'
import { useTheme } from '../theme/ThemeContext.jsx'
import { money, monthLabel } from '../utils/format.js'

const shortMonth = (m) => monthLabel(m).split(' ')[0].slice(0, 3)
const compact = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`)

// Income vs. spending for the last 6 months. Also shows how spending changes over time.
export default function IncomeSpendingChart({ history }) {
  const [showTable, setShowTable] = useState(false)
  const { theme } = useTheme()
  const { chrome: CHROME, series: SERIES, status: STATUS } = chartTheme(theme)

  return (
    <>
      {showTable ? (
        <div className="table-responsive">
          <table className="table table-sm mb-0 tabular">
            <thead>
              <tr><th>Month</th><th className="text-end">Income</th><th className="text-end">Spending</th><th className="text-end">Saved</th></tr>
            </thead>
            <tbody>
              {history.map((h) => {
                const saved = h.income - h.spending
                return (
                  <tr key={h.month}>
                    <td>{monthLabel(h.month)}</td>
                    <td className="text-end">{money(h.income)}</td>
                    <td className="text-end">{money(h.spending)}</td>
                    <td className="text-end" style={{ color: saved < 0 ? STATUS.worse : undefined }}>
                      {saved < 0 ? `−${money(-saved)}` : money(saved)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: 260 }} role="img"
          aria-label="Bar chart of monthly income and spending for the last six months">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHROME.grid} />
              <XAxis dataKey="month" tickFormatter={shortMonth} tickLine={false}
                axisLine={{ stroke: CHROME.grid }} tick={{ fill: CHROME.axis, fontSize: 12 }} />
              <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48}
                tick={{ fill: CHROME.axis, fontSize: 12 }} />
              <Tooltip content={<MonthTooltip series={SERIES} status={STATUS} />} cursor={{ fill: CHROME.cursor }} />
              <Legend verticalAlign="top" align="right" height={28} iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: CHROME.text, fontSize: 13 }}>{v}</span>} />
              <Bar dataKey="income" name="Income" fill={SERIES.income} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              <Bar dataKey="spending" name="Spending" fill={SERIES.spending} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <button type="button" className="btn btn-link btn-sm px-0 mt-1" onClick={() => setShowTable(!showTable)}>
        {showTable ? 'Show as chart' : 'Show as table'}
      </button>
    </>
  )
}

function MonthTooltip({ active, payload, label, series: SERIES, status: STATUS }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const saved = row.income - row.spending
  return (
    <div className="chart-tooltip">
      <div className="fw-semibold mb-1">{monthLabel(label)}</div>
      <div><span className="legend-swatch me-1" style={{ background: SERIES.income }} />Income {money(row.income)}</div>
      <div><span className="legend-swatch me-1" style={{ background: SERIES.spending }} />Spending {money(row.spending)}</div>
      <div className="mt-1" style={{ color: saved < 0 ? STATUS.worse : STATUS.better }}>
        {saved < 0 ? `Overspent ${money(-saved)}` : `Saved ${money(saved)}`}
      </div>
    </div>
  )
}
