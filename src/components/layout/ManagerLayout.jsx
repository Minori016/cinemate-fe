import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { TrendingUp, Calendar, Users, FileText, LogOut, Home } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function ManagerLayout({ children }) {
  const { user, logout } = useAuth()
  const [searchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'analytics'
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isTicketsPage = window.location.pathname.includes('/manager/tickets')

  const navItems = [
    { id: 'analytics', label: 'Thống kê & Phân tích', icon: TrendingUp, to: '/manager/dashboard?tab=analytics', active: !isTicketsPage && currentTab === 'analytics' },
    { id: 'showtimes', label: 'Quản lý lịch chiếu', icon: Calendar, to: '/manager/dashboard?tab=showtimes', active: !isTicketsPage && currentTab === 'showtimes' },
    { id: 'shifts', label: 'Ca trực nhân viên', icon: Users, to: '/manager/dashboard?tab=shifts', active: !isTicketsPage && currentTab === 'shifts' },
    { id: 'list', label: 'Quản lý đặt vé', icon: FileText, to: '/manager/tickets', active: isTicketsPage },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-white">
      {/* Manager Sidebar */}
      <aside className="w-64 min-h-screen flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="text-xl font-black tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <span className="text-white">CINE</span>
                <span className="text-[var(--color-primary)]">MATE</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
                Manager Workspace
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-[rgba(147,51,234,0.25)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-[var(--color-text-muted)]'} />
                {item.label}
              </Link>
            )
          })}

          <div className="h-px bg-[var(--color-border)] my-4" />

          {/* Home Link */}
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-white transition-all duration-200"
          >
            <Home size={18} />
            Quay lại Trang chủ
          </Link>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-[var(--color-border)] bg-color-mix(in srgb, var(--color-surface-container) 40%, transparent)">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shadow-md">
              {user?.email?.[0]?.toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                {user?.email?.split('@')[0]}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                Quản lý
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/10 border border-red-500/10 hover:border-red-500/30 rounded-xl transition-all duration-200"
          >
            <LogOut size={14} />
            Đăng xuất hệ thống
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto" style={{ backgroundColor: 'var(--color-background)' }}>
        {children}
      </main>
    </div>
  )
}
