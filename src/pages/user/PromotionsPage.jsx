import { useState, useEffect } from 'react'
import { Calendar, Tag, Sparkles, Copy, Check, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import {
  promotionService,
  getDaysRemaining,
  getQuickDiscountText,
  computePromotionStatus,
  mapPromotionForUi,
  PROMOTION_STATUS,
} from '../../services/promotionService'
import { concessionService, FALLBACK_COMBOS } from '../../services/concessionService'

// Ảnh placeholder nếu KM chưa có imageUrl
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600',
]

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [combos, setCombos] = useState(FALLBACK_COMBOS)
  const [combosLoading, setCombosLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    promotionService.getActiveForUi()
      .then(list => {
        if (cancelled) return
        // Nếu active rỗng, thử getAll rồi map (admin có thể tạo chưa ACTIVE)
        if (Array.isArray(list) && list.length > 0) {
          setPromotions(list)
          return
        }
        return promotionService.getAll({ page: 0, size: 50 })
          .then(res => {
            if (cancelled) return
            const data = res.data?.result?.content || res.data?.result || res.data || []
            const arr = Array.isArray(data) ? data : []
            setPromotions(arr.map(mapPromotionForUi))
          })
      })
      .catch(err => {
        console.error('Lỗi khi tải khuyến mãi phía user:', err)
        if (!cancelled) setPromotions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setCombosLoading(true)
    concessionService.getActiveForUi({ fallback: true })
      .then(list => {
        if (!cancelled) setCombos(Array.isArray(list) && list.length > 0 ? list : FALLBACK_COMBOS)
      })
      .finally(() => {
        if (!cancelled) setCombosLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch (e) {
      return ''
    }
  }

  const handleCopy = (code, id) => {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    }).catch(() => {
      // fallback khi clipboard API lỗi
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }

  // Lọc ra KM còn hạn để hiển thị
  const visiblePromotions = promotions.filter(p => {
    const s = computePromotionStatus(p)
    return s === PROMOTION_STATUS.ACTIVE || s === 'ACTIVE' || (s !== PROMOTION_STATUS.EXPIRED && s !== 'EXPIRED' && s !== 'DISABLED')
  })

  return (
    <motion.div
      className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Title */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          Chương trình
        </p>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Khuyến Mãi & Ưu Đãi
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          Nhận ngay các chương trình ưu đãi vé xem phim và bắp nước cực kì hấp dẫn dành riêng cho hội viên CineMate.
        </p>
      </motion.div>

      {/* Promotions Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-red-600">progress_activity</span>
        </div>
      ) : visiblePromotions.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-surface)] border border-white/5 rounded-2xl max-w-xl mx-auto shadow-lg">
          <Tag className="mx-auto text-gray-600 mb-3" size={32} />
          <p className="text-gray-300 font-semibold">Chưa có chương trình khuyến mãi nào được kích hoạt</p>
          <p className="text-xs text-gray-500 mt-1">Vui lòng quay lại sau để cập nhật các ưu đãi mới nhất.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {visiblePromotions.map((promo, i) => {
            const discountText = getQuickDiscountText(promo)
            const daysLeft = getDaysRemaining(promo.endTime)
            const isCopied = copiedId === promo.id

            return (
              <motion.div
                key={promo.id || i}
                className="rounded-xl overflow-hidden border border-white/8 hover:border-red-500/30 transition-all duration-300 flex flex-col"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
                }}
                variants={{ hidden: { opacity: 0, y: 30, scale: 0.96 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
                whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(229,9,20,0.15)', transition: { duration: 0.22 } }}
              >
                {/* Banner image */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={promo.imageUrl || DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]}
                    alt={promo.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => { e.currentTarget.src = DEFAULT_IMAGES[i % DEFAULT_IMAGES.length] }}
                  />

                  {/* Top-left badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                    {promo.code && (
                      <div className="bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded flex items-center gap-1 shadow-md">
                        <Tag size={10} />
                        <span>Voucher</span>
                      </div>
                    )}

                    {discountText && (
                      <div className="bg-black/80 backdrop-blur-sm text-yellow-300 text-[11px] font-black uppercase px-2.5 py-1 rounded shadow-md">
                        {discountText}
                      </div>
                    )}
                  </div>

                  {/* Days remaining */}
                  {daysLeft != null && daysLeft > 0 && daysLeft <= 7 && (
                    <div className="absolute top-3 right-3 bg-orange-600/90 text-white text-[10px] font-extrabold px-2 py-1 rounded shadow-md flex items-center gap-1">
                      <Clock size={10} />
                      Còn {daysLeft} ngày
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-lg text-white font-bold mb-2 line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif' }} title={promo.title}>
                    {promo.title}
                  </h2>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 leading-relaxed line-clamp-3" title={promo.description || promo.detail}>
                    {promo.content || promo.detail || promo.description || 'Ưu đãi đặc biệt từ CineMate.'}
                  </p>

                  {/* Voucher code block */}
                  {promo.code && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-dashed border-yellow-500/40 rounded-lg">
                      <p className="text-[10px] text-yellow-300 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                        <Tag size={10} /> Mã khuyến mãi
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-base font-extrabold text-white tracking-widest font-mono">
                          {promo.code}
                        </code>
                        <button
                          onClick={() => handleCopy(promo.code, promo.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer
                            ${isCopied
                              ? 'bg-green-600 text-white'
                              : 'bg-white/10 text-yellow-300 hover:bg-yellow-500 hover:text-black'}`}
                          aria-label="Sao chép mã"
                        >
                          {isCopied ? <><Check size={12} /> Đã copy</> : <><Copy size={12} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-red-400 font-medium">
                    <Calendar size={14} />
                    <span>Từ {formatDate(promo.startTime)} đến {formatDate(promo.endTime)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Combos Section */}
      <motion.div
        className="text-center mt-20 mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          Bắp & Nước
        </p>
        <h2 className="text-3xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Combo Bắp Nước Tiết Kiệm
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          Ăn bắp xem phim mới chuẩn gu! Mua theo combo tiết kiệm đến 20% so với mua lẻ tại quầy.
        </p>
      </motion.div>

      {combosLoading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
        </div>
      ) : (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        {combos.map((combo) => {
          const hasImg = combo.img && (String(combo.img).startsWith('http') || String(combo.img).startsWith('/') || String(combo.img).startsWith('data:'))
          const priceLabel = typeof combo.price === 'number'
            ? `${Number(combo.price).toLocaleString('vi-VN')}đ`
            : combo.price
          return (
          <motion.div
            key={combo.id}
            className="rounded-xl overflow-hidden border border-white/8 hover:border-red-500/30 transition-all duration-300 flex flex-col"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
            }}
            variants={{ hidden: { opacity: 0, y: 30, scale: 0.96 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(229,9,20,0.15)', transition: { duration: 0.22 } }}
          >
            <div className="relative aspect-video overflow-hidden bg-white/5 flex items-center justify-center">
              {hasImg ? (
                <img src={combo.img} alt={combo.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              ) : (
                <span className="text-5xl select-none">{combo.img || '🍿'}</span>
              )}
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded flex items-center gap-1 shadow-md">
                <Sparkles size={10} />
                <span>{(combo.category || 'combo').toUpperCase()}</span>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-3 gap-2">
                <h2 className="text-lg text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {combo.name}
                </h2>
                <span className="text-lg font-black text-red-500 font-mono whitespace-nowrap">{priceLabel}</span>
              </div>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-5 leading-relaxed">
                {combo.desc}
              </p>
              <button className="w-full mt-auto bg-white/5 border border-white/10 text-white font-bold py-2.5 rounded-xl hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] active:scale-[0.98] transition-all text-xs uppercase tracking-wider cursor-pointer">
                Mua Kèm Khi Đặt Vé
              </button>
            </div>
          </motion.div>
          )
        })}
      </motion.div>
      )}
    </motion.div>
  )
}
