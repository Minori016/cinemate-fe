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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Khôi phục session từ localStorage khi app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      // BE wrap introspect response trong ApiResponse: { code, result: { valid } }
      authService.introspect(token)
        .then((res) => {
          const valid = res.data?.result?.valid ?? res.data?.valid
          if (valid) {
            setUser(JSON.parse(savedUser))
          } else {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
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