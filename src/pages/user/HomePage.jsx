import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { movieService } from '../../services/movieService'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronLeft, ChevronRight, Tag, Clock, Globe, MessageSquare, MapPin, Phone, Calendar, Star, Gift, Crown, Ticket, Zap, Users, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// ── Static data cho các section homepage ─────────────────────────
const PROMOTIONS = [
  {
    id: 1, tag: 'HOT', tagColor: '#e50914',
    title: 'Happy Monday — Đồng Giá 45K',
    desc: 'Ưu đãi đồng giá vé 2D chỉ 45.000đ cho mọi thành viên vào mỗi ngày Thứ Hai hàng tuần.',
    date: 'Mỗi Thứ Hai',
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700',
  },
  {
    id: 2, tag: 'MỚI', tagColor: '#2563eb',
    title: 'Khai Trương CineMate Thủ Đức',
    desc: 'Giảm 50% bắp nước khi mua kèm 2 vé tại chi nhánh Thủ Đức. Ưu đãi trong thời gian khai trương!',
    date: 'Đến 30/06/2026',
    img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=700',
  },
  {
    id: 3, tag: 'VIP', tagColor: '#d97706',
    title: 'Hội Viên Vàng — Tích Điểm Đôi',
    desc: 'Tích lũy điểm thành viên gấp đôi và nhận thêm bắp nước miễn phí vào tháng sinh nhật của bạn.',
    date: 'Chương trình thường niên',
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=700',
  },
  {
    id: 4, tag: 'COMBO', tagColor: '#16a34a',
    title: 'Combo Cuối Tuần — Tiết Kiệm 30%',
    desc: 'Mua combo 2 vé + 2 bắp lớn + 2 nước vào Thứ 7 & Chủ Nhật, tiết kiệm đến 30% so với giá lẻ.',
    date: 'Thứ 7 & Chủ Nhật',
    img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=700',
  },
]

const CINEMAS = [
  {
    id: 1,
    name: 'CineMate Quận 1',
    badge: 'CHI NHÁNH TỔNG',
    badgeColor: '#d97706',
    address: '135 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '1900 1234',
    rooms: 10,
    screens: ['2D', '3D', 'IMAX', '4DX'],
    img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800',
    mapLink: 'https://maps.google.com/?q=135+Dong+Khoi+Q1+HCMC',
  },
  {
    id: 2,
    name: 'CineMate Bình Thạnh',
    badge: null,
    badgeColor: null,
    address: '156 Xo Vìt Nghệ Tĩnh, Phường 26, Quận Bình Thạnh, TP. Hồ Chí Minh',
    phone: '1900 1235',
    rooms: 8,
    screens: ['2D', '3D', '4DX'],
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800',
    mapLink: 'https://maps.google.com/?q=Binh+Thanh+HCMC',
  },
  {
    id: 3,
    name: 'CineMate Gò Vấp',
    badge: null,
    badgeColor: null,
    address: '12 Quang Trung, Phường 10, Quận Gò Vấp, TP. Hồ Chí Minh',
    phone: '1900 1236',
    rooms: 6,
    screens: ['2D', '3D'],
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800',
    mapLink: 'https://maps.google.com/?q=Go+Vap+HCMC',
  },
  {
    id: 4,
    name: 'CineMate Thủ Đức',
    badge: null,
    badgeColor: null,
    address: 'Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '1900 1237',
    rooms: 7,
    screens: ['2D', '3D', 'IMAX'],
    img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=800',
    mapLink: 'https://maps.google.com/?q=Thu+Duc+HCMC',
  },
]

const MEMBER_PERKS = [
  { icon: Ticket,  title: 'Vé Ưu Đãi',     desc: 'Giảm đến 30% vé mọi suất chiếu trong tuần' },
  { icon: Star,    title: 'Tích Điểm',     desc: 'Đổi điểm lấy vé, bắp nước & quà tặng hấp dẫn' },
  { icon: Crown,   title: 'Ghế Ưu Tiên',   desc: 'Đặt ghế VIP trước 48 giờ so với khách thường' },
  { icon: Gift,    title: 'Quà Sinh Nhật', desc: 'Combo vé + bắp miễn phí vào tháng sinh nhật' },
  { icon: Users,   title: 'Cộng Đồng',    desc: 'Tham gia club & các sự kiện chiếu phim riêng' },
  { icon: Zap,     title: 'Flash Sale',    desc: 'Nhận thông báo ưu đãi chớp nhoáng sớm nhất' },
]

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const location = useLocation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isHoveringBanner, setIsHoveringBanner] = useState(false)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

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

  const isRoot = location.pathname === '/'

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
    movieService.getAll()
      .then(r => {
        setMovies(r.data?.result?.content || r.data?.result || [])
      })
      .catch(() => {})
  }, [])

  const getRatingColor = (rating) => {
    if (rating === 'T18') return '#dc2626'
    if (rating === 'T16') return '#ef4444'
    if (rating === 'T13') return '#f97316'
    return '#16a34a'
  }

  return (
    <motion.div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {isRoot && (
        <>
          {/* ===== CINEMATIC MOVIE BANNER ===== */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: 'clamp(400px, 70vh, 680px)' }}
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
                const posterUrl = movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop'
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
                    {/* Backdrop blur */}
                    <motion.div
                      className="absolute inset-0 w-full h-full"
                      initial={{ scale: 1.06 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 8, ease: 'linear' }}
                    >
                      <img
                        src={posterUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: 'blur(28px) brightness(0.3) saturate(1.5)' }}
                      />
                    </motion.div>

                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        background: 'linear-gradient(105deg, rgba(5,5,10,0.97) 0%, rgba(5,5,10,0.72) 38%, rgba(5,5,10,0.22) 68%, rgba(5,5,10,0.5) 100%)',
                      }}
                    />
                    {/* Bottom fade vào background */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-44 z-10"
                      style={{ background: 'linear-gradient(to top, var(--color-background), transparent)' }}
                    />

                    {/* Nội dung */}
                    <div className="absolute inset-0 z-20 flex items-center">
                      <div className="w-full max-w-7xl mx-auto px-6 md:px-14 flex flex-col sm:flex-row items-center sm:items-center gap-8 md:gap-14">

                        {/* Poster card nổi bật */}
                        <motion.div
                          className="flex-shrink-0 hidden sm:block"
                          initial={{ opacity: 0, x: -48, rotate: -4 }}
                          animate={{ opacity: 1, x: 0, rotate: 0 }}
                          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          <div className="relative" style={{ width: 'clamp(150px, 16vw, 220px)' }}>
                            <img
                              src={posterUrl}
                              alt={movie.titleVn}
                              className="w-full rounded-2xl"
                              style={{
                                aspectRatio: '2/3',
                                objectFit: 'cover',
                                boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.09)',
                              }}
                            />
                            {/* Rating badge */}
                            <div
                              className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-white text-xs font-black uppercase shadow-lg"
                              style={{ backgroundColor: getRatingColor(movie.rating || 'K') }}
                            >
                              {movie.rating || 'K'}
                            </div>
                            {/* Shine */}
                            <div
                              className="absolute inset-0 rounded-2xl pointer-events-none"
                              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 55%)' }}
                            />
                          </div>
                        </motion.div>

                        {/* Text info */}
                        <motion.div
                          className="flex flex-col gap-4 text-white flex-1 text-left"
                          initial={{ opacity: 0, y: 28 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.65, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                          <h2
                            style={{
                              fontFamily: 'Montserrat, sans-serif',
                              fontSize: 'clamp(24px, 4.2vw, 54px)',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                              textShadow: '0 4px 28px rgba(0,0,0,0.7)',
                              lineHeight: 1.06,
                              margin: 0,
                            }}
                          >
                            {movie.titleVn || movie.titleEn}
                          </h2>

                          {/* Meta */}
                          <div
                            className="flex flex-wrap items-center gap-3 text-sm"
                            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}
                          >
                            {movie.durationMinutes && (
                              <span className="flex items-center gap-1.5">
                                <Clock size={13} className="text-red-500" />
                                {movie.durationMinutes} phút
                              </span>
                            )}
                            {movie.language && (
                              <span className="flex items-center gap-1.5">
                                <MessageSquare size={13} className="text-red-500" />
                                {movie.language}
                              </span>
                            )}
                            {movie.countries?.length > 0 && (
                              <span className="flex items-center gap-1.5">
                                <Globe size={13} className="text-red-500" />
                                {movie.countries.map(c => c.name).join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Synopsis */}
                          {movie.description && (
                            <p
                              className="text-sm leading-relaxed line-clamp-3 max-w-xl"
                              style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', margin: 0 }}
                            >
                              {movie.description}
                            </p>
                          )}

                          {/* CTA */}
                          <div className="flex flex-wrap gap-3 mt-1">
                            <Link
                              to={detailLink}
                              className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm uppercase tracking-wider text-white transition-all duration-200 hover:scale-105 active:scale-95"
                              style={{
                                background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                                boxShadow: '0 6px 24px rgba(229,9,20,0.45)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                fontFamily: 'Montserrat, sans-serif',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>confirmation_number</span>
                              Đặt Vé Ngay
                            </Link>
                            <Link
                              to={detailLink}
                              className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm uppercase tracking-wider text-white transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white/25 hover:bg-white/10 hover:border-white/50 bg-transparent"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>info</span>
                              Chi Tiết
                            </Link>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Prev button */}
            {bannerMovies.length > 1 && (
              <button
                onClick={() => setCurrentBannerIndex(prev => (prev - 1 + bannerMovies.length) % bannerMovies.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-red-600/90 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/15"
                style={{ opacity: isHoveringBanner ? 1 : 0 }}
                aria-label="Previous"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            {/* Next button */}
            {bannerMovies.length > 1 && (
              <button
                onClick={() => setCurrentBannerIndex(prev => (prev + 1) % bannerMovies.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-red-600/90 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/15"
                style={{ opacity: isHoveringBanner ? 1 : 0 }}
                aria-label="Next"
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* Thumbnail strip */}
            {bannerMovies.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-end gap-2">
                {bannerMovies.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setCurrentBannerIndex(i)}
                    className="flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300"
                    style={{
                      width: i === currentBannerIndex ? '46px' : '32px',
                      height: i === currentBannerIndex ? '62px' : '44px',
                      borderColor: i === currentBannerIndex ? '#e50914' : 'rgba(255,255,255,0.2)',
                      opacity: i === currentBannerIndex ? 1 : 0.55,
                      boxShadow: i === currentBannerIndex ? '0 0 16px rgba(229,9,20,0.6)' : 'none',
                    }}
                    aria-label={`Slide ${i + 1}`}
                  >
                    <img
                      src={m.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&h=150&fit=crop'}
                      alt={m.titleVn}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* ===== HẾT CINEMATIC MOVIE BANNER ===== */}

          {/* ================= PHẦN PHIM ĐANG CHIẾU ================= */}
          <div className="w-full my-20 relative z-10 flex flex-col items-center">

            <div className="w-full flex justify-center items-center h-[80px] px-6">
              <motion.h2
                className="text-3xl md:text-4xl text-center text-white tracking-wide uppercase"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, letterSpacing: '2px' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                PHIM ĐANG CHIẾU
              </motion.h2>
            </div>

            <div className="relative group/slider w-full max-w-[1100px] px-6">

              {movies.length > 4 && (
                <button
                  onClick={slideLeft}
                  className="absolute left-2 md:-left-6 top-[40%] -translate-y-1/2 z-40 w-12 h-16 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300 rounded-sm backdrop-blur-sm"
                >
                  <ChevronLeft size={36} />
                </button>
              )}

              <div className="w-full overflow-hidden">
                <div
                  className="flex gap-6 transition-transform duration-500 ease-in-out pb-8 w-max"
                  style={{ transform: `translateX(-${currentIndex * (240 + 24)}px)` }}
                >
                  {movies.map((movie) => {
                    const genresStr = movie.genres?.map(g => g.name).join(', ') || 'Chưa phân loại'
                    const countriesStr = movie.countries?.map(c => c.name).join(', ') || 'N/A'
                    const detailLink = `/movies/${movie.id}`
                    return (
                      <div key={movie.id} className="w-[240px] flex-shrink-0 snap-center flex flex-col h-full cursor-pointer">
                        <Link to={detailLink} className="group flex flex-col flex-grow">
                          <div className="relative w-full aspect-[2/3] flex-shrink-0 overflow-hidden border border-white/10 shadow-lg mb-4">
                            <div className="absolute top-0 left-0 z-30 flex">
                              <span className="bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 flex items-center justify-center border-r border-b border-white/5">{movie.version || '2D'}</span>
                              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 flex items-center justify-center">{movie.rating || 'K'}</span>
                            </div>
                            <img
                              src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'}
                              alt={movie.titleVn}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                            />
                            <div className="absolute inset-0 bg-black/85 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center px-6 text-left">
                              <h3 className="text-white font-bold text-xl mb-6 uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>{movie.titleVn}</h3>
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3"><Tag size={18} className="text-red-500" /><span className="text-white text-sm font-semibold line-clamp-1">{genresStr}</span></div>
                                <div className="flex items-center gap-3"><Clock size={18} className="text-red-500" /><span className="text-white text-sm font-semibold">{movie.durationMinutes || 120} phút</span></div>
                                <div className="flex items-center gap-3"><Globe size={18} className="text-red-500" /><span className="text-white text-sm font-semibold">{countriesStr}</span></div>
                                <div className="flex items-center gap-3"><MessageSquare size={18} className="text-red-500" /><span className="text-white text-sm font-semibold">{movie.language || 'Phụ Đề'}</span></div>
                              </div>
                            </div>
                          </div>
                          <h3 className="text-white text-center font-bold text-sm mb-4 uppercase line-clamp-2 min-h-[40px] flex items-center justify-center group-hover:text-red-500 transition-colors">
                            {movie.titleVn}
                          </h3>
                        </Link>
                        <div className="flex items-center justify-between mt-auto px-1">
                          <Link to={detailLink} className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-lg text-red-500">play_circle</span>
                            <span className="underline decoration-1 underline-offset-2 text-xs font-semibold">Chi Tiết</span>
                          </Link>
                          <Link
                            to={detailLink}
                            className="text-white text-xs font-extrabold px-5 py-2 transition-all duration-200 hover:scale-105 active:scale-95 uppercase rounded-sm"
                            style={{
                              background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                              boxShadow: '0 4px 10px rgba(229, 9, 20, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                          >
                            ĐẶT VÉ
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                  {movies.length === 0 && (
                    <div className="w-[1100px] py-16 text-center text-gray-400 font-semibold">
                      Hiện chưa có phim đang chiếu.
                    </div>
                  )}
                </div>
              </div>

              {movies.length > 4 && (
                <button
                  onClick={slideRight}
                  className="absolute right-2 md:-right-6 top-[40%] -translate-y-1/2 z-40 w-12 h-16 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300 rounded-sm backdrop-blur-sm"
                >
                  <ChevronRight size={36} />
                </button>
              )}
            </div>

            {movies.length > 4 && (
              <div className="flex justify-center gap-2 mt-2 w-full">
                {Array.from({ length: Math.ceil(movies.length / 4) }).map((_, pageIdx) => {
                  const targetIndex = pageIdx * 4
                  const isActive = currentIndex === targetIndex || (currentIndex > targetIndex && currentIndex < targetIndex + 4)
                  return (
                    <button
                      key={pageIdx}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-red-500 scale-125 shadow-[0_0_8px_rgba(229,9,20,0.6)]' : 'bg-white/30 hover:bg-white/50'}`}
                      onClick={() => setCurrentIndex(targetIndex)}
                    />
                  )
                })}
              </div>
            )}

            <div className="flex justify-center mt-8 w-full">
              <Link
                to="/movies"
                className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-wider px-10 py-2.5 text-sm"
              >
                XEM THÊM
              </Link>
            </div>

          </div>
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
                    className="group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer"
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

      <style>{`
        .overflow-x-auto::-webkit-scrollbar { display: none; }
      `}</style>
    </motion.div>
  )
}