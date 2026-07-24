import { Outlet } from 'react-router-dom'
import { BarChart2, Film, LayoutGrid, Calendar, Users, User, Ticket, Tag, Settings, ChefHat } from 'lucide-react'
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
  { to: '/admin/concessions', icon: ChefHat, label: 'Quản lý đồ ăn' },
  { to: '/admin/system-configs', icon: Settings, label: 'Cấu hình Hệ thống' },
]

export default function AdminLayout() {
  return (
    <div className="theme-light flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar navItems={navItems} workspaceLabel="Admin Workspace" />
      <main className="flex-1 min-w-0 overflow-y-auto lg:ml-[260px] pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
