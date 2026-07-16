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
  const [selectedFormat, setSelectedFormat] = useState(null)

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

  // Extract unique format + language combinations
  const availableFormats = [...new Set(showtimes.map(st => `${st.format || '2D'} - ${st.language || 'Phụ đề'}`))]

  // Auto-select first format if none is selected or selected is not available
  useEffect(() => {
    if (availableFormats.length > 0 && (!selectedFormat || !availableFormats.includes(selectedFormat))) {
      setSelectedFormat(availableFormats[0])
    }
  }, [availableFormats, selectedFormat])

  const filteredShowtimes = showtimes.filter(st => `${st.format || '2D'} - ${st.language || 'Phụ đề'}` === selectedFormat)

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
      <GlassCard className="p-6 md:p-8 flex flex-col gap-6">
        {/* Date Picker */}
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base">calendar_today</span>
            Chọn ngày xem phim
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DAYS.map(d => (
              <button key={d.date} onClick={() => { setSelectedDate(d.date); setSelectedTime(''); setSelectedFormat(null); if (onDateChange) onDateChange() }} className={`day-btn ${selectedDate === d.date ? 'active' : ''}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDate === d.date ? 'text-white/70' : 'text-gray-500'}`}>{d.day}</span>
                <span className="text-xl font-black text-white">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        {!loading && showtimes.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-base">video_settings</span>
              Chọn định dạng
            </h3>
            <div className="flex flex-wrap gap-3">
              {availableFormats.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedFormat === fmt
                      ? 'bg-[var(--color-primary)] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)] border border-red-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Slots */}
        <div className="pt-2 border-t border-white/5">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base">schedule</span>
            Chọn suất chiếu — <span className="text-gray-400 font-semibold normal-case tracking-normal">{formatDate(selectedDate)}</span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-3xl text-[var(--color-primary)]">progress_activity</span>
            </div>
          ) : showtimes.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">Chưa có suất chiếu cho ngày này.</p>
          ) : filteredShowtimes.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">Không có suất chiếu cho định dạng này.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {filteredShowtimes.map(st => {
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
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Cinema info */}
        <div className="flex flex-wrap gap-4 pt-6 mt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">location_on</span>
            CineMate Rạp Trung Tâm
          </div>
          {selectedFormat && (
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase">
              <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">subtitles</span>
              {selectedFormat}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
