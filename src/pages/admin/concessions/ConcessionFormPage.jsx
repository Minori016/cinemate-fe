import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { concessionService, CONCESSION_ITEM_TYPES, ITEM_TYPE_EMOJIS } from '../../../services/concessionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, ChefHat, CheckCircle, AlertCircle, Sparkles, Smile } from 'lucide-react'
import { motion } from 'motion/react'

export default function ConcessionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [itemType, setItemType] = useState('combo')
  const [imageUrl, setImageUrl] = useState('') // emoji or image url
  const [isActive, setIsActive] = useState(true)

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
            className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-red-500/50 hover:text-red-500 rounded-xl transition-all cursor-pointer"
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
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3">
            <Sparkles size={18} className="text-yellow-500" /> Thông tin cơ bản
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase block mb-2">Tên món ăn / Combo *</span>
              <Input
                placeholder="VD: Combo Couple (1 Bắp lớn + 2 Nước ngọt)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
            </div>

            <div>
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase block mb-2">Mô tả chi tiết</span>
              <textarea
                placeholder="Mô tả thành phần, vị bắp hoặc dung tích cốc nước..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-[var(--color-surface-2)] border rounded-xl py-3 px-4 outline-none text-sm text-white transition-all focus:border-red-500 focus:shadow-[0_0_10px_rgba(229,9,20,0.2)]"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase block mb-2">Giá bán (VNĐ) *</span>
                <Input
                  type="number"
                  placeholder="VD: 75000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={errors.price}
                />
              </div>

              <div>
                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase block mb-2">Phân loại danh mục *</span>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full bg-[var(--color-surface-2)] border rounded-xl py-3 px-4 outline-none text-sm text-white transition-all focus:border-red-500 focus:shadow-[0_0_10px_rgba(229,9,20,0.2)] h-[46px]"
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
            <h2 className="text-base font-bold text-white flex items-center gap-2 self-start mb-4 border-b border-[var(--color-border)] pb-3 w-full">
              <Smile size={18} className="text-blue-500" /> Icon hiển thị
            </h2>
            
            <div className="w-24 h-24 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-5xl mb-4 select-none overflow-hidden">
              {imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:'))
                ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                : (imageUrl || ITEM_TYPE_EMOJIS[itemType] || '🍿')
              }
            </div>

            <div className="w-full">
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase block mb-2">Emoji hiển thị hoặc URL ảnh</span>
              <Input
                placeholder="Nhập 1 Emoji (🍿, 🥤, 🌭) hoặc URL hình ảnh"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Để trống hệ thống sẽ tự động dùng icon mặc định của danh mục đó.
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3 w-full">
              Trạng thái kinh doanh
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Cho phép bán</p>
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
