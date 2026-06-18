import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import { motion } from 'motion/react'

export default function BookingConfirmationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Lấy dữ liệu đặt vé được chuyển từ trang chọn ghế
  const bookingInfo = location.state || {}
  
  // Tạo mã đặt vé tự động duy nhất cho giao dịch (AC-01)
  const [bookingId] = useState(() => 'BK' + Math.floor(100000 + Math.random() * 900000))

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Lấy thông tin cá nhân của Member từ backend API
  useEffect(() => {
    userService.getMyInfo()
      .then(res => {
        const data = res.data?.result ?? res.data
        setProfile(data)
      })
      .catch(() => {
        setProfile({
          fullName: user?.fullName || 'Thành viên CineMate',
          email: user?.email || '',
          identityCard: 'Chưa cập nhật',
          phoneNumber: 'Chưa cập nhật'
        })
      })
      .finally(() => setLoadingProfile(false))
  }, [user])

  // Kiểm tra tính đầy đủ của dữ liệu đặt vé (AC-04)
  const incompleteError = (!bookingInfo.movie || !bookingInfo.seats || bookingInfo.seats.length === 0 || !bookingId)
    ? 'Incomplete booking data. Please return and complete seat selection.'
    : ''

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const getSeatPrice = (seatId) => {
    const row = seatId.charAt(0)
    if (row === 'A' || row === 'B' || row === 'C') return 90000
    if (row === 'D' || row === 'E' || row === 'F') return 110000
    if (row === 'G' || row === 'H') return 130000
    return 0
  }

  const getSeatTypeLabel = (seatId) => {
    const row = seatId.charAt(0)
    if (row === 'A' || row === 'B' || row === 'C') return 'Thường'
    if (row === 'D' || row === 'E' || row === 'F') return 'VIP'
    if (row === 'G' || row === 'H') return 'Couple (Đôi)'
    return 'Thường'
  }

  // Lấy danh sách đơn giá của từng ghế đã chọn (AC-01)
  const getSelectedSeatDetails = () => {
    const seats = bookingInfo.seats || []
    return seats.map(seatId => ({
      id: seatId,
      type: getSeatTypeLabel(seatId),
      price: getSeatPrice(seatId)
    }))
  }

  // Tính toán chuỗi công thức tổng tiền (AC-01)
  const getCalculationText = () => {
    const seats = bookingInfo.seats || []
    if (seats.length === 0) return ''
    
    const groups = {}
    seats.forEach(seatId => {
      const type = getSeatTypeLabel(seatId)
      const price = getSeatPrice(seatId)
      if (!groups[type]) {
        groups[type] = { count: 0, price }
      }
      groups[type].count++
    })

    const parts = Object.entries(groups).map(([type, data]) => {
      return `${data.count} vé ${type} × ${formatCurrency(data.price)}`
    })

    return `${parts.join(' + ')} = ${formatCurrency(bookingInfo.totalPrice)}`
  }

  const handleConfirmBooking = (e) => {
    if (e) e.preventDefault()
    if (incompleteError) return // Ngăn chặn tiến trình nếu thiếu dữ liệu (AC-04)
    
    // Chuyển sang trang thanh toán kèm theo thông tin đặt vé và thông tin cá nhân
    navigate('/booking/payment', { 
      state: { 
        bookingInfo, 
        profile, 
        bookingId 
      } 
    })
  }

  if (loadingProfile && !incompleteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080F]">
        <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
      </div>
    )
  }

  const seatDetails = getSelectedSeatDetails()

  return (
    <motion.div
      className="bg-[#06080F] text-[#e2e2e2] min-h-screen flex flex-col font-sans pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        .custom-font-title {
          font-family: 'Anton', sans-serif;
        }
        .step-inactive {
          color: #4b5563;
          border-color: #374151;
        }
        .step-active {
          color: var(--color-primary);
          border-color: var(--color-primary);
          box-shadow: 0 0 10px rgba(229, 9, 20, 0.2);
        }
        .step-done {
          color: #10b981;
          border-color: #10b981;
        }
      `}</style>

      {/* Transactional Top Navigation Header */}
      <header className="bg-[#121414]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl flex justify-between items-center w-full px-6 md:px-12 h-20 fixed top-0 left-0 right-0 z-40">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-semibold uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span>Quay lại</span>
        </button>
        <div className="text-center">
          <h1 className="custom-font-title text-2xl md:text-3xl tracking-widest uppercase" style={{ fontWeight: 900 }}>
            <span className="text-white">Cine</span><span className="text-red-500">mate</span>
          </h1>
        </div>
        <div className="w-20"></div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-28 px-4 md:px-8 max-w-5xl mx-auto w-full flex flex-col items-center">
        
        {/* Step Progress Tracker */}
        <div className="w-full max-w-xl flex items-center justify-between mb-8 select-none">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold step-done bg-[#06080F]">
              <span className="material-symbols-outlined text-sm font-black">done</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-green-500">Chọn ghế</span>
          </div>
          
          <div className="h-0.5 flex-1 bg-green-500 mx-2 self-start mt-4"></div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold step-active bg-[#06080F]">
              2
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-primary)]">Xác nhận</span>
          </div>
          
          <div className="h-0.5 flex-1 bg-gray-700 mx-2 self-start mt-4"></div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold step-inactive bg-[#06080F]">
              3
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Thanh toán</span>
          </div>
          
          <div className="h-0.5 flex-1 bg-gray-700 mx-2 self-start mt-4"></div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold step-inactive bg-[#06080F]">
              4
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Thành công</span>
          </div>
        </div>

        {/* Incomplete Data Validation Alert (AC-04) */}
        {incompleteError && (
          <div className="w-full mb-8 p-5 rounded-2xl border bg-red-600/10 border-red-500/35 text-red-400 flex flex-col sm:flex-row items-center sm:justify-between gap-4 shadow-xl animate-fade-in text-left">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl font-bold shrink-0">warning</span>
              <div>
                <p className="font-extrabold text-lg">Thiếu thông tin giao dịch (Incomplete Data)</p>
                <p className="text-sm text-red-400/80 mt-1">{incompleteError}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/showtimes')}
              className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-[0_4px_10px_rgba(220,38,38,0.3)] shrink-0 cursor-pointer"
            >
              Quay lại chọn ghế
            </button>
          </div>
        )}



        <motion.div
          className="w-full flex flex-col lg:flex-row gap-8 items-start text-left"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } } }}
        >
          
          {/* Left Column */}
          <motion.div
            className="w-full lg:w-7/12 flex flex-col gap-6"
            variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } } }}
          >
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl flex flex-col gap-5 w-full">
              <h3 className="custom-font-title text-xl text-[var(--color-primary)] uppercase tracking-wide border-b border-white/10 pb-3">
                Thông tin tóm tắt vé đặt (Booking Summary)
              </h3>

              {bookingInfo.movie && (
                <div className="flex gap-4 items-start border-b border-white/5 pb-5">
                  {bookingInfo.movie?.image && (
                    <img 
                      src={bookingInfo.movie.image} 
                      alt={bookingInfo.movie.movieNameVn} 
                      className="w-20 h-28 object-cover rounded-lg border border-white/10 shadow-md shrink-0" 
                    />
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-white tracking-wide leading-tight">
                      {bookingInfo.movie?.movieNameVn}
                    </h4>
                    <p className="text-xs text-gray-400 font-semibold tracking-wider mt-1 uppercase">
                      {bookingInfo.movie?.movieName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 bg-red-600/10 border border-red-500/20 rounded-md py-0.5 px-2 w-fit">
                      <span className="text-[10px] font-black text-red-500">T18</span>
                    </div>
                  </div>
                </div>
              )}

              {/* All fields displayed as read-only labels (AC-02) */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mã vé đặt (Booking ID)</span>
                    <p className="text-white font-mono font-bold text-sm mt-0.5 select-all">{bookingId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Phòng chiếu (Screen)</span>
                    <p className="text-white font-semibold text-sm mt-0.5">{bookingInfo.screen || 'Phòng Chiếu 03 (IMAX)'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ngày chiếu (Date)</span>
                    <p className="text-white font-semibold text-sm mt-0.5">
                      {bookingInfo.date ? (bookingInfo.date === 'Hôm nay'
                        ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
                        : new Date(bookingInfo.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Suất chiếu (Time)</span>
                    <p className="text-white font-semibold text-sm mt-0.5">{bookingInfo.time || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-b border-white/5 pb-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Danh sách ghế ngồi (Seats)</span>
                  <p className="text-[var(--color-primary)] font-black text-base mt-0.5 tracking-wider">
                    {bookingInfo.seats?.join(', ') || 'Chưa chọn ghế'}
                  </p>
                </div>

                {/* Price Breakdown / Price per Ticket details (AC-01) */}
                <div className="border-b border-white/5 pb-3">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Đơn giá từng ghế (Price)</span>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {seatDetails.map((seat, index) => (
                      <div key={index} className="flex justify-between items-center text-xs text-gray-300">
                        <span>Ghế {seat.id} ({seat.type})</span>
                        <span className="font-mono font-medium">{formatCurrency(seat.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Price formula & math (AC-01) */}
                <div className="pt-2 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Công thức tính</span>
                    <p className="text-xs text-gray-400 mt-0.5">{getCalculationText() || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tổng tiền (Total)</span>
                    <p className="text-xl font-black text-[var(--color-primary)] font-mono mt-0.5">
                      {formatCurrency(bookingInfo.totalPrice || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            className="w-full lg:w-5/12 flex flex-col gap-6"
            variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } } }}
          >
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl flex flex-col gap-5 w-full">
              <h3 className="custom-font-title text-xl text-[var(--color-primary)] uppercase tracking-wide border-b border-white/10 pb-3">
                Thông tin tài khoản thành viên
              </h3>

              <div className="space-y-4">
                {/* Labels instead of editable input fields (AC-02) */}
                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Họ và tên (Full Name)</span>
                  <span className="text-white font-bold text-sm mt-0.5">
                    {profile?.fullName || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Email</span>
                  <span className="text-white font-semibold text-sm mt-0.5 select-all">
                    {profile?.email || 'N/A'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">CMND / CCCD (Identity Card)</span>
                  <span className="text-white font-semibold text-sm mt-0.5">
                    {profile?.identityCard || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Số điện thoại (Phone Number)</span>
                  <span className="text-[var(--color-primary)] font-bold text-sm mt-0.5">
                    {profile?.phoneNumber || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>

              {/* Proceed to payment button */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <button
                  onClick={handleConfirmBooking}
                  disabled={!!incompleteError}
                  className="w-full bg-[var(--color-primary)] hover:bg-red-700 text-white font-black text-base py-4 rounded-xl shadow-[0_4px_20px_rgba(229,9,20,0.35)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-lg font-black">payments</span>
                  Tiếp tục thanh toán (Proceed to Payment)
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-3 leading-relaxed">
                  Bằng việc bấm tiếp tục thanh toán, bạn đồng ý với các điều khoản mua vé trực tuyến của Cinemate. Vé đã đặt không thể hoàn tác trực tuyến.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </main>
    </motion.div>
  )
}
