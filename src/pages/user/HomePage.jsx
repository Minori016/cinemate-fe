import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { movieService } from '../../services/movieService'
import { showtimeService, isPublicShowtimeStatus } from '../../services/showtimeService'
import {
  promotionService,
  getQuickDiscountText,
  formatPromoDateRange,
} from '../../services/promotionService'
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

// ── Constants ──────────────────────────────────────────────────
const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop'
const DEFAULT_POSTER_SMALL = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'

const FALLBACK_PROMOTION_IMGS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=700',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=700',
  'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=700',
]

const TAG_COLORS = ['#e50914', '#2563eb', '#d97706', '#16a34a', '#9333ea']

// ── Static Data ────────────────────────────────────────────────
const CINEMAS = [
  { id: 1, name: 'CineMate Cinema', badge: 'RẠP CHÍNH', badgeColor: '#e50914', address: '135 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', phone: '1900 1234', rooms: 10, screens: ['2D', '3D', 'IMAX', '4DX'], img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800' },
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

const BannerMedia = ({ movie }) => {
  const defaultPoster = movie.poster || movie.posterUrl || DEFAULT_POSTER

  return (
    <motion.div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none bg-gradient-to-br from-red-950/60 to-gray-900"
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 10, ease: 'linear' }}
      style={{ pointerEvents: 'none' }}
    >
      <img
        src={defaultPoster}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.6] saturate-[1.1] contrast-[1.1]"
        style={{ pointerEvents: 'none' }}
        onError={(event) => handleImageError(event, DEFAULT_POSTER)}
      />
    </motion.div>
  )
}

