import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'

export default function UserLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const isHome = location.pathname === '/home' || location.pathname === '/'
  const isMovieDetail = /^\/movies\/[^/]+$/.test(location.pathname)

  // Show back button on all user subpages except home and movie detail
  const showBackButton = !isHome && !isMovieDetail

  const getContainerClass = () => {
    const path = location.pathname
    if (path === '/showtimes') return 'w-full max-w-5xl mx-auto px-6 pt-6 pb-2'
    if (path === '/about') return 'w-full max-w-5xl mx-auto px-4 md:px-8 pt-6 pb-2'
    return 'w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2'
  }

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--color-background)' }}>
      <div className="w-full flex flex-col">
        <Navbar />
        <main className="w-full flex-grow">
          {showBackButton && (
            <div className={getContainerClass()}>
              <motion.button
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10 active:scale-95 cursor-pointer border border-white/20 text-white bg-white/5 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={14} className="text-red-500 font-bold" />
                <span>Quay lại trang chủ</span>
              </motion.button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

