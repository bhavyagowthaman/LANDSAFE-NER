import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, setToken, clearToken, hasToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!hasToken()) { setLoading(false); return }
    try {
      const u = await api.getUser()
      setUser(u)
    } catch (e) {
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const res = await api.login({ email, password })
    setToken(res.token)
    setUser(res.user)
    return res
  }

  const register = async (payload) => {
    const res = await api.register(payload)
    setToken(res.token)
    setUser(res.user)
    return res
  }

  const logout = async () => {
    try { await api.logout() } catch (e) { /* ignore */ }
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
