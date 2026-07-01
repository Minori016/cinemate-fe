import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { movieService } from '../../services/movieService'
import { useAuth } from '../../contexts/AuthContext'
import {
  Search, LogOut, User, Settings, ChevronDown, Bell, X, Menu,
  Clock, Globe, MessageSquare, MapPin, Phone, Calendar,
  Star, Crown, Ticket, Zap, Users, ArrowRight, ChevronLeft, ChevronRight, Play, Check, Info, Gift
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import gsap from 'gsap'
import MovieCard from '../../components/common/MovieCard'
import Badge from '../../components/common/Badge'
import TrailerModal from './components/moviedetail/TrailerModal'
import MovieArcCarousel3D from '../../components/common/MovieArcCarousel3D'
import YouTube from 'react-youtube'


// ── Constants ──────────────────────────────────────────────────
const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop'
const DEFAULT_POSTER_SMALL = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'

// ── Static Data ────────────────────────────────────────────────
const PROMOTIONS = [
  { id: 1, tag: 'HOT', tagColor: '#e50914', title: 'Happy Monday — Đồng Giá 45K', desc: 'Ưu đãi đồng giá vé 2D chỉ 45.000đ cho mọi thành viên vào mỗi ngày Thứ Hai hàng tuần.', date: 'Mỗi Thứ Hai', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700' },
  { id: 2, tag: 'MỚI', tagColor: '#2563eb', title: 'Khai Trương CineMate Thủ Đức', desc: 'Giảm 50% bắp nước khi mua kèm 2 vé tại chi nhánh Thủ Đức.', date: 'Đến 30/06/2026', img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=700' },
  { id: 3, tag: 'VIP', tagColor: '#d97706', title: 'Hội Viên Vàng — Tích Điểm Đôi', desc: 'Tích lũy điểm thành viên gấp đôi và nhận thêm bắp nước miễn phí vào tháng sinh nhật.', date: 'Chương trình thường niên', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=700' },
  { id: 4, tag: 'COMBO', tagColor: '#16a34a', title: 'Combo Cuối Tuần — Tiết Kiệm 30%', desc: 'Mua combo 2 vé + 2 bắp lớn + 2 nước vào Thứ 7 & Chủ Nhật, tiết kiệm đến 30%.', date: 'Thứ 7 & Chủ Nhật', img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=700' },
]

const CINEMAS = [
  { id: 1, name: 'CineMate Quận 1', badge: 'CHI NHÁNH TỔNG', badgeColor: '#d97706', address: '135 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', phone: '1900 1234', rooms: 10, screens: ['2D', '3D', 'IMAX', '4DX'], img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800' },
  { id: 2, name: 'CineMate Bình Thạnh', badge: null, badgeColor: null, address: '156 Xo Vìt Nghệ Tĩnh, Phường 26, Quận Bình Thạnh, TP. Hồ Chí Minh', phone: '1900 1235', rooms: 8, screens: ['2D', '3D', '4DX'], img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800' },
  { id: 3, name: 'CineMate Gò Vấp', badge: null, badgeColor: null, address: '12 Quang Trung, Phường 10, Quận Gò Vấp, TP. Hồ Chí Minh', phone: '1900 1236', rooms: 6, screens: ['2D', '3D'], img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800' },
  { id: 4, name: 'CineMate Thủ Đức', badge: null, badgeColor: null, address: 'Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh', phone: '1900 1237', rooms: 7, screens: ['2D', '3D', 'IMAX'], img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=800' },
]

const MEMBER_PERKS = [
  { icon: Ticket, title: 'Vé Ưu Đãi', desc: 'Giảm đến 30% vé mọi suất chiếu trong tuần' },
  { icon: Star, title: 'Tích Điểm', desc: 'Đổi điểm lấy vé, bắp nước & quà tặng hấp dẫn' },
  { icon: Crown, title: 'Ghế Ưu Tiên', desc: 'Đặt ghế VIP trước 48 giờ so với khách thường' },
  { icon: Gift, title: 'Quà Sinh Nhật', desc: 'Combo vé + bắp miễn phí vào tháng sinh nhật' },
  { icon: Users, title: 'Cộng Đồng', desc: 'Tham gia club & các sự kiện chiếu phim riêng' },
  { icon: Zap, title: 'Flash Sale', desc: 'Nhận thông báo ưu đãi chớp nhoáng sớm nhất' },
]

// ── Helpers ─────────────────────────────────────────────────────
const getEmbedUrl = (url) => {
  if (!url) return ''
  if (url.includes('youtube.com/embed/')) return url
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`
  return url
}

const getYoutubeVideoId = (url) => {
  if (!url) return ''
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  if (match && match[2].length === 11) return match[2]
  if (url.includes('embed/')) {
    const parts = url.split('embed/')
    const id = parts[parts.length - 1]?.split('?')[0]
    if (id && id.length === 11) return id
  }
  return ''
}

const getRatingColor = (rating) => {
  if (rating === 'T18') return '#dc2626'
  if (rating === 'T16') return '#ef4444'
  if (rating === 'T13') return '#f97316'
  return '#16a34a'
}

const handleImageError = (e, fallback = DEFAULT_POSTER_SMALL) => {
  if (!e.target.src.includes('No Image') && !e.target.src.includes('w=400') && !e.target.src.includes('w=120')) {
    e.target.src = fallback
  }
}

const BannerMedia = ({ movie, shouldPlayVideo }) => {
  const videoId = getYoutubeVideoId(movie.trailerUrl)
  const defaultPoster = movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop'
  
  const [thumbUrl, setThumbUrl] = useState(() => {
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    return defaultPoster
  })

  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const playerRef = useRef(null)

  // Reset states when movie changes
  useEffect(() => {
    setIsVideoPlaying(false)
    if (videoId) {
      setThumbUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
    } else {
      setThumbUrl(defaultPoster)
    }
  }, [movie.id, videoId, defaultPoster])

  // Explicit cleanup: destroy player when component is no longer active or unmounted
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy()
          }
        } catch (err) {
          console.warn('Error destroying YouTube player:', err)
        }
        playerRef.current = null
      }
    }
  }, [shouldPlayVideo])

  const handleThumbError = () => {
    if (videoId && thumbUrl.includes('maxresdefault')) {
      setThumbUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
    } else {
      setThumbUrl(defaultPoster)
    }
  }

  const onReady = (event) => {
    playerRef.current = event.target
    try {
      const levels = event.target.getAvailableQualityLevels()
      if (levels.includes('hd1080')) {
        event.target.setPlaybackQuality('hd1080')
      } else if (levels.includes('hd720')) {
        event.target.setPlaybackQuality('hd720')
      } else {
        event.target.setPlaybackQuality('default')
      }
    } catch (err) {
      console.warn('Error setting YouTube playback quality:', err)
    }
    event.target.playVideo()
  }

  const onStateChange = (event) => {
    const PLAYING_STATE = window.YT?.PlayerState?.PLAYING ?? 1
    if (event.data === PLAYING_STATE) {
      setIsVideoPlaying(true)
    }
  }

  return (
    <motion.div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none bg-gradient-to-br from-red-950/60 to-gray-900"
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 10, ease: 'linear' }}
      style={{ pointerEvents: 'none' }}
    >
      {shouldPlayVideo && videoId && (
        <motion.div
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVideoPlaying ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <YouTube
            videoId={videoId}
            className="homepage-banner-video-wrapper w-full h-full"
            iframeClassName="homepage-banner-video-iframe"
            opts={{
              playerVars: {
                autoplay: 1,
                mute: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                loop: 1,
                playlist: videoId,
                disablekb: 1,
                playsinline: 1,
              }
            }}
            onReady={onReady}
            onStateChange={onStateChange}
          />
        </motion.div>
      )}

      <motion.img
        src={thumbUrl}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.6] saturate-[1.1] contrast-[1.1] z-10"
        initial={{ opacity: 1 }}
        animate={{ opacity: isVideoPlaying ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ pointerEvents: 'none' }}
        onError={handleThumbError}
      />
    </motion.div>
  )
}

// ── Quick Booking: 7 ngày tới ──────────────────────────────────
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return {
    date: d.toISOString().slice(0, 10),
    label: d.getDate(),
    day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
  }
})

/* ── Custom Select dùng cho Quick Booking ── */
function CustomSelect({ value, onChange, options, placeholder, disabled, error, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="flex flex-col gap-2 relative w-full text-left" ref={containerRef}>
      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl py-3 px-4 outline-none text-xs text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none text-left h-[44px]"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${error ? '#ef4444' : isOpen ? '#e50914' : 'rgba(255,255,255,0.13)'}`,
          boxShadow: isOpen ? '0 0 12px rgba(229,9,20,0.25)' : 'none',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span className="truncate font-medium" style={{ color: selectedOption ? '#fff' : 'rgba(255,255,255,0.4)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', color: 'rgba(255,255,255,0.5)' }} />
      </button>
      {error && <span className="text-[10px] text-red-400 font-semibold absolute top-[calc(100%+4px)] left-0 z-10">{error}</span>}
      {isOpen && !disabled && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] w-full rounded-xl z-50 max-h-60 overflow-y-auto"
          style={{
            background: 'rgba(18,12,12,0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            padding: '6px 0',
          }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500 italic">Không có lựa chọn nào</div>
          ) : (
            options.map(opt => {
              const isSelected = opt.value === value
              return (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false) }}
                  className="px-4 py-2.5 text-xs text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between font-medium"
                  style={{
                    backgroundColor: isSelected ? 'rgba(229,9,20,0.18)' : 'transparent',
                    color: isSelected ? '#e50914' : 'inherit',
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-sm font-bold" style={{ color: '#e50914' }} />}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const location = useLocation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false)

  useEffect(() => {
    setShouldPlayVideo(false)
    const timer = setTimeout(() => {
      setShouldPlayVideo(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [currentBannerIndex])

  const [isHoveringBanner, setIsHoveringBanner] = useState(false)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState(null)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  // State to track if we should scroll from intro
  const [shouldScrollFromIntro, setShouldScrollFromIntro] = useState(false)

  // Debug: Log component mount and location
  console.log('🏠 HomePage rendering. Path:', location.pathname, 'Movies count:', movies.length)

  // ── Quick Booking state ────────────────────────────────────────
  const [bookingMovieId, setBookingMovieId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingErrors, setBookingErrors] = useState({ movie: '', date: '', time: '' })

  const getAvailableDates = () => {
    if (!bookingMovieId) return []
    const movie = movies.find(m => m.id?.toString() === bookingMovieId)
    if (!movie) return []
    const charCodeSum = movie.id.toString().split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const numDays = (charCodeSum % 5) + 3
    return DAYS.slice(0, numDays).map(d => d.date)
  }

  const getAvailableTimes = () => {
    if (!bookingMovieId || !bookingDate) return []
    if (!getAvailableDates().includes(bookingDate)) return []
    const SCHEDULE_TEMPLATES = [
      ['08:30', '11:15', '14:00', '16:45', '19:30', '22:15'],
      ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'],
      ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'],
      ['10:15', '13:00', '16:45', '19:30', '22:15'],
      ['11:00', '14:30', '18:00', '20:30', '22:30'],
    ]
    const movie = movies.find(m => m.id?.toString() === bookingMovieId)
    if (!movie) return []
    const idx = movies.indexOf(movie)
    return movie.showtimes?.map(st => new Date(st.startTime).toTimeString().slice(0, 5)) ||
      SCHEDULE_TEMPLATES[idx % SCHEDULE_TEMPLATES.length]
  }

  const handleQuickBook = (e) => {
    e.preventDefault()
    const newErrors = { movie: '', date: '', time: '' }
    let valid = true
    if (!bookingMovieId) { newErrors.movie = 'Vui lòng chọn phim'; valid = false }
    if (!bookingDate) { newErrors.date = 'Vui lòng chọn ngày'; valid = false }
    if (!bookingTime) { newErrors.time = 'Vui lòng chọn giờ'; valid = false }
    setBookingErrors(newErrors)
    if (valid) navigate(`/movies/${bookingMovieId}?date=${bookingDate}&time=${bookingTime}`)
  }
  // ─────────────────────────────────────────────────────────────

  // Lấy tối đa 6 phim đầu làm banner
  const bannerMovies = movies.slice(0, 6)

  // Tự động lướt banner mỗi 5 giây
  useEffect(() => {
    if (isHoveringBanner || bannerMovies.length === 0) return
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % bannerMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isHoveringBanner, bannerMovies.length])

  useEffect(() => {
    setCurrentBannerIndex(0)
  }, [movies.length])

  const isHomePage = ['/', '/home'].includes(location.pathname)

  const slideLeft = () => {
    setCurrentIndex(prev => Math.max(0, prev - 4))
  }
  const slideRight = () => {
    setCurrentIndex(prev => {
      if (prev + 4 >= movies.length) return 0
      return prev + 4
    })
  }

  useEffect(() => {
    console.log('🔍 Fetching movies...')
    movieService.getAll()
      .then(r => {
        console.log('✅ API Response:', r.data)
        const moviesData = r.data || []
        console.log('🎬 Movies to set:', moviesData.map(m => ({
          id: m.id,
          titleVn: m.titleVn,
          posterUrl: m.posterUrl,
          posterUrlType: typeof m.posterUrl,
          posterUrlLength: m.posterUrl?.length
        })))
        setMovies(moviesData)
      })
      .catch(err => {
        console.error('❌ Error fetching movies:', err)
        setMovies([])
      })

    // Check if we need to scroll from intro
    const shouldScroll = sessionStorage.getItem('intro_scroll_to_booking')
    if (shouldScroll === 'true') {
      // Clear the flag
      sessionStorage.removeItem('intro_scroll_to_booking')
      setShouldScrollFromIntro(true)
    }
  }, [])

  // Handle scroll after movies loaded and component rendered
  useEffect(() => {
    if (shouldScrollFromIntro) {
      setShouldScrollFromIntro(false)
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToQuickBooking()
      }, 300)
    }
  }, [shouldScrollFromIntro])

  const getRatingColor = (rating) => {
    if (rating === 'T18') return '#dc2626'
    if (rating === 'T16') return '#ef4444'
    if (rating === 'T13') return '#f97316'
    return '#16a34a'
  }

  const scrollToQuickBooking = (movieId) => {
    // Chọn phim nếu có movieId
    if (movieId) {
      setBookingMovieId(movieId?.toString() || '')
      setBookingDate('')
      setBookingTime('')
      setBookingErrors({ movie: '', date: '', time: '' })
    }

    // Delay scroll để đảm bảo trang đã render xong sau khi intro đóng
    setTimeout(() => {
      const element = document.getElementById('quick-booking')
      if (element) {
        const offset = 20 // thêm một chút padding
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - offset
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  return (
    <motion.div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {isHomePage && (
        <>
          {/* ===== CINEMATIC MOVIE BANNER ===== */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: 'clamp(600px, 80vh, 840px)' }}
            onMouseEnter={() => setIsHoveringBanner(true)}
            onMouseLeave={() => setIsHoveringBanner(false)}
          >
            {/* Skeleton khi chưa load */}
            {bannerMovies.length === 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
            )}

            <AnimatePresence mode="sync">
              {bannerMovies.map((movie, index) => {
                if (index !== currentBannerIndex) return null
                const posterUrl = movie.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop'
                const detailLink = `/movies/${movie.id}`

                return (
                  <motion.div
                    key={movie.id}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  >
                    {/* Backdrop with cinematic zoom - Dynamic thumbnail/YouTube trailer player */}
                    <BannerMedia movie={movie} shouldPlayVideo={shouldPlayVideo} />

                    {/* Dark Vignette / Recessed Gradients */}
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        background: 'radial-gradient(circle at center, transparent 30%, rgba(5,5,10,0.2) 90%), linear-gradient(105deg, rgba(5,5,10,0.25) 0%, rgba(5,5,10,0.15) 40%, transparent 70%, rgba(5,5,10,0.2) 100%)',
                      }}
                    />

                    {/* Top fade */}
                    <div
                      className="absolute top-0 left-0 right-0 h-28 z-10 pointer-events-none"
                      style={{ background: 'linear-gradient(to bottom, var(--color-background) 0%, transparent 100%)' }}
                    />

                    {/* Bottom fade into background */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[300px] z-10 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, var(--color-background), transparent)' }}
                    />

                    {/* Nội dung */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-between pt-11 pb-24 h-full">

                      {/* Top part: Left Info & Right Poster */}
                      <div className="w-full max-w-7xl mx-auto px-6 md:px-14 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-14 flex-grow animate-fade-in">

                        {/* Text Info - Left Column */}
                        <motion.div
                          className="flex flex-col gap-4 text-white flex-1 text-left"
                          initial={{ opacity: 0, y: 28 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.65, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          {/* Genre tags */}
                          <div className="flex flex-wrap gap-2">
                            {movie.genres?.slice(0, 3).map(g => (
                              <span
                                key={g.name}
                                className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border"
                                style={{
                                  color: '#e50914',
                                  borderColor: 'rgba(229,9,20,0.4)',
                                  backgroundColor: 'rgba(229,9,20,0.12)',
                                }}
                              >
                                {g.name}
                              </span>
                            ))}
                            {movie.version && (
                              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-white/20 bg-white/8 text-white/70">
                                {movie.version}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h1
                            style={{
                              fontFamily: 'Montserrat, sans-serif',
                              fontSize: 'clamp(28px, 3.8vw, 48px)',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '0.01em',
                              textShadow: '0 4px 28px rgba(0,0,0,0.85)',
                              lineHeight: 1.1,
                              margin: 0,
                            }}
                          >
                            {movie.title || ''}
                          </h1>

                          {/* Meta */}
                          <div
                            className="flex flex-wrap items-center gap-3.5 text-sm"
                            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}
                          >
                            {movie.durationMinutes && (
                              <span className="flex items-center gap-1.5 font-medium">
                                <Clock size={14} className="text-red-500" />
                                {movie.durationMinutes} phút
                              </span>
                            )}
                            {movie.language && (
                              <span className="flex items-center gap-1.5 font-medium">
                                <MessageSquare size={14} className="text-red-500" />
                                {movie.language}
                              </span>
                            )}
                            {movie.countries?.length > 0 && (
                              <span className="flex items-center gap-1.5 font-medium">
                                <Globe size={14} className="text-red-500" />
                                {movie.countries.map(c => c.name).join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Synopsis */}
                          {movie.description && (
                            <p
                              className="text-sm leading-relaxed line-clamp-3 max-w-xl"
                              style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', margin: '4px 0 8px 0' }}
                            >
                              {movie.description}
                            </p>
                          )}

                          {/* Movie Action Buttons (Trailer & Detail & Booking on mobile) */}
                          <div className="flex flex-wrap gap-3 mt-2">
                            <Link
                              to={detailLink}
                              className="flex lg:hidden items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                              style={{ fontFamily: 'Montserrat, sans-serif', boxShadow: '0 4px 14px rgba(229,9,20,0.4)' }}
                              onClick={(e) => {
                                e.preventDefault()
                                scrollToQuickBooking(movie.id)
                              }}
                            >
                              <Ticket size={16} className="font-bold" />
                              <span>Đặt Vé Ngay</span>
                            </Link>
                            {movie.trailerUrl && (
                              <button
                                onClick={() => {
                                  setSelectedTrailerMovie(movie)
                                  setIsTrailerOpen(true)
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              >
                                <Play size={16} className="font-bold" />
                                <span>Xem Trailer</span>
                              </button>
                            )}
                            <Link
                              to={detailLink}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white border border-red-500/25 bg-red-500/5 hover:bg-red-500/15 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              <Info size={16} className="font-bold" />
                              <span>Chi Tiết</span>
                            </Link>
                          </div>
                        </motion.div>

                        {/* Booking & Poster Area - Right Column */}
                        <motion.div
                          className="flex-shrink-0 hidden lg:block"
                          initial={{ opacity: 0, scale: 0.92, x: 30 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ duration: 0.65, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          <div
                            className="flex flex-col items-center bg-black/35 p-5 rounded-3xl border border-white/8 backdrop-blur-md"
                            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.85)' }}
                          >
                            <div className="relative w-[220px] bg-gray-900" style={{ aspectRatio: '2/3' }}>
                              <img
                                src={posterUrl}
                                alt={movie.title || ''}
                                className="w-full h-full object-cover rounded-2xl"
                                style={{
                                  boxShadow: '0 16px 36px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)',
                                }}
                                onError={handleImageError}
                              />
                              {/* Rating badge */}
                              <div
                                className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-white text-[10px] font-black uppercase shadow-lg"
                                style={{ backgroundColor: getRatingColor(movie.rating || 'K') }}
                              >
                                {movie.rating || 'K'}
                              </div>
                              {/* Shine effect */}
                              <div
                                className="absolute inset-0 rounded-2xl pointer-events-none"
                                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)' }}
                              />
                            </div>

                            <motion.div
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Link
                                to={detailLink}
                                className="mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all duration-200 w-[220px] cursor-pointer"
                                style={{
                                  background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                                  boxShadow: '0 6px 20px rgba(229,9,20,0.4)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  fontFamily: 'Montserrat, sans-serif',
                                }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  scrollToQuickBooking(movie.id)
                                }}
                              >
                                <Ticket size={14} className="text-sm font-bold" />
                                <span>Đặt Vé Ngay</span>
                              </Link>
                            </motion.div>
                          </div>
                        </motion.div>

                      </div>

                      {/* Bottom horizontal selection strip (User's Idea style) */}
                      {bannerMovies.length > 1 && (
                        <div className="w-full max-w-7xl mx-auto px-6 md:px-14 mt-auto mb-2 select-none">
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className="text-[9px] font-black uppercase text-white px-2 py-0.5 rounded shadow-[0_0_8px_rgba(229,9,20,0.6)]"
                              style={{ backgroundColor: '#e50914' }}
                            >
                              HOT
                            </span>
                            <h3 className="text-white text-xs font-black uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              PHIM HOT TRONG THÁNG
                            </h3>
                          </div>

                          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none justify-start">
                            {bannerMovies.map((m, i) => (
                              <button
                                key={m.id}
                                onClick={() => setCurrentBannerIndex(i)}
                                className="flex-shrink-0 group/card text-left transition-all duration-300 focus:outline-none cursor-pointer"
                                style={{ width: '92px' }}
                              >
                                <div
                                  className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border-2 transition-all duration-300 bg-gradient-to-br from-red-900/30 to-gray-900"
                                  style={{
                                    borderColor: i === currentBannerIndex ? '#e50914' : 'rgba(255,255,255,0.12)',
                                    boxShadow: i === currentBannerIndex ? '0 0 16px rgba(229,9,20,0.5)' : 'none',
                                  }}
                                >
                                  <img
                                    src={m.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&h=180&fit=crop'}
                                    alt={m.titleVn}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                    onError={handleImageError}
                                  />
                                  {/* Number Overlay in Gold Gradient style */}
                                  <div
                                    className="absolute top-1 left-2 font-black text-2xl select-none"
                                    style={{
                                      fontFamily: 'Montserrat, sans-serif',
                                      color: '#d97706',
                                      textShadow: '2px 2px 0px rgba(0,0,0,0.95), 0 0 8px rgba(217,119,6,0.6)',
                                    }}
                                  >
                                    {i + 1}
                                  </div>
                                </div>
                                {/* Movie Title */}
                                <p
                                  className="mt-1.5 text-[9px] font-bold uppercase tracking-wide truncate transition-colors duration-200"
                                  style={{
                                    color: i === currentBannerIndex ? '#e50914' : 'rgba(255,255,255,0.6)',
                                    fontFamily: 'Montserrat, sans-serif'
                                  }}
                                >
                                  {m.titleVn || m.titleEn}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Prev button */}
            {bannerMovies.length > 1 && (
              <button
                onClick={() => setCurrentBannerIndex(prev => (prev - 1 + bannerMovies.length) % bannerMovies.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-red-600/90 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/15"
                style={{ opacity: isHoveringBanner ? 1 : 0 }}
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {/* Next button */}
            {bannerMovies.length > 1 && (
              <button
                onClick={() => setCurrentBannerIndex(prev => (prev + 1) % bannerMovies.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-red-600/90 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/15"
                style={{ opacity: isHoveringBanner ? 1 : 0 }}
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
          {/* ===== HẾT CINEMATIC MOVIE BANNER ===== */}

          {/* ===== QUICK BOOKING WIDGET ===== */}
          <motion.div
            id="quick-booking"
            className="relative w-full px-4 md:px-14"
            style={{ marginTop: '100px', zIndex: 20 }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="max-w-5xl mx-auto rounded-2xl p-6 md:p-8"
              style={{
                background: 'rgba(10,5,5,0.82)',
                backdropFilter: 'blur(28px)',
                border: '1px solid rgba(229,9,20,0.25)',
                boxShadow: '0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)', boxShadow: '0 4px 16px rgba(229,9,20,0.4)' }}
                >
                  <Ticket size={18} className="text-white font-bold" />
                </div>
                <div>
                  <h2 className="text-white font-black text-base uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Đặt Vé Nhanh
                  </h2>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
                    Chọn phim, ngày và giờ — đặt ngay chỉ trong vài giây
                  </p>
                </div>
                <Link
                  to="/showtimes"
                  className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors"
                  style={{ color: 'rgba(229,9,20,0.7)', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e50914'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(229,9,20,0.7)'}
                >
                  Xem lịch chiếu đầy đủ <ArrowRight size={13} />
                </Link>
              </div>

              {/* Form */}
              <form onSubmit={handleQuickBook} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <CustomSelect
                  label="Chọn phim"
                  placeholder="-- Chọn phim --"
                  value={bookingMovieId}
                  options={movies.map(m => ({ value: m.id?.toString(), label: m.titleVn || m.titleEn || 'Phim' }))}
                  error={bookingErrors.movie}
                  onChange={val => { setBookingMovieId(val); setBookingDate(''); setBookingTime(''); setBookingErrors({ movie: '', date: '', time: '' }) }}
                />
                <CustomSelect
                  label="Chọn ngày chiếu"
                  placeholder="-- Chọn ngày --"
                  value={bookingDate}
                  disabled={!bookingMovieId}
                  options={getAvailableDates().map(d => {
                    const dateObj = new Date(d)
                    const label = `${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()]} - ${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`
                    return { value: d, label }
                  })}
                  error={bookingErrors.date}
                  onChange={val => { setBookingDate(val); setBookingTime(''); setBookingErrors(p => ({ ...p, date: '', time: '' })) }}
                />
                <CustomSelect
                  label="Chọn suất chiếu"
                  placeholder="-- Chọn giờ --"
                  value={bookingTime}
                  disabled={!bookingDate}
                  options={getAvailableTimes().map(t => ({ value: t, label: t }))}
                  error={bookingErrors.time}
                  onChange={val => { setBookingTime(val); setBookingErrors(p => ({ ...p, time: '' })) }}
                />
                <div className="flex flex-col gap-2 w-full">
                  <span className="hidden md:block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'transparent' }}>Đặt vé</span>
                  <motion.button
                    type="submit"
                    className="w-full font-black text-white rounded-xl text-xs uppercase tracking-wider h-[44px] cursor-pointer flex items-center justify-center gap-2 border-none outline-none"
                    style={{
                      background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                      boxShadow: '0 6px 24px rgba(229,9,20,0.4)',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(229,9,20,0.6)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Ticket size={15} className="font-bold" />
                    Đặt Vé Ngay
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
          {/* ===== HẾT QUICK BOOKING WIDGET ===== */}

          {/* ================= PHẦN PHIM ĐANG CHIẾU ================= */}
          <motion.section
            className="w-full my-20 relative z-10 flex flex-col items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.1 }
              }
            }}
          >

            <motion.div
              className="w-full flex justify-center items-center h-[80px] px-6"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
              }}
            >
              <h2
                className="text-3xl md:text-4xl text-center text-white tracking-wide uppercase"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, letterSpacing: '2px' }}
              >
                PHIM ĐANG CHIẾU
              </h2>
            </motion.div>

            <motion.div
              className="w-full z-10 flex flex-col items-center gap-6"
              variants={{
                hidden: { opacity: 0, y: 25 },
                visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6 } }
              }}
            >
              <MovieArcCarousel3D movies={movies} />
              
              <Link
                to="/movies"
                className="flex items-center gap-2 py-3 px-8 rounded-full text-xs font-black uppercase tracking-widest text-white/70 hover:text-white border border-white/20 bg-white/5 hover:bg-white/15 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer mt-4"
              >
                Xem Tất Cả Phim
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.section>
          {/* ================= HẾT PHẦN PHIM ĐANG CHIẾU ================= */}

          {/* ====================================================
              SECTION: ƯU ĐÃI NỔI BẬT
          ==================================================== */}
          <section className="w-full py-20 px-6 md:px-14" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="max-w-7xl mx-auto">

              {/* Header */}
              <motion.div
                className="flex items-end justify-between mb-10"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55 }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Chương trình</p>
                  <h2 className="text-3xl md:text-4xl font-black uppercase text-white" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '1px' }}>
                    Ưu Đãi Nổi Bật
                  </h2>
                </div>
                <Link
                  to="/promotions"
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Xem tất cả <ArrowRight size={16} />
                </Link>
              </motion.div>

              {/* Cards grid */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
              >
                {PROMOTIONS.map((promo) => (
                  <motion.div
                    key={promo.id}
                    className="group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer glass-card"
                    variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
                    whileHover={{ y: -6, transition: { duration: 0.22 } }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Promo image */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={promo.img}
                        alt={promo.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        style={{ filter: 'brightness(0.75)' }}
                      />
                      {/* Tag badge */}
                      <span
                        className="absolute top-3 left-3 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-lg tracking-widest"
                        style={{ backgroundColor: promo.tagColor }}
                      >
                        {promo.tag}
                      </span>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to top, rgba(229,9,20,0.35), transparent)' }} />
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-white font-bold text-sm mb-2 group-hover:text-red-400 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {promo.title}
                      </h3>
                      <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
                        {promo.desc}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: promo.tagColor }}>
                        <Calendar size={12} />
                        <span>{promo.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="flex justify-center mt-8 sm:hidden">
                <Link to="/promotions" className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
                  Xem tất cả ưu đãi <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>

          {/* ====================================================
              SECTION: HỆ THỐNG RẠP CHIẾU
          ==================================================== */}
          <section
            className="w-full py-20 px-6 md:px-14"
            style={{ background: 'linear-gradient(180deg, var(--color-background) 0%, rgba(25,10,10,0.9) 50%, var(--color-background) 100%)' }}
          >
            <div className="max-w-7xl mx-auto">

              <motion.div
                className="flex items-end justify-between mb-10"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55 }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Hệ thống</p>
                  <h2 className="text-3xl md:text-4xl font-black uppercase text-white" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '1px' }}>
                    Rạp Lân Cận
                  </h2>
                </div>
                <Link
                  to="/cinemas"
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Tất cả rạp <ArrowRight size={16} />
                </Link>
              </motion.div>

              {/* Layout: Bản đồ trái + Danh sách rạp phải */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Cột trái: Bản đồ TP.HCM */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex flex-col gap-4"
                >
                  {/* Map container */}
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      border: '1px solid rgba(229,9,20,0.25)',
                      boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                      aspectRatio: '4/3',
                    }}
                  >
                    {/* Map iframe - TP.HCM trước sáp nhập */}
                    <iframe
                      title="Bản đồ TP. Hồ Chí Minh"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=106.4500%2C10.5800%2C106.9000%2C10.9500&layer=mapnik&marker=10.7757%2C106.7004"
                      className="w-full h-full"
                      style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) saturate(1.3)', border: 'none' }}
                      loading="lazy"
                    />
                    {/* Overlay gradient top/bottom */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,5,5,0.45) 0%, transparent 20%, transparent 80%, rgba(10,5,5,0.6) 100%)' }} />
                    {/* Label */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(10,5,5,0.85)', border: '1px solid rgba(229,9,20,0.35)' }}>
                      <MapPin size={13} className="text-red-500" />
                      <span className="text-white text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>TP. Hồ Chí Minh</span>
                    </div>
                    {/* Dot markers cho từng rạp */}
                    <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
                      {CINEMAS.map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.badge ? '#d97706' : '#e50914', boxShadow: '0 0 6px currentColor' }} />
                          <span className="text-[10px] font-semibold text-white/75" style={{ fontFamily: 'Inter, sans-serif' }}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Caption */}
                  <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
                    Hệ thống 4 rạp tại TP. Hồ Chí Minh — Chi nhánh tổng tại Quận 1
                  </p>
                </motion.div>

                {/* Cột phải: Danh sách rạp */}
                <motion.div
                  className="flex flex-col gap-4"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
                >
                  {CINEMAS.map((cinema) => (
                    <motion.div
                      key={cinema.id}
                      className="group flex gap-4 rounded-2xl overflow-hidden cursor-pointer"
                      variants={{ hidden: { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                      style={{
                        background: cinema.badge ? 'linear-gradient(135deg, rgba(25,15,5,0.9) 0%, rgba(35,18,5,0.9) 100%)' : 'rgba(255,255,255,0.04)',
                        border: cinema.badge ? '1px solid rgba(217,119,6,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        boxShadow: cinema.badge ? '0 8px 32px rgba(217,119,6,0.15)' : '0 4px 16px rgba(0,0,0,0.4)',
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0" style={{ width: '110px' }}>
                        <img
                          src={cinema.img}
                          alt={cinema.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          style={{ filter: 'brightness(0.65)' }}
                        />
                        {/* Format badges */}
                        <div className="absolute inset-0 flex flex-col justify-end p-1.5 gap-1">
                          <div className="flex flex-wrap gap-1">
                            {cinema.screens.slice(0, 2).map(s => (
                              <span key={s} className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col justify-center py-4 pr-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-white font-bold text-sm group-hover:text-red-400 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {cinema.name}
                          </h3>
                          {cinema.badge && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: cinema.badgeColor, color: '#fff' }}>
                              {cinema.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start gap-1.5 mb-2">
                          <MapPin size={11} className="text-red-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>{cinema.address}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Phone size={11} className="text-red-500 shrink-0" />
                            <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>{cinema.phone}</span>
                          </div>
                          <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>{cinema.rooms} phòng</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Nút xem tất cả */}
                  <Link
                    to="/cinemas"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-2 border-red-500/40 hover:border-red-500/80 hover:bg-red-500/10 text-red-500"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Xem Tất Cả Rạp <ArrowRight size={15} />
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ====================================================
              SECTION: QUẢNG CÁO THÀNH VIÊN
          ==================================================== */}
          <section className="w-full px-6 md:px-14 pb-24">
            <motion.div
              className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65 }}
              style={{
                background: 'linear-gradient(135deg, #0a0008 0%, #1a0510 30%, #2d0515 55%, #0a0208 100%)',
                border: '1px solid rgba(229,9,20,0.2)',
                boxShadow: '0 0 80px rgba(229,9,20,0.12), 0 24px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Decorative glow blobs */}
              <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,9,20,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
              <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,9,20,0.12) 0%, transparent 70%)', filter: 'blur(30px)' }} />

              <div className="relative z-10 py-16 px-8 md:px-16">

                {/* Header */}
                <div className="text-center mb-14">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.4, 0.64, 1] }}
                    className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded-full border"
                    style={{ borderColor: 'rgba(229,9,20,0.4)', backgroundColor: 'rgba(229,9,20,0.1)' }}
                  >
                    <Crown size={16} className="text-red-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>CineMate Membership</span>
                  </motion.div>

                  <motion.h2
                    className="text-3xl md:text-5xl font-black text-white mb-4 uppercase"
                    style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.02em', textShadow: '0 4px 30px rgba(229,9,20,0.3)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: 0.2 }}
                  >
                    Trải Nghiệm VIP <br />
                    <span style={{ color: '#e50914' }}>Dành Cho Bạn</span>
                  </motion.h2>
                  <motion.p
                    className="text-sm max-w-lg mx-auto leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: 0.3 }}
                  >
                    Tham gia hội viên CineMate để tận hưởng hàng loạt đặc quyền độc quyền — từ vé ưu đãi, tích điểm đến trải nghiệm chiếu phim riêng tư không thể quên.
                  </motion.p>
                </div>

                {/* Perks grid */}
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } } }}
                >
                  {MEMBER_PERKS.map(({ icon: Icon, title, desc }) => (
                    <motion.div
                      key={title}
                      className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl"
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.18 } }}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(229,9,20,0.15)',
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)' }}
                      >
                        <Icon size={22} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs mb-1 uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>{title}</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>{desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Link
                    to="/register"
                    className="flex items-center gap-2.5 px-10 py-4 rounded-full font-bold uppercase tracking-wider text-sm text-white transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                      boxShadow: '0 8px 30px rgba(229,9,20,0.5)',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    <Crown size={16} />
                    Đăng Ký Thành Viên — Miễn Phí
                  </Link>
                  <Link
                    to="/promotions"
                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white/20 hover:border-white/40 hover:bg-white/8 text-white/80"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Khám Phá Ưu Đãi <ArrowRight size={15} />
                  </Link>
                </motion.div>

                {/* Stats bar */}
                <motion.div
                  className="flex flex-wrap justify-center gap-8 mt-12 pt-10"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {[
                    { num: '50K+', label: 'Thành viên' },
                    { num: '3', label: 'Chi nhánh' },
                    { num: '19+', label: 'Phòng chiếu' },
                    { num: '4.9★', label: 'Đánh giá' },
                  ].map(({ num, label }) => (
                    <div key={label} className="text-center">
                      <p className="text-2xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 20px rgba(229,9,20,0.4)' }}>{num}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>{label}</p>
                    </div>
                  ))}
                </motion.div>

              </div>
            </motion.div>
          </section>
        </>
      )}

      {/* NƠI HIỂN THỊ CÁC TRANG CON */}
      <Outlet />

      {/* Trailer Modal */}
      {isTrailerOpen && selectedTrailerMovie && (
        <TrailerModal
          isTrailerOpen={isTrailerOpen}
          onClose={() => {
            setIsTrailerOpen(false)
            setSelectedTrailerMovie(null)
          }}
          movie={{
            ...selectedTrailerMovie,
            trailerUrl: getEmbedUrl(selectedTrailerMovie.trailerUrl)
          }}
        />
      )}

      <style>{`
        .overflow-x-auto::-webkit-scrollbar { display: none; }
      `}</style>
    </motion.div>
  )
}