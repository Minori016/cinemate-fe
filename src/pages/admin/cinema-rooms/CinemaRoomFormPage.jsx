import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, Upload, MapPin, Users, CheckCircle, AlertCircle, X } from 'lucide-react'

export default function CinemaRoomFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(80)
  const [cinemaId, setCinemaId] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)

  const validateForm = () => {
    const tempErrors = {}
    if (!name.trim()) tempErrors.name = 'Tên phòng chiếu không được để trống'
    if (!capacity || capacity <= 0) tempErrors.capacity = 'Sức chứa phải lớn hơn 0'
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setToast({ message: 'Vui lòng kiểm tra lại thông tin.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    const payload = {
      name: name.trim(),
      capacity: Number(capacity),
      ...(cinemaId && { cinemaId })
    }

    try {
      if (isEditMode) {
        await cinemaRoomService.updateInfo(id, payload)
        setToast({ message: 'Cập nhật phòng chiếu thành công!', type: 'success' })
      } else {
        await cinemaRoomService.create(payload)
        setToast({ message: 'Thêm phòng chiếu mới thành công!', type: 'success' })
      }
      setTimeout(() => {
        navigate('/admin/cinema-rooms')
      }, 1500)
    } catch (err) {
      console.error('Failed to save cinema room', err)
      const serverMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
      setToast({ message: `Không thể lưu: ${serverMsg}`, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (isEditMode) {
      cinemaRoomService.getById(id)
        .then(res => {
          const room = res.data?.result || res.data
          if (room) {
            setName(room.name || '')
            setCapacity(room.capacity || room.seatsCount || 80)
            setCinemaId(room.cinemaId || '')
          }
        })
        .catch(err => {
          console.error('Failed to load room', err)
          setToast({ message: 'Không thể tải thông tin phòng chiếu', type: 'danger' })
        })
    }
  }, [id, isEditMode])

  const handleCancel = () => {
    navigate('/admin/cinema-rooms')
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
            <span>Quay lại Quản lý Phòng chiếu</span>
          </button>
          <h1 className="text-4xl text-white font-black tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Cập nhật phòng chiếu' : 'Thêm phòng chiếu mới'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin phòng chiếu.' : 'Tạo phòng chiếu mới với tên và sức chứa.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <MapPin className="text-red-500" size={18} />
              Thông tin phòng chiếu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên phòng chiếu *"
                placeholder="Ví dụ: Phòng chiếu 5 (IMAX)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Sức chứa *</label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                >
                  <option value={48}>48 Ghế (6×8)</option>
                  <option value={60}>60 Ghế (6×10)</option>
                  <option value={80}>80 Ghế (8×10)</option>
                </select>
                {errors.capacity && <span className="text-xs text-red-400 mt-1">{errors.capacity}</span>}
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
              <li>• Tên phòng chiếu phải là duy nhất</li>
              <li>• Hệ thống sẽ tự tạo sơ đồ ghế mặc định</li>
              <li>• Có thể tùy chỉnh layout sau khi tạo</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
