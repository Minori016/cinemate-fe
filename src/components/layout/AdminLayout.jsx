import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  return (
    <div className="theme-light flex min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-[var(--color-background)]">
        <Outlet />
      </main>
    </div>
  )
}
