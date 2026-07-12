import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { movieService } from '../../../services/movieService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, X, Loader2, Filter, ArrowRight, Calendar, Film, Star, Hash, ChevronDown, Clock, Sparkles, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const DEBOUNCE_MS = 200
const MIN_QUERY_LEN = 1
const MAX_SUGGESTIONS = 8
const CACHE_SIZE = 2000

const STATUS_OPTIONS = [
  { value: '', label: 'Tat ca trang thai' },
  { value: 'NOW_SHOWING', label: 'Dang chieu' },
  { value: 'COMING_SOON', label: 'Sap chieu' },
  { value: 'ENDED', label: 'Ngung chieu' },
]

const VERSION_OPTIONS = [
  { value: '', label: 'Tat ca phien ban' },
  { value: '2D', label: '2D' },
  { value: '3D', label: '3D' },
  { value: 'IMAX', label: 'IMAX' },
  { value: '4DX', label: '4DX' },
]

const STATUS_META = {
  COMING_SOON: { label: 'Sap chieu', bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-700' },
  NOW_SHOWING: { label: 'Dang chieu', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-700' },
  ENDED: { label: 'Ngung chieu', bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-700' },
}

const removeDiacritics = (str = '') => {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

const collectPageItems = (current, total) => {
  const items = []
  const push = (v) => { if (v >= 0 && v < total && !items.includes(v)) items.push(v) }
  push(0); push(total - 1)
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
    if (prev !== -1 && idx - prev > 1) out.push({ type: 'ellipsis', key: `e-${prev}-${idx}` })
    out.push({ type: 'page', value: idx })
    prev = idx
  }
  return out
}

const fuseOptions = {
  keys: [
    { name: 'titleVn', weight: 5 },
    { name: 'titleEn', weight: 4 },
    { name: 'director', weight: 2 },
    { name: 'version', weight: 2 },
    { name: 'genre', weight: 1 },
    { name: 'actorNames', weight: 3 },
  ],
  includeMatches: true, includeScore: true, threshold: 0.4,
  ignoreLocation: true, minMatchCharLength: 1, useExtendedSearch: false,
  getFn: (obj, path) => {
    const val = path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
    return removeDiacritics(String(val ?? ''))
  },
}

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
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

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggLoading, setSuggLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const timerRef = useRef(null)

  const [status, setStatus] = useState('')
  const [version, setVersion] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [allMovies, setAllMovies] = useState([])
  const [cacheLoaded, setCacheLoaded] = useState(false)

  const fuse = useMemo(() => new Fuse(allMovies, fuseOptions), [allMovies])
  const normalizeForFuse = (m) => ({ ...m, actorNames: (m.actors || []).map(a => a.fullName || a.name || '').join(' ') })

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
    setQuery(''); setStatus(''); setVersion(''); setFromDate('')
    setSuggestions([]); setShowDropdown(false); setActiveIndex(-1)
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

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
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
      console.error('Loi khi xoa phim:', err)
      alert(err.response?.data?.message || 'Co loi xay ra khi xoa phim.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'poster',
      label: 'Poster',
      render: r => r.posterUrl ? (
        <div className="relative inline-block">
          <img src={r.posterUrl} alt="poster" className="w-14 h-20 object-cover rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]" />
        </div>
      ) : (
        <div className="w-14 h-20 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-[9px] font-black text-slate-400 uppercase">
          <Film size={14} className="mb-0.5" />
          N/A
        </div>
      )
    },
    {
      key: 'titleEn',
      label: 'Ten (ENG)',
      render: r => (
        <div>
          <p className="text-sm font-black text-slate-900 truncate max-w-[180px]">{r.titleEn}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{r.director || 'Unknown'}</p>
        </div>
      )
    },
    {
      key: 'titleVn',
      label: 'Ten (VN)',
      render: r => (
        <div>
          <p className="text-sm font-black text-slate-900 truncate max-w-[180px]">{r.titleVn}</p>
          {r.genre && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{r.genre}</p>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Trang thai',
      render: r => {
        const meta = STATUS_META[r.status] || { label: r.status || 'N/A', bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-700' }
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 ${meta.bg} ${meta.text} ${meta.border} shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {meta.label}
          </span>
        )
      }
    },
    {
      key: 'fromDate',
      label: 'Tu ngay',
      render: r => r.fromDate ? (
        <span className="text-xs font-bold text-slate-700 font-mono">{r.fromDate}</span>
      ) : <span className="text-xs font-bold text-slate-400">--</span>
    },
    {
      key: 'durationMinutes',
      label: 'Thoi luong',
      render: r => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-100 border-2 border-sky-700 rounded-md shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <Clock size={11} className="text-sky-800" strokeWidth={3} />
          <span className="text-[10px] font-black text-sky-900">{r.duration || 120} ph</span>
        </div>
      )
    },
    {
      key: 'version',
      label: 'Phien ban',
      render: r => r.version ? (
        <span className="px-2.5 py-1 bg-violet-100 border-2 border-violet-700 text-violet-900 rounded-md text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          {r.version}
        </span>
      ) : <span className="text-xs font-bold text-slate-400">--</span>
    }
  ]
  // Active filter chips
  const activeFilterChips = [
    query.trim() ? { key: 'q', label: `"${query.trim()}"`, onRemove: () => { setQuery(''); setSuggestions([]); setShowDropdown(false); applyMainFilter(0) } } : null,
    status ? { key: 'st', label: STATUS_OPTIONS.find(o => o.value === status)?.label || status, onRemove: () => { setStatus(''); applyMainFilter(0) } } : null,
    version ? { key: 'v', label: version, onRemove: () => { setVersion(''); applyMainFilter(0) } } : null,
    fromDate ? { key: 'd', label: `Tu ${fromDate}`, onRemove: () => { setFromDate(''); applyMainFilter(0) } } : null,
  ].filter(Boolean)

  return (
    <div className="text-left space-y-6">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Film size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> MOVIE LIBRARY
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {totalElements} phim
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly<br /><span className="text-red-600">danh muc phim</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Quan ly danh muc phim, thong tin chi tiet, thoi luong va phien ban trinh chieu tai rap.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/movies/add')}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs rounded-2xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} /> Them phim
            </button>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-visible relative z-20">
        <div className="flex items-stretch border-b-2 border-slate-900 rounded-t-3xl overflow-hidden">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-sky-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Tim kiem va loc</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Tim theo ten, dao dien, dien vien (Fuse local instant)</p>
            </div>
            <Filter size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1 min-w-0" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" strokeWidth={2.5} />
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
                placeholder="Tim phim theo ten, dao dien, dien vien..."
                className="w-full pl-10 pr-10 h-11 rounded-xl bg-amber-50/50 border-2 border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-amber-50 transition-all font-bold"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus() }}
                  title="Xoa tu khoa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-600 p-1 transition-colors"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 border-slate-900 overflow-hidden z-50 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] bg-white"
                    style={{ maxHeight: '420px', overflowY: 'auto' }}
                  >
                    {suggLoading ? (
                      <div className="flex items-center justify-center py-6 text-sm text-slate-600 font-bold">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Dang tim...
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="text-center py-6 text-sm text-slate-500 font-bold">
                        Khong tim thay phim voi "<span className="text-slate-900 font-black">{query}</span>"
                      </div>
                    ) : (
                      <>
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 border-b-2 border-slate-900 flex items-center justify-between bg-sky-100">
                          <span>{suggestions.length} goi y (Fuse local)</span>
                          <span className="text-[9px] text-emerald-700 font-black">⚡ instant</span>
                        </div>
                        <div className="divide-y-2 divide-slate-100">
                          {suggestions.map((m, i) => (
                            <button
                              key={m.id}
                              onClick={() => handleSuggestionClick(m.id)}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${i === activeIndex ? 'bg-amber-100 border-l-4 border-red-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                            >
                              {m.posterUrl ? (
                                <img src={m.posterUrl} alt={m.titleVn} className="w-9 h-12 object-cover rounded border-2 border-slate-900 shrink-0" />
                              ) : (
                                <div className="w-9 h-12 bg-slate-100 border-2 border-slate-300 rounded flex items-center justify-center text-[8px] font-black text-slate-400 uppercase shrink-0">N/A</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-slate-900 truncate" title={m.titleVn}>{m.titleVn}</h4>
                                {m.titleEn && (
                                  <p className="text-[11px] text-slate-500 truncate font-bold" title={m.titleEn}>{m.titleEn}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black text-red-600">{m.duration || 120} phut</span>
                                  {m.version && <span className="text-[10px] font-bold text-slate-500">- {m.version}</span>}
                                  {m.fromDate && <span className="text-[10px] font-bold text-slate-500">- {m.fromDate}</span>}
                                </div>
                              </div>
                              <ArrowRight size={14} className="text-slate-700 shrink-0" strokeWidth={2.5} />
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
              <button
                onClick={() => setShowFilters(s => !s)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Filter size={14} strokeWidth={2.5} /> Bo loc
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                {hasActiveFilter && <span className="ml-1 w-2 h-2 rounded-full bg-red-600 animate-pulse" />}
              </button>
              {hasActiveFilter && (
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-rose-700 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <X size={14} strokeWidth={3} /> Xoa
                </button>
              )}
              <button
                onClick={() => applyMainFilter(0)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Search size={14} strokeWidth={3} /> Tim
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-hidden pt-2 border-t-2 border-dashed border-slate-200"
              >
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Filter size={11} strokeWidth={2.5} className="text-red-600" />
                    Trang thai
                  </label>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setTimeout(() => applyMainFilter(0), 0) }}
                    className="w-full h-10 px-3 rounded-xl bg-rose-50/50 border-2 border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Sparkles size={11} strokeWidth={2.5} className="text-red-600" />
                    Phien ban
                  </label>
                  <select
                    value={version}
                    onChange={(e) => { setVersion(e.target.value); setTimeout(() => applyMainFilter(0), 0) }}
                    className="w-full h-10 px-3 rounded-xl bg-rose-50/50 border-2 border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
                  >
                    {VERSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Calendar size={11} strokeWidth={2.5} className="text-red-600" />
                    Tu ngay
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" strokeWidth={2.5} />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => { setFromDate(e.target.value); setTimeout(() => applyMainFilter(0), 0) }}
                      className="w-full pl-10 pr-3 h-10 rounded-xl bg-rose-50/50 border-2 border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t-2 border-dashed border-slate-200">
              {activeFilterChips.map(c => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black bg-red-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  {c.label}
                  <button onClick={c.onRemove} className="hover:text-amber-300 transition-colors ml-0.5" title="Bo loc">
                    <X size={11} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden"
      >
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <Film size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-amber-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Danh sach phim</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                Trang {page + 1} / {totalPages || 1} - {movies.length} phim hien thi
              </p>
            </div>
            <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-5">
          <Table columns={columns} data={movies} actions={row => (
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => navigate(`/admin/movies/edit/${row.id}`)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                title="Chinh sua"
              >
                <Pencil size={11} strokeWidth={3} /> Sua
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                title="Xoa"
              >
                <Trash2 size={11} strokeWidth={3} /> Xoa
              </button>
            </div>
          )} />

          {movies.length === 0 && !loading && (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
                <Search size={28} className="text-slate-400" strokeWidth={2} />
              </div>
              <p className="text-base font-black text-slate-700 uppercase tracking-wider">Khong co phim nao</p>
              <p className="text-xs text-slate-500 font-bold">Hay them phim moi de bat dau</p>
            </div>
          )}

          {totalPages > 0 && (() => {
          const visible = buildVisiblePages(page, totalPages)
          const canPrev = page > 0 && !loading
          const canNext = page < totalPages - 1 && !loading
          const jumpPrev = Math.max(0, page - 10)
          const jumpNext = Math.min(totalPages - 1, page + 10)
          const canJumpPrev = page - 10 >= 0 && !loading
          const canJumpNext = page + 10 < totalPages && !loading
          return (
            <div className="flex flex-col gap-3 pt-4 border-t-2 border-dashed border-slate-200 mt-4">
              <div className="flex justify-center items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => canJumpPrev && load(jumpPrev)}
                  disabled={!canJumpPrev}
                  title="Lui 10 trang"
                  className="h-9 px-3 border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} strokeWidth={3} />
                  <ChevronLeft size={14} strokeWidth={3} className="-ml-3" />
                  <span>10 truoc</span>
                </button>
                <button
                  onClick={() => canPrev && load(page - 1)}
                  disabled={!canPrev}
                  title="Trang truoc"
                  className="w-9 h-9 border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                {visible.map((item, idx) => {
                  if (item.type === 'ellipsis') {
                    return (
                      <span key={item.key} className="w-9 h-9 flex items-center justify-center text-slate-400 select-none font-black">
                        ...
                      </span>
                    )
                  }
                  const isCurrent = page === item.value
                  return (
                    <button
                      key={`p-${item.value}`}
                      onClick={() => !isCurrent && !loading && load(item.value)}
                      disabled={isCurrent || loading}
                      className={`w-9 h-9 flex items-center justify-center font-black text-xs rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-red-600 text-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]'
                          : 'border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] disabled:cursor-default'
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
                  className="w-9 h-9 border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
                <button
                  onClick={() => load(jumpNext)}
                  disabled={!canJumpNext}
                  title="Sau 10 trang"
                  className="h-9 px-3 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-1 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <span>{canJumpNext ? '10 phim ke' : 'Het trang'}</span>
                  <ChevronRight size={14} strokeWidth={3} />
                  <ChevronRight size={14} strokeWidth={3} className="-ml-3" />
                </button>
              </div>
            </div>
          )
        })()}
        </div>
      </motion.div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
          >
            <TicketStrip count={14} />
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 px-6 py-5 flex justify-between items-center border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <Trash2 size={18} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Xac nhan xoa</h4>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Hanh dong khong the hoan tac</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white space-y-4">
              <div className="p-4 bg-amber-100 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <div className="text-xs text-slate-900 font-bold leading-relaxed">
                    Ban co chac muon xoa phim <span className="text-red-600 font-black">"{deleteTarget.titleVn}"</span>?
                    Phim se chuyen sang trang thai <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black">NGUNG CHIEU</span>.
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={3} /> Huy
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Trash2 size={14} strokeWidth={3} /> Xoa phim
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}