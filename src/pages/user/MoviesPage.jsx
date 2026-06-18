import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Tag, Clock, Globe, MessageSquare, Search } from 'lucide-react'
import { movieService } from '../../services/movieService'
import { motion } from 'motion/react'

export default function MoviesPage() {
  const [activeTab, setActiveTab] = useState('now') // 'now' or 'soon'
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  
  const [searchVal, setSearchVal] = useState(searchQuery)
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => {
      setSearchVal(searchQuery)
    })
  }, [searchQuery])

  useEffect(() => {
    setIsLoading(true)
    const status = activeTab === 'now' ? 'now-showing' : 'coming-soon'
    movieService.getAll({ status, search: searchQuery, size: 100 })
      .then(res => {
        setMovies(res.data?.result?.content || res.data?.result || [])
      })
      .catch(() => {
        setMovies([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [activeTab, searchQuery])

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    setSearchParams(searchVal.trim() ? { search: searchVal.trim() } : {})
  }

  // Alphabetical sort (A-Z) (AC-02)
  const sortedMovies = [...movies].sort((a, b) => {
    const titleA = a.titleVn || a.titleEn || ''
    const titleB = b.titleVn || b.titleEn || ''
    return titleA.localeCompare(titleB, 'vi')
  })

  return (
    <motion.div
      className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Page Title */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Danh Sách Phim
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          Cập nhật lịch chiếu phim mới nhất, các bom tấn điện ảnh hấp dẫn không thể bỏ lỡ tại CineMate.
        </p>
      </motion.div>

      {/* Search Bar (AC-01 & AC-02) */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-md mx-auto mb-10">
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder="Tìm kiếm tên phim..." 
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="bg-[color-mix(in srgb,var(--color-surface-container-highest)_40%,transparent)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 w-full transition-colors font-medium shadow-inner"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        </div>
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-xl flex items-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider border-none outline-none"
        >
          <Search size={14} />
          Search
        </button>
      </form>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => setActiveTab('now')}
          className="px-6 py-2.5 font-bold text-sm tracking-wider uppercase transition-all duration-300 border-b-2"
          style={{
            color: activeTab === 'now' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
            borderColor: activeTab === 'now' ? 'var(--color-primary)' : 'transparent',
            backgroundColor: 'transparent',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          Phim Đang Chiếu
        </button>
        <button
          onClick={() => setActiveTab('soon')}
          className="px-6 py-2.5 font-bold text-sm tracking-wider uppercase transition-all duration-300 border-b-2"
          style={{
            color: activeTab === 'soon' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
            borderColor: activeTab === 'soon' ? 'var(--color-primary)' : 'transparent',
            backgroundColor: 'transparent',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          Phim Sắp Chiếu
        </button>
      </div>

      {/* Movies Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500 font-semibold flex flex-col items-center justify-center gap-2.5">
          <span className="animate-spin material-symbols-outlined text-5xl text-red-500">sync</span>
          <span className="text-base text-gray-400">Đang tải danh sách phim...</span>
        </div>
      ) : sortedMovies.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
          }}
        >
          {sortedMovies.map((movie) => {
            const genresStr = movie.genres?.map(g => g.name).join(', ') || 'Chưa phân loại'
            const countriesStr = movie.countries?.map(c => c.name).join(', ') || 'N/A'
            const titleStr = movie.titleVn || movie.titleEn || ''

            return (
              <motion.div
                key={movie.id}
                className="flex flex-col cursor-pointer"
                variants={{
                  hidden: { opacity: 0, y: 32, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                
                {/* Click card leads to details */}
                <Link to={`/movies/${movie.id}`} className="group flex flex-col flex-grow">
                  <div className="relative aspect-[2/3] overflow-hidden border border-white/10 shadow-lg mb-4 text-left">
                    {/* Badge */}
                    <div className="absolute top-0 left-0 z-30 flex">
                      <span className="bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 border-r border-b border-white/5">{movie.version || '2D'}</span>
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1">{movie.rating || 'K'}</span>
                    </div>
                    <img
                      src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'}
                      alt={titleStr}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Overlay details */}
                    <div className="absolute inset-0 bg-black/85 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center px-4">
                      <h3 className="text-white font-bold text-base mb-4 uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {titleStr}
                      </h3>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-red-500" />
                          <span className="text-white text-xs font-semibold line-clamp-1">{genresStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-red-500" />
                          <span className="text-white text-xs font-semibold">{movie.durationMinutes || 120} phút</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-red-500" />
                          <span className="text-white text-xs font-semibold">{countriesStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={14} className="text-red-500" />
                          <span className="text-white text-xs font-semibold">{movie.language || 'Phụ Đề'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
    
                  <h3 className="text-white text-center font-bold text-xs mb-3 uppercase line-clamp-2 min-h-[36px] flex items-center justify-center group-hover:text-red-500 transition-colors">
                    {titleStr}
                  </h3>
                </Link>
    
                {activeTab === 'now' ? (
                  <div className="flex items-center justify-between mt-auto px-1">
                    <Link to={`/movies/${movie.id}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-base text-red-500">play_circle</span>
                      <span className="underline decoration-1 underline-offset-2 text-[10px] font-semibold">Chi Tiết</span>
                    </Link>
                    <Link 
                      to={`/movies/${movie.id}`} 
                      className="text-white text-[10px] font-black px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95 uppercase rounded-sm"
                      style={{
                        background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                        boxShadow: '0 4px 10px rgba(229, 9, 20, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      ĐẶT VÉ
                    </Link>
                  </div>
                ) : (
                  <Link to={`/movies/${movie.id}`} className="text-center mt-auto block py-2 hover:opacity-80">
                    <span className="text-[11px] text-red-500 font-semibold uppercase tracking-wider">Xem Chi Tiết</span>
                  </Link>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <div className="text-center py-20 text-gray-500 font-semibold flex flex-col items-center justify-center gap-2.5">
          <span className="material-symbols-outlined text-5xl text-gray-600">search_off</span>
          <span className="text-base text-gray-400">Không tìm thấy bộ phim nào</span>
        </div>
      )}
    </motion.div>
  )
}
