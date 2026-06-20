import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { useEffect } from 'react'

function ScrollToTop() {
  const location = useLocation()
  const { pathname, search } = location

  useEffect(() => {
    window.scrollTo(0, 0)
    const fullPath = pathname + search
    const current = sessionStorage.getItem('currentPath') || '/'
    if (fullPath !== current) {
      sessionStorage.setItem('prevPath', current)
      sessionStorage.setItem('currentPath', fullPath)
    }
  }, [pathname, search])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
