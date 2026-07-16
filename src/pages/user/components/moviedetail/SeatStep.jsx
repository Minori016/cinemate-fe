import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { cinemaRoomService } from '../../../../services/cinemaRoomService'
import {
  validateSeatSelection,
  getRowsFromLayout,
  buildFallbackRows,
  applyOccupiedToRows,
  SEAT_GAP_ERROR_MESSAGE,
} from '../../../../utils/seatValidation'
// removed BestViewZoneFrame and RecommendationOverlay
import { getSeatScore } from '../../../../utils/seatScoring'
import websocketService from '../../../../services/websocketService'
import { bookingService } from '../../../../services/bookingService'

// Fallback occupied labels used when API layout is unavailable
const FALLBACK_OCCUPIED = [
  'A3', 'A4', 'A8', 'B1', 'B2', 'B11', 'B12',
  'C5', 'C6', 'C7', 'D5', 'D6', 'D7',
  'E4', 'E8', 'E9', 'F6', 'F7',
  'G1', 'H3', 'H5',
]

function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)' }}>
      {children}
    </div>
  )
}

export default function SeatStep({
  movie, selectedTime, selectedDate, totalPrice, selectedSeats, seatMetaMap, violations, toggleSeat,
  setBookingStep, selectedShowtime, SEAT_ROWS
}) {
  const [layout, setLayout] = useState(null)
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatError, setSeatError] = useState('')
  const [tempHolds, setTempHolds] = useState(new Map())
  const seatRefs = useRef({})
  const [gridRoot, setGridRoot] = useState(null)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [realSeatMap, setRealSeatMap] = useState([])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          toast.error('Thời gian chọn ghế đã hết!', {
            description: 'Hệ thống tự động hủy phiên chọn ghế.',
            duration: 4000
          })
          setBookingStep(1)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, setBookingStep])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }


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

  // Fetch room layout when showtime changes and refresh availability in place.
  const loadLayout = useCallback(async (opts = { showLoading: false }) => {
    if (!selectedShowtime?.id || !selectedShowtime?.roomId) {
      setLayout(null)
      setSeatError('Thiếu thông tin phòng chiếu')
      return
    }
    if (opts.showLoading) setLoadingSeats(true)
    setSeatError('')
    try {
      const [data, seatMapRes] = await Promise.all([
        cinemaRoomService.getLayoutNormalized(selectedShowtime.roomId, {
          roomName: selectedShowtime.roomName || selectedShowtime.room || '',
        }),
        bookingService.getSeatMap(selectedShowtime.id).catch(() => null)
      ])
      
      if (data?.seatMatrix?.length) setLayout(data)
      else setSeatError('Không thể tải sơ đồ ghế')

      if (seatMapRes?.data?.result || seatMapRes?.data) {
        const seats = seatMapRes.data?.result?.seats || seatMapRes.data?.seats || []
        setRealSeatMap(seats)
      }
    } catch {
      setSeatError('Không thể tải sơ đồ ghế')
    } finally {
      if (opts.showLoading) setLoadingSeats(false)
    }
  }, [selectedShowtime?.id, selectedShowtime?.roomId, selectedShowtime?.roomName, selectedShowtime?.room])

  useEffect(() => {
    loadLayout({ showLoading: true })
    const pollId = window.setInterval(() => loadLayout(), 10000)
    return () => window.clearInterval(pollId)
  }, [loadLayout])

  // WebSocket Integration
  useEffect(() => {
    if (!selectedShowtime?.id) return
    
    let isSubscribed = false
    websocketService.connect(() => {
      websocketService.subscribeToSeatMap(selectedShowtime.id, (message) => {
        if (message && message.type === 'SEAT_MAP_UPDATED') {
          // Fetch the layout again instantly without showing full loading
          loadLayout({ showLoading: false })
        }
      })
      isSubscribed = true
    })

    return () => {
      if (isSubscribed) {
        websocketService.unsubscribeFromSeatMap(selectedShowtime.id)
      }
    }
  }, [selectedShowtime?.id, loadLayout])

  // Build occupied seat set from layout (or fallback labels)
  const occupiedSet = useMemo(() => {
    const set = new Set()
    
    // Merge real-time booking statuses first
    if (realSeatMap && realSeatMap.length > 0) {
      realSeatMap.forEach(s => {
        if (s.status === 'HELD' || s.status === 'CONFIRMED' || s.status === 'CANCELLED_UNAVAILABLE' || s.status === 'MAINTENANCE') {
          if (!selectedSeats.includes(s.seatId)) {
            set.add(s.seatId)
          }
        }
      })
    }

    if (!layout?.seatMatrix) {
      FALLBACK_OCCUPIED.forEach(id => set.add(id))
    } else {
      layout.seatMatrix.forEach(row => {
        row.seats.forEach(seat => {
          const status = String(seat.status || '').toUpperCase()
          const type = String(seat.type || '').toUpperCase()
          if (
            status === 'MAINTENANCE' || status === 'SOLD' || status === 'RESERVED' ||
            status === 'DISABLED' || status === 'BROKEN' ||
            type === 'AISLE' || type === 'COUPLE_EXTENSION'
          ) {
            set.add(seat.id)
          }
        })
      })
    }
    
    // Add temp holds from other clients, excluding our own selections
    tempHolds.forEach((timestamp, id) => {
      if (!selectedSeats.includes(id)) {
        set.add(id)
      }
    })

    return set
  }, [layout, tempHolds, selectedSeats, realSeatMap])

  // Clear stale temp holds (older than 5 mins) to prevent deadlocks if someone disconnects abruptly
  useEffect(() => {
    const timer = setInterval(() => {
      setTempHolds(prev => {
        const next = new Map(prev)
        let changed = false
        const now = Date.now()
        for (const [id, time] of next.entries()) {
          if (now - time > 5 * 60 * 1000) {
            next.delete(id)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Rows used by gap validator (API layout preferred, fallback otherwise)
  const validationRows = useMemo(() => {
    let baseRows = layout?.seatMatrix?.length ? getRowsFromLayout(layout) : buildFallbackRows()
    return applyOccupiedToRows(baseRows, Array.from(occupiedSet))
  }, [layout, occupiedSet])

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

  const resolveSeatLabel = (seat) => {
    if (seat?.row != null && seat?.number != null) return `${seat.row}${seat.number}`
    if (seat?.rowLabel != null && seat?.number != null) return `${seat.rowLabel}${seat.number}`
    if (seatMetaMap?.[seat?.id]?.label) return seatMetaMap[seat.id].label
    return seat?.id
  }

  /**
   * Validate gap rule BEFORE updating selection state.
   * Reject + toast if the action would create an orphan seat.
   */
  const handleToggleSeat = useCallback((seatId, meta = {}) => {
    const isSelected = selectedSeats.includes(seatId)
    if (!isSelected && occupiedSet.has(seatId)) return

    // Limit to maximum 8 seats per booking
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 8) {
      toast.error('Bạn chỉ có thể đặt tối đa 8 ghế trong một lần giao dịch!', {
        duration: 3000,
      })
      return
    }

    const result = validateSeatSelection({
      rows: validationRows,
      currentSelected: selectedSeats,
      toggledSeatId: seatId,
    })

    if (!result.valid) {
      toast.error(result.reason || SEAT_GAP_ERROR_MESSAGE, {
        description: result.affectedRow
          ? `Hàng ${result.affectedRow} — không để lại 1 ghế trống đơn lẻ.`
          : undefined,
        duration: 2800,
      })
      return
    }

    toggleSeat(seatId, meta)
  }, [occupiedSet, validationRows, selectedSeats, toggleSeat])

  // Seat button sub-components
  function SeatButton({ seat, type }) {
    const isOccupied = occupiedSet.has(seat.id)
    const isSelected = selectedSeats.includes(seat.id)
    const seatType = seat.type || type || 'STANDARD'
    const isVip = String(seatType).toUpperCase() === 'VIP'
    const displayLabel = resolveSeatLabel(seat)
    return (
      <label ref={(node) => { if (node) seatRefs.current[seat.id] = node; else delete seatRefs.current[seat.id] }} key={seat.id} className={`seat-btn w-8 h-8 rounded border flex items-center justify-center text-xs font-bold relative ${isOccupied ? 'occupied cursor-not-allowed opacity-40 bg-[#282a2b] border-[#4e4353] text-gray-500' : isSelected ? 'selected cursor-pointer bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : isVip ? 'vip border-[#f59e0b]/60 text-[#f59e0b] hover:bg-[#f59e0b]/10 cursor-pointer' : 'border-gray-600 text-gray-300 hover:bg-white/5 cursor-pointer'}`} title={displayLabel}>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isOccupied}
          onChange={() => handleToggleSeat(seat.id, { label: displayLabel, type: String(seatType).toUpperCase() })}
          className="sr-only"
        />
        {isOccupied ? 'X' : displayLabel}
      </label>
    )
  }

  function CoupleButton({ seat }) {
    const isOccupied = occupiedSet.has(seat.id)
    const isSelected = selectedSeats.includes(seat.id)
    const displayLabel = resolveSeatLabel(seat)
    let doubleLabel = displayLabel
    if (displayLabel) {
      const match = String(displayLabel).trim().match(/^([a-zA-Z\s]+)(\d+)$/)
      if (match) {
        const row = match[1].trim()
        const num = parseInt(match[2], 10)
        doubleLabel = `${row}${num} | ${row}${num + 1}`
      }
    }

    return (
      <label ref={(node) => { if (node) seatRefs.current[seat.id] = node; else delete seatRefs.current[seat.id] }} key={seat.id} className={`seat-btn couple w-[72px] h-8 rounded border flex items-center justify-center text-[11px] font-bold relative transition-all ${isOccupied ? 'occupied cursor-not-allowed opacity-40 bg-[#282a2b] border-[#4e4353] text-gray-500' : isSelected ? 'selected cursor-pointer bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]' : 'border-red-600/60 text-red-500 hover:bg-red-600/10 cursor-pointer'}`} title={doubleLabel}>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isOccupied}
          onChange={() => handleToggleSeat(seat.id, { label: doubleLabel, type: 'COUPLE' })}
          className="sr-only"
        />
        {isOccupied ? 'X' : doubleLabel}
      </label>
    )
  }

  function SeatRow({ rowLabel, type }) {
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
          <div className="flex gap-2 p-0.5 rounded-lg border border-transparent">
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
      <div className="flex justify-between items-center mb-5 p-3 rounded-xl text-sm" style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)' }}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--color-primary)]">info</span>
          <span className="text-gray-300">{movie?.title} · <strong className="text-white">{selectedTime}</strong> · {formatDate(selectedDate)} · {roomName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-500 font-mono font-bold text-base bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          {formatTime(timeLeft)}
        </div>
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
            <div ref={setGridRoot} className="relative min-w-max mx-auto px-4 flex flex-col gap-3 items-center">
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

        {/* Seat summary only — navigation via sidebar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Ghế đã chọn</p>
            {selectedSeats.length === 0 ? <span className="text-gray-500 text-sm italic">Chưa chọn ghế...</span> : (
              <div className="flex gap-2 flex-wrap">
                {selectedSeats.map(s => (
                  <span key={s} className="px-3 py-1 rounded-lg text-sm font-bold text-white" style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)' }}>{seatMetaMap?.[s]?.label || s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Tổng tiền</p>
            <p className="text-xl font-black text-[var(--color-primary)] font-mono">{formatCurrency(totalPrice)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
