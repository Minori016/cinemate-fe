import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Play, Calendar, Globe, DollarSign, User, Subtitles } from 'lucide-react'

function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)' }}>
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

export default function MovieInfo({ movie, movieId, onShowtimeSelect, onDateChange }) {
  if (!movie) return null

  const trailerUrl = movie.trailerUrl || movie.media?.find(m => m.mediaType === 'TRAILER')?.url || ''
  const posterUrl = movie.poster || movie.media?.find(m => m.mediaType === 'POSTER')?.url || ''
  const genreNames = movie.genres?.map(g => g.name) || []
  const actors = movie.actors || []

  return (
    <div className="flex flex-col gap-6 lg:border-l lg:border-white/5 lg:pl-8">
      {/* Trailer button */}
      {trailerUrl && (
        <button
          onClick={() => {/* trailer open handled by parent */}}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 cursor-pointer border-none text-white"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Play size={18} style={{ color: 'var(--color-primary)' }} />
          Xem Trailer
        </button>
      )}

      {/* Thông Tin Phim */}
      <GlassCard className="p-6">
        <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>Thông Tin Phim</h2>
        <div className="flex flex-col gap-0">
          {[
            { icon: <User size={16} />, label: 'Đạo Diễn', value: movie.director },
            { icon: <Calendar size={16} />, label: 'Ngày Chiếu', value: movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '' },
            { icon: <Globe size={16} />, label: 'Ngôn Ngữ', value: movie.language },
            { icon: <Subtitles size={16} />, label: 'Phụ Đề', value: movie.language?.includes('phụ đề') ? 'Tiếng Việt' : movie.language },
            { icon: <DollarSign size={16} />, label: 'Kinh Phí', value: movie.budget || 'Chưa rõ' },
          ].filter(item => item.value).map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-none">
              <span className="text-[var(--color-primary)] opacity-80">{icon}</span>
              <span className="text-xs flex-1 text-[var(--color-on-surface-variant)]">{label}</span>
              <span className="text-xs font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Thể Loại */}
      {genreNames.length > 0 && (
        <GlassCard className="p-6">
          <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>Thể Loại</h2>
          <div className="flex flex-wrap gap-2">
            {genreNames.map(g => (
              <span key={g} className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', color: 'var(--color-primary)' }}>{g}</span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Đánh Giá Khán Giả */}
      <GlassCard className="p-6 flex flex-col">
        <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>Đánh Giá Khán Giả</h2>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-glow-gold text-5xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>{movie.score || movie.rating || 'N/A'}</span>
          <div className="flex flex-col gap-1">
            <StarRating filled={4.5} half={true} />
            <span className="text-[10px] text-[var(--color-on-surface-variant)] font-medium">Sao đánh giá (4.5/5)</span>
          </div>
        </div>
        <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 font-medium">Được trên 2.500+ đánh giá đã xác thực.</p>
        <div className="mt-4 rounded-full overflow-hidden bg-white/8 h-1.5 w-full">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, var(--color-gold), #f59e0b)' }} initial={{ width: '0%' }} animate={{ width: `${movie.scoreValue || 85}%` }} transition={{ duration: 1.2, delay: 1.1 }} />
        </div>
      </GlassCard>

      {/* Tóm Tắt Nội Dung */}
      {movie.description && (
        <GlassCard className="p-6">
          <h2 className="mb-3 text-[var(--color-primary)] font-extrabold uppercase tracking-wider text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>Tóm Tắt Nội Dung</h2>
          <p className="leading-relaxed text-xs text-[var(--color-on-surface-variant)]" style={{ fontFamily: 'Inter, sans-serif', margin: 0 }}>{movie.description}</p>
        </GlassCard>
      )}

      {/* Diễn Viên */}
      {actors.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>Diễn Viên</h2>
          </div>
          <div className="flex flex-col gap-4">
            {actors.slice(0, 5).map(({ fullName, characterName, avatarUrl }) => (
              <div key={fullName} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-[var(--color-primary)] transition-all duration-300" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10 text-xs font-bold text-gray-400">{fullName.charAt(0)}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-xs font-bold text-white group-hover:text-[var(--color-primary)] transition-colors truncate">{fullName}</p>
                  <p className="m-0 text-[10px] text-[var(--color-on-surface-variant)] truncate">{characterName || 'Diễn viên'}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Hình Ảnh */}
      {movie.media && movie.media.length > 0 && (
        <GlassCard className="p-6">
          <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>Hình Ảnh</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {movie.media.filter(m => m.mediaType === 'POSTER' || m.mediaType === 'BANNER').map(m => (
              <img key={m.id} src={m.url} alt={m.title || ''} loading="lazy" decoding="async" className="h-32 rounded-lg object-cover flex-shrink-0 border border-white/10" />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
