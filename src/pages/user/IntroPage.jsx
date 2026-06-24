import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function IntroPage() {
  const videoRef = useRef(null)
  const navigate = useNavigate()

  const goToHome = () => {
    localStorage.setItem('introSeen', 'true')
    navigate('/home', { replace: true })
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener('ended', goToHome)
    video.addEventListener('error', goToHome)

    return () => {
      video.removeEventListener('ended', goToHome)
      video.removeEventListener('error', goToHome)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <video
        ref={videoRef}
        src="/Intro.mp4"
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <button
        onClick={goToHome}
        className="absolute bottom-8 right-8 text-white bg-white/20
                   hover:bg-white/40 transition px-4 py-2 rounded-full
                   text-sm backdrop-blur-sm"
      >
        Bỏ qua ▶
      </button>
    </div>
  )
}