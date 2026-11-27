import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

// Help & support: answers to common questions, grouped by topic, with a search box.
const TOPICS = [
  { key: 'start', label: 'Getting started', icon: 'flag' },
  { key: 'budget', label: 'Budget', icon: 'pie' },
  { key: 'accounts', label: 'Accounts', icon: 'wallet' },
  { key: 'loans', label: 'Loans', icon: 'grad' },
  { key: 'goals', label: 'Goals', icon: 'target' },
  { key: 'ai', label: 'AI Assistant', icon: 'sparkles' },
  { key: 'security', label: 'Account & privacy', icon: 'shield' },
]

const FAQS = [
  { topic: 'start', q: 'Is any of this real money?',
    a: 'No. Student Savings is a practice tool. Everything you enter is made up, and nothing connects to a real bank. Never enter real account numbers, card numbers, or passwords.' },
  { topic: 'start', q: 'Where should I start?',
    a: 'Add an account on the Accounts page (a checking account is a good start), record a few transactions, then set monthly limits on the Budget page. The Dashboard fills in as you go.' },
  { topic: 'start', q: 'Is there a test account with sample data?',
    a: 'Yes. Sign in with username "admin" and password "admin1234" to see six months of sample data. It resets every time the server restarts, so use your own account for anything you want to keep.' },
  { topic: 'start', q: 'How do I switch to dark mode?',
    a: 'Use the Dark mode switch in the top bar. Your choice is remembered on this browser.' },
  { topic: 'budget', q: 'How is "spent" calculated for a budget category?',
    a: 'It adds up that month\'s spending transactions whose category matches the budget name, for example every "Groceries" transaction. Category names are not case-sensitive.' },
  { topic: 'budget', q: 'Why can\'t I pick some months in the dropdown?',
    a: 'The month list only shows months that have data, plus the current month. Add a transaction or budget for an older month and it will appear.' },
  { topic: 'budget', q: 'Can I reuse last month\'s budget?',
    a: 'Yes. On the Budget page, click "Copy [last month]\'s budget". It copies every category you don\'t already have this month.' },
  { topic: 'accounts', q: 'How do I see every transaction for one account?',
    a: 'Click the account\'s card on the Accounts page. A side panel opens with all of its transactions, grouped by month.' },
  { topic: 'accounts', q: 'Why does my credit card show "amount owed"?',
    a: 'Credit card balances are money you owe, so they lower your net total. Enter the amount you owed when you added the card, and spending on the card increases it.' },
  { topic: 'accounts', q: 'What happens when I delete an account?',
    a: 'The account and all of its transactions are deleted for good. This can\'t be undone.' },
  { topic: 'loans', q: 'How is the payoff date estimated?',
    a: 'Each month, interest is added (balance × APR ÷ 12) and your monthly payment is subtracted, until the balance reaches $0. If the payment doesn\'t cover the interest, we warn you that the loan would never be paid off.' },
  { topic: 'loans', q: 'Why is the due date tag red?',
    a: 'A payment due in 10 days or less turns red so you don\'t miss it.' },
  { topic: 'goals', q: 'How do I add money to a goal?',
    a: 'Use the +$10, +$25, or +$50 buttons on the goal card, or type another amount and click "Add money".' },
  { topic: 'goals', q: 'What does the monthly plan mean?',
    a: 'It\'s how much you\'d need to save each month to reach the goal by its target date.' },
  { topic: 'ai', q: 'How many questions can I ask the AI Assistant?',
    a: 'Up to 20 AI requests per day, including monthly summaries. The limit resets the next day.' },
  { topic: 'ai', q: 'Is the AI giving financial advice?',
    a: 'No. Answers are general education only. For real financial decisions, talk to a qualified professional or your school\'s financial aid office.' },
  { topic: 'ai', q: 'What does the AI know about me?',
    a: 'Only totals from your budget and spending, such as category amounts. It never sees your name, email, or password.' },
  { topic: 'security', q: 'Why was I signed out?',
    a: 'For safety, you\'re signed out after 10 minutes without activity. Just sign in again.' },
  { topic: 'security', q: 'How do I change my password or delete my account?',
    a: 'Open your name in the top bar, then Profile & settings. You can update your details, change your password, or permanently delete your account there.' },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const q = query.trim().toLowerCase()
  const shown = FAQS.filter((f) => (topic === 'all' || f.topic === topic)
    && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)))

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <PageHeader tone="help" icon="help" title="Help & support" subtitle="Find answers fast, or ask the AI Assistant.">
          <div className="hero-search" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="help-search" className="visually-hidden">Search help</label>
            <Icon name="help" size={18} />
            <input id="help-search" type="search" className="form-control" placeholder="Search questions, like “budget” or “password”"
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </PageHeader>

        <div className="seg mb-3 flex-wrap tone-help" role="group" aria-label="Topic">
          <button type="button" aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All topics</button>
          {TOPICS.map((t) => (
            <button key={t.key} type="button" aria-pressed={topic === t.key} onClick={() => setTopic(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className="fun-card mb-4">
          <div className="card-body">
            {shown.length === 0 && (
              <p className="text-muted mb-0">No answers match “{query}”. Try another word, or ask the AI Assistant.</p>
            )}
            {shown.map((f) => {
              const t = TOPICS.find((x) => x.key === f.topic)
              return (
                <details className="faq" key={f.q}>
                  <summary>
                    <span className="faq-icon"><Icon name={t.icon} size={16} /></span>
                    <span className="flex-grow-1">{f.q}</span>
                    <Icon name="chevron" size={18} className="faq-chevron" />
                  </summary>
                  <p className="faq-answer">{f.a}</p>
                </details>
              )
            })}
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="fun-card h-100 tone-ai"><div className="card-body">
              <div className="cat-icon mb-2" style={{ '--cat': 'var(--tone)' }}><Icon name="sparkles" /></div>
              <h2 className="h6 fw-bold">Still have a question?</h2>
              <p className="small text-muted">The AI Assistant can explain budgeting, saving, and student loans in plain language.</p>
              <Link to="/assistant" className="btn btn-tone btn-sm">Ask the AI Assistant</Link>
            </div></div>
          </div>
          <div className="col-md-6">
            <div className="fun-card h-100 tone-help"><div className="card-body">
              <div className="cat-icon mb-2" style={{ '--cat': 'var(--tone)' }}><Icon name="mail" /></div>
              <h2 className="h6 fw-bold">Found a bug?</h2>
              <p className="small text-muted mb-0">
                Student Savings is a CS 451 capstone project by Team Ninja Penguins. Let the team know what happened,
                what page you were on, and what you expected to see.
              </p>
            </div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
