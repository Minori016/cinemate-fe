import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Tag, Clock, Globe, MessageSquare, Star, Play, X, User, Calendar, DollarSign } from 'lucide-react'
import { movieService } from '../../services/movieService'
import { motion, AnimatePresence } from 'motion/react'

// Helper to format YouTube URLs into Embed URLs
const getEmbedUrl = (url) => {
  if (!url) return ''
  if (url.includes('youtube.com/embed/')) return url
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`
  }
  return url
}

// Sub-components matching user design system
function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`glass-panel rounded-xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)'
      }}
    >
      {children}
    </div>
  )
}

function StarRating({ filled = 4, half = true }) {
  return (
    <div className="flex gap-0.5" style={{ color: 'var(--color-gold)' }}>
      {Array.from({ length: Math.floor(filled) }).map((_, i) => (
        <span key={i} className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
      {half && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star_half</span>}
      {Array.from({ length: 5 - Math.ceil(filled) }).map((_, i) => (
        <span key={i} className="material-symbols-outlined opacity-35" style={{ fontSize: '18px' }}>star</span>
      ))}
    </div>
  )
}

export default function MovieDetailPage() {
  const { movieId } = useParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [trailerHovered, setTrailerHovered] = useState(false)

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'instant' })

    const fetchMovie = async () => {
      try {
        const res = await movieService.getById(movieId)
        const data = res.data?.result ?? res.data
        if (data) {
          // Fetch cast/actors
          let cast = []
          try {
            const actorsRes = await movieService.getActors(movieId)
            const actorsData = actorsRes.data?.result || actorsRes.data || []
            cast = actorsData.map(a => ({
              name: a.fullName,
              role: a.characterName || 'Diễn viên',
              img: a.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
            }))
          } catch (err) {
            console.error("Failed to fetch actors", err)
          }

          setMovie({
            title: data.titleVn || data.titleEn || 'Phim Chưa Đặt Tên',
            rating: data.rating || 'K',
            format: data.version || '2D',
            genre: data.genres?.map(g => g.name).join(', ') || 'Chưa phân loại',
            duration: data.durationMinutes ? `${data.durationMinutes} phút` : 'N/A',
            country: data.countries?.map(c => c.name).join(', ') || 'N/A',
            subtitle: data.language || 'Phụ Đề',
            backdrop: data.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200',
            poster: data.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300',
            synopsis: data.description || 'Chi tiết phim hiện chưa được cập nhật đầy đủ từ hệ thống.',
            cast: cast,
            score: '95%',
            scoreValue: 95,
            director: data.director || 'Đang cập nhật',
            releaseDate: data.fromDate ? new Date(data.fromDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Đang cập nhật',
            budget: 'N/A',
            language: data.language || 'Đang cập nhật',
            trailerUrl: getEmbedUrl(data.trailerUrl)
          })
        } else {
          setMovie(null)
        }
      } catch (err) {
        console.error("Failed to fetch movie details", err)
        setMovie(null)
      } finally {
        setLoading(false)
      }
    }
    fetchMovie()
  }, [movieId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-4xl">progress_activity</span>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-white gap-4">
        <p className="text-xl">Không tìm thấy thông tin phim!</p>
        <Link to="/" className="text-[var(--color-primary)] hover:underline">Quay về trang chủ</Link>
      </div>
    )
  }

  const getRatingBadge = (rating) => {
    let bgColor = 'bg-blue-600'
    if (rating === 'T18') bgColor = 'bg-red-700'
    else if (rating === 'T16') bgColor = 'bg-red-500'
    else if (rating === 'T13') bgColor = 'bg-orange-500'
    else if (rating === 'K' || rating === 'P') bgColor = 'bg-green-600'
    
    return (
      <span className={`${bgColor} text-white px-2.5 py-1 rounded font-bold text-xs shadow-md uppercase`}>
        {rating}
      </span>
    )
  }

  return (
    <div className="min-h-screen w-full relative pb-20 md:pb-8" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Hero Section ── */}
      <section className="relative w-full overflow-hidden" style={{ height: 'clamp(480px, 65vh, 820px)' }}>
        
        {/* Background image - Ken Burns effect */}
        <motion.img
          src={movie.backdrop}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.45]"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10 hero-gradient" />

        {/* Content bottom-anchored */}
        <div className="absolute bottom-0 w-full left-0 px-6 md:px-12 pb-10 z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-end">

            {/* Poster */}
            <motion.div
              className="hidden md:block w-44 lg:w-52 flex-shrink-0 z-30"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <img
                src={movie.poster}
                alt={`${movie.title} poster`}
                className="w-full rounded-xl shadow-2xl border border-white/10 transform hover:scale-[1.02] transition-transform duration-300"
                style={{
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                }}
              />
            </motion.div>

            {/* Info */}
            <motion.div
              className="flex flex-col gap-3 z-30 text-left flex-1 w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1
                className="text-glow-red"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(28px, 5vw, 56px)',
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {movie.title}
              </h1>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {getRatingBadge(movie.rating)}
                <span className="opacity-40">•</span>
                <span>{movie.duration}</span>
                <span className="opacity-40">•</span>
                <span>{movie.genre}</span>
                <span className="opacity-40">•</span>
                <span className="border border-white/15 px-2 py-0.5 rounded text-xs text-white bg-white/5">{movie.format}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  to="/showtimes"
                  className="flex items-center gap-2 py-3 px-8 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:scale-105 active:scale-95 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                    boxShadow: '0 6px 20px rgba(229,9,20,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>confirmation_number</span>
                  Đặt Vé Ngay
                </Link>

                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center gap-2 py-3 px-8 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white/20 hover:bg-white/10 hover:border-white/45 text-white bg-transparent"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>
                  Xem Trailer
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Content Area (Layout Grid 2:1) ── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-30">

        {/* Left: Synopsis + Trailer */}
        <motion.div
          className="lg:col-span-2 flex flex-col gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >

          {/* Synopsis */}
          <GlassCard className="p-8">
            <h2
              className="mb-4 text-[var(--color-primary)] font-extrabold uppercase tracking-wider text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Tóm Tắt Nội Dung
            </h2>
            <p className="leading-relaxed text-sm" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
              {movie.synopsis}
            </p>
          </GlassCard>

          {/* Trailer trigger */}
          <GlassCard
            className="overflow-hidden relative cursor-pointer group shadow-2xl"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setIsTrailerOpen(true)}
          >
            <div
              className="relative w-full h-full"
              onMouseEnter={() => setTrailerHovered(true)}
              onMouseLeave={() => setTrailerHovered(false)}
            >
              <img
                src={movie.backdrop}
                alt={`${movie.title} battle scene`}
                className="w-full h-full object-cover transition-all duration-500 opacity-55 scale-[1.01]"
                style={{ opacity: trailerHovered ? 0.75 : 0.55 }}
              />
              {/* Dark vignette */}
              <div className="absolute inset-0 bg-radial-[ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.5)_100%]" />
              
              {/* Play button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-black/60 border border-white/20 group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: '0 0 20px rgba(229,9,20,0.4)' }}
                >
                  <Play className="text-[var(--color-primary)] ml-1" size={24} fill="currentColor" />
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-white bg-black/45 px-4 py-1.5 rounded-full border border-white/5 shadow-md">
                  Xem Official Trailer
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right: Cast + Score + Details */}
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
        >

          {/* Cast & Crew */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Diễn Viên
              </h2>
              <span className="text-xs font-semibold text-[var(--color-gold)] cursor-pointer hover:underline tracking-wide">
                Xem tất cả
              </span>
            </div>

            <motion.div
              className="flex flex-col gap-4"
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 1.0 } } }}
            >
              {movie.cast.map(({ name, role, img }) => (
                <motion.div
                  key={name}
                  className="flex items-center gap-3 group"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } }
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-[var(--color-primary)] transition-all duration-300"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                  >
                    <img src={img} alt={name} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-bold text-white group-hover:text-[var(--color-primary)] transition-colors duration-200 truncate">{name}</p>
                    <p className="m-0 text-xs text-[var(--color-on-surface-variant)] truncate">{role}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </GlassCard>

          {/* Audience Score */}
          <GlassCard className="p-6 flex flex-col">
            <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Đánh Giá Khán Giả
            </h2>

            <div className="flex items-center gap-4 mb-2">
              <span
                className="text-glow-gold text-5xl font-black text-white"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  lineHeight: 1,
                }}
              >
                {movie.score}
              </span>
              <div className="flex flex-col gap-1">
                <StarRating filled={4.5} half={true} />
                <span className="text-[10px] text-[var(--color-on-surface-variant)] font-medium">Sao đánh giá (4.5/5)</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 font-medium">
              Dựa trên 2,500+ đánh giá đã xác thực.
            </p>

            {/* Score bar progress - animated */}
            <div className="mt-4 rounded-full overflow-hidden bg-white/8 h-1.5 w-full">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(to right, var(--color-gold), #f59e0b)` }}
                initial={{ width: '0%' }}
                animate={{ width: `${movie.scoreValue}%` }}
                transition={{ duration: 1.2, delay: 1.1, ease: 'easeOut' }}
              />
            </div>
          </GlassCard>

          {/* Quick info details */}
          <GlassCard className="p-6">
            <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Thông Tin Phim
            </h2>
            {[
              { icon: <User size={16} />, label: 'Đạo Diễn', value: movie.director },
              { icon: <Calendar size={16} />, label: 'Ngày Chiếu', value: movie.releaseDate },
              { icon: <MessageSquare size={16} />, label: 'Ngôn Ngữ', value: movie.language },
              { icon: <DollarSign size={16} />, label: 'Kinh Phí', value: movie.budget },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-none">
                <span className="text-[var(--color-primary)] opacity-80">{icon}</span>
                <span className="text-xs flex-1 text-[var(--color-on-surface-variant)]" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                <span className="text-xs font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</span>
              </div>
            ))}
          </GlassCard>

        </motion.div>
      </section>

      {/* ── YouTube Video Lightbox Modal with AnimatePresence ── */}
      <AnimatePresence>
        {isTrailerOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.93)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close trigger boundary */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsTrailerOpen(false)} />
            
            {/* Close button */}
            <motion.button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-6 right-6 z-[110] w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white flex items-center justify-center"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>

            {/* Iframe wrapper */}
            <motion.div
              className="w-full max-w-5xl aspect-video px-4 z-[105] relative"
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.4, ease: [0.34, 1.26, 0.64, 1] }}
            >
              <iframe
                title={`${movie.title} Trailer`}
                src={`${movie.trailerUrl}?autoplay=1&rel=0`}
                className="w-full h-full rounded-xl border border-white/10 shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles đã được thay thế bằng Motion React AnimatePresence */}
    </div>
  )
}
