// Built-in answers used when the AI service isn't available (FR-AI-005).
// Each entry matches if the question contains any of its keywords.
// General education only — not financial advice (BR-009).
const FAQ = [
    {
      keywords: ['subsidized', 'unsubsidized'],
      answer:
        'Both are federal student loans. With a subsidized loan, the government pays the interest while you are in school at least half-time and during grace periods. With an unsubsidized loan, interest starts adding up right away, even while you are in school. If you can, paying the interest on an unsubsidized loan while in school keeps your balance from growing.',
    },
    {
      keywords: ['apr', 'interest rate', 'interest'],
      answer:
        'APR (annual percentage rate) is the yearly cost of borrowing. Each month, interest is roughly your balance × APR ÷ 12. For example, $5,000 at 6% APR adds about $25 of interest a month. Paying more than the minimum lowers the balance faster, so less interest builds up.',
    },
    {
      keywords: ['grocer', 'food', 'eat', 'dining', 'restaurant'],
      answer:
        'A few ways to spend less on food: plan meals for the week and shop with a list, buy store brands, cook in batches, and set a weekly dining-out limit. Check your Groceries and Dining Out bars on the dashboard each week so you notice early if you are getting close to your limit.',
    },
    {
      keywords: ['budget', '50/30/20', 'plan my money'],
      answer:
        'A simple starting point is the 50/30/20 rule: about 50% of income for needs (rent, groceries, transportation), 30% for wants (dining out, entertainment), and 20% for savings and extra debt payments. Adjust the numbers to fit your situation, then set your category limits on the Budget page.',
    },
    {
      keywords: ['credit card', 'credit score', 'minimum payment'],
      answer:
        'Paying your credit card balance in full each month avoids interest. If you can only pay part, pay more than the minimum: the minimum mostly covers interest, so the balance shrinks very slowly. Keeping your balance well below your credit limit is also a good habit.',
    },
    {
      keywords: ['emergency', 'rainy day'],
      answer:
        'An emergency fund covers surprises like a car repair or medical bill so you do not have to borrow. A common first goal for students is $500 to $1,000, then building toward 3 months of expenses over time. You can track it as a savings goal on the Goals page.',
    },
    {
      keywords: ['save', 'saving', 'goal'],
      answer:
        'To reach a savings goal, divide what you still need by the number of months until your target date. That is how much to set aside each month. Moving it to savings right after you get paid ("pay yourself first") makes it much easier to stick to.',
    },
    {
      keywords: ['loan', 'pay off', 'payoff', 'debt'],
      answer:
        'To pay off loans faster, pay more than the minimum when you can and put the extra toward the loan with the highest interest rate first. Even small extra payments reduce the total interest you pay over the life of the loan.',
    },
  ]
  
  const DEFAULT_ANSWER =
    'I can help with budgeting, spending, saving goals, student loans, and credit card basics. Try asking something like "How can I spend less on groceries?" or "What is the difference between subsidized and unsubsidized loans?"'
  
  export function fallbackAnswer(question) {
    const q = question.toLowerCase()
    const match = FAQ.find((item) => item.keywords.some((k) => q.includes(k)))
    return match ? match.answer : DEFAULT_ANSWER
  }
  
  export const SUGGESTED_QUESTIONS = [
    'What is the difference between subsidized and unsubsidized loans?',
    'How can I spend less on groceries?',
    'How should I split my monthly budget?',
    'How does APR work on a loan?',
  ]
  