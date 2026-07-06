import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  LayoutGrid,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Ticket as TicketIcon
} from 'lucide-react'

// Initial bookings matching fallback data
const INITIAL_BOOKINGS = [
  {
    id: 'CM-1718556391',
    movie: 'Dune: Hành Tinh Cát - Phần 2',
    screen: 'Phòng chiếu 3 (IMAX)',
    date: '17/06/2026',
    time: '18:30',
    seats: 'D4, D5',
    customerName: 'Nguyễn Văn Anh',
    phone: '0912345678',
    email: 'vananh@gmail.com',
    price: 120000,
    total: 240000,
    convertTickets: 0,
    scoreUsed: 0,
    memberId: 'MEM-889922',
    idCard: '012345678901',
    status: 'Đã thanh toán',
    checkedIn: false,
    checkInTime: null
  },
  {
    id: 'CM-9988112233',
    movie: 'Lật Mặt 7: Một Điều Ước',
    screen: 'Phòng chiếu 1 (Standard)',
    date: '17/06/2026',
    time: '20:15',
    seats: 'H12, H13, H14',
    customerName: 'Trần Thị Bình',
    phone: '0987654321',
    email: 'thibinh@gmail.com',
    price: 110000,
    total: 330000,
    convertTickets: 2,
    scoreUsed: 2000,
    memberId: 'MEM-445511',
    idCard: '023456789012',
    status: 'Đã thanh toán',
    checkedIn: false,
    checkInTime: null
  },
  {
    id: 'CM-5566778899',
    movie: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc',
    screen: 'Phòng chiếu 2 (3D)',
    date: '17/06/2026',
    time: '17:00',
    seats: 'C1, C2',
    customerName: 'Lê Văn Cường',
    phone: '0933445566',
    email: 'vancuong@gmail.com',
    price: 90000,
    total: 180000,
    convertTickets: 1,
    scoreUsed: 1000,
    memberId: 'MEM-332211',
    idCard: '034567890123',
    status: 'Đã thanh toán',
    checkedIn: true,
    checkInTime: '17/06/2026 - 16:48'
  }
]

export default function StaffOverviewPage() {
  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  // Local states loaded from LocalStorage
  const [scannedCount, setScannedCount] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    const savedScanned = localStorage.getItem('staff_scanned_count')
    setScannedCount(savedScanned ? parseInt(savedScanned, 10) : 128)

    const savedRevenue = localStorage.getItem('staff_revenue')
    setRevenue(savedRevenue ? parseInt(savedRevenue, 10) : 3450000)

    const savedBookings = localStorage.getItem('staff_bookings_db')
    setBookings(savedBookings ? JSON.parse(savedBookings) : INITIAL_BOOKINGS)
  }, [])

  const pendingCheckins = bookings.filter(b => !b.checkedIn).length

  // Today's movie showtimes
  const showtimes = [
    { id: 1, title: 'Dune: Hành Tinh Cát - Phần 2', room: 'Phòng 3 (IMAX)', time: '18:30', booked: 48, total: 60, image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60' },
    { id: 2, title: 'Inside Out 2: Mảnh Ghép Cảm Xúc', room: 'Phòng 2 (3D)', time: '17:00', booked: 72, total: 80, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60' },
    { id: 3, title: 'Lật Mặt 7: Một Điều Ước', room: 'Phòng 1 (Standard)', time: '20:15', booked: 50, total: 80, image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=60' },
    { id: 4, title: 'Furiosa: Mad Max Saga', room: 'Phòng 4 (Dolby Atmos)', time: '21:30', booked: 15, total: 60, image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60' }
  ]

  return (
    <motion.div
      className="space-y-8 text-left"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Tổng quan ca làm việc
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Theo dõi các chỉ số hoạt động soát vé và bán hàng trong ca hiện tại của bạn.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <TicketIcon size={120} />
          </div>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Vé đã soát (Check-in)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-white" style={{ fontFamily: 'Montserrat' }}>
              {scannedCount}
            </span>
            <span className="text-xs text-green-500 font-semibold">Khách hàng</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg w-fit">
            <AlertCircle size={14} />
            <span>Còn {pendingCheckins} vé chờ quét trong danh sách</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <DollarSign size={120} />
          </div>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Doanh thu bắp nước tại quầy
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-[var(--color-primary-container)]" style={{ fontFamily: 'Montserrat' }}>
              {formatVND(revenue)}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg w-fit">
            <CheckCircle size={14} />
            <span>Ghi nhận tức thời khi thanh toán</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Calendar size={120} />
          </div>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Suất chiếu hoạt động
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-white" style={{ fontFamily: 'Montserrat' }}>
              {showtimes.length}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">Suất chiếu hôm nay</span>
          </div>
          <div className="mt-4 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-3 flex justify-between">
            <span>Tỉ lệ lấp đầy bình quân:</span>
            <span className="text-white font-semibold">
              {Math.round((showtimes.reduce((acc, curr) => acc + curr.booked, 0) / showtimes.reduce((acc, curr) => acc + curr.total, 0)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Showtimes Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Tình trạng suất chiếu hôm nay
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showtimes.map((st) => {
            const pct = Math.round((st.booked / st.total) * 100)
            return (
              <div
                key={st.id}
                className="flex rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-lg hover:border-red-500/20 transition-all duration-200"
              >
                <div className="w-24 relative shrink-0">
                  <img src={st.image} alt={st.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--color-surface)] opacity-70" />
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="text-base font-bold text-white truncate" title={st.title}>
                      {st.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)] mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {st.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {st.room}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--color-text-muted)]">Số ghế đã đặt:</span>
                      <span className="text-white">{st.booked} / {st.total} ({pct}%)</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
