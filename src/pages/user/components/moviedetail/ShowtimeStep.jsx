import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { showtimeService, isPublicShowtimeStatus } from '../../../../services/showtimeService'

function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)' }}>
      {children}
    </div>
  )
}

export default function ShowtimeStep({ DAYS, selectedDate, setSelectedDate, selectedTime, setSelectedTime, setBookingStep, movie, movieId, onShowtimeSelect, onDateChange }) {
  const [showtimes, setShowtimes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!movieId || !selectedDate) return
    setLoading(true)
    showtimeService.getByMovie(movieId, selectedDate)
      .then(list => {
        const filtered = (list || []).filter(s => s && isPublicShowtimeStatus(s.status))
        setShowtimes(filtered)
      })
      .catch(() => setShowtimes([]))
      .finally(() => setLoading(false))
  }, [movieId, selectedDate])

  const extractTime = (startTime) => {
    if (!startTime) return ''
    return startTime.split('T')[1]?.substring(0, 5) || ''
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hôm nay') return 'Hôm nay'
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return dateString }
  }

  return (
    <motion.div key="step1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
      <GlassCard className="p-6 md:p-8">
        {/* Date Picker */}
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-base">calendar_today</span>
          Chọn ngày xem phim
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {DAYS.map(d => (
            <button key={d.date} onClick={() => { setSelectedDate(d.date); setSelectedTime(''); if (onDateChange) onDateChange() }} className={`day-btn ${selectedDate === d.date ? 'active' : ''}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDate === d.date ? 'text-white/70' : 'text-gray-500'}`}>{d.day}</span>
              <span className="text-xl font-black text-white">{d.label}</span>
            </button>
          ))}
        </div>

        {/* Time Slots */}
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-base">schedule</span>
          Chọn suất chiếu — <span className="text-gray-400 font-semibold normal-case tracking-normal">{formatDate(selectedDate)}</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="material-symbols-outlined animate-spin text-3xl text-[var(--color-primary)]">progress_activity</span>
          </div>
        ) : showtimes.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4 text-center">Chưa có suất chiếu cho ngày này.</p>
        ) : (
          <div className="flex flex-wrap gap-3 mb-6">
            {showtimes.map(st => {
              const time = extractTime(st.startTime)
              const isActive = selectedTime === time && selectedDate === selectedDate
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedTime(time)
                    if (onShowtimeSelect) onShowtimeSelect(st)
                    setBookingStep(2)
                  }}
                  className={`time-slot-btn ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-1">schedule</span>
                  {time}
                  {st.roomName && <span className="text-[10px] opacity-70 ml-1">· {st.roomName}</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Cinema info */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">location_on</span>
            CineMate Rạp Trung Tâm
          </div>
          {showtimes.length > 0 && showtimes[0].roomName && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">meeting_room</span>
              {showtimes[0].roomName}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">subtitles</span>
            {movie?.format || '2D'} — Phụ đề tiếng Việt
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
