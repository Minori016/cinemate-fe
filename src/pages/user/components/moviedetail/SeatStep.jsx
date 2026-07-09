import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { cinemaRoomService } from '../../../../services/cinemaRoomService'

function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)' }}>
      {children}
    </div>
  )
}

export default function SeatStep({
  movie, selectedTime, selectedDate, totalPrice, selectedSeats, violations, toggleSeat,
  setBookingStep, user, navigate, movieId, location, selectedShowtime, SEAT_ROWS
}) {
  const [layout, setLayout] = useState(null)
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatError, setSeatError] = useState('')

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hôm nay') return 'Hôm nay'
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return dateString }
  }

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

  // Build price map from showtime prices
  const priceMap = useMemo(() => {
    const map = {}
    if (selectedShowtime?.prices && selectedShowtime.prices.length > 0) {
      selectedShowtime.prices.forEach(p => {
        map[p.seatType] = p.price
      })
    }
    return map
  }, [selectedShowtime])

  const getSeatPrice = (seatType) => {
    if (priceMap[seatType]) return priceMap[seatType]
    const t = (seatType || '').toUpperCase()
    if (t === 'VIP') return 110000
    if (t === 'COUPLE') return 190000
    return 90000
  }

  // Fetch room layout when showtime changes (/layout, fallback /seats → seatMatrix)
  useEffect(() => {
    if (!selectedShowtime?.roomId) { setLayout(null); return }
    let cancelled = false
    setLoadingSeats(true)
    setSeatError('')
    cinemaRoomService.getLayoutNormalized(selectedShowtime.roomId, {
      roomName: selectedShowtime.roomName || selectedShowtime.room || '',
    })
      .then(data => {
        if (cancelled) return
        if (data?.seatMatrix?.length) setLayout(data)
        else setSeatError('Không thể tải sơ đồ ghế')
      })
      .catch(() => {
        if (!cancelled) setSeatError('Không thể tải sơ đồ ghế')
      })
      .finally(() => {
        if (!cancelled) setLoadingSeats(false)
      })
    return () => { cancelled = true }
  }, [selectedShowtime?.roomId, selectedShowtime?.roomName, selectedShowtime?.room])

  // Build occupied seat set from layout
  const occupiedSet = useMemo(() => {
    const set = new Set()
    if (!layout?.seatMatrix) return set
    layout.seatMatrix.forEach(row => {
      row.seats.forEach(seat => {
        if (seat.status === 'MAINTENANCE' || seat.type === 'AISLE' || seat.type === 'COUPLE_EXTENSION') {
          set.add(seat.id)
        }
      })
    })
    return set
  }, [layout])

  // Build dynamic SEAT_ROWS from layout
  const dynamicSeatRows = useMemo(() => {
    if (!layout?.seatMatrix) return SEAT_ROWS || []
    return layout.seatMatrix.map(row => {
      const firstActive = row.seats.find(s => s.type !== 'AISLE' && s.type !== 'COUPLE_EXTENSION')
      const type = firstActive?.type === 'VIP' ? 'vip' : firstActive?.type === 'COUPLE' ? 'couple' : 'standard'
      return { row: row.rowLabel, type, price: getSeatPrice(firstActive?.type) }
    })
  }, [layout, SEAT_ROWS])

  const roomName = selectedShowtime?.roomName || 'Phòng Chiếu'

  // Seat button sub-components
  function SeatButton({ seat, type }) {
    const isOccupied = occupiedSet.has(seat.id)
    const isSelected = selectedSeats.includes(seat.id)
    const seatType = seat.type || type
    const isVip = seatType === 'VIP'
    const displayLabel = seat.row ? `${seat.row}${seat.number}` : seat.id
    return (
      <label key={seat.id} className={`seat-btn w-8 h-8 rounded border flex items-center justify-center text-xs font-bold relative ${isOccupied ? 'occupied cursor-not-allowed opacity-40' : isSelected ? 'selected cursor-pointer' : isVip ? 'vip border-[#f59e0b]/60 text-[#f59e0b] hover:bg-[#f59e0b]/10 cursor-pointer' : 'border-gray-600 text-gray-300 hover:bg-white/5 cursor-pointer'}`} title={seat.id}>
        <input type="checkbox" checked={isSelected} disabled={isOccupied} onChange={() => toggleSeat(seat.id)} className="sr-only" />
        {displayLabel}
      </label>
    )
  }

  function CoupleButton({ seat }) {
    const isOccupied = occupiedSet.has(seat.id)
    const isSelected = selectedSeats.includes(seat.id)
    const displayLabel = seat.number != null ? `${seat.row}${seat.number}` : seat.id
    return (
      <label key={seat.id} className={`seat-btn couple h-8 rounded border flex items-center justify-center text-xs font-bold relative ${isOccupied ? 'occupied cursor-not-allowed opacity-40' : isSelected ? 'selected cursor-pointer' : 'border-red-600/60 text-red-500 hover:bg-red-600/10 cursor-pointer'}`} title={seat.id}>
        <input type="checkbox" checked={isSelected} disabled={isOccupied} onChange={() => toggleSeat(seat.id)} className="sr-only" />
        {displayLabel}
      </label>
    )
  }

  function SeatRow({ rowLabel, type }) {
    const isVip = type === 'vip'
    const leftSeats = [
      { id: `${rowLabel}1`, label: '1' },
      { id: `${rowLabel}2`, label: '2' },
      { id: `${rowLabel}3`, label: '3' },
    ]
    const centerSeats = [
      { id: `${rowLabel}4`, label: '4' }, { id: `${rowLabel}5`, label: '5' },
      { id: `${rowLabel}6`, label: '6' }, { id: `${rowLabel}7`, label: '7' },
      { id: `${rowLabel}8`, label: '8' }, { id: `${rowLabel}9`, label: '9' },
    ]
    const rightSeats = [
      { id: `${rowLabel}10`, label: '10' }, { id: `${rowLabel}11`, label: '11' }, { id: `${rowLabel}12`, label: '12' },
    ]
    return (
      <div key={rowLabel} className="flex items-center justify-center gap-3 w-full">
        <span className="w-6 text-center font-bold text-gray-500 text-xs tracking-wide">{rowLabel}</span>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">{leftSeats.map(seat => <SeatButton key={seat.id} seat={seat} type={type} />)}</div>
          <div className="w-5 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-20">│</div>
          <div className={`flex gap-2 p-0.5 rounded-lg ${isVip ? 'border border-dashed border-[#f59e0b]/40 bg-[#f59e0b]/5 relative' : 'border border-transparent'}`}>
            {isVip && rowLabel === 'D' && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-[#f59e0b] bg-[#0c0c0c] px-2 py-0.5 tracking-widest whitespace-nowrap border border-[#f59e0b] rounded select-none">VÙNG TRUNG TÂM (BEST VIEW)</span>
            )}
            {centerSeats.map(seat => <SeatButton key={seat.id} seat={seat} type={type} />)}
          </div>
          <div className="w-5 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-20">│</div>
          <div className="flex gap-2">{rightSeats.map(seat => <SeatButton key={seat.id} seat={seat} type={type} />)}</div>
        </div>
        <span className="w-6 text-center font-bold text-gray-500 text-xs tracking-wide">{rowLabel}</span>
      </div>
    )
  }

  function CoupleRow({ rowLabel }) {
    const leftCouple = [{ id: `${rowLabel}1`, label: `${rowLabel}1` }]
    const centerCouples = [
      { id: `${rowLabel}2`, label: `${rowLabel}2` }, { id: `${rowLabel}3`, label: `${rowLabel}3` },
      { id: `${rowLabel}4`, label: `${rowLabel}4` },
    ]
    const rightCouple = [{ id: `${rowLabel}5`, label: `${rowLabel}5` }]
    return (
      <div key={rowLabel} className="flex items-center justify-center gap-3 w-full">
        <span className="w-6 text-center font-bold text-red-500 text-xs tracking-wide">{rowLabel}</span>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 w-[112px] justify-end">{leftCouple.map(seat => <CoupleButton key={seat.id} seat={seat} />)}</div>
          <div className="w-5 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-20">│</div>
          <div className="flex gap-2 p-0.5 rounded-lg border border-dashed border-red-500/20 bg-red-950/5">{centerCouples.map(seat => <CoupleButton key={seat.id} seat={seat} />)}</div>
          <div className="w-5 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-20">│</div>
          <div className="flex gap-2 w-[112px] justify-start">{rightCouple.map(seat => <CoupleButton key={seat.id} seat={seat} />)}</div>
        </div>
        <span className="w-6 text-center font-bold text-red-500 text-xs tracking-wide">{rowLabel}</span>
      </div>
    )
  }

  function renderDynamicRow(row) {
    return (
      <div key={row.rowLabel} className="flex items-center justify-center gap-3 w-full">
        <span className="w-6 text-center font-bold text-gray-500 text-xs tracking-wide">{row.rowLabel}</span>
        <div className="flex items-center gap-2">
          {row.seats.map(seat => {
            if (seat.type === 'AISLE') {
              return (
                <div key={seat.id} className="w-8 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-20">
                  │
                </div>
              )
            }
            if (seat.type === 'COUPLE_EXTENSION') {
              return null
            }
            if (seat.type === 'COUPLE') {
              return <CoupleButton key={seat.id} seat={seat} />
            }
            return <SeatButton key={seat.id} seat={seat} type={seat.type} />
          })}
        </div>
        <span className="w-6 text-center font-bold text-gray-500 text-xs tracking-wide">{row.rowLabel}</span>
      </div>
    )
  }

  return (
    <motion.div key="step2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
      {/* Summary bar */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-xl text-sm" style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)' }}>
        <span className="material-symbols-outlined text-[var(--color-primary)]">info</span>
        <span className="text-gray-300">{movie?.title} · <strong className="text-white">{selectedTime}</strong> · {formatDate(selectedDate)} · {roomName}</span>
      </div>

      <div className="w-full flex flex-col justify-between p-1 sm:p-2">
        {/* Seat selection status */}
        {selectedSeats.length > 0 && (
          <div className={`mb-6 text-xs font-bold px-4 py-2.5 rounded-xl border text-center transition-all ${violations.length > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
            {violations.length > 0 ? `⚠ Không thể để lại ghế trống đơn lẻ: ${violations.join(', ')}` : `✓ Đã chọn ${selectedSeats.length} ghế — nhấn "Tiếp tục" để thanh toán`}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          {[
            { color: 'border-gray-500 bg-transparent', label: 'Thường' },
            { color: 'border-[#f59e0b] bg-transparent text-[#f59e0b]', label: 'VIP', char: 'V' },
            { color: 'border-red-500 bg-transparent text-red-400', label: 'Đôi', wide: true },
            { color: 'bg-[var(--color-primary)] border-[var(--color-primary)]', label: 'Đang chọn' },
            { color: 'bg-[#1f2022] border-[#3a3a3a] opacity-40', label: 'Đã bán' },
          ].map(({ color, label, char, wide }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`${wide ? 'w-12' : 'w-5'} h-5 rounded border flex items-center justify-center text-[9px] font-black ${color}`}>{char || ''}</div>
              <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{label}</span>
            </div>
          ))}
        </div>

        {/* Seat Map */}
        <div className="flex flex-col items-center select-none overflow-x-auto w-full">
          {/* Screen */}
          <div className="w-4/5 max-w-lg h-14 mb-10 relative flex flex-col items-center">
            <div className="w-full h-7 screen-curve-inline rounded-[100%] border-t-2 border-red-500/40" />
            <p className="text-[9px] text-red-500/45 font-bold uppercase tracking-[0.28em] mt-2">Màn Hình Chiếu</p>
          </div>

          {/* Seat grid */}
          <div className="overflow-x-auto w-full pb-6">
            <div className="min-w-max mx-auto px-4 flex flex-col gap-3 items-center">
              {loadingSeats ? (
                <div className="flex justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-3xl text-[var(--color-primary)]">progress_activity</span>
                </div>
              ) : seatError ? (
                <p className="text-sm text-red-400 italic py-4 text-center">{seatError}</p>
              ) : layout?.seatMatrix ? (
                layout.seatMatrix.map(row => renderDynamicRow(row))
              ) : (
                <>
                  {SEAT_ROWS?.map(r => <SeatRow key={r.row} rowLabel={r.row} type={r.type} />)}
                  <div className="h-3" />
                  <CoupleRow rowLabel="G" />
                  <CoupleRow rowLabel="H" />
                </>
              )}
             {/* Entrance/Exit */}
              <div className="w-full max-w-[580px] flex justify-between mt-5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                  <span className="material-symbols-outlined text-sm">login</span>Lối vào
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                  <span className="material-symbols-outlined text-sm">logout</span>Lối ra
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seat summary & Continue button */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Ghế đã chọn</p>
            {selectedSeats.length === 0 ? <span className="text-gray-500 text-sm italic">Chưa chọn ghế...</span> : (
              <div className="flex gap-2 flex-wrap">
                {selectedSeats.map(s => (
                  <span key={s} className="px-3 py-1 rounded-lg text-sm font-bold text-white" style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Tổng tiền</p>
              <p className="text-xl font-black text-[var(--color-primary)] font-mono">{formatCurrency(totalPrice)}</p>
            </div>
            <button onClick={() => {
              if (!user) {
                try { sessionStorage.setItem('pending_booking_state', JSON.stringify({ movieId, selectedDate, selectedTime, selectedSeats, bookingStep: 3 })) } catch (e) { console.error('Lỗi khi lưu trạng thái đặt vé', e) }
                navigate('/login', { state: { from: location } })
                return
              }
              setBookingStep(3)
            }} disabled={selectedSeats.length === 0 || violations.length > 0} className="flex items-center gap-2 py-3 px-7 rounded-xl font-bold uppercase tracking-widest text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer border-none" style={{ background: 'var(--color-primary)', boxShadow: '0 4px 20px rgba(229,9,20,0.3)' }}>
              Tiếp tục <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
