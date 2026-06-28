import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { showtimeService } from '../../../services/showtimeService'
import { movieService } from '../../../services/movieService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, Calendar, Clock, Ticket, CheckCircle, AlertCircle, X } from 'lucide-react'

export default function ShowtimeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])

  const [movieId, setMovieId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [format, setFormat] = useState('2D')
  const [language, setLanguage] = useState('Phụ đề')
  const [price, setPrice] = useState(90000)

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

  const validateForm = () => {
    const tempErrors = {}
    if (!movieId) tempErrors.movieId = 'Vui lòng chọn phim'
    if (!roomId) tempErrors.roomId = 'Vui lòng chọn phòng chiếu'
    if (!date) tempErrors.date = 'Vui lòng chọn ngày chiếu'
    if (!time) tempErrors.time = 'Vui lòng chọn giờ chiếu'
    if (!price || price <= 0) tempErrors.price = 'Giá vé phải lớn hơn 0'
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
    
    // Convert date and time to ISO-8601 string
    const localDateTime = new Date(`${date}T${time}:00`)
    const startTimeIso = localDateTime.toISOString()

    const payload = {
      movieId,
      roomId,
      startTime: startTimeIso,
      format,
      language,
      basePrice: Number(price)
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
        navigate('/admin/showtimes')
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
    navigate('/admin/showtimes')
  }

  return (
    <div className="space-y-6 text-[#e2e2e2] text-left relative pb-12">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-md transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
            backdropFilter: 'blur(16px)'
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
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Lịch chiếu</span>
          </button>
          <h1 className="text-4xl text-white font-black tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Cập nhật lịch chiếu' : 'Thêm lịch chiếu mới'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin lịch chiếu.' : 'Tạo lịch chiếu mới cho phim tại phòng.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <Calendar className="text-red-500" size={18} />
              Thông tin lịch chiếu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Phim *</label>
                <select
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                >
                  <option value="">Chọn phim...</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.titleVn} ({m.durationMinutes} phút)</option>
                  ))}
                </select>
                {errors.movieId && <span className="text-xs text-red-400 mt-1">{errors.movieId}</span>}
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Phòng chiếu *</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
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
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Giá vé cơ bản (Base Price) *</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full"
                />
                {errors.price && <span className="text-xs text-red-400 mt-1">{errors.price}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Định dạng *</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                >
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Ngôn ngữ *</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                >
                  <option value="Phụ đề">Phụ đề</option>
                  <option value="Lồng tiếng">Lồng tiếng</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
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

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3" style={{ fontFamily: 'Montserrat' }}>
              <CheckCircle className="text-green-500" size={16} />
              Lưu ý
            </h4>
            <ul className="text-xs text-gray-400 space-y-2">
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
