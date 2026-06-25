import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

// Constants
const INTRO_SEEN_KEY = 'cinemate_intro_seen'

/**
 * VideoIntro Component
 * Cinematic fullscreen intro video với skip + CTA overlay
 */
export default function VideoIntro({
  videoSrc = '/Intro.mp4',
  onComplete,
  onExplore,
  onBuyTicket,
  skipButtonText = 'SKIP INTRO',
  showProgress = true,
  minDisplayTime = 3000
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const [isDismissed, setIsDismissed] = useState(false)
  const [showCTA, setShowCTA] = useState(false)
  const [showSkip, setShowSkip] = useState(true)
  const [progress, setProgress] = useState(0)
  const [canSkip, setCanSkip] = useState(false)
  const [needsManualPlay, setNeedsManualPlay] = useState(false)

  const markIntroSeen = useCallback(() => {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, 'true')
    } catch (e) {
      console.warn('[VideoIntro] localStorage not available')
    }
  }, [])

  // Auto-play video on mount
  useEffect(() => {
    console.log('[VideoIntro] Mounted, starting autoplay...')
    const video = videoRef.current
    if (!video) {
      console.warn('[VideoIntro] No video element found')
      return
    }

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[VideoIntro] Autoplay successful')
          setTimeout(() => setCanSkip(true), minDisplayTime)
        })
        .catch((err) => {
          console.warn('[VideoIntro] Autoplay blocked:', err)
          setNeedsManualPlay(true)
          setTimeout(() => setCanSkip(true), minDisplayTime)
        })
    }

    const skipTimeout = setTimeout(() => setShowSkip(false), 3000)
    return () => clearTimeout(skipTimeout)
  }, [minDisplayTime])

  // Manual play handler
  const handleManualPlay = () => {
    const video = videoRef.current
    if (video) {
      video.play()
        .then(() => {
          setNeedsManualPlay(false)
        })
        .catch(err => console.error('[VideoIntro] Manual play failed:', err))
    }
  }

  // Track video progress + handle end
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress(video.currentTime / video.duration)
      }
    }

    const handleEnded = () => {
      console.log('[VideoIntro] Video ended')
      markIntroSeen()
      setShowCTA(true)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [markIntroSeen])

  // Skip video handler
  const handleSkip = useCallback(() => {
    if (!canSkip) return
    const video = videoRef.current
    if (video) video.pause()
    markIntroSeen()
    setShowCTA(true)
  }, [canSkip, markIntroSeen])

  // Fallback timer - auto-show CTA sau 15s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showCTA) {
        console.log('[VideoIntro] Fallback: showing CTA after timeout')
        markIntroSeen()
        setShowCTA(true)
      }
    }, 15000)

    return () => clearTimeout(timer)
  }, [showCTA, markIntroSeen])

  const handleExplore = useCallback(() => {
    setIsDismissed(true)
    if (onExplore) onExplore()
    else if (onComplete) onComplete()
  }, [onExplore, onComplete])

  const handleBuyTicket = useCallback(() => {
    setIsDismissed(true)
    // Set flag for HomePage to handle scroll after mount
    sessionStorage.setItem('intro_scroll_to_booking', 'true')
    if (onBuyTicket) onBuyTicket()
    else if (onComplete) onComplete()
  }, [onBuyTicket, onComplete])

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] bg-black"
          style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
        >
          {/* Fullscreen Video */}
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              transform: 'translateZ(0)'
            }}
            muted
            playsInline
            autoPlay
          />

          {/* Manual play button if autoplay blocked */}
          {needsManualPlay && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleManualPlay}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
            >
              <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </motion.button>
          )}

          {/* Cinematic Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)'
            }}
          />

          {/* Logo */}
          <div className="absolute top-8 left-8 z-20 pointer-events-none">
            <h1
              className="text-2xl font-black tracking-widest"
              style={{
                color: '#ffffff',
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 2px 20px rgba(229, 9, 20, 0.5)'
              }}
            >
              CINE<span style={{ color: '#e50914' }}>MATE</span>
            </h1>
          </div>

          {/* Skip Button */}
          <AnimatePresence>
            {showSkip && canSkip && !showCTA && (
              <motion.button
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onClick={handleSkip}
                className="absolute top-6 right-6 z-50 px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-white/80 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 hover:text-white transition-all duration-300"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {skipButtonText}
              </motion.button>
            )}
          </AnimatePresence>

          {/* CTA Overlay */}
          <AnimatePresence>
            {showCTA && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-end"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 45%, transparent 100%)',
                  paddingBottom: '10vh'
                }}
              >
                {/* Eyebrow text */}
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  style={{
                    color: '#e50914',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    marginBottom: '12px'
                  }}
                >
                  Bắt đầu hành trình của bạn
                </motion.p>

                {/* Headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.55 }}
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 900,
                    fontSize: 'clamp(24px, 4vw, 38px)',
                    color: '#ffffff',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    marginBottom: '10px',
                    letterSpacing: '1px'
                  }}
                >
                  Rạp chiếu phim<br />trong tầm tay bạn
                </motion.h2>

                {/* Subtext */}
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    marginBottom: '32px',
                    letterSpacing: '0.5px'
                  }}
                >
                  Hàng nghìn bộ phim đang chờ đón bạn
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                  {/* Khám phá ngay — primary */}
                  <button
                    onClick={handleExplore}
                    style={{
                      background: '#e50914',
                      color: '#fff',
                      border: 'none',
                      padding: '14px 32px',
                      borderRadius: '4px',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(229,9,20,0.55)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    ▶ Khám phá ngay
                  </button>

                  {/* Mua vé ngay — secondary */}
                  <button
                    onClick={handleBuyTicket}
                    style={{
                      background: 'transparent',
                      color: '#fff',
                      border: '1.5px solid rgba(255,255,255,0.45)',
                      padding: '14px 32px',
                      borderRadius: '4px',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                      transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    Mua vé ngay
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          {showProgress && !showCTA && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10" style={{ transformOrigin: 'left' }}>
              <motion.div
                className="h-full"
                style={{
                  background: 'linear-gradient(90deg, #e50914, #ff4444)',
                  transform: `scaleX(${progress})`,
                  transformOrigin: 'left',
                  willChange: 'transform'
                }}
              />
            </div>
          )}

          {/* Click-to-skip zone */}
          {canSkip && !showCTA && (
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={handleSkip}
              style={{ zIndex: 10 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
