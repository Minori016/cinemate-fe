import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookingService } from '../../services/bookingService'
import { motion } from 'motion/react'

export default function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Get data transferred from BookingConfirmationPage
  const { bookingInfo = {}, profile = {}, bookingId = '' } = location.state || {}

  const [paymentMethod, setPaymentMethod] = useState('card') // 'card', 'momo', 'atm'
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

  // Validation & Submission States
  const [valErrors, setValErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [submitError, setSubmitError] = useState('')

  // Simulation Setting (AC-04 retry testing)
  const [simulatedOutcome, setSimulatedOutcome] = useState('success')

  useEffect(() => {
    // If essential data is missing, redirect back to home or showtimes
    if (!bookingInfo.movie || !bookingInfo.seats || bookingInfo.seats.length === 0 || !bookingId) {
      navigate('/showtimes')
    }
  }, [bookingInfo, bookingId, navigate])

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

  // Handle formatted inputs
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
    if (valErrors.cardNumber) {
      setValErrors(prev => ({ ...prev, cardNumber: '' }))
    }
  }

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2)
    }
    setExpiryDate(value)
    if (valErrors.expiryDate) {
      setValErrors(prev => ({ ...prev, expiryDate: '' }))
    }
  }

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3)
    setCvv(value)
    if (valErrors.cvv) {
      setValErrors(prev => ({ ...prev, cvv: '' }))
    }
  }

  const handleCardHolderChange = (e) => {
    const value = e.target.value.toUpperCase()
    setCardHolder(value)
    if (valErrors.cardHolder) {
      setValErrors(prev => ({ ...prev, cardHolder: '' }))
    }
  }

  const validateCardDetails = () => {
    const errors = {}

    if (paymentMethod === 'card') {
      const rawCardNum = cardNumber.replace(/\s/g, '')
      if (rawCardNum.length !== 16) {
        errors.cardNumber = 'Số thẻ không hợp lệ. Vui lòng nhập đủ 16 chữ số.'
      }

      if (!cardHolder.trim()) {
        errors.cardHolder = 'Tên chủ thẻ không được để trống.'
      } else if (!/^[A-Z\s]+$/.test(cardHolder)) {
        errors.cardHolder = 'Tên chủ thẻ viết hoa không dấu và chỉ chứa chữ cái.'
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        errors.expiryDate = 'Ngày hết hạn không đúng định dạng MM/YY.'
      } else {
        const [month, year] = expiryDate.split('/').map(Number)
        // Hardcode current system dates context (2026-06)
        const currentYear = 26
        const currentMonth = 6
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          errors.expiryDate = 'Thẻ đã hết hạn sử dụng.'
        }
      }

      if (cvv.length !== 3) {
        errors.cvv = 'Mã bảo mật CVV/CVC phải chứa đúng 3 chữ số.'
      }
    }

    setValErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitPayment = async (e) => {
    if (e) e.preventDefault()
    setSubmitError('')

    // 1. Validate credentials if credit card method is chosen (AC-02)
    if (paymentMethod === 'card' && !validateCardDetails()) {
      return
    }

    setSubmitting(true)

    // 2. Simulate progressive payment gateway steps (AC-01 / AC-02 security vibe)
    const steps = [
      'Đang mã hóa thông tin thẻ giao dịch...',
      'Đang gửi yêu cầu xác thực bảo mật tới Ngân hàng phát hành...',
      'Đang xử lý kết quả giao dịch thanh toán...'
    ]

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i])
      await new Promise((resolve) => setTimeout(resolve, 600))
    }

    // 3. Evaluate simulated outcome (AC-04 Retry option / AC-03 Success option)
    if (simulatedOutcome !== 'success') {
      setSubmitting(false)
      setProcessingStep('')
      if (simulatedOutcome === 'fail_funds') {
        setSubmitError('Thanh toán thất bại: Số dư tài khoản không đủ để thực hiện giao dịch.')
      } else if (simulatedOutcome === 'fail_cvv') {
        setSubmitError('Thanh toán thất bại: Mã bảo mật CVV/CVC không hợp lệ.')
      } else if (simulatedOutcome === 'fail_expired') {
        setSubmitError('Thanh toán thất bại: Thẻ đã hết hạn sử dụng hoặc bị khóa.')
      } else {
        setSubmitError('Thanh toán thất bại: Hết thời gian kết nối với cổng thanh toán ngân hàng.')
      }
      return
    }

    // 4. Successful Flow: Mark as Confirmed and Generate Ticket (AC-03)
    const payload = {
      bookingId: bookingId,
      movieId: bookingInfo.movieId,
      movieName: bookingInfo.movie?.movieNameVn || bookingInfo.movie?.movieName || '',
      showTime: bookingInfo.time,
      showDate: bookingInfo.date,
      seats: bookingInfo.seats,
      totalPrice: bookingInfo.totalPrice,
      room: bookingInfo.screen || 'Phòng Chiếu 03 (IMAX)',
      fullName: profile?.fullName || '',
      email: profile?.email || '',
      identityCard: profile?.identityCard || '',
      phoneNumber: profile?.phoneNumber || ''
    }

    try {
      // Create backend entity
      await bookingService.create(payload)
    } catch (err) {
      console.warn('Backend service offline. Proceeding with mock data storage save.', err)
    } finally {
      // Save booking in local storage database (AC-03, AC-05 verification)
      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      const newBooking = {
        id: bookingId,
        movie: bookingInfo.movie?.movieNameVn || bookingInfo.movie?.movieName || '',
        screen: bookingInfo.screen || 'Phòng Chiếu 03 (IMAX)',
        date: bookingInfo.date ? (bookingInfo.date === 'Hôm nay'
          ? new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : new Date(bookingInfo.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        ) : '17/06/2026',
        time: bookingInfo.time,
        seats: bookingInfo.seats?.join(', ') || '',
        price: getSeatPrice(bookingInfo.seats?.[0] || 'A1'),
        total: bookingInfo.totalPrice,
        convertTickets: bookingInfo.convertTickets || 0,
        scoreUsed: bookingInfo.scoreUsed || 0,
        memberId: profile?.memberId || 'MEM-' + Math.floor(100000 + Math.random() * 900000),
        customerName: profile?.fullName || '',
        phone: profile?.phoneNumber || '',
        email: profile?.email || '',
        idCard: profile?.identityCard || '012345678901',
        status: 'Đã thanh toán', // Confirmed booking status indicator
        checkedIn: false,
        checkInTime: null
      }

      localStorage.setItem('staff_bookings_db', JSON.stringify([newBooking, ...localBookings]))

      // Navigate to success screen
      navigate('/booking/success', { 
        state: { 
          ...bookingInfo, 
          profile, 
          bookingId, 
          paymentMethodLabel: paymentMethod === 'card' ? 'Thẻ Tín dụng / Ghi nợ' : paymentMethod === 'momo' ? 'Ví MoMo' : 'Chuyển khoản Ngân hàng (ATM)'
        } 
      })
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
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold step-done bg-[#06080F]">
              <span className="material-symbols-outlined text-sm font-black">done</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-green-500">Xác nhận</span>
          </div>
          
          <div className="h-0.5 flex-1 bg-green-500 mx-2 self-start mt-4"></div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold step-active bg-[#06080F]">
              3
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-primary)]">Thanh toán</span>
          </div>
          
          <div className="h-0.5 flex-1 bg-gray-700 mx-2 self-start mt-4"></div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold step-inactive bg-[#06080F]">
              4
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Thành công</span>
          </div>
        </div>

        {/* Payment Error alert (AC-04 retry logic) */}
        {submitError && (
          <div className="w-full mb-6 p-4 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400 flex items-center gap-3 shadow-lg animate-fade-in text-left">
            <span className="material-symbols-outlined text-3xl font-bold shrink-0">error</span>
            <div>
              <p className="font-bold text-base">{submitError}</p>
              <p className="text-xs text-red-400/80 mt-0.5">Vui lòng kiểm tra lại thông tin, thử lại hoặc sử dụng phương thức thanh toán khác.</p>
            </div>
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
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl flex flex-col gap-6 w-full">
              <h3 className="custom-font-title text-xl text-[var(--color-primary)] uppercase tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">shield_lock</span>
                Cổng thanh toán an toàn (Secure Payment Gateway)
              </h3>

              {/* Payment Method Selector Tab Buttons */}
              <div className="grid grid-cols-3 gap-2 bg-[#121414] p-1.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('card')
                    setSubmitError('')
                  }}
                  className={`py-3 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1.5 border-none outline-none cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white/10 text-white shadow-md'
                      : 'text-gray-400 hover:text-white bg-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined">credit_card</span>
                  <span>Thẻ tín dụng/ghi nợ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('momo')
                    setSubmitError('')
                  }}
                  className={`py-3 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1.5 border-none outline-none cursor-pointer ${
                    paymentMethod === 'momo'
                      ? 'bg-white/10 text-white shadow-md'
                      : 'text-gray-400 hover:text-white bg-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined">qr_code_2</span>
                  <span>Ví MoMo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('atm')
                    setSubmitError('')
                  }}
                  className={`py-3 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1.5 border-none outline-none cursor-pointer ${
                    paymentMethod === 'atm'
                      ? 'bg-white/10 text-white shadow-md'
                      : 'text-gray-400 hover:text-white bg-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined">account_balance</span>
                  <span>Chuyển khoản / ATM</span>
                </button>
              </div>

              {/* Credit/Debit Card Form Layout */}
              {paymentMethod === 'card' && (
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  {/* Card Number Input (AC-01 credential secure handling) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Số thẻ tín dụng / ghi nợ (Card Number)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4000 1234 5678 9010"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        disabled={submitting}
                        className={`w-full bg-black/40 border rounded-xl py-3.5 pl-4 pr-12 text-sm text-white font-mono placeholder-gray-600 outline-none transition-all ${
                          valErrors.cardNumber ? 'border-red-500/80 focus:border-red-500' : 'border-white/10 focus:border-red-500/40'
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined select-none">
                        credit_card
                      </span>
                    </div>
                    {valErrors.cardNumber && (
                      <span className="text-[10px] text-red-500 font-bold mt-0.5">{valErrors.cardNumber}</span>
                    )}
                  </div>

                  {/* Cardholder Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tên in trên thẻ (Cardholder Name)</label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      value={cardHolder}
                      onChange={handleCardHolderChange}
                      disabled={submitting}
                      className={`w-full bg-black/40 border rounded-xl py-3.5 px-4 text-sm text-white font-semibold placeholder-gray-600 uppercase outline-none transition-all ${
                        valErrors.cardHolder ? 'border-red-500/80 focus:border-red-500' : 'border-white/10 focus:border-red-500/40'
                      }`}
                    />
                    {valErrors.cardHolder && (
                      <span className="text-[10px] text-red-500 font-bold mt-0.5">{valErrors.cardHolder}</span>
                    )}
                  </div>

                  {/* Expiry Date & CVV Row (AC-01 CVV masked input) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hạn sử dụng (Expiry Date)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        disabled={submitting}
                        className={`w-full bg-black/40 border rounded-xl py-3.5 px-4 text-sm text-white font-semibold placeholder-gray-600 outline-none transition-all text-center ${
                          valErrors.expiryDate ? 'border-red-500/80 focus:border-red-500' : 'border-white/10 focus:border-red-500/40'
                        }`}
                      />
                      {valErrors.expiryDate && (
                        <span className="text-[10px] text-red-500 font-bold mt-0.5">{valErrors.expiryDate}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mã bảo mật (CVV / CVC)</label>
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="***"
                          value={cvv}
                          onChange={handleCvvChange}
                          disabled={submitting}
                          maxLength={3}
                          className={`w-full bg-black/40 border rounded-xl py-3.5 px-4 text-sm text-white font-semibold placeholder-gray-600 outline-none transition-all text-center ${
                            valErrors.cvv ? 'border-red-500/80 focus:border-red-500' : 'border-white/10 focus:border-red-500/40'
                          }`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined select-none text-base">
                          lock
                        </span>
                      </div>
                      {valErrors.cvv && (
                        <span className="text-[10px] text-red-500 font-bold mt-0.5">{valErrors.cvv}</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#121414] p-3.5 rounded-xl border border-white/5 flex gap-2.5 items-start mt-2">
                    <span className="material-symbols-outlined text-[#10b981] text-lg mt-0.5">check_circle</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Thông tin tài khoản của bạn được mã hóa an toàn qua tiêu chuẩn bảo mật PCI-DSS lớp cao nhất. Chúng tôi không lưu trữ thông tin CVV hay mật khẩu thẻ trên hệ thống.
                    </p>
                  </div>
                </form>
              )}

              {/* MoMo QR Mockup UI */}
              {paymentMethod === 'momo' && (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl bg-black/20 text-center space-y-4">
                  <div className="bg-white p-3 rounded-2xl shadow-xl w-40 h-40 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MoMoPaymentStar" 
                      alt="MoMo QR Code" 
                      className="w-36 h-36 object-contain"
                    />
                    {/* Floating Momo Logo Badge inside center of QR for realistic look */}
                    <div className="absolute w-8 h-8 bg-[#a50064] rounded-lg border-2 border-white flex items-center justify-center text-[10px] font-black text-white select-none">M</div>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-bold text-white">Quét mã QR bằng ứng dụng MoMo</p>
                    <p className="text-xs text-gray-400 max-w-xs leading-normal">
                      Mở ứng dụng Ví điện tử MoMo của bạn, chọn chức năng "Quét mã" để quét mã và thực hiện thanh toán.
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Transfer QR Mockup UI */}
              {paymentMethod === 'atm' && (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl bg-black/20 text-center space-y-4">
                  <div className="bg-white p-3 rounded-2xl shadow-xl w-40 h-40 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VietQRStarBankTransfer" 
                      alt="VietQR ATM Code" 
                      className="w-36 h-36 object-contain"
                    />
                    <div className="absolute w-8 h-8 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-[8px] font-black text-white select-none">QR</div>
                  </div>
                  <div className="space-y-2 text-center text-xs">
                    <p className="font-bold text-sm text-white">Chuyển khoản VietQR tiện lợi</p>
                    <div className="bg-[#121414] p-3 rounded-xl border border-white/5 space-y-1.5 font-mono text-left w-full max-w-xs mx-auto">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-500">NGÂN HÀNG:</span>
                        <span className="text-white font-bold">MBBANK (Quân Đội)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-500">SỐ TÀI KHOẢN:</span>
                        <span className="text-red-400 font-bold select-all">190202606179</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-500">SỐ TIỀN:</span>
                        <span className="text-white font-bold">{formatCurrency(bookingInfo.totalPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-500">NỘI DUNG:</span>
                        <span className="text-red-400 font-bold select-all">{bookingId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULATED GATEWAY TESTER COMPONENT (Extremely useful for AC-04 verification) */}
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm">
                  <span className="material-symbols-outlined text-lg">science</span>
                  <span>Mô phỏng phản hồi Cổng thanh toán (Simulator Setting)</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Vui lòng chọn kết quả giả lập bên dưới để kiểm thử tính năng hoàn tác/thử lại khi lỗi thanh toán (AC-04) hoặc xác nhận thành công (AC-03).
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Trạng thái mô phỏng</span>
                    <select
                      value={simulatedOutcome}
                      onChange={(e) => {
                        setSimulatedOutcome(e.target.value)
                        setSubmitError('')
                      }}
                      className="bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer w-full font-medium"
                    >
                      <option value="success">Thanh toán Thành công (AC-03)</option>
                      <option value="fail_funds">Thất bại - Số dư tài khoản không đủ (AC-04)</option>
                      <option value="fail_cvv">Thất bại - Mã CVV/CVC không hợp lệ (AC-04)</option>
                      <option value="fail_expired">Thất bại - Thẻ tín dụng hết hạn (AC-04)</option>
                      <option value="fail_timeout">Thất bại - Hết thời gian kết nối ATM (AC-04)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Pay Now Button */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={submitting}
                  className="w-full bg-[var(--color-primary)] hover:bg-red-700 text-white font-black text-base py-4 rounded-xl shadow-[0_4px_20px_rgba(229,9,20,0.35)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer border-none"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      <span>{processingStep || 'Đang xử lý đặt vé...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg font-black">lock</span>
                      Thanh toán {formatCurrency(bookingInfo.totalPrice || 0)}
                    </>
                  )}
                </button>
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
                Tóm tắt vé đặt (Booking Summary)
              </h3>

              {bookingInfo.movie && (
                <div className="flex gap-4 items-start border-b border-white/5 pb-5">
                  {bookingInfo.movie?.image && (
                    <img 
                      src={bookingInfo.movie.image} 
                      alt={bookingInfo.movie.movieNameVn} 
                      className="w-16 h-24 object-cover rounded-lg border border-white/10 shadow-md shrink-0" 
                    />
                  )}
                  <div>
                    <h4 className="text-base font-bold text-white tracking-wide leading-tight">
                      {bookingInfo.movie?.movieNameVn}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-semibold tracking-wider mt-1 uppercase">
                      {bookingInfo.movie?.movieName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 bg-red-600/10 border border-red-500/20 rounded-md py-0.5 px-2 w-fit">
                      <span className="text-[9px] font-black text-red-500">T18</span>
                    </div>
                  </div>
                </div>
              )}

              {/* All fields displayed as read-only labels */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Mã vé đặt (Booking ID)</span>
                    <p className="text-white font-mono font-bold mt-0.5 select-all">{bookingId}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Phòng chiếu (Screen)</span>
                    <p className="text-white font-semibold mt-0.5">{bookingInfo.screen || 'Phòng Chiếu 03 (IMAX)'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Ngày chiếu (Date)</span>
                    <p className="text-white font-semibold mt-0.5">
                      {bookingInfo.date ? (bookingInfo.date === 'Hôm nay'
                        ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
                        : new Date(bookingInfo.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Suất chiếu (Time)</span>
                    <p className="text-white font-semibold mt-0.5">{bookingInfo.time || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-b border-white/5 pb-3">
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Danh sách ghế ngồi (Seats)</span>
                  <p className="text-[var(--color-primary)] font-black text-sm mt-0.5 tracking-wider font-mono">
                    {bookingInfo.seats?.join(', ') || 'Chưa chọn ghế'}
                  </p>
                </div>

                {/* Combos list details */}
                {bookingInfo.combos && bookingInfo.combos.length > 0 && (
                  <div className="border-b border-white/5 pb-3">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Bắp nước (Popcorn & Drinks)</span>
                    <div className="flex flex-col gap-1 mt-0.5 font-semibold text-xs text-white">
                      {bookingInfo.combos.map((combo, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                          <span>{combo.name} (×{combo.qty})</span>
                          <span className="font-mono font-medium">{formatCurrency(combo.price * combo.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Price & Security Verification */}
                <div className="pt-2 flex justify-between items-end border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Hình thức thanh toán</span>
                    <p className="text-gray-300 mt-0.5 font-medium">
                      {paymentMethod === 'card' ? 'Thẻ Tín dụng / Ghi nợ' : paymentMethod === 'momo' ? 'Ví MoMo' : 'Chuyển khoản MBBank'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Tổng cộng (Total)</span>
                    <p className="text-lg font-black text-[var(--color-primary)] font-mono mt-0.5">
                      {formatCurrency(bookingInfo.totalPrice || 0)}
                    </p>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="material-symbols-outlined text-[#10b981] text-base">verified_user</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Thanh toán bảo mật SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="material-symbols-outlined text-[#10b981] text-base">lock_open</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">PCI-DSS Compliant Gateway</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </main>
    </motion.div>
  )
}
