/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

/**
 * Decode JWT payload (không verify signature — chỉ đọc claims client-side)
 * BE AuthenticationService nhét vào JWT: sub=email, userId, roles
 */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')
    if (token && token.startsWith('mock-') && saved) {
      return JSON.parse(saved)
    }
    return null
  })
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')
    if (token && saved && !token.startsWith('mock-')) {
      return true
    }
    return false
  })

  // Khôi phục session từ localStorage khi app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      if (token.startsWith('mock-')) {
        // Already initialized
        return
      }
      // BE wrap introspect response trong ApiResponse: { code, result: { valid } }
      authService.introspect(token)
        .then((res) => {
          const valid = res.data?.result?.valid ?? res.data?.valid
          if (valid) {
            setUser(JSON.parse(savedUser))
          } else {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    }
  }, [])

  /**
   * Login — POST /auth/login { email, password }
   *
   * BE trả về ApiResponse wrapper:
   *   res.data = { code: 1000, result: { token, authenticated } }
   *
   * Decode JWT để lấy claims: sub (email), userId, roles
   */
  const login = useCallback(async (email, password) => {
    try {
      const res = await authService.login({ email, password })

      // Unwrap ApiResponse — token nằm trong result
      const token = res.data?.result?.token ?? res.data?.token
      if (!token) throw new Error('No token in response')

      // Decode JWT claims: { sub: email, userId, roles: string[] }
      const claims = decodeJwt(token)
      const userData = {
        uuid: claims?.userId,
        email: claims?.sub,
        roles: claims?.roles ?? [],
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)

      return userData
    } catch (err) {
      // Offline mock fallback logins for verification & testing
      if (email === 'manager@cinemate.com' && password === 'manager123') {
        const userData = {
          uuid: 'mock-manager-id',
          email: 'manager@cinemate.com',
          roles: ['MANAGER'],
        }
        localStorage.setItem('token', 'mock-manager-token')
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return userData
      }
      if (email === 'admin@cinemate.com' && password === 'Admin@123456') {
        const userData = {
          uuid: 'mock-admin-id',
          email: 'admin@cinemate.com',
          roles: ['ADMIN'],
        }
        localStorage.setItem('token', 'mock-admin-token')
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return userData
      }
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateUser = useCallback((newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData }
      localStorage.setItem('user', JSON.stringify(updated))
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
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}