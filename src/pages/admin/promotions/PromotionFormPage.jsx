import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { promotionService, PROMOTION_TYPES, PROMOTION_TYPE_LABELS, DISCOUNT_TYPES, DISCOUNT_TYPE_LABELS, formatDiscountValue } from '../../../services/promotionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { motion } from 'motion/react'
import { ArrowLeft, Calendar, Sparkles, CheckCircle, AlertCircle, Ticket, Clock, ImageIcon, Hash, Layers, Target, Star, Eye, EyeOff, Save, X, Percent, DollarSign, Users, Zap, Award, Gift, Filter, Type, FileText } from 'lucide-react'

const DAYS = [
  { value: 'MON', label: 'T2', full: 'Thu 2' },
  { value: 'TUE', label: 'T3', full: 'Thu 3' },
  { value: 'WED', label: 'T4', full: 'Thu 4' },
  { value: 'THU', label: 'T5', full: 'Thu 5' },
  { value: 'FRI', label: 'T6', full: 'Thu 6' },
  { value: 'SAT', label: 'T7', full: 'Thu 7' },
  { value: 'SUN', label: 'CN', full: 'Chu nhat' },
]

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

const PROMO_TYPE_META = {
  VOUCHER: { label: 'Voucher', emoji: 'V', tag: 'bg-rose-500 text-white', headerBg: 'bg-rose-50' },
  FLASH_SALE: { label: 'Flash Sale', emoji: 'F', tag: 'bg-amber-500 text-white', headerBg: 'bg-amber-50' },
  COMBO: { label: 'Combo', emoji: 'C', tag: 'bg-violet-500 text-white', headerBg: 'bg-violet-50' },
  EVENT: { label: 'Su kien', emoji: 'E', tag: 'bg-emerald-500 text-white', headerBg: 'bg-emerald-50' },
  DISCOUNT: { label: 'Giam gia', emoji: 'D', tag: 'bg-sky-500 text-white', headerBg: 'bg-sky-50' },
}

