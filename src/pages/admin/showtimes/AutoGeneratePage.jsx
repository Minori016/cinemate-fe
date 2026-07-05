import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Play, CheckCircle, Calendar as CalendarIcon, X, Trash2 } from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

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

const diagonalHatch = "data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-2,10 L10,-2 M-2,2 L2,-2 M6,10 L10,6' stroke='%23e0e3e5' stroke-width='1' fill='none' opacity='0.5'/%3E%3C/svg%3E"

import { useAuth } from '../../../contexts/AuthContext'

export default function AutoGeneratePage() {
  const { user } = useAuth()
  const timelineContainerRef = useRef(null)
  const navigate = useNavigate()
  const isAdmin = user && user.roles?.includes('ADMIN')
  const basePath = isAdmin ? '/admin' : '/manager'
  
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  
  const [step, setStep] = useState(1) // 1: Setup, 2: Preview
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewList, setPreviewList] = useState([])
  const [templateResponse, setTemplateResponse] = useState(null)

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    openTime: '08:00',
    closeTime: '23:00',
    movieIds: [],
    roomIds: [],
    basePrice: 90000,
    vipPrice: 100000,
    couplePrice: 120000
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, rRes] = await Promise.all([
          movieService.getAll(),
          cinemaRoomService.getAll()
        ])
        setMovies(mRes.data || [])
        setRooms(rRes.data?.result || rRes.data || [])
      } catch (err) {
        console.error('Failed to load data', err)
      }
    }
    fetchData()
  }, [])

  const getDatesToRender = () => {
    if (!form.startDate || !form.endDate) return [];
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Array.from({ length: diffDays + 1 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }

  const datesToRender = step === 2 ? getDatesToRender() : [];

  const calculatePosition = (startTimeStr, durationMins) => {
    if (!startTimeStr) return { left: '0px', width: '0px' }
    const stDateObj = new Date(startTimeStr);
    
    // Parse form.startDate locally
    const [y, m, d] = form.startDate.split('-');
    const baseDateObj = new Date(y, m - 1, d);
    
    const h = stDateObj.getHours();
    const min = stDateObj.getMinutes();
    
    const stDateNoTime = new Date(stDateObj.getFullYear(), stDateObj.getMonth(), stDateObj.getDate());
    
    const diffTimeMs = stDateNoTime.getTime() - baseDateObj.getTime();
    const diffDays = Math.round(diffTimeMs / (1000 * 60 * 60 * 24));
    
    const totalMinutes = (diffDays * 1440) + (h * 60) + min;
    
    return {
      left: `${totalMinutes}px`,
      width: `${durationMins || 120}px`,
    }
  }

  useEffect(() => {
    if (step === 2 && timelineContainerRef.current) {
      timelineContainerRef.current.scrollTo({ left: 450, behavior: 'smooth' })
    }
  }, [step])

  const handleMovieToggle = (id) => {
    setForm(prev => {
      const isSelected = prev.movieIds.includes(id);
      if (!isSelected && prev.movieIds.length >= 3) {
        toast.error('Chỉ được tạo tự động tối đa 3 phim 1 lần!', { id: 'max-movies-error' });
        return prev;
      }
      return {
        ...prev,
        movieIds: isSelected 
          ? prev.movieIds.filter(mId => mId !== id)
          : [...prev.movieIds, id]
      };
    });
  }

  const handleRoomToggle = (id) => {
    setForm(prev => ({
      ...prev,
      roomIds: prev.roomIds.includes(id)
        ? prev.roomIds.filter(rId => rId !== id)
        : [...prev.roomIds, id]
    }))
  }

  const handleGenerate = async () => {
    if (!form.startDate || !form.endDate || form.movieIds.length === 0 || form.roomIds.length === 0) {
      setError('Vui lòng chọn đầy đủ Ngày, Phim và Phòng chiếu!')
      return
    }

    if (form.movieIds.length > 3) {
      setError('Chỉ được tạo tự động tối đa 3 phim 1 lần!')
      return
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const start = new Date(form.startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(form.endDate)
    end.setHours(0, 0, 0, 0)
    
    if (start <= today) {
      setError('Ngày bắt đầu phải từ ngày mai trở đi!')
      return
    }
    
    if (start > end) {
      setError('Ngày bắt đầu không được sau ngày kết thúc!')
      return
    }
    
    if (form.openTime >= form.closeTime) {
      setError('Giờ mở cửa phải trước giờ đóng cửa!')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const selectedRoom = rooms.find(r => r.id === form.roomIds[0]);
      // Assuming a single cinema setup
      const cinemaId = selectedRoom?.cinemaId || rooms[0]?.cinemaId || selectedRoom?.cinema?.id;

      const requestPayload = {
        cinema_id: cinemaId,
        room_ids: form.roomIds,
        movie_ids: form.movieIds,
        startTime: form.openTime + ":00",
        endTime: form.closeTime + ":00",
        startDate: form.startDate,
        endDate: form.endDate,
        basePrice: form.basePrice,
        vipPrice: form.vipPrice,
        couplePrice: form.couplePrice
      }

      const res = await showtimeService.autoGenerate(requestPayload)
      
      setPreviewList(res || [])
      setStep(2)
    } catch (err) {
      setError('Lỗi khi chạy thuật toán: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSave = async () => {
    if (previewList.length === 0) return
    
    setLoading(true)
    try {
      const confirmPayload = previewList.map(st => ({
        movie_id: st.movie_id,
        room_id: st.room_id,
        startTime: st.startTime,
        basePrice: form.basePrice,
        format: st.format || '2D',
        language: st.language || 'Phu de',
        status: "SCHEDULED"
      }))

      const res = await showtimeService.autoConfirm(confirmPayload)
      toast.success(`Đã tạo thành công ${res?.length || previewList.length} suất chiếu!`)
      navigate(`${basePath}/showtimes`)
    } catch (err) {
      setError('Lỗi khi lưu hàng loạt: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShowtime = (indexToDelete) => {
    const deletedSt = previewList[indexToDelete];
    
    const sameRoomDayList = previewList.filter(st => 
      st.room_id === deletedSt.room_id && 
      new Date(st.startTime).toDateString() === new Date(deletedSt.startTime).toDateString()
    ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    const deletedSortedIndex = sameRoomDayList.findIndex(st => st === deletedSt);
    
    let shiftMs = 0;
    if (deletedSortedIndex !== -1 && deletedSortedIndex < sameRoomDayList.length - 1) {
       shiftMs = new Date(sameRoomDayList[deletedSortedIndex + 1].startTime).getTime() - new Date(deletedSt.startTime).getTime();
    }
    
    const newList = previewList.filter((_, i) => i !== indexToDelete).map(st => {
      if (st.room_id === deletedSt.room_id && 
          new Date(st.startTime).toDateString() === new Date(deletedSt.startTime).toDateString() &&
          new Date(st.startTime).getTime() > new Date(deletedSt.startTime).getTime()) {
          
          const newStart = new Date(new Date(st.startTime).getTime() - shiftMs);
          const newEnd = new Date(new Date(st.endTime).getTime() - shiftMs);
          
          return {
            ...st,
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString()
          };
      }
      return st;
    });
    
    setPreviewList(newList);
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans -m-6 p-6 min-h-[calc(100vh-80px)] overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <button
            onClick={() => {
              if (step === 2) setStep(1)
              else navigate(`${basePath}/showtimes`)
            }}
            className="flex items-center gap-1.5 text-xs text-[#5c647a] hover:text-[#b80035] uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{step === 2 ? 'Quay lại Cài đặt' : 'Quay lại Quản lý Lịch chiếu'}</span>
          </button>
          <h2 className="text-[32px] leading-tight font-semibold text-[#191c1e] flex items-center gap-3">
            <Settings className="text-[#b80035]" size={28} />
            {step === 1 ? 'Thuật toán tạo lịch chiếu' : 'Xem trước Lịch chiếu (Preview)'}
          </h2>
        </div>
        
        {step === 1 ? (
          <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-[#b80035] hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
            {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <Play size={18} />}
            Chạy Thuật Toán
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} disabled={loading} className="px-6 py-3 bg-white border border-[#e0e3e5] text-[#5c647a] font-bold rounded-xl hover:bg-[#f7f9fb] transition-all">
              Chỉnh sửa lại
            </button>
            <button onClick={handleBatchSave} disabled={loading || previewList.length === 0} className="px-6 py-3 bg-[#00836c] hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <CheckCircle size={18} />}
              Lưu {previewList.length} Suất Chiếu
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white border border-[#e5bdbe] rounded-2xl overflow-hidden shadow-sm p-6">
        {error && (
          <div className="mb-6 p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] font-bold rounded-xl text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left: Time configs */}
              <div className="space-y-6">
                <div>
                  <h5 className="text-[#191c1e] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[#e0e3e5] pb-2">Khoảng thời gian</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Từ ngày</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className={`w-full flex items-center justify-between bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] outline-none hover:border-[#b80035] cursor-pointer transition-colors ${!form.startDate && "text-gray-500"}`}>
                            {form.startDate ? format(parseISO(form.startDate), "dd/MM/yyyy", { locale: vi }) : <span>DD/MM/YYYY</span>}
                            <CalendarIcon className="h-4 w-4 text-[#5c647a]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[200] bg-white border border-[#e0e3e5] rounded-xl shadow-xl" align="start">
                          <Calendar mode="single" selected={form.startDate ? parseISO(form.startDate) : undefined} onSelect={(date) => date && setForm({...form, startDate: format(date, 'yyyy-MM-dd')})} initialFocus locale={vi} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Đến ngày</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className={`w-full flex items-center justify-between bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] outline-none hover:border-[#b80035] cursor-pointer transition-colors ${!form.endDate && "text-gray-500"}`}>
                            {form.endDate ? format(parseISO(form.endDate), "dd/MM/yyyy", { locale: vi }) : <span>DD/MM/YYYY</span>}
                            <CalendarIcon className="h-4 w-4 text-[#5c647a]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[200] bg-white border border-[#e0e3e5] rounded-xl shadow-xl" align="start">
                          <Calendar mode="single" selected={form.endDate ? parseISO(form.endDate) : undefined} onSelect={(date) => date && setForm({...form, endDate: format(date, 'yyyy-MM-dd')})} initialFocus locale={vi} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-[#191c1e] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[#e0e3e5] pb-2">Khung giờ hoạt động</h5>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Mở cửa</label>
                      <input type="time" value={form.openTime} onChange={e => setForm({...form, openTime: e.target.value})} className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#b80035] outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-semibold">Đóng cửa</label>
                      <input type="time" value={form.closeTime} onChange={e => setForm({...form, closeTime: e.target.value})} className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#b80035] outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-[#ffdad6]/10 border border-[#b80035]/20 rounded-xl">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#5c647a] font-bold">Giá thường (VNĐ)</label>
                      <input type="number" value={form.basePrice} onChange={e => setForm({...form, basePrice: parseInt(e.target.value) || 0})} className="bg-white border border-[#e0e3e5] rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#b80035] outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#ba1a1a] font-bold">Giá VIP (VNĐ)</label>
                      <input type="number" value={form.vipPrice} onChange={e => setForm({...form, vipPrice: parseInt(e.target.value) || 0})} className="bg-[#ffdad6]/20 border border-[#ba1a1a]/30 rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#ba1a1a] outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#b80035] font-bold">Giá Couple (VNĐ)</label>
                      <input type="number" value={form.couplePrice} onChange={e => setForm({...form, couplePrice: parseInt(e.target.value) || 0})} className="bg-[#ffdad6]/20 border border-[#ba1a1a]/30 rounded-xl py-2.5 px-4 text-sm text-[#191c1e] focus:border-[#ba1a1a] outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Movie and Room Selection */}
              <div className="space-y-6">
                <div>
                  <h5 className="text-[#191c1e] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[#e0e3e5] pb-2">Chọn Phim</h5>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {movies.map(m => (
                      <label key={m.id} className="flex items-center gap-3 p-3 bg-[#f7f9fb] hover:bg-[#eceef0] transition-colors rounded-xl cursor-pointer border border-[#e0e3e5]">
                        <input type="checkbox" checked={form.movieIds.includes(m.id)} onChange={() => handleMovieToggle(m.id)} className="w-4 h-4 rounded accent-[#b80035]" />
                        <span className="text-sm text-[#191c1e] font-medium">{m.titleVn}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-[#191c1e] font-bold mb-4 uppercase text-xs tracking-wider border-b border-[#e0e3e5] pb-2">Chọn Phòng Chiếu</h5>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {rooms.map(r => (
                      <label key={r.id} className="flex items-center gap-3 p-3 bg-[#f7f9fb] hover:bg-[#eceef0] transition-colors rounded-xl cursor-pointer border border-[#e0e3e5]">
                        <input type="checkbox" checked={form.roomIds.includes(r.id)} onChange={() => handleRoomToggle(r.id)} className="w-4 h-4 rounded accent-[#b80035]" />
                        <span className="text-sm text-[#191c1e] font-medium">{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Preview Calendar
          <div className="space-y-6 flex flex-col h-full overflow-hidden">
            <div className="p-4 bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] font-bold rounded-xl text-sm flex items-center gap-2 shrink-0">
              <CheckCircle size={18} />
              Thuật toán đã chạy thành công. Tạo ra {previewList.length} suất chiếu dự kiến.
            </div>
            
            <div 
              ref={timelineContainerRef}
              className="flex-1 overflow-auto custom-scrollbar flex bg-[#f7f9fb] border border-[#e5bdbe] rounded-xl relative"
            >
              <div className="flex" style={{ width: `calc(192px + ${datesToRender.length * 1440}px)` }}>
                
                {/* Sidebar (Rooms) */}
                <div className="w-48 shrink-0 sticky left-0 z-40 bg-[#f7f9fb] border-r border-[#e0e3e5] flex flex-col shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-fit min-h-full">
                  <div className="h-16 border-b border-[#e0e3e5] bg-white sticky top-0 z-50 shrink-0"></div>
                  {rooms.filter(r => form.roomIds.includes(r.id)).map(room => {
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

                  {/* Grid Content (Room Rows & Showtimes) */}
                  <div className="relative z-10">
                    {rooms.filter(r => form.roomIds.includes(r.id)).map(room => {
                      const roomShowtimes = previewList.filter(st => st.room_id === room.id)
                      return (
                        <div key={room.id} className="h-24 border-b border-[#e0e3e5] border-dashed relative">
                          {roomShowtimes.map((st) => {
                            // Find index in original previewList for deletion
                            const originalIdx = previewList.indexOf(st)
                            const { left, width } = calculatePosition(st.startTime, st.durationMinutes)
                            const isGoldenHour = st.goldenHour || st.isGoldenHour
                            
                            // Distinct Preview Colors
                            const barColor = isGoldenHour ? 'bg-[#ffb300]' : 'bg-[#4caf50]'
                            const bgColor = isGoldenHour ? 'bg-[#fff8e1]' : 'bg-[#e8f5e9]'
                            const borderColor = isGoldenHour ? 'border-[#ffe082]' : 'border-[#a5d6a7]'
                            const textColor = isGoldenHour ? 'text-[#ff6f00]' : 'text-[#2e7d32]'
                            
                            return (
                              <div
                                key={st.tempId || originalIdx}
                                className={`absolute top-4 h-[64px] ${bgColor} border ${borderColor} rounded shadow-sm flex items-center p-2 cursor-pointer hover:shadow-md transition-shadow group overflow-hidden`}
                                style={{ left, width }}
                              >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
                                
                                <div className="flex-1 min-w-0 ml-2 flex flex-col justify-center">
                                  <h4 className={`font-semibold text-[12px] text-[#191c1e] line-clamp-1 leading-tight mb-1`} title={st.movieTitle}>
                                    {st.movieTitle}
                                  </h4>
                                  <p className={`text-[10px] ${textColor} font-mono font-bold flex gap-1 items-center`}>
                                    <span>{format(parseISO(st.startTime), 'HH:mm')}</span>
                                    <span>-</span>
                                    <span>{format(parseISO(st.endTime), 'HH:mm')}</span>
                                  </p>
                                </div>

                                {/* Delete & Shift Up Button */}
                                <div className="absolute right-0 top-0 bottom-0 bg-white/80 px-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteShowtime(originalIdx); }}
                                    title="Xóa & Lùi giờ"
                                    className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors bg-white shadow-sm"
                                  >
                                    <Trash2 size={14} />
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
              
              {previewList.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-50 pointer-events-none rounded-xl">
                   <span className="material-symbols-outlined text-5xl text-[#565e74] mb-2">event_busy</span>
                   <p className="text-[#565e74] font-semibold text-sm">Không tạo được suất chiếu nào phù hợp</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
