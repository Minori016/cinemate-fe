import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { promotionService } from '../../../services/promotionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Tag, Calendar, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'

export default function PromotionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  // Form states
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Pre-fill form if editing
  useEffect(() => {
    if (isEdit) {
      promotionService.getById(id)
        .then(res => {
          const promo = res.data?.result || res.data
          if (promo) {
            setTitle(promo.title || '')
            setStartTime(toDatetimeLocal(promo.startTime))
            setEndTime(toDatetimeLocal(promo.endTime))
            setContent(promo.content || '')
            setDescription(promo.description || '')
          }
        })
        .catch(err => {
          console.error('Không tìm thấy khuyến mãi:', err)
          showToast('Không thể tải dữ liệu khuyến mãi.', 'danger')
        })
    }
  }, [id, isEdit])

  // Convert LocalDateTime ISO format (2026-06-19T02:00:00) to input field value (2026-06-19T02:00)
  const toDatetimeLocal = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (e) {
      return ''
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!title.trim()) newErrors.title = 'Tiêu đề không được bỏ trống.'
    if (!startTime) newErrors.startTime = 'Thời gian bắt đầu không được bỏ trống.'
    if (!endTime) newErrors.endTime = 'Thời gian kết thúc không được bỏ trống.'
    if (!content.trim()) newErrors.content = 'Nội dung ngắn không được bỏ trống.'
    if (!description.trim()) newErrors.description = 'Chi tiết khuyến mãi không được bỏ trống.'

    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (start >= end) {
        newErrors.endTime = 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    const payload = {
      title: title.trim(),
      startTime,
      endTime,
      content: content.trim(),
      description: description.trim()
    }

    try {
      if (isEdit) {
        await promotionService.update(id, payload)
        showToast('Cập nhật khuyến mãi thành công!')
      } else {
        await promotionService.create(payload)
        showToast('Thêm khuyến mãi mới thành công!')
      }
      setTimeout(() => {
        navigate('/admin/promotions')
      }, 1000)
    } catch (err) {
      console.error('Lỗi khi lưu khuyến mãi:', err)
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra trong quá trình lưu dữ liệu.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Toast Alert */}
      {toast && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 transform translate-y-0
            ${toast.type === 'danger' 
              ? 'bg-red-950/95 border-red-500/50 text-red-300' 
              : 'bg-green-950/95 border-green-500/50 text-green-300'
            }`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header section with back link */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/promotions')}
            className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-white/20 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-2xl text-white font-extrabold tracking-wider uppercase flex items-center gap-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Tag className="text-red-500" size={24} />
              {isEdit ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {isEdit ? 'Thay đổi thông tin chương trình khuyến mãi hiện có.' : 'Tạo mới một chiến dịch khuyến mãi cho hệ thống.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form container */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left / Central Columns: Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-5 shadow-xl">
            
            {/* Title field */}
            <div className="space-y-1">
              <Input
                label="Tiêu đề khuyến mãi"
                placeholder="Nhập tiêu đề khuyến mãi..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />
            </div>

            {/* Timestamps Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <Calendar size={14} className="text-red-500" />
                  Ngày bắt đầu
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full
                    ${errors.startTime ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                />
                {errors.startTime && <span className="text-xs text-red-400 mt-1">{errors.startTime}</span>}
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <Calendar size={14} className="text-red-500" />
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full
                    ${errors.endTime ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                />
                {errors.endTime && <span className="text-xs text-red-400 mt-1">{errors.endTime}</span>}
              </div>
            </div>

            {/* Short Content */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Nội dung ngắn hiển thị
              </label>
              <textarea
                placeholder="Nhập nội dung ngắn mô tả ưu đãi..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full resize-none
                  ${errors.content ? 'border-red-500' : 'border-[var(--color-border)]'}`}
              />
              {errors.content && <span className="text-xs text-red-400 mt-1">{errors.content}</span>}
            </div>

            {/* Detailed Description */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Chi tiết khuyến mãi
              </label>
              <textarea
                placeholder="Nhập chi tiết điều khoản chương trình..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full resize-none
                  ${errors.description ? 'border-red-500' : 'border-[var(--color-border)]'}`}
              />
              {errors.description && <span className="text-xs text-red-400 mt-1">{errors.description}</span>}
            </div>

          </div>
        </div>

        {/* Right Column: Actions / Instructions */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <Sparkles className="text-red-500" size={18} />
              Thông tin bổ sung
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Các thông tin ngày bắt đầu và kết thúc sẽ được sử dụng để lọc trạng thái khuyến mãi tự động đối với người dùng cuối. 
              Hãy đảm bảo thời gian bắt đầu xảy ra trước ngày kết thúc.
            </p>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 uppercase tracking-wider font-extrabold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Đang lưu...
                </span>
              ) : (
                <span>{isEdit ? 'Cập nhật' : 'Lưu thông tin'}</span>
              )}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => navigate('/admin/promotions')}
              className="w-full py-3.5 uppercase tracking-wider font-extrabold"
            >
              Quay lại danh sách
            </Button>
          </div>
        </div>

      </form>
    </motion.div>
  )
}
