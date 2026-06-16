import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { movieService } from '../../services/movieService'

import maxo from '../../assets/maxo.png'
import lophocamsat from '../../assets/lophocamsat.png'
import kumathong from '../../assets/kumathong.png'
import amazing from '../../assets/amazing.png'
import xacsong from '../../assets/xacsong.png'
import spiderNoir from '../../assets/z7926548056551_31ba8c85180d00c18c1d766965b7f0d5.jpg'
import spiderman from '../../assets/z7926548206262_069a2a65c451a5d7f795d731f2371e47.jpg'
import backrooms from '../../assets/z7926549211322_474665675a42a9e64a53f3c58f96ca9f.jpg'

const MOCK_SHOWTIMES = [
  {
    id: 1,
    movieNameVn: 'MA XÓ (T18)',
    movieNameEnglish: 'MA XÓ',
    duration: 102,
    version: '2D phụ đề',
    smallImage: maxo,
    schedules: ['10:15', '13:00', '16:45', '19:30', '22:15']
  },
  {
    id: 2,
    movieNameVn: 'LỚP HỌC ÁM SÁT: GIỜ CỦA CHÚNG TA (T16)',
    movieNameEnglish: 'Lớp Học Ám Sát',
    duration: 110,
    version: '2D phụ đề',
    smallImage: lophocamsat,
    schedules: ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30']
  },
  {
    id: 3,
    movieNameVn: 'KUMANTHONG ÁC QUỶ DẪN ĐƯỜNG (T18)',
    movieNameEnglish: 'Kumanthong',
    duration: 95,
    version: '2D lồng tiếng',
    smallImage: kumathong,
    schedules: ['11:00', '14:30', '18:00', '20:30', '22:30']
  },
  {
    id: 7,
    movieNameVn: 'SPIDER-MAN: BRAND NEW DAY (K)',
    movieNameEnglish: 'Spider-man: Brand New Day',
    duration: 135,
    version: '2D lồng tiếng',
    smallImage: spiderman,
    schedules: ['08:30', '11:15', '14:00', '16:45', '19:30', '22:15']
  },
  {
    id: 8,
    movieNameVn: 'THE BACKROOMS (T16)',
    movieNameEnglish: 'The Backrooms',
    duration: 90,
    version: '2D phụ đề',
    smallImage: backrooms,
    schedules: ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30']
  }
]

// Khởi tạo mảng 7 ngày tới
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return { 
    date: d.toISOString().slice(0, 10), 
    label: d.getDate(), 
    day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()] 
  }
})

export default function ShowtimesPage() {
  const [movies, setMovies] = useState([])
  const [selectedDay, setSelectedDay] = useState(DAYS[0].date)
  const navigate = useNavigate()

  useEffect(() => { 
    movieService.getShowtimes()
      .then(r => {
        if (r.data && r.data.length > 0) {
          setMovies(r.data)
        } else {
          setMovies(MOCK_SHOWTIMES)
        }
      })
      .catch(() => {
        setMovies(MOCK_SHOWTIMES)
      }) 
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 pt-24 relative z-10 animate-fade-in">
      
      {/* Tiêu đề */}
      <div className="text-center mb-10">
        <h1 
          className="text-4xl md:text-5xl uppercase tracking-tighter mb-3"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'var(--color-on-surface)' }}
        >
          Lịch Chiếu <span style={{ color: 'var(--color-primary)' }}>Hôm Nay</span>
        </h1>
        <p style={{ fontFamily: 'Inter', color: 'var(--color-on-surface-variant)' }}>
          Chọn ngày và suất chiếu phù hợp với bạn
        </p>
      </div>

      {/* Thanh chọn ngày (Day selector) */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {DAYS.map(d => {
          const isActive = selectedDay === d.date
          return (
            <button 
              key={d.date} 
              onClick={() => setSelectedDay(d.date)}
              className="flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all duration-300 border"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: isActive 
                  ? 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)'
                  : 'color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent)',
                borderColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: isActive ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)',
                boxShadow: isActive ? '0 6px 20px rgba(229,9,20,0.4)' : 'none',
                transform: isActive ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-surface-container-highest) 80%, transparent)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent)'
              }}
            >
              <span className="text-xs font-medium uppercase tracking-wider mb-1 opacity-80">{d.day}</span>
              <span className="text-2xl font-bold font-['Montserrat']">{d.label.toString().padStart(2, '0')}</span>
            </button>
          )
        })}
      </div>

      {/* Danh sách phim & Suất chiếu */}
      <div className="flex flex-col gap-6">
        {movies.length === 0 && (
          <div className="text-center py-20 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 40%, transparent)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="material-symbols-outlined text-6xl mb-4" style={{ color: 'var(--color-surface-container-highest)' }}>event_busy</span>
            <p className="text-lg" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter' }}>
              Hiện chưa có lịch chiếu cho ngày này.
            </p>
          </div>
        )}

        {movies.map(movie => (
          <div 
            key={movie.id} 
            className="flex flex-col sm:flex-row gap-6 p-5 sm:p-6 rounded-2xl backdrop-blur-xl transition-colors duration-300"
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 50%, transparent)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {/* Poster phim */}
            <Link 
              to={`/movies/${movie.id}`}
              className="w-28 sm:w-36 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-black/20 shadow-lg block hover:scale-[1.03] transition-transform duration-300"
            >
              {movie.smallImage ? (
                <img src={movie.smallImage} alt={movie.movieNameVn} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-on-surface-variant)' }}>movie</span>
                </div>
              )}
            </Link>

            {/* Thông tin & Giờ chiếu */}
            <div className="flex-1 flex flex-col justify-center">
              <Link to={`/movies/${movie.id}`} className="hover:text-[var(--color-primary)] transition-colors w-fit block">
                <h3 
                  className="text-2xl font-bold mb-1" 
                  style={{ fontFamily: 'Montserrat, sans-serif', color: 'inherit' }}
                >
                  {movie.movieNameVn}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 mb-6 text-sm" style={{ fontFamily: 'Inter', color: 'var(--color-on-surface-variant)' }}>
                <span>{movie.movieNameEnglish}</span>
                <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                  {movie.duration} phút
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                <span className="px-2 py-0.5 rounded text-xs border" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--color-on-surface)' }}>
                  {movie.version || '2D'}
                </span>
              </div>

              {/* Lưới Giờ chiếu (Time slots) */}
              <div className="flex flex-wrap gap-3">
                {(movie.schedules || []).map(time => (
                  <button 
                    key={time} 
                    onClick={() => navigate(`/booking?movie=${movie.id}&time=${time}&date=${selectedDay}`)}
                    className="px-5 py-2 text-sm font-semibold rounded-lg border transition-all duration-300"
                    style={{ 
                      fontFamily: 'Inter',
                      borderColor: 'var(--color-primary)', 
                      color: 'var(--color-primary)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)'
                      e.currentTarget.style.color = 'var(--color-on-primary-container)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(229,9,20,0.4)'
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--color-primary)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {time}
                  </button>
                ))}
                
                {(!movie.schedules || movie.schedules.length === 0) && (
                  <p className="text-sm italic" style={{ color: 'var(--color-on-surface-variant)' }}>Chưa có suất chiếu.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}