import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { concessionService, CONCESSION_ITEM_TYPES, ITEM_TYPE_EMOJIS } from '../../../services/concessionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, ChefHat, CheckCircle, AlertCircle, Sparkles, Smile, Upload, Loader2, X } from 'lucide-react'

export default function ConcessionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [itemType, setItemType] = useState('combo')
  const [imageUrl, setImageUrl] = useState('') // uploaded URL or emoji
  const [isActive, setIsActive] = useState(true)

  // Upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Pre-fill if editing
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
          console.error('Không tìm thấy sản phẩm:', err)
          showToast('Không thể tải dữ liệu sản phẩm.', 'danger')
        })
    }
  }, [id, isEdit])

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Tên sản phẩm không được bỏ trống.'
    if (price === '') {
      newErrors.price = 'Giá bán không được bỏ trống.'
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = 'Giá bán phải là số hợp lệ từ 0đ.'
    }
    if (!itemType) newErrors.itemType = 'Phải chọn phân loại sản phẩm.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ===== Upload handlers =====
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const isHttpUrl = (s) =>
    typeof s === 'string' && (s.startsWith('http') || s.startsWith('/') || s.startsWith('data:'))

  const validateAndSetFile = (file) => {
    if (!file) return null
    if (!file.type || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showToast('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF).', 'danger')
      return null
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.', 'danger')
      return null
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewSrc(reader.result)
    reader.readAsDataURL(file)
    return file
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const f = validateAndSetFile(file)
      // Tự động upload ngay khi chọn file
      if (f) autoUpload(f)
    }
  }

  // Xử lý dán ảnh từ clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      // Chỉ xử lý paste khi form đang hiển thị
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            const f = validateAndSetFile(file)
            if (f) {
              autoUpload(f)
              showToast('Đã dán ảnh từ clipboard, đang tải lên...')
            }
            return
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Xử lý kéo thả file
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      const f = validateAndSetFile(file)
      if (f) autoUpload(f)
    }
  }

  // Upload tự động (không cần bấm nút)
  const autoUpload = async (file) => {
    setIsUploading(true)
    try {
      const res = await concessionService.uploadImage(file)
      const uploadedUrl = res.data?.result || res.data
      if (!uploadedUrl) {
        throw new Error('Không nhận được URL ảnh từ server.')
      }
      setImageUrl(uploadedUrl)
      showToast('Tải ảnh lên thành công!')
    } catch (err) {
      console.error('Lỗi khi upload ảnh:', err)
      const msg = err.response?.data?.message || 'Tải ảnh lên thất bại. Vui lòng thử lại.'
      showToast(msg, 'danger')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadImage = async () => {
    if (!selectedFile) {
      showToast('Vui lòng chọn một file ảnh trước.', 'danger')
      return
    }
    autoUpload(selectedFile)
  }

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    setPreviewSrc('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClearUploadedImage = () => {
    setImageUrl('')
    setSelectedFile(null)
    setPreviewSrc('')
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        showToast('Cập nhật sản phẩm thành công!')
      } else {
        await concessionService.create(payload)
        showToast('Thêm sản phẩm mới thành công!')
      }
      setTimeout(() => {
        navigate('/admin/concessions')
      }, 1000)
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm:', err)
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            borderColor: toast.type === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
            color: toast.type === 'danger' ? '#ef4444' : '#10b981',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/concessions')}
            className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-red-500/50 hover:text-red-500 rounded-xl transition-all cursor-pointer text-[var(--color-on-surface)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-3xl text-[var(--color-on-surface)] font-extrabold tracking-wider uppercase flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <ChefHat className="text-red-500" size={24} />
              {isEdit ? 'Sửa thông tin sản phẩm' : 'Thêm món ăn/combo mới'}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {isEdit ? 'Cập nhật lại giá bán, hình ảnh hoặc trạng thái hoạt động.' : 'Thiết lập tên món, mô tả, phân loại danh mục và giá thành.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Main form details */}
        <div className="lg:col-span-2 space-y-6 bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 rounded-2xl shadow-xl">
          <h2 className="text-lg font-bold text-gray-500 flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3">
            <Sparkles size={18} className="text-yellow-500" /> Thông tin cơ bản
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">Tên món ăn / Combo *</span>
              <Input
                placeholder="VD: Combo Couple (1 Bắp lớn + 2 Nước ngọt)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
            </div>

            <div>
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">Mô tả chi tiết</span>
              <textarea
                placeholder="Mô tả thành phần, vị bắp hoặc dung tích cốc nước..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-[var(--color-surface-2)] border rounded-xl py-3 px-4 outline-none text-sm text-gray-500 transition-all focus:border-red-500 focus:shadow-[0_0_10px_rgba(229,9,20,0.2)]"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">Giá bán (VNĐ) *</span>
                <Input
                  type="number"
                  placeholder="VD: 75000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={errors.price}
                />
              </div>

              <div>
                <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">Phân loại danh mục *</span>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border rounded-xl py-3 px-4 outline-none text-sm text-gray-500 transition-all focus:border-red-500 focus:shadow-[0_0_10px_rgba(229,9,20,0.2)] h-[46px]"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <option value="food">Đồ ăn (Food)</option>
                  <option value="drink">Đồ uống (Drink)</option>
                  <option value="combo">Combo bắp nước</option>
                </select>
                {errors.itemType && <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.itemType}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Image & status */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <h2 className="text-base font-bold text-gray-500 flex items-center gap-2 self-start mb-4 border-b border-[var(--color-border)] pb-3 w-full">
              <Smile size={18} className="text-blue-500" /> Ảnh minh hoạ
            </h2>

            {/* Preview + Drop zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full aspect-square max-w-[220px] rounded-2xl bg-[var(--color-surface-2)] border-2 border-dashed flex items-center justify-center text-5xl mb-4 select-none overflow-hidden cursor-pointer transition-all
                ${isDragging
                  ? 'border-red-500 bg-red-500/10 scale-105'
                  : 'border-[var(--color-border)] hover:border-red-500/60 hover:bg-[var(--color-surface-2)]/80'}
              `}
              title="Kéo thả ảnh vào đây, click để chọn file, hoặc nhấn Ctrl+V để dán ảnh"
            >
              {previewSrc ? (
                <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
              ) : imageUrl && isHttpUrl(imageUrl) ? (
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                  <Upload size={36} className="opacity-50" />
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">Kéo ảnh vào đây</span>
                </div>
              )}

              {/* Overlay khi đang upload */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                  <Loader2 size={32} className="text-red-500 animate-spin" />
                  <span className="text-xs text-gray-500 font-semibold">Đang tải lên...</span>
                </div>
              )}

              {/* Hint khi kéo thả */}
              {isDragging && !isUploading && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-500 font-bold text-sm">Thả ảnh vào đây!</span>
                </div>
              )}
            </div>

            {/* File picker (ẩn - click vào drop zone để mở) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile && !isUploading && (
              <div className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveSelectedFile() }}
                  className="p-1.5 text-gray-500 hover:text-red-400 cursor-pointer"
                  title="Bỏ chọn file"
                >
                  <X size={14} />
                </button>
              </div>
            )}

          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl">
            <h2 className="text-base font-bold text-gray-500 flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3 w-full">
              Trạng thái kinh doanh
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Cho phép bán</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Khách và nhân viên có thể nhìn thấy sản phẩm này</p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-red-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/concessions')}
              className="flex-1 py-3"
              type="button"
            >
              Hủy bỏ
            </Button>
            <Button
              className="flex-1 py-3"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
