import { motion, useMotionValue } from 'motion/react'
import { Link } from 'react-router-dom'
import { Play, Info, Ticket } from 'lucide-react'
import Badge from './Badge'

const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'

export default function MovieCard({
  movie,
  index = 0,
  onBookClick,
  showBookingButton = true,
  className = '',
}) {
  const posterUrl = movie.posterUrl || movie.poster || DEFAULT_POSTER
  const title = movie.titleVn || movie.titleEn || movie.title || 'Phim'
  const rating = movie.rating || 'K'
  const version = movie.version || '2D'
  const genres = movie.genres || []
  const duration = movie.duration || movie.durationMinutes
  const language = movie.language
  const countries = movie.countries?.map((c) => c.name).join(', ')
  const detailLink = `/movies/${movie.id}`

  const posterScale = useMotionValue(1)
  const overlayOpacity = useMotionValue(0)

  return (
    <motion.div
      className={`group flex flex-col ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.07,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
      onHoverStart={() => {
        posterScale.set(1.05)
        overlayOpacity.set(1)
      }}
      onHoverEnd={() => {
        posterScale.set(1)
        overlayOpacity.set(0)
      }}
    >
      <Link to={detailLink} className="group flex flex-col flex-grow">
        {/* Poster */}
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{
            aspectRatio: '2/3',
            background: 'linear-gradient(135deg, rgba(229,9,20,0.08), rgba(0,0,0,0.3))',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <motion.img
            src={posterUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ scale: posterScale }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            onError={(e) => {
              e.target.src = DEFAULT_POSTER
            }}
          />

          {/* Top badges */}
          <div className="absolute top-0 left-0 right-0 z-20 flex">
            <span
              className="text-[10px] font-bold px-2.5 py-1.5 text-white/80 border-r border-b border-white/5"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            >
              {version}
            </span>
            <Badge rating={rating} size="sm" className="rounded-none border-0" />
          </div>

          {/* Hover overlay */}
          <motion.div
            className="absolute inset-0 z-10 flex flex-col justify-end p-4"
            style={{
              opacity: overlayOpacity,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-2.5">
              {genres.length > 0 && (
                <p className="text-[11px] text-white/70 font-medium line-clamp-1">
                  {genres.map((g) => g.name || g).join(', ')}
                </p>
              )}
              {duration && <p className="text-[11px] text-white/50 font-medium">{duration} phút</p>}
              {language && <p className="text-[11px] text-white/50 font-medium">{language}</p>}
              {countries && <p className="text-[11px] text-white/50 font-medium">{countries}</p>}
            </div>
          </motion.div>

          {/* Shine effect */}
          <div
            className="absolute inset-0 z-[15] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
              opacity: overlayOpacity,
              transition: 'opacity 0.5s',
            }}
          />
        </div>

        {/* Title & Actions */}
        <div className="mt-3 flex flex-col gap-2">
          <h3
            className="text-white text-sm font-bold uppercase line-clamp-2 min-h-[40px] flex items-center transition-colors duration-200"
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.02em' }}
          >
            {title}
          </h3>
          <div className="flex items-center justify-between mt-auto">
            <Link
              to={detailLink}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors font-medium"
            >
              <Info size={13} className="text-[#e50914]/60" />
              <span className="underline decoration-1 underline-offset-2">Chi Tiết</span>
            </Link>
            {showBookingButton && (
              <motion.div
                whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.95, transition: { type: 'spring', stiffness: 500, damping: 25 } }}
              >
                <Link
                  to={detailLink}
                  className="flex items-center gap-1.5 text-white text-[11px] font-extrabold px-4 py-2 rounded-lg transition-all duration-200 uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, #e50914, #b3070f)',
                    boxShadow: '0 4px 12px rgba(229,9,20,0.3)',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  <Ticket size={11} />
                  ĐẶT VÉ
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
