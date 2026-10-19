// Chart colors. Checked for color-blind safety with a palette validator.
// Each category always keeps the same color, no matter which month is shown.
export const CATEGORY_COLORS = {
    Housing: '#2a78d6',            // blue
    Groceries: '#eb6834',          // orange
    'Dining Out': '#1baf7a',       // aqua
    Transportation: '#eda100',     // yellow
    'Tuition and Books': '#e87ba4', // magenta
    'Loan Payments': '#6250d6',    // violet
  }
  export const OTHER_COLOR = '#b4b2ab' // gray for "Other"
  
  export const SERIES = { income: '#2a78d6', spending: '#eb6834' }
  
  // Up/down arrows: spending more is bad (red), spending less is good (green)
  export const STATUS = { worse: '#d03b3b', better: '#006300' }
  
  export const CHROME = { grid: '#e1e0d9', axis: '#898781', text: '#52514e' }