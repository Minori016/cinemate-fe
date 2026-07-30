import { Outlet } from 'react-router-dom'
import { TrendingUp, Film, LayoutGrid, Calendar, Users, User, Ticket, Tag, Settings, ChefHat, ClipboardList } from 'lucide-react'
import Sidebar from './Sidebar'

const navItems = [
  { to: '/manager/analytics', icon: TrendingUp, label: 'Thống kê & Phân tích' },
  { to: '/manager/movies', icon: Film, label: 'Phim' },
  { to: '/manager/cinema-rooms', icon: LayoutGrid, label: 'Phòng chiếu' },
  { to: '/manager/showtimes', icon: Calendar, label: 'Lịch chiếu' },
  { to: '/manager/employees', icon: Users, label: 'Nhân viên' },
  { to: '/manager/members', icon: User, label: 'Thành viên' },
  { to: '/manager/tickets', icon: Ticket, label: 'Quản lý vé' },
  { to: '/manager/promotions', icon: Tag, label: 'Khuyến mãi' },
  { to: '/manager/concessions', icon: ChefHat, label: 'Quản lý đồ ăn' },
  { to: '/manager/system-configs', icon: Settings, label: 'Cấu hình Hệ thống' },
  { to: '/manager/shifts', icon: ClipboardList, label: 'Ca trực nhân viên' },
]

export default function ManagerLayout() {
  return (
    <div className="theme-light flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar navItems={navItems} workspaceLabel="Manager Workspace" />
      <main className="flex-1 min-w-0 overflow-y-auto lg:ml-[260px] pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
