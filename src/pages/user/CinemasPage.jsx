import { MapPin, Phone, Mail, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

const CINEMAS = [
  {
    id: 1,
    name: 'CineMate Quận 1',
    badge: 'CHI NHÁNH TỔNG',
    address: '135 Đồng Khởi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '1900 1234',
    email: 'q1@cinemate.vn',
    rooms: 10,
    screens: ['2D', '3D', 'IMAX', '4DX'],
    img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=700',
  },
  {
    id: 2,
    name: 'CineMate Bình Thạnh',
    badge: null,
    address: '156 Xô Viết Nghệ Tĩnh, P.26, Q. Bình Thạnh, TP. Hồ Chí Minh',
    phone: '1900 1235',
    email: 'binhthanh@cinemate.vn',
    rooms: 8,
    screens: ['2D', '3D', '4DX'],
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=700',
  },
  {
    id: 3,
    name: 'CineMate Gò Vấp',
    badge: null,
    address: '12 Quang Trung, P.10, Q. Gò Vấp, TP. Hồ Chí Minh',
    phone: '1900 1236',
    email: 'govap@cinemate.vn',
    rooms: 6,
    screens: ['2D', '3D'],
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=700',
  },
  {
    id: 4,
    name: 'CineMate Thủ Đức',
    badge: null,
    address: 'Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '1900 1237',
    email: 'thuduc@cinemate.vn',
    rooms: 7,
    screens: ['2D', '3D', 'IMAX'],
    img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=700',
  },
]

export default function CinemasPage() {
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
        className="text-center mb-12"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Hệ thống</p>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Hệ Thống Rạp Chiếu
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          CineMate sở hữu 4 rạp chiếu phim hiện đại tại TP. Hồ Chí Minh — tích hợp công nghệ IMAX, Dolby Atmos và 4DX chuẩn quốc tế.
        </p>
      </motion.div>

      {/* Map + List layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col gap-4"
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(229,9,20,0.25)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
              aspectRatio: '4/3',
            }}
          >
            <iframe
              title="Bản đồ TP. Hồ Chí Minh"
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.4500%2C10.5800%2C106.9000%2C10.9500&layer=mapnik&marker=10.7757%2C106.7004"
              className="w-full h-full"
              style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) saturate(1.3)', border: 'none' }}
              loading="lazy"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,5,5,0.4) 0%, transparent 20%, transparent 80%, rgba(10,5,5,0.55) 100%)' }} />
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(10,5,5,0.85)', border: '1px solid rgba(229,9,20,0.35)' }}>
              <MapPin size={13} className="text-red-500" />
              <span className="text-white text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>TP. Hồ Chí Minh</span>
            </div>
            <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
              {CINEMAS.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.badge ? '#d97706' : '#e50914' }} />
                  <span className="text-[10px] font-semibold text-white/75" style={{ fontFamily: 'Inter, sans-serif' }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
            Chi nhánh tổng tại Quận 1 — 4 rạp phủ rộng khắp TP. Hồ Chí Minh
          </p>
        </motion.div>

        {/* Quick list */}
        <motion.div
          className="flex flex-col gap-3 justify-center"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } } }}
        >
          {CINEMAS.map(cinema => (
            <motion.div
              key={cinema.id}
              className="flex gap-4 rounded-2xl overflow-hidden p-4"
              variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              style={{
                background: cinema.badge ? 'linear-gradient(135deg, rgba(25,15,5,0.9), rgba(35,18,5,0.9))' : 'rgba(255,255,255,0.04)',
                border: cinema.badge ? '1px solid rgba(217,119,6,0.4)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="relative flex-shrink-0 w-24 rounded-xl overflow-hidden">
                <img src={cinema.img} alt={cinema.name} className="w-full h-full object-cover" style={{ filter: 'brightness(0.65)' }} />
                <div className="absolute inset-0 flex flex-col justify-end p-1 gap-1">
                  <div className="flex flex-wrap gap-1">
                    {cinema.screens.slice(0, 2).map(s => (
                      <span key={s} className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{cinema.name}</h3>
                  {cinema.badge && <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#d97706' }}>{cinema.badge}</span>}
                </div>
                <div className="flex items-start gap-1.5 mb-1">
                  <MapPin size={11} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>{cinema.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={11} className="text-red-500 shrink-0" />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>{cinema.phone}</span>
                  <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>{cinema.rooms} phòng</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Full Cards Grid */}
      <motion.h2
        className="text-2xl font-black uppercase text-white mb-8"
        style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '1px' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Chi Tiết Từng Rạp
      </motion.h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {CINEMAS.map((cinema) => (
          <motion.div
            key={cinema.id}
            className="group rounded-2xl overflow-hidden border flex flex-col"
            variants={{ hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
            whileHover={{ y: -6, transition: { duration: 0.22 } }}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
              borderColor: cinema.badge ? 'rgba(217,119,6,0.35)' : 'rgba(255,255,255,0.08)',
              boxShadow: cinema.badge ? '0 4px 24px rgba(217,119,6,0.12)' : '0 4px 20px rgba(0,0,0,0.35)',
            }}
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={cinema.img} alt={cinema.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              {cinema.badge && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-white shadow-lg" style={{ backgroundColor: '#d97706' }}>
                  {cinema.badge}
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex gap-1">
                {cinema.screens.map(s => (
                  <span key={s} className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>{s}</span>
                ))}
              </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <h2 className="text-base text-white font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {cinema.name}
              </h2>
              <div className="flex flex-col gap-2 text-sm text-[var(--color-on-surface-variant)] mb-5 flex-1">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="text-xs leading-relaxed">{cinema.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-red-500 shrink-0" />
                  <span className="text-xs">{cinema.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-red-500 shrink-0" />
                  <span className="text-xs">{cinema.email}</span>
                </div>
              </div>

              <Link
                to="/showtimes"
                className="flex items-center justify-center gap-2 mt-auto py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full text-center text-white"
                style={{
                  background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                  fontFamily: 'Montserrat, sans-serif',
                  boxShadow: '0 4px 10px rgba(229,9,20,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <Ticket size={13} /> Xem Lịch Chiếu
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
