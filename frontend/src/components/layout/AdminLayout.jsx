import { Outlet } from 'react-router-dom'
import { BarChart2, Film, LayoutGrid, Calendar, Users, User, Ticket, Tag } from 'lucide-react'
import Sidebar from './Sidebar'

const navItems = [
  { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
  { to: '/admin/movies', icon: Film, label: 'Phim' },
  { to: '/admin/cinema-rooms', icon: LayoutGrid, label: 'Phòng chiếu' },
  { to: '/admin/showtimes', icon: Calendar, label: 'Lịch chiếu' },
  { to: '/admin/employees', icon: Users, label: 'Nhân viên' },
  { to: '/admin/members', icon: User, label: 'Thành viên' },
  { to: '/admin/tickets', icon: Ticket, label: 'Quản lý vé' },
  { to: '/admin/promotions', icon: Tag, label: 'Khuyến mãi' },
]

export default function AdminLayout() {
  return (
    <div className="theme-light flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar navItems={navItems} workspaceLabel="Admin Workspace" />
      <main className="flex-1 min-w-0 overflow-y-auto" style={{ marginLeft: '260px' }}>
        <div className="p-8 lg:p-10 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
