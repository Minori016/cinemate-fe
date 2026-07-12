import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Clock, Plus, Upload, Download, Settings, Sparkles, Calendar, Film, Tv, MapPin, Users, ChevronDown, Hash, Star, AlertCircle, CheckCircle, X, Grid3x3, List, Eye, PlayCircle, Lock, Filter } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { systemConfigService } from '../../../services/systemConfigService'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'

const STATUS_META = {
  DRAFT: { label: 'Nhap', bg: 'bg-slate-500', border: 'border-slate-700', text: 'text-white' },
  SCHEDULED: { label: 'Da len lich', bg: 'bg-emerald-500', border: 'border-emerald-700', text: 'text-white' },
  SOLD_OUT: { label: 'Het ve', bg: 'bg-amber-500', border: 'border-amber-700', text: 'text-white' },
  CANCELLED: { label: 'Da huy', bg: 'bg-rose-500', border: 'border-rose-700', text: 'text-white' },
  FINISHED: { label: 'Da chieu', bg: 'bg-sky-500', border: 'border-sky-700', text: 'text-white' },
}
const getStatusMeta = (s) => STATUS_META[s] || { label: s || '-', bg: 'bg-slate-400', border: 'border-slate-600', text: 'text-white' }

const getNextStatusActions = (status) => {
  if (status === 'DRAFT') return [{ status: 'SCHEDULED', label: 'Publish (len lich)' }]
  if (status === 'SCHEDULED') return [{ status: 'SOLD_OUT', label: 'Het ve' }]
  if (status === 'SOLD_OUT') return [{ status: 'SCHEDULED', label: 'Mo lai ban' }]
  return []
}

