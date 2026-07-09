import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { movieService } from '../../../services/movieService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, X, Loader2, Filter, ArrowRight, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const DEBOUNCE_MS = 200
const MIN_QUERY_LEN = 1
const MAX_SUGGESTIONS = 8
const CACHE_SIZE = 2000

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'NOW_SHOWING', label: 'Đang chiếu' },
  { value: 'COMING_SOON', label: 'Sắp chiếu' },
  { value: 'ENDED', label: 'Ngừng chiếu' },
]

const VERSION_OPTIONS = [
  { value: '', label: 'Tất cả phiên bản' },
  { value: '2D', label: '2D' },
  { value: '3D', label: '3D' },
  { value: 'IMAX', label: 'IMAX' },
  { value: '4DX', label: '4DX' },
]

// Bỏ dấu tiếng Việt để "thu" khớp "Thú", "Thư", "Thuận"...
const removeDiacritics = (str = '') => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
}

const highlight = (text, q) => {
  if (!q || !text) return text
  try {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${safe})`, 'ig'))
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase()
        ? <mark key={i} className="bg-transparent text-red-500 font-extrabold">{p}</mark>
        : p
    )
  } catch {
    return text
  }
}

const collectPageItems = (current, total) => {
  const items = []
  const push = (v) => { if (v >= 0 && v < total && !items.includes(v)) items.push(v) }
  push(0)
  push(total - 1)
  for (let off = -1; off <= 1; off++) push(current + off)
  if (current <= 2) { push(1); push(2); push(3) }
  if (current >= total - 3) { push(total - 2); push(total - 3); push(total - 4) }
  if (current - 10 >= 0) push(current - 10)
  if (current + 10 < total) push(current + 10)
  return items.sort((a, b) => a - b)
}

const buildVisiblePages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => ({ type: 'page', value: i }))
  const items = collectPageItems(current, total)
  const out = []
  let prev = -1
  for (const idx of items) {
    if (prev !== -1 && idx - prev > 1) {
      out.push({ type: 'ellipsis', key: `e-${prev}-${idx}` })
    }
    out.push({ type: 'page', value: idx })
    prev = idx
  }
  return out
}

// Cấu hình Fuse: multi-key, có trọng số, threshold cho phép sai 1-2 ký tự
const fuseOptions = {
  keys: [
    { name: 'titleVn', weight: 5 },
    { name: 'titleEn', weight: 4 },
    { name: 'director', weight: 2 },
    { name: 'version', weight: 2 },
    { name: 'genre', weight: 1 },
    { name: 'actorNames', weight: 3 },
  ],
  includeMatches: true,
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 1,
  useExtendedSearch: false,
  getFn: (obj, path) => {
    const val = path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
    return removeDiacritics(String(val ?? ''))
  },
}

export default function MovieListPage() {
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Search bar state
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggLoading, setSuggLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const timerRef = useRef(null)

  // Filter state
  const [status, setStatus] = useState('')
  const [version, setVersion] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // ====== Fuse: cache toàn bộ phim 1 lần → search local ======
  const [allMovies, setAllMovies] = useState([])
  const [cacheLoaded, setCacheLoaded] = useState(false)

  // Mỗi lần allMovies thay đổi, tạo lại Fuse index
  const fuse = useMemo(() => new Fuse(allMovies, fuseOptions), [allMovies])

  // Chuẩn hoá movie từ backend → có thêm actorNames (chuỗi phẳng) để Fuse quét
  const normalizeForFuse = (m) => ({
    ...m,
    actorNames: (m.actors || []).map(a => a.fullName || a.name || '').join(' '),
  })

  useEffect(() => {
    let cancelled = false
    const loadCache = async () => {
      try {
        const r = await movieService.getAll({ page: 0, size: CACHE_SIZE })
        if (!cancelled) {
          setAllMovies((r.data || []).map(normalizeForFuse))
          setCacheLoaded(true)
        }
      } catch (err) {
        console.error('Fuse cache load error:', err)
        if (!cancelled) setCacheLoaded(true)
      }
    }
    loadCache()
    return () => { cancelled = true }
  }, [])

  // Sau khi xoá phim → đồng bộ cache
  useEffect(() => {
    if (!cacheLoaded) return
    setAllMovies(prev => prev.map(m =>
      m.id === deleteTarget?.id ? { ...m, status: 'ENDED' } : m
    ).filter(Boolean))
  }, [deleteTarget, cacheLoaded])

  const hasActiveFilter = !!(query.trim() || status || version || fromDate)

  const buildParams = (pageNum) => {
    const params = { page: pageNum, size }
    const q = query.trim()
    if (q) params.search = q
    if (status) params.status = status
    if (version) params.version = version
    if (fromDate) params.fromDate = fromDate
    return params
  }

  const load = (pageNum = 0) => {
    setLoading(true)
    return movieService.getAll(buildParams(pageNum))
      .then(r => {
        setMovies(r.data || [])
        setPage(r.currentPage ?? pageNum)
        setTotalPages(r.totalPages ?? 1)
        setTotalElements(r.totalElements ?? (r.data?.length || 0))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, [])

  // ====== Dropdown dùng Fuse (local) — không gọi API ======
  const runFuse = useCallback((keyword) => {
    if (!keyword.trim()) {
      setSuggestions([])
      setSuggLoading(false)
      return
    }
    const norm = removeDiacritics(keyword)
    const results = fuse.search(norm, { limit: MAX_SUGGESTIONS })
    setSuggestions(results.map(r => r.item))
    setSuggLoading(false)
  }, [fuse])

  const onQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)
    clearTimeout(timerRef.current)
    if (val.trim().length >= MIN_QUERY_LEN) {
      setSuggLoading(true)
      setShowDropdown(true)
      timerRef.current = setTimeout(() => runFuse(val), DEBOUNCE_MS)
    } else {
      setSuggestions([])
      setShowDropdown(false)
      setSuggLoading(false)
    }
  }

  const applyMainFilter = (pageNum = 0) => {
    clearTimeout(timerRef.current)
    setShowDropdown(false)
    setActiveIndex(-1)
    load(pageNum)
  }

  const handleClearAll = () => {
    setQuery('')
    setStatus('')
    setVersion('')
    setFromDate('')
    setSuggestions([])
    setShowDropdown(false)
    setActiveIndex(-1)
    clearTimeout(timerRef.current)
    movieService.getAll({ page: 0, size })
      .then(r => {
        setMovies(r.data || [])
        setPage(r.currentPage ?? 0)
        setTotalPages(r.totalPages ?? 1)
        setTotalElements(r.totalElements ?? (r.data?.length || 0))
      })
  }

  const handleSuggestionClick = (movieId) => {
    clearTimeout(timerRef.current)
    setShowDropdown(false)
    setActiveIndex(-1)
    setSuggestions([])
    navigate(`/admin/movies/edit/${movieId}`)
  }

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const onClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await movieService.deleteAdmin(deleteTarget.id)
      setMovies(prev => prev.map(m => m.id === deleteTarget.id ? { ...m, status: 'ENDED' } : m))
    } catch (err) {
      console.error('Lỗi khi xóa phim:', err)
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa phim.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'poster', label: 'Poster', render: r => r.posterUrl ? <img src={r.posterUrl} alt="poster" className="w-12 h-16 object-cover rounded shadow border border-white/10" /> : <div className="w-12 h-16 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">N/A</div> },
    { key: 'titleEn', label: 'Tên (ENG)', render: r => <span className="font-semibold text-[var(--color-on-surface)]">{r.titleEn}</span> },
    { key: 'titleVn', label: 'Tên (VN)', render: r => <span className="font-bold text-[var(--color-on-surface)]">{r.titleVn}</span> },
    { key: 'status', label: 'Trạng thái', render: r => {
      const colors = { COMING_SOON: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', NOW_SHOWING: 'bg-green-500/10 text-green-500 border-green-500/20', ENDED: 'bg-red-500/10 text-red-500 border-red-500/20' }
      const labels = { COMING_SOON: 'Sắp chiếu', NOW_SHOWING: 'Đang chiếu', ENDED: 'Ngừng chiếu' }
      return <span className={`px-2 py-1 rounded text-xs border whitespace-nowrap ${colors[r.status] || 'bg-gray-500/10 text-gray-400'}`}>{labels[r.status] || r.status || 'N/A'}</span>
    }},
    { key: 'fromDate', label: 'Từ ngày' },
    { key: 'durationMinutes', label: 'Thời lượng', render: r => `${r.durationMinutes || 120} phút` },
    { key: 'version', label: 'Phiên bản' },
  ]

  const activeFilterChips = [
    query.trim() ? { key: 'q', label: `"${query.trim()}"`, onRemove: () => { setQuery(''); setSuggestions([]); setShowDropdown(false); applyMainFilter(0) } } : null,
    status ? { key: 'st', label: STATUS_OPTIONS.find(o => o.value === status)?.label || status, onRemove: () => { setStatus(''); applyMainFilter(0) } } : null,
    version ? { key: 'v', label: version, onRemove: () => { setVersion(''); applyMainFilter(0) } } : null,
    fromDate ? { key: 'd', label: `Từ ${fromDate}`, onRemove: () => { setFromDate(''); applyMainFilter(0) } } : null,
  ].filter(Boolean)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        className="flex justify-between items-start mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div>
          <h1
            className="text-4xl text-[var(--color-on-surface)] font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý phim
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Quản lý danh mục phim, thông tin chi tiết, thời lượng và phiên bản trình chiếu tại rạp.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/movies/add')}>
          <Plus size={16} className="mr-1" /> Thêm phim
        </Button>
      </motion.div>

      {/* Sticky search bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="sticky top-0 z-30 -mx-8 lg:-mx-10 px-8 lg:px-10 py-3 backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 88%, transparent)' }}
      >
        <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-3 shadow-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1 min-w-0" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={onQueryChange}
                onKeyDown={(e) => {
                  if (!showDropdown) return
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActiveIndex(prev => Math.max(prev - 1, -1))
                  } else if (e.key === 'Enter' && activeIndex >= 0) {
                    e.preventDefault()
                    handleSuggestionClick(suggestions[activeIndex].id)
                  } else if (e.key === 'Escape') {
                    setShowDropdown(false)
                  }
                }}
                onFocus={() => { if (suggestions.length > 0 || suggLoading) setShowDropdown(true) }}
                placeholder="Tìm phim..."
                className="w-full pl-10 pr-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-white/10 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus() }}
                  title="Xóa từ khoá"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              )}

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-[var(--color-border)] overflow-hidden z-50 shadow-2xl"
                    style={{ backgroundColor: 'var(--color-surface)', maxHeight: '420px', overflowY: 'auto' }}
                  >
                    {suggLoading ? (
                      <div className="flex items-center justify-center py-6 text-sm text-[var(--color-text-muted)]">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tìm...
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="text-center py-6 text-sm text-[var(--color-text-muted)]">
                        Không tìm thấy phim với "<span className="text-[var(--color-on-surface)] font-semibold">{query}</span>"
                      </div>
                    ) : (
                      <>
                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-white/5 flex items-center justify-between">
                          <span>{suggestions.length} gợi ý (Fuse local)</span>
                          <span className="text-[9px] text-emerald-400">⚡ instant</span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {suggestions.map((m, i) => (
                            <button
                              key={m.id}
                              onClick={() => handleSuggestionClick(m.id)}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                                i === activeIndex
                                  ? 'bg-red-500/10 border-l-2 border-red-500'
                                  : 'hover:bg-[var(--color-surface-2)] border-l-2 border-transparent'
                              }`}
                            >
                              {m.posterUrl ? (
                                <img src={m.posterUrl} alt={m.titleVn} className="w-9 h-12 object-cover rounded shadow border border-white/10 shrink-0" />
                              ) : (
                                <div className="w-9 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase shrink-0">N/A</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-[var(--color-on-surface)] truncate" title={m.titleVn}>
                                  {highlight(m.titleVn, query.trim())}
                                </h4>
                                {m.titleEn && (
                                  <p className="text-[11px] text-[var(--color-text-muted)] truncate" title={m.titleEn}>
                                    {highlight(m.titleEn, query.trim())}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-red-400">{m.duration || 120} phút</span>
                                  {m.version && <span className="text-[10px] text-[var(--color-text-muted)]">• {m.version}</span>}
                                  {m.fromDate && <span className="text-[10px] text-[var(--color-text-muted)]">• {m.fromDate}</span>}
                                </div>
                              </div>
                              <ArrowRight size={14} className="text-[var(--color-text-muted)] shrink-0" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 items-center">
              <Button variant="secondary" onClick={() => setShowFilters(s => !s)}>
                <Filter size={14} className="mr-1.5" /> Bộ lọc
                {hasActiveFilter && <span className="ml-1.5 w-2 h-2 rounded-full bg-red-500" />}
              </Button>
              {hasActiveFilter && (
                <Button variant="secondary" onClick={handleClearAll} title="Xóa toàn bộ bộ lọc">
                  <X size={14} className="mr-1.5" /> Xóa
                </Button>
              )}
              <Button onClick={() => applyMainFilter(0)}>
                <Search size={14} className="mr-1.5" /> Tìm
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-hidden"
              >
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setTimeout(() => applyMainFilter(0), 0) }}
                    className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-2)] border border-white/10 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-red-500/50 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">Phiên bản</label>
                  <select
                    value={version}
                    onChange={(e) => { setVersion(e.target.value); setTimeout(() => applyMainFilter(0), 0) }}
                    className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-2)] border border-white/10 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-red-500/50 cursor-pointer"
                  >
                    {VERSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">Từ ngày</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => { setFromDate(e.target.value); setTimeout(() => applyMainFilter(0), 0) }}
                      className="w-full pl-10 pr-3 h-9 rounded-lg bg-[var(--color-surface-2)] border border-white/10 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-red-500/50 cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeFilterChips.map(c => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"
                >
                  {c.label}
                  <button onClick={c.onRemove} className="hover:text-white transition-colors" title="Bỏ lọc">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        <Table columns={columns} data={movies} actions={row => (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="info" onClick={() => navigate(`/admin/movies/edit/${row.id}`)}><Pencil size={12}/></Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 size={12}/></Button>
          </div>
        )} />

        {totalPages > 0 && (() => {
          const visible = buildVisiblePages(page, totalPages)
          const canPrev = page > 0 && !loading
          const canNext = page < totalPages - 1 && !loading
          const jumpPrev = Math.max(0, page - 10)
          const jumpNext = Math.min(totalPages - 1, page + 10)
          const canJumpPrev = page - 10 >= 0 && !loading
          const canJumpNext = page + 10 < totalPages && !loading
          const fromItem = movies.length === 0 ? 0 : page * size + 1
          const toItem = page * size + movies.length
          return (
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex justify-center items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => canJumpPrev && load(jumpPrev)}
                  disabled={!canJumpPrev}
                  title="Lùi 10 trang"
                  className="h-9 px-3 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <ChevronLeft size={14} className="-ml-3" />
                  <span>10 trước</span>
                </button>
                <button
                  onClick={() => canPrev && load(page - 1)}
                  disabled={!canPrev}
                  title="Trang trước"
                  className="w-9 h-9 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                {visible.map((item, idx) => {
                  if (item.type === 'ellipsis') {
                    return (
                      <span
                        key={item.key}
                        className="w-9 h-9 flex items-center justify-center text-[var(--color-text-muted)] select-none"
                      >
                        …
                      </span>
                    )
                  }
                  const isCurrent = page === item.value
                  return (
                    <button
                      key={`p-${item.value}`}
                      onClick={() => !isCurrent && !loading && load(item.value)}
                      disabled={isCurrent || loading}
                      className={`w-9 h-9 flex items-center justify-center font-bold text-xs rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#e50914] to-[#b3070f] text-white shadow-md shadow-[rgba(229,9,20,0.2)]'
                          : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-2)] disabled:cursor-default'
                      }`}
                    >
                      {item.value + 1}
                    </button>
                  )
                })}

                <button
                  onClick={() => canNext && load(page + 1)}
                  disabled={!canNext}
                  title="Trang sau"
                  className="w-9 h-9 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => load(jumpNext)}
                  disabled={!canJumpNext}
                  title="Sau 10 trang"
                  className="h-9 px-3 bg-gradient-to-r from-[#e50914] to-[#b3070f] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-1 text-xs font-bold transition-opacity cursor-pointer shadow-md shadow-[rgba(229,9,20,0.25)]"
                >
                  <span>{canJumpNext ? '10 phim kế' : 'Hết trang'}</span>
                  <ChevronRight size={14} />
                  <ChevronRight size={14} className="-ml-3" />
                </button>
              </div>
            </div>
          )
        })()}
      </motion.div>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Bạn có chắc muốn xóa phim <span className="text-[var(--color-on-surface)] font-semibold">"{deleteTarget?.titleVn}"</span>?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </motion.div>
  )
}
