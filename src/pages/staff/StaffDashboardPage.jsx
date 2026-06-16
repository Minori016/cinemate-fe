import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  Ticket as TicketIcon,
  X,
  CreditCard,
  ChefHat
} from 'lucide-react'

// Mock concession items
const CONCESSION_ITEMS = [
  { id: 'p1', name: 'Bắp rang Single', desc: '1 Bắp lớn (Ngọt/Mặn)', price: 65000, category: 'food', image: '🍿' },
  { id: 'p2', name: 'Bắp rang Double', desc: '1 Bắp lớn vị tự chọn (Phô mai/Caramel)', price: 75000, category: 'food', image: '🍿' },
  { id: 'd1', name: 'Nước ngọt Coca-Cola', desc: 'Ly lớn 32oz lạnh', price: 35000, category: 'drink', image: '🥤' },
  { id: 'd2', name: 'Nước ngọt Sprite', desc: 'Ly lớn 32oz lạnh', price: 35000, category: 'drink', image: '🥤' },
  { id: 'c1', name: 'Combo Solo', desc: '1 Bắp lớn + 1 Nước ngọt tùy chọn', price: 90000, category: 'combo', image: '🎒' },
  { id: 'c2', name: 'Combo Couple', desc: '1 Bắp lớn + 2 Nước ngọt tùy chọn', price: 125000, category: 'combo', image: '🧑‍🤝‍🧑' },
  { id: 'c3', name: 'Combo Party VIP', desc: '2 Bắp lớn + 3 Nước ngọt + 1 Khoai tây chiên', price: 210000, category: 'combo', image: '🎉' }
]

// Seed initial mock bookings if not present
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

