import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { promotionService, PROMOTION_TYPES, PROMOTION_TYPE_LABELS, DISCOUNT_TYPES, DISCOUNT_TYPE_LABELS, formatDiscountValue } from '../../../services/promotionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Tag, Calendar, Sparkles, CheckCircle, AlertCircle, Ticket, Clock, ImageIcon, Hash, Layers, Target } from 'lucide-react'
import { motion } from 'motion/react'

const DAYS = [
  { value: 'MON', label: 'Thứ 2' },
  { value: 'TUE', label: 'Thứ 3' },
  { value: 'WED', label: 'Thứ 4' },
  { value: 'THU', label: 'Thứ 5' },
  { value: 'FRI', label: 'Thứ 6' },
  { value: 'SAT', label: 'Thứ 7' },
  { value: 'SUN', label: 'Chủ nhật' },
]

export default function PromotionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  // ===== Form state =====
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')

  // ===== Mở rộng (tham khảo CGV) — sẽ gửi kèm payload tới backend =====
  // Backend hiện tại có thể bỏ qua các field không hiểu, UI vẫn hoạt động bình thường.
  const [code, setCode] = useState('')                 // Mã voucher (VD: SUMMER2026)
  const [imageUrl, setImageUrl] = useState('')          // Banner
  const [type, setType] = useState(PROMOTION_TYPES.VOUCHER)
  const [discountType, setDiscountType] = useState(DISCOUNT_TYPES.PERCENT)
  const [discountValue, setDiscountValue] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [usagePerUser, setUsagePerUser] = useState('1')
  const [priority, setPriority] = useState('0')
  const [stackable, setStackable] = useState(false)

  // Targeting
  const [applicableDays, setApplicableDays] = useState([]) // ['MON','TUE',...]
  const [applicableHours, setApplicableHours] = useState('') // "14:00-17:00"

  // ===== UI state =====
  const [activeTab, setActiveTab] = useState('basic') // basic | discount | conditions
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
            setContent(promo.content || promo.detail || '')
            setDescription(promo.description || promo.detail || '')

            setCode(promo.code || '')
            setImageUrl(promo.imageUrl || '')
            setType(promo.type || PROMOTION_TYPES.VOUCHER)

            // Map discount values from backend
            const isPercent = promo.discountPercent != null && Number(promo.discountPercent) > 0
            setDiscountType(isPercent ? DISCOUNT_TYPES.PERCENT : DISCOUNT_TYPES.FIXED_AMOUNT)
            setDiscountValue(isPercent ? (promo.discountPercent ?? '') : (promo.discountValue ?? ''))

            setMinOrderValue(promo.minOrderValue ?? '')
            setMaxDiscount(promo.maxDiscount ?? '')
            setUsageLimit(promo.maxTotalUsage ?? promo.usageLimit ?? '')
            setUsagePerUser(promo.usagePerUser ?? '1')
            setPriority(promo.priority ?? '0')
            setStackable(!!promo.stackable)
            setApplicableDays(Array.isArray(promo.applicableDays) ? promo.applicableDays : [])
            setApplicableHours(promo.applicableHours || '')
          }
        })
        .catch(err => {
          console.error('Không tìm thấy khuyến mãi:', err)
          showToast('Không thể tải dữ liệu khuyến mãi.', 'danger')
        })
    }
  }, [id, isEdit])

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

  const toggleDay = (value) => {
    setApplicableDays(prev => prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value])
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
      if (start >= end) newErrors.endTime = 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.'
    }

    if (code && !/^[A-Z0-9_-]{3,32}$/i.test(code)) {
      newErrors.code = 'Mã chỉ gồm chữ, số, gạch ngang, gạch dưới (3-32 ký tự).'
    }
    if (discountValue !== '' && (isNaN(Number(discountValue)) || Number(discountValue) <= 0)) {
      newErrors.discountValue = 'Giá trị giảm phải > 0.'
    }
    if (discountType === DISCOUNT_TYPES.PERCENT && Number(discountValue) > 100) {
      newErrors.discountValue = 'Giảm theo % không được vượt quá 100.'
    }

    if (applicableHours && !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(applicableHours)) {
      newErrors.applicableHours = 'Định dạng phải là HH:mm-HH:mm (VD: 14:00-17:00).'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      setActiveTab('basic')
      return
    }

    setIsSubmitting(true)

    // Payload gửi tới backend — bổ sung các trường chuẩn mà backend yêu cầu
    const payload = {
      title: title.trim(),
      startTime,
      endTime,
      content: content.trim(),
      description: description.trim(),
      detail: description.trim() || content.trim(),

      code: code.trim().toUpperCase() || null,
      imageUrl: imageUrl.trim() || null,
      type,
      discountType,

      // Phân tách % giảm và tiền mặt giảm theo loại đã chọn
      discountPercent: discountType === DISCOUNT_TYPES.PERCENT && discountValue !== '' ? Number(discountValue) : null,
      discountValue: discountType === DISCOUNT_TYPES.FIXED_AMOUNT && discountValue !== '' ? Number(discountValue) : null,

      minOrderValue: minOrderValue === '' ? null : Number(minOrderValue),
      maxDiscount: maxDiscount === '' ? null : Number(maxDiscount),

      // Bổ sung maxTotalUsage tương ứng với Tổng lượt dùng
      maxTotalUsage: usageLimit === '' ? null : Number(usageLimit),
      usageLimit: usageLimit === '' ? null : Number(usageLimit),

      usagePerUser: usagePerUser === '' ? 1 : Number(usagePerUser),
      priority: priority === '' ? 0 : Number(priority),
      stackable,
      applicableDays: applicableDays.length ? applicableDays : null,
      applicableHours: applicableHours.trim() || null,
    }

    try {
      if (isEdit) {
        await promotionService.update(id, payload)
        showToast('Cập nhật khuyến mãi thành công!')
      } else {
        await promotionService.create(payload)
        showToast('Thêm khuyến mãi mới thành công!')
      }
      setTimeout(() => navigate('/admin/promotions'), 1000)
    } catch (err) {
      console.error('Lỗi khi lưu khuyến mãi:', err)
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra trong quá trình lưu dữ liệu.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preview badge text dựa trên giá trị giảm
  const previewDiscountText = discountValue
    ? formatDiscountValue({ discountType, discountValue: Number(discountValue) })
    : '—'

  const tabs = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: Tag },
    { id: 'discount', label: 'Giảm giá', icon: Ticket },
    { id: 'conditions', label: 'Điều kiện áp dụng', icon: Target },
  ]

  return (
    <motion.div
      className="max-w-5xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300
          ${toast.type === 'danger'
            ? 'bg-red-950/95 border-red-500/50 text-red-300'
            : 'bg-green-950/95 border-green-500/50 text-green-300'}`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/promotions')}
            className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-on-surface)] hover:border-white/20 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl text-[var(--color-on-surface)] font-extrabold tracking-wider uppercase flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <Tag className="text-red-500" size={24} />
              {isEdit ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {isEdit ? 'Thay đổi thông tin chương trình khuyến mãi hiện có.' : 'Tạo mới một chiến dịch khuyến mãi cho hệ thống.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors cursor-pointer
                ${isActive
                  ? 'border-red-500 text-[var(--color-on-surface)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-on-surface)]'}`}
            >
              <Icon size={14} className={isActive ? 'text-red-500' : ''} />
              {t.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left / Central */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-5 shadow-xl">

            {/* === Tab: Basic === */}
            {activeTab === 'basic' && (
              <>
                <Input
                  label="Tiêu đề khuyến mãi"
                  placeholder="Nhập tiêu đề khuyến mãi..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                      <Calendar size={14} className="text-red-500" /> Ngày bắt đầu
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
                      <Calendar size={14} className="text-red-500" /> Ngày kết thúc
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

                <div className="flex flex-col gap-1 w-full text-left pt-2 border-t border-[var(--color-border)]">
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-red-500" /> URL banner (tuỳ chọn)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full"
                  />
                  {imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-[var(--color-border)] max-h-40">
                      <img src={imageUrl} alt="preview" className="w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* === Tab: Discount === */}
            {activeTab === 'discount' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                      <Hash size={14} className="text-red-500" /> Mã voucher
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="VD: SUMMER2026"
                      className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full uppercase tracking-wider font-mono
                        ${errors.code ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                    />
                    {errors.code
                      ? <span className="text-xs text-red-400 mt-1">{errors.code}</span>
                      : <span className="text-xs text-[var(--color-text-muted)] mt-1">Để trống nếu KM tự động (không cần nhập mã).</span>
                    }
                  </div>

                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                      <Layers size={14} className="text-red-500" /> Loại khuyến mãi
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                    >
                      {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Kiểu giảm</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                    >
                      {Object.entries(DISCOUNT_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
                      Giá trị giảm {discountType === DISCOUNT_TYPES.PERCENT ? '(%)' : '(VNĐ)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === DISCOUNT_TYPES.PERCENT ? '20' : '50000'}
                      className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full
                        ${errors.discountValue ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                    />
                    {errors.discountValue && <span className="text-xs text-red-400 mt-1">{errors.discountValue}</span>}
                  </div>

                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Trần giảm (nếu %)</label>
                    <input
                      type="number"
                      min="0"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="VD: 100000"
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Đơn tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      placeholder="0 = không yêu cầu"
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Tổng lượt dùng</label>
                    <input
                      type="number"
                      min="0"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      placeholder="Không giới hạn"
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Lượt / 1 user</label>
                    <input
                      type="number"
                      min="1"
                      value={usagePerUser}
                      onChange={(e) => setUsagePerUser(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Độ ưu tiên</label>
                    <input
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      placeholder="0"
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full"
                    />
                    <span className="text-xs text-[var(--color-text-muted)] mt-1">Cao hơn = ưu tiên khi cùng lúc nhiều KM.</span>
                  </div>

                  <label className="flex items-center gap-3 pt-7 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={stackable}
                      onChange={(e) => setStackable(e.target.checked)}
                      className="w-4 h-4 accent-red-500 cursor-pointer"
                    />
                    <span className="text-sm text-white">Cho phép cộng dồn với KM khác</span>
                  </label>
                </div>

                {/* Preview badge */}
                <div className="bg-gradient-to-r from-red-600/20 to-transparent border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Sparkles className="text-red-500" size={20} />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Preview</p>
                    <p className="text-lg text-white font-extrabold">
                      {code ? code : '(tự động)'} <span className="text-red-500">— {previewDiscountText}</span>
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* === Tab: Conditions === */}
            {activeTab === 'conditions' && (
              <>
                <div className="flex flex-col gap-2 w-full text-left">
                  <label className="text-sm font-medium text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Calendar size={14} className="text-red-500" /> Áp dụng vào các ngày
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => {
                      const active = applicableDays.includes(d.value)
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer
                            ${active
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-red-500/40'}`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">Bỏ trống = áp dụng mọi ngày.</span>
                </div>

                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-red-500" /> Khung giờ áp dụng
                  </label>
                  <input
                    type="text"
                    value={applicableHours}
                    onChange={(e) => setApplicableHours(e.target.value)}
                    placeholder="14:00-17:00"
                    className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full font-mono
                      ${errors.applicableHours ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                  />
                  {errors.applicableHours
                    ? <span className="text-xs text-red-400 mt-1">{errors.applicableHours}</span>
                    : <span className="text-xs text-[var(--color-text-muted)] mt-1">Định dạng HH:mm-HH:mm. Bỏ trống = mọi giờ (VD: Flash sale 14h-17h).</span>
                  }
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-xs text-yellow-300 leading-relaxed">
                  <strong>Tham khảo CGV:</strong> "Thứ 3 vui vẻ" → chọn Thứ 3. "Happy Hour" → khung giờ 14:00-17:00.
                  Có thể kết hợp cả 2 để giới hạn chính xác thời điểm áp dụng.
                </div>
              </>
            )}

          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <Sparkles className="text-red-500" size={18} />
              Thông tin bổ sung
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Tab <b>Giảm giá</b> cho phép cấu hình voucher / flash sale / combo.
              Tab <b>Điều kiện</b> giới hạn KM theo ngày/giờ (tham khảo CGV).
            </p>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Các trường mở rộng (mã, loại, điều kiện) sẽ gửi kèm payload tới backend.
              Backend hiện tại sẽ tự bỏ qua các field chưa hỗ trợ.
            </p>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <Button type="submit" disabled={isSubmitting} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Đang lưu...
                </span>
              ) : (
                <span>{isEdit ? 'Cập nhật' : 'Lưu thông tin'}</span>
              )}
            </Button>

            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => navigate('/admin/promotions')} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
