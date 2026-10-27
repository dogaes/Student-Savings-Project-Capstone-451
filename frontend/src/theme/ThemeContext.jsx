import { createContext, useContext, useEffect, useState } from 'react'

// Light / dark mode. The choice is "light", "dark", or "system" (follow the computer's setting).
// It's saved in this browser only, and Bootstrap switches colors via data-bs-theme on <html>.
const ThemeContext = createContext(null)
const KEY = 'theme'

const readChoice = () => {
  try {
    return localStorage.getItem(KEY) || 'system'
  } catch {
    return 'system'
  }
}

const systemPrefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(readChoice)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // Follow the computer's setting live when the choice is "system"
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return undefined
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const theme = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  const choose = (c) => {
    setChoice(c)
    try {
      localStorage.setItem(KEY, c)
    } catch {
      // Private browsing can block storage; the choice still works until refresh.
    }
  }

  const toggle = () => choose(theme === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, choice, choose, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
