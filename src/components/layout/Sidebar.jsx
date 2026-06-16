import { NavLink, Link } from 'react-router-dom'
import { Film, Users, User, LayoutGrid, Tag, Ticket, BarChart2, LogOut, Home } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

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
    <aside className="w-60 min-h-screen flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)]">
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <h1 className="text-2xl text-red-500" style={{fontFamily:'Montserrat, sans-serif', fontWeight: 900}}>🎬 CineStar</h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Management System</p>
      </div>
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {adminLinks.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all ${
                isActive ? 'bg-red-600 text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-white'
              }`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
        
        {/* Đường phân cách */}
        <div className="h-px bg-[var(--color-border)] my-2" />
        
        {/* Nút quay lại trang chủ */}
        <Link 
          to="/" 
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-white transition-all"
        >
          <Home size={16} /> Quay lại trang chủ
        </Link>
      </nav>
      <div className="px-3 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Admin</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-sm text-[var(--color-text-muted)] hover:text-red-400 transition-colors rounded hover:bg-[var(--color-surface-2)]">
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </aside>
  )
}
