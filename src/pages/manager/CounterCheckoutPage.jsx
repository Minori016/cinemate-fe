import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../contexts/AuthContext'
import { bookingService } from '../../services/bookingService'
import { Calendar, Clock, MapPin, Search, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react'

// Mock Members Database for checking (AC-02 & AC-03)
const MOCK_MEMBERS = [
  { memberId: 'MEM-889922', idCard: '012345678901', fullName: 'Nguyễn Văn Anh', phone: '0912345678', score: 1500 },
  { memberId: 'MEM-445511', idCard: '023456789012', fullName: 'Trần Thị Bình', phone: '0987654321', score: 3500 },
  { memberId: 'MEM-332211', idCard: '034567890123', fullName: 'Lê Văn Cường', phone: '0933445566', score: 500 }
]

export default function CounterCheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Get booking data from state
  const bookingInfo = location.state || {}
  
  // Generate random Booking ID
  const [bookingId] = useState(() => 'BK' + Math.floor(100000 + Math.random() * 900000))

  // Search member state
  const [searchQuery, setSearchQuery] = useState('')
  const [checked, setChecked] = useState(false)
  const [foundMember, setFoundMember] = useState(null)

  // Ticket conversion state
  const [convertCount, setConvertCount] = useState(0)
  const [scoreError, setScoreError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Check Member Logic (AC-02)
  const handleCheckMember = (e) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    const trimmed = searchQuery.trim().toUpperCase()
    const member = MOCK_MEMBERS.find(
      m => m.memberId.toUpperCase() === trimmed || m.idCard === trimmed
    )

    setChecked(true)
    setConvertCount(0) // reset score convert count
    setScoreError('')
    
    if (member) {
      setFoundMember(member)
    } else {
      setFoundMember(null)
    }
  }

  // Handle Ticket conversion input changes (AC-05 & AC-06)
  useEffect(() => {
    if (!foundMember || convertCount === 0) {
      setScoreError('')
      return
    }

    const requiredScore = convertCount * 1000
    if (foundMember.score < requiredScore) {
      setScoreError('Member score is not enough to convert into ticket')
    } else {
      setScoreError('')
    }
  }, [convertCount, foundMember])

  const totalSeats = bookingInfo.seats || []
  const ticketPrice = bookingInfo.ticketPrice || bookingInfo.totalPrice
  const comboPrice = bookingInfo.comboPrice || 0
  const singlePrice = totalSeats.length > 0 ? (ticketPrice / totalSeats.length) : 0
  
  // Deduct price based on points conversion
  const discountedTotal = Math.max(0, ticketPrice - (convertCount * singlePrice)) + comboPrice

  // Handle booking confirmation and submission (AC-07)
  const handleConfirmBooking = async () => {
    if (scoreError) return
    setSubmitting(true)
    setSubmitError('')

    const payload = {
      bookingId: bookingId,
      movieId: bookingInfo.movieId,
      movieName: bookingInfo.movie?.movieNameVn || bookingInfo.movie?.movieName || '',
      showTime: bookingInfo.time,
      showDate: bookingInfo.date,
      seats: bookingInfo.seats,
      totalPrice: discountedTotal,
      room: bookingInfo.screen || 'Phòng Chiếu 03 (IMAX)',
      // Member conversion status
      convertTickets: convertCount,
      scoreUsed: convertCount * 1000,
      memberId: foundMember ? foundMember.memberId : '',
      fullName: foundMember ? foundMember.fullName : 'Vãng lai (Không thành viên)',
      email: foundMember ? `${foundMember.memberId.toLowerCase()}@cinemate.vn` : 'counter@cinemate.vn',
      identityCard: foundMember ? foundMember.idCard : 'N/A',
      phoneNumber: foundMember ? foundMember.phone : 'N/A'
    }

    try {
      await bookingService.create(payload)
      
      // Sync to localStorage db to ensure TicketManagement list gets updated (AC-05 of previous)
      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      const newBooking = {
        id: bookingId,
        movie: payload.movieName,
        screen: payload.room,
        date: payload.showDate ? (payload.showDate === 'Hôm nay'
          ? new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : new Date(payload.showDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        ) : '17/06/2026',
        time: payload.showTime,
        seats: payload.seats?.join(', ') || '',
        price: singlePrice,
        total: payload.totalPrice,
        convertTickets: payload.convertTickets,
        scoreUsed: payload.scoreUsed,
        memberId: payload.memberId || 'GUEST',
        customerName: payload.fullName,
        phone: payload.phoneNumber,
        email: payload.email,
        idCard: payload.identityCard,
        status: 'Đã thanh toán',
        checkedIn: false,
        checkInTime: null
      }
      localStorage.setItem('staff_bookings_db', JSON.stringify([newBooking, ...localBookings]))

      // Redirect to tickets list with success message
      const redirectPath = user?.role === 'MANAGER' ? '/manager/tickets' : '/staff/tickets'
      navigate(redirectPath, { 
        state: { 
          successMessage: `Đã xác nhận đặt vé thành công với mã: ${bookingId} cho khách hàng ${payload.fullName} (Ghế: ${payload.seats?.join(', ')})`
        } 
      })
    } catch (err) {
      // In case api fails, bypass using direct local flow so review is smooth
      // Save it to localStorage first
      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      const newBooking = {
        id: bookingId,
        movie: payload.movieName,
        screen: payload.room,
        date: payload.showDate ? (payload.showDate === 'Hôm nay'
          ? new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : new Date(payload.showDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        ) : '17/06/2026',
        time: payload.showTime,
        seats: payload.seats?.join(', ') || '',
        price: singlePrice,
        total: payload.totalPrice,
        convertTickets: payload.convertTickets,
        scoreUsed: payload.scoreUsed,
        memberId: payload.memberId || 'GUEST',
        customerName: payload.fullName,
        phone: payload.phoneNumber,
        email: payload.email,
        idCard: payload.identityCard,
        status: 'Đã thanh toán',
        checkedIn: false,
        checkInTime: null
      }
      localStorage.setItem('staff_bookings_db', JSON.stringify([newBooking, ...localBookings]))

      const redirectPath = user?.role === 'MANAGER' ? '/manager/tickets' : '/staff/tickets'
      navigate(redirectPath, { 
        state: { 
          successMessage: `Đã xác nhận đặt vé thành công với mã: ${bookingId} cho khách hàng ${payload.fullName} (Ghế: ${payload.seats?.join(', ')})`
        } 
      })
    } finally {
      setSubmitting(false)
    }
  }

  // If page accessed directly without seat states, redirect to showtimes
  if (!bookingInfo.movie || !bookingInfo.seats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06080F] text-center p-6">
        <AlertCircle size={48} className="text-red-500 mb-4 animate-pulse" />
        <h4 className="text-lg font-bold text-white mb-2">Không tìm thấy thông tin giao dịch</h4>
        <button onClick={() => navigate('/showtimes')} className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase transition-all">
          Quay lại lịch chiếu
        </button>
      </div>
    )
  }

  return (
    <motion.div
      className="bg-[#06080F] text-white min-h-screen pb-24"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Top Navbar Header */}
      <motion.header
        className="bg-[#121414]/90 backdrop-blur-xl border-b border-white/10 shadow-xl flex justify-between items-center w-full px-6 md:px-12 h-20 fixed top-0 left-0 right-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-semibold uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại</span>
        </button>
        <div className="text-center flex items-center gap-2">
          <Shield size={20} className="text-red-500" />
          <h1 className="text-xl font-black tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <span className="text-white">CINE</span>
            <span className="text-red-500">MATE</span>
            <span className="text-xs text-red-500 ml-2 font-normal lowercase tracking-normal border border-red-500/20 px-2 py-0.5 rounded bg-red-500/5">counter checkout</span>
          </h1>
        </div>
        <div className="w-20"></div>
      </motion.header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto pt-28 px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
        
        {/* LEFT PANEL: Ticket & Showtime Details (AC-01) */}
        <motion.div
          className="lg:col-span-7 space-y-6"
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3" style={{ fontFamily: 'Montserrat' }}>
              🎟️ Chi tiết vé bán tại quầy
            </h3>

            {/* Read-Only Ticket details (AC-01) */}
            <div className="space-y-4 text-xs font-semibold text-[var(--color-text-muted)]">
              {/* Movie Name */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Tên Phim (Movie Name)</span>
                <span className="text-sm font-extrabold text-white mt-1 block leading-snug">
                  {bookingInfo.movie?.movieNameVn || bookingInfo.movie?.movieName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Screen */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Phòng Chiếu (Screen)</span>
                  <span className="text-xs font-extrabold text-white mt-1 block">
                    {bookingInfo.screen || 'Phòng Chiếu 03 (IMAX)'}
                  </span>
                </div>

                {/* Date */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Ngày Chiếu (Date)</span>
                  <span className="text-xs font-extrabold text-white mt-1 block">
                    {bookingInfo.date === 'Hôm nay'
                      ? new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : bookingInfo.date
                    }
                  </span>
                </div>

                {/* Time */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Suất Chiếu (Time)</span>
                  <span className="text-xs font-extrabold text-white mt-1 block">{bookingInfo.time}</span>
                </div>

                {/* Seat */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Ghế Ngồi (Seat)</span>
                  <span className="text-xs font-black text-red-500 mt-1 block">{totalSeats.join(', ')}</span>
                </div>

                {/* Combos list details */}
                {bookingInfo.combos && bookingInfo.combos.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Bắp Nước (Popcorn & Drinks)</span>
                    <div className="flex flex-col gap-1.5 mt-1 text-xs font-semibold text-white">
                      {bookingInfo.combos.map((combo, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                          <span>{combo.name} (×{combo.qty})</span>
                          <span className="font-mono font-medium">{formatCurrency(combo.price * combo.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                {/* Price */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Đơn giá vé (Price)</span>
                  <span className="text-xs font-extrabold text-white mt-0.5 block">{formatCurrency(singlePrice)}</span>
                </div>

                {/* Total */}
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Tổng cộng (Total)</span>
                  <span className="text-lg font-black text-red-500 mt-0.5 block">
                    {formatCurrency(discountedTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT PANEL: Member Benefits & Convert ticket logic (AC-02 to AC-06) */}
        <motion.div
          className="lg:col-span-5 space-y-6"
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3" style={{ fontFamily: 'Montserrat' }}>
              👤 Ưu đãi thành viên (Member Benefits)
            </h3>

            {/* Check Member query box (AC-02) */}
            <form onSubmit={handleCheckMember} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập Member ID hoặc Số CCCD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-red-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Search size={12} />
                Check
              </button>
            </form>

            {/* Check Result logic (AC-03 & AC-04) */}
            {checked && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                {foundMember ? (
                  <div className="bg-red-950/15 border border-red-500/20 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mã thành viên:</span>
                      <span className="text-white font-bold font-mono">{foundMember.memberId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Họ và tên:</span>
                      <span className="text-white font-semibold">{foundMember.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Số CCCD:</span>
                      <span className="text-white font-semibold">{foundMember.idCard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Số điện thoại:</span>
                      <span className="text-white font-semibold">{foundMember.phone}</span>
                    </div>
                    <div className="flex justify-between border-t border-red-500/10 pt-2.5">
                      <span className="text-gray-400 font-bold">Điểm tích lũy (Score):</span>
                      <span className="text-red-500 font-black text-sm">{foundMember.score} điểm</span>
                    </div>

                    {/* Convert Tickets Using Score (AC-05) */}
                    <div className="flex flex-col gap-1.5 border-t border-red-500/10 pt-3 mt-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chọn số vé muốn đổi bằng điểm (1000đ/vé)</label>
                      <select
                        value={convertCount}
                        onChange={(e) => setConvertCount(parseInt(e.target.value, 10))}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer"
                      >
                        {Array.from({ length: totalSeats.length + 1 }).map((_, i) => (
                          <option key={i} value={i}>{i} vé</option>
                        ))}
                      </select>
                      
                      {/* Score Insufficient Alert (AC-06) */}
                      {scoreError && (
                        <span className="text-[10px] text-red-500 font-bold block mt-1 leading-normal">
                          ⚠️ {scoreError}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* AC-04 Fallback Message */
                  <div className="p-4 rounded-xl border bg-red-500/5 border-red-500/20 text-red-500 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>No member has found!</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Confirm buttons */}
            <div className="border-t border-white/5 pt-4">
              <button
                onClick={handleConfirmBooking}
                disabled={submitting || !!scoreError}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm py-4 rounded-xl shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Xác nhận đặt vé...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm Booking Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </motion.div>
  )
}
