import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Loader2, Download, Share2 } from 'lucide-react'
import { paymentService } from '../../services/paymentService'
import { bookingService } from '../../services/bookingService'

export default function CheckoutResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  
  const orderId = params.get('orderId')
  const resultCode = params.get('resultCode')
  
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [verificationState, setVerificationState] = useState('pending')
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
        const response = await paymentService.checkMomoPaymentStatus(orderId)
        const status = response.data?.result ?? response.data ?? {}
        const paymentStatus = String(status.paymentStatus || status.status || '').toUpperCase()
        const bookingStatus = String(status.bookingStatus || status.booking?.status || '').toUpperCase()
        const bookingId = status.bookingId || status.booking?.id || (orderId ? orderId.split('_')[1] : null)
        const isConfirmed = ['SUCCESS', 'COMPLETED', 'PAID'].includes(paymentStatus)
          || ['CONFIRMED', 'COMPLETED', 'PAID', 'HOLDING'].includes(bookingStatus)
          || resultCode === '0'

        if (isConfirmed && bookingId) {
          try {
            const bookingResponse = await bookingService.getById(bookingId)
            setBookingDetails(bookingResponse.data?.result || bookingResponse.data || null)
          } catch (ignored) {}
          setSuccess(true)
          setVerificationState('confirmed')
          setMessage('Thanh toán đã được hệ thống xác nhận.')
        } else if (resultCode && resultCode !== '0') {
          setVerificationState('failed')
          setMessage('Giao dịch đã bị hủy hoặc thanh toán thất bại.')
        } else {
          setVerificationState('pending')
          setMessage('Giao dịch đang được xác minh. Vui lòng kiểm tra lại vé của bạn sau ít phút.')
        }
      } catch {
        const bookingId = orderId ? orderId.split('_')[1] : null
        if (resultCode === '0' && bookingId) {
          try {
            const bookingResponse = await bookingService.getById(bookingId)
            setBookingDetails(bookingResponse.data?.result || bookingResponse.data || null)
          } catch (ignored) {}
          setSuccess(true)
          setVerificationState('confirmed')
          setMessage('Thanh toán đã được hệ thống xác nhận.')
        } else {
          setVerificationState('pending')
          setMessage('Chưa thể xác minh giao dịch. Vui lòng kiểm tra lại vé của bạn sau ít phút.')
        }
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

  const formatSeatsLeftText = (seats) => {
    if (!seats || seats.length === 0) return ''
    if (seats.length <= 4) return seats.join(', ')
    return `${seats[0]}, ${seats[1]}, ${seats[2]}... (+${seats.length - 3})`
  }

  const formatSeatsRightText = (seats) => {
    if (!seats || seats.length === 0) return ''
    if (seats.length <= 3) return seats.join(', ')
    return `${seats[0]}, ${seats[1]}... (+${seats.length - 2})`
  }

  return (
    <div className="min-h-screen bg-[#06080F] flex flex-col pt-24 pb-12 px-4 relative overflow-hidden font-sans">
      <style>{`
        .success-ticket-container {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          text-align: left;
        }
        @media (max-width: 768px) {
          .success-ticket-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .success-ticket-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.3);
          color: #4ade80;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 20px;
          width: fit-content;
          font-weight: 600;
        }
        .success-ticket-title {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 700;
          margin-top: 8px;
          color: white;
        }
        .success-ticket-sub {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          margin-top: 8px;
        }
        .success-ticket-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 20px;
        }
        .success-ticket-sc-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .success-ticket-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .success-ticket-row:last-of-type {
          border-bottom: none;
        }
        .success-ticket-label {
          color: rgba(255,255,255,0.45);
        }
        .success-ticket-val {
          color: white;
          font-weight: 500;
          text-align: right;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .success-ticket-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          margin-top: 6px;
          border-top: 1px solid rgba(255,255,255,0.12);
        }
        .success-ticket-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .success-ticket-btn-outline {
          flex: 1;
          padding: 12px;
          border-radius: 40px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          transition: all 0.2s;
        }
        .success-ticket-btn-outline:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.4);
          color: white;
        }
        .success-ticket-btn-primary {
          flex: 2;
          padding: 12px;
          border-radius: 40px;
          background: rgba(229,9,20,0.15);
          border: 2px solid var(--color-primary);
          font-size: 13px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }
        .success-ticket-btn-primary:hover {
          background: var(--color-primary);
          box-shadow: 0 0 16px rgba(229,9,20,0.3);
        }
        .success-ticket-right-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
        }
        .success-ticket-physical {
          background: #111;
          border: 2px solid var(--color-primary);
          border-radius: 20px;
          overflow: hidden;
          width: 320px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.6);
        }
        .success-ticket-physical-poster {
          width: 100%;
          height: 250px;
          object-fit: cover;
          display: block;
        }
        .success-ticket-physical-body {
          padding: 24px 22px 20px;
          text-align: center;
        }
        .success-ticket-physical-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }
        .success-ticket-physical-divider {
          border: none;
          border-top: 1px dashed rgba(255,255,255,0.2);
          margin: 16px 0;
        }
        .success-ticket-physical-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          text-align: left;
        }
        .stf-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 2px;
        }
        .stf-val {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        .success-ticket-physical-barcode-label {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 2px;
          margin-top: 12px;
          text-transform: uppercase;
        }
      `}</style>

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
            ) : verificationState === 'pending' ? (
              <Loader2 size={88} className="text-amber-400 relative z-10 animate-spin" strokeWidth={1.5} />
            ) : (
              <XCircle size={88} className="text-red-500 relative z-10 drop-shadow-2xl" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {success ? 'Thanh Toán Thành Công' : verificationState === 'pending' ? 'Đang Xác Minh Giao Dịch' : 'Giao Dịch Thất Bại'}
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            {message}
          </p>
        </motion.div>

        <AnimatePresence>
          {success && bookingDetails && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full relative mt-4"
            >
              <div className="success-ticket-container">
                {/* Left Column */}
                <div className="left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    onClick={() => navigate('/')}
                    className="back-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', width: 'fit-content' }}
                  >
                    <span>&larr; Quay về trang chủ</span>
                  </div>

                  <div>
                    <div className="success-ticket-badge">
                      <span className="material-symbols-outlined text-sm font-black">done</span>
                      Đặt vé thành công
                    </div>
                    <h2 className="success-ticket-title">Vé Xem Phim Di Động</h2>
                    <p className="success-ticket-sub text-left">
                      Khi mua vé xem phim thành công, bạn chỉ cần xuất trình mã vạch hoặc mã QR này tại cửa rạp để soát vé. Thông tin vé cũng đã được lưu trong lịch sử giao dịch.
                    </p>
                  </div>

                  <div className="success-ticket-card">
                    <div className="success-ticket-sc-title">Chi tiết đặt vé</div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Phim</span>
                      <span className="success-ticket-val" title={bookingDetails.movieName}>
                        {bookingDetails.movieName}
                      </span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Rạp</span>
                      <span className="success-ticket-val">
                        {bookingDetails.cinemaName} - {bookingDetails.roomName}
                      </span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">📅 Ngày chiếu</span>
                      <span className="success-ticket-val">{bookingDetails.date}</span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">⏰ Suất chiếu</span>
                      <span className="success-ticket-val">{bookingDetails.showtime}</span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Ghế ngồi</span>
                      <span
                        className="success-ticket-val"
                        title={bookingDetails.seatNames?.join(', ')}
                        style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {formatSeatsLeftText(bookingDetails.seatNames)}
                      </span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Số lượng</span>
                      <span className="success-ticket-val">{bookingDetails.seatNames?.length || 0} vé</span>
                    </div>

                    <div className="success-ticket-total-row">
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Tổng tiền đã thanh toán</span>
                      <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatPrice(bookingDetails.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="success-ticket-actions">
                    <button
                      className="success-ticket-btn-outline flex items-center justify-center gap-1.5"
                      onClick={() => alert('Vé đang được tải xuống thiết bị của bạn...')}
                    >
                      <Download size={14} /> Tải xuống
                    </button>
                    <button
                      className="success-ticket-btn-outline flex items-center justify-center gap-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(`Vé xem phim CineMate: ${bookingDetails.movieName} - Mã vé: ${bookingDetails.id}`)
                        alert('Đã sao chép liên kết chia sẻ vé vào khay nhớ tạm!')
                      }}
                    >
                      <Share2 size={14} /> Chia sẻ
                    </button>
                    <button
                      className="success-ticket-btn-primary flex items-center justify-center gap-1.5 border-none"
                      onClick={() => navigate('/profile', { state: { activeTab: 'tickets' } })}
                    >
                      <span>🎟</span> Xem vé của tôi
                    </button>
                  </div>
                </div>

                {/* Right Column (Ticket Preview) */}
                <div className="success-ticket-right-col">
                  <div className="success-ticket-physical">
                    <img 
                      className="success-ticket-physical-poster" 
                      src={bookingDetails.posterUrl || 'https://via.placeholder.com/320x250?text=Cinemate'} 
                      alt={bookingDetails.movieName} 
                    />
                    <div className="success-ticket-physical-body">
                      <div className="success-ticket-physical-title">{bookingDetails.movieName}</div>
                      <hr className="success-ticket-physical-divider" />
                      <div className="success-ticket-physical-fields">
                        <div className="success-ticket-physical-field">
                          <div className="stf-label">Ngày</div>
                          <div className="stf-val">
                            {new Date(bookingDetails.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                        <div className="success-ticket-physical-field">
                          <div className="stf-label">Giờ</div>
                          <div className="stf-val">{bookingDetails.showtime}</div>
                        </div>
                        <div className="success-ticket-physical-field">
                          <div className="stf-label">Ghế</div>
                          <div
                            className="stf-val"
                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={bookingDetails.seatNames?.join(', ')}
                          >
                            {formatSeatsRightText(bookingDetails.seatNames)}
                          </div>
                        </div>
                        <div className="success-ticket-physical-field">
                          <div className="stf-label">Số vé</div>
                          <div className="stf-val">{bookingDetails.seatNames?.length || 0}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center mt-6">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${bookingDetails.id}&bgcolor=ffffff&color=000000`} 
                          alt="QR Code" 
                          className="rounded p-2 bg-white" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="success-ticket-physical-barcode-label mt-4">SCAN AT ENTRANCE</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
