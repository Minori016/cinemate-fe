import { NavLink, Link } from 'react-router-dom'
import { Film, Users, User, LayoutGrid, Tag, Ticket, BarChart2, LogOut, Home } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import logoImg from '../../assets/Cinematelogo.png'

const adminLinks = [
  { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
  { to: '/admin/movies', icon: Film, label: 'Phim' },
  { to: '/admin/cinema-rooms', icon: LayoutGrid, label: 'Phòng chiếu' },
  { to: '/admin/employees', icon: Users, label: 'Nhân viên' },
  { to: '/admin/members', icon: User, label: 'Thành viên' },
  { to: '/admin/tickets', icon: Ticket, label: 'Quản lý vé' },
  { to: '/admin/promotions', icon: Tag, label: 'Khuyến mãi' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="w-64 min-h-screen flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-xl font-black tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <span className="text-white">CINE</span>
              <span className="text-[var(--color-primary)]">MATE</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
              Admin Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
        {adminLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-[rgba(229,9,20,0.25)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

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
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold shadow-md">
            {user?.email?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
              {user?.email ? user.email.split('@')[0] : user?.username}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
              Quản trị viên
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/10 border border-red-500/10 hover:border-red-500/30 rounded-xl transition-all duration-200"
        >
          <LogOut size={14} />
          Đăng xuất hệ thống
        </button>
      </div>
    </aside>
  )
}
