// Chart colors for light and dark mode. Both sets were checked for color-blind safety
// with a palette validator (dark mode against the dark card color #212529).
// Each category always keeps the same color, no matter which month is shown.
const PALETTES = {
  light: {
    slots: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6'],
    extra: ['#0891b2', '#8c5a2b'], // cyan, brown: for categories beyond the first six
    other: '#b4b2ab',
    status: { worse: '#d03b3b', better: '#006300' },
    chrome: { grid: '#e1e0d9', axis: '#898781', text: '#52514e', surface: '#ffffff', cursor: 'rgba(11,11,11,0.04)' },
  },
  dark: {
    slots: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#9085e9'],
    extra: ['#22b8d6', '#b07a45'],
    other: '#6b6a65',
    status: { worse: '#ff6b6b', better: '#3ccf3c' },
    chrome: { grid: '#343a40', axis: '#9a9890', text: '#c3c2b7', surface: '#212529', cursor: 'rgba(255,255,255,0.06)' },
  },
}

// The default categories (BR-007) always get the same color, and no two share one.
// The first six use the main slots; Entertainment uses the first extra color.
const FIXED = ['Housing', 'Groceries', 'Dining Out', 'Transportation', 'Tuition and Books', 'Loan Payments', 'Entertainment']

export function chartTheme(theme) {
  const p = PALETTES[theme] ?? PALETTES.light
  return {
    ...p,
    series: { income: p.slots[0], spending: p.slots[1] },
    /** Color for a category name, or null if it should be grouped into "Other". */
    categoryColor: (name) => {
      const i = FIXED.findIndex((f) => f.toLowerCase() === String(name).toLowerCase())
      if (i < 0) return null
      return i < p.slots.length ? p.slots[i] : p.extra[i - p.slots.length]
    },
    slotForCustom: (index) => p.slots[index % p.slots.length],
  }
}
