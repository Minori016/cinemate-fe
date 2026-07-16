import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Loader2, ArrowRight, Calendar, Clock, MapPin, Tag, Film, Ticket } from 'lucide-react'
import { paymentService } from '../../services/paymentService'
import { bookingService } from '../../services/bookingService'

export default function CheckoutResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  
  const orderId = params.get('orderId')
  const resultCode = params.get('resultCode')
  
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const [bookingDetails, setBookingDetails] = useState(null)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      setSuccess(false)
      setMessage('Không tìm thấy thông tin giao dịch.')
      return
    }

    const checkStatus = async () => {
      try {
        // If MoMo already returned a failed result code
        if (resultCode && resultCode !== '0') {
            setSuccess(false)
            setMessage('Giao dịch đã bị hủy hoặc thanh toán thất bại.')
            setLoading(false)
            await paymentService.checkMomoPaymentStatus(orderId)
            return
        }

        await paymentService.checkMomoPaymentStatus(orderId)
        setSuccess(true)
        setMessage('Cảm ơn bạn đã sử dụng dịch vụ của Cinemate.')
        
        // Extract bookingId and fetch details
        const bookingId = orderId.split('_')[1]
        if (bookingId) {
          const res = await bookingService.getById(bookingId)
          if (res.data && res.data.result) {
            setBookingDetails(res.data.result)
          }
        }
      } catch (err) {
        console.error(err)
        setSuccess(false)
        setMessage('Có lỗi xảy ra khi xác thực giao dịch. Vui lòng liên hệ hỗ trợ.')
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [orderId, resultCode])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06080F] text-white">
        <Loader2 size={40} className="animate-spin text-red-500 mb-4" />
        <p className="text-gray-400 font-medium tracking-wide">Đang xác thực kết quả giao dịch...</p>
      </div>
    )
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  return (
    <div className="min-h-screen bg-[#06080F] flex flex-col pt-24 pb-12 px-4 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] pointer-events-none opacity-40">
        <div className={`absolute inset-0 bg-gradient-to-b ${success ? 'from-emerald-900/20' : 'from-red-900/20'} to-transparent blur-3xl`} />
      </div>

      <div className="w-full max-w-3xl mx-auto z-10 flex flex-col items-center">
        
        {/* Status Header */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <div className="relative mb-6">
            <div className={`absolute inset-0 blur-xl ${success ? 'bg-emerald-500/30' : 'bg-red-500/30'} rounded-full`} />
            {success ? (
              <CheckCircle2 size={88} className="text-emerald-500 relative z-10 drop-shadow-2xl" strokeWidth={1.5} />
            ) : (
              <XCircle size={88} className="text-red-500 relative z-10 drop-shadow-2xl" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {success ? 'Thanh Toán Thành Công' : 'Giao Dịch Thất Bại'}
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            {message}
          </p>
        </motion.div>

        {/* Ticket Details Card (Only on Success) */}
        <AnimatePresence>
          {success && bookingDetails && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full relative mb-12"
            >
              {/* Ticket Top */}
              <div className="bg-[#12141C] border border-white/10 rounded-t-3xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Film size={36} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        ĐÃ XÁC NHẬN
                      </span>
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-white/5 text-gray-300 border border-white/10 font-mono">
                        {bookingDetails.id?.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {bookingDetails.movieName}
                    </h3>
                    <p className="text-gray-400 font-medium flex items-center gap-2">
                      <MapPin size={16} /> {bookingDetails.cinemaName} — {bookingDetails.roomName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Divider with cutouts */}
              <div className="h-8 bg-[#12141C] border-x border-white/10 relative flex items-center justify-between overflow-hidden">
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-[#06080F] border-r border-white/10 z-10" />
                <div className="w-full border-t-2 border-dashed border-white/10 mx-6" />
                <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-[#06080F] border-l border-white/10 z-10" />
              </div>

              {/* Ticket Bottom */}
              <div className="bg-[#12141C] border border-white/10 border-t-0 rounded-b-3xl p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={14}/> Ngày chiếu</p>
                    <p className="text-white font-semibold text-lg">{bookingDetails.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock size={14}/> Giờ chiếu</p>
                    <p className="text-white font-semibold text-lg">{bookingDetails.showtime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Ticket size={14}/> Ghế ngồi</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bookingDetails.seatNames?.map(seat => (
                        <span key={seat} className="text-white font-semibold text-sm bg-white/10 px-2 py-0.5 rounded">
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Tag size={14}/> Tổng tiền</p>
                    <p className="text-emerald-400 font-bold text-xl">{formatPrice(bookingDetails.totalAmount)}</p>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Vé điện tử đã được gửi tới email của bạn. Bạn cũng có thể xem vé trong mục Hồ sơ cá nhân.
                  </p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${bookingDetails.id}&bgcolor=000000&color=ffffff`} alt="QR Code" className="w-16 h-16 rounded bg-white p-1" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          {success && (
            <button 
              onClick={() => navigate('/profile', { state: { activeTab: 'tickets' } })} 
              className="px-8 py-3.5 bg-emerald-600 rounded-xl font-bold text-white hover:bg-emerald-500 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 group w-full sm:w-auto"
            >
              Xem Vé Của Tôi
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-3.5 bg-transparent border border-white/20 rounded-xl font-bold text-white hover:bg-white/10 transition-all duration-300 w-full sm:w-auto"
          >
            Về Trang Chủ
          </button>
        </motion.div>
        
      </div>
    </div>
  )
}
