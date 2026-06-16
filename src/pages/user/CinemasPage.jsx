import { MapPin, Phone, Mail } from 'lucide-react'

const CINEMAS = [
  {
    id: 1,
    name: 'CineMate Thủ Đức',
    address: 'Võ Văn Ngân, Bình Thọ, Thủ Đức, TP. Hồ Chí Minh',
    phone: '1900 1234',
    email: 'thuduc@cinemate.vn',
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600'
  },
  {
    id: 2,
    name: 'CineMate Quận 1',
    address: 'Nguyễn Du, Bến Thành, Quận 1, TP. Hồ Chí Minh',
    phone: '1900 1235',
    email: 'q1@cinemate.vn',
    img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600'
  },
  {
    id: 3,
    name: 'CineMate Cầu Giấy',
    address: 'Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    phone: '1900 1236',
    email: 'caugiay@cinemate.vn',
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600'
  }
]

export default function CinemasPage() {
  return (
    <div className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Hệ Thống Rạp Chiếu
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          CineMate sở hữu các phòng chiếu phim hiện đại tích hợp hệ thống âm thanh Dolby Atmos chuẩn quốc tế.
        </p>
      </div>

      {/* Cinemas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CINEMAS.map((cinema) => (
          <div
            key={cinema.id}
            className="rounded-xl overflow-hidden border border-white/8 hover:border-red-500/30 transition-all duration-300 flex flex-col"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
            }}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={cinema.img}
                alt={cinema.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h2 className="text-xl text-white font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {cinema.name}
              </h2>

              <div className="flex flex-col gap-3 text-sm text-[var(--color-on-surface-variant)] mb-6">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{cinema.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={16} className="text-red-500 shrink-0" />
                  <span>{cinema.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={16} className="text-red-500 shrink-0" />
                  <span>{cinema.email}</span>
                </div>
              </div>

              <button
                className="mt-auto py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full text-center"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                  color: 'var(--color-on-primary-container)',
                  fontFamily: 'Montserrat, sans-serif',
                  boxShadow: '0 4px 10px rgba(229,9,20,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                Xem Lịch Chiếu Của Rạp
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
