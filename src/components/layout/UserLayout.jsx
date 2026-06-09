import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <Outlet />
    </div>
  )
}
