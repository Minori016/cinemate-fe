import { Outlet, useLocation } from 'react-router-dom'
import { LayoutGrid, Armchair, Ticket, ShoppingBag, FileText } from 'lucide-react'
import Sidebar from './Sidebar'

const NAV_ITEMS = [
  { to: '/staff/overview', icon: LayoutGrid, label: 'Tổng quan & Lịch chiếu' },
  { to: '/staff/ticketing', icon: Armchair, label: 'Bán vé tại quầy' },
  { to: '/staff/checkin', icon: Ticket, label: 'Soát vé nhanh' },
  { to: '/staff/concessions', icon: ShoppingBag, label: 'Quầy bắp nước' },
  { to: '/staff/tickets', icon: FileText, label: 'Quản lý đặt vé' },
]

export default function StaffLayout() {
  const location = useLocation()

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    active: item.to === '/staff/tickets'
      ? location.pathname.includes('/staff/tickets')
      : location.pathname === item.to,
  }))

  return (
    <div className="theme-light flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar navItems={navItems} workspaceLabel="Staff Workspace" />
      <main className="flex-1 min-w-0 overflow-y-auto lg:ml-[260px] pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
