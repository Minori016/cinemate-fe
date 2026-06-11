import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '40px', color: 'var(--color-primary)' }}>progress_activity</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && !hasRole(role)) return <Navigate to="/" replace />
  return children
}