const getRoomDetails = (room) => {
  const nameLower = (room.name || '').toLowerCase()
  const rawFormats = room.supportedFormats
  const formats = Array.isArray(rawFormats) ? rawFormats : (typeof rawFormats === 'string' ? rawFormats.split(',') : [])
  const cleanFormats = formats.map(f => String(f).toUpperCase().replace('_', ''))
  if (cleanFormats.includes('IMAX') || nameLower.includes('imax')) return { sub: 'IMAX' }
  if (nameLower.includes('vip') || nameLower.includes('gold')) return { sub: 'VIP' }
  if (cleanFormats.includes('4DX') || nameLower.includes('4dx') || nameLower.includes('4d')) return { sub: '4DX' }
  if (cleanFormats.includes('3D') || nameLower.includes('3d')) return { sub: '3D' }
  return { sub: 'Standard' }
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

export default function ShowtimeListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user && user.roles?.includes('ADMIN')
  const isManager = user && user.roles?.includes('MANAGER')
  const isAuthorized = isAdmin || isManager
  const basePath = isAdmin ? '/admin' : '/manager'

  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [systemConfigs, setSystemConfigs] = useState([])
  const [loading, setLoading] = useState(true)

  const [viewMode, setViewMode] = useState('grid')
  const [filterMovie, setFilterMovie] = useState('all')
  const [filterRoom, setFilterRoom] = useState('all')

  const [filterDate, setFilterDate] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000
    return (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10)
  })

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  const fileInputRef = useRef(null)
  const timelineContainerRef = useRef(null)

  const triggerToast = (msg, type = 'success') => {
    if (type === 'success') toast.success(msg)
    else toast.error(msg)
  }

  const handleExportClick = () => setShowExportModal(true)

  const executeExport = async (type) => {
    setShowExportModal(false)
    const toastId = toast.loading('Dang chuan bi file Excel...')
    try {
      let startDate = null
      let endDate = null
      const baseDate = new Date(filterDate)
      if (type === 'month') {
        const y = baseDate.getFullYear(); const m = baseDate.getMonth()
        startDate = new Date(y, m, 1).toISOString().split('T')[0]
        endDate = new Date(y, m + 1, 0).toISOString().split('T')[0]
      } else if (type === 'week') {
        const d = new Date(baseDate); const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(d.setDate(diff))
        startDate = monday.toISOString().split('T')[0]
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
        endDate = sunday.toISOString().split('T')[0]
      }
      let filename = `showtimes_${type === 'all' ? 'all' : startDate + '_to_' + endDate}.xlsx`
      const data = await showtimeService.exportExcel(startDate, endDate)
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link); link.click(); link.parentNode.removeChild(link)
      toast.success('Xuat file Excel thanh cong!', { id: toastId })
    } catch (err) {
      toast.error('Khong the xuat file Excel!', { id: toastId })
    }
  }

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const toastId = toast.loading('Dang xu ly file Excel, vui long cho...')
    try {
      const res = await showtimeService.importExcel(file)
      toast.success(res?.message || 'Phan tich file Excel thanh cong!', { id: toastId })
      navigate(`${basePath}/showtimes/auto-generate`, { state: { importedPreviewList: res.result || res.data } })
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Loi khong xac dinh'
      toast.error(errMsg, { id: toastId, duration: 8000 })
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const stList = await showtimeService.getAll()
      setShowtimes(stList)
      try {
        const mRes = await movieService.getAll()
        setMovies(mRes.data || [])
      } catch { setMovies([]) }
      try {
        const rRes = await cinemaRoomService.getAll()
        const rList = rRes.data?.result || rRes.data || []
        const sortedList = (rList.length > 0 ? rList : []).sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'vi', { numeric: true })
        )
        setRooms(sortedList)
      } catch { setRooms([]) }
      try {
        const sRes = await systemConfigService.getAll()
        const sData = sRes?.data?.result || sRes?.data || sRes || []
        setSystemConfigs(Array.isArray(sData) ? sData : [])
      } catch { setSystemConfigs([]) }
    } catch (err) {
      triggerToast('Khong the tai danh sach du lieu!', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) loadData()
  }, [isAuthorized])

  const getConfigValue = (key, defaultValue) => {
    if (!Array.isArray(systemConfigs)) return defaultValue
    const conf = systemConfigs.find(c => c.configKey === key)
    if (conf && conf.configValue != null) {
      const parsed = parseInt(conf.configValue, 10)
      return isNaN(parsed) ? defaultValue : parsed
    }
    return defaultValue
  }

  const getEndTimeForShowtime = (st) => {
    if (st.endTime) {
      const d = new Date(st.endTime)
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
    }
    const mObj = movies.find(m => m.titleVn === st.movie || m.id === st.movieId)
    const dMin = mObj ? (mObj.durationMinutes || 120) : 120
    try {
      const startT = new Date(`${st.date}T${st.time}:00`)
      if (!isNaN(startT.getTime())) {
        const endT = new Date(startT.getTime() + (dMin + 10) * 60 * 1000)
        return endT.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
    } catch (e) {}
    return '--:--'
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await showtimeService.delete(deleteTarget.id)
      setShowtimes(prev => prev.filter(st => st.id !== deleteTarget.id))
      triggerToast(`Da xoa suat chieu cua phim "${deleteTarget.movie}"`, 'success')
    } catch (err) {
      const status = err?.response?.status
      const message = err?.response?.data?.message || 'Xoa lich chieu that bai!'
      let userMessage = message
      if (status === 400 && message.includes('Uncategorized')) {
        userMessage = 'Khong the xoa suat chieu nay vi co ve da duoc dat. Vui long huy tat ca cac don dat ve lien quan truoc khi xoa.'
      } else if (status === 400 || status === 409) {
        userMessage = `Loi: ${message}. Co the suat chieu nay da co khach dat ve.`
      }
      triggerToast(userMessage, 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleUpdateStatus = async (st, nextStatus) => {
    if (!st?.id || !nextStatus) return
    setStatusUpdatingId(st.id)
    const toastId = toast.loading(`Dang cap nhat trang thai...`)
    try {
      const updated = await showtimeService.updateStatus(st.id, nextStatus)
      setShowtimes(prev => prev.map(item => (
        item.id === st.id ? { ...item, ...updated, status: updated.status || nextStatus } : item
      )))
      toast.success('Cap nhat trang thai thanh cong!', { id: toastId })
    } catch (err) {
      const message = err?.response?.data?.message || 'Cap nhat trang thai that bai.'
      toast.error(message, { id: toastId })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const [timelineDaysCount, setTimelineDaysCount] = useState(7)

  const latestShowtimeDateStr = showtimes.reduce((latest, st) => {
    if (!st.date) return latest
    if (!latest) return st.date
    return new Date(st.date) > new Date(latest) ? st.date : latest
  }, filterDate)

  const filterDateObj = new Date(filterDate)
  const latestDateObj = new Date(latestShowtimeDateStr)
  const diffTimeMs = latestDateObj.getTime() - filterDateObj.getTime()
  const diffDaysToLatest = Math.max(0, Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24)))
  const MAX_DAYS_COUNT = Math.max(7, diffDaysToLatest + 2)

  useEffect(() => { setTimelineDaysCount(7) }, [filterDate])

  const datesToRender = Array.from({ length: Math.min(timelineDaysCount, MAX_DAYS_COUNT) }).map((_, i) => {
    const d = new Date(filterDate)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const filteredShowtimes = showtimes.filter(st => {
    const matchMovie = filterMovie === 'all' || st.movie === filterMovie || st.movieId === filterMovie
    const matchRoom = filterRoom === 'all' || st.room === filterRoom || st.roomId === filterRoom
    const matchDate = !filterDate || datesToRender.includes(st.date)
    return matchMovie && matchRoom && matchDate
  })

  if (!isAuthorized) {
    return (
      <div className="text-left space-y-6">
        <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-rose-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Lock size={36} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900">Quyen truy cap bi tu choi</h2>
            <p className="text-sm text-slate-600 font-bold max-w-sm">
              Chi co tai khoan Quan tri vien (Admin) hoac Quan ly (Manager) moi co quyen truy cap va lap lich chieu phim.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              Quay lai trang chu
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getBusinessHours = () => {
    const startHour = 8
    const endHour = 26
    return { startHour, endHour, businessHours: endHour - startHour, businessMinutes: (endHour - startHour) * 60 }
  }

  const calculatePosition = (timeStr, movieId, stDate) => {
    if (!timeStr || !stDate) return { left: '0px', width: '0px' }
    const mObj = movies.find(m => m.id === movieId || m.titleVn === movieId)
    const durationMins = mObj ? (mObj.durationMinutes || 120) : 120
    const { startHour, businessMinutes } = getBusinessHours()
    const [by, bm, bd] = filterDate.split('-')
    const baseDateObj = new Date(by, bm - 1, bd); baseDateObj.setHours(startHour, 0, 0, 0)
    const [sy, sm, sd] = stDate.split('-')
    const stDateObj = new Date(sy, sm - 1, sd)
    let [h, m] = timeStr.split(':').map(Number)
    stDateObj.setHours(h, m, 0, 0)
    const diffTimeMs = stDateObj.getTime() - baseDateObj.getTime()
    const realDaysPassed = Math.floor(diffTimeMs / (24 * 3600 * 1000))
    const remainderMs = diffTimeMs % (24 * 3600 * 1000)
    const minutesIntoDay = Math.floor(remainderMs / 60000)
    const totalMinutes = (realDaysPassed * businessMinutes) + minutesIntoDay
    return { left: `${totalMinutes}px`, width: `${durationMins + 10}px` }
  }

  const getTodayLinePosition = () => {
    const { startHour, businessMinutes } = getBusinessHours()
    const [y, m, d] = filterDate.split('-')
    const baseDateObj = new Date(y, m - 1, d); baseDateObj.setHours(startHour, 0, 0, 0)
    const diffTimeMs = now.getTime() - baseDateObj.getTime()
    const realDaysPassed = Math.floor(diffTimeMs / (24 * 3600 * 1000))
    const remainderMs = diffTimeMs % (24 * 3600 * 1000)
    const minutesIntoDay = Math.floor(remainderMs / (1000 * 60))
    const totalMinutes = (realDaysPassed * businessMinutes) + minutesIntoDay
    return totalMinutes > 0 ? `${totalMinutes}px` : '-10px'
  }

  const handleTimelineScroll = (e) => {
    const target = e.target
    if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 1000) {
      setTimelineDaysCount(prev => Math.min(prev + 7, MAX_DAYS_COUNT))
    }
  }

  useEffect(() => {
    if (timelineContainerRef.current) {
      if (filteredShowtimes.length > 0) {
        const nowMs = now.getTime()
        let closest = filteredShowtimes[0]
        let minDiff = Infinity
        filteredShowtimes.forEach(st => {
          const stTime = new Date(`${st.date}T${st.time}:00`).getTime()
          const diff = Math.abs(stTime - nowMs)
          if (diff < minDiff) { minDiff = diff; closest = st }
        })
        const { left } = calculatePosition(closest.time, closest.movieId, closest.date)
        let px = parseInt(left.replace('px', '')) - 300
        if (px < 0) px = 0
        timelineContainerRef.current.scrollTo({ left: px, behavior: 'smooth' })
      } else {
        const px = parseInt(getTodayLinePosition().replace('px', '')) - 400
        timelineContainerRef.current.scrollTo({ left: Math.max(0, px), behavior: 'smooth' })
      }
    }
  }, [filterDate, viewMode, filteredShowtimes.length])

  return (
    <div className="text-left space-y-6">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> SCHEDULE CENTER
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {showtimes.length} suat
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly<br /><span className="text-red-600">lich chieu phim</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Xem danh sach lich chieu, tuy chinh thoi gian va tu dong tao lich chieu cho toan he thong.
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-amber-50 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Upload size={14} strokeWidth={2.5} /> Nhap Excel
              </button>
              <button
                onClick={handleExportClick}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-amber-50 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Download size={14} strokeWidth={2.5} /> Xuat Excel
              </button>
              <button
                onClick={() => navigate(`${basePath}/showtimes/auto-generate`)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-violet-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Sparkles size={14} strokeWidth={2.5} /> Tu dong tao
              </button>
              <button
                onClick={() => navigate(`${basePath}/showtimes/add`)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Plus size={14} strokeWidth={2.5} /> Them suat chieu
              </button>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_FILTERS_HERE */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <Filter size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-sky-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Bo loc va che do xem</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filteredShowtimes.length} suat chieu dang hien thi</p>
            </div>
            <div className="flex bg-white rounded-xl p-1 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <Grid3x3 size={12} strokeWidth={2.5} /> Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <List size={12} strokeWidth={2.5} /> Bang
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Film size={11} strokeWidth={2.5} className="text-red-600" />
              Loc theo phim
            </label>
            <div className="relative">
              <select
                value={filterMovie}
                onChange={(e) => setFilterMovie(e.target.value)}
                className="w-full appearance-none bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 px-3 pr-9 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
              >
                <option value="all">Tat ca phim</option>
                {movies.map(m => (
                  <option key={m.id} value={m.titleVn}>{m.titleVn}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Tv size={11} strokeWidth={2.5} className="text-red-600" />
              Loc theo phong
            </label>
            <div className="relative">
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="w-full appearance-none bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 px-3 pr-9 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
              >
                <option value="all">Tat ca phong chieu</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Calendar size={11} strokeWidth={2.5} className="text-red-600" />
              Ngay bat dau
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PART_CONTENT_HERE */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
            <p className="text-sm font-black uppercase tracking-wider text-slate-700">Dang tai lich chieu...</p>
          </div>
        ) : viewMode === 'grid' ? (
          // PART_GRID_HERE
          <div ref={timelineContainerRef} className="overflow-auto max-h-[700px] bg-white" onScroll={handleTimelineScroll}>
            <div className="flex" style={{ width: `calc(192px + ${datesToRender.length * getBusinessHours().businessMinutes}px)` }}>
              {/* Sidebar Rooms */}
              <div className="w-48 shrink-0 sticky left-0 z-40 bg-white border-r-2 border-slate-900 flex flex-col">
                <div className="h-[60px] border-b-2 border-slate-900 bg-slate-900 text-amber-300 sticky top-0 z-50 shrink-0 flex items-center justify-center">
                  <span className="text-[11px] font-black tracking-[0.15em] uppercase">Phong chieu</span>
                </div>
                {rooms.filter(r => filterRoom === 'all' || r.name === filterRoom || r.id === filterRoom).map(room => {
                  const roomInfo = getRoomDetails(room)
                  return (
                    <div key={room.id} className="h-24 border-b-2 border-dashed border-slate-300 flex items-center px-4 gap-3 bg-white hover:bg-amber-50 transition-colors shrink-0">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                        <Tv size={18} className="text-amber-300" strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-900 truncate uppercase">{room.name}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-violet-200 border border-violet-700 text-violet-900 rounded text-[9px] font-black uppercase tracking-wider">
                          {roomInfo.sub}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Timeline Area */}
              <div className="relative bg-amber-50/30" style={{ width: `${datesToRender.length * getBusinessHours().businessMinutes}px` }}>
                <div className="h-[60px] flex flex-col sticky top-0 z-30 bg-white border-b-2 border-slate-900 shadow-[0_2px_4px_rgba(15,23,42,0.1)]">
                  <div className="h-8 flex border-b border-slate-300">
                    {datesToRender.map((date, index) => {
                      const formattedDate = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
                      return (
                        <div key={date}
                          className={`shrink-0 font-black text-xs flex items-center border-r-2 border-slate-900 uppercase ${index % 2 === 0 ? 'bg-amber-100 text-slate-900' : 'bg-rose-100 text-slate-900'}`}
                          style={{ width: `${getBusinessHours().businessMinutes}px` }}
                        >
                          <span className="sticky left-48 px-4 tracking-wide">{formattedDate}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="h-8 flex">
                    {datesToRender.map((date, index) => {
                      const { startHour, businessHours, businessMinutes } = getBusinessHours()
                      const numBlocks = Math.ceil(businessHours / 2)
                      return (
                        <div key={`hours-${date}`}
                          className={`flex shrink-0 border-r-2 border-slate-900 border-dashed ${index % 2 === 0 ? 'bg-white' : 'bg-amber-50'}`}
                          style={{ width: `${businessMinutes}px` }}
                        >
                          {Array.from({ length: numBlocks }).map((_, i) => (
                            <div key={i} className="w-[120px] shrink-0 flex items-center justify-center border-r border-slate-300 border-dashed text-[11px] font-black font-mono text-slate-700">
                              {String((startHour + i * 2) % 24).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Grid Background Lines */}
                <div className="absolute inset-0 top-[60px] flex pointer-events-none z-0">
                  {datesToRender.map((date, index) => {
                    const { businessHours, businessMinutes } = getBusinessHours()
                    const numBlocks = Math.ceil(businessHours / 2)
                    return (
                      <div key={`bg-${date}`}
                        className={`flex shrink-0 border-r-2 border-slate-900 border-dashed ${index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}`}
                        style={{ width: `${businessMinutes}px` }}
                      >
                        {Array.from({ length: numBlocks }).map((_, i) => (
                          <div key={i} className="w-[120px] shrink-0 border-r border-slate-300 border-dashed h-full" />
                        ))}
                      </div>
                    )
                  })}
                </div>

                {/* Current Time Line */}
                <div
                  className="absolute top-[60px] bottom-0 w-0.5 bg-red-600 z-10 pointer-events-none"
                  style={{ left: getTodayLinePosition() }}
                >
                  <div className="w-3 h-3 rounded-full bg-red-600 absolute -top-1.5 -left-1.5 border-2 border-white shadow-md" />
                </div>

                {/* Showtimes */}
                <div className="relative z-10">
                  {rooms.filter(r => filterRoom === 'all' || r.name === filterRoom || r.id === filterRoom).map(room => {
                    const roomShowtimes = filteredShowtimes.filter(st => st.roomId === room.id || st.room === room.name)
                    return (
                      <div key={room.id} className="h-24 border-b-2 border-dashed border-slate-300 relative">
                        {roomShowtimes.map(st => {
                          const { left, width } = calculatePosition(st.time, st.movieId, st.date)
                          const movieObj = movies.find(m => m.id === st.movieId || m.titleVn === st.movie)
                          const isGoldenHour = st.goldenHour || st.isGoldenHour
                          const statusMeta = getStatusMeta(st.status)
                          const nextActions = getNextStatusActions(st.status)
                          const isDraft = st.status === 'DRAFT'

                          const bgColor = isDraft ? 'bg-slate-100' : (isGoldenHour ? 'bg-amber-100' : 'bg-emerald-100')
                          const borderColor = isDraft ? 'border-slate-400' : (isGoldenHour ? 'border-amber-700' : 'border-emerald-700')

                          return (
                            <div
                              key={st.id}
                              className={`absolute top-3 h-[80px] ${bgColor} border-2 ${borderColor} flex items-center p-2 cursor-pointer hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all group overflow-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${isDraft ? 'opacity-70' : ''}`}
                              style={{ left, width }}
                              onClick={() => navigate(`${basePath}/showtimes/${st.id}`)}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isDraft ? 'bg-slate-500' : (isGoldenHour ? 'bg-amber-500' : 'bg-emerald-500')}`} />

                              <div className="flex-1 min-w-0 ml-2 flex flex-col justify-center relative z-10 pointer-events-none">
                                <h4 className="font-black text-[11px] text-slate-900 line-clamp-1 leading-tight mb-1 uppercase" title={st.movie}>
                                  {st.movie}
                                </h4>
                                <div className="flex gap-1 items-center mb-0.5 flex-wrap">
                                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 text-amber-300 rounded font-black uppercase border border-slate-900">
                                    {st.format || '2D'}
                                  </span>
                                  {st.status !== 'SCHEDULED' && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase border-2 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                                      {statusMeta.label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-900 font-mono font-black flex gap-1 items-center">
                                  <Clock size={9} strokeWidth={3} className="text-red-600" />
                                  <span>{st.time}</span>
                                  <span>→</span>
                                  <span>{getEndTimeForShowtime(st)}</span>
                                </p>
                              </div>

                              <div className="absolute right-1 top-1 bottom-1 bg-white/90 px-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-auto">
                                {nextActions.filter(a => a.status !== 'SOLD_OUT').map(action => (
                                  <button
                                    key={action.status}
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(st, action.status) }}
                                    disabled={statusUpdatingId === st.id}
                                    title={action.label}
                                    className="p-1.5 text-sky-700 hover:bg-sky-100 rounded border-2 border-sky-700 bg-white transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <PlayCircle size={11} strokeWidth={3} />
                                  </button>
                                ))}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(st) }}
                                  title="Xoa"
                                  className="p-1.5 text-rose-700 hover:bg-rose-100 rounded border-2 border-rose-700 bg-white transition-all cursor-pointer"
                                >
                                  <Trash2 size={11} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer Legend */}
            <div className="px-5 py-4 border-t-2 border-slate-900 bg-amber-50 flex flex-wrap gap-4 items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Chu thich:</span>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-600 border-2 border-slate-900" /><span className="text-[10px] font-bold text-slate-700">IMAX</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-700 border-2 border-slate-900" /><span className="text-[10px] font-bold text-slate-700">Standard</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-600 border-2 border-slate-900" /><span className="text-[10px] font-bold text-slate-700">3D</span></div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-amber-100 border-2 border-amber-700" /><span className="text-[10px] font-bold text-slate-700">Gio vang</span></div>
              <span className="ml-auto text-[10px] font-bold text-slate-600">He thong quan ly rap chieu phim v2.1.0</span>
            </div>
          </div>
        ) : (
          // PART_LIST_HERE
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-amber-300">
                <tr className="text-[10px] uppercase font-black tracking-[0.15em] border-b-2 border-slate-900">
                  <th className="px-4 py-3 text-left">Phim / Movie</th>
                  <th className="px-4 py-3 text-left">Phong chieu</th>
                  <th className="px-4 py-3 text-left">Ngay chieu</th>
                  <th className="px-4 py-3 text-left">Gio chieu</th>
                  <th className="px-4 py-3 text-left">Trang thai</th>
                  <th className="px-4 py-3 text-left">Ngon ngu</th>
                  <th className="px-4 py-3 text-right">Hanh dong</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 bg-white">
                {filteredShowtimes.length > 0 ? filteredShowtimes.map((st) => {
                  const statusMeta = getStatusMeta(st.status)
                  const nextActions = getNextStatusActions(st.status)
                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-amber-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`${basePath}/showtimes/${st.id}`)}
                    >
                      <td className="px-4 py-3 font-black text-slate-900 max-w-xs">
                        <div className="flex items-center gap-2">
                          <Film size={14} className="text-red-600 shrink-0" strokeWidth={2.5} />
                          <span className="truncate">{st.movie}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-sky-100 border-2 border-sky-700 text-sky-900 rounded-md text-[10px] font-black uppercase">{st.room}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-slate-700 font-mono">{st.date}</td>
                      <td className="px-4 py-3 font-black text-red-600">
                        <div className="flex items-center gap-1 text-xs">
                          <Clock size={12} strokeWidth={3} /> {st.time} → {getEndTimeForShowtime(st)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {st.status !== 'SCHEDULED' ? (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border-2 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                            {statusMeta.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border-2 ${st.language === 'Long tieng' ? 'bg-rose-200 text-rose-900 border-rose-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                          {st.language || 'Phu de'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {nextActions.filter(a => a.status !== 'SOLD_OUT').map(action => (
                            <button
                              key={action.status}
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(st, action.status) }}
                              disabled={statusUpdatingId === st.id}
                              className="p-2 hover:bg-sky-100 text-sky-700 rounded-lg border-2 border-sky-700 transition-all cursor-pointer disabled:opacity-50"
                              title={action.label}
                            >
                              <PlayCircle size={12} strokeWidth={3} />
                            </button>
                          ))}
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(st) }}
                            className="p-2 hover:bg-rose-100 text-rose-700 rounded-lg border-2 border-rose-700 transition-all cursor-pointer"
                            title="Xoa"
                          >
                            <Trash2 size={12} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
                          <Calendar size={26} className="text-slate-400" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-wider text-slate-700">Khong co lich chieu nao</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PART_MODAL_HERE */}
      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
          >
            <TicketStrip count={14} />
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 px-6 py-5 flex items-center gap-3 border-b-2 border-slate-900">
              <div className="w-10 h-10 bg-rose-600 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <Trash2 size={18} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Xac nhan xoa suat chieu</h4>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Hanh dong khong the hoan tac</p>
              </div>
            </div>
            <div className="p-6 bg-white space-y-3">
              <div className="text-sm font-bold text-slate-800 leading-relaxed">
                Ban co chac muon xoa suat chieu phim <span className="text-red-600 font-black">"{deleteTarget.movie}"</span> luc <span className="text-red-600 font-black">{deleteTarget.time}</span> ngay <span className="font-black">{deleteTarget.date}</span> tai <span className="font-black">{deleteTarget.room}</span>?
              </div>
              <div className="p-3 bg-amber-100 border-2 border-amber-700 rounded-xl flex items-start gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" strokeWidth={3} />
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  Luu y: Khong the xoa suat chieu neu da co ve duoc ban hoac dat. Ban can huy tat ca cac don dat ve truoc khi xoa.
                </p>
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
                <Trash2 size={14} strokeWidth={3} /> Xoa suat chieu
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
          >
            <TicketStrip count={14} />
            <div className="bg-gradient-to-br from-emerald-50 to-amber-50 px-6 py-5 flex items-center gap-3 border-b-2 border-slate-900">
              <div className="w-10 h-10 bg-emerald-600 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <Download size={18} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Xuat file Excel</h4>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Chon pham vi thoi gian</p>
              </div>
            </div>
            <div className="p-6 space-y-3 bg-white">
              <p className="text-sm font-bold text-slate-700">
                Pham vi tinh dua tren ngay dang chon (<span className="font-black">{filterDate}</span>):
              </p>
              <button
                onClick={() => executeExport('week')}
                className="w-full p-4 bg-amber-50 hover:bg-amber-100 border-2 border-slate-900 rounded-2xl flex items-center gap-3 text-left shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center border-2 border-slate-900">
                  <Calendar size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Tuan nay</p>
                  <p className="text-[11px] font-bold text-slate-600">Cac suat chieu trong tuan cua ngay {filterDate}</p>
                </div>
              </button>
              <button
                onClick={() => executeExport('month')}
                className="w-full p-4 bg-violet-50 hover:bg-violet-100 border-2 border-slate-900 rounded-2xl flex items-center gap-3 text-left shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center border-2 border-slate-900">
                  <Calendar size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Thang nay</p>
                  <p className="text-[11px] font-bold text-slate-600">Cac suat chieu trong thang cua ngay {filterDate}</p>
                </div>
              </button>
              <button
                onClick={() => executeExport('all')}
                className="w-full p-4 bg-sky-50 hover:bg-sky-100 border-2 border-slate-900 rounded-2xl flex items-center gap-3 text-left shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center border-2 border-slate-900">
                  <Sparkles size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Toan bo du lieu</p>
                  <p className="text-[11px] font-bold text-slate-600">Xuat tat ca suat chieu hien co trong he thong</p>
                </div>
              </button>
            </div>
            <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={3} /> Huy
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}