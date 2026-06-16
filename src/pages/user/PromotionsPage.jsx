import { Calendar, Tag } from 'lucide-react'

const PROMOTIONS = [
  {
    id: 1,
    title: 'Happy Monday - Đồng Giá Vé 45K',
    desc: 'Ưu đãi đồng giá vé 2D chỉ 45K cho mọi thành viên vào mỗi ngày Thứ Hai hàng tuần.',
    date: 'Áp dụng vào mỗi Thứ 2',
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600'
  },
  {
    id: 2,
    title: 'Mừng Khai Trương CineMate Thủ Đức',
    desc: 'Giảm giá 50% bắp nước khi mua kèm 2 vé xem phim bất kỳ tại chi nhánh Thủ Đức.',
    date: 'Đến hết ngày 30/06/2026',
    img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600'
  },
  {
    id: 3,
    title: 'Hội Viên Vàng - Quà Tặng Sang',
    desc: 'Tích lũy điểm thành viên gấp đôi và nhận thêm bắp nước miễn phí vào tháng sinh nhật.',
    date: 'Chương trình thường niên',
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600'
  }
]

export default function PromotionsPage() {
  return (
    <div className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Khuyến Mãi & Ưu Đãi
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          Nhận ngay các chương trình ưu đãi vé xem phim và bắp nước cực kì hấp dẫn dành riêng cho hội viên CineMate.
        </p>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROMOTIONS.map((promo) => (
          <div
            key={promo.id}
            className="rounded-xl overflow-hidden border border-white/8 hover:border-red-500/30 transition-all duration-300 flex flex-col"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
            }}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={promo.img}
                alt={promo.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded flex items-center gap-1 shadow-md">
                <Tag size={10} />
                <span>HOT</span>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h2 className="text-lg text-white font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {promo.title}
              </h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-5 leading-relaxed">
                {promo.desc}
              </p>

              <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-red-400">
                <Calendar size={14} />
                <span>{promo.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