export default function StaffDashboardPage() {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  // Persisted Stats and Mock Database
  const [scannedCount, setScannedCount] = useState(() => {
    const saved = localStorage.getItem('staff_scanned_count')
    return saved ? parseInt(saved, 10) : 128
  })

  const [revenue, setRevenue] = useState(() => {
    const saved = localStorage.getItem('staff_revenue')
    return saved ? parseInt(saved, 10) : 3450000
  })

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('staff_bookings_db')
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS
  })

  // Toast / Status Message Alert
  const [toast, setToast] = useState(null)

  // Save states back to localStorage
  useEffect(() => {
    localStorage.setItem('staff_scanned_count', scannedCount.toString())
  }, [scannedCount])

  useEffect(() => {
    localStorage.setItem('staff_revenue', revenue.toString())
  }, [revenue])

  useEffect(() => {
    localStorage.setItem('staff_bookings_db', JSON.stringify(bookings))
  }, [bookings])

  // Helpers to display Toast
  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up`}
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="shrink-0" size={20} />
          ) : (
            <AlertCircle className="shrink-0" size={20} />
          )}
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <OverviewSection
          scannedCount={scannedCount}
          revenue={revenue}
          bookings={bookings}
        />
      )}

      {/* Ticket Verifier Tab Content */}
      {activeTab === 'tickets' && (
        <TicketVerifierSection
          bookings={bookings}
          setBookings={setBookings}
          scannedCount={scannedCount}
          setScannedCount={setScannedCount}
          triggerToast={triggerToast}
        />
      )}

      {/* Concession Counter Tab Content */}
      {activeTab === 'concessions' && (
        <ConcessionCounterSection
          revenue={revenue}
          setRevenue={setRevenue}
          triggerToast={triggerToast}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: OVERVIEW & SHOWTIMES
// ──────────────────────────────────────────────────────────────────────────
function OverviewSection({ scannedCount, revenue, bookings }) {
  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  // Calculate some simple insights
  const pendingCheckins = bookings.filter(b => !b.checkedIn).length

  // Today's movie showtimes
  const showtimes = [
    { id: 1, title: 'Dune: Hành Tinh Cát - Phần 2', room: 'Phòng 3 (IMAX)', time: '18:30', booked: 48, total: 60, image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60' },
    { id: 2, title: 'Inside Out 2: Mảnh Ghép Cảm Xúc', room: 'Phòng 2 (3D)', time: '17:00', booked: 72, total: 80, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60' },
    { id: 3, title: 'Lật Mặt 7: Một Điều Ước', room: 'Phòng 1 (Standard)', time: '20:15', booked: 50, total: 80, image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=60' },
    { id: 4, title: 'Furiosa: Mad Max Saga', room: 'Phòng 4 (Dolby Atmos)', time: '21:30', booked: 15, total: 60, image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60' }
  ]

  return (
    <div className="space-y-8">
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
                className="flex rounded-xl bg-color-mix(in srgb, var(--color-surface-container) 60%, transparent) border border-[var(--color-border)] overflow-hidden shadow-lg hover:border-red-500/20 transition-all duration-200"
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
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: TICKET VERIFIER
// ──────────────────────────────────────────────────────────────────────────
function TicketVerifierSection({ bookings, setBookings, scannedCount, setScannedCount, triggerToast }) {
  const [query, setQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    const trimmed = query.trim().toUpperCase()
    // Find in bookings db
    // Matches by exact booking ID, phone number or name (partial match)
    const match = bookings.find(
      (b) =>
        b.id.toUpperCase() === trimmed ||
        b.phone === trimmed ||
        b.customerName.toUpperCase().includes(trimmed)
    )

    if (match) {
      setSelectedTicket(match)
    } else {
      setSelectedTicket(null)
      triggerToast('Không tìm thấy vé khớp với thông tin tìm kiếm!', 'error')
    }
  }

  const handleCheckIn = () => {
    if (!selectedTicket) return

    // Update check-in status in local database
    const updated = bookings.map((b) => {
      if (b.id === selectedTicket.id) {
        const timeNow = new Date()
        const formattedTime = `${String(timeNow.getDate()).padStart(2, '0')}/${String(timeNow.getMonth() + 1).padStart(2, '0')}/${timeNow.getFullYear()} - ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`
        return {
          ...b,
          checkedIn: true,
          checkInTime: formattedTime
        }
      }
      return b
    })

    setBookings(updated)
    // Update active view
    const match = updated.find((b) => b.id === selectedTicket.id)
    setSelectedTicket(match)

    // Increment scanned counter
    setScannedCount(scannedCount + 1)
    triggerToast(`Đã xác nhận check-in thành công cho vé ${selectedTicket.id}!`)
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Kiểm tra & Soát vé
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Nhập mã đặt vé (Booking ID), số điện thoại hoặc tên khách hàng để xác nhận vào phòng chiếu.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Ví dụ: CM-1718556391 hoặc 0912345678"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl py-4 pl-12 pr-4 outline-none text-white text-base focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder:text-gray-600"
          />
        </div>
        <button
          type="submit"
          className="bg-[var(--color-primary)] hover:bg-red-700 text-white font-bold px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-[rgba(229,9,20,0.25)]"
        >
          <Search size={18} />
          Tìm kiếm
        </button>
      </form>

      {/* Ticket Details Panel */}
      {selectedTicket ? (
        <div className="animate-fade-in space-y-6">
          {/* Ticket Stub Design */}
          <div
            className="rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-2xl relative"
            style={{
              background: 'linear-gradient(145deg, #0e121e 0%, #080a10 100%)',
            }}
          >
            {/* Top Indicator Strip */}
            <div
              className={`h-2.5 w-full ${
                selectedTicket.checkedIn ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'
              }`}
            />

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Film Title & Room Details */}
              <div className="md:col-span-2 space-y-6">
                {/* Section A: Chi tiết vé xem phim (AC-01 & AC-02) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-container)] flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                    <span>🎟️</span> Chi tiết vé xem phim
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Movie Name */}
                    <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Tên phim (Movie Name)</span>
                      <span className="text-sm font-extrabold text-white mt-1 block leading-snug">{selectedTicket.movie}</span>
                    </div>

                    {/* Ticket Booking ID */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Mã đặt vé (Booking ID)</span>
                      <span className="text-xs font-black text-white mt-1 block font-mono">{selectedTicket.id}</span>
                    </div>

                    {/* Screen */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Phòng chiếu (Screen)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.screen}</span>
                    </div>

                    {/* Date */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Ngày chiếu (Date)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.date}</span>
                    </div>

                    {/* Time */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Giờ chiếu (Time)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.time}</span>
                    </div>

                    {/* Seat */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Ghế ngồi (Seat)</span>
                      <span className="text-xs font-black text-[var(--color-primary-container)] mt-1 block">{selectedTicket.seats}</span>
                    </div>

                    {/* Price per ticket */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Đơn giá (Price)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{formatVND(selectedTicket.price)}</span>
                    </div>

                    {/* Total Price */}
                    <div className="col-span-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-primary-container)] block">Tổng tiền (Total)</span>
                      <span className="text-sm font-black text-[var(--color-primary-container)] mt-1 block">{formatVND(selectedTicket.total)}</span>
                    </div>

                    {/* Score Conversion Details (AC-02) */}
                    {selectedTicket.convertTickets > 0 && (
                      <>
                        <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-yellow-500 block">Convert to Ticket</span>
                          <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.convertTickets} vé</span>
                        </div>
                        <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-yellow-500 block">Score for Ticket Converting</span>
                          <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.scoreUsed} điểm</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section B: Thông tin thành viên (AC-03) */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                    <span>👤</span> Thông tin thành viên (Member Details)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Member ID */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Mã thành viên (Member ID)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block font-mono">{selectedTicket.memberId}</span>
                    </div>

                    {/* Email */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Email</span>
                      <span className="text-xs font-extrabold text-white mt-1 block truncate" title={selectedTicket.email}>{selectedTicket.email}</span>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Số điện thoại (Phone)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.phone}</span>
                    </div>

                    {/* Identity Card */}
                    <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Số CCCD (Identity Card)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.idCard}</span>
                    </div>

                    {/* Full Name */}
                    <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Họ tên thành viên (Full Name)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.customerName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: QR/Scan Status Stub */}
              <div className="border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between items-center text-center">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">MÃ ĐẶT VÉ</p>
                  <p className="text-lg font-black text-white bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl inline-block" style={{ fontFamily: 'monospace' }}>
                    {selectedTicket.id}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="my-6 space-y-1">
                  <span className="text-xs font-medium text-[var(--color-text-muted)] block">TRẠNG THÁI VÉ</span>
                  {selectedTicket.checkedIn ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wide">
                      <CheckCircle size={12} /> Đã vào phòng
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wide">
                      <AlertCircle size={12} /> Chờ check-in
                    </div>
                  )}
                  {selectedTicket.checkedIn && selectedTicket.checkInTime && (
                    <p className="text-[10px] text-gray-500 mt-1">{selectedTicket.checkInTime}</p>
                  )}
                </div>

                {/* Confirm Action Button */}
                {selectedTicket.checkedIn ? (
                  <button
                    disabled
                    className="w-full bg-slate-800 text-gray-500 font-bold py-3.5 rounded-2xl text-sm border border-white/5 cursor-not-allowed"
                  >
                    Đã kiểm tra vé
                  </button>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-emerald-500/20 border border-emerald-500/10 active:scale-[0.98] transition-all"
                  >
                    Xác nhận vào phòng
                  </button>
                )}
              </div>
            </div>

            {/* Ticket Cutout Circles (Decorative) */}
            <div className="hidden md:block absolute left-[66.6%] top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--color-background)] border-b border-[var(--color-border)]" />
            <div className="hidden md:block absolute left-[66.6%] bottom-0 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-[var(--color-background)] border-t border-[var(--color-border)]" />
          </div>
        </div>
      ) : (
        /* Empty / Welcome State */
        <div className="text-center py-16 border border-dashed border-[var(--color-border)] rounded-3xl bg-color-mix(in srgb, var(--color-surface-container) 10%, transparent)">
          <span className="material-symbols-outlined text-gray-600" style={{ fontSize: '56px' }}>
            qr_code_scanner
          </span>
          <h4 className="text-lg font-bold text-white mt-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Đang đợi thông tin quét vé...
          </h4>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto mt-2">
            Nhập Booking ID hợp lệ (ví dụ: <strong className="text-gray-400">CM-1718556391</strong> hoặc <strong className="text-gray-400">CM-9988112233</strong>) ở thanh tìm kiếm để tra cứu thông tin vé.
          </p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: CONCESSION COUNTER
// ──────────────────────────────────────────────────────────────────────────
function ConcessionCounterSection({ revenue, setRevenue, triggerToast }) {
  const [cart, setCart] = useState([])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const filteredItems = selectedFilter === 'all'
    ? CONCESSION_ITEMS
    : CONCESSION_ITEMS.filter(item => item.category === selectedFilter)

  // Add to Cart Logic
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id)
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  // Edit quantity in cart
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  // Remove from cart
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  // Calculate Cart metrics
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Handle Checkout / Invoice Creation
  const handleCheckout = () => {
    if (cart.length === 0) return

    // Generate transaction details
    const timeNow = new Date()
    const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000)
    const formattedDate = `${String(timeNow.getDate()).padStart(2, '0')}/${String(timeNow.getMonth() + 1).padStart(2, '0')}/${timeNow.getFullYear()} ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`

    const invoice = {
      txId,
      date: formattedDate,
      items: [...cart],
      total: cartTotal,
      paymentMethod
    }

    // Update revenue state
    setRevenue(revenue + cartTotal)

    // Clear cart & trigger receipt modal
    setCart([])
    setActiveReceipt(invoice)
    triggerToast('Thanh toán thành công! Đã tạo hóa đơn.')
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Quầy Bán Bắp Nước
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Lập đơn hàng nhanh chóng, bán bỏng ngô, nước giải khát cho khách hàng trực tiếp tại quầy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT / CENTER: Products Catalog */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories Filters */}
          <div className="flex gap-2.5 pb-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Tất cả sản phẩm', icon: ChefHat },
              { id: 'food', label: 'Bắp rang', icon: ChefHat },
              { id: 'drink', label: 'Thức uống', icon: ChefHat },
              { id: 'combo', label: 'Combo ưu đãi', icon: ChefHat }
            ].map(f => {
              const active = selectedFilter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider shrink-0 transition-all border ${
                    active
                      ? 'bg-[var(--color-primary-container)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-gray-700 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((prod) => (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-red-500/30 transition-all duration-200 cursor-pointer flex gap-4 shadow-md group relative overflow-hidden active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-xl bg-color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent) flex items-center justify-center text-3xl select-none shrink-0 group-hover:scale-105 transition-transform duration-200">
                  {prod.image}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{prod.name}</h4>
                    <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">{prod.desc}</p>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-bold text-[var(--color-primary-container)]">
                      {formatVND(prod.price)}
                    </span>
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-white border border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Cart Drawer */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-xl space-y-6 flex flex-col h-[520px] justify-between">
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-4">
              <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                🛒 Đơn hàng ({cartItemsCount})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-[var(--color-text-muted)] hover:text-red-400 font-semibold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length > 0 ? (
              <div className="space-y-3.5">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 justify-between items-start text-xs border-b border-white/5 pb-3 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate" title={item.name}>{item.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{formatVND(item.price)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Qty Selector */}
                      <div className="flex items-center bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-white text-[var(--color-text-muted)]"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-bold text-white min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-white text-[var(--color-text-muted)]"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:text-red-400 text-gray-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-gray-700" style={{ fontSize: '40px' }}>
                  shopping_cart
                </span>
                <p className="text-xs mt-3">Chọn các sản phẩm bên trái để bắt đầu lập hóa đơn thanh toán.</p>
              </div>
            )}
          </div>

          {/* Cart Pricing and Checkout Actions */}
          <div className="border-t border-[var(--color-border)] pt-4 space-y-4 shrink-0 bg-[var(--color-surface)]">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-[var(--color-text-muted)] font-semibold">TỔNG HÓA ĐƠN</span>
              <span className="text-xl font-extrabold text-[var(--color-primary-container)]" style={{ fontFamily: 'Montserrat' }}>
                {formatVND(cartTotal)}
              </span>
            </div>

            {/* Payment Method Option */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Phương thức thanh toán</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-red-500/10 text-white border-red-500'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-transparent hover:border-gray-700'
                  }`}
                >
                  💵 Tiền mặt
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-red-500/10 text-white border-red-500'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-transparent hover:border-gray-700'
                  }`}
                >
                  💳 QR / Ví ĐT
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-red-700 disabled:bg-slate-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[rgba(229,9,20,0.2)]"
            >
              <CreditCard size={16} />
              Thanh toán & Xuất hóa đơn
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-[var(--color-border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            {/* Success Banner */}
            <div className="bg-emerald-500 py-6 text-center text-white space-y-1.5">
              <CheckCircle size={40} className="mx-auto" />
              <h4 className="font-extrabold uppercase tracking-wider text-base" style={{ fontFamily: 'Montserrat' }}>
                Thanh toán thành công
              </h4>
              <p className="text-[11px] text-emerald-100 font-medium">Hóa đơn bán bắp nước tại quầy</p>
            </div>

            {/* Receipt Details */}
            <div className="p-6 space-y-6 flex-1 text-xs text-[var(--color-text-muted)] font-medium">
              <div className="flex justify-between">
                <span>Số hóa đơn (TXID):</span>
                <span className="text-white font-bold">{activeReceipt.txId}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span>Thời gian giao dịch:</span>
                <span className="text-white font-semibold">{activeReceipt.date}</span>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Chi tiết hóa đơn</p>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {activeReceipt.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-baseline">
                      <span className="text-white leading-relaxed truncate max-w-[180px]">{item.name} <span className="text-gray-500 font-normal">x{item.quantity}</span></span>
                      <span className="text-white font-semibold font-mono">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing summary */}
              <div className="border-t border-dashed border-[var(--color-border)] pt-4 space-y-3">
                <div className="flex justify-between">
                  <span>Phương thức:</span>
                  <span className="text-white font-semibold">{activeReceipt.paymentMethod === 'cash' ? '💵 Tiền mặt' : '💳 Chuyển khoản / Ví'}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm font-bold pt-1">
                  <span className="text-white">Tổng cộng:</span>
                  <span className="text-xl text-[var(--color-primary-container)] font-extrabold" style={{ fontFamily: 'Montserrat' }}>
                    {formatVND(activeReceipt.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[var(--color-border)] bg-slate-900/40 flex gap-2">
              <button
                onClick={() => {
                  // Print simulation
                  triggerToast('Đang mô phỏng in hóa đơn giấy...')
                }}
                className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all"
              >
                🖨️ In hóa đơn
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
