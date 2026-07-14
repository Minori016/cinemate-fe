import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, Upload, MapPin, Users, CheckCircle, AlertCircle, X } from 'lucide-react'

const AVAILABLE_FORMATS = ['2D', '3D', '4DX', 'IMAX'];

export default function CinemaRoomFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [name, setName] = useState('')
  const [cinemaId, setCinemaId] = useState('')
  const [supportedFormats, setSupportedFormats] = useState(['2D'])
  const [layoutTemplate, setLayoutTemplate] = useState('NONE')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)

  const validateForm = () => {
    const tempErrors = {}
    if (!name.trim()) tempErrors.name = 'Tên phòng chiếu không được để trống'
    if (supportedFormats.length === 0) tempErrors.formats = 'Phải chọn ít nhất 1 định dạng'
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleFormatToggle = (fmt) => {
    setSupportedFormats(prev => 
      prev.includes(fmt) 
        ? prev.filter(f => f !== fmt)
        : [...prev, fmt]
    )
  }

  const generateLayoutPayload = (template) => {
    let rows, cols;
    if (template === 'SMALL') { rows = 8; cols = 10; } // 80 seats equivalent
    else if (template === 'IMAX') { rows = 10; cols = 14; } // 140 seats equivalent
    else if (template === '4DX') { rows = 6; cols = 8; } // 48 seats equivalent
    else return null;
    
    const seats = [];
    for (let i = 0; i < rows; i++) {
      const rowLabel = String.fromCharCode(65 + i); // A, B, C...
      const isLastRow = i === rows - 1;
      
      let j = 1;
      while (j <= cols) {
        if (isLastRow) {
          // Add COUPLE seats to the last row
          // A couple seat takes 2 columns visually, so we add it and skip the next column
          seats.push({ row: rowLabel, number: j, type: 'COUPLE', status: 'ACTIVE' });
          j += 2; // Skip the next column as it's occupied by the couple seat
        } else {
          let type = 'STANDARD';
          if (template === '4DX') {
              type = 'VIP';
          } else if (template === 'IMAX') {
              if (i >= 3 && i <= 7 && j >= 3 && j <= cols - 2) type = 'VIP'; // Center VIP
              else if (i === 8) type = 'VIP'; // Almost last row is full VIP
          } else {
              // small 2D/3D: row 6-7 VIP
              if (i >= rows - 3) type = 'VIP';
          }
          seats.push({ row: rowLabel, number: j, type, status: 'ACTIVE' });
          j++;
        }
      }
    }
    return { rows, cols, seats };
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
      supportedFormats,
      ...(cinemaId && { cinemaId })
    }

    try {
      if (isEditMode) {
        await cinemaRoomService.updateInfo(id, payload)
        setToast({ message: 'Cập nhật phòng chiếu thành công!', type: 'success' })
      } else {
        const res = await cinemaRoomService.create(payload)
        const newRoomId = res.data?.result?.id || res.data?.id
        
        if (newRoomId && layoutTemplate !== 'NONE') {
           const layoutPayload = generateLayoutPayload(layoutTemplate)
           if (layoutPayload) {
             await cinemaRoomService.updateLayout(newRoomId, layoutPayload)
           }
        }
        
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
            setCinemaId(room.cinemaId || '')
            setSupportedFormats(room.supportedFormats && room.supportedFormats.length > 0 ? room.supportedFormats : ['2D'])
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
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Phòng chiếu</span>
          </button>
          <h1 className="text-4xl text-gray-900 font-black tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Cập nhật phòng chiếu' : 'Thêm phòng chiếu mới'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin phòng chiếu.' : 'Tạo phòng chiếu mới và thiết lập định dạng.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
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
              {!isEditMode && (
                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-sm font-medium text-gray-600 mb-1">Mẫu sơ đồ ghế (Tùy chọn)</label>
                  <select
                    value={layoutTemplate}
                    onChange={(e) => setLayoutTemplate(e.target.value)}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                  >
                    <option value="NONE">Không khởi tạo (Vẽ tay sau)</option>
                    <option value="SMALL">Mẫu Tiêu chuẩn (80 Ghế - 8x10)</option>
                    <option value="IMAX">Mẫu IMAX (140 Ghế - 10x14)</option>
                    <option value="4DX">Mẫu 4DX (48 Ghế VIP - 6x8)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-sm font-medium text-gray-600 mb-2">Định dạng hỗ trợ *</label>
              <div className="flex flex-wrap gap-4">
                {AVAILABLE_FORMATS.map(fmt => (
                  <label key={fmt} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-900">
                    <input 
                      type="checkbox" 
                      checked={supportedFormats.includes(fmt)} 
                      onChange={() => handleFormatToggle(fmt)}
                      className="w-4 h-4 rounded accent-red-500" 
                    />
                    {fmt}
                  </label>
                ))}
              </div>
              {errors.formats && <span className="text-xs text-red-400 mt-1">{errors.formats}</span>}
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
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3" style={{ fontFamily: 'Montserrat' }}>
              <CheckCircle className="text-green-500" size={16} />
              Lưu ý
            </h4>
            <ul className="text-xs text-gray-600 space-y-2">
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
