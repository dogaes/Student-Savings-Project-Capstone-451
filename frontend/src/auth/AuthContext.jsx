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

  const login = async (usernameOrEmail, password) => {
    const u = await api('/auth/login', { method: 'POST', body: { usernameOrEmail, password } })
    setUser(u)
    return u
  }

  const register = async (form) => {
    const u = await api('/auth/register', { method: 'POST', body: form })
    setUser(u)
    return u
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  // Used by the Profile page after a save, so the name in the top menu updates right away.
  const updateUser = (changes) => setUser((u) => ({ ...u, ...changes }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)