import { motion } from 'motion/react'

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)',
      }}
    >
      {children}
    </div>
  )
}

export default function PaymentStep({
  movie,
  bookingId,
  selectedDate,
  selectedTime,
  selectedSeats,
  seatLabels,
  roomName,
  totalPrice,
  paymentMethod,
  setPaymentMethod,
  cardNumber,
  handleCardNumberChange,
  cardHolder,
  handleCardHolderChange,
  expiryDate,
  handleExpiryChange,
  cvv,
  handleCvvChange,
  valErrors,
  submitting,
  processingStep,
  submitError,
  setSubmitError,
  simulatedOutcome,
  setSimulatedOutcome,
  handleSubmitPayment
}) {
  const displaySeats = (Array.isArray(seatLabels) && seatLabels.length > 0)
    ? seatLabels
    : (selectedSeats || [])
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hôm nay') return 'Hôm nay'
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      {/* Error banner */}
      {submitError && (
        <div
          className="mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in animate-duration-300"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171'
          }}
        >
          <span className="material-symbols-outlined text-3xl shrink-0">error</span>
          <div>
            <p className="font-bold">{submitError}</p>
            <p className="text-xs mt-0.5 opacity-80">Vui lòng kiểm tra lại thông tin hoặc thử phương thức thanh toán khác.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 text-left">
        {/* Left — Payment Form */}
        <div className="flex-1">
          <GlassCard className="p-6 md:p-8">
            <h3 className="font-extrabold text-lg text-white uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">shield_lock</span>
              Cổng thanh toán an toàn
            </h3>

            {/* Payment method tabs */}
            <div
              className="grid grid-cols-3 gap-2 p-1.5 rounded-xl mb-6"
              style={{ background: '#121414', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {[
                { id: 'card', icon: 'credit_card', label: 'Thẻ tín dụng/ghi nợ' },
                { id: 'momo', icon: 'qr_code_2', label: 'Ví MoMo' },
                { id: 'atm', icon: 'account_balance', label: 'Chuyển khoản / ATM' },
              ].map(({ id, icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(id)
                    setSubmitError('')
                  }}
                  className={`py-3 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer border-none outline-none ${
                    paymentMethod === id ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Số thẻ (Card Number)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      disabled={submitting}
                      className={`inline-input pr-12 font-mono ${valErrors.cardNumber ? 'error' : ''}`}
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 select-none">credit_card</span>
                  </div>
                  {valErrors.cardNumber && <span className="text-[10px] text-red-500 font-bold">{valErrors.cardNumber}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tên in trên thẻ (Cardholder Name)</label>
                  <input
                    type="text"
                    placeholder="NGUYEN VAN A"
                    value={cardHolder}
                    onChange={handleCardHolderChange}
                    disabled={submitting}
                    className={`inline-input uppercase font-semibold ${valErrors.cardHolder ? 'error' : ''}`}
                  />
                  {valErrors.cardHolder && <span className="text-[10px] text-red-500 font-bold">{valErrors.cardHolder}</span>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hạn dùng (MM/YY)</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      disabled={submitting}
                      className={`inline-input text-center ${valErrors.expiryDate ? 'error' : ''}`}
                    />
                    {valErrors.expiryDate && <span className="text-[10px] text-red-500 font-bold">{valErrors.expiryDate}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">CVV / CVC</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="***"
                        value={cvv}
                        onChange={handleCvvChange}
                        disabled={submitting}
                        maxLength={3}
                        className={`inline-input text-center pr-12 ${valErrors.cvv ? 'error' : ''}`}
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 select-none text-base">lock</span>
                    </div>
                    {valErrors.cvv && <span className="text-[10px] text-red-500 font-bold">{valErrors.cvv}</span>}
                  </div>
                </div>
                <div
                  className="flex gap-2.5 items-start p-3 rounded-xl"
                  style={{ background: '#121414', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="material-symbols-outlined text-green-500 text-lg mt-0.5">check_circle</span>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Thông tin được mã hóa an toàn theo chuẩn PCI-DSS. Chúng tôi không lưu trữ CVV hay mật khẩu thẻ.</p>
                </div>
              </div>
            )}

            {/* MoMo QR */}
            {paymentMethod === 'momo' && (
              <div
                className="flex flex-col items-center gap-4 p-6 rounded-2xl text-center"
                style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
              >
                <div className="bg-white p-3 rounded-2xl shadow-xl w-36 h-36 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MoMoPaymentCineMate"
                    alt="MoMo QR"
                    className="w-32 h-32 object-contain"
                  />
                  <div
                    className="absolute w-8 h-8 rounded-lg border-2 border-white flex items-center justify-center text-[10px] font-black text-white select-none"
                    style={{ background: '#a50064' }}
                  >
                    M
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Quét mã QR bằng ứng dụng MoMo</p>
                  <p className="text-[10px] text-gray-400 max-w-xs mt-1 leading-relaxed">Mở app MoMo → Quét mã → Xác nhận thanh toán.</p>
                </div>
              </div>
            )}

            {/* ATM/Bank Transfer */}
            {paymentMethod === 'atm' && (
              <div
                className="flex flex-col items-center gap-4 p-6 rounded-2xl text-center"
                style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
              >
                <div className="bg-white p-3 rounded-2xl shadow-xl w-36 h-36 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VietQRCineMateTransfer"
                    alt="VietQR"
                    className="w-32 h-32 object-contain"
                  />
                  <div className="absolute w-8 h-8 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-[8px] font-black text-white select-none">
                    QR
                  </div>
                </div>
                <div
                  className="w-full text-[11px] rounded-xl p-3 font-mono space-y-1.5 text-left"
                  style={{ background: '#121414', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex justify-between">
                    <span className="text-gray-500">NGÂN HÀNG:</span>
                    <span className="text-white font-bold">MBBANK (Quân Đội)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SỐ TÀI KHOẢN:</span>
                    <span className="text-[var(--color-primary)] font-bold select-all">190202606179</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SỐ TIỀN:</span>
                    <span className="text-white font-bold">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">NỘI DUNG:</span>
                    <span className="text-[var(--color-primary)] font-bold select-all">{bookingId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Simulator */}
            <div
              className="mt-6 p-4 rounded-2xl space-y-3"
              style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.2)' }}
            >
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs">
                <span className="material-symbols-outlined text-base">science</span>
                Mô phỏng cổng thanh toán (Simulator)
              </div>
              <select
                value={simulatedOutcome}
                onChange={(e) => {
                  setSimulatedOutcome(e.target.value)
                  setSubmitError('')
                }}
                className="w-full rounded-lg py-2.5 px-3 bg-black/40 border border-white/10 text-[11px] text-white cursor-pointer focus:outline-none"
              >
                <option value="success">Thanh toán Thành công ✓</option>
                <option value="fail_funds">Thất bại — Số dư không đủ</option>
                <option value="fail_cvv">Thất bại — CVV/CVC không hợp lệ</option>
                <option value="fail_expired">Thất bại — Thẻ hết hạn</option>
                <option value="fail_timeout">Thất bại — Timeout kết nối ATM</option>
              </select>
            </div>

            {/* Pay button */}
            <div className="mt-6 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={submitting}
                className="w-full font-black text-xs py-3.5 rounded-xl text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                style={{ background: 'var(--color-primary)', boxShadow: '0 4px 15px rgba(229,9,20,0.35)' }}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>{processingStep || 'Đang xử lý...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Thanh toán {formatCurrency(totalPrice)}
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right — Booking Summary */}
        <div className="w-full xl:w-72 shrink-0">
          <GlassCard className="p-5 sticky top-6">
            <h3 className="font-extrabold text-[var(--color-primary)] uppercase tracking-wide mb-4 border-b border-white/5 pb-2 text-sm">Tóm tắt vé đặt</h3>
            <div className="space-y-4 text-[11px]">
              <div>
                <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Phim</p>
                <p className="text-white font-bold mt-0.5 text-xs leading-tight">{movie?.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                <div>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Mã vé</p>
                  <p className="text-white font-mono font-bold mt-0.5 select-all text-[10px]">{bookingId}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Phòng chiếu</p>
                  <p className="text-white font-semibold mt-0.5 text-[10px]">{roomName || 'Phòng chiếu'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                <div>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Ngày</p>
                  <p className="text-white font-semibold mt-0.5">{formatDate(selectedDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Suất chiếu</p>
                  <p className="text-white font-semibold mt-0.5">{selectedTime}</p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold mb-1">Ghế ngồi</p>
                <p className="text-[var(--color-primary)] font-black text-xs font-mono tracking-wider">{displaySeats.join(', ') || 'Chưa chọn'}</p>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between items-end">
                <div>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Hình thức TT</p>
                  <p className="text-gray-300 mt-0.5 font-medium">
                    {paymentMethod === 'card' ? 'Thẻ tín dụng' : paymentMethod === 'momo' ? 'Ví MoMo' : 'Chuyển khoản ATM'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Tổng cộng</p>
                  <p className="text-sm font-black text-[var(--color-primary)] font-mono mt-0.5">{formatCurrency(totalPrice)}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}
