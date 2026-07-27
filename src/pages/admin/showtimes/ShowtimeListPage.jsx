import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Clock, Plus } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { systemConfigService } from '../../../services/systemConfigService'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from 'sonner'

const formatVND = (num) => {
  const validNum = Number(num);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(isNaN(validNum) ? 0 : validNum);
}

const STATUS_META = {
  DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  SCHEDULED: { label: 'Đã lên lịch', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  SOLD_OUT: { label: 'Hết vé', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
  FINISHED: { label: 'Đã chiếu', className: 'bg-slate-100 text-slate-600 border-slate-300' },
}

const getStatusMeta = (status) => STATUS_META[status] || { label: status || '—', className: 'bg-gray-100 text-gray-600 border-gray-300' }

/** Next allowed publish actions for the standard flow (hướng 1). */
const getNextStatusActions = (status) => {
  if (status === 'DRAFT') {
    return [{ status: 'SCHEDULED', label: 'Publish (lên lịch)', icon: 'publish' }]
  }
  if (status === 'SCHEDULED') {
    return [{ status: 'SOLD_OUT', label: 'Hết vé', icon: 'block' }]
  }
  if (status === 'SOLD_OUT') {
    return [{ status: 'SCHEDULED', label: 'Mở lại bán', icon: 'publish' }]
  }
  return []
}

const getFormatColor = (format) => {
  const f = (format || '2D').toUpperCase()
  if (f.includes('IMAX')) return { bar: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', border: 'border-[#ffdad6]' }
  if (f.includes('4D') || f.includes('3D')) return { bar: 'bg-[#00836c]', text: 'text-[#00836c]', border: 'border-[#90f5d9]' }
  if (f.includes('VIP')) return { bar: 'bg-[#e11d48]', text: 'text-[#e11d48]', border: 'border-[#ffb3b6]' }
  return { bar: 'bg-[#565e74]', text: 'text-[#565e74]', border: 'border-[#dae2fd]' }
}

const getRoomDetails = (room) => {
  const nameLower = room.name?.toLowerCase() || '';
  const rawFormats = room.supportedFormats;
  const formats = Array.isArray(rawFormats) ? rawFormats : (typeof rawFormats === 'string' ? rawFormats.split(',') : []);
  const cleanFormats = formats.map(f => String(f).toUpperCase().replace('_', ''));

  if (cleanFormats.includes('IMAX') || nameLower.includes('imax')) {
    return { icon: 'videocam', iconColor: 'text-[#ba1a1a]', sub: 'IMAX' }
  }
  if (nameLower.includes('vip') || nameLower.includes('gold')) {
    return { icon: 'star', iconColor: 'text-[#e11d48]', sub: 'VIP' }
  }
  if (cleanFormats.includes('4DX') || nameLower.includes('4dx') || nameLower.includes('4d')) {
    return { icon: 'tv', iconColor: 'text-[#00836c]', sub: '4DX' }
  }
  if (cleanFormats.includes('3D') || nameLower.includes('3d')) {
    return { icon: 'tv', iconColor: 'text-[#00836c]', sub: '3D' }
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
  const [systemConfigs, setSystemConfigs] = useState([])
  const [loading, setLoading] = useState(true)

  // View Mode
  const [viewMode, setViewMode] = useState('grid')

  // Filters state
  const [filterMovie, setFilterMovie] = useState('all')
  const [filterRoom, setFilterRoom] = useState('all')
  const isFirstLoad = useRef(true)
  
  // Default date to today for grid view to make sense
  const [filterDate, setFilterDate] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
  })

  // Table pagination state
  const [tablePage, setTablePage] = useState(0)
  const [tablePageSize, setTablePageSize] = useState(10)
  const [tableShowtimes, setTableShowtimes] = useState([])
  const [tableTotalElements, setTableTotalElements] = useState(0)
  const [tableTotalPages, setTableTotalPages] = useState(0)
  const [tableLoading, setTableLoading] = useState(false)

  // Timeline range & lazy load state
  const [loadedDateRange, setLoadedDateRange] = useState({ start: '', end: '' })
  const [isLazyLoading, setIsLazyLoading] = useState(false)

  const getTimelineInitialRange = (baseDateStr) => {
    const base = new Date(baseDateStr || Date.now());
    const startObj = new Date(base);
    startObj.setDate(startObj.getDate() - 7);
    const endObj = new Date(base);
    endObj.setDate(endObj.getDate() + 14);
    return {
      startDate: startObj.toISOString().split('T')[0],
      endDate: endObj.toISOString().split('T')[0]
    };
  }

  // Current time state for the timeline indicator
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  const triggerToast = (msg, type = 'success') => {
    if (type === 'success') {
      toast.success(msg)
    } else {
      toast.error(msg)
    }
  }

  const fileInputRef = useRef(null)

  const handleExportClick = () => {
    setShowExportModal(true)
  }

  const executeExport = async (type) => {
    setShowExportModal(false)
    const toastId = toast.loading('Đang chuẩn bị file Excel...')
    try {
      let startDate = null;
      let endDate = null;
      const baseDate = new Date(filterDate);

      if (type === 'month') {
        const y = baseDate.getFullYear();
        const m = baseDate.getMonth();
        startDate = new Date(y, m, 1).toISOString().split('T')[0];
        endDate = new Date(y, m + 1, 0).toISOString().split('T')[0];
      } else if (type === 'week') {
        // Find Monday of the week
        const d = new Date(baseDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(d.setDate(diff));
        startDate = monday.toISOString().split('T')[0];
        // Sunday
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        endDate = sunday.toISOString().split('T')[0];
      }

      let filename = `showtimes_${type === 'all' ? 'all' : startDate + '_to_' + endDate}.xlsx`;
      const data = await showtimeService.exportExcel(startDate, endDate)
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
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
      toast.success(res?.message || 'Phân tích file Excel thành công!', { id: toastId })
      // Navigate to AutoGeneratePage step 2
      navigate(`${basePath}/showtimes/auto-generate`, { state: { importedPreviewList: res.result || res.data } })
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.message || err.message || 'Lỗi không xác định khi nhập file Excel!'
      const errorLines = errMsg.split('\n').filter(line => line.trim() !== '')

      toast.error(
        <div className="text-xs font-semibold leading-relaxed">
          {errorLines.length > 1 ? (
            <ul className="list-disc pl-4 space-y-1">
              {errorLines.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          ) : (
            <span>{errMsg}</span>
          )}
        </div>,
        { id: toastId, duration: 8000 }
      )
    }
  }

  // Load Metadata (Movies, Rooms, System Configs)
  const loadMetadata = async () => {
    try {
      const mRes = await movieService.getAll()
      setMovies(mRes.data || [])
    } catch { setMovies([]) }
    try {
      const rRes = await cinemaRoomService.getAll()
      const rList = rRes.data?.result || rRes.data || []
      const sortedList = (rList.length > 0 ? rList : []).sort((a, b) => 
        String(a.name || '').localeCompare(String(b.name || ''), 'vi', { numeric: true })
      );
      setRooms(sortedList)
    } catch { setRooms([]) }
    try {
      const sRes = await systemConfigService.getAll()
      const sData = sRes?.data?.result || sRes?.data || sRes || [];
      setSystemConfigs(Array.isArray(sData) ? sData : []);
    } catch { setSystemConfigs([]) }
  }

  // Fetch Timeline showtimes (7 days back to 14 days ahead, with lazy append)
  const fetchTimelineShowtimes = async (baseDateStr, isAppend = false) => {
    if (isAppend) {
      setIsLazyLoading(true)
    } else {
      setLoading(true)
    }

    try {
      let startDate, endDate;
      if (isAppend && loadedDateRange.end) {
        const nextStartObj = new Date(loadedDateRange.end);
        nextStartObj.setDate(nextStartObj.getDate() + 1);
        startDate = nextStartObj.toISOString().split('T')[0];

        const nextEndObj = new Date(nextStartObj);
        nextEndObj.setDate(nextEndObj.getDate() + 14);
        endDate = nextEndObj.toISOString().split('T')[0];
      } else {
        const range = getTimelineInitialRange(baseDateStr);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const list = await showtimeService.getAll({
        startDate,
        endDate,
        movieId: filterMovie,
        roomId: filterRoom
      }, 0, 1000)

      if (isAppend) {
        setShowtimes(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = list.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setLoadedDateRange(prev => ({ ...prev, end: endDate }));
      } else {
        setShowtimes(list);
        setLoadedDateRange({ start: startDate, end: endDate });
      }
    } catch (err) {
      console.error('Error fetching timeline showtimes:', err);
      triggerToast('Không thể tải lịch chiếu dòng thời gian!', 'error');
    } finally {
      setLoading(false);
      setIsLazyLoading(false);
    }
  }

  // Fetch Table showtimes (paginated)
  const fetchTableShowtimes = async () => {
    setTableLoading(true);
    try {
      const res = await showtimeService.getAll({
        startDate: filterDate,
        endDate: filterDate,
        movieId: filterMovie,
        roomId: filterRoom
      }, tablePage, tablePageSize);

      setTableShowtimes(res);
      setTableTotalElements(res.totalElements ?? res.length);
      setTableTotalPages(res.totalPages ?? 1);
    } catch (err) {
      console.error('Error fetching table showtimes:', err);
      triggerToast('Không thể tải danh sách dạng bảng!', 'error');
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadMetadata();
    }
  }, [isAuthorized])

  useEffect(() => {
    if (isAuthorized && viewMode === 'grid') {
      fetchTimelineShowtimes(filterDate, false);
    }
  }, [isAuthorized, viewMode, filterDate, filterMovie, filterRoom])

  useEffect(() => {
    if (isAuthorized && viewMode === 'list') {
      fetchTableShowtimes();
    }
  }, [isAuthorized, viewMode, filterDate, filterMovie, filterRoom, tablePage, tablePageSize])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await showtimeService.delete(deleteTarget.id)
      setShowtimes(prev => prev.filter(st => st.id !== deleteTarget.id))
      setTableShowtimes(prev => prev.filter(st => st.id !== deleteTarget.id))
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

  const handleUpdateStatus = async (st, nextStatus) => {
    if (!st?.id || !nextStatus) return
    setStatusUpdatingId(st.id)
    const toastId = toast.loading(`Đang cập nhật trạng thái → ${getStatusMeta(nextStatus).label}...`)
    try {
      const updated = await showtimeService.updateStatus(st.id, nextStatus)
      setShowtimes(prev => prev.map(item => (
        item.id === st.id ? { ...item, ...updated, status: updated.status || nextStatus } : item
      )))
      setTableShowtimes(prev => prev.map(item => (
        item.id === st.id ? { ...item, ...updated, status: updated.status || nextStatus } : item
      )))
      toast.success(
        nextStatus === 'SCHEDULED'
          ? 'Đã publish suất chiếu (SCHEDULED). User đã có thể thấy lịch.'
          : `Đã cập nhật trạng thái: ${getStatusMeta(nextStatus).label}`,
        { id: toastId }
      )
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.message || 'Cập nhật trạng thái thất bại. Kiểm tra transition status.'
      toast.error(message, { id: toastId })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const getEndTimeForShowtime = (st) => {
    if (!st) return ''
    if (st.endTime) {
      try {
        const d = new Date(st.endTime)
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
        }
      } catch { /* ignore */ }
    }
    if (st.time) {
      try {
        const [h, m] = st.time.split(':').map(Number)
        const mObj = movies.find(movie => movie.id === st.movieId || movie.titleVn === st.movie)
        const dur = mObj ? (mObj.durationMinutes || 120) : 120
        const totalMinutes = h * 60 + m + dur
        const endH = Math.floor(totalMinutes / 60) % 24
        const endM = String(totalMinutes % 60).padStart(2, '0')
        return `${String(endH).padStart(2, '0')}:${endM}`
      } catch { /* ignore */ }
    }
    return ''
  }

  const [timelineDaysCount, setTimelineDaysCount] = useState(14)

  useEffect(() => {
    setTimelineDaysCount(14)
  }, [filterDate])

  // Build datesToRender from loadedDateRange (covers full loaded window)
  const datesToRender = (() => {
    try {
      const startStr = loadedDateRange.start || filterDate
      const endStr = loadedDateRange.end || filterDate
      if (!startStr || !endStr) return [filterDate || new Date().toISOString().split('T')[0]]

      const start = new Date(startStr)
      const end = new Date(endStr)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return [filterDate || new Date().toISOString().split('T')[0]]
      }

      const days = []
      const cur = new Date(start)
      let count = 0
      while (cur <= end && count < 120) {
        days.push(cur.toISOString().split('T')[0])
        cur.setDate(cur.getDate() + 1)
        count++
      }
      return days.length > 0 ? days : [filterDate]
    } catch {
      return [filterDate || new Date().toISOString().split('T')[0]]
    }
  })()

  const filteredShowtimes = showtimes.filter(st => {
    const matchMovie = filterMovie === 'all' || st.movieId === filterMovie
    const matchRoom = filterRoom === 'all' || st.roomId === filterRoom
    return matchMovie && matchRoom
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
  const getBusinessHours = () => {
    const startHour = 8;
    const endHour = 26; // Buffer cho suất chiếu muộn đến 2h sáng
    return { 
      startHour, 
      endHour, 
      businessHours: endHour - startHour, 
      businessMinutes: (endHour - startHour) * 60 
    };
  };
  
  const calculatePosition = (timeStr, movieId, stDate) => {
    try {
      if (!timeStr || !stDate || typeof stDate !== 'string' || typeof timeStr !== 'string') {
        return { left: '0px', width: '120px' }
      }
      const mObj = movies.find(m => m.id === movieId || m.titleVn === movieId)
      const durationMins = mObj ? (mObj.durationMinutes || 120) : 120
      const { startHour, businessMinutes } = getBusinessHours();

      // IMPORTANT: Base date is the START date of the rendered timeline grid (datesToRender[0])
      const timelineStartStr = datesToRender[0] || filterDate
      const bParts = (timelineStartStr || '').split('-')
      if (bParts.length < 3) return { left: '0px', width: `${durationMins}px` }
      
      const baseDateObj = new Date(Number(bParts[0]), Number(bParts[1]) - 1, Number(bParts[2]))
      baseDateObj.setHours(startHour, 0, 0, 0)

      const stParts = stDate.split('-')
      if (stParts.length < 3) return { left: '0px', width: `${durationMins}px` }
      
      const stDateObj = new Date(Number(stParts[0]), Number(stParts[1]) - 1, Number(stParts[2]))
      const timeParts = timeStr.split(':').map(Number)
      let h = timeParts[0] || 0
      let m = timeParts[1] || 0
      stDateObj.setHours(h, m, 0, 0)

      const diffTimeMs = stDateObj.getTime() - baseDateObj.getTime()
      if (isNaN(diffTimeMs)) return { left: '0px', width: `${durationMins}px` }

      // Total calendar days between timelineStartStr and stDate
      const realDaysPassed = Math.floor(diffTimeMs / (24 * 3600 * 1000))
      const remainderMs = diffTimeMs % (24 * 3600 * 1000)
      const minutesIntoDay = Math.floor(remainderMs / 60000)

      const totalMinutes = (realDaysPassed * businessMinutes) + minutesIntoDay

      return {
        left: `${totalMinutes}px`,
        width: `${durationMins}px`,
      }
    } catch {
      return { left: '0px', width: '120px' }
    }
  }

  const getTodayLinePosition = () => {
    try {
      const { startHour, businessMinutes } = getBusinessHours();
      const timelineStartStr = datesToRender[0] || filterDate
      if (!timelineStartStr || typeof timelineStartStr !== 'string') return '-10px';
      const parts = timelineStartStr.split('-');
      if (parts.length < 3) return '-10px';
      const [y, m, d] = parts.map(Number);
      const baseDateObj = new Date(y, m - 1, d);
      baseDateObj.setHours(startHour, 0, 0, 0);

      const diffTimeMs = now.getTime() - baseDateObj.getTime();
      if (isNaN(diffTimeMs)) return '-10px';
      const realDaysPassed = Math.floor(diffTimeMs / (24 * 3600 * 1000));
      const remainderMs = diffTimeMs % (24 * 3600 * 1000);
      const minutesIntoDay = Math.floor(remainderMs / (1000 * 60));
      const totalMinutes = (realDaysPassed * businessMinutes) + minutesIntoDay;

      return totalMinutes > 0 ? `${totalMinutes}px` : '-10px';
    } catch {
      return '-10px';
    }
  }

  // Hatch Pattern SVG cho giờ đóng cửa
  const diagonalHatch = "data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-2,10 L10,-2 M-2,2 L2,-2 M6,10 L10,6' stroke='%23e0e3e5' stroke-width='1' fill='none' opacity='0.5'/%3E%3C/svg%3E"

  const handleTimelineScroll = (e) => {
    const target = e.target
    if (!isLazyLoading && target.scrollLeft + target.clientWidth >= target.scrollWidth - 600) {
      setTimelineDaysCount(prev => Math.min(prev + 14, 90))
      fetchTimelineShowtimes(filterDate, true)
    }
  }

  // Auto scroll timeline container to 08:00 AM of the selected filterDate
  const timelineContainerRef = useRef(null)
  useEffect(() => {
    if (!timelineContainerRef.current || viewMode !== 'grid') return

    try {
      const timelineStartStr = datesToRender[0] || filterDate
      const bParts = (timelineStartStr || '').split('-').map(Number)
      const dParts = (filterDate || '').split('-').map(Number)

      if (bParts.length >= 3 && dParts.length >= 3) {
        const baseDateObj = new Date(bParts[0], bParts[1] - 1, bParts[2])
        const targetDateObj = new Date(dParts[0], dParts[1] - 1, dParts[2])
        const diffDays = Math.round((targetDateObj.getTime() - baseDateObj.getTime()) / (24 * 3600 * 1000))

        const { businessMinutes } = getBusinessHours()
        let px = diffDays * businessMinutes
        if (px < 0) px = 0
        timelineContainerRef.current.scrollTo({ left: px, behavior: 'smooth' })
      }
    } catch (err) {
      console.error('Error auto scrolling timeline:', err)
    }
  }, [filterDate, viewMode, loadedDateRange.start])

  return (
    <div className="flex-1 flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans h-full min-h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 shrink-0">
        <div>
          <h1
            className="text-3xl text-[var(--color-on-surface)] font-bold tracking-wider uppercase"
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
            onClick={handleExportClick}
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
      <div className="flex justify-between items-center bg-white border border-[#e5bdbe] rounded-xl p-3 mb-4 shrink-0 shadow-sm">
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={filterMovie}
              onChange={(e) => {
                setFilterMovie(e.target.value)
                setTablePage(0)
              }}
              className="appearance-none bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg px-4 py-2 pr-10 text-sm font-semibold text-[#191c1e] focus:outline-none focus:border-[#b80035] transition-colors cursor-pointer w-56"
            >
              <option value="all">Tất cả phim</option>
              {movies.map(m => (
                <option key={m.id} value={m.id}>{m.titleVn}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2 text-[#5c3f40] pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select
              value={filterRoom}
              onChange={(e) => {
                setFilterRoom(e.target.value)
                setTablePage(0)
              }}
              className="appearance-none bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg px-4 py-2 pr-10 text-sm font-semibold text-[#191c1e] focus:outline-none focus:border-[#b80035] transition-colors cursor-pointer w-48"
            >
              <option value="all">Tất cả phòng chiếu</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2 text-[#5c3f40] pointer-events-none">expand_more</span>
          </div>

          <div className="relative flex items-center bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg px-4 py-2 cursor-pointer hover:border-[#b80035] transition-colors focus-within:border-[#b80035]">
            <span className="material-symbols-outlined text-[#b80035] mr-2 text-[18px]">calendar_month</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value)
                setTablePage(0)
              }}
              className="bg-transparent border-none outline-none text-sm font-bold text-[#191c1e] p-0 cursor-pointer focus:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-wide text-[#5c647a] uppercase">Chế độ xem</span>
          <div className="flex bg-[#eceef0] rounded-lg p-1 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-1.5 flex items-center gap-2 text-sm font-semibold rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-[#b80035] shadow-sm' : 'text-[#5c647a] hover:text-[#191c1e]'}`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span> Dòng thời gian
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 flex items-center gap-2 text-sm font-semibold rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-[#b80035] shadow-sm' : 'text-[#5c647a] hover:text-[#191c1e]'}`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span> Dạng bảng
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex justify-center items-center flex-1 bg-white rounded-2xl shadow-sm border border-[#e5bdbe]">
          <span className="material-symbols-outlined animate-spin text-5xl text-[#b80035]">progress_activity</span>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          {/* Timeline Board - Seamless Horizontal View */}
          <div 
            ref={timelineContainerRef}
            className="flex-1 overflow-auto custom-scrollbar flex bg-white border border-[#e5bdbe] rounded-2xl shadow-sm min-h-0 relative"
            onScroll={handleTimelineScroll}
          >
            {isLazyLoading && (
              <div className="sticky right-4 top-3 z-50 ml-auto bg-[#b80035] text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5 animate-pulse w-fit pointer-events-none">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Đang tải thêm suất chiếu (Lazy loading)...
              </div>
            )}
            <div className="flex h-full min-h-full" style={{ width: `calc(192px + ${datesToRender.length * getBusinessHours().businessMinutes}px)` }}>
              
              {/* Sidebar (Rooms) */}
              <div className="w-48 shrink-0 sticky left-0 z-40 bg-white border-r border-[#e5bdbe] flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.05)] h-full min-h-full">
                <div className="h-[60px] border-b border-[#e5bdbe] bg-[#f7f9fb] sticky top-0 z-50 shrink-0 flex items-center justify-center">
                   <span className="text-xs font-black tracking-widest text-[#5c647a] uppercase">PHÒNG CHIẾU</span>
                </div>
                {rooms.filter(r => filterRoom === 'all' || r.id === filterRoom).map(room => {
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
              <div className="relative bg-[#f7f9fb]" style={{ width: `${datesToRender.length * getBusinessHours().businessMinutes}px` }}>
                {/* Time Header */}
                <div className="h-16 flex flex-col sticky top-0 z-30 bg-white border-b border-[#e0e3e5] shadow-sm">
                  {/* Date Row */}
                  <div className="h-8 flex bg-[#eceef0] border-b border-[#e0e3e5]">
                    {datesToRender.map((date, index) => {
                      const formattedDate = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
                      return (
                        <div key={date} 
                          className={`shrink-0 font-extrabold text-sm flex items-center border-r border-[#e0e3e5] uppercase relative ${index % 2 === 0 ? 'bg-white text-[#b80035]' : 'bg-[#f1f8f5] text-[#191c1e]'}`}
                          style={{ width: `${getBusinessHours().businessMinutes}px` }}
                        >
                          <span className="sticky left-48 px-4 tracking-wide">{formattedDate}</span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Hour Row */}
                  <div className="h-8 flex">
                    {datesToRender.map((date, index) => {
                      const { startHour, businessHours, businessMinutes } = getBusinessHours();
                      const numBlocks = Math.ceil(businessHours / 2);
                      return (
                        <div key={`hours-${date}`} 
                          className={`flex shrink-0 border-r border-[#e0e3e5] border-dashed ${index % 2 === 0 ? 'bg-white' : 'bg-[#f1f8f5]'}`}
                          style={{ width: `${businessMinutes}px` }}
                        >
                          {Array.from({ length: numBlocks }).map((_, i) => (
                            <div key={i} className="w-[120px] shrink-0 flex items-center justify-center border-r border-[#e0e3e5] border-dashed text-[13px] font-bold font-mono text-[#5c647a]">
                              {String((startHour + i * 2) % 24).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Vertical Grid Lines Background */}
                <div className="absolute inset-0 top-16 flex pointer-events-none z-0">
                  {datesToRender.map((date, index) => {
                    const { businessHours, businessMinutes, startHour } = getBusinessHours();
                    const numBlocks = Math.ceil(businessHours / 2);
                    
                    // Tính tọa độ cho Khung giờ vàng (18:00 - 21:00)
                    const goldenStartLeft = (18 - startHour) * 60;
                    const goldenWidth = (21 - 18) * 60;

                    return (
                      <div key={`bg-${date}`} 
                        className={`flex shrink-0 border-r border-[#e0e3e5] border-dashed relative ${index % 2 === 0 ? 'bg-white' : 'bg-[#f1f8f5]'}`}
                        style={{ width: `${businessMinutes}px` }}
                      >
                        {/* Vẽ các ô 2 tiếng */}
                        {Array.from({ length: numBlocks }).map((_, i) => (
                          <div key={i} 
                            className={`w-[120px] shrink-0 border-r border-[#e0e3e5] border-dashed opacity-50 h-full relative z-10`}
                          />
                        ))}
                        
                        {/* Highlight Khung giờ vàng */}
                        <div 
                          className="absolute top-0 bottom-0 bg-[#fff8e1]/60 border-x border-[#ffe082]/50 z-0"
                          style={{ left: `${goldenStartLeft}px`, width: `${goldenWidth}px` }}
                        />
                      </div>
                    )
                  })}
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
                  {rooms.filter(r => filterRoom === 'all' || r.id === filterRoom).map(room => {
                    const roomShowtimes = filteredShowtimes.filter(st => st.roomId === room.id)
                    return (
                      <div key={room.id} className="h-24 border-b border-[#e0e3e5] border-dashed relative">
                        {roomShowtimes.map(st => {
                          const { left, width } = calculatePosition(st.time, st.movieId, st.date)
                          const movieObj = movies.find(m => m.id === st.movieId || m.titleVn === st.movie)
                          const posterUrl = movieObj?.posterUrl
                          const isAnimation = Array.isArray(movieObj?.genres)
                            ? movieObj.genres.some(g => (g?.name || g || '').toString().toLowerCase().includes('hoạt hình'))
                            : false;
                          const isDubbed = isAnimation && st.language === 'Lồng tiếng'
                          const isGoldenHour = st.goldenHour || st.isGoldenHour
                          const statusMeta = getStatusMeta(st.status)
                          const nextActions = getNextStatusActions(st.status)
                          const isDraft = st.status === 'DRAFT'

                          const barColor = isDraft ? 'bg-purple-600' : (st.status === 'SOLD_OUT' ? 'bg-amber-500' : 'bg-[#4caf50]')
                          const bgColor = isDraft
                            ? (isDubbed
                              ? 'bg-[repeating-linear-gradient(-45deg,#fff,#fff_6px,#f3e8ff_6px,#f3e8ff_12px)]'
                              : 'bg-purple-50/90')
                            : (isDubbed
                              ? 'bg-[repeating-linear-gradient(-45deg,#fff,#fff_6px,#fff0f2_6px,#fff0f2_12px)]'
                              : 'bg-[#e8f5e9]')
                          const borderColor = isDraft ? 'border-purple-200' : (st.status === 'SOLD_OUT' ? 'border-amber-300' : 'border-[#a5d6a7]')
                          const textColor = isDraft ? 'text-purple-700' : (st.status === 'SOLD_OUT' ? 'text-amber-700' : 'text-[#2e7d32]')
                          return (
                            <div
                              key={st.id}
                              className={`absolute top-2 h-[76px] ${bgColor} border ${borderColor} rounded-xl flex flex-col justify-between pl-3.5 pr-2 py-2 cursor-pointer hover:shadow-md transition-all group overflow-hidden shadow-sm ${isDraft ? 'opacity-90' : ''}`}
                              style={{ left, width }}
                              onClick={() => navigate(`${basePath}/showtimes/${st.id}`)}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${barColor}`} />

                              <div className="flex-1 min-w-0 flex flex-col justify-between relative z-10 pointer-events-none">
                                <h4 className="font-bold text-[12px] text-[#191c1e] truncate leading-tight uppercase" title={st.movie}>
                                  {st.movie}
                                </h4>
                                <div className="flex gap-1.5 items-center my-0.5">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-tight ${isDraft ? 'bg-purple-100 text-purple-700' : 'bg-[#c8e6c9] text-[#2e7d32]'}`}>
                                    {st.format || '2D'}
                                  </span>
                                  {st.status !== 'SCHEDULED' && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-tight ${statusMeta.className}`}>
                                      {statusMeta.label}
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[11px] ${textColor} font-mono font-semibold flex items-center gap-1 leading-none`}>
                                  <span>{st.time} - {getEndTimeForShowtime(st)}</span>
                                </div>
                              </div>

                              {/* Hover Actions */}
                              <div className="absolute right-0 top-0 bottom-0 bg-white/95 px-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-auto shadow-sm rounded-r-xl">
                                {nextActions.filter(action => action.status !== 'SOLD_OUT').map(action => (
                                  <button
                                    key={action.status}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(st, action.status)
                                    }}
                                    disabled={statusUpdatingId === st.id}
                                    title={action.label}
                                    className="p-1.5 text-[#1565c0] hover:bg-[#e3f2fd] rounded-full transition-colors bg-white shadow-sm disabled:opacity-50"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">{action.icon}</span>
                                  </button>
                                ))}
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
          </div>
          
          {/* Footer Status */}
          <div className="mt-4 flex justify-between items-center shrink-0">
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ba1a1a]"></div><span className="text-[12px] font-semibold text-[#5c3f40]">IMAX</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#565e74]"></div><span className="text-[12px] font-semibold text-[#5c3f40]">Standard</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00836c]"></div><span className="text-[12px] font-semibold text-[#5c3f40]">3D</span></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-[repeating-linear-gradient(-45deg,#fff,#fff_3px,#fff0f2_3px,#fff0f2_6px)] border border-[#e5bdbe]"></div>
                <span className="text-[12px] font-semibold text-[#5c3f40]">Lồng tiếng (Phim Hoạt Hình)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-[#fff8e1] border border-[#ffe082]"></div>
                <span className="text-[12px] font-semibold text-[#5c3f40]">Giờ vàng</span>
              </div>
            </div>
            <span className="text-sm text-[#5c3f40]">Hệ thống quản lý rạp chiếu phim - v2.1.0</span>
          </div>
        </>
      ) : (
        // LIST VIEW (Table)
        <div className="flex-1 bg-white border border-[#e5bdbe] rounded-2xl overflow-hidden shadow-sm p-5 flex flex-col min-h-0">
          {tableLoading ? (
            <div className="py-24 flex justify-center items-center flex-1">
              <span className="material-symbols-outlined animate-spin text-5xl text-[#b80035]">progress_activity</span>
            </div>
          ) : tableShowtimes.length > 0 ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-[#e0e3e5] flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-[#f7f9fb]">
                    <tr className="text-[10px] uppercase font-bold text-[#5c647a] tracking-wider border-b border-[#e0e3e5]">
                      <th className="px-6 py-4 text-left">Phim / Movie</th>
                      <th className="px-6 py-4 text-left">Phòng chiếu</th>
                      <th className="px-6 py-4 text-left">Ngày chiếu</th>
                      <th className="px-6 py-4 text-left">Giờ chiếu</th>
                      <th className="px-6 py-4 text-left">Trạng thái</th>
                      <th className="px-6 py-4 text-left">Ngôn ngữ</th>
                      <th className="px-6 py-4 text-left">Giá vé</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3e5] text-xs">
                    {tableShowtimes.map((st) => {
                      const statusMeta = getStatusMeta(st.status)
                      const nextActions = getNextStatusActions(st.status)
                      return (
                      <tr 
                        key={st.id} 
                        className="hover:bg-[#f7f9fb] transition-colors cursor-pointer"
                        onClick={() => navigate(`${basePath}/showtimes/${st.id}`)}
                      >
                        <td className="px-6 py-4 font-bold text-[#191c1e] max-w-xs break-words">{st.movie}</td>
                        <td className="px-6 py-4 text-[#5c647a] font-semibold">{st.room}</td>
                        <td className="px-6 py-4 font-medium text-[#5c3f40]">{st.date}</td>
                        <td className="px-6 py-4 font-bold text-[#b80035]">
                          <div className="flex items-center gap-1">
                            <Clock size={12} /> {st.time} - {getEndTimeForShowtime(st)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {st.status !== 'SCHEDULED' ? (
                            <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold">
                          <span className={`px-2 py-0.5 border rounded text-[10px] uppercase ${st.language === 'Lồng tiếng' ? 'bg-[#fff0f2] text-[#b80035] border-[#ffdad6]' : 'bg-[#f7f9fb] text-[#5c647a] border-[#e0e3e5]'}`}>
                            {st.language || 'Phụ đề'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold font-mono text-[#00836c]">{formatVND(st.price)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {nextActions.filter(action => action.status !== 'SOLD_OUT').map(action => (
                              <button
                                key={action.status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(st, action.status);
                                }}
                                disabled={statusUpdatingId === st.id}
                                className="p-2 hover:bg-[#e3f2fd] text-[#1565c0] rounded transition-all cursor-pointer disabled:opacity-50"
                                title={action.label}
                              >
                                <span className="material-symbols-outlined text-[16px]">{action.icon}</span>
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-3 border-t border-[#e0e3e5] text-xs font-semibold text-[#5c647a] shrink-0">
                <div className="flex items-center gap-4">
                  <span>
                    Hiển thị {tableTotalElements > 0 ? tablePage * tablePageSize + 1 : 0} - {Math.min((tablePage + 1) * tablePageSize, tableTotalElements)} trên tổng số <strong className="text-[#191c1e]">{tableTotalElements}</strong> suất chiếu
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Hiển thị</span>
                    <select
                      value={tablePageSize}
                      onChange={(e) => {
                        setTablePageSize(Number(e.target.value))
                        setTablePage(0)
                      }}
                      className="bg-[#f7f9fb] border border-[#e0e3e5] rounded px-2 py-1 text-xs font-bold text-[#191c1e] focus:outline-none focus:border-[#b80035]"
                    >
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                      <option value={100}>100 / trang</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTablePage(0)}
                    disabled={tablePage === 0 || tableLoading}
                    className="px-2.5 py-1 rounded bg-[#f7f9fb] border border-[#e0e3e5] hover:bg-[#eceef0] disabled:opacity-40 font-bold transition-colors cursor-pointer"
                    title="Trang đầu"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setTablePage(p => Math.max(0, p - 1))}
                    disabled={tablePage === 0 || tableLoading}
                    className="px-3 py-1 rounded bg-[#f7f9fb] border border-[#e0e3e5] hover:bg-[#eceef0] disabled:opacity-40 font-bold transition-colors cursor-pointer"
                  >
                    Trước
                  </button>

                  {Array.from({ length: Math.min(5, tableTotalPages) }).map((_, idx) => {
                    let pNum = tablePage - 2 + idx;
                    if (tablePage < 2) pNum = idx;
                    else if (tablePage > tableTotalPages - 3) pNum = tableTotalPages - 5 + idx;
                    if (pNum < 0 || pNum >= tableTotalPages) return null;
                    return (
                      <button
                        key={pNum}
                        onClick={() => setTablePage(pNum)}
                        className={`px-3 py-1 rounded border font-bold transition-colors cursor-pointer ${
                          pNum === tablePage
                            ? 'bg-[#b80035] text-white border-[#b80035]'
                            : 'bg-white text-[#191c1e] border-[#e0e3e5] hover:bg-[#f7f9fb]'
                        }`}
                      >
                        {pNum + 1}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setTablePage(p => Math.min(tableTotalPages - 1, p + 1))}
                    disabled={tablePage >= tableTotalPages - 1 || tableLoading}
                    className="px-3 py-1 rounded bg-[#f7f9fb] border border-[#e0e3e5] hover:bg-[#eceef0] disabled:opacity-40 font-bold transition-colors cursor-pointer"
                  >
                    Sau
                  </button>
                  <button
                    onClick={() => setTablePage(tableTotalPages - 1)}
                    disabled={tablePage >= tableTotalPages - 1 || tableLoading}
                    className="px-2.5 py-1 rounded bg-[#f7f9fb] border border-[#e0e3e5] hover:bg-[#eceef0] disabled:opacity-40 font-bold transition-colors cursor-pointer"
                    title="Trang cuối"
                  >
                    »
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-[#5c647a]">Không có lịch chiếu nào.</div>
          )}
        </div>
      )}



      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa suất chiếu" theme="light">
        <div className="space-y-4">
          <p className="text-[#5c647a] text-sm">
            Bạn có chắc muốn xóa suất chiếu phim <span className="text-[#191c1e] font-semibold">"{deleteTarget?.movie}"</span> lúc <span className="text-[#b80035] font-bold">{deleteTarget?.time}</span> ngày <span className="text-[#191c1e] font-semibold">{deleteTarget?.date}</span> tại <span className="text-[#191c1e] font-semibold">{deleteTarget?.room}</span>?
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

      {/* Export Confirmation Modal */}
      <Modal open={showExportModal} onClose={() => setShowExportModal(false)} title="Tùy chọn Xuất Excel" theme="light">
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)] text-sm">
            Vui lòng chọn phạm vi thời gian bạn muốn xuất lịch chiếu ra file Excel. Phạm vi được tính dựa trên ngày đang chọn trên lịch ({filterDate}).
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="outline" onClick={() => executeExport('week')} className="justify-start border-[#e5bdbe] hover:bg-[#ffdad6]/20">
              <span className="material-symbols-outlined mr-3 text-[#b80035]">date_range</span>
              <div className="text-left">
                <div className="font-bold text-[#191c1e]">Tuần này</div>
                <div className="text-xs text-[#5c647a] font-normal">Chỉ xuất các suất chiếu trong tuần của ngày {filterDate}</div>
              </div>
            </Button>
            <Button variant="outline" onClick={() => executeExport('month')} className="justify-start border-[#e5bdbe] hover:bg-[#ffdad6]/20">
              <span className="material-symbols-outlined mr-3 text-[#b80035]">calendar_month</span>
              <div className="text-left">
                <div className="font-bold text-[#191c1e]">Tháng này</div>
                <div className="text-xs text-[#5c647a] font-normal">Chỉ xuất các suất chiếu trong tháng của ngày {filterDate}</div>
              </div>
            </Button>
            <Button variant="outline" onClick={() => executeExport('all')} className="justify-start border-[#e5bdbe] hover:bg-[#ffdad6]/20">
              <span className="material-symbols-outlined mr-3 text-[#b80035]">database</span>
              <div className="text-left">
                <div className="font-bold text-[#191c1e]">Toàn bộ dữ liệu</div>
                <div className="text-xs text-[#5c647a] font-normal">Xuất tất cả suất chiếu hiện có trong hệ thống</div>
              </div>
            </Button>
          </div>
          <div className="flex justify-end pt-4 border-t border-[#e0e3e5] mt-2">
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>Hủy</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
