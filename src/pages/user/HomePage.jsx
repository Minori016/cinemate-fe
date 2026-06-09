import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { movieService } from '../../services/movieService'

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const location = useLocation()
  
  // Kiểm tra xem user có đang ở chính xác trang chủ "/" hay không
  const isRoot = location.pathname === '/'

  useEffect(() => {
    movieService.getAll()
      .then(r => setMovies(r.data))
      .catch(() => {})
  }, [])

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Chỉ render Banner và Grid Phim khi ở đúng đường dẫn "/" */}
      {isRoot && (
        <>
          {/* Hero Section Cinematic */}
          <div className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
              {/* Bạn có thể thay src bằng hình banner phim thực tế */}
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop"
                alt="Cinematic Background"
                className="w-full h-full object-cover object-center opacity-40"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, var(--color-background) 0%, transparent 60%, var(--color-background) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-primary) 15%, transparent) 0%, transparent 60%)',
                }}
              />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col items-start mt-20">
              <p
                className="mb-4 px-3 py-1 rounded-full border backdrop-blur-md"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: 'var(--color-on-primary-container)',
                  borderColor: 'rgba(255,255,255,0.2)',
                  backgroundColor: 'color-mix(in srgb, var(--color-primary-container) 40%, transparent)',
                }}
              >
                KHÁM PHÁ CINEPLEX PRO
              </p>
              
              <h1
                className="text-5xl md:text-7xl mb-6 tracking-tighter"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  color: 'var(--color-on-surface)',
                  lineHeight: '1.1',
                }}
              >
                Trải nghiệm <br />
                <span style={{ color: 'var(--color-primary)' }}>điện ảnh đỉnh cao</span>
              </h1>
              
              <p
                className="max-w-md mb-8 text-lg"
                style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-on-surface-variant)' }}
              >
                Hệ thống rạp chiếu phim chuẩn quốc tế với công nghệ hình ảnh và âm thanh sống động bậc nhất.
              </p>

              <Link
                to="/showtimes"
                className="py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                  color: 'var(--color-on-primary-container)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 4px 14px rgba(229,9,20,0.4)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.4)'}
              >
                <span className="material-symbols-outlined">local_activity</span>
                Đặt Vé Ngay
              </Link>
            </div>
          </div>

          {/* Movie Grid Section */}
          <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
            <div className="flex items-end justify-between mb-8">
              <h2
                className="text-3xl md:text-4xl"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800,
                  color: 'var(--color-on-surface)',
                  letterSpacing: '-0.02em',
                }}
              >
                Phim Đang Chiếu
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <Link key={movie.id} to={`/movies/${movie.id}`} className="group relative flex flex-col gap-3">
                  <div
                    className="relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(229,9,20,0.3)]"
                    style={{ backgroundColor: 'var(--color-surface-container-highest)' }}
                  >
                    {movie.smallImage ? (
                      <img
                        src={movie.smallImage}
                        alt={movie.movieNameVn}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>movie</span>
                        <span style={{ fontFamily: 'Inter', fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>No Image</span>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <button
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                      >
                        <span className="material-symbols-outlined" style={{ paddingLeft: '2px' }}>play_arrow</span>
                      </button>
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="flex flex-col">
                    <p
                      className="text-base font-bold truncate transition-colors group-hover:text-[var(--color-primary)]"
                      style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-on-surface)' }}
                      title={movie.movieNameVn}
                    >
                      {movie.movieNameVn}
                    </p>
                    <p
                      className="text-sm font-medium mt-1"
                      style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-on-surface-variant)' }}
                    >
                      {movie.version || '2D Phụ đề'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* NƠI HIỂN THỊ CÁC TRANG CON (Showtimes, Movie Detail) */}
      <Outlet />
    </div>
  )
}