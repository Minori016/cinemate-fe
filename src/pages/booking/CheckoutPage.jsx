import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Clock, Ticket, AlertCircle, Loader2, User, Wallet } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import { paymentService } from '../../services/paymentService'
import { useAuth } from '../../contexts/AuthContext'

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = params.get('bookingId')

  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('momo')

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
    if (timeLeft <= 0) return

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
  }, [timeLeft])

  const handlePayment = async () => {
    try {
      setIsProcessing(true)
      let res;
      if (paymentMethod === 'momo') {
        res = await paymentService.createMomoPayment(bookingId)
      } else if (paymentMethod === 'vnpay') {
        res = await paymentService.createVnPayPayment(bookingId)
      } else {
        throw new Error('Chưa hỗ trợ phương thức thanh toán này')
      }
      
      const payUrl = res.data?.result?.payUrl || res.data?.payUrl
      if (payUrl) {
        window.location.href = payUrl
      } else {
        setError(`Không nhận được đường dẫn thanh toán từ ${paymentMethod.toUpperCase()}`)
        setIsProcessing(false)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Khởi tạo thanh toán thất bại')
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
                <p className="text-sm font-medium">{booking.showtime} | {booking.date}</p>
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

            {/* Bắp nước đã chọn */}
            {booking.concessions && booking.concessions.length > 0 && (
              <div className="pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Bắp Nước Đã Chọn ({booking.concessions.length})</p>
                <div className="space-y-2 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                  {booking.concessions.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-white font-medium">{item.name} <span className="text-gray-400 font-bold">x{item.quantity}</span></span>
                      <span className="text-red-400 font-mono font-bold">{formatCurrency(item.lineTotal || (item.unitPrice * item.quantity))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thông tin cá nhân (AC-01) */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Thông Tin Khách Hàng</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Họ Tên</p>
                  <p className="text-sm font-bold text-white mt-0.5">{user?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Số Điện Thoại</p>
                  <p className="text-sm font-medium text-white mt-0.5">{user?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Email</p>
                  <p className="text-sm font-medium text-white mt-0.5 truncate">{user?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">Tổng Thanh Toán Vé & Bắp Nước</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Đã bao gồm VAT & Bắp nước</span>
            </div>
            <span className="text-3xl font-black text-red-500">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </motion.div>

        {/* Payment Methods (AC-01 Use Case 3) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-6">
          <div className="bg-[#121414] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex-grow flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6 pb-6 border-b border-white/10 flex items-center gap-3">
                <Wallet size={24} className="text-blue-400" />
                Phương Thức Thanh Toán
              </h2>
              
              <div className="space-y-4 mb-8">
                {/* Option 1: MoMo */}
                <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${paymentMethod === 'momo' ? 'border-[#A50064] bg-[#A50064]/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                  <input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} className="hidden" />
                  <div className="w-10 h-10 bg-[#A50064] rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-[10px] tracking-wider">MoMo</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Ví Điện Tử MoMo</h4>
                    <p className="text-xs text-gray-400">Thanh toán qua ứng dụng MoMo</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'momo' ? 'border-[#A50064]' : 'border-gray-500'}`}>
                    {paymentMethod === 'momo' && <div className="w-2.5 h-2.5 rounded-full bg-[#A50064]" />}
                  </div>
                </label>

                {/* Option 2: VNPAY */}
                <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${paymentMethod === 'vnpay' ? 'border-[#005BAA] bg-[#005BAA]/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                  <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="hidden" />
                  <div className="w-10 h-10 bg-[#005BAA] rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-[10px] tracking-wider">VNPAY</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Cổng Thanh Toán VNPAY</h4>
                    <p className="text-xs text-gray-400">Thanh toán qua VNPAY, Thẻ ATM/Visa</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'vnpay' ? 'border-[#005BAA]' : 'border-gray-500'}`}>
                    {paymentMethod === 'vnpay' && <div className="w-2.5 h-2.5 rounded-full bg-[#005BAA]" />}
                  </div>
                </label>
              </div>
            </div>
            
            <button 
              onClick={handlePayment} 
              disabled={isProcessing || timeLeft <= 0}
              className={`w-full text-white font-bold text-lg py-4 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2 ${
                paymentMethod === 'momo' ? 'bg-[#A50064] shadow-[0_5px_20px_rgba(165,0,100,0.3)] hover:bg-[#80004d]' :
                paymentMethod === 'vnpay' ? 'bg-[#005BAA] shadow-[0_5px_20px_rgba(0,91,170,0.3)] hover:bg-[#004a8b]' :
                paymentMethod === 'credit' ? 'bg-blue-600 shadow-[0_5px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700' :
                'bg-emerald-600 shadow-[0_5px_20px_rgba(5,150,105,0.3)] hover:bg-emerald-700'
              }`}
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : 'Xác Nhận Thanh Toán'}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
