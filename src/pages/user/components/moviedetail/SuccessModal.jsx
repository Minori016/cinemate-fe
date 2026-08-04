import React from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Share2, CheckCircle2 } from 'lucide-react'

export default function SuccessModal({
  bookingSuccess,
  movie,
  selectedDate,
  selectedTime,
  selectedSeats,
  bookingId,
  totalPrice,
  discountAmount,
  onClose,
  onBookAnother,
  navigate,
  selectedCombos = {},
  combos = [],
  promoCode = '',
  pointsRedemption = null,
  pointsDiscount = 0,
}) {
  if (!bookingSuccess) return null

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

  // Find movie duration in minutes
  const durationMatch = movie?.duration ? String(movie.duration).match(/\d+/) : null
  const durationMin = durationMatch ? parseInt(durationMatch[0], 10) : 120

  // Calculate end time
  const calculateEndTime = (startStr, durationInMinutes) => {
    if (!startStr) return ''
    const parts = startStr.split(':')
    if (parts.length < 2) return ''
    const startHour = parseInt(parts[0], 10)
    const startMin = parseInt(parts[1], 10)
    if (isNaN(startHour) || isNaN(startMin)) return ''
    const totalMinutes = startHour * 60 + startMin + durationInMinutes
    const endHour = Math.floor(totalMinutes / 60) % 24
    const endMin = totalMinutes % 60
    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
  }

  const endTime = calculateEndTime(selectedTime, durationMin)

  const orderedCombos = (combos || []).filter(c => (selectedCombos[c.id] || 0) > 0)
  const hasCombos = orderedCombos.length > 0
  const hasPromo = Boolean(promoCode && discountAmount > 0)

  const formatSeatsLeftText = (seats) => {
    if (!seats || seats.length === 0) return 'Chưa chọn ghế'
    if (seats.length <= 4) return seats.join(', ')
    return `${seats.slice(0, 4).join(', ')} và ${seats.length - 4} ghế khác`
  }

  const formatSeatsRightText = (seats) => {
    if (!seats || seats.length === 0) return 'Chưa chọn ghế'
    if (seats.length <= 3) return seats.join(', ')
    return `${seats.slice(0, 3).join(', ')} (+${seats.length - 3})`
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="success-ticket-modal-container max-w-4xl w-full"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/30">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight" style={{ fontFamily: 'Montserrat' }}>
            Thanh Toán Thành Công!
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Thanh toán đã được hệ thống xác nhận. Cảm ơn bạn đã đặt vé xem phim tại CineMate!
          </p>
        </div>

        {/* Ticket Box Grid */}
        <div className="success-ticket-grid">
          {/* Left Column (Details) */}
          <div className="success-ticket-left-col">
            <div className="success-ticket-header">
              <span className="success-ticket-badge">VERIFIED PASS</span>
              <span className="success-ticket-code">#{String(bookingId || 'CM-SUCCESS').substring(0, 8)}</span>
            </div>

            <div className="success-ticket-details">
              <div className="success-ticket-row">
                <span className="success-ticket-label">🎬 Phim</span>
                <span className="success-ticket-val text-white font-bold">{movie?.title}</span>
              </div>
              <div className="success-ticket-row">
                <span className="success-ticket-label">📍 Rạp & Phòng</span>
                <span className="success-ticket-val text-gray-300">
                  CineMate HQ — {movie?.roomName || 'Phòng chiếu 1'}
                </span>
              </div>
              <div className="success-ticket-row">
                <span className="success-ticket-label">📅 Ngày chiếu</span>
                <span className="success-ticket-val">
                  {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
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

              {/* Ưu đãi đổi điểm */}
              {pointsRedemption && (
                <div className="success-ticket-row">
                  <span className="success-ticket-label">⭐ Đổi điểm</span>
                  <span className="success-ticket-val" style={{ color: '#fbbf24', fontWeight: 700 }}>
                    {pointsRedemption.promotionTitle || 'Quà đổi điểm'} ({pointsRedemption.pointsSpent || 0} điểm)
                    {pointsDiscount > 0 ? (
                      <span style={{ marginLeft: 6 }}>-{formatCurrency(pointsDiscount)}</span>
                    ) : (
                      <span style={{ marginLeft: 6, opacity: 0.8 }}>(Quà tặng)</span>
                    )}
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

                {pointsRedemption && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="stf-label" style={{ marginBottom: 2 }}>⭐ Đổi điểm</div>
                    <div className="stf-val" style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>
                      {pointsRedemption.promotionTitle} ({pointsRedemption.pointsSpent} điểm)
                    </div>
                  </div>
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
