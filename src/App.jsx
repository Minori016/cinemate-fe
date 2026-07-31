import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#070707] text-white">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi hệ thống</h2>
          <p className="text-sm text-gray-400 max-w-md mb-3">
            Giao diện không thể tải được thành phần này. Vui lòng quay lại trang chủ hoặc thử lại sau.
          </p>
          {this.state.error && (
            <pre className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg max-w-xl overflow-x-auto text-left mb-6 font-mono border border-red-500/20">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/home'
            }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer border-none"
          >
            Về Trang Chủ
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
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
      <ErrorBoundary><AppContent /></ErrorBoundary>
    </BrowserRouter>
  )
}
