/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { clearSession, getSession, isActiveToken, saveSession } from '../services/sessionStorage'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function getUserFromToken(token) {
  const claims = decodeJwt(token)
  if (!claims?.sub || !Array.isArray(claims.roles)) return null

  return {
    uuid: claims.userId,
    email: claims.sub,
    roles: claims.roles,
    isFirstLogin: Boolean(claims.isFirstLogin),
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    let disposed = false

    if (!session?.token) {
      setLoading(false)
      return () => { disposed = true }
    }

    const { token } = session
    const userFromToken = getUserFromToken(token)
    if (!userFromToken) {
      if (isActiveToken(token)) clearSession()
      setLoading(false)
      return () => { disposed = true }
    }

    authService.introspect(token)
      .then((response) => {
        if (disposed || !isActiveToken(token)) return
        const valid = response.data?.result?.valid ?? response.data?.valid
        if (valid) {
          setUser(userFromToken)
        } else {
          clearSession()
          setUser(null)
        }
      })
      .catch(() => {
        if (disposed || !isActiveToken(token)) return
        clearSession()
        setUser(null)
      })
      .finally(() => {
        if (!disposed && isActiveToken(token)) setLoading(false)
      })

    return () => { disposed = true }
  }, [])

  const login = useCallback(async (email, password, remember = false) => {
    const response = await authService.login({ email, password })
    const token = response.data?.result?.token ?? response.data?.token
    const userData = token && getUserFromToken(token)

    if (!userData) {
      throw new Error('Invalid authentication response')
    }

    saveSession(token, userData, remember)
    setUser(userData)
    setLoading(false)
    return userData
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateUser = useCallback((newData) => {
    setUser((previous) => {
      const updated = { ...previous, ...newData }
      const session = getSession()
      if (session?.token) {
        saveSession(session.token, updated, sessionStorage.getItem('token') !== null ? false : true)
      }
      return updated
    })
  }, [])

  const hasRole = useCallback((role) => {
    return Array.isArray(user?.roles) && user.roles.includes(role)
  }, [user])

  const isAdmin = hasRole('ADMIN')
  const isMember = hasRole('MEMBER')

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, hasRole, isAdmin, isMember }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
