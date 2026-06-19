import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { motion } from 'motion/react'

export default function BookingSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const bookingInfo = location.state || {}

  // Bắn confetti chúc mừng khi load trang thành công
  useEffect(() => {
    if (bookingInfo.movie) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e50914', '#f59e0b', '#ef4444', '#ffffff']
      })
    } else {
      // Nếu không có dữ liệu đặt vé, tự động về trang chủ
      navigate('/')
    }
  }, [bookingInfo, navigate])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hôm nay') {
      return new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    }
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  if (!bookingInfo.movie) {
    return null
  }

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
        .step-done {
          color: #10b981;
          border-color: #10b981;
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
      `}</style>

      {/* Transactional Top Navigation Header */}
      <header className="bg-[#121414]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl flex justify-between items-center w-full px-6 md:px-12 h-20 fixed top-0 left-0 right-0 z-40">
        <div className="w-20"></div>
        <div className="text-center">
          <h1 className="custom-font-title text-2xl md:text-3xl tracking-widest uppercase" style={{ fontWeight: 900 }}>
            <span className="text-white">Cine</span><span className="text-red-500">mate</span>
          </h1>
        </div>
        <div className="w-20"></div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-28 px-4 md:px-8 max-w-xl mx-auto w-full flex flex-col items-center">

        {/* Step Progress Tracker */}
        <div className="w-full max-w-md flex items-center justify-between mb-10 select-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold step-done bg-[#06080F]">
              <span className="material-symbols-outlined text-xs font-black">done</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-green-500">Chọn ghế</span>
          </div>

          <div className="h-0.5 flex-1 bg-green-500 mx-2 self-start mt-3.5"></div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold step-done bg-[#06080F]">
              <span className="material-symbols-outlined text-xs font-black">done</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-green-500">Xác nhận</span>
          </div>

          <div className="h-0.5 flex-1 bg-green-500 mx-2 self-start mt-3.5"></div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold step-done bg-[#06080F]">
              <span className="material-symbols-outlined text-xs font-black">done</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-green-500">Thanh toán</span>
          </div>

          <div className="h-0.5 flex-1 bg-green-500 mx-2 self-start mt-3.5"></div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold step-done bg-[#06080F]">
              <span className="material-symbols-outlined text-xs font-black">done</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-green-500">Thành công</span>
          </div>
        </div>

        {/* Success Icon */}
        <motion.div
          className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mb-4"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.25 }}
        >
          <span className="material-symbols-outlined text-5xl font-bold">check_circle</span>
        </motion.div>

        <motion.h2
          className="custom-font-title text-3xl text-red-500 uppercase tracking-wide mb-1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Đặt Vé Thành Công!
        </motion.h2>
        <motion.p
          className="text-sm text-gray-400 text-center mb-8 max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Cảm ơn bạn đã lựa chọn CineMate. Giao dịch của bạn đã được ghi nhận thành công.
        </motion.p>

        {/* Ticket Summary Card Layout */}
        <motion.div
          className="w-full bg-[#121414] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >

          {/* Ticket Header Graphic */}
          <div className="p-5 bg-gradient-to-r from-red-950/40 via-black/30 to-red-950/30 border-b border-dashed border-white/10 flex gap-4 items-center">
            {bookingInfo.movie?.image && (
              <img
                src={bookingInfo.movie.image}
                alt={bookingInfo.movie.movieNameVn}
                className="w-12 h-16 object-cover rounded-md border border-white/10 shadow-md"
              />
            )}
            <div className="text-left">
              <h3 className="font-bold text-white leading-tight">{bookingInfo.movie?.movieNameVn}</h3>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mt-0.5 uppercase">{bookingInfo.movie?.movieName}</p>
            </div>
          </div>

          {/* Ticket Body Details */}
          <div className="p-6 space-y-4 text-left text-sm relative">
            {/* Cut-out circles on side to simulate paper ticket */}
            <div className="absolute top-0 -left-3.5 w-7 h-7 rounded-full bg-[#06080F] border-r border-white/10"></div>
            <div className="absolute top-0 -right-3.5 w-7 h-7 rounded-full bg-[#06080F] border-l border-white/10"></div>

            <div className="grid grid-cols-2 gap-y-3.5 gap-x-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mã vé (Booking ID)</span>
                <p className="text-white font-mono font-bold mt-0.5 select-all">{bookingInfo.bookingId || 'BK99502'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Phòng chiếu</span>
                <p className="text-white font-semibold mt-0.5">{bookingInfo.screen || 'Phòng 03 (IMAX)'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Suất chiếu</span>
                <p className="text-white font-semibold mt-0.5">{bookingInfo.time}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ngày chiếu</span>
                <p className="text-white font-semibold mt-0.5">{formatDate(bookingInfo.date)}</p>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ghế đã chọn</span>
                <p className="text-red-500 font-black mt-0.5 tracking-wider">{bookingInfo.seats?.join(', ')}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Người đặt vé</span>
                <p className="text-white font-medium mt-0.5">{bookingInfo.profile?.fullName || 'Thành viên CineMate'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{bookingInfo.profile?.email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Phương thức thanh toán</span>
                <p className="text-white font-medium mt-0.5">{bookingInfo.paymentMethodLabel || 'Thẻ Tín dụng / Ghi nợ'}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-white/10 pt-4 flex justify-between items-end">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Trạng thái</span>
                <span className="flex items-center gap-1 text-green-400 text-xs font-bold mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                  Đã xác nhận (Confirmed)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tổng thanh toán</span>
                <p className="text-xl font-black text-red-500 font-mono mt-0.5">
                  {formatCurrency(bookingInfo.totalPrice)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="w-full mt-10 flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider text-sm cursor-pointer"
          >
            Quay Về Trang Chủ
          </button>

          <button
            onClick={() => navigate('/profile', { state: { activeTab: 'booked' } })}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-xl shadow-[0_4px_15px_rgba(220,38,38,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-wider text-sm cursor-pointer"
          >
            Xem Vé Đã Đặt
          </button>
        </motion.div>

      </main>
    </motion.div>
  )
}
