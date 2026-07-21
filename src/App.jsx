import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { Toaster } from 'sonner'
import { useEffect } from 'react'

function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    const fullPath = location.pathname + location.search
    const current = sessionStorage.getItem('currentPath') || '/'
    if (fullPath !== current) {
      sessionStorage.setItem('prevPath', current)
      sessionStorage.setItem('currentPath', fullPath)
    }
  }, [location.pathname, location.search])
  return null
}

function AppContent() {
  const location = useLocation()
  const isDashboard = /^\/(admin|staff|manager)(\/|$)/.test(location.pathname)

  return (
    <AuthProvider>
      <ScrollToTop />
      <div
        style={{
          paddingTop: isDashboard ? '0px' : '72px',
          minHeight: '100vh',
        }}
      >
        <AppRoutes />
      </div>
      <Toaster richColors closeButton position="top-right" />
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
