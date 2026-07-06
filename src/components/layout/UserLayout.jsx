import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function UserLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
