import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Clock, Plus } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from 'sonner'

const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

const getFormatColor = (format) => {
  const f = (format || '2D').toUpperCase()
  if (f.includes('IMAX')) return { bar: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', border: 'border-[#ffdad6]' }
  if (f.includes('4D') || f.includes('3D')) return { bar: 'bg-[#00836c]', text: 'text-[#00836c]', border: 'border-[#90f5d9]' }
  if (f.includes('VIP')) return { bar: 'bg-[#e11d48]', text: 'text-[#e11d48]', border: 'border-[#ffb3b6]' }
  return { bar: 'bg-[#565e74]', text: 'text-[#565e74]', border: 'border-[#dae2fd]' }
}

const getRoomDetails = (room) => {
  const nameLower = room.name?.toLowerCase() || ''
  if (nameLower.includes('imax')) {
    return { icon: 'videocam', iconColor: 'text-[#ba1a1a]', sub: 'IMAX' }
  }
  if (nameLower.includes('vip') || nameLower.includes('gold')) {
    return { icon: 'star', iconColor: 'text-[#e11d48]', sub: 'VIP' }
  }
  if (nameLower.includes('3d') || nameLower.includes('4d')) {
    return { icon: 'tv', iconColor: 'text-[#00836c]', sub: '3D/4D' }
  }
  return { icon: 'speaker', iconColor: 'text-[#565e74]', sub: 'Standard' }
}

const stringToGradient = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${h}, 80%, 60%) 0%, hsl(${(h + 30) % 360}, 90%, 40%) 100%)`;
};

export default function ShowtimeListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user && user.roles?.includes('ADMIN')
  const isManager = user && user.roles?.includes('MANAGER')
  const isAuthorized = isAdmin || isManager
  const basePath = isAdmin ? '/admin' : '/manager'

  // States
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  // View Mode
  const [viewMode, setViewMode] = useState('grid')

  // Filters state
  const [filterMovie, setFilterMovie] = useState('all')
  const [filterRoom, setFilterRoom] = useState('all')
  
  // Default date to today for grid view to make sense
  const [filterDate, setFilterDate] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
  })

  // Current time state for the timeline indicator
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)

  const triggerToast = (msg, type = 'success') => {
    if (type === 'success') {
      toast.success(msg)
    } else {
      toast.error(msg)
    }
  }

  const fileInputRef = useRef(null)

  const handleExportExcel = async () => {
    const toastId = toast.loading('Đang chuẩn bị file Excel...')
    try {
      const data = await showtimeService.exportExcel()
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `showtimes_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Xuất file Excel thành công!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Không thể xuất file Excel!', { id: toastId })
    }
  }

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    e.target.value = ''
    
    const toastId = toast.loading('Đang xử lý file Excel, vui lòng chờ...')
    try {
      const res = await showtimeService.importExcel(file)
      toast.success(res?.message || 'Nhập lịch chiếu từ Excel thành công!', { id: toastId })
      loadData()
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.message || err.message || 'Lỗi không xác định khi nhập file Excel!'
      toast.error(
        <div className="whitespace-pre-line text-xs font-semibold leading-relaxed">
          {errMsg}
        </div>,
        { id: toastId, duration: 8000 }
      )
    }
  }

  // Load Data
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
        setRooms(rList.length > 0 ? rList : [])
      } catch { setRooms([]) }
    } catch (err) {
      console.error('Error loading showtimes data:', err)
      triggerToast('Không thể tải danh sách dữ liệu!', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    if (isAuthorized) loadData()
  }, [isAuthorized])

  // Get selected movie info for end time calculation
  const getEndTimeForShowtime = (st) => {
    const mObj = movies.find(m => m.titleVn === st.movie || m.id === st.movieId)
    const dMin = mObj ? (mObj.durationMinutes || 120) : 120
    try {
      const startT = new Date(`${st.date}T${st.time}:00`)
      if (!isNaN(startT.getTime())) {
        const endT = new Date(startT.getTime() + dMin * 60 * 1000)
        return endT.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
    } catch (e) {
      console.error(e)
    }
    return '--:--'
  }


  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await showtimeService.delete(deleteTarget.id)
      setShowtimes(prev => prev.filter(st => st.id !== deleteTarget.id))
      triggerToast(`Đã xóa suất chiếu của phim "${deleteTarget.movie}"`, 'success')
    } catch (err) {
      const status = err?.response?.status
      const message = err?.response?.data?.message || err?.response?.data || 'Xóa lịch chiếu thất bại!'
      let userMessage = message
      if (status === 400 && message.includes('Uncategorized')) {
        userMessage = 'Không thể xóa suất chiếu này vì có vé đã được đánh giá hoặc đang được giữ. Vui lòng hủy tất cả các đơn đặt vé liên quan trước khi xóa.'
      } else if (status === 400 || status === 409) {
        userMessage = `Lỗi: ${message}. Có thể suất chiếu này đã có khách đặt vé.`
      }
      triggerToast(userMessage, 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const [timelineDaysCount, setTimelineDaysCount] = useState(7)

  // Find the latest date among all showtimes
  const latestShowtimeDateStr = showtimes.reduce((latest, st) => {
    if (!st.date) return latest;
    if (!latest) return st.date;
    return new Date(st.date) > new Date(latest) ? st.date : latest;
  }, filterDate);

  // Calculate the max allowed days count (2 days after the latest showtime)
  const filterDateObj = new Date(filterDate);
  const latestDateObj = new Date(latestShowtimeDateStr);
  const diffTimeMs = latestDateObj.getTime() - filterDateObj.getTime();
  const diffDaysToLatest = Math.max(0, Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24)));
  
  // At least 7 days, max is diff + 2 to avoid huge empty horizontal scrolling
  const MAX_DAYS_COUNT = Math.max(7, diffDaysToLatest + 2);

  useEffect(() => {
    setTimelineDaysCount(7)
  }, [filterDate])

  // Get N days starting from filterDate
  const datesToRender = Array.from({ length: Math.min(timelineDaysCount, MAX_DAYS_COUNT) }).map((_, i) => {
    const d = new Date(filterDate)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  // Filter Showtimes
  const filteredShowtimes = showtimes.filter(st => {
    const matchMovie = filterMovie === 'all' || st.movie === filterMovie || st.movieId === filterMovie
    const matchRoom = filterRoom === 'all' || st.room === filterRoom || st.roomId === filterRoom
    const matchDate = !filterDate || datesToRender.includes(st.date)
    return matchMovie && matchRoom && matchDate
  })

  // Access Denied Screen
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#06080F]">
        <span className="material-symbols-outlined text-red-500 text-6xl font-bold mb-4 animate-bounce">
          gpp_bad
        </span>
        <h2 className="text-2xl font-black uppercase text-white mb-2" style={{ fontFamily: 'Montserrat' }}>
          Quyền truy cập bị từ chối
        </h2>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          Chỉ có tài khoản Quản trị viên (Admin) hoặc Quản lý (Manager) mới có quyền truy cập và lập lịch chiếu phim.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
        >
          Quay lại trang chủ
        </button>
      </div>
    )
  }

  // Grid Logic Constants
  const START_HOUR = 0; // Nửa đêm
  const GRID_WIDTH = 1440; // 1 day = 1440px
  
  const calculatePosition = (timeStr, movieId, stDate) => {
    if (!timeStr || !stDate) return { left: '0px', width: '0px' }
    const mObj = movies.find(m => m.id === movieId || m.titleVn === movieId)
    const durationMins = mObj ? (mObj.durationMinutes || 120) : 120
    
    // Parse dates to local timezone at midnight to calculate exact days diff
    const [by, bm, bd] = filterDate.split('-');
    const baseDateObj = new Date(by, bm - 1, bd);
    const [sy, sm, sd] = stDate.split('-');
    const stDateObj = new Date(sy, sm - 1, sd);
    
    const diffTimeMs = stDateObj.getTime() - baseDateObj.getTime();
    const diffDays = Math.round(diffTimeMs / (1000 * 60 * 60 * 24));
    
    let [h, m] = timeStr.split(':').map(Number)
    
    const totalMinutes = (diffDays * 1440) + (h * 60) + m
    
    return {
      left: `${totalMinutes}px`,
      width: `${durationMins}px`,
    }
  }

  const getTodayLinePosition = () => {
    const [y, m, d] = filterDate.split('-');
    const baseDateObj = new Date(y, m - 1, d);
    const diffTimeMs = now.getTime() - baseDateObj.getTime();
    const diffMinutes = Math.floor(diffTimeMs / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes}px` : '-10px';
  }

  // Hatch Pattern SVG cho giờ đóng cửa
  const diagonalHatch = "data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-2,10 L10,-2 M-2,2 L2,-2 M6,10 L10,6' stroke='%23e0e3e5' stroke-width='1' fill='none' opacity='0.5'/%3E%3C/svg%3E"

  const handleTimelineScroll = (e) => {
    const target = e.target
    if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 1000) {
      setTimelineDaysCount(prev => Math.min(prev + 7, MAX_DAYS_COUNT))
    }
  }

  // Auto scroll to 08:00 AM on initial render or date change
  const timelineContainerRef = useRef(null)
  useEffect(() => {
    if (timelineContainerRef.current) {
      // 08:00 is 8 * 60 = 480px from left
      timelineContainerRef.current.scrollTo({ left: 450, behavior: 'smooth' })
    }
  }, [filterDate, viewMode])

  return (
    <div className="flex-1 flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans -m-6 p-6 h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 shrink-0">
        <div>
          <h1
            className="text-4xl text-[var(--color-on-surface)] font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý lịch chiếu phim
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Xem danh sách lịch chiếu, tùy chỉnh thời gian và tự động tạo lịch chiếu cho toàn hệ thống.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="material-symbols-outlined text-sm mr-1">upload</span>
            Nhập Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
          >
            <span className="material-symbols-outlined text-sm mr-1">download</span>
            Xuất Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`${basePath}/showtimes/auto-generate`)}
          >
            <span className="material-symbols-outlined text-sm mr-1">settings_suggest</span>
            Tự động tạo lịch
          </Button>
          <Button onClick={() => navigate(`${basePath}/showtimes/add`)}>
            <Plus size={16} className="mr-1" /> Thêm suất chiếu
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center bg-white border border-[#e5bdbe] rounded p-2 mb-4 shrink-0">
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={filterMovie}
              onChange={(e) => setFilterMovie(e.target.value)}
              className="appearance-none bg-transparent border border-[#e0e3e5] rounded px-4 py-2 pr-10 text-sm text-[#191c1e] focus:outline-none focus:border-[#565e74] transition-colors cursor-pointer w-48"
            >
              <option value="all">Chọn phim</option>
              {movies.map(m => (
                <option key={m.id} value={m.titleVn}>{m.titleVn}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#5c3f40] pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="appearance-none bg-transparent border border-[#e0e3e5] rounded px-4 py-2 pr-10 text-sm text-[#191c1e] focus:outline-none focus:border-[#565e74] transition-colors cursor-pointer w-40"
            >
              <option value="all">Chọn phòng</option>
              {rooms.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#5c3f40] pointer-events-none">expand_more</span>
          </div>

          <div className="relative flex items-center border border-[#e0e3e5] rounded px-4 py-2 cursor-pointer hover:border-[#565e74] transition-colors bg-white">
            <span className="material-symbols-outlined text-[#5c3f40] mr-2 text-sm">calendar_month</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-[#191c1e] p-0 cursor-pointer focus:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[#5c647a]">View Toggle</span>
          <div className="flex bg-[#eceef0] border border-[#e5bdbe] rounded p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 flex items-center gap-1 text-sm rounded ${viewMode === 'grid' ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#5c647a] hover:text-[#191c1e]'}`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span> Lưới
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 flex items-center gap-1 text-sm rounded ${viewMode === 'list' ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#5c647a] hover:text-[#191c1e]'}`}
            >
              <span className="material-symbols-outlined text-sm">view_list</span> Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex justify-center items-center flex-1">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#b80035]">progress_activity</span>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          {/* Timeline Board - Seamless Horizontal View */}
          <div 
            ref={timelineContainerRef}
            className="flex-1 overflow-auto custom-scrollbar flex bg-[#f7f9fb] border border-[#e5bdbe] rounded min-h-0 relative"
            onScroll={handleTimelineScroll}
          >
            <div className="flex" style={{ width: `calc(192px + ${datesToRender.length * 1440}px)` }}>
              
              {/* Sidebar (Rooms) */}
              <div className="w-48 shrink-0 sticky left-0 z-40 bg-[#f7f9fb] border-r border-[#e0e3e5] flex flex-col shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-fit min-h-full">
                <div className="h-16 border-b border-[#e0e3e5] bg-white sticky top-0 z-50 shrink-0"></div>
                {rooms.filter(r => filterRoom === 'all' || r.name === filterRoom || r.id === filterRoom).map(room => {
                  const roomInfo = getRoomDetails(room)
                  return (
                    <div key={room.id} className="h-24 border-b border-[#e0e3e5] flex items-center px-4 gap-3 bg-white hover:bg-gray-50 transition-colors shrink-0">
                      <span className={`material-symbols-outlined ${roomInfo.iconColor}`}>{roomInfo.icon}</span>
                      <div className="min-w-0">
                        <span className="text-[12px] font-semibold text-[#191c1e] block truncate uppercase">{room.name}</span>
                        <span className="text-[10px] text-[#5c3f40] uppercase tracking-wide mt-1 block">{roomInfo.sub || (room.capacity ? `${room.capacity} Ghế` : '')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Timeline Area */}
              <div className="relative bg-[#f7f9fb]" style={{ width: `${datesToRender.length * 1440}px` }}>
                {/* Time Header */}
                <div className="h-16 flex flex-col sticky top-0 z-30 bg-white border-b border-[#e0e3e5] shadow-sm">
                  {/* Date Row */}
                  <div className="h-8 flex bg-[#eceef0] border-b border-[#e0e3e5]">
                    {datesToRender.map(date => {
                      const formattedDate = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
                      return (
                        <div key={date} className="w-[1440px] shrink-0 font-bold text-sm text-[#191c1e] flex items-center border-r border-[#e0e3e5] uppercase relative">
                          <span className="sticky left-48 px-4 tracking-wide">{formattedDate}</span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Hour Row */}
                  <div className="h-8 flex">
                    {datesToRender.map(date => (
                      <div key={`hours-${date}`} className="flex w-[1440px] shrink-0 border-r border-[#e0e3e5] border-dashed">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="w-[120px] shrink-0 flex items-center justify-center border-r border-[#e0e3e5] border-dashed text-[13px] font-bold font-mono text-[#191c1e]">
                            {String(i * 2).padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vertical Grid Lines Background */}
                <div className="absolute inset-0 top-16 flex pointer-events-none z-0">
                  {datesToRender.map(date => (
                    <div key={`bg-${date}`} className="flex w-[1440px] shrink-0 border-r border-[#e0e3e5] border-dashed">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} 
                          className={`w-[120px] shrink-0 border-r border-[#e0e3e5] border-dashed opacity-50 h-full ${i >= 1 && i < 4 ? 'opacity-30' : ''}`}
                          style={i >= 1 && i < 4 ? { backgroundImage: `url("${diagonalHatch}")` } : {}}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Current Time Line Indicator */}
                <div 
                  className="absolute top-16 bottom-0 w-px bg-[#b80035] z-10 pointer-events-none transition-all duration-500"
                  style={{ left: getTodayLinePosition() }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#b80035] absolute -top-1 -left-[3px]" />
                </div>

                {/* Grid Content (Room Rows & Showtimes) */}
                <div className="relative z-10">
                  {rooms.filter(r => filterRoom === 'all' || r.name === filterRoom || r.id === filterRoom).map(room => {
                    const roomShowtimes = filteredShowtimes.filter(st => st.roomId === room.id || st.room === room.name)
                    return (
                      <div key={room.id} className="h-24 border-b border-[#e0e3e5] border-dashed relative">
                        {roomShowtimes.map(st => {
                          const { left, width } = calculatePosition(st.time, st.movieId, st.date)
                          const movieObj = movies.find(m => m.id === st.movieId || m.titleVn === st.movie)
                          const posterUrl = movieObj?.posterUrl
                          const formatInfo = getFormatColor(st.format)
                          
                          return (
                            <div
                              key={st.id}
                              className={`absolute top-4 h-[64px] bg-white border ${formatInfo.border} rounded shadow-sm flex items-center p-2 cursor-pointer hover:shadow-md transition-shadow group overflow-hidden`}
                              style={{ left, width }}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${formatInfo.bar}`} />
                              
                              <div className="flex-1 min-w-0 ml-2 flex flex-col justify-center">
                                <h4 className="font-semibold text-[12px] text-[#191c1e] line-clamp-2 leading-tight" title={st.movie}>
                                  {st.movie}
                                </h4>
                                <p className="text-[11px] text-[#5c3f40] font-mono mt-0.5">
                                  {st.time} - {getEndTimeForShowtime(st)}
                                </p>
                              </div>

                              {/* Hover Actions */}
                              <div className="absolute right-0 top-0 bottom-0 bg-white/90 px-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(st); }}
                                  className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
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
            
            {filteredShowtimes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-50 pointer-events-none">
                 <span className="material-symbols-outlined text-5xl text-[#565e74] mb-2">event_busy</span>
                 <p className="text-[#565e74] font-semibold text-sm">Không có lịch chiếu nào trong thời gian này</p>
              </div>
            )}
          </div>
          
          {/* Footer Status */}
          <div className="mt-4 flex justify-between items-center shrink-0">
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ba1a1a]"></div><span className="text-[12px] font-semibold text-[#5c3f40]">IMAX</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#565e74]"></div><span className="text-[12px] font-semibold text-[#5c3f40]">Standard</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00836c]"></div><span className="text-[12px] font-semibold text-[#5c3f40]">3D</span></div>
            </div>
            <span className="text-sm text-[#5c3f40]">Hệ thống quản lý rạp chiếu phim - v2.1.0</span>
          </div>
        </>
      ) : (
        // LIST VIEW (Table)
        <div className="flex-1 bg-white border border-[#e5bdbe] rounded-2xl overflow-hidden shadow-sm p-5 overflow-y-auto">
          {filteredShowtimes.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#e0e3e5]">
              <table className="w-full text-sm">
                <thead className="bg-[#f7f9fb]">
                  <tr className="text-[10px] uppercase font-bold text-[#5c647a] tracking-wider border-b border-[#e0e3e5]">
                    <th className="px-6 py-4 text-left">Phim / Movie</th>
                    <th className="px-6 py-4 text-left">Phòng chiếu</th>
                    <th className="px-6 py-4 text-left">Ngày chiếu</th>
                    <th className="px-6 py-4 text-left">Giờ bắt đầu</th>
                    <th className="px-6 py-4 text-left">Giờ kết thúc</th>
                    <th className="px-6 py-4 text-left">Giá vé</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e3e5] text-xs">
                  {filteredShowtimes.map((st) => (
                    <tr key={st.id} className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#191c1e] max-w-xs break-words">{st.movie}</td>
                      <td className="px-6 py-4 text-[#5c647a] font-semibold">{st.room}</td>
                      <td className="px-6 py-4 font-medium text-[#5c3f40]">{st.date}</td>
                      <td className="px-6 py-4 font-bold text-[#b80035]">
                        <div className="flex items-center gap-1">
                          <Clock size={12} /> {st.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#5c647a]">{getEndTimeForShowtime(st)}</td>
                      <td className="px-6 py-4 font-extrabold font-mono text-[#00836c]">{formatVND(st.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(st)}
                          className="p-2 hover:bg-[#ffdad6] text-[#ba1a1a] rounded transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-[#5c647a]">Không có lịch chiếu nào.</div>
          )}
        </div>
      )}



      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa suất chiếu">
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)] text-sm">
            Bạn có chắc muốn xóa suất chiếu phim <span className="text-white font-semibold">"{deleteTarget?.movie}"</span> lúc <span className="text-red-400 font-bold">{deleteTarget?.time}</span> ngày <span className="text-white font-semibold">{deleteTarget?.date}</span> tại <span className="text-white font-semibold">{deleteTarget?.room}</span>?
          </p>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-xs font-semibold flex items-start gap-2">
              <span className="material-symbols-outlined shrink-0">warning</span>
              <span>Lưu ý: Không thể xóa suất chiếu nếu đã có vé được bán hoặc đặt. Bạn cần hủy tất cả các đơn đặt vé trước khi xóa.</span>
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleDelete}>Xóa lịch</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
