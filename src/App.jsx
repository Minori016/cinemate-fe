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
  const [showIntro, setShowIntro] = useState(() => {
    try {
      const seen = localStorage.getItem(INTRO_SEEN_KEY) === 'true'
      console.log('[IntroWrapper] Initial check - hasSeenIntro:', seen, '| Value:', localStorage.getItem(INTRO_SEEN_KEY))
      return !seen
    } catch {
      console.warn('[IntroWrapper] localStorage error, showing intro')
      return true
    }
  })

  const handleIntroComplete = useCallback(() => {
    console.log('[IntroWrapper] Intro complete, marking as seen')
    try {
      localStorage.setItem(INTRO_SEEN_KEY, 'true')
    } catch (e) {
      console.warn('[IntroWrapper] localStorage not available')
    }
    setShowIntro(false)
  }, [])

  console.log('[IntroWrapper] Rendering, showIntro:', showIntro, '| introSeen:', localStorage.getItem(INTRO_SEEN_KEY))

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

export default function App() {
  return (
    <BrowserRouter>
      <IntroWrapper>
        <ScrollToTop />
        <AuthProvider>
          {/* Padding top để tránh bị navbar che (72px expanded, 56px scrolled) */}
          <div style={{ paddingTop: '72px', minHeight: '100vh' }}>
            <AppRoutes />
          </div>
        </AuthProvider>
      </IntroWrapper>
    </BrowserRouter>
  )
}
