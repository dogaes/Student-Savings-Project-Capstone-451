// FABRICATED sample data (BR-001). The dashboard reads from here until the budget,
// account, loan, and goal APIs exist. Then useDashboardData() will call the API instead.
export const SAMPLE_MONTHS = {
    '2026-10': {
      income: 1850.0,
      categories: [
        { name: 'Housing', budget: 700.0, spent: 700.0, lastMonth: 700.0 },
        { name: 'Groceries', budget: 250.0, spent: 272.18, lastMonth: 231.4 },
        { name: 'Dining Out', budget: 60.0, spent: 100.0, lastMonth: 58.25 },
        { name: 'Transportation', budget: 80.0, spent: 46.5, lastMonth: 71.0 },
        { name: 'Tuition and Books', budget: 150.0, spent: 89.99, lastMonth: 312.0 },
        { name: 'Loan Payments', budget: 62.0, spent: 62.0, lastMonth: 62.0 },
        { name: 'Entertainment', budget: 40.0, spent: 18.0, lastMonth: 35.5 },
      ],
      transactions: [
        { date: '2026-10-11', description: 'Campus Market', category: 'Groceries', account: 'Student Card', amount: -42.18 },
        { date: '2026-10-10', description: 'Pizza night', category: 'Dining Out', account: 'Student Card', amount: -38.5 },
        { date: '2026-10-09', description: 'Bus pass', category: 'Transportation', account: 'Campus Checking', amount: -46.5 },
        { date: '2026-10-08', description: 'Part-time job paycheck', category: 'Income', account: 'Campus Checking', amount: 925.0 },
        { date: '2026-10-05', description: 'Fed Unsub Loan A payment', category: 'Loan Payments', account: 'Campus Checking', amount: -62.0 },
      ],
    },
    '2026-09': {
      income: 1850.0,
      categories: [
        { name: 'Housing', budget: 700.0, spent: 700.0, lastMonth: 700.0 },
        { name: 'Groceries', budget: 250.0, spent: 231.4, lastMonth: 244.1 },
        { name: 'Dining Out', budget: 60.0, spent: 58.25, lastMonth: 80.0 },
        { name: 'Transportation', budget: 80.0, spent: 71.0, lastMonth: 66.0 },
        { name: 'Tuition and Books', budget: 300.0, spent: 312.0, lastMonth: 0.0 },
        { name: 'Loan Payments', budget: 62.0, spent: 62.0, lastMonth: 62.0 },
        { name: 'Entertainment', budget: 40.0, spent: 35.5, lastMonth: 22.0 },
      ],
      transactions: [
        { date: '2026-09-28', description: 'Campus Market', category: 'Groceries', account: 'Student Card', amount: -51.02 },
        { date: '2026-09-22', description: 'Movie tickets', category: 'Entertainment', account: 'Student Card', amount: -24.0 },
        { date: '2026-09-15', description: 'Textbooks', category: 'Tuition and Books', account: 'Campus Checking', amount: -312.0 },
        { date: '2026-09-08', description: 'Part-time job paycheck', category: 'Income', account: 'Campus Checking', amount: 925.0 },
        { date: '2026-09-05', description: 'Fed Unsub Loan A payment', category: 'Loan Payments', account: 'Campus Checking', amount: -62.0 },
      ],
    },
  }
  
  export const SAMPLE_ACCOUNTS = [
    { name: 'Campus Checking', type: 'Checking', balance: 1243.37 },
    { name: 'Rainy Day Savings', type: 'Savings', balance: 600.0 },
    { name: 'Student Card', type: 'Credit card', balance: -150.0 },
  ]
  
  export const SAMPLE_LOANS = {
    totalBalance: 9467.93,
    next: { name: 'Fed Unsub Loan A', amount: 62.0, dueDate: '2026-11-05' },
  }
  
  export const SAMPLE_GOALS = [
    { name: 'Spring break trip', saved: 150.0, target: 600.0, targetDate: '2027-03-01' },
    { name: 'Emergency fund', saved: 600.0, target: 1000.0, targetDate: '2027-05-31' },
  ]

// Six months of FABRICATED totals for the "Income vs. spending" chart.
// September and October match the category totals above.
export const SAMPLE_HISTORY = [
  { month: '2026-05', income: 1700.0, spending: 1640.2 },
  { month: '2026-06', income: 1700.0, spending: 1395.8 },
  { month: '2026-07', income: 1750.0, spending: 1510.35 },
  { month: '2026-08', income: 1800.0, spending: 1902.9 },
  { month: '2026-09', income: 1850.0, spending: 1470.15 },
  { month: '2026-10', income: 1850.0, spending: 1288.67 },
]