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
  submitting,
  processingStep,
  submitError,
  setSubmitError,
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

            {/* Payment method */}
            <div
              className="p-3 rounded-xl mb-6 text-center bg-white/10 text-white font-bold text-sm shadow-md border border-white/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              <span>Thanh toán bằng Ví MoMo</span>
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
                    Ví MoMo
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
