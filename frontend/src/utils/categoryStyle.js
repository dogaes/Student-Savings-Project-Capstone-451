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
  const fixed = c.categoryColor(name)
  if (fixed) return fixed
  // Same made-up name always gets the same color
  let h = 0
  for (const ch of String(name).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return c.slots[h % c.slots.length]
}
