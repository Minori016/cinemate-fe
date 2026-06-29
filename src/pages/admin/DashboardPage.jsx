import { useState, useEffect, useRef, useCallback } from 'react'
import { Film, Users, Ticket, Tag, TrendingUp, DollarSign, Activity, Search, ArrowRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { movieService } from '../../services/movieService'

const DEBOUNCE_MS = 400
const MIN_QUERY_LEN = 2

const stats = [
  {
    label: 'Tổng phim',
    value: '24',
    icon: Film,
    color: 'from-red-500/20 to-red-500/5',
    iconColor: 'text-red-500',
    borderColor: 'group-hover:border-red-500/30'
  },
  {
    label: 'Nhân viên',
    value: '12',
    icon: Users,
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
    borderColor: 'group-hover:border-blue-500/30'
  },
  {
    label: 'Vé bán hôm nay',
    value: '148',
    icon: Ticket,
    color: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-400',
    borderColor: 'group-hover:border-green-500/30'
  },
  {
    label: 'Khuyến mãi hoạt động',
    value: '5',
    icon: Tag,
    color: 'from-yellow-500/20 to-yellow-500/5',
    iconColor: 'text-yellow-400',
    borderColor: 'group-hover:border-yellow-500/30'
  },
]

const recentBookings = [
  { id: '1', user: 'Nguyễn Minh', movie: 'Assassin Classroom', time: '10 phút trước', price: '95,000đ', status: 'SUCCESS' },
  { id: '2', user: 'Lê Trọng Nghĩa', movie: 'Spider-man: Brand New Day', time: '25 phút trước', price: '120,000đ', status: 'SUCCESS' },
  { id: '3', user: 'Trần Thị A', movie: 'The Backrooms', time: '1 giờ trước', price: '95,000đ', status: 'PENDING' },
  { id: '4', user: 'Phạm Văn B', movie: 'Spider Noir', time: '2 giờ trước', price: '110,000đ', status: 'SUCCESS' },
]

const revenueData = [
  { day: 'Thứ 2', amount: 4200000, percentage: '45%' },
  { day: 'Thứ 3', amount: 5600000, percentage: '60%' },
  { day: 'Thứ 4', amount: 3800000, percentage: '40%' },
  { day: 'Thứ 5', amount: 7200000, percentage: '80%' },
  { day: 'Thứ 6', amount: 9800000, percentage: '100%' },
  { day: 'Thứ 7', amount: 8500000, percentage: '90%' },
  { day: 'Chủ nhật', amount: 9000000, percentage: '95%' },
]

export default function DashboardPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchResults = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    try {
      const r = await movieService.getAll({ search: keyword })
      const result = r.data?.result
      const list = result?.content || (Array.isArray(result) ? result : [])
      setResults(list.slice(0, 8))
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)
    clearTimeout(timerRef.current)
    if (val.trim().length >= MIN_QUERY_LEN) {
      setLoading(true)
      timerRef.current = setTimeout(() => {
        fetchResults(val)
        setShowDropdown(true)
      }, DEBOUNCE_MS)
    } else {
      setResults([])
      setShowDropdown(false)
    }
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    clearTimeout(timerRef.current)
    setShowDropdown(false)
    if (query.trim().length >= MIN_QUERY_LEN) {
      navigate(`/admin/movies?search=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleMovieClick = (movieId) => {
    clearTimeout(timerRef.current)
    setShowDropdown(false)
    navigate(`/admin/movies/edit/${movieId}`)
  }

  const handleViewAll = () => {
    clearTimeout(timerRef.current)
    setShowDropdown(false)
    if (query.trim()) {
      navigate(`/admin/movies?search=${encodeURIComponent(query.trim())}`)
    } else {
      navigate('/admin/movies')
    }
  }

  const highlight = (text) => {
    if (!query.trim() || !text) return text
    const keyword = query.trim()
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = String(text).split(regex)
    return parts.map((p, i) =>
      regex.test(p) ? (
        <mark key={i} className="bg-red-500/30 text-white rounded px-0.5">{p}</mark>
      ) : (
        <span key={i}>{p}</span>
      )
    )
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Welcome & Overview Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1
            className="text-4xl text-white font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Tổng Quan Hệ Thống
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Báo cáo thống kê thời gian thực & hoạt động bán vé hôm nay.
          </p>
        </div>
        <div
          className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-white/5 backdrop-blur-md"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-white tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Hệ thống trực tuyến
          </span>
        </div>
      </motion.div>

      {/* Movie Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="rounded-xl border border-[var(--color-border)] p-5 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Tìm kiếm phim nhanh
          </h2>
        </div>

        <div className="relative" ref={dropdownRef}>
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (!showDropdown || results.length === 0) return
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActiveIndex(prev => Math.max(prev - 1, -1))
                  } else if (e.key === 'Enter' && activeIndex >= 0) {
                    e.preventDefault()
                    handleMovieClick(results[activeIndex].id)
                  } else if (e.key === 'Escape') {
                    setShowDropdown(false)
                  }
                }}
                onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
                placeholder="Nhập tên phim (VN hoặc ENG) để tìm nhanh..."
                className="w-full pl-11 pr-32 py-3 rounded-lg bg-[var(--color-surface-2)] border border-white/10 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-24 text-xs text-[var(--color-text-muted)] hover:text-white px-2 py-1 transition-colors"
                >
                  Xóa
                </button>
              )}
              <button
                type="submit"
                disabled={loading || query.trim().length < MIN_QUERY_LEN}
                className="absolute right-1.5 flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>{loading ? 'Đang tìm...' : 'Tìm'}</span>
              </button>
            </div>
          </form>

          {/* Dropdown Results */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-[var(--color-border)] overflow-hidden z-50 shadow-2xl"
                style={{ backgroundColor: 'var(--color-surface)', maxHeight: '480px', overflowY: 'auto' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-[var(--color-text-muted)]">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tìm kiếm...
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                    Không tìm thấy phim nào với "<span className="text-white font-semibold">{query}</span>"
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-white/5">
                      {results.map((m, i) => (
                        <button
                          key={m.id}
                          onClick={() => handleMovieClick(m.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                            i === activeIndex
                              ? 'bg-red-500/10 border-l-2 border-red-500'
                              : 'hover:bg-[var(--color-surface-2)] border-l-2 border-transparent'
                          }`}
                        >
                          {m.posterUrl ? (
                            <img src={m.posterUrl} alt={m.titleVn} className="w-10 h-14 object-cover rounded shadow border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-10 h-14 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase shrink-0">N/A</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate" title={m.titleVn}>{highlight(m.titleVn)}</h4>
                            {m.titleEn && (
                              <p className="text-[11px] text-[var(--color-text-muted)] truncate" title={m.titleEn}>{highlight(m.titleEn)}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-red-400">{m.durationMinutes || 120} phút</span>
                              {m.version && <span className="text-[10px] text-[var(--color-text-muted)]">• {m.version}</span>}
                              {m.fromDate && <span className="text-[10px] text-[var(--color-text-muted)]">• {m.fromDate}</span>}
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-[var(--color-text-muted)] shrink-0" />
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t border-white/5 text-center">
                      <button
                        onClick={handleViewAll}
                        className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-1 w-full transition-colors"
                      >
                        Xem tất cả kết quả <ArrowRight size={12} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats Counter Section */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
      >
        {stats.map(s => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              className={`group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex items-center justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(229,9,20,0.08)] ${s.borderColor}`}
              variants={{ hidden: { opacity: 0, y: 24, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } } }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {s.label}
                </p>
                <p className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {s.value}
                </p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-br ${s.color} transition-all duration-300 group-hover:scale-110`}>
                <Icon className={`w-6 h-6 ${s.iconColor}`} />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue chart mockup */}
        <div
          className="lg:col-span-2 rounded-xl border border-[var(--color-border)] p-6 space-y-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Doanh thu tuần này
              </h2>
            </div>
            <div className="text-sm font-bold text-red-500 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <DollarSign className="w-4 h-4" />
              <span>49,100,000đ</span>
            </div>
          </div>

          {/* Bar Chart Simulation */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-white/5 pb-2">
            {revenueData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end relative">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] text-white py-1 px-1.5 rounded border border-white/10 absolute -translate-y-16 pointer-events-none whitespace-nowrap z-30">
                  {(d.amount / 1000000).toFixed(1)}M đ
                </div>
                <motion.div
                  className="w-full rounded-t-md bg-gradient-to-t from-red-600 to-rose-500 group-hover:from-red-500 group-hover:to-rose-400 group-hover:shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                  initial={{ height: 0 }}
                  animate={{ height: d.percentage }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                <span className="text-[10px] md:text-xs text-[var(--color-text-muted)] group-hover:text-white transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent booking list */}
        <div
          className="rounded-xl border border-[var(--color-border)] p-6 space-y-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Vé đặt gần đây
            </h2>
          </div>

          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
          >
            {recentBookings.map((b) => (
              <motion.div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-2)] border border-white/5 hover:border-white/10 transition-colors"
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-bold text-red-500">
                    {b.user.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white truncate max-w-[120px]" style={{ fontFamily: 'Inter, sans-serif' }} title={b.user}>
                      {b.user}
                    </h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px]">
                      {b.movie}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-white block" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {b.price}
                  </span>
                  <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${b.status === 'SUCCESS' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                    {b.status === 'SUCCESS' ? 'THÀNH CÔNG' : 'ĐANG XỬ LÝ'}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </motion.div>
  )
}