import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  promotionService,
  PROMOTION_TYPES,
  PROMOTION_TYPE_LABELS,
  DISCOUNT_TYPES,
  DISCOUNT_TYPE_LABELS,
  PROMOTION_STATUS,
  PROMOTION_STATUS_LABELS,
  formatDiscountValue,
} from '../../../services/promotionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Tag, Calendar, Sparkles, CheckCircle, AlertCircle, Ticket, ImageIcon, Hash, Power } from 'lucide-react'
import { motion } from 'motion/react'

export default function PromotionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin'

  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [detail, setDetail] = useState('')

  const [type, setType] = useState(PROMOTION_TYPES.COUPON)
  const [code, setCode] = useState('')
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false)
  const [discountType, setDiscountType] = useState(DISCOUNT_TYPES.PERCENT)
  const [discountValue, setDiscountValue] = useState('')
  const [maxTotalUsage, setMaxTotalUsage] = useState('')
  const [maxPerUser, setMaxPerUser] = useState('1')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState(PROMOTION_STATUS.ACTIVE)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const isCoupon = type === PROMOTION_TYPES.COUPON
  const isTypeUnsupported = type !== PROMOTION_TYPES.COUPON

  // Auto generate voucher code from promotion title
  const generateVoucherCodeFromTitle = (titleStr, dVal = discountValue, dType = discountType) => {
    if (!titleStr) return ''

    let str = titleStr
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')

    const stopWords = ['CHUONG', 'TRINH', 'KHUYEN', 'MAI', 'UU', 'DAI', 'GIAM', 'GIA', 'VE', 'RAP', 'CHO', 'VOUCHER', 'TANG', 'DUOC', 'VOI', 'AP', 'DUNG']
    
    str = str.replace(/[^a-zA-Z0-9\s]/g, ' ')
    let words = str.split(/\s+/).filter(Boolean)
    
    const meaningfulWords = words.filter(w => !stopWords.includes(w.toUpperCase()))
    if (meaningfulWords.length > 0) {
      words = meaningfulWords
    }

    let codeBase = words.join('').toUpperCase()

    if (dVal && !codeBase.includes(String(dVal))) {
      if (dType === DISCOUNT_TYPES.PERCENT) {
        codeBase += `${dVal}`
      } else if (dType === DISCOUNT_TYPES.FIXED_AMOUNT && Number(dVal) >= 1000) {
        codeBase += `${Math.round(Number(dVal) / 1000)}K`
      }
    }

    return codeBase.replace(/[^A-Z0-9_-]/g, '').slice(0, 32)
  }

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle)
    if (!isCodeManuallyEdited && isCoupon && !isEdit) {
      const autoCode = generateVoucherCodeFromTitle(newTitle, discountValue, discountType)
      setCode(autoCode)
    }
  }

  const handleAutoGenerateCode = () => {
    const autoCode = generateVoucherCodeFromTitle(title, discountValue, discountType)
    if (autoCode) {
      setCode(autoCode)
      setIsCodeManuallyEdited(false)
      showToast('Đã tự động tạo mã voucher từ tiêu đề!')
    }
  }

  useEffect(() => {
    if (isEdit) {
      setIsCodeManuallyEdited(true)
      promotionService.getById(id)
        .then(res => {
          const promo = res.data?.result || res.data
          if (promo) {
            setTitle(promo.title || '')
            setStartTime(toDatetimeLocal(promo.startTime))
            setEndTime(toDatetimeLocal(promo.endTime))
            setDetail(promo.detail || promo.content || promo.description || '')

            setType(promo.promotionType || promo.type || PROMOTION_TYPES.COUPON)
            setCode(promo.code || '')

            const isPercent = promo.discountPercent != null && Number(promo.discountPercent) > 0
            setDiscountType(isPercent ? DISCOUNT_TYPES.PERCENT : DISCOUNT_TYPES.FIXED_AMOUNT)
            setDiscountValue(
              isPercent ? (promo.discountPercent ?? '') : (promo.discountValue ?? '')
            )

            setMaxTotalUsage(promo.maxTotalUsage ?? '')
            setMaxPerUser(promo.maxPerUser ?? '1')
            setImageUrl(promo.imageUrl || '')
            setStatus(promo.status || PROMOTION_STATUS.ACTIVE)
          }
        })
        .catch(err => {
          console.error('Không tải được khuyến mãi:', err)
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
    } catch {
      return ''
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!title.trim()) newErrors.title = 'Tiêu đề không được bỏ trống.'
    if (!startTime) newErrors.startTime = 'Thời gian bắt đầu không được bỏ trống.'
    if (!endTime) newErrors.endTime = 'Thời gian kết thúc không được bỏ trống.'
    if (!detail.trim()) newErrors.detail = 'Chi tiết khuyến mãi không được bỏ trống.'

    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (start >= end) newErrors.endTime = 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.'
    }

    if (isCoupon) {
      if (!code.trim()) {
        newErrors.code = 'Mã voucher bắt buộc cho loại COUPON.'
      } else if (!/^[A-Z0-9_-]{3,32}$/i.test(code.trim())) {
        newErrors.code = 'Mã chỉ gồm chữ, số, gạch ngang, gạch dưới (3-32 ký tự).'
      }

      if (discountValue === '' || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
        newErrors.discountValue = 'Giá trị giảm bắt buộc và phải > 0.'
      } else if (discountType === DISCOUNT_TYPES.PERCENT && Number(discountValue) > 100) {
        newErrors.discountValue = 'Giảm theo % không được vượt quá 100.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildPayload = () => {
    const payload = {
      promotionType: type,
      title: title.trim(),
      detail: detail.trim(),
      startTime,
      endTime,
      imageUrl: imageUrl.trim() || null,
    }

    if (isCoupon) {
      payload.code = code.trim().toUpperCase()
      if (discountValue !== '') {
        if (discountType === DISCOUNT_TYPES.PERCENT) {
          payload.discountPercent = Number(discountValue)
          payload.discountValue = null
        } else {
          payload.discountValue = Number(discountValue)
          payload.discountPercent = null
        }
      } else {
        payload.discountPercent = null
        payload.discountValue = null
      }
      payload.maxTotalUsage = maxTotalUsage === '' ? null : Number(maxTotalUsage)
      payload.maxPerUser = maxPerUser === '' ? 1 : Number(maxPerUser)
    }

    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isTypeUnsupported) {
      showToast('Loại CAMPAIGN/POINTS hiện chưa hỗ trợ trên UI. Vui lòng chọn COUPON.', 'danger')
      return
    }
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      if (isEdit) {
        await promotionService.update(id, payload)
        showToast('Cập nhật khuyến mãi thành công!')
      } else {
        await promotionService.create(payload)
        showToast('Thêm khuyến mãi mới thành công!')
      }
      setTimeout(() => navigate(`${basePath}/promotions`), 1000)
    } catch (err) {
      console.error('Lỗi khi lưu khuyến mãi:', err)
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra trong quá trình lưu dữ liệu.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!isEdit) {
      showToast('Bạn cần lưu khuyến mãi trước khi đổi trạng thái.', 'danger')
      return
    }
    const next = status === PROMOTION_STATUS.ACTIVE ? PROMOTION_STATUS.DISABLED : PROMOTION_STATUS.ACTIVE
    setIsToggling(true)
    try {
      await promotionService.toggleStatus(id)
      setStatus(next)
      showToast(`Đã chuyển trạng thái sang ${PROMOTION_STATUS_LABELS[next]}.`)
    } catch (err) {
      console.error('Lỗi đổi trạng thái:', err)
      const errorMsg = err.response?.data?.message || 'Không thể đổi trạng thái.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsToggling(false)
    }
  }

  const previewDiscountText =
    discountValue && !isNaN(Number(discountValue))
      ? formatDiscountValue({ discountType, discountValue: Number(discountValue) })
      : '—'

  return (
    <motion.div
      className="max-w-5xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300
          ${toast.type === 'danger'
              ? 'bg-red-950/95 border-red-500/50 text-red-300'
              : 'bg-green-950/95 border-green-500/50 text-green-300'}`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${basePath}/promotions`)}
            className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-on-surface)] hover:border-white/20 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-2xl text-[var(--color-on-surface)] font-extrabold tracking-wider uppercase flex items-center gap-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Tag className="text-red-500" size={24} />
              {isEdit ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {isEdit
                ? `Trạng thái hiện tại: ${PROMOTION_STATUS_LABELS[status] || status}`
                : 'Tạo mới một chiến dịch khuyến mãi cho hệ thống.'}
            </p>
          </div>
        </div>

        {isEdit && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleToggleStatus}
            disabled={isToggling || status === PROMOTION_STATUS.EXPIRED}
            className="flex items-center gap-2"
          >
            <Power size={16} />
            {status === PROMOTION_STATUS.ACTIVE ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
          </Button>
        )}
      </div>

      {isTypeUnsupported && (
        <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 text-sm text-yellow-300 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold mb-1">Loại {PROMOTION_TYPE_LABELS[type]} hiện chưa hỗ trợ trên UI</p>
            <p className="text-xs leading-relaxed">
              Vui lòng chọn <b>COUPON</b> để tạo mã voucher khách hàng nhập thủ công. Các loại khác (CAMPAIGN, POINTS) sẽ
              được hỗ trợ ở phiên bản sau.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-5 shadow-xl">
            <Input
              label="Tiêu đề khuyến mãi"
              placeholder="Nhập tiêu đề khuyến mãi..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
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
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Chi tiết khuyến mãi</label>
              <textarea
                placeholder="Nhập chi tiết điều khoản chương trình..."
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={6}
                className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full resize-none
                  ${errors.detail ? 'border-red-500' : 'border-[var(--color-border)]'}`}
              />
              {errors.detail && <span className="text-xs text-red-400 mt-1">{errors.detail}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <Tag size={14} className="text-red-500" /> Loại khuyến mãi
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

              <div className="flex flex-col gap-1 w-full text-left">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Hash size={14} className="text-red-500" /> Mã voucher
                  </label>
                  {isCoupon && title && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                      title="Tự động sinh mã từ tên chương trình"
                    >
                      <Sparkles size={12} /> Tự động tạo mã
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setIsCodeManuallyEdited(true)
                  }}
                  placeholder="VD: SUMMER2026"
                  disabled={!isCoupon}
                  className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full uppercase tracking-wider font-mono disabled:opacity-50
                    ${errors.code ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                />
                {errors.code
                  ? <span className="text-xs text-red-400 mt-1">{errors.code}</span>
                  : <span className="text-xs text-[var(--color-text-muted)] mt-1">3-32 ký tự: chữ hoa, số, gạch ngang, gạch dưới.</span>
                }
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Kiểu giảm</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  disabled={!isCoupon}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer disabled:opacity-50"
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
                  disabled={!isCoupon}
                  className={`bg-[var(--color-surface-2)] border rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full disabled:opacity-50
                    ${errors.discountValue ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                />
                {errors.discountValue && <span className="text-xs text-red-400 mt-1">{errors.discountValue}</span>}
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Tổng lượt dùng</label>
                <input
                  type="number"
                  min="1"
                  value={maxTotalUsage}
                  onChange={(e) => setMaxTotalUsage(e.target.value)}
                  placeholder="Không giới hạn"
                  disabled={!isCoupon}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Lượt / 1 user</label>
                <input
                  type="number"
                  min="1"
                  value={maxPerUser}
                  onChange={(e) => setMaxPerUser(e.target.value)}
                  disabled={!isCoupon}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
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
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {isCoupon && code && discountValue && (
              <div className="bg-gradient-to-r from-red-600/20 to-transparent border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <Sparkles className="text-red-500" size={20} />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold">Preview</p>
                  <p className="text-lg text-white font-extrabold">
                    {code} <span className="text-red-500">— {previewDiscountText}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3
              className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3"
              style={{ fontFamily: 'Montserrat' }}
            >
              <Ticket className="text-red-500" size={18} />
              Hướng dẫn
            </h3>
            <ul className="text-xs text-[var(--color-text-muted)] space-y-2 leading-relaxed list-disc pl-4">
              <li>Mã <b>code</b> phải viết HOA, không có khoảng trắng.</li>
              <li>Nếu giảm theo <b>%</b>: nhập số từ 1 đến 100.</li>
              <li>Nếu giảm tiền mặt: nhập số tiền VNĐ.</li>
              <li>Để trống <b>Tổng lượt dùng</b> = không giới hạn.</li>
              <li>Sau khi lưu, có thể bật/tắt ở nút <b>Vô hiệu hóa</b> trên header.</li>
            </ul>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <Button
              type="submit"
              disabled={isSubmitting || isTypeUnsupported}
              className="w-full py-3.5 uppercase tracking-wider font-extrabold disabled:opacity-50"
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
              onClick={() => navigate(`${basePath}/promotions`)}
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
