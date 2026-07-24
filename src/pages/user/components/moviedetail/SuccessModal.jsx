import { motion } from 'motion/react'
import { Download, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function SuccessModal({
  bookingSuccess,
  movie,
  selectedDate,
  selectedTime,
  selectedSeats,
  totalPrice,
  bookingId,
  onClose,
  onBookAnother,
  navigate,
  selectedCombos = {},
  combos = [],
  promoCode = '',
  discountAmount = 0,
  movieDuration,
}) {
  if (!bookingSuccess) return null

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

  // Calculate end time = start time + movie duration
  const endTime = (() => {
    if (!selectedTime || !movieDuration) return ''
    try {
      const [h, m] = selectedTime.split(':').map(Number)
      const end = new Date()
      end.setHours(h, m + Number(movieDuration), 0, 0)
      return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    } catch {
      return ''
    }
  })()

  const formatSeatsLeftText = (seats) => {
    if (!seats || !seats.length) return ''
    const rowMap = {}
    seats.forEach(s => {
      const r = s.charAt(0)
      const n = s.substring(1)
      if (!rowMap[r]) rowMap[r] = []
      rowMap[r].push(n)
    })
    return Object.entries(rowMap)
      .map(([row, nums]) => `Hàng ${row} · Ghế ${nums.join(', ')}`)
      .join(' | ')
  }

  const formatSeatsRightText = (seats) => {
    if (!seats || !seats.length) return ''
    return seats.map(s => s.substring(1)).join(' · ')
  }

  // Combo items with qty > 0
  const orderedCombos = (combos || []).filter(c => (selectedCombos?.[c.id] || 0) > 0)
  const hasCombos = orderedCombos.length > 0
  const hasPromo = Boolean(promoCode) && Number(discountAmount) > 0

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: 'radial-gradient(circle at center, rgba(229, 9, 20, 0.35) 0%, rgba(12, 12, 12, 0.99) 100%)',
        backdropFilter: 'blur(20px)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-4xl p-6 md:p-10 rounded-3xl relative overflow-hidden my-auto"
        style={{
          background: 'rgba(20,20,20,0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(229, 9, 20, 0.15)'
        }}
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(229,9,20,0.15), transparent)' }}
        />
        <div
          className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent)' }}
        />

        <div className="success-ticket-container">
          {/* Left Column */}
          <div className="left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              onClick={onClose}
              className="back-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer'
              }}
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
                Khi mua vé xem phim thành công, bạn chỉ cần xuất trình mã vạch này tại cửa rạp để soát vé. Thông tin vé cũng đã được lưu trong lịch sử giao dịch.
              </p>
            </div>

            <div className="success-ticket-card">
              <div className="success-ticket-sc-title">Chi tiết đặt vé</div>
              <div className="success-ticket-row">
                <span className="success-ticket-label">Phim</span>
                <span className="success-ticket-val" title={movie?.title}>
                  {movie?.title}
                </span>
              </div>
              <div className="success-ticket-row">
                <span className="success-ticket-label">📅 Ngày chiếu</span>
                <span className="success-ticket-val">{formatDate(selectedDate)}</span>
              </div>
              <div className="success-ticket-row">
                <span className="success-ticket-label">⏰ Suất chiếu</span>
                <span className="success-ticket-val">
                  {endTime ? `${selectedTime} – ${endTime}` : selectedTime}
                </span>
              </div>
              <div className="success-ticket-row">
                <span className="success-ticket-label">Ghế ngồi</span>
                <span
                  className="success-ticket-val"
                  title={formatSeatsLeftText(selectedSeats)}
                  style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {formatSeatsLeftText(selectedSeats)}
                </span>
              </div>
              <div className="success-ticket-row">
                <span className="success-ticket-label">Số lượng</span>
                <span className="success-ticket-val">{selectedSeats.length} vé</span>
              </div>

              {/* Combo bắp nước */}
              {hasCombos && (
                <div className="success-ticket-row" style={{ alignItems: 'flex-start' }}>
                  <span className="success-ticket-label">Bắp nước</span>
                  <span className="success-ticket-val" style={{ whiteSpace: 'normal', textAlign: 'right', maxWidth: '240px' }}>
                    {orderedCombos.map(c => {
                      const qty = selectedCombos[c.id] || 0
                      return (
                        <div key={c.id} style={{ marginBottom: 2 }}>
                          {c.name} x{qty}
                          <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 6, fontWeight: 400 }}>
                            {formatCurrency(c.price * qty)}
                          </span>
                        </div>
                      )
                    })}
                  </span>
                </div>
              )}

              {/* Mã giảm giá / promotion */}
              {hasPromo && (
                <div className="success-ticket-row">
                  <span className="success-ticket-label">Mã giảm giá</span>
                  <span className="success-ticket-val" style={{ color: '#4ade80' }}>
                    {promoCode}
                    <span style={{ marginLeft: 6 }}>-{formatCurrency(discountAmount)}</span>
                  </span>
                </div>
              )}

              <div className="success-ticket-total-row">
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Tổng tiền đã thanh toán</span>
                <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            <div className="success-ticket-actions">
              <button
                className="success-ticket-btn-outline flex items-center justify-center gap-1.5"
                onClick={() => alert('Vé đang được tải xuống thiết bị của bạn...')}
              >
                <Download size={14} />
                Tải xuống
              </button>
              <button
                className="success-ticket-btn-outline flex items-center justify-center gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(`Vé xem phim CineMate: ${movie?.title} - Mã vé: ${bookingId}`)
                  alert('Đã sao chép liên kết chia sẻ vé vào khay nhớ tạm!')
                }}
              >
                <Share2 size={14} />
                Chia sẻ
              </button>
              <button
                className="success-ticket-btn-primary flex items-center justify-center gap-1.5 border-none"
                onClick={() => navigate('/profile')}
              >
                <span>🎟</span>
                Xem tất cả vé
              </button>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button
                onClick={onBookAnother}
                className="text-xs text-gray-500 hover:text-[var(--color-primary)] transition-all cursor-pointer underline bg-transparent border-none"
              >
                Đặt vé phim khác
              </button>
            </div>
          </div>

          {/* Right Column (Ticket Preview) */}
          <div className="success-ticket-right-col">
            <div className="success-ticket-physical">
              <img className="success-ticket-physical-poster" src={movie?.poster} alt={movie?.title} />
              <div className="success-ticket-physical-body">
                <div className="success-ticket-physical-title">{movie?.title}</div>
                <hr className="success-ticket-physical-divider" />
                <div className="success-ticket-physical-fields">
                  <div className="success-ticket-physical-field">
                    <div className="stf-label">Ngày</div>
                    <div className="stf-val">
                      {new Date(selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                  <div className="success-ticket-physical-field">
                    <div className="stf-label">Giờ</div>
                    <div className="stf-val">
                      {endTime ? `${selectedTime} – ${endTime}` : selectedTime}
                    </div>
                  </div>
                  <div className="success-ticket-physical-field">
                    <div className="stf-label">Ghế</div>
                    <div
                      className="stf-val"
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={selectedSeats.join(', ')}
                    >
                      {formatSeatsRightText(selectedSeats)}
                    </div>
                  </div>
                  <div className="success-ticket-physical-field">
                    <div className="stf-label">Số vé</div>
                    <div className="stf-val">{selectedSeats.length}</div>
                  </div>
                </div>
                {hasCombos && (
                  <>
                    <hr className="success-ticket-physical-divider" />
                    <div style={{ marginBottom: 12 }}>
                      <div className="stf-label" style={{ marginBottom: 4 }}>Bắp nước</div>
                      {orderedCombos.map(c => (
                        <div key={c.id} className="stf-val" style={{ fontSize: 12, marginBottom: 2 }}>
                          {c.name} x{selectedCombos[c.id] || 0}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {hasPromo && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="stf-label" style={{ marginBottom: 2 }}>Khuyến mãi</div>
                    <div className="stf-val" style={{ fontSize: 12, color: '#4ade80' }}>
                      {promoCode} (-{formatCurrency(discountAmount)})
                    </div>
                  </div>
                )}
                <div className="success-ticket-physical-barcode-box" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                  <QRCodeSVG 
                    value={bookingId || "cinemate-booking"} 
                    size={80}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="Q"
                  />
                </div>
              </div>
            </div>
            <div className="success-ticket-physical-barcode-label">SCAN AT ENTRANCE</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
