import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On page load, ask the server whether a session already exists.
  useEffect(() => {
    api('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Sign in, step 1: username/email + password. The server answers { twoFactorRequired, sentTo }
  // and texts a code (simulated). Nobody is signed in until verifyCode succeeds.
  const login = async (usernameOrEmail, password) =>
    api('/auth/login', { method: 'POST', body: { usernameOrEmail, password } })

  // Sign in, step 2: the 6-digit code from the text message
  const verifyCode = async (code) => {
    const u = await api('/auth/verify-code', { method: 'POST', body: { code } })
    setUser(u)
    return u
  }

  const resendCode = () => api('/auth/resend-code', { method: 'POST' })

  // Creates the account, then signs out right away so the person signs in themselves
  // on the login page (the server starts a session when it registers someone).
  const register = async (form) => {
    const u = await api('/auth/register', { method: 'POST', body: form })
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      // Not signed in anyway; nothing to do
    }
    setUser(null)
    return u
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  // Used by the Profile page after a save, so the name in the top menu updates right away.
  const updateUser = (changes) => setUser((u) => ({ ...u, ...changes }))

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyCode, resendCode, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