// ── Quick Booking: 7 ngày tới ──────────────────────────────────
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return {
    date: `${yyyy}-${mm}-${dd}`,
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
  const [promotions, setPromotions] = useState([])
  const [promotionsLoading, setPromotionsLoading] = useState(true)
  const location = useLocation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isHoveringBanner, setIsHoveringBanner] = useState(false)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState(null)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  // Debug: Log component mount and location
  console.log('🏠 HomePage rendering. Path:', location.pathname, 'Movies count:', movies.length)

  // ── Quick Booking state (API-backed showtimes) ──────────────────
  const [bookingMovieId, setBookingMovieId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingRoomId, setBookingRoomId] = useState('')
  // Full select value "time|roomId" so CustomSelect can match the option
  const [bookingTimeValue, setBookingTimeValue] = useState('')
  const [bookingErrors, setBookingErrors] = useState({ movie: '', date: '', time: '' })
  // Map date → showtimes[] from API for selected movie
  const [showtimesByDate, setShowtimesByDate] = useState({})
  const [showtimesLoading, setShowtimesLoading] = useState(false)

  // Fetch real showtimes for next 7 days when movie changes
  useEffect(() => {
    if (!bookingMovieId) {
      setShowtimesByDate({})
      return
    }
    let cancelled = false
    setShowtimesLoading(true)
    setShowtimesByDate({})

    Promise.all(
      DAYS.map(async (d) => {
        try {
          const list = await showtimeService.getByMovie(bookingMovieId, d.date)
          const publicList = (list || []).filter(s => s && isPublicShowtimeStatus(s.status))
          return [d.date, publicList]
        } catch {
          return [d.date, []]
        }
      })
    )
      .then((entries) => {
        if (cancelled) return
        const map = {}
        entries.forEach(([date, list]) => { map[date] = list })
        setShowtimesByDate(map)
      })
      .finally(() => {
        if (!cancelled) setShowtimesLoading(false)
      })

    return () => { cancelled = true }
  }, [bookingMovieId])

  // Dates that actually have at least one public showtime
  const availableDates = useMemo(() => {
    return DAYS
      .map(d => d.date)
      .filter(date => (showtimesByDate[date] || []).length > 0)
  }, [showtimesByDate])

  // Time options for selected date (include roomName + roomId for navigation)
  const availableTimeOptions = useMemo(() => {
    if (!bookingDate) return []
    const list = showtimesByDate[bookingDate] || []
    return list.map(st => {
      const time = st.time
        || (st.startTime ? st.startTime.split('T')[1]?.substring(0, 5) : '')
        || ''
      const room = st.roomName || st.room || ''
      return {
        value: `${time}|${st.roomId || ''}`,
        label: room ? `${time} · ${room}` : time,
        time,
        roomId: st.roomId || '',
        showtime: st,
      }
    }).filter(opt => opt.time)
  }, [bookingDate, showtimesByDate])

  const handleQuickBook = (e) => {
    e.preventDefault()
    const newErrors = { movie: '', date: '', time: '' }
    let valid = true
    if (!bookingMovieId) { newErrors.movie = 'Vui lòng chọn phim'; valid = false }
    if (!bookingDate) { newErrors.date = 'Vui lòng chọn ngày'; valid = false }
    if (!bookingTime) { newErrors.time = 'Vui lòng chọn giờ'; valid = false }
    setBookingErrors(newErrors)
    if (!valid) return

    const params = new URLSearchParams({ date: bookingDate, time: bookingTime })
    if (bookingRoomId) params.set('roomId', bookingRoomId)
    navigate(`/movies/${bookingMovieId}?${params.toString()}`)
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

  // Load active promotions for homepage cards
  useEffect(() => {
    let cancelled = false
    setPromotionsLoading(true)
    promotionService.getActiveForUi()
      .then(list => {
        if (cancelled) return
        const cards = (Array.isArray(list) ? list : []).slice(0, 8).map((p, i) => {
          const discountText = getQuickDiscountText(p)
          return {
            id: p.id || p.code || i,
            tag: discountText ? discountText.replace('Giảm ', '').toUpperCase() : (p.code || 'HOT'),
            tagColor: TAG_COLORS[i % TAG_COLORS.length],
            title: p.title || p.code || 'Khuyến mãi',
            desc: p.detail || p.description || p.content || discountText || 'Ưu đãi đặc biệt từ CineMate.',
            date: formatPromoDateRange(p),
            img: p.imageUrl || FALLBACK_PROMOTION_IMGS[i % FALLBACK_PROMOTION_IMGS.length],
            code: p.code || '',
          }
        })
        setPromotions(cards)
      })
      .catch(() => { if (!cancelled) setPromotions([]) })
      .finally(() => { if (!cancelled) setPromotionsLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    console.log('🔍 Fetching movies...')
    movieService.getAll({ page: 0, size: 50, status: 'now-showing' })
      .then(r => {
        console.log('✅ API Response:', r.data)
        const moviesData = r.data || []
        const sortedMovies = moviesData
          .map((movie, index) => ({ movie, index, releaseTimestamp: Date.parse(movie.releaseDate) }))
          .sort((a, b) => {
            const aHasValidDate = Number.isFinite(a.releaseTimestamp)
            const bHasValidDate = Number.isFinite(b.releaseTimestamp)
            if (!aHasValidDate && !bHasValidDate) return a.index - b.index
            if (!aHasValidDate) return 1
            if (!bHasValidDate) return -1
            return b.releaseTimestamp - a.releaseTimestamp || a.index - b.index
          })
          .map(({ movie }) => movie)
        console.log('🎬 Movies to set:', sortedMovies.map(m => ({
          id: m.id,
          titleVn: m.titleVn,
          posterUrl: m.posterUrl,
          posterUrlType: typeof m.posterUrl,
          posterUrlLength: m.posterUrl?.length
        })))
        setMovies(sortedMovies)
      })
      .catch(err => {
        console.error('❌ Error fetching movies:', err)
        setMovies([])
      })

  }, [])

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
      setBookingRoomId('')
      setBookingTimeValue('')
      setBookingErrors({ movie: '', date: '', time: '' })
    }

    // Delay scroll để đảm bảo trang đã render xong
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
            style={{ height: 'clamp(660px, 80vh, 840px)' }}
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
                    {/* Backdrop with cinematic zoom - Static movie poster */}
                    <BannerMedia movie={movie} />

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

                      {/* Bottom horizontal selection strip — giant outline rank behind poster */}
                      {bannerMovies.length > 1 && (
                        <div className="w-full max-w-7xl mx-auto px-6 md:px-14 mt-auto mb-2 select-none">
                          <h3 className="text-white text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            <span className="text-base">🔥</span>
                            <span>PHIM HOT TRONG THÁNG</span>
                          </h3>

                          {/* Netflix-style row: fixed cards scroll on small screens, then flex evenly across desktop */}
                          <div className="flex min-w-max lg:min-w-0 gap-6 sm:gap-8 lg:gap-4 overflow-x-auto px-6 sm:px-8 lg:px-10 pb-2 scrollbar-none">
                            {bannerMovies.map((m, i) => {
                              const movieTitle = m.titleVn || m.titleEn || `Phim ${i + 1}`
                              const isActive = i === currentBannerIndex
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setCurrentBannerIndex(i)}
                                  aria-label={`Chọn phim ${movieTitle}`}
                                  aria-pressed={isActive}
                                  className="group relative flex-shrink-0 text-left focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-lg transition-all duration-300 cursor-pointer w-[calc(100%/3_+_2px)] sm:w-[calc(100%/4_+_2px)] md:w-[calc(100%/5_+_2px)] lg:w-[calc(100%/${bannerMovies.length}_+_2px)]"
                                >
                                  {/* Fixed stage area for rank + poster composition */}
                                  <div className="relative h-[175px] overflow-visible">
                                    {/* Giant Outline Rank Number behind poster */}
                                    <span
                                      aria-hidden="true"
                                      className={`absolute ${i >= 3 ? 'left-[-30px]' : 'left-[-20px]'} bottom-[2px] sm:bottom-[0px] lg:bottom-[-2px] z-0 select-none pointer-events-none font-black text-outline-number text-[150px] sm:text-[170px] lg:text-[185px]`}
                                    >
                                      {i + 1}
                                    </span>

                                    {/* Poster Card */}
                                    <div
                                      className="absolute left-[28px] sm:left-[34px] lg:left-[38px] bottom-5 z-10 w-[80px] sm:w-[90px] aspect-[2/3] rounded-[10px] overflow-hidden border-2 transition-all duration-300 bg-gradient-to-br from-red-900/30 to-gray-900"
                                      style={{
                                        borderColor: isActive ? '#e50914' : 'rgba(255,255,255,0.12)',
                                        boxShadow: isActive ? '0 0 16px rgba(229,9,20,0.5)' : 'none',
                                      }}
                                    >
                                      <img
                                        src={m.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&h=180&fit=crop'}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={handleImageError}
                                      />
                                      {/* Dark gradient overlay at bottom half of poster */}
                                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                      {/* Movie Title over gradient */}
                                      <p
                                        className="absolute inset-x-0 bottom-0 px-2 pb-2 text-[9px] font-bold uppercase tracking-wide leading-3 line-clamp-2 z-10 transition-colors duration-200"
                                        style={{
                                          color: isActive ? '#e50914' : 'rgba(255,255,255,0.9)',
                                          fontFamily: 'Montserrat, sans-serif',
                                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                        }}
                                      >
                                        {movieTitle}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
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
                  onChange={val => { setBookingMovieId(val); setBookingDate(''); setBookingTime(''); setBookingRoomId(''); setBookingTimeValue(''); setBookingErrors({ movie: '', date: '', time: '' }) }}
                />
                <CustomSelect
                  label="Chọn ngày chiếu"
                  placeholder={showtimesLoading ? 'Đang tải...' : (availableDates.length === 0 && bookingMovieId && !showtimesLoading ? 'Không có lịch' : '-- Chọn ngày --')}
                  value={bookingDate}
                  disabled={!bookingMovieId || showtimesLoading}
                  options={availableDates.map(d => {
                    const dateObj = new Date(d + 'T12:00:00')
                    const label = `${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()]} - ${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`
                    return { value: d, label }
                  })}
                  error={bookingErrors.date}
                  onChange={val => { setBookingDate(val); setBookingTime(''); setBookingRoomId(''); setBookingTimeValue(''); setBookingErrors(p => ({ ...p, date: '', time: '' })) }}
                />
                <CustomSelect
                  label="Chọn suất chiếu"
                  placeholder={availableTimeOptions.length === 0 && bookingDate ? 'Không có suất' : '-- Chọn giờ --'}
                  value={bookingTimeValue}
                  disabled={!bookingDate || availableTimeOptions.length === 0}
                  options={availableTimeOptions.map(t => ({ value: t.value, label: t.label }))}
                  error={bookingErrors.time}
                  onChange={val => {
                    const [time, roomId = ''] = String(val).split('|')
                    setBookingTimeValue(val)
                    setBookingTime(time)
                    setBookingRoomId(roomId)
                    setBookingErrors(p => ({ ...p, time: '' }))
                  }}
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
              SECTION: RẠP CHIẾU CINEMATE
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
                  <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Vị Trí Rạp Chiếu</p>
                  <h2 className="text-3xl md:text-4xl font-black uppercase text-white" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '1px' }}>
                    Rạp Chiếu CineMate
                  </h2>
                </div>
                <Link
                  to="/cinemas"
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Xem chi tiết <ArrowRight size={16} />
                </Link>
              </motion.div>

              {/* Layout: Bản đồ trái + Thông tin rạp chính phải */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                {/* Cột trái: Bản đồ rạp chính */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex flex-col gap-3 h-full"
                >
                  {/* Map container */}
                  <div
                    className="relative rounded-2xl overflow-hidden h-full min-h-[360px]"
                    style={{
                      border: '1px solid rgba(229,9,20,0.3)',
                      boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                    }}
                  >
                    <iframe
                      title="Bản đồ CineMate Quận 1"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=106.6900%2C10.7700%2C106.7100%2C10.7850&layer=mapnik&marker=10.7757%2C106.7004"
                      className="w-full h-full min-h-[360px]"
                      style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) saturate(1.3)', border: 'none' }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,5,5,0.45) 0%, transparent 20%, transparent 80%, rgba(10,5,5,0.6) 100%)' }} />
                    
                    {/* Location Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(10,5,5,0.85)', border: '1px solid rgba(229,9,20,0.35)' }}>
                      <MapPin size={13} className="text-red-500 animate-pulse" />
                      <span className="text-white text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>135 Đồng Khởi, Q.1, TP. Hồ Chí Minh</span>
                    </div>

                    {/* Single Cinema Tag */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1 rounded-lg bg-black/80 border border-red-500/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_6px_#e50914]" />
                      <span className="text-[11px] font-bold text-white">CineMate Cinema</span>
                    </div>
                  </div>

                  <p className="text-xs text-center text-gray-400 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    📍 Trụ sở rạp duy nhất ngay trung tâm Quận 1 — TP. Hồ Chí Minh
                  </p>
                </motion.div>

                {/* Cột phải: Thẻ Rạp chiếu duy nhất */}
                <motion.div
                  className="flex flex-col h-full justify-between"
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {CINEMAS.map((cinema) => (
                    <div
                      key={cinema.id}
                      className="rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full relative overflow-hidden text-left"
                      style={{
                        background: 'linear-gradient(135deg, rgba(25,15,15,0.95) 0%, rgba(35,18,18,0.95) 100%)',
                        border: '1px solid rgba(229,9,20,0.3)',
                        boxShadow: '0 8px 32px rgba(229,9,20,0.15)',
                      }}
                    >
                      {/* Image Preview Header */}
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-5 border border-white/10">
                        <img
                          src={cinema.img}
                          alt={cinema.name}
                          className="w-full h-full object-cover"
                          style={{ filter: 'brightness(0.75)' }}
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-white shadow-lg bg-red-600">
                          {cinema.badge}
                        </div>
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          {cinema.screens.map(s => (
                            <span key={s} className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-white backdrop-blur-md bg-black/70 border border-white/10">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Information */}
                      <div className="flex-1 mb-5">
                        <h3 className="text-xl font-extrabold text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {cinema.name}
                        </h3>
                        <p className="text-xs text-gray-300 mb-4 flex items-start gap-2 leading-relaxed">
                          <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                          <span>{cinema.address}</span>
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-300 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-red-500 shrink-0" />
                            <span className="font-semibold">{cinema.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span className="font-semibold text-emerald-400">10 Phòng chiếu (IMAX & 4DX)</span>
                          </div>
                        </div>
                      </div>

                      {/* Action link */}
                      <Link
                        to="/cinemas"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Khám Phá Rạp Chiếu & Bản Đồ <ArrowRight size={15} />
                      </Link>
                    </div>
                  ))}
                </motion.div>

              </div>

            </div>
          </section>

          {/* ====================================================
              SECTION: RẠP CHIẾU CINEMATE
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
                    CineMate Cinema — 135 Đồng Khởi, Quận 1, TP. Hồ Chí Minh
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
                    Xem Chi Tiết Rạp <ArrowRight size={15} />
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