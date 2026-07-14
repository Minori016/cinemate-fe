import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { concessionService, CONCESSION_ITEM_TYPES, ITEM_TYPE_EMOJIS } from '../../../services/concessionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, CheckCircle, AlertCircle, Sparkles, Upload, X, ImagePlus, Tag, Type, FileText, DollarSign, ToggleRight, Save, Eye, EyeOff, RefreshCw, Trash2, Image as ImageIcon, Hash, Quote, Star, Plus, Minus } from 'lucide-react'
import { motion } from 'motion/react'

const MAX_IMAGE_SIZE_MB = 2
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

const ITEM_TYPE_META = {
  food: { label: 'Ddo an', emoji: '🍔', color: 'from-amber-500 to-orange-500', tag: 'bg-amber-500 text-white' },
  drink: { label: 'Do uong', emoji: '🥤', color: 'from-blue-500 to-cyan-500', tag: 'bg-blue-500 text-white' },
  combo: { label: 'Combo', emoji: '🍿', color: 'from-rose-500 to-pink-500', tag: 'bg-rose-500 text-white' },
}

function CategoryIllustration({ type }) {
  const emoji = ITEM_TYPE_META[type]?.emoji || '🎬'
  return <div className="text-7xl md:text-8xl select-none">{emoji}</div>
}

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}


export default function ConcessionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [itemType, setItemType] = useState('combo')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [previewLive, setPreviewLive] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const dragCounter = useRef(0)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (isEdit) {
      concessionService.getById(id)
        .then(res => {
          const item = res.data?.result || res.data
          if (item) {
            setName(item.name || '')
            setDescription(item.description || '')
            setPrice(item.price ?? '')
            setItemType(item.itemType || 'combo')
            setImageUrl(item.imageUrl || '')
            setIsActive(item.isActive !== false)
          }
        })
        .catch(err => {
          console.error('Khong tim thay san pham:', err)
          showToast('Khong the tai du lieu san pham.', 'danger')
        })
    }
  }, [id, isEdit])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setUploadError('')
    if (!file) return
    processFile(file)
  }

  const processFile = (file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Dinh dang anh khong hop le. Chi chap nhan JPG, PNG, WEBP, GIF.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      setUploadError(`Kich thuoc anh vuot qua ${MAX_IMAGE_SIZE_MB}MB. Vui long chon anh nho hon.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (typeof dataUrl === 'string') setImageUrl(dataUrl)
    }
    reader.onerror = () => setUploadError('Khong the doc file anh. Vui long thu lai.')
    reader.readAsDataURL(file)
  }

  const handleDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }
  const handleDragOver = (e) => {
    e.preventDefault(); e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    setUploadError('')
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemoveUploadedImage = () => {
    setImageUrl('')
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Ten san pham khong duoc bo trong.'
    if (price === '') {
      newErrors.price = 'Gia ban khong duoc bo trong.'
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = 'Gia ban phai la so hop le tu 0d.'
    }
    if (!itemType) newErrors.itemType = 'Phai chon phan loai san pham.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      itemType,
      imageUrl: imageUrl.trim() || ITEM_TYPE_EMOJIS[itemType],
      isActive
    }

    try {
      if (isEdit) {
        await concessionService.update(id, payload)
        showToast('Cap nhat san pham thanh cong!')
      } else {
        await concessionService.create(payload)
        showToast('Them san pham moi thanh cong!')
      }
      setTimeout(() => navigate('/admin/concessions'), 1000)
    } catch (err) {
      console.error('Loi khi luu san pham:', err)
      const errorMsg = err.response?.data?.message || 'Co loi xay ra khi luu du lieu.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentTypeMeta = ITEM_TYPE_META[itemType] || ITEM_TYPE_META.combo
  const hasImage = typeof imageUrl === 'string' && imageUrl.startsWith('data:image')
  const formattedPrice = price && !isNaN(Number(price))
    ? new Intl.NumberFormat('vi-VN').format(Number(price)) + ' d'
    : '—'

  return (
    <div className="text-left space-y-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2 text-sm max-w-sm font-bold ${
            toast.type === 'danger'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative">
          <TicketStrip count={20} />
        </div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/admin/concessions')}
                className="group relative w-12 h-12 bg-slate-900 hover:bg-red-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:shadow-red-500/30 hover:scale-105"
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
                    {currentTypeMeta.emoji} {currentTypeMeta.label}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  {isEdit ? (
                    <>Chinh sua<br /><span className="text-red-600">san pham</span></>
                  ) : (
                    <>Them mon<br /><span className="text-red-600">moi vao menu</span></>
                  )}
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  {isEdit
                    ? 'Cap nhat thong tin san pham - gia ban, hinh anh, mo ta hoac trang thai hoat dong.'
                    : 'Thiet lap thong tin cho mot san pham moi: ten mon, phan loai, gia ban va hinh anh poster.'}
                </p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-lg">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Hash size={11} />
                  Item ID
                </div>
                <div className="text-xl font-black font-mono tracking-tight">
                  #{String(Date.now()).slice(-6)}
                </div>
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
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 01 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">01</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-amber-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Thong tin co ban</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Ten mon, mo ta va danh muc phan loai</p>
                </div>
                <Type size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5 bg-white">
              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <Quote size={11} strokeWidth={2.5} />
                  Ten mon an / Combo <span className="text-red-600">*</span>
                </label>
                <Input
                  placeholder="VD: Combo Couple (1 Bap lon + 2 Nuoc ngot)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
              </div>

              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <FileText size={11} strokeWidth={2.5} />
                  Mo ta chi tiet
                </label>
                <textarea
                  placeholder="Mo ta thanh phan, vi bap hoac dung tich coc nuoc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-amber-50 resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <DollarSign size={11} strokeWidth={2.5} />
                    Gia ban (VND) <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 75000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    error={errors.price}
                  />
                  {price && !errors.price && !isNaN(Number(price)) && Number(price) >= 0 && (
                    <div className="mt-2 px-3 py-1.5 bg-emerald-100 border-2 border-emerald-600 rounded-lg inline-flex items-center gap-1.5">
                      <Sparkles size={11} className="text-emerald-700" />
                      <span className="text-[11px] text-emerald-800 font-black">= {formattedPrice}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                    <Tag size={11} strokeWidth={2.5} />
                    Phan loai <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full bg-amber-50/50 border-2 border-slate-200 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 transition-all focus:border-slate-900 focus:bg-amber-50 h-[46px] font-bold cursor-pointer"
                  >
                    {Object.entries(ITEM_TYPE_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.emoji} {meta.label}
                      </option>
                    ))}
                  </select>
                  {errors.itemType && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.itemType}</span>}
                </div>
              </div>
            </div>
          </motion.div>
          {/* SECTION 02 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">02</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-emerald-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Trang thai kinh doanh</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Quyet dinh khach hang co the mua san pham nay</p>
                </div>
                <ToggleRight size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white">
              <label className="flex items-center justify-between gap-4 cursor-pointer p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border-2 border-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Cho phep ban san pham</span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {isActive ? '✓ Dang hoat dong - khach hang co the mua ngay' : '✕ Tam an - khong hien thi tren menu'}
                  </p>
                </div>
                <div className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 border-2 border-slate-900 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <motion.div
                    animate={{ x: isActive ? 24 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                  />
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only"
                  />
                </div>
              </label>

              <div className="mt-5 flex items-center justify-between p-4 bg-slate-900 rounded-2xl">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-300 mb-0.5">
                    Con hang (uoc tinh)
                  </div>
                  <div className="text-xs text-amber-100/60 font-medium">
                    So luong hien thi tai quay
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(0, quantity - 1))}
                    className="w-9 h-9 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <div className="w-12 h-9 bg-white rounded-lg flex items-center justify-center text-slate-900 font-black text-lg">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 03 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">03</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-rose-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Poster san pham</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Hien thi tren menu khach hang</p>
                </div>
                <ImagePlus size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="p-5 bg-white">
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-all border-2 border-dashed group ${
                  isDragging
                    ? 'border-rose-600 bg-rose-100 scale-[1.02] shadow-[8px_8px_0px_0px_rgba(225,29,72,1)]'
                    : hasImage
                    ? 'border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]'
                    : 'border-slate-300 bg-amber-50/40 hover:border-slate-900 hover:bg-amber-50 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]'
                }`}
              >
                {!hasImage && !isDragging && (
                  <>
                    <div className="absolute top-3 left-3 px-2 py-1 bg-slate-900 text-amber-300 rounded text-[9px] font-black uppercase tracking-wider">
                      4:3
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 bg-red-600 text-white rounded text-[9px] font-black uppercase tracking-wider">
                      ≤{MAX_IMAGE_SIZE_MB}MB
                    </div>
                  </>
                )}

                {!hasImage && !isDragging && (
                  <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                )}
                {hasImage ? (
                  <>
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                        className="w-9 h-9 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 hover:bg-amber-400 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                        title="Doi anh"
                      >
                        <RefreshCw size={14} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveUploadedImage() }}
                        className="w-9 h-9 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                        title="Xoa anh"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-emerald-500 border-2 border-slate-900 rounded-lg flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                      <CheckCircle size={12} className="text-white" strokeWidth={3} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-white">Da upload</span>
                    </div>
                  </>
                ) : isDragging ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 rounded-2xl bg-red-600 border-2 border-slate-900 flex items-center justify-center mb-4 rotate-12 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                      <Upload size={36} className="text-white" strokeWidth={3} />
                    </div>
                    <p className="text-base font-black text-slate-900 uppercase tracking-wider">Tha vao day</p>
                    <p className="text-xs text-rose-700 mt-1 font-bold">Upload ngay lap tuc</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full px-6 gap-4 relative">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-300 rounded-3xl rotate-6 border-2 border-slate-900" />
                      <div className="absolute inset-0 bg-rose-300 rounded-3xl -rotate-3 border-2 border-slate-900" />
                      <div className="relative w-32 h-32 bg-white rounded-3xl border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                        <CategoryIllustration type={itemType} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-black text-slate-900 uppercase tracking-wide">Keo anh vao day</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['JPG', 'PNG', 'WEBP', 'GIF'].map((fmt, idx) => (
                        <span
                          key={fmt}
                          className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border-2 border-slate-900 rounded ${
                            idx === 0 ? 'bg-amber-300 text-slate-900' : 'bg-white text-slate-900'
                          }`}
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 px-3.5 py-2.5 bg-rose-100 border-2 border-rose-600 rounded-xl flex items-start gap-2.5"
                >
                  <AlertCircle size={14} className="text-rose-700 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-[11px] text-rose-900 leading-relaxed font-bold">{uploadError}</p>
                </motion.div>
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
              onClick={() => navigate('/admin/concessions')}
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
              {isSubmitting ? (
                'Dang luu...'
              ) : (
                <>
                  <Save size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={2.5} />
                  {isEdit ? 'Cap nhat' : 'Them moi'}
                </>
              )}
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
            className="bg-white border-2 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(245,158,11,1)]"
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
              <button
                onClick={() => setPreviewLive(false)}
                className="w-9 h-9 bg-slate-100 hover:bg-rose-100 border-2 border-slate-900 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="border-2 border-slate-900 rounded-2xl overflow-hidden bg-white">
              <div className="aspect-square bg-amber-50 flex items-center justify-center relative overflow-hidden">
                {typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) ? (
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <CategoryIllustration type={itemType} />
                )}
                {isActive && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500 border-2 border-slate-900 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    Con hang
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${currentTypeMeta.tag}`}>
                  {currentTypeMeta.emoji} {currentTypeMeta.label}
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-2">{name || 'Ten san pham'}</h4>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 min-h-[2rem] font-medium">
                  {description || 'Mo ta san pham se hien thi o day...'}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-dashed border-slate-200">
                  <span className="text-xl font-black text-red-600">{formattedPrice}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isActive ? '● Dang ban' : '○ Tam an'}
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
