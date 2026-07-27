import { Outlet } from 'react-router-dom'
import { TrendingUp, Calendar, Users, FileText } from 'lucide-react'
import Sidebar from './Sidebar'

const navItems = [
  { to: '/manager/analytics', icon: TrendingUp, label: 'Thống kê & Phân tích' },
  { to: '/manager/showtimes', icon: Calendar, label: 'Quản lý lịch chiếu' },
  { to: '/manager/shifts', icon: Users, label: 'Ca trực nhân viên' },
  { to: '/manager/tickets', icon: FileText, label: 'Quản lý đặt vé' },
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
