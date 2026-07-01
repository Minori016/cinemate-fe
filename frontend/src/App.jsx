import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { Toaster } from 'sonner'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import VideoIntro from './components/intro/VideoIntro'

const INTRO_SEEN_KEY = 'cinemate_intro_seen'

function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    const fullPath = location.pathname + location.search
    const current = sessionStorage.getItem('currentPath') || '/'
    if (fullPath !== current) {
      sessionStorage.setItem('prevPath', current)
      sessionStorage.setItem('currentPath', fullPath)
    }
  }, [location.pathname, location.search])
  return null
}

function IntroWrapper({ children }) {
  const storage = import.meta.env.DEV ? sessionStorage : localStorage
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return storage.getItem(INTRO_SEEN_KEY) !== 'true'
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (import.meta.env.DEV) {
      const devFlag = localStorage.getItem(INTRO_SEEN_KEY)
      if (devFlag !== null) localStorage.removeItem(INTRO_SEEN_KEY)
    }
  }, [])

  const handleIntroComplete = useCallback(() => {
    try {
      storage.setItem(INTRO_SEEN_KEY, 'true')
    } catch { /* ignore */ }
    setShowIntro(false)
  }, [storage])

  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        <VideoIntro key="intro" onComplete={handleIntroComplete} videoSrc="/Intro.mp4" />
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
      <div
        style={{
          paddingTop: isDashboard ? '0px' : '72px',
          minHeight: '100vh',
        }}
      >
        <AppRoutes />
      </div>
      <Toaster richColors closeButton position="top-right" />
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
