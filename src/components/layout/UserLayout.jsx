import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}
