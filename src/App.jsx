import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import VideoIntro from './components/intro/VideoIntro'

// Constants
const INTRO_SEEN_KEY = 'cinemate_intro_seen'

function ScrollToTop() {
  const location = useLocation()
  const { pathname, search } = location

  useEffect(() => {
    window.scrollTo(0, 0)
    const fullPath = pathname + search
    const current = sessionStorage.getItem('currentPath') || '/'
    if (fullPath !== current) {
      sessionStorage.setItem('prevPath', current)
      sessionStorage.setItem('currentPath', fullPath)
    }
  }, [pathname, search])

  return null
}

/**
 * IntroWrapper Component
 * Quản lý việc hiển thị intro video trước khi vào app
 */
function IntroWrapper({ children }) {
  // Dev mode: dùng sessionStorage để tự động clear khi restart dev server
  // Prod mode: dùng localStorage
  const storage = import.meta.env.DEV ? sessionStorage : localStorage

  const [showIntro, setShowIntro] = useState(() => {
    try {
      const seen = storage.getItem(INTRO_SEEN_KEY) === 'true'
      console.log('[IntroWrapper] Initial check - hasSeenIntro:', seen, '| Value:', storage.getItem(INTRO_SEEN_KEY), '| storage:', import.meta.env.DEV ? 'sessionStorage' : 'localStorage')
      return !seen
    } catch {
      console.warn('[IntroWrapper] storage error, showing intro')
      return true
    }
  })

  // Dev mode: auto-clear localStorage flag khi app mount (để đảm bảo luôn hiển thị intro)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const devFlag = localStorage.getItem(INTRO_SEEN_KEY)
      if (devFlag !== null) {
        console.log('[IntroWrapper] DEV mode: Clearing stale localStorage intro flag')
        localStorage.removeItem(INTRO_SEEN_KEY)
      }
    }
  }, [])

  const handleIntroComplete = useCallback(() => {
    console.log('[IntroWrapper] Intro complete, marking as seen')
    const storage = import.meta.env.DEV ? sessionStorage : localStorage
    try {
      storage.setItem(INTRO_SEEN_KEY, 'true')
    } catch {
      console.warn('[IntroWrapper] storage not available')
    }
    setShowIntro(false)
  }, [])

  console.log('[IntroWrapper] Rendering, showIntro:', showIntro, '| introSeen:', storage.getItem(INTRO_SEEN_KEY))

  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        <VideoIntro
          key="intro"
          onComplete={handleIntroComplete}
          videoSrc="/Intro.mp4"
        />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AppContent() {
  const location = useLocation()
  const isDashboard = /^\/(admin|staff|manager)(\/|$)/.test(location.pathname)

  return (
    <AuthProvider>
      <ScrollToTop />
      {/* Padding top để tránh bị navbar che — chỉ áp dụng cho trang user có Navbar */}
      <div style={{ paddingTop: isDashboard ? '0px' : '72px', minHeight: '100vh' }}>
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <IntroWrapper>
        <AppContent />
      </IntroWrapper>
    </BrowserRouter>
  )
}
