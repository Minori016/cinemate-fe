import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { priceConfigService } from '../../../services/priceConfigService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'

export default function ShowtimeFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  
  const isAdmin = user && user.roles?.includes('ADMIN')
  const basePath = isAdmin ? '/admin' : '/manager'

  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])

  const [movieId, setMovieId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [format, setFormat] = useState('2D')
  const [language, setLanguage] = useState('Phụ đề')
  const [price, setPrice] = useState(70000)
  const [formatPrices, setFormatPrices] = useState({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch movies
        const mRes = await movieService.getAll()
        const mList = mRes.data || []
        setMovies(mList)
        // Fetch rooms
        const rRes = await cinemaRoomService.getAll()
        const rList = rRes.data?.result || rRes.data || []
        setRooms(Array.isArray(rList) ? rList : [])
        // Fetch prices
        const pRes = await priceConfigService.getAll()
        const pList = pRes || []
        const pMap = {}
        pList.forEach(p => {
          const key = p.format?.replace('_', '') || '2D'
          pMap[key] = p.basePrice
        })
        setFormatPrices(pMap)
        if (!isEditMode && pMap['2D']) {
          setPrice(pMap['2D'])
        }
      } catch (err) {
        console.error('Failed to load reference data', err)
        setToast({ message: 'Không thể tải dữ liệu phim và phòng chiếu', type: 'danger' })
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (isEditMode) {
      showtimeService.getById(id).then(st => {
        if (st) {
          setMovieId(st.movieId || st.movie?.id || '')
          setRoomId(st.roomId || st.room?.id || '')
          setDate(st.date || '')
          setTime(st.time || '')
          setFormat(st.format || '2D')
          setLanguage(st.language || 'Phụ đề')
          setPrice(st.price || 90000)
        } else {
          setToast({ message: 'Không tìm thấy lịch chiếu', type: 'danger' })
        }
      }).catch(err => {
        console.error('Failed to load showtime', err)
        setToast({ message: 'Không thể tải thông tin lịch chiếu', type: 'danger' })
      })
    }
  }, [id, isEditMode])

  // Calculations based on business logic
  const selectedMovie = movies.find(m => m.id === movieId)
  const duration = selectedMovie?.durationMinutes || 120

  const calculatedTimes = (() => {
    if (!date || !time) return null
    try {
      const startT = new Date(`${date}T${time}:00`)
      if (!isNaN(startT.getTime())) {
        const adMins = 10
        const cleanMins = 15
        const endT = new Date(startT.getTime() + (duration + adMins) * 60 * 1000)
        
        const bufferStart = new Date(startT.getTime() - cleanMins * 60 * 1000)
        const bufferEnd = new Date(endT.getTime() + cleanMins * 60 * 1000)

        const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
        
        return {
          start: formatTime(startT),
          end: formatTime(endT),
          bufferStart: formatTime(bufferStart),
          bufferEnd: formatTime(bufferEnd)
        }
      }
    } catch {
      // Ignore parsing errors for partial date/time input
    }
    return null
  })();

  const handleFormatChange = (e) => {
    const newFormat = e.target.value
    setFormat(newFormat)
    if (!isEditMode && formatPrices[newFormat]) {
      setPrice(formatPrices[newFormat])
    }
  }

  const validateForm = () => {
    const tempErrors = {}
    if (!movieId) tempErrors.movieId = 'Vui lòng chọn phim'
    if (!roomId) tempErrors.roomId = 'Vui lòng chọn phòng chiếu'
    if (!date) tempErrors.date = 'Vui lòng chọn ngày chiếu'
    if (!time) tempErrors.time = 'Vui lòng chọn giờ chiếu'
    if (!price || price <= 0) tempErrors.price = 'Giá vé phải lớn hơn 0'

    if (date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(date)
      selectedDate.setHours(0, 0, 0, 0)
      if (selectedDate <= today) {
        tempErrors.date = 'Ngày chiếu phải từ ngày mai trở đi'
      }
    }

    if (date && time) {
      const selectedTime = new Date(`${date}T${time}:00`)
      if (selectedTime <= new Date()) {
        tempErrors.time = 'Thời gian chiếu phải ở tương lai'
      }
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setToast({ message: 'Vui lòng điền đầy đủ thông tin.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    
    const localDateTime = new Date(`${date}T${time}:00`)
    const startTimeIso = localDateTime.toISOString()

    const calculateCGVPrices = (base) => {
      let effectiveBase = Number(base)
      return {
        calcBase: effectiveBase,
        calcVip: effectiveBase + 10000,
        calcCouple: (effectiveBase * 2) + 10000
      }
    }

    const { calcBase, calcVip, calcCouple } = calculateCGVPrices(price)

    const payload = {
      movieId,
      roomId,
      startTime: startTimeIso,
      format,
      language,
      basePrice: calcBase,
      vipPrice: calcVip,
      couplePrice: calcCouple
    }

    try {
      // 1. Validate first
      const valRes = await showtimeService.validateManual(payload)
      if (valRes && !valRes.valid) {
        setToast({ message: valRes.hardErrors?.join(', ') || 'Lỗi không xác định', type: 'danger' })
        setIsSubmitting(false)
        return
      }

      if (valRes && valRes.softWarnings && valRes.softWarnings.length > 0) {
        const confirmMsg = valRes.softWarnings.join('\n') + '\n\nBạn có muốn tiếp tục lưu không?'
        if (!window.confirm(confirmMsg)) {
          setIsSubmitting(false)
          return
        }
      }

      // 2. Create or Update
      if (isEditMode) {
        await showtimeService.delete(id) // delete old
        await showtimeService.create(payload) // create new (simple approach)
        setToast({ message: 'Cập nhật lịch chiếu thành công!', type: 'success' })
      } else {
        await showtimeService.create(payload)
        setToast({ message: 'Thêm lịch chiếu mới thành công!', type: 'success' })
      }
      setTimeout(() => {
        navigate(`${basePath}/showtimes`)
      }, 1500)
    } catch (err) {
      console.error('Failed to save showtime', err)
      const serverMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
      setToast({ message: `Không thể lưu: ${serverMsg}`, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`${basePath}/showtimes`)
  }

  return (
    <div className="space-y-6 text-[#191c1e] text-left relative pb-12 bg-[#f7f9fb] min-h-[calc(100vh-80px)] p-6 rounded-2xl">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm max-w-md transition-all duration-300 animate-slide-in-up bg-white"
          style={{
            borderColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {toast.type === 'success' ? <CheckCircle className="shrink-0" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-[#5c647a] hover:text-[#b80035] uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Lịch chiếu</span>
          </button>
          <h1 className="text-3xl font-black tracking-wider uppercase text-[#191c1e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Cập nhật lịch chiếu' : 'Thêm lịch chiếu mới'}
          </h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin lịch chiếu.' : 'Tạo lịch chiếu mới cho phim tại phòng.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e0e3e5] rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2 mb-4 border-b border-[#e0e3e5] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <Calendar className="text-red-500" size={18} />
              Thông tin lịch chiếu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Phim *</label>
                <select
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                >
                  <option value="">Chọn phim...</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.titleVn} ({m.durationMinutes} phút)</option>
                  ))}
                </select>
                {errors.movieId && <span className="text-xs text-red-400 mt-1">{errors.movieId}</span>}
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Phòng chiếu *</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                >
                  <option value="">Chọn phòng...</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({(r.capacity || r.seatsCount)} ghế)</option>
                  ))}
                </select>
                {errors.roomId && <span className="text-xs text-red-400 mt-1">{errors.roomId}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Ngày chiếu *"
                  type="date"
                  value={date}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  error={errors.date}
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="Giờ chiếu *"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  error={errors.time}
                />
              </div>
              <div className="flex flex-col gap-1 w-full text-left md:col-span-2">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Giá vé cơ bản (Base Price) *</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full"
                />
                {errors.price && <span className="text-xs text-red-400 mt-1">{errors.price}</span>}
              </div>
            </div>

            {calculatedTimes && (
              <div className="bg-[#fff0f1] p-4 rounded-xl border border-[#ffdad6] flex flex-col gap-2 text-sm text-[#5c3f40] mt-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#ffdad6]">
                  <span>Thời lượng phim:</span>
                  <span className="font-bold text-[#ba1a1a]">{duration} phút + 10 phút quảng cáo</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-[#5c647a]">Giờ chiếu thực tế:</span>
                  <span className="text-[#191c1e] font-mono font-bold">
                    {calculatedTimes.start} - {calculatedTimes.end}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Khoảng thời gian chiếm dụng phòng (kèm 15p dọn dẹp):</span>
                  <span className="font-mono text-[#b80035] font-bold">
                    {calculatedTimes.bufferStart} - {calculatedTimes.bufferEnd}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Định dạng *</label>
                <select
                  value={format}
                  onChange={handleFormatChange}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                >
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-bold text-[#5c647a] mb-1">Ngôn ngữ *</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg py-2.5 px-3 text-sm text-[#191c1e] font-semibold focus:outline-none focus:border-[#b80035] focus:ring-1 focus:ring-[#b80035] transition-all w-full cursor-pointer"
                >
                  <option value="Phụ đề">Phụ đề</option>
                  <option value="Lồng tiếng">Lồng tiếng</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#e0e3e5] rounded-2xl p-5 space-y-3 shadow-sm">
            <Button type="submit" disabled={isSubmitting} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Đang lưu...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 justify-center">
                  <Plus size={16} /> {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                </span>
              )}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleCancel} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
              Hủy bỏ
            </Button>
          </div>

          <div className="bg-white border border-[#e0e3e5] rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-sm font-bold text-[#191c1e] flex items-center gap-2 mb-3" style={{ fontFamily: 'Montserrat' }}>
              <CheckCircle className="text-[#00836c]" size={16} />
              Lưu ý
            </h4>
            <ul className="text-xs text-[#5c647a] space-y-2 font-medium">
              <li>• Chọn phim và phòng chiếu đã được tạo</li>
              <li>• Giờ chiếu không được trùng lặp trong cùng phòng</li>
              <li>• Giá vé có thể điều chỉnh theo suất chiếu</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
