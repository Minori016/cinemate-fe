import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Clock, Ticket, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { bookingService } from '../../services/bookingService'

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = params.get('bookingId')

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Fetch Booking Details
  useEffect(() => {
    if (!bookingId) {
      setError('Không tìm thấy thông tin đặt vé')
      setLoading(false)
      return
    }

    const fetchBooking = async () => {
      try {
        const res = await bookingService.getById(bookingId)
        const data = res.data?.result || res.data
        setBooking(data)
        
        // Calculate time left based on expiresAt
        if (data.expiresAt) {
          const expires = new Date(data.expiresAt).getTime()
          const now = new Date().getTime()
          const diff = Math.floor((expires - now) / 1000)
          setTimeLeft(diff > 0 ? diff : 0)
        }
      } catch (err) {
        setError('Không tải được thông tin đặt vé hoặc vé đã hết hạn')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0 || paymentSuccess) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setError('Thời gian giữ ghế đã hết hạn. Vui lòng đặt lại.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, paymentSuccess])

  const handlePayment = async () => {
    try {
      setIsProcessing(true)
      await bookingService.confirmMock(bookingId)
      setPaymentSuccess(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Thanh toán thất bại')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    try {
      await bookingService.cancelBooking(bookingId)
      navigate('/')
    } catch (err) {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080F]">
        <Loader2 size={28} className="animate-spin text-red-500" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06080F] text-white px-4">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Không thể tiếp tục</h2>
        <p className="text-gray-400 mb-8">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-700 transition">
          Về Trang Chủ
        </button>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06080F] text-white px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
          <CheckCircle2 size={80} className="text-emerald-500 mb-6 mx-auto" />
        </motion.div>
        <h2 className="text-3xl font-black mb-2 uppercase tracking-wide">Thanh Toán Thành Công</h2>
        <p className="text-gray-400 mb-8">Cảm ơn bạn đã sử dụng dịch vụ của Cinemate</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-700 transition shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          Xem Vé Của Tôi
        </button>
      </div>
    )
  }

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="min-h-screen bg-[#06080F] text-white pt-24 pb-12 px-4 font-sans selection:bg-red-900 selection:text-white">
      {/* Header */}
      <header className="bg-[#121414]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl flex justify-between items-center w-full px-6 md:px-12 h-20 fixed top-0 left-0 right-0 z-40">
        <motion.button onClick={handleCancel} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-semibold uppercase tracking-wider">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Hủy Giao Dịch</span>
        </motion.button>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-widest uppercase"><span className="text-white">Thanh</span> <span className="text-red-500">Toán</span></h1>
        </div>
        <div className="flex items-center gap-2 text-red-500 font-mono font-bold text-lg bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20">
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ticket Details */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#121414] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <Ticket size={28} className="text-red-500" />
            <h2 className="text-xl font-bold uppercase tracking-wider">Thông Tin Đặt Vé</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Phim</p>
              <p className="text-lg font-bold text-white">{booking.movieName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Rạp / Phòng</p>
                <p className="text-sm font-medium">{booking.cinemaName} - {booking.roomName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Suất Chiếu</p>
                <p className="text-sm font-medium">{booking.time} | {booking.date}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Ghế Chọn ({booking.seatNames?.length || 0})</p>
              <div className="flex flex-wrap gap-2">
                {booking.seatNames?.map((seat, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold">
                    {seat}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
            <span className="text-sm text-gray-400 font-medium">Tổng thanh toán</span>
            <span className="text-3xl font-black text-red-500">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </motion.div>

        {/* Payment Methods (MoMo Mockup) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-6">
          <div className="bg-[#121414] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex-grow flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-[#A50064] rounded-2xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(165,0,100,0.4)]">
              <span className="text-white font-black text-2xl tracking-wider">MoMo</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Thanh Toán Qua MoMo</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-xs">Sử dụng ứng dụng MoMo hoặc ứng dụng ngân hàng có hỗ trợ để thanh toán.</p>
            
            <button 
              onClick={handlePayment} 
              disabled={isProcessing || timeLeft <= 0}
              className="w-full bg-[#A50064] text-white font-bold text-lg py-4 rounded-xl shadow-[0_5px_20px_rgba(165,0,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : 'Xác Nhận Thanh Toán'}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
