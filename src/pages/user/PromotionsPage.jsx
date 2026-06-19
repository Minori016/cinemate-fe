import { useState, useEffect } from 'react'
import { Calendar, Tag, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { promotionService } from '../../services/promotionService'

const PROMO_IMAGES = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600'
]

const COMBOS = [
  {
    id: 1,
    name: 'Combo Solo',
    desc: '1 bắp ngọt lớn 60oz + 1 nước ngọt lớn 22oz (Coca-Cola/Sprite/Fanta) tự chọn vị.',
    price: '75.000đ',
    img: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=600'
  },
  {
    id: 2,
    name: 'Combo Couple',
    desc: '1 bắp ngọt lớn 60oz + 2 nước ngọt lớn 22oz (Coca-Cola/Sprite/Fanta) chia sẻ niềm vui.',
    price: '95.000đ',
    img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600'
  },
  {
    id: 3,
    name: 'Combo Party',
    desc: '2 bắp ngọt lớn 60oz (tự chọn vị bơ/phô mai/caramel) + 4 nước ngọt lớn 22oz cực đã.',
    price: '165.000đ',
    img: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=600'
  }
]

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    promotionService.getAll()
      .then(res => {
        const data = res.data?.result || res.data || []
        setPromotions(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Lỗi khi tải khuyến mãi phía user:', err)
      })
      .finally(() => {
        setLoading(false)
      })
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
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Chương trình</p>
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
      ) : promotions.length === 0 ? (
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
          {promotions.map((promo, i) => (
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
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={PROMO_IMAGES[i % PROMO_IMAGES.length]}
                  alt={promo.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded flex items-center gap-1 shadow-md">
                  <Tag size={10} />
                  <span>HOT</span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-lg text-white font-bold mb-3 line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif' }} title={promo.title}>
                  {promo.title}
                </h2>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-5 leading-relaxed line-clamp-3" title={promo.description}>
                  {promo.content}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-red-400 font-medium">
                  <Calendar size={14} />
                  <span>Từ {formatDate(promo.startTime)} đến {formatDate(promo.endTime)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Combos Section Title */}
      <motion.div
        className="text-center mt-20 mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Bắp & Nước</p>
        <h2 className="text-3xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Combo Bắp Nước Tiết Kiệm
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          Ăn bắp xem phim mới chuẩn gu! Mua theo combo tiết kiệm đến 20% so với mua lẻ tại quầy.
        </p>
      </motion.div>

      {/* Combos Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        {COMBOS.map((combo) => (
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
            <div className="relative aspect-video overflow-hidden">
              <img
                src={combo.img}
                alt={combo.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded flex items-center gap-1 shadow-md">
                <Sparkles size={10} />
                <span>POPULAR</span>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-3 gap-2">
                <h2 className="text-lg text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {combo.name}
                </h2>
                <span className="text-lg font-black text-red-500 font-mono whitespace-nowrap">{combo.price}</span>
              </div>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-5 leading-relaxed">
                {combo.desc}
              </p>

              <button className="w-full mt-auto bg-white/5 border border-white/10 text-white font-bold py-2.5 rounded-xl hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] active:scale-[0.98] transition-all text-xs uppercase tracking-wider cursor-pointer">
                Mua Kèm Khi Đặt Vé
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
