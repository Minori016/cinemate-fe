import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { movieService } from '../../services/movieService'
import { showtimeService, isPublicShowtimeStatus } from '../../services/showtimeService'
import { cinemaService } from '../../services/cinemaService'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, Film, MapPin, Subtitles, Tv, Calendar } from 'lucide-react'
import RequireAuthModal from '../user/components/common/RequireAuthModal'

// Cấu hình danh sách 7 ngày tới với tiếng Việt đầy đủ dấu
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  const isToday = i === 0
  const dayName = isToday ? 'Hôm nay' : ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()]
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return {
    date: `${yyyy}-${mm}-${dd}`,
    label: d.getDate(),
    day: dayName,
    month: `T${d.getMonth() + 1}`
  }
})

function ErrorState({ message, onRetry }) {
  return (
    <div
      className="text-center py-16 rounded-2xl backdrop-blur-md"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <span className="material-symbols-outlined text-5xl mb-3 block text-red-500">cloud_off</span>
      <p className="text-sm mb-4 text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
        {message || 'Không thể tải dữ liệu. Vui lòng thử lại.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white transition-all cursor-pointer"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-6 p-5 sm:p-6 rounded-2xl border"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.05)'
          }}
        >
          <div className="w-28 sm:w-36 flex-shrink-0 aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
            <div className="flex gap-3 mt-2">
              {[1, 2, 3, 4].map(j => <div key={j} className="h-9 w-20 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ShowtimesPage() {
  const [movies, setMovies] = useState([])
  const [selectedDay, setSelectedDay] = useState(DAYS[0].date)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState([])
  const [selectedCinemaName, setSelectedCinemaName] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingShowtimeUrl, setPendingShowtimeUrl] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleShowtimeClick = (movieId, slot) => {
    const bookingUrl = `/movies/${movieId}?date=${selectedDay}&time=${slot.time}&roomId=${slot.roomId}`
    if (!user) {
      setPendingShowtimeUrl(bookingUrl)
      setShowAuthModal(true)
      return
    }
    navigate(bookingUrl)
  }

  // Lấy danh sách tên rạp duy nhất từ các phòng chiếu
  const cinemaNames = useMemo(() => {
    const set = new Set()
    rooms.forEach(r => { if (r.cinemaName) set.add(r.cinemaName) })
    return Array.from(set).sort()
  }, [rooms])

  // Lọc phòng chiếu theo rạp đã chọn
  const filteredRooms = useMemo(() => {
    if (!selectedCinemaName) return rooms
    return rooms.filter(r => r.cinemaName === selectedCinemaName)
  }, [rooms, selectedCinemaName])

  // Lấy danh sách phòng chiếu khi component mount
  useEffect(() => {
    cinemaService.getAll()
      .then(res => {
        const data = res.data?.result || res.data || []
        const mappedRooms = (Array.isArray(data) ? data : []).map((r, index) => {
          let cinemaName = r.cinemaName
          if (!cinemaName) {
            const mockCinemas = [
              'CineMate Quận 1',
              'CineMate Bình Thạnh',
              'CineMate Gò Vấp',
              'CineMate Thủ Đức'
            ]
            cinemaName = mockCinemas[index % mockCinemas.length]
          }
          return { ...r, cinemaName }
        })
        setRooms(mappedRooms)
      })
      .catch(() => setRooms([]))
  }, [])

  // Tải lịch chiếu theo bộ lọc (public API, không dùng admin)
  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoading(true)
      setError('')
      try {
        const showtimesRes = await showtimeService.getPublicShowtimes({ date: selectedDay })
        const allShowtimes = Array.isArray(showtimesRes) ? showtimesRes : []

        // Lọc theo tên rạp
        let filtered = allShowtimes
        if (selectedCinemaName) {
          const cinemaRoomIds = new Set(
            filteredRooms.map(r => String(r.id))
          )
          filtered = filtered.filter(st => cinemaRoomIds.has(String(st.roomId)))
        }
        // Lọc theo phòng chiếu
        if (selectedRoomId) {
          filtered = filtered.filter(st => String(st.roomId) === String(selectedRoomId))
        }

        // Nhóm các lịch chiếu theo bộ phim tương ứng
        const movieMap = new Map()
        filtered.forEach(st => {
          if (!st.startTime) return
          const stDate = st.startTime.split('T')[0]
          if (stDate !== selectedDay) return
          if (!isPublicShowtimeStatus(st.status)) return

          const mid = st.movieId
          if (!movieMap.has(mid)) {
            movieMap.set(mid, {
              id: mid,
              movieNameVn: st.movie || 'Chưa rõ tên',
              movieNameEnglish: '',
              duration: 120,
              version: st.format || '2D phụ đề',
              smallImage: '',
              schedules: [],
            })
          }
          const entry = movieMap.get(mid)
          const time = st.startTime.split('T')[1]?.substring(0, 5) || ''
          if (time && !entry.schedules.some(s => s.time === time && String(s.roomId) === String(st.roomId || ''))) {
            entry.schedules.push({ time, roomId: st.roomId || '', status: st.status || '' })
          }
          entry.schedules.sort((a, b) => a.time.localeCompare(b.time))
        })

        // Nạp thêm thông tin chi tiết phim (ảnh, tiếng Anh, thời lượng...)
        const movieIds = Array.from(movieMap.keys())
        if (movieIds.length > 0) {
          try {
            const moviesRes = await movieService.getAll({ size: 100 })
            const apiMovies = moviesRes.data || []
            apiMovies.forEach(m => {
              if (movieMap.has(m.id)) {
                const entry = movieMap.get(m.id)
                entry.movieNameEnglish = m.titleEn || ''
                entry.duration = m.duration || entry.duration
                entry.version = m.version || entry.version
                entry.smallImage = m.poster || entry.smallImage
              }
            })
          } catch { /* Bỏ qua nếu lỗi nạp thêm dữ liệu phụ */ }
        }

        setMovies(Array.from(movieMap.values()))
      } catch (err) {
        console.error('Failed to fetch showtimes:', err)
        setError('Không thể tải lịch chiếu. Vui lòng kiểm tra kết nối và thử lại.')
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

    fetchShowtimes()
  }, [selectedDay, selectedCinemaName, selectedRoomId, filteredRooms])

  return (
    <motion.div
      className="w-full max-w-5xl mx-auto px-6 py-12 pt-24 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Title */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1
          className="text-4xl md:text-5xl uppercase tracking-tighter mb-3"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 950,
            color: 'white',
            letterSpacing: '0.02em'
          }}
        >
          Lịch Chiếu <span style={{ background: 'linear-gradient(135deg, #e50914 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hôm Nay</span>
        </h1>
        <p className="text-xs text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
          Chọn ngày, rạp và suất chiếu phù hợp với bạn để đặt vé nhanh chóng
        </p>
      </motion.div>

      {/* Filters Banner: Day, Cinema, Room */}
      <div
        className="flex flex-col gap-6 mb-10 p-6 rounded-2xl border"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Day selector */}
        <div className="flex flex-col gap-2">
          <span
            className="text-[10px] uppercase font-bold tracking-widest text-center mb-1"
            style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat, sans-serif' }}
          >
            Chọn ngày chiếu
          </span>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
            {DAYS.map(d => {
              const isActive = selectedDay === d.date
              return (
                <button
                  key={d.date}
                  onClick={() => { setSelectedDay(d.date); setSelectedRoomId('') }}
                  className="flex-shrink-0 flex flex-col items-center justify-center w-[74px] h-[82px] rounded-xl transition-all duration-300 border cursor-pointer"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    background: isActive ? 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)' : 'rgba(255,255,255,0.03)',
                    borderColor: isActive ? 'rgba(229,9,20,0.5)' : 'rgba(255,255,255,0.08)',
                    color: isActive ? '#white' : 'rgba(255,255,255,0.7)',
                    boxShadow: isActive ? '0 8px 24px rgba(229,9,20,0.3)' : 'none',
                    transform: isActive ? 'scale(1.03)' : 'none'
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' } }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">{d.day}</span>
                  <span className="text-2xl font-black font-['Montserrat'] leading-none">{d.label.toString().padStart(2, '0')}</span>
                  <span className="text-[9px] font-medium opacity-50 mt-1">{d.month}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dropdowns filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cinema select */}
          <div className="flex flex-col gap-2 relative w-full text-left">
            <span
              className="text-[10px] uppercase font-bold tracking-widest"
              style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat, sans-serif' }}
            >
              Chọn rạp
            </span>
            <div className="relative">
              <select
                value={selectedCinemaName}
                onChange={e => { setSelectedCinemaName(e.target.value); setSelectedRoomId('') }}
                className="w-full appearance-none rounded-xl py-3 px-4 outline-none text-xs text-white transition-all cursor-pointer h-[44px]"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <option value="" className="bg-neutral-900">Tất cả rạp</option>
                {cinemaNames.map(c => <option key={c} value={c} className="bg-neutral-900">{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 flex items-center">
                <span className="material-symbols-outlined text-sm font-bold">keyboard_arrow_down</span>
              </div>
            </div>
          </div>

          {/* Room select */}
          <div className="flex flex-col gap-2 relative w-full text-left">
            <span
              className="text-[10px] uppercase font-bold tracking-widest"
              style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat, sans-serif' }}
            >
              Chọn phòng chiếu
            </span>
            <div className="relative">
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                disabled={filteredRooms.length === 0}
                className="w-full appearance-none rounded-xl py-3 px-4 outline-none text-xs text-white transition-all cursor-pointer h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <option value="" className="bg-neutral-900">Tất cả phòng</option>
                {filteredRooms.map(r => (
                  <option key={r.id} value={r.id} className="bg-neutral-900">{r.name} (Sức chứa: {r.capacity})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 flex items-center">
                <span className="material-symbols-outlined text-sm font-bold">keyboard_arrow_down</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && <ErrorState message={error} />}

      {/* Loading skeleton */}
      {loading && <LoadingSkeleton />}

      {/* Empty state */}
      {!loading && !error && movies.length === 0 && (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: 'rgba(255,255,255,0.15)' }}>event_busy</span>
          <p className="text-base font-bold text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
            Hiện chưa có lịch chiếu cho ngày này.
          </p>
          <p className="text-xs mt-2 text-white/40">
            Thử chọn ngày khác hoặc thay đổi bộ lọc rạp/phòng chiếu.
          </p>
        </div>
      )}

      {/* Movie list with showtimes */}
      {!loading && !error && movies.length > 0 && (
        <motion.div
          className="flex flex-col gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
          }}
        >
          {movies.map(movie => (
            <motion.div
              key={movie.id}
              className="flex flex-col sm:flex-row gap-6 p-5 sm:p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 border text-left"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.06)'
              }}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
              }}
              whileHover={{
                y: -4,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(229, 9, 20, 0.25)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                transition: { duration: 0.22 }
              }}
            >
              {/* Poster */}
              <Link
                to={`/movies/${movie.id}`}
                className="w-28 sm:w-36 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-black/20 shadow-lg block hover:scale-[1.03] transition-transform duration-300 relative group"
              >
                {movie.smallImage ? (
                  <img src={movie.smallImage} alt={movie.movieNameVn} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/30">
                    <Film size={32} />
                    <span className="text-[10px] mt-2 font-medium">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest bg-red-600/90 px-3.5 py-1.5 rounded-full" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Chi tiết
                  </span>
                </div>
              </Link>

              {/* Info & Time slots */}
              <div className="flex-1 flex flex-col justify-center">
                <Link to={`/movies/${movie.id}`} className="hover:text-[var(--color-primary)] transition-colors w-fit block">
                  <h3
                    className="text-2xl font-black mb-1.5 uppercase hover:text-red-500 transition-colors"
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      color: 'white',
                      letterSpacing: '0.01em'
                    }}
                  >
                    {movie.movieNameVn}
                  </h3>
                </Link>

                <div
                  className="flex flex-wrap items-center gap-3.5 mb-5 text-xs text-white/50"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {movie.movieNameEnglish && (
                    <span className="font-semibold text-white/70">{movie.movieNameEnglish}</span>
                  )}
                  {movie.movieNameEnglish && <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>}

                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-red-500" />
                    {movie.duration} phút
                  </span>

                  <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>

                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-white/80 font-bold uppercase tracking-wide">
                    <Tv size={12} className="text-red-500" />
                    {movie.version || '2D'}
                  </span>
                </div>

                {/* Time slots */}
                <div className="flex flex-wrap gap-3">
                  {(movie.schedules || []).map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => handleShowtimeClick(movie.id, slot)}
                      className="px-5 py-2.5 text-xs font-black rounded-xl border transition-all duration-200 cursor-pointer uppercase tracking-wider"
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        borderColor: 'rgba(229, 9, 20, 0.4)',
                        color: '#e50914',
                        backgroundColor: 'rgba(229, 9, 20, 0.08)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#e50914';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#e50914';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(229,9,20,0.4)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(229, 9, 20, 0.08)';
                        e.currentTarget.style.color = '#e50914';
                        e.currentTarget.style.borderColor = 'rgba(229, 9, 20, 0.4)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {slot.time}
                    </button>
                  ))}
                  {(!movie.schedules || movie.schedules.length === 0) && (
                    <p className="text-xs italic text-white/40">Chưa có suất chiếu nào cho ngày này.</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <RequireAuthModal
        open={showAuthModal}
        onLogin={() => {
          setShowAuthModal(false)
          if (pendingShowtimeUrl) {
            navigate('/login', { state: { from: { pathname: pendingShowtimeUrl.split('?')[0], search: `?${pendingShowtimeUrl.split('?')[1]}` } } })
          }
        }}
        onCancel={() => {
          setShowAuthModal(false)
          setPendingShowtimeUrl('')
        }}
      />
    </motion.div>
  )
}