export default function PromotionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  console.log('[PromotionForm] Mounted, isEdit=', isEdit)

  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [type, setType] = useState(PROMOTION_TYPES.VOUCHER)
  const [discountType, setDiscountType] = useState(DISCOUNT_TYPES.PERCENT)
  const [discountValue, setDiscountValue] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [usagePerUser, setUsagePerUser] = useState('1')
  const [priority, setPriority] = useState('0')
  const [stackable, setStackable] = useState(false)
  const [applicableDays, setApplicableDays] = useState([])
  const [applicableHours, setApplicableHours] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [previewLive, setPreviewLive] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

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
          console.error('Khong tim thay khuyen mai:', err)
          showToast('Khong the tai du lieu khuyen mai.', 'danger')
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
    if (!title.trim()) newErrors.title = 'Tieu de khong duoc bo trong.'
    if (!startTime) newErrors.startTime = 'Thoi gian bat dau khong duoc bo trong.'
    if (!endTime) newErrors.endTime = 'Thoi gian ket thuc khong duoc bo trong.'
    if (!content.trim()) newErrors.content = 'Noi dung ngan khong duoc bo trong.'
    if (!description.trim()) newErrors.description = 'Chi tiet khuyen mai khong duoc bo trong.'
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (start >= end) newErrors.endTime = 'Thoi gian ket thuc phai lon hon thoi gian bat dau.'
    }
    if (code && !/^[A-Z0-9_-]{3,32}$/i.test(code)) {
      newErrors.code = 'Ma chi gom chu, so, gach ngang, gach duoi (3-32 ky tu).'
    }
    if (discountValue !== '' && (isNaN(Number(discountValue)) || Number(discountValue) <= 0)) {
      newErrors.discountValue = 'Gia tri giam phai > 0.'
    }
    if (discountType === DISCOUNT_TYPES.PERCENT && Number(discountValue) > 100) {
      newErrors.discountValue = 'Giam theo % khong duoc vuot qua 100.'
    }
    if (applicableHours && !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(applicableHours)) {
      newErrors.applicableHours = 'Dinh dang phai la HH:mm-HH:mm (VD: 14:00-17:00).'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { setActiveTab('basic'); return }
    setIsSubmitting(true)
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
      discountPercent: discountType === DISCOUNT_TYPES.PERCENT && discountValue !== '' ? Number(discountValue) : null,
      discountValue: discountType === DISCOUNT_TYPES.FIXED_AMOUNT && discountValue !== '' ? Number(discountValue) : null,
      minOrderValue: minOrderValue === '' ? null : Number(minOrderValue),
      maxDiscount: maxDiscount === '' ? null : Number(maxDiscount),
      maxTotalUsage: usageLimit === '' ? null : Number(usageLimit),
      usageLimit: usageLimit === '' ? null : Number(usageLimit),
      usagePerUser: usagePerUser === '' ? 1 : Number(usagePerUser),
      priority: priority === '' ? 0 : Number(priority),
      stackable,
      applicableDays: applicableDays.length ? applicableDays : null,
      applicableHours: applicableHours.trim() || null,
    }
    try {
      if (isEdit) { await promotionService.update(id, payload); showToast('Cap nhat khuyen mai thanh cong!') }
      else { await promotionService.create(payload); showToast('Them khuyen mai moi thanh cong!') }
      setTimeout(() => navigate('/admin/promotions'), 1000)
    } catch (err) {
      console.error('Loi khi luu khuyen mai:', err)
      const errorMsg = err.response?.data?.message || 'Co loi xay ra trong qua trinh luu du lieu.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  const previewDiscountText = discountValue
    ? formatDiscountValue({ discountType, discountValue: Number(discountValue) })
    : '--'
  const currentTypeMeta = PROMO_TYPE_META[type] || PROMO_TYPE_META.VOUCHER
  const tabs = [
    { id: 'basic', label: '01 Thong tin co ban', icon: Type },
    { id: 'discount', label: '02 Giam gia', icon: Percent },
    { id: 'conditions', label: '03 Dieu kien ap dung', icon: Filter },
  ]

  return (
    <div className="text-left space-y-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2 text-sm max-w-sm font-bold ${
            toast.type === 'danger' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/admin/promotions')}
                className="group w-12 h-12 bg-slate-900 hover:bg-red-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:shadow-red-500/30 hover:scale-105"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" />
                    {isEdit ? 'EDIT MODE' : 'NEW ENTRY'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${currentTypeMeta.tag}`}>
                    <Ticket size={11} /> {currentTypeMeta.label}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  {isEdit ? <>Cap nhat<br /><span className="text-red-600">khuyen mai</span></> : <>Them khuyen mai<br /><span className="text-red-600">moi cho he thong</span></>}
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  {isEdit ? 'Thay doi thong tin chuong trinh khuyen mai hien co.' : 'Tao moi mot chien dich khuyen mai voi ma giam gia, voucher hoac combo dac biet.'}
                </p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-lg">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Hash size={11} /> Promo ID
                </div>
                <div className="text-xl font-black font-mono tracking-tight">#{String(Date.now()).slice(-6)}</div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLive(!previewLive)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-900 hover:text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider text-slate-900 transition-all cursor-pointer shadow-md"
              >
                {previewLive ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
                Preview
              </button>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* TABS BAR */}
      <div className="flex flex-wrap gap-2 bg-white border-2 border-slate-900 rounded-2xl p-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 ${
                isActive ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-[2px_2px_0px_0px_rgba(225,29,72,1)]' : 'bg-white text-slate-700 border-transparent hover:border-slate-900'
              }`}
            >
              <Icon size={14} strokeWidth={2.5} />
              {t.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 01 - BASIC */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] ${activeTab !== 'basic' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">01</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-rose-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Thong tin co ban</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Tieu de, thoi gian va mo ta khuyen mai</p>
                </div>
                <button type="button" onClick={() => setActiveTab('basic')} className="text-slate-900 hover:text-red-600 cursor-pointer">
                  <Type size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5 bg-white">
              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} strokeWidth={2.5} className="text-red-600" />
                  Tieu de khuyen mai <span className="text-red-600">*</span>
                </label>
                <Input
                  placeholder="VD: Summer Sale - Giam 30% ve xem phim"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Calendar size={11} strokeWidth={2.5} className="text-red-600" />
                    Ngay bat dau <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold ${errors.startTime ? 'border-red-600' : 'border-slate-200'}`}
                  />
                  {errors.startTime && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.startTime}</span>}
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Calendar size={11} strokeWidth={2.5} className="text-red-600" />
                    Ngay ket thuc <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold ${errors.endTime ? 'border-red-600' : 'border-slate-200'}`}
                  />
                  {errors.endTime && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.endTime}</span>}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} strokeWidth={2.5} className="text-red-600" />
                  Noi dung ngan <span className="text-red-600">*</span>
                </label>
                <textarea
                  placeholder="Noi dung ngan mo ta uu dai..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={2}
                  className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 resize-none font-medium ${errors.content ? 'border-red-600' : 'border-slate-200'}`}
                />
                {errors.content && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.content}</span>}
              </div>

              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <FileText size={11} strokeWidth={2.5} className="text-red-600" />
                  Chi tiet khuyen mai <span className="text-red-600">*</span>
                </label>
                <textarea
                  placeholder="Nhap chi tiet dieu khoan chuong trinh..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 resize-none font-medium ${errors.description ? 'border-red-600' : 'border-slate-200'}`}
                />
                {errors.description && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.description}</span>}
              </div>

              <div className="pt-3 border-t-2 border-dashed border-slate-200">
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <ImageIcon size={11} strokeWidth={2.5} className="text-red-600" />
                  URL banner (tuy chon)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50"
                />
                {imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] max-h-40">
                    <img src={imageUrl} alt="preview" className="w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* SECTION 02 - DISCOUNT */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] ${activeTab !== 'discount' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">02</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-amber-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Cau hinh giam gia</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Ma voucher, loai KM va gia tri giam</p>
                </div>
                <button type="button" onClick={() => setActiveTab('discount')} className="text-slate-900 hover:text-red-600 cursor-pointer">
                  <Percent size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Hash size={11} strokeWidth={2.5} className="text-red-600" />
                    Ma voucher
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: SUMMER2026"
                    className={`w-full bg-amber-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-amber-50 uppercase tracking-wider font-mono font-bold ${errors.code ? 'border-red-600' : 'border-slate-200'}`}
                  />
                  {errors.code ? <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.code}</span> : <span className="text-[10px] text-slate-500 font-bold mt-1 block">De trong neu KM tu dong (khong can nhap ma).</span>}
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Layers size={11} strokeWidth={2.5} className="text-red-600" />
                    Loai khuyen mai
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-amber-50 h-[46px] font-bold cursor-pointer"
                  >
                    {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{PROMO_TYPE_META[k]?.emoji} {v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Percent size={11} strokeWidth={2.5} className="text-red-600" />
                    Kieu giam
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-amber-50 h-[46px] font-bold cursor-pointer"
                  >
                    {Object.entries(DISCOUNT_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <DollarSign size={11} strokeWidth={2.5} className="text-red-600" />
                    Gia tri giam {discountType === DISCOUNT_TYPES.PERCENT ? '(%)' : '(VND)'}
                  </label>
                  <input
                    type="number" min="0" step="any" value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === DISCOUNT_TYPES.PERCENT ? '20' : '50000'}
                    className={`w-full bg-amber-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-amber-50 font-bold ${errors.discountValue ? 'border-red-600' : 'border-slate-200'}`}
                  />
                  {errors.discountValue && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.discountValue}</span>}
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Award size={11} strokeWidth={2.5} className="text-red-600" />
                    Tran giam (neu %)
                  </label>
                  <input
                    type="number" min="0" value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="VD: 100000"
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-amber-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <DollarSign size={11} strokeWidth={2.5} className="text-red-600" />
                    Don toi thieu (VND)
                  </label>
                  <input
                    type="number" min="0" value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0 = khong yeu cau"
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-amber-50 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Users size={11} strokeWidth={2.5} className="text-red-600" />
                    Tong luot dung
                  </label>
                  <input
                    type="number" min="0" value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Khong gioi han"
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-amber-50 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Users size={11} strokeWidth={2.5} className="text-red-600" />
                    Luot / 1 user
                  </label>
                  <input
                    type="number" min="1" value={usagePerUser}
                    onChange={(e) => setUsagePerUser(e.target.value)}
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-amber-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Zap size={11} strokeWidth={2.5} className="text-red-600" />
                    Do uu tien
                  </label>
                  <input
                    type="number" value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    placeholder="0"
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-amber-50 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 font-bold mt-1 block">Cao hon = uu tien khi cung luc nhieu KM.</span>
                </div>
                <label className={`flex items-center justify-between gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all mt-6 ${stackable ? 'bg-gradient-to-r from-amber-50 to-emerald-50 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]' : 'bg-slate-50 border-slate-200 hover:border-slate-900'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Cong don voi KM khac</span>
                      {stackable && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-black uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Active</span>}
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{stackable ? '✓ Cho phep cong don' : '✕ Khong cong don'}</p>
                  </div>
                  <div className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 border-2 border-slate-900 ${stackable ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${stackable ? 'left-[26px]' : 'left-0.5'}`} />
                    <input type="checkbox" checked={stackable} onChange={(e) => setStackable(e.target.checked)} className="sr-only" />
                  </div>
                </label>
              </div>

              <div className="bg-gradient-to-r from-red-100 to-amber-100 border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                    <Sparkles size={20} className="text-amber-300" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 mb-0.5">Preview</p>
                    <p className="text-xl font-black text-slate-900">
                      {code || '(tu dong)'} <span className="text-red-600">-- {previewDiscountText}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECTION 03 - CONDITIONS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] ${activeTab !== 'conditions' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">03</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-violet-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Dieu kien ap dung</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Gioi han theo ngay trong tuan va khung gio</p>
                </div>
                <button type="button" onClick={() => setActiveTab('conditions')} className="text-slate-900 hover:text-red-600 cursor-pointer">
                  <Target size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5 bg-white">
              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-3 flex items-center gap-1.5">
                  <Calendar size={11} strokeWidth={2.5} className="text-red-600" />
                  Ap dung vao cac ngay
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => {
                    const active = applicableDays.includes(d.value)
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        title={d.full}
                        className={`min-w-[52px] py-3 rounded-xl text-xs font-black border-2 transition-all cursor-pointer uppercase tracking-wider ${
                          active ? 'bg-red-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]' : 'bg-violet-50 text-slate-700 border-slate-200 hover:border-slate-900'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-2">Bo trong = ap dung moi ngay.</p>
              </div>

              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <Clock size={11} strokeWidth={2.5} className="text-red-600" />
                  Khung gio ap dung
                </label>
                <input
                  type="text" value={applicableHours}
                  onChange={(e) => setApplicableHours(e.target.value)}
                  placeholder="14:00-17:00"
                  className={`w-full bg-violet-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-violet-50 font-mono font-bold ${errors.applicableHours ? 'border-red-600' : 'border-slate-200'}`}
                />
                {errors.applicableHours ? <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.applicableHours}</span> : <p className="text-[10px] text-slate-500 font-bold mt-1">Dinh dang HH:mm-HH:mm. Bo trong = moi gio (VD: Flash sale 14h-17h).</p>}
              </div>

              <div className="bg-amber-100 border-2 border-amber-600 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-amber-300" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 mb-1">Tham khao CGV</p>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      "Thu 3 vui ve" -- chon Thu 3. "Happy Hour" -- khung gio 14:00-17:00.
                      Co the ket hop ca 2 de gioi han chinh xac thoi diem ap dung.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">★</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-sky-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Tom tat</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Thong tin chinh cua KM</p>
                </div>
                <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Ticket size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Loai</p>
                  <p className="text-sm font-black text-slate-900 truncate">{currentTypeMeta.label}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Hash size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ma voucher</p>
                  <p className="text-sm font-black text-slate-900 truncate font-mono">{code || '(tu dong)'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border-2 border-slate-900">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Gia tri giam</p>
                  <p className="text-base font-black text-red-600">{previewDiscountText}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Thoi gian</p>
                  <p className="text-xs font-bold text-slate-900">{startTime ? new Date(startTime).toLocaleString('vi-VN') : 'Chua dat'} -- {endTime ? new Date(endTime).toLocaleString('vi-VN') : 'Chua dat'}</p>
                </div>
              </div>
              {applicableDays.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border-2 border-slate-200">
                  <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target size={14} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ngay ap dung</p>
                    <p className="text-xs font-bold text-slate-900">{applicableDays.map(d => DAYS.find(x => x.value === d)?.label).join(' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-3"
          >
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/promotions')}
              className="flex-1 py-4 !rounded-2xl !border-2 !border-dashed !border-slate-500 !bg-slate-600 hover:!bg-slate-500 !text-white hover:!text-white font-black uppercase tracking-wider text-xs !shadow-none transition-all"
              type="button"
            >
              <X size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={3} />
              Huy bo
            </Button>
            <Button
              className="flex-1 py-4 rounded-2xl border-2 border-slate-900 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Dang luu...' : <><Save size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={2.5} />{isEdit ? 'Cap nhat' : 'Them moi'}</>}
            </Button>
          </motion.div>
        </div>
      </form>

      {/* Preview Modal */}
      {previewLive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewLive(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(225,29,72,1)]"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Eye size={18} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Customer View</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Khach hang se thay</p>
                </div>
              </div>
              <button onClick={() => setPreviewLive(false)} className="w-9 h-9 bg-slate-100 hover:bg-rose-100 border-2 border-slate-900 rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="border-2 border-slate-900 rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              {imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) ? (
                <div className="aspect-video bg-amber-50"><img src={imageUrl} alt="preview" className="w-full h-full object-cover" /></div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-rose-100 via-amber-100 to-violet-100 flex items-center justify-center text-7xl">
                  {currentTypeMeta.emoji}
                </div>
              )}
              <div className="p-4 bg-white">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${currentTypeMeta.tag}`}>
                  {currentTypeMeta.emoji} {currentTypeMeta.label}
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-2">{title || 'Ten khuyen mai'}</h4>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 min-h-[2rem] font-medium">
                  {content || 'Noi dung ngan se hien thi o day...'}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-dashed border-slate-200">
                  <span className="text-xl font-black text-red-600">{previewDiscountText}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                    {code ? code : 'Auto'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-4 font-bold uppercase tracking-wider">Click ben ngoai de dong</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}