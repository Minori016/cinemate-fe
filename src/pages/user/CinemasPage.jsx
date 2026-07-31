import { MapPin, Phone, Mail, Clock, ShieldCheck, Ticket, Sparkles, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

const MAIN_CINEMA = {
  id: 1,
  name: 'CineMate Cinema',
  badge: 'TRỤ SỞ CHÍNH',
  address: '135 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  phone: '1900 1234',
  email: 'contact@cinemate.vn',
  hours: '08:00 - 00:00 (Hàng ngày)',
  rooms: 10,
  screens: ['2D', '3D', 'IMAX', '4DX'],
  img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000',
  googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=135+Đồng+Khởi+Quận+1+TP+Hồ+Chí+Minh'
}

export default function CinemasPage() {
  return (
    <motion.div
      className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          ĐỊA ĐIỂM XEM PHIM
        </p>
        <h1 className="text-3xl md:text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Rạp Chiếu CineMate
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-xl mx-auto leading-relaxed">
          Tọa lạc tại trung tâm Quận 1, TP. Hồ Chí Minh — Rạp chiếu phim chuẩn quốc tế tích hợp công nghệ trình chiếu IMAX 3D, Dolby Atmos & 4DX chân thực.
        </p>
      </motion.div>

      {/* Main Content Layout: Map + Cinema Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-stretch">
        
        {/* Left Column: Interactive Map Embed (7 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 flex flex-col gap-3"
        >
          <div
            className="relative rounded-2xl overflow-hidden h-full min-h-[380px]"
            style={{
              border: '1px solid rgba(229,9,20,0.3)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            }}
          >
            <iframe
              title="Bản đồ CineMate Quận 1"
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.6900%2C10.7700%2C106.7100%2C10.7850&layer=mapnik&marker=10.7757%2C106.7004"
              className="w-full h-full min-h-[380px]"
              style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) saturate(1.3)', border: 'none' }}
              loading="lazy"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,5,5,0.3) 0%, transparent 30%, transparent 70%, rgba(10,5,5,0.6) 100%)' }} />
            
            {/* Top location badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md" style={{ backgroundColor: 'rgba(10,5,5,0.85)', border: '1px solid rgba(229,9,20,0.4)' }}>
              <MapPin size={14} className="text-red-500 animate-pulse" />
              <span className="text-white text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                135 Đồng Khởi, Q.1, TP. Hồ Chí Minh
              </span>
            </div>

            {/* Bottom direction button */}
            <div className="absolute bottom-4 right-4">
              <a
                href={MAIN_CINEMA.googleMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg hover:scale-105"
              >
                <Navigation size={13} /> Chỉ đường trên Google Maps
              </a>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 font-medium">
            📍 Vị trí đắc địa ngay trung tâm Quận 1 — Dễ dàng di chuyển & bãi đỗ xe rộng rãi
          </p>
        </motion.div>

        {/* Right Column: Cinema Details Card (5 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 flex flex-col"
        >
          <div 
            className="rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full relative overflow-hidden text-left"
            style={{
              background: 'linear-gradient(145deg, rgba(22, 24, 35, 0.95) 0%, rgba(12, 14, 22, 0.98) 100%)',
              border: '1px solid rgba(229,9,20,0.3)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Background image preview */}
            <div className="absolute top-0 right-0 w-full h-36 opacity-15 pointer-events-none overflow-hidden">
              <img src={MAIN_CINEMA.img} alt="" className="w-full h-full object-cover blur-sm" />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                  {MAIN_CINEMA.badge}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={14} /> Mở cửa hôm nay
                </span>
              </div>

              <h2 className="text-2xl font-black text-white mb-4 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {MAIN_CINEMA.name}
              </h2>

              {/* Formats Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {MAIN_CINEMA.screens.map((format) => (
                  <span key={format} className="px-3 py-1 rounded-lg text-xs font-black bg-black/60 text-red-400 border border-red-500/30">
                    {format}
                  </span>
                ))}
              </div>

              {/* Info Items */}
              <div className="space-y-4 text-xs text-gray-300 mb-8 border-t border-white/10 pt-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Địa chỉ rạp</p>
                    <p className="font-semibold text-white mt-0.5 leading-relaxed">{MAIN_CINEMA.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Giờ hoạt động</p>
                    <p className="font-semibold text-white mt-0.5">{MAIN_CINEMA.hours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hotline đặt vé</p>
                    <p className="font-semibold text-white mt-0.5">{MAIN_CINEMA.phone} — {MAIN_CINEMA.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Quy mô phòng chiếu</p>
                    <p className="font-semibold text-white mt-0.5">{MAIN_CINEMA.rooms} phòng chiếu hiện đại (IMAX & 4DX)</p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/showtimes"
              className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-center text-white flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                fontFamily: 'Montserrat, sans-serif',
                boxShadow: '0 8px 20px rgba(229,9,20,0.4)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <Ticket size={16} /> Xem Lịch Chiếu & Đặt Vé Ngay
            </Link>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
