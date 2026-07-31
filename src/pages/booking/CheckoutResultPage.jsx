import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  CheckCircle2, XCircle, Loader2, ArrowRight, ArrowLeft, Calendar, Clock, MapPin, 
  Tag, Film, Ticket, Share2, Printer, Coffee, Sparkles, Copy, Check, ChevronLeft 
} from 'lucide-react'
import { paymentService } from '../../services/paymentService'
import { bookingService } from '../../services/bookingService'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

export default function CheckoutResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  
  const orderId = params.get('orderId')
  const vnpTxnRef = params.get('vnp_TxnRef')
  const paymentId = orderId || vnpTxnRef
  const resultCode = params.get('resultCode') || params.get('vnp_ResponseCode')
  
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [verificationState, setVerificationState] = useState('pending')
  const [message, setMessage] = useState('')
  const [bookingDetails, setBookingDetails] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!paymentId) {
      setLoading(false)
      setSuccess(false)
      setMessage('Không tìm thấy thông tin giao dịch.')
      return
    }

    const checkStatus = async () => {
      try {
        let response;
        if (vnpTxnRef) {
          // Pass the entire query string to backend for VNPay
          response = await paymentService.checkVnPayPaymentStatus(window.location.search)
        } else {
          response = await paymentService.checkMomoPaymentStatus(paymentId)
        }
        
        const status = response.data?.result ?? response.data ?? {}
        const paymentStatus = String(status.paymentStatus || status.status || '').toUpperCase()
        const bookingStatus = String(status.bookingStatus || status.booking?.status || '').toUpperCase()
        const bookingId = status.bookingId || status.booking?.id || (orderId ? orderId.split('_')[1] : null) || (vnpTxnRef ? vnpTxnRef.split('_')[1] : null)
        const isConfirmed = ['SUCCESS', 'COMPLETED', 'PAID'].includes(paymentStatus)
          || ['CONFIRMED', 'COMPLETED', 'PAID', 'HOLDING'].includes(bookingStatus)
          || resultCode === '0' || resultCode === '00'

        if (isConfirmed && bookingId) {
          try {
            const bookingResponse = await bookingService.getById(bookingId)
            setBookingDetails(bookingResponse.data?.result || bookingResponse.data || null)
          } catch (ignored) {}
          setSuccess(true)
          setVerificationState('confirmed')
          setMessage('Thanh toán đã được hệ thống xác nhận. Cảm ơn bạn đã đặt vé xem phim tại CineMate!')
        } else if (resultCode && resultCode !== '0' && resultCode !== '00') {
          setSuccess(false)
          setVerificationState('failed')
          setMessage('Giao dịch đã bị hủy hoặc thanh toán thất bại.')
        } else {
          setSuccess(false)
          setVerificationState('pending')
          setMessage('Giao dịch đang được xác minh. Vui lòng kiểm tra lại vé của bạn sau ít phút.')
        }
      } catch {
        const bookingId = orderId ? orderId.split('_')[1] : (vnpTxnRef ? vnpTxnRef.split('_')[1] : null)
        if (resultCode === '0' && bookingId) {
          try {
            const bookingResponse = await bookingService.getById(bookingId)
            setBookingDetails(bookingResponse.data?.result || bookingResponse.data || null)
          } catch (ignored) {}
          setSuccess(true)
          setVerificationState('confirmed')
          setMessage('Thanh toán đã được hệ thống xác nhận.')
        } else {
          setSuccess(false)
          setVerificationState('pending')
          setMessage('Chưa thể xác minh giao dịch. Vui lòng kiểm tra lại vé của bạn sau ít phút.')
        }
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [orderId, resultCode])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  const formatVietnameseDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' }).toUpperCase()
      const dayMonth = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      return weekday + ', ' + dayMonth
    } catch {
      return dateStr
    }
  }

  const seatCount = bookingDetails?.seatNames?.length || 0
  const concessionAmount = bookingDetails?.concessionAmount ?? (bookingDetails?.concessions || []).reduce((s, c) => s + (c.lineTotal || (c.unitPrice || 0) * c.quantity || 0), 0)
  let discountAmount = bookingDetails?.discountAmount || 0
  let ticketAmount = bookingDetails?.ticketAmount || 0
  const finalPrice = bookingDetails?.finalPrice ?? bookingDetails?.totalAmount ?? bookingDetails?.totalPrice ?? Math.max(0, ticketAmount + concessionAmount - discountAmount)

  if (ticketAmount <= 0 && seatCount > 0) {
    if (finalPrice > 0) {
      ticketAmount = Math.max(0, bookingDetails.totalAmount + discountAmount - concessionAmount)
    }
  }

  if (discountAmount <= 0 && (ticketAmount + concessionAmount) > (finalPrice || 0)) {
    discountAmount = (ticketAmount + concessionAmount) - bookingDetails.totalAmount
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
    <>
      <Navbar />
      <div className="min-h-screen bg-[#07080E] flex flex-col pt-4 md:pt-6 pb-6 px-4 relative overflow-hidden font-sans text-gray-100">
        
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
              padding: 12px !important;
            }
            .printable-ticket * {
              color: black !important;
              border-color: #ccc !important;
            }
          }
        `}</style>

        {/* Ambient Crimson Red Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] pointer-events-none opacity-30 z-0">
          <div className={`absolute top-[-60px] left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-gradient-to-b ${success ? 'from-red-600/30 via-red-900/15' : 'from-rose-950/40'} to-transparent blur-[80px]`} />
        </div>

        <div className="w-full max-w-4xl mx-auto z-10 flex flex-col items-center">

          {/* Back Link */}
          <div className="w-full mb-3 no-print text-left">
            <motion.button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10 active:scale-95 cursor-pointer border border-white/20 text-white bg-black/40 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={14} className="text-red-500 font-bold" />
              <span>Quay lại trang chủ</span>
            </motion.button>
          </div>

          {/* Status Header */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0, y: 8 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className="flex flex-col items-center text-center mb-2.5 no-print"
          >
            <div className="relative mb-1">
              <div className={`absolute inset-0 blur-lg ${success ? 'bg-emerald-500/40' : verificationState === 'pending' ? 'bg-amber-500/40' : 'bg-rose-600/40'} rounded-full`} />
              {success ? (
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] relative z-10 border border-emerald-400/40">
                  <CheckCircle2 size={22} strokeWidth={2.2} />
                </div>
              ) : verificationState === 'pending' ? (
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] relative z-10 border border-amber-400/40">
                  <Loader2 size={22} className="animate-spin" strokeWidth={2.2} />
                </div>
              ) : (
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-gray-800 to-rose-950 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] relative z-10 border border-rose-500/30">
                  <XCircle size={22} strokeWidth={2} />
                </div>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black mb-0.5 tracking-tight text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {success ? 'Thanh Toán Thành Công!' : verificationState === 'pending' ? 'Đang Xác Minh Giao Dịch' : 'Giao Dịch Thất Bại'}
            </h2>
            <p className="text-gray-400 text-[11px] md:text-xs max-w-md font-medium leading-tight">
              {message}
            </p>
          </motion.div>

          {/* Failed Transaction View */}
          {!success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-white/[0.03] border border-red-500/20 rounded-xl p-4 text-center shadow-xl no-print mb-4"
            >
              <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                {verificationState === 'pending'
                  ? 'Hệ thống chưa nhận được phản hồi từ MoMo. Bạn có thể kiểm tra lại vé trong trang Hồ sơ cá nhân sau ít phút.'
                  : 'Rất tiếc, giao dịch không thành công. Hệ thống không trừ tiền của bạn hoặc số tiền sẽ tự động hoàn lại theo quy định thanh toán.'}
              </p>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => navigate('/movies')} 
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(229,9,20,0.4)] cursor-pointer"
                >
                  Đặt lại vé khác
                </button>
                <button 
                  onClick={() => navigate('/')} 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.3 }}
                className="w-full printable-ticket"
              >
                {/* Main Physical Ticket Container */}
                <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#121420] border border-red-600/30 rounded-xl overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(229,9,20,0.1)] relative">

                  {/* LEFT SECTION (Main Ticket Details + Concessions) - 8 Cols */}
                  <div className="lg:col-span-8 p-3.5 md:p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-dashed border-red-500/20 relative">
                    
                    {/* Top Bar */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white shadow-[0_0_8px_rgba(229,9,20,0.5)] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} className="animate-pulse" /> VERIFIED PASS
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/5 text-red-400 border border-red-500/30 font-mono">
                            #{bookingDetails.id?.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium italic">
                          Xuất trình mã này tại quầy rạp
                        </span>
                      </div>

                      {/* Movie Title & Cinema Info */}
                      <div className="mb-2.5">
                        <h3 className="text-lg md:text-xl font-black text-white mb-0.5 leading-tight tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {bookingDetails.movieName}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-red-400 font-semibold">
                          <MapPin size={13} className="shrink-0 text-red-500" />
                          <span>{bookingDetails.cinemaName || 'Cinemate Center'} — <strong className="text-white">{bookingDetails.roomName || 'Phòng chiếu'}</strong></span>
                        </div>
                      </div>

                      {/* Show Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5 mb-2.5">
                        <div>
                          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Calendar size={10} className="text-red-500" /> Ngày chiếu
                          </p>
                          <p className="text-white font-extrabold text-xs">{bookingDetails.date}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Clock size={10} className="text-red-500" /> Suất chiếu
                          </p>
                          <p className="text-red-400 font-black text-xs">{bookingDetails.showtime}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Ticket size={10} className="text-red-500" /> Ghế ({seatCount})
                          </p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {bookingDetails.seatNames?.map((seat) => (
                              <span key={seat} className="text-[10px] font-black bg-red-600/20 text-red-300 border border-red-500/40 px-1 py-0.2 rounded">
                                {seat}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Tag size={10} className="text-red-500" /> Tổng tiền
                          </p>
                          <p className="text-red-500 font-black text-sm">{formatPrice(finalPrice)}</p>
                        </div>
                      </div>

                      {/* CONCESSIONS / BẮP NƯỚC SECTION */}
                      <div className="mb-2.5">
                        <p className="text-[10px] font-black uppercase text-gray-300 tracking-wider mb-1.5 flex items-center gap-1">
                          <Coffee size={12} className="text-red-500" /> Đồ ăn & Bắp nước đặt kèm:
                        </p>

                        {bookingDetails.concessions && bookingDetails.concessions.length > 0 ? (
                          <div className="space-y-1 bg-black/30 p-2 rounded-lg border border-white/5">
                            {bookingDetails.concessions.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] text-gray-200 py-0.5 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4.5 h-4.5 rounded bg-red-600/20 text-red-400 font-extrabold flex items-center justify-center text-[9px] border border-red-500/30">
                                    {item.quantity}x
                                  </span>
                                  <div>
                                    <span className="font-bold text-white">{item.name}</span>
                                    {item.size && (
                                      <span className="ml-1 text-[8px] text-red-400 bg-red-950/60 px-1 py-0.2 rounded border border-red-800/40 uppercase">
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
                          <div className="p-1.5 bg-black/20 rounded-lg border border-white/5 text-center">
                            <p className="text-[10px] text-gray-500 italic">Không mua kèm bắp nước</p>
                          </div>
                        )}
                      </div>

                      {/* BILL SUMMARY BREAKDOWN / HÓA ĐƠN CHI TIẾT */}
                      <div className="mb-2.5 bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1.5 text-[10px]">
                        <p className="font-extrabold uppercase text-gray-300 tracking-wider flex items-center gap-1 border-b border-white/10 pb-1 text-[10px]">
                          <Tag size={11} className="text-red-500" /> Chi tiết thanh toán:
                        </p>

                        {/* Tiền ghế */}
                        <div className="flex justify-between items-center text-gray-300">
                          <span>Tiền vé ghế ({seatCount} ghế):</span>
                          <span className="font-bold text-white">
                            {formatPrice(ticketAmount)}
                          </span>
                        </div>

                        {/* Tiền bắp nước */}
                        {((concessionAmount > 0) || (bookingDetails.concessions && bookingDetails.concessions.length > 0)) && (
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Bắp nước & Đồ ăn:</span>
                            <span className="font-bold text-white">
                              {formatPrice(concessionAmount)}
                            </span>
                          </div>
                        )}

                        {/* Số tiền đã giảm */}
                        {discountAmount > 0 && (
                          <div className="flex justify-between items-center text-emerald-400 font-medium">
                            <span>Mã giảm giá {bookingDetails.promotionCode ? `(${bookingDetails.promotionCode})` : ""}:</span>
                            <span className="font-extrabold">
                              -{formatPrice(discountAmount)}
                            </span>
                          </div>
                        )}

                        {/* Tổng thanh toán thực tế */}
                        <div className="flex justify-between items-center pt-1.5 border-t border-white/10 text-xs font-black">
                          <span className="uppercase text-white">Tổng tiền đã thanh toán:</span>
                          <span className="text-red-500 text-sm font-mono">{formatPrice(finalPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {/* QR & Barcode Section */}
                    <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-black/20 p-2 rounded-lg">
                      <div className="flex-1 text-left">
                        <p className="text-[10px] font-bold text-white mb-0.5">Quy định soát vé:</p>
                        <p className="text-[9px] text-gray-400 leading-tight">
                          Vui lòng đến rạp trước 15 phút và xuất trình mã QR này trên điện thoại để quét mã vào phòng chiếu.
                        </p>
                      </div>

                      <div className="flex flex-col items-center shrink-0 bg-white p-1 rounded-md border border-red-600 shadow-xs">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=65x65&data=${bookingDetails.id}&bgcolor=ffffff&color=000000`} 
                          alt="Mã QR Soát Vé" 
                          className="w-14 h-14 block" 
                        />
                        <span className="text-[7.5px] text-gray-800 font-mono font-bold mt-0.5 tracking-tighter">
                          {bookingDetails.id?.substring(0, 12).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SECTION (Physical Stub Ticket Preview with Poster) - 4 Cols */}
                  <div className="lg:col-span-4 bg-gradient-to-b from-[#181a28] to-[#0f101a] p-3 flex flex-col items-center justify-between text-center relative overflow-hidden">
                    
                    {/* Decorative Notch Circles for Stub Tear Effect */}
                    <div className="hidden lg:block absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-[#07080E] border-r border-red-500/30" />
                    <div className="hidden lg:block absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full bg-[#07080E] border-r border-red-500/30" />

                    <div className="w-full flex flex-col items-center">
                      <div className="w-full max-w-[110px] aspect-[2/3] rounded-lg overflow-hidden border border-red-600/40 shadow-[0_6px_15px_rgba(229,9,20,0.2)] mb-2 group relative">
                        <img 
                          src={bookingDetails.posterUrl || 'https://via.placeholder.com/300x450?text=CineMate'} 
                          alt={bookingDetails.movieName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        <span className="absolute bottom-1 left-1 right-1 text-[8px] font-extrabold text-white bg-red-600/80 backdrop-blur-sm py-0.5 rounded text-center uppercase tracking-widest">
                          PASS TICKET
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mb-0.5 line-clamp-1">
                        {bookingDetails.movieName}
                      </h4>
                      <p className="text-[9px] text-gray-400 mb-1.5 font-mono">
                        MÃ: {bookingDetails.id?.substring(0, 10).toUpperCase()}
                      </p>

                      <div className="w-full bg-black/40 p-2 rounded-md border border-white/5 space-y-0.5 text-[10px] text-left mb-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rạp:</span>
                          <span className="font-bold text-white truncate max-w-[100px]">{bookingDetails.cinemaName}</span>
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
                    <div className="w-full space-y-1 no-print">
                      <button
                        onClick={handleCopyTicketCode}
                        className="w-full py-1.5 px-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm mt-3.5 no-print"
            >
              <button 
                onClick={() => navigate('/profile', { state: { activeTab: 'booked' } })} 
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg font-extrabold text-xs text-white transition-all shadow-[0_0_15px_rgba(229,9,20,0.4)] hover:shadow-[0_0_22px_rgba(229,9,20,0.7)] flex items-center justify-center gap-1.5 group cursor-pointer border-none"
              >
                <span>XEM VÉ CỦA TÔI</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={handlePrint} 
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} className="text-red-400" />
                <span>IN VÉ / LƯU PDF</span>
              </button>
            </motion.div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}

