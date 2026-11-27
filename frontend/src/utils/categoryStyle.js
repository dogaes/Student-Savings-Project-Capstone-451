import { chartTheme } from './chartColors.js'

// An icon and a color for each spending category, so lists and cards are easy to scan.
// Colors match the dashboard charts. Categories the user makes up get a stable color too.
const ICONS = {
  housing: 'home',
  groceries: 'cart',
  'dining out': 'utensils',
  transportation: 'bus',
  'tuition and books': 'book',
  'loan payments': 'bank',
  entertainment: 'ticket',
  income: 'income',
}

export function categoryIcon(name) {
  return ICONS[String(name).toLowerCase()] ?? 'dots'
}

export function categoryColor(name, theme) {
  const c = chartTheme(theme)
  if (String(name).toLowerCase() === 'income') return c.status.better
  if (String(name).toLowerCase() === 'other') return c.other
  const fixed = c.categoryColor(name)
  if (fixed) return fixed
  // Same made-up name always gets the same color
  let h = 0
  for (const ch of String(name).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const all = [...c.extra.slice(1), ...c.slots]
  return all[h % all.length]
}

/**
 * Colors for a list of categories shown together (like the Budget page), so no two share a color.
 * Default categories keep their usual color; made-up ones get the colors nobody else is using.
 */
export function categoryColors(names, theme) {
  const c = chartTheme(theme)
  const map = {}
  const custom = []
  for (const name of names) {
    const key = String(name).toLowerCase()
    if (key === 'income') map[name] = c.status.better
    else if (key === 'other') map[name] = c.other
    else if (c.categoryColor(name)) map[name] = c.categoryColor(name)
    else custom.push(name)
  }
  const used = new Set(Object.values(map))
  const pool = [...c.extra.slice(1), ...c.slots, ...c.extra].filter((col, i, all) => all.indexOf(col) === i && !used.has(col))
  ;[...custom].sort((a, b) => a.localeCompare(b)).forEach((name, i) => {
    map[name] = pool.length ? pool[i % pool.length] : c.other
  })
  return map
}
