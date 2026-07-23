import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  CheckCircle2, XCircle, Loader2, ArrowRight, Calendar, Clock, MapPin, 
  Tag, Film, Ticket, Share2, Printer, Coffee, Sparkles, Copy, Check, ChevronLeft 
} from 'lucide-react'
import { paymentService } from '../../services/paymentService'
import { bookingService } from '../../services/bookingService'
import { QRCodeSVG } from 'qrcode.react'

export default function CheckoutResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  
  const orderId = params.get('orderId')
  const resultCode = params.get('resultCode')
  
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const [bookingDetails, setBookingDetails] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      setSuccess(false)
      setMessage('Không tìm thấy thông tin giao dịch.')
      return
    }

    const checkStatus = async () => {
      try {
        if (resultCode && resultCode !== '0') {
          setSuccess(false)
          setMessage('Giao dịch đã bị hủy hoặc thanh toán thất bại.')
          setLoading(false)
          await paymentService.checkMomoPaymentStatus(orderId)
          return
        }

        await paymentService.checkMomoPaymentStatus(orderId)
        setSuccess(true)
        setMessage('Cảm ơn bạn đã đặt vé xem phim tại CineMate!')
        
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
        setMessage('Có lỗi xảy ra khi xác thực giao dịch. Vui lòng liên hệ bộ phận hỗ trợ.')
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [orderId, resultCode])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyTicketCode = () => {
    if (!bookingDetails?.id) return
    const ticketInfo = `Vé xem phim CineMate\nPhim: ${bookingDetails.movieName}\nMã vé: ${bookingDetails.id}\nNgày: ${bookingDetails.date} (${bookingDetails.showtime})\nGhế: ${bookingDetails.seatNames?.join(', ')}`
    navigator.clipboard.writeText(ticketInfo)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080E] text-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-24 h-24 rounded-full bg-red-600/30 blur-xl animate-pulse" />
          <Loader2 size={48} className="animate-spin text-red-600 relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Đang xác nhận kết quả thanh toán...
        </h3>
        <p className="text-gray-400 text-sm">Vui lòng chờ trong giây lát</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07080E] flex flex-col pt-20 pb-16 px-4 relative overflow-hidden font-sans text-gray-100">
      
      {/* Print Styles Sheet */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print, nav, footer, header, button {
            display: none !important;
          }
          .printable-ticket {
            border: 2px solid black !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          .printable-ticket * {
            color: black !important;
            border-color: #ccc !important;
          }
        }
      `}</style>

      {/* Ambient Crimson Red Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-50 z-0">
        <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b ${success ? 'from-red-600/30 via-red-900/15' : 'from-rose-950/40'} to-transparent blur-[120px]`} />
      </div>

      <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">

        {/* Back Link */}
        <div className="w-full mb-6 no-print">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl"
          >
            <ChevronLeft size={16} /> Quay về Trang Chủ
          </button>
        </div>

        {/* Status Header */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0, y: 15 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="flex flex-col items-center text-center mb-8 no-print"
        >
          <div className="relative mb-4">
            <div className={`absolute inset-0 blur-2xl ${success ? 'bg-red-600/40' : 'bg-rose-600/40'} rounded-full`} />
            {success ? (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-[0_0_40px_rgba(229,9,20,0.6)] relative z-10 border-2 border-red-400/40">
                <CheckCircle2 size={44} strokeWidth={2.2} />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-rose-950 flex items-center justify-center text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] relative z-10 border-2 border-rose-500/30">
                <XCircle size={44} strokeWidth={2} />
              </div>
            )}
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tight text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {success ? 'Thanh Toán Thành Công!' : 'Giao Dịch Thất Bại'}
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-md font-medium">
            {message}
          </p>
        </motion.div>

        {/* Failed Transaction View */}
        {!success && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white/[0.03] border border-red-500/20 rounded-2xl p-6 text-center shadow-xl no-print"
          >
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Rất tiếc, giao dịch không thành công. Hệ thống không trừ tiền của bạn hoặc số tiền sẽ tự động hoàn lại theo quy định thanh toán.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => navigate('/movies')} 
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(229,9,20,0.4)]"
              >
                Đặt lại vé khác
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all"
              >
                Trang chủ
              </button>
            </div>
          </motion.div>
        )}

        {/* Successful Booking Ticket Card */}
        <AnimatePresence>
          {success && bookingDetails && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="w-full printable-ticket"
            >
              {/* Main Physical Ticket Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#121420] border-2 border-red-600/30 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(229,9,20,0.15)] relative">

                {/* LEFT SECTION (Main Ticket Details + Concessions) - 8 Cols */}
                <div className="lg:col-span-8 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-dashed border-red-500/20 relative">
                  
                  {/* Top Bar */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-[0_0_12px_rgba(229,9,20,0.6)] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={13} className="animate-pulse" /> VERIFIED PASS
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/5 text-red-400 border border-red-500/30 font-mono">
                          #{bookingDetails.id?.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium italic">
                        Xuất trình mã này tại quầy rạp
                      </span>
                    </div>

                    {/* Movie Title & Cinema Info */}
                    <div className="mb-6">
                      <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {bookingDetails.movieName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-red-400 font-semibold">
                        <MapPin size={16} className="shrink-0 text-red-500" />
                        <span>{bookingDetails.cinemaName || 'Cinemate Center'} — <strong className="text-white">{bookingDetails.roomName || 'Phòng chiếu'}</strong></span>
                      </div>
                    </div>

                    {/* Show Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 mb-6">
                      <div>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Calendar size={13} className="text-red-500" /> Ngày chiếu
                        </p>
                        <p className="text-white font-extrabold text-base">{bookingDetails.date}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Clock size={13} className="text-red-500" /> Suất chiếu
                        </p>
                        <p className="text-red-400 font-black text-base">{bookingDetails.showtime}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Ticket size={13} className="text-red-500" /> Ghế ngồi ({bookingDetails.seatNames?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {bookingDetails.seatNames?.map((seat) => (
                            <span key={seat} className="text-xs font-black bg-red-600/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md">
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Tag size={13} className="text-red-500" /> Tổng tiền
                        </p>
                        <p className="text-red-500 font-black text-lg">{formatPrice(bookingDetails.totalAmount)}</p>
                      </div>
                    </div>

                    {/* CONCESSIONS / BẮP NƯỚC SECTION */}
                    <div className="mb-6">
                      <p className="text-xs font-black uppercase text-gray-300 tracking-wider mb-3 flex items-center gap-2">
                        <Coffee size={15} className="text-red-500" /> Đồ ăn & Bắp nước đặt kèm:
                      </p>

                      {bookingDetails.concessions && bookingDetails.concessions.length > 0 ? (
                        <div className="space-y-2 bg-black/30 p-3.5 rounded-2xl border border-white/5">
                          {bookingDetails.concessions.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-gray-200 py-1 border-b border-white/5 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 font-extrabold flex items-center justify-center text-[10px] border border-red-500/30">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <span className="font-bold text-white">{item.name}</span>
                                  {item.size && (
                                    <span className="ml-2 text-[10px] text-red-400 bg-red-950/60 px-1.5 py-0.2 rounded border border-red-800/40 uppercase">
                                      Size {item.size}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="font-extrabold text-red-400">
                                {formatPrice(item.lineTotal || ((item.unitPrice || 0) * item.quantity))}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-center">
                          <p className="text-xs text-gray-500 italic">Không mua kèm bắp nước</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR & Barcode Section */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/20 p-4 rounded-2xl">
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-white mb-1">Quy định soát vé:</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Vui lòng đến rạp trước suất chiếu 15 phút. Xuất trình mã QR này trực tiếp trên điện thoại để nhân viên quét mã vào phòng chiếu.
                      </p>
                    </div>

                    <div className="flex flex-col items-center shrink-0 bg-white p-2 rounded-xl border-2 border-red-600 shadow-md">
                      <QRCodeSVG 
                        value={bookingDetails.id} 
                        size={96}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="M"
                        className="w-24 h-24 block" 
                      />
                      <span className="text-[9px] text-gray-800 font-mono font-bold mt-1 tracking-tighter">
                        {bookingDetails.id?.substring(0, 12).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT SECTION (Physical Stub Ticket Preview with Poster) - 4 Cols */}
                <div className="lg:col-span-4 bg-gradient-to-b from-[#181a28] to-[#0f101a] p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
                  
                  {/* Decorative Notch Circles for Stub Tear Effect */}
                  <div className="hidden lg:block absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#07080E] border-r border-red-500/30" />
                  <div className="hidden lg:block absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-[#07080E] border-r border-red-500/30" />

                  <div className="w-full flex flex-col items-center">
                    <div className="w-full max-w-[220px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-red-600/40 shadow-[0_10px_30px_rgba(229,9,20,0.3)] mb-4 group relative">
                      <img 
                        src={bookingDetails.posterUrl || 'https://via.placeholder.com/300x450?text=CineMate'} 
                        alt={bookingDetails.movieName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                      <span className="absolute bottom-2 left-2 right-2 text-[10px] font-extrabold text-white bg-red-600/80 backdrop-blur-sm py-1 rounded text-center uppercase tracking-widest">
                        PASS TICKET
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white mb-1 line-clamp-1">
                      {bookingDetails.movieName}
                    </h4>
                    <p className="text-xs text-gray-400 mb-4 font-mono">
                      MÃ: {bookingDetails.id?.substring(0, 10).toUpperCase()}
                    </p>

                    <div className="w-full bg-black/40 p-3 rounded-xl border border-white/5 space-y-1.5 text-xs text-left mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rạp:</span>
                        <span className="font-bold text-white">{bookingDetails.cinemaName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phòng:</span>
                        <span className="font-bold text-red-400">{bookingDetails.roomName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Suất:</span>
                        <span className="font-bold text-white">{bookingDetails.showtime} - {bookingDetails.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Copy Code & Quick Share */}
                  <div className="w-full space-y-2 no-print">
                    <button
                      onClick={handleCopyTicketCode}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      <span>{copied ? 'Đã sao chép vé!' : 'Sao chép thông tin vé'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons Bar */}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3.5 w-full max-w-xl mt-8 no-print"
          >
            <button 
              onClick={() => navigate('/profile', { state: { activeTab: 'tickets' } })} 
              className="flex-1 py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl font-black text-sm text-white transition-all shadow-[0_0_25px_rgba(229,9,20,0.5)] hover:shadow-[0_0_35px_rgba(229,9,20,0.8)] flex items-center justify-center gap-2 group cursor-pointer border-none"
            >
              <span>XEM VÉ CỦA TÔI</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={handlePrint} 
              className="py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-extrabold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={18} className="text-red-400" />
              <span>IN VÉ / LƯU PDF</span>
            </button>
          </motion.div>
        )}

      </div>
    </div>
  )
}

