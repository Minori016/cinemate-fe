import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Clock, 
  CalendarDays, 
  DoorOpen, 
  Film, 
  DollarSign, 
  Flame,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Calendar
} from 'lucide-react'
import Button from '../../../components/common/Button'

const formatVND = (num) => {
  const validNum = Number(num);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(isNaN(validNum) ? 0 : validNum);
}

const STATUS_META = {
  DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  SCHEDULED: { label: 'Đã lên lịch', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  SOLD_OUT: { label: 'Hết vé', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
  FINISHED: { label: 'Đã chiếu', className: 'bg-slate-100 text-slate-600 border-slate-300' },
}

const getStatusMeta = (status) => STATUS_META[status] || { label: status || '—', className: 'bg-gray-100 text-gray-700 border-gray-300' }

export default function ShowtimeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const isAdmin = user && user.roles?.includes('ADMIN')
  const isManager = user && user.roles?.includes('MANAGER')
  const isAuthorized = isAdmin || isManager
  const basePath = isAdmin ? '/admin' : '/manager'

  // States
  const [showtime, setShowtime] = useState(null)
  const [movie, setMovie] = useState(null)
  const [seatLayout, setSeatLayout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [allShowtimes, setAllShowtimes] = useState([])
  
  // Sidebar Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarDateFilter, setSidebarDateFilter] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch showtime details
      const st = await showtimeService.getById(id)
      setShowtime(st)

      // Load showtimes for sidebar list (7 days back to 14 days ahead of current showtime)
      try {
        const stDate = st?.date || (st?.startTime ? st.startTime.split('T')[0] : new Date().toISOString().split('T')[0])
        const d = new Date(stDate)
        const startObj = new Date(d)
        startObj.setDate(startObj.getDate() - 7)
        const endObj = new Date(d)
        endObj.setDate(endObj.getDate() + 14)

        const list = await showtimeService.getAll({
          startDate: startObj.toISOString().split('T')[0],
          endDate: endObj.toISOString().split('T')[0]
        }, 0, 500)
        setAllShowtimes(list || [])
      } catch (err) {
        console.error('Failed to load showtimes list for sidebar:', err)
      }

      // 2. Fetch movie details
      if (st.movieId) {
        try {
          const mRes = await movieService.getById(st.movieId)
          setMovie(mRes.data || null)
        } catch (err) {
          console.error('Failed to load movie details:', err)
        }
      }

      // 3. Fetch seat layout for room
      if (st.roomId) {
        try {
          const data = await cinemaRoomService.getLayoutNormalized(st.roomId, {
            roomName: st.roomName || st.room || '',
          })
          if (data?.seatMatrix?.length) {
            setSeatLayout(data)
          }
        } catch (err) {
          console.error('Failed to load seat layout:', err)
        }
      }
    } catch (err) {
      console.error('Error loading showtime details:', err)
      toast.error('Không thể tải thông tin chi tiết suất chiếu!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthorized && id) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthorized])

  const handleUpdateStatus = async (nextStatus) => {
    if (!showtime?.id) return
    setStatusUpdating(true)
    const toastId = toast.loading(`Đang cập nhật trạng thái → ${getStatusMeta(nextStatus).label}...`)
    try {
      const updated = await showtimeService.updateStatus(showtime.id, nextStatus)
      setShowtime(prev => ({ ...prev, ...updated, status: updated.status || nextStatus }))
      
      // Update status in local sidebar list too
      setAllShowtimes(prev => prev.map(item => 
        item.id === showtime.id ? { ...item, status: updated.status || nextStatus } : item
      ))
      
      toast.success(`Đã cập nhật trạng thái: ${getStatusMeta(nextStatus).label}`, { id: toastId })
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.message || 'Cập nhật trạng thái thất bại.'
      toast.error(message, { id: toastId })
    } finally {
      setStatusUpdating(false)
    }
  }

  // Access Denied
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
          Chỉ có tài khoản Quản trị viên (Admin) hoặc Quản lý (Manager) mới có quyền xem chi tiết lịch chiếu.
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

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center flex-1 min-h-[70vh]">
        <span className="material-symbols-outlined animate-spin text-5xl text-[#b80035] mb-2">progress_activity</span>
        <p className="text-gray-500 font-semibold text-sm">Đang tải thông tin chi tiết suất chiếu...</p>
      </div>
    )
  }

  if (!showtime) {
    return (
      <div className="py-16 text-center flex-1 flex flex-col justify-center items-center bg-white rounded-2xl shadow-sm border border-[#e5bdbe]">
        <AlertTriangle size={48} className="text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-800">Không tìm thấy suất chiếu</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">Suất chiếu bạn yêu cầu không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => navigate(`${basePath}/showtimes`)}>Quay lại danh sách</Button>
      </div>
    )
  }

  // Format Show Date
  let formattedDate = showtime.date
  try {
    if (showtime.date) {
      formattedDate = new Date(showtime.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  } catch (e) {
    console.error(e)
  }

  // Calculate cleaning buffer (same logic as list page)
  const getCleaningBuffer = () => {
    const name = String(showtime.room || '').toUpperCase()
    const fmt = String(showtime.format || '').toUpperCase()
    if (name.includes('IMAX') || fmt.includes('IMAX')) return 30
    if (name.includes('4DX') || fmt.includes('4DX') || name.includes('4D') || fmt.includes('4D')) return 20
    if (name.includes('3D') || fmt.includes('3D')) return 20
    return 15
  }

  const bufferMinutes = getCleaningBuffer()
  const statusMeta = getStatusMeta(showtime.status)

  // Filter sidebar showtimes
  const filteredSidebarShowtimes = allShowtimes.filter(st => {
    const matchSearch = String(st.movie || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchDate = !sidebarDateFilter || st.date === sidebarDateFilter
    return matchSearch && matchDate
  })

  return (
    <div className="flex-1 flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans h-full min-h-[calc(100vh-80px)] p-6">
      
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0 border-b border-gray-200 pb-4">
        <button 
          onClick={() => navigate(`${basePath}/showtimes`)}
          className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={18} className="text-[#b80035]" />
        </button>
        <div>
          <span className="text-xs uppercase tracking-widest text-[#5c647a] font-bold">Quản lý lịch chiếu</span>
          <h1 className="text-xl sm:text-2xl font-black text-[#191c1e] leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Chi tiết suất chiếu - {showtime.movie}
          </h1>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start h-full">
        
        {/* Left Side: Local Showtimes Sidebar List */}
        <div className="w-full xl:w-80 xl:shrink-0 bg-white border border-[#e5bdbe] rounded-2xl p-4 flex flex-col shadow-sm xl:h-[calc(100vh-180px)] xl:sticky xl:top-6 overflow-hidden">
          <div className="mb-4">
            <h2 className="text-xs font-black uppercase text-[#191c1e] tracking-wider mb-3 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <span className="material-symbols-outlined text-[#b80035] text-[18px]">list_alt</span>
              Suất chiếu khác ({filteredSidebarShowtimes.length})
            </h2>
            
            {/* Search Input */}
            <div className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên phim..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#b80035] transition-colors"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            {/* Date filter */}
            <div className="relative">
              <input
                type="date"
                value={sidebarDateFilter}
                onChange={(e) => setSidebarDateFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#b80035] transition-colors cursor-pointer"
              />
              <Calendar size={14} className="absolute left-3 top-2.5 text-gray-400" />
              {sidebarDateFilter && (
                <button 
                  onClick={() => setSidebarDateFilter('')}
                  className="absolute right-3 top-2 text-[10px] text-red-500 font-bold hover:underline"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[300px] xl:max-h-none">
            {filteredSidebarShowtimes.length > 0 ? (
              filteredSidebarShowtimes.map(st => {
                const isActive = String(st.id) === String(showtime.id)
                const isDraft = st.status === 'DRAFT'
                const isGolden = st.goldenHour || st.isGoldenHour
                const badgeMeta = getStatusMeta(st.status)
                
                return (
                  <div
                    key={st.id}
                    onClick={() => navigate(`${basePath}/showtimes/${st.id}`)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                      isActive 
                        ? 'border-[#b80035] bg-[#fff0f2] shadow-sm' 
                        : 'border-gray-150 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Left border indicator for active/draft */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isActive 
                        ? 'bg-[#b80035]' 
                        : isDraft ? 'bg-gray-300' : isGolden ? 'bg-[#ffb300]' : 'bg-[#4caf50]'
                    }`} />

                    <h4 className="font-bold text-xs text-[#191c1e] line-clamp-1 pl-1.5 uppercase leading-tight mb-1" title={st.movie}>
                      {st.movie}
                    </h4>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pl-1.5 mt-1.5">
                      <span className="font-bold font-mono text-[#b80035]">
                        {st.time} — {st.room}
                      </span>
                      <span className="text-gray-400">
                        {st.date}
                      </span>
                    </div>

                    <div className="flex gap-1 mt-2 pl-1.5 items-center">
                      <span className={`text-[8px] px-1 py-0.5 rounded font-extrabold ${isGolden ? 'bg-[#ffe082] text-[#ff6f00]' : 'bg-gray-100 text-gray-600'}`}>
                        {st.format}
                      </span>
                      {st.status !== 'SCHEDULED' && (
                        <span className={`text-[8px] px-1 py-0.5 rounded font-extrabold border ${badgeMeta.className}`}>
                          {badgeMeta.label}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">
                Không tìm thấy suất chiếu nào.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Main Detail & Seat Map Layout */}
        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Movie Info & Pricing */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Movie Card */}
            <div className="bg-white border border-[#e5bdbe] rounded-2xl overflow-hidden shadow-sm">
              <div className="h-28 bg-gradient-to-r from-[#b80035]/20 to-[#ffd9da]/30 relative flex items-end p-4">
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded font-black text-[10px] bg-red-600 text-white uppercase tracking-wider">
                  {movie?.rating || showtime.rating || 'T13'}
                </span>
              </div>
              
              <div className="px-5 pb-6 pt-4 relative">
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-36 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden shadow-md -mt-16 relative z-10">
                    {movie?.posterUrl ? (
                      <img 
                        src={movie.posterUrl} 
                        alt={showtime.movie} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Film size={28} />
                        <span className="text-[10px] mt-1">No Poster</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-base text-[#191c1e] line-clamp-2 uppercase leading-snug" title={showtime.movie}>
                      {showtime.movie}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium italic mt-0.5 line-clamp-1">
                      {movie?.titleEn || 'N/A'}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap mt-2">
                      <span className="px-2 py-0.5 bg-[#f1f8f5] text-[#00836c] text-[10px] rounded font-bold border border-[#90f5d9] uppercase">
                        {showtime.format || '2D'}
                      </span>
                      <span className="px-2 py-0.5 bg-[#f0f4f9] text-[#1a73e8] text-[10px] rounded font-bold border border-[#d2e3fc] uppercase">
                        {showtime.language || 'Phụ đề'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4 space-y-2.5 text-xs text-[#5c647a]">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-400">Thời lượng:</span>
                    <span className="font-bold text-[#191c1e] flex items-center gap-1">
                      <Clock size={12} className="text-[#b80035]" /> {movie?.duration || 120} phút
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-400">Thể loại:</span>
                    <span className="font-bold text-[#191c1e] truncate max-w-[180px]" title={movie?.genre}>
                      {movie?.genre || 'Chưa rõ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-400">Đạo diễn:</span>
                    <span className="font-bold text-[#191c1e]">{movie?.director || 'Chưa rõ'}</span>
                  </div>
                  {movie?.description && (
                    <div className="mt-3">
                      <span className="font-semibold text-gray-400 block mb-1">Tóm tắt phim:</span>
                      <p className="text-gray-600 leading-relaxed text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-100 max-h-32 overflow-y-auto">
                        {movie.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white border border-[#e5bdbe] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase text-[#191c1e] mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                <DollarSign size={16} className="text-[#b80035]" /> Bảng giá vé suất chiếu
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#565e74]"></div>
                    <span className="text-xs font-bold text-[#5c647a]">Standard (Thường)</span>
                  </div>
                  <span className="text-sm font-black font-mono text-[#191c1e]">{formatVND(showtime.price)}</span>
                </div>
                
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#fffcf0] border border-[#ffe082]/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ffb300]"></div>
                    <span className="text-xs font-bold text-[#8a6d00]">VIP (Thương gia)</span>
                  </div>
                  <span className="text-sm font-black font-mono text-[#ff8f00]">{formatVND(showtime.vipPrice || showtime.price * 1.2)}</span>
                </div>
                
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#fff0f2] border border-[#ffdad6]/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#e11d48]"></div>
                    <span className="text-xs font-bold text-[#b80035]">Couple (Đôi)</span>
                  </div>
                  <span className="text-sm font-black font-mono text-[#e11d48]">{formatVND(showtime.couplePrice || showtime.price * 2)}</span>
                </div>
              </div>
              
              {showtime.goldenHour && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5">
                  <Flame size={16} className="text-amber-600 animate-pulse shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-amber-800 uppercase tracking-wide">Áp Dụng Giờ Vàng</p>
                    <p className="text-[10px] text-amber-700 leading-normal">Khung giờ đặc biệt từ 18:00 đến 21:00 giúp tối ưu hiệu suất lấp đầy rạp.</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Detailed Info Card & Interactive Seat Map */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Detailed Info Card */}
            <div className="bg-white border border-[#e5bdbe] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase text-[#191c1e] mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                <Sparkles size={16} className="text-[#b80035]" /> Thông tin xếp lịch chi tiết
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#b80035] bg-red-50 p-2 rounded-xl text-[20px]">calendar_month</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Ngày chiếu</span>
                      <span className="text-sm font-bold text-[#191c1e]">{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#b80035] bg-red-50 p-2 rounded-xl text-[20px]">alarm</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Khung giờ chiếu</span>
                      <span className="text-sm font-black text-[#b80035] font-mono">
                        {showtime.time} - {showtime.endTime || 'Đang cập nhật'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#b80035] bg-red-50 p-2 rounded-xl text-[20px]">meeting_room</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Phòng chiếu & Sức chứa</span>
                      <span className="text-sm font-bold text-[#191c1e] uppercase">
                        {showtime.room || 'Unknown Room'} ({seatLayout?.totalSeats || 60} Ghế)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#b80035] bg-red-50 p-2 rounded-xl text-[20px]">cleaning_services</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Thời gian dọn dẹp (Cleaning buffer)</span>
                      <span className="text-sm font-bold text-[#191c1e]">
                        {bufferMinutes} phút sau suất chiếu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#b80035] bg-red-50 p-2 rounded-xl text-[20px]">info</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Trạng thái công bố</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#b80035] bg-red-50 p-2 rounded-xl text-[20px]">tune</span>
                    <div className="flex-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-1">Cập nhật nhanh trạng thái</span>
                      <div className="flex gap-2 flex-wrap">
                        {showtime.status === 'DRAFT' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStatus('SCHEDULED')}
                            disabled={statusUpdating}
                          >
                            Công bố (Publish)
                          </Button>
                        )}
                        {showtime.status === 'SCHEDULED' && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => handleUpdateStatus('DRAFT')}
                            disabled={statusUpdating}
                          >
                            <RotateCcw size={12} className="mr-1" /> Trả về nháp
                          </Button>
                        )}
                        {(showtime.status === 'SCHEDULED' || showtime.status === 'DRAFT') && (
                          <Button 
                            size="sm" 
                            variant="danger" 
                            onClick={() => handleUpdateStatus('CANCELLED')}
                            disabled={statusUpdating}
                          >
                            Hủy lịch
                          </Button>
                        )}
                        {showtime.status === 'CANCELLED' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStatus('DRAFT')}
                            disabled={statusUpdating}
                          >
                            Mở lại nháp
                          </Button>
                        )}
                        {showtime.status === 'FINISHED' && (
                          <span className="text-xs text-gray-400 italic">Suất chiếu đã kết thúc, không thể thay đổi</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seat Layout Preview */}
            <div className="bg-white border border-[#e5bdbe] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                <h3 className="text-sm font-black uppercase text-[#191c1e] flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                  <span className="material-symbols-outlined text-[#b80035]">grid_view</span> Sơ đồ ghế ngồi phòng chiếu
                </h3>
                
                <div className="flex gap-3 text-[10px] font-bold">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
                    <span>Standard</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#fff8e1] border border-[#ffe082]"></div>
                    <span>VIP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#fff0f2] border border-[#ffdad6]"></div>
                    <span>Couple</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-100 border border-dashed border-gray-300 opacity-40"></div>
                    <span>Lối đi / Trống</span>
                  </div>
                </div>
              </div>

              <div className="relative mb-12 flex justify-center">
                <div className="w-3/5 h-2 bg-gradient-to-b from-gray-400 to-gray-200 rounded-b-xl shadow-inner relative flex justify-center">
                  <span className="absolute -bottom-5 text-[9px] text-[#5c647a] tracking-widest font-black uppercase">MÀN HÌNH CHÍNH</span>
                </div>
              </div>

              {seatLayout?.seatMatrix ? (
                <div className="overflow-x-auto p-4 bg-gray-50 border border-gray-100 rounded-xl custom-scrollbar flex justify-center">
                  <div className="flex flex-col gap-2.5 min-w-max">
                    {seatLayout.seatMatrix.map((row) => (
                      <div key={row.rowLabel} className="flex gap-2 items-center">
                        <span className="w-5 text-right text-xs font-bold text-gray-400 mr-2">{row.rowLabel}</span>
                        
                        {row.seats.map((seat) => {
                          const type = String(seat.type || '').toUpperCase()
                          const isAisle = type === 'AISLE' || type === 'EMPTY'
                          
                          let seatBg = 'bg-gray-200 border-gray-300 text-gray-600'
                          if (type === 'VIP') seatBg = 'bg-[#fff8e1] border-[#ffe082] text-[#ff6f00]'
                          if (type === 'COUPLE' || type === 'COUPLE_EXTENSION') seatBg = 'bg-[#fff0f2] border-[#ffdad6] text-[#e11d48]'
                          
                          if (isAisle) {
                            return <div key={seat.id} className="w-7 h-7 rounded border border-dashed border-transparent opacity-20 bg-transparent" />
                          }

                          return (
                            <div 
                              key={seat.id} 
                              className={`w-7 h-7 rounded border flex items-center justify-center text-[10px] font-bold shadow-sm select-none ${seatBg}`}
                              title={`Mã ghế: ${seat.id} - Loại: ${seat.type}`}
                            >
                              {seat.number}
                            </div>
                          )
                        })}

                        <span className="w-5 text-left text-xs font-bold text-gray-400 ml-2">{row.rowLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 bg-gray-50 border border-gray-100 rounded-xl">
                  Không thể tải sơ đồ ghế phòng này hoặc phòng không có ghế.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
