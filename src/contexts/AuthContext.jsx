import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Tài khoản test
const MOCK_USERS = [
  { username: 'admin', password: 'admin123', role: 'ADMIN' },
  { username: 'member', password: 'member123', role: 'MEMBER' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    setLoading(true)
    try {
      // Giả lập delay API
      await new Promise((r) => setTimeout(r, 800))

      const found = MOCK_USERS.find(
        (u) => u.username === username && u.password === password
      )
      if (!found) throw new Error('Invalid credentials')

      const userData = { username: found.username, role: found.role }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)