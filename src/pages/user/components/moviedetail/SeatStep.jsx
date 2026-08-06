import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { cinemaRoomService } from '../../../../services/cinemaRoomService'
import {
  validateSeatSelection,
  getRowsFromLayout,
  SEAT_GAP_ERROR_MESSAGE,
} from '../../../../utils/seatValidation'
// removed BestViewZoneFrame and RecommendationOverlay
import { getSeatScore } from '../../../../utils/seatScoring'
import websocketService from '../../../../services/websocketService'
import { bookingService } from '../../../../services/bookingService'

function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)' }}>
      {children}
    </div>
  )
}

export default function SeatStep({
  movie, selectedTime, selectedDate, totalPrice, selectedSeats, seatMetaMap, violations, toggleSeat,
  setBookingStep, selectedShowtime, processingSeats = [],
  user, onRequireAuth, hydrateLockedSeats
}) {
  const [layout, setLayout] = useState(null)
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatError, setSeatError] = useState('')
  const [tempHolds, setTempHolds] = useState(new Map())
  const seatRefs = useRef({})
  const [gridRoot, setGridRoot] = useState(null)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [realSeatMap, setRealSeatMap] = useState([])
  const [justUnlockedSeats, setJustUnlockedSeats] = useState(new Set())

  // Clear justUnlockedSeats if the server reports the seat as AVAILABLE
  useEffect(() => {
    if (realSeatMap && realSeatMap.length > 0) {
      setJustUnlockedSeats(prev => {
        if (prev.size === 0) return prev
        const next = new Set(prev)
        let changed = false
        realSeatMap.forEach(s => {
          if (next.has(s.seatId)) {
            const sStatus = String(s.status || '').toUpperCase()
            if (sStatus !== 'HELD') {
              next.delete(s.seatId)
              changed = true
            }
          }
        })
        return changed ? next : prev
      })
    }
  }, [realSeatMap])

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
        bookingService.getSeatMap(selectedShowtime.id),
      ])

      if (seatMapRes?.data?.result || seatMapRes?.data) {
        const seats = seatMapRes.data?.result?.seats || seatMapRes.data?.seats || []
        setRealSeatMap(seats)

        const ownLockedSeats = seats
          .filter(s => s.lockedByCurrentUser && String(s.status || '').toUpperCase() === 'HELD')
          .map(s => s.seatId)
        
        if (ownLockedSeats.length > 0) {
          if (typeof opts.onRestoreSeats === 'function') {
            opts.onRestoreSeats(ownLockedSeats)
          } else if (hydrateLockedSeats) {
            hydrateLockedSeats(ownLockedSeats)
          }
        }
      }

      setLayout(data)
    } catch {
      setLayout(null)
      setRealSeatMap([])
      setSeatError('Không thể tải sơ đồ ghế. Vui lòng thử lại sau.')
    } finally {
      if (opts.showLoading) setLoadingSeats(false)
    }
  }, [selectedShowtime?.id, selectedShowtime?.roomId, selectedShowtime?.roomName, selectedShowtime?.room, hydrateLockedSeats])

  useEffect(() => {
    // Pass a callback to restore seats locally
    const handleRestore = (seats) => {
      if (typeof toggleSeat === 'function' && toggleSeat.restore) {
        toggleSeat.restore(seats)
      }
    }
    loadLayout({ showLoading: true, onRestoreSeats: handleRestore })
  }, [loadLayout, toggleSeat])

  // WebSocket Integration
  useEffect(() => {
    if (!selectedShowtime?.id) return

    let isSubscribed = false
    websocketService.connect(() => {
      websocketService.subscribeToSeatMap(selectedShowtime.id, (message) => {
        if (message && message.type === 'SEAT_MAP_UPDATED' && message.eventType !== 'HEARTBEAT') {
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

  // Build sold, held and combined occupied seat sets
  const { soldSet, heldSet } = useMemo(() => {
    const sold = new Set()
    const held = new Set()

    // Merge real-time booking statuses first
    if (realSeatMap && realSeatMap.length > 0) {
      realSeatMap.forEach(s => {
        const sStatus = String(s.status || '').toUpperCase()
        if (sStatus === 'HELD') {
          // Skip seats owned by current user — they should remain selectable
          if (s.lockedByCurrentUser) return
          if (!selectedSeats.includes(s.seatId) && !processingSeats.includes(s.seatId) && !justUnlockedSeats.has(s.seatId)) {
            held.add(s.seatId)
          }
        } else if (sStatus === 'CONFIRMED' || sStatus === 'CANCELLED_UNAVAILABLE' || sStatus === 'MAINTENANCE') {
          if (!selectedSeats.includes(s.seatId) && !processingSeats.includes(s.seatId)) {
            sold.add(s.seatId)
          }
        }
      })
    }

    if (layout?.seatMatrix) {
      layout.seatMatrix.forEach(row => {
        row.seats.forEach(seat => {
          const status = String(seat.status || '').toUpperCase()
          const type = String(seat.type || '').toUpperCase()
          if (
            status === 'MAINTENANCE' || status === 'SOLD' || status === 'RESERVED' ||
            status === 'DISABLED' || status === 'BROKEN' ||
            type === 'AISLE' || type === 'COUPLE_EXTENSION'
          ) {
            sold.add(seat.id)
          }
        })
      })
    }

    // Add temp holds from other clients, excluding our own selections
    tempHolds.forEach((timestamp, id) => {
      if (!selectedSeats.includes(id) && !processingSeats.includes(id) && !justUnlockedSeats.has(id)) {
        held.add(id)
      }
    })

    return { soldSet: sold, heldSet: held }
  }, [layout, tempHolds, selectedSeats, realSeatMap, processingSeats, justUnlockedSeats])

  const occupiedSet = useMemo(() => {
    return new Set([...soldSet, ...heldSet])
  }, [soldSet, heldSet])

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
    return layout?.seatMatrix?.length ? getRowsFromLayout(layout) : []
  }, [layout])


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
    if (processingSeats.includes(seatId)) return
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

    if (isSelected) {
      setJustUnlockedSeats(prev => {
        const next = new Set(prev)
        next.add(seatId)
        return next
      })
      // Clear after 4 seconds to prevent blocking other clients indefinitely
      setTimeout(() => {
        setJustUnlockedSeats(prev => {
          const next = new Set(prev)
          next.delete(seatId)
          return next
        })
      }, 4000)
    } else {
      setJustUnlockedSeats(prev => {
        const next = new Set(prev)
        next.delete(seatId)
        return next
      })
    }

    toggleSeat(seatId, meta)
  }, [occupiedSet, validationRows, selectedSeats, toggleSeat, processingSeats])

  const handleContinue = useCallback(() => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth()
      } else {
        setBookingStep(3)
      }
    } else {
      setBookingStep(3)
    }
  }, [user, onRequireAuth, setBookingStep])

  // Seat button sub-components
  function SeatButton({ seat, type }) {
    const isSold = soldSet.has(seat.id)
    const isHeld = heldSet.has(seat.id)
    const isOccupied = isSold || isHeld
    const isSelected = selectedSeats.includes(seat.id)
    const isProcessing = processingSeats.includes(seat.id)
    const seatType = seat.type || type || 'STANDARD'
    const isVip = String(seatType).toUpperCase() === 'VIP'
    const displayLabel = resolveSeatLabel(seat)

    let btnClasses = "seat-btn w-6 h-6 sm:w-7 sm:h-7 rounded border flex items-center justify-center text-[9px] sm:text-[10px] font-bold relative transition-all "
    let content = displayLabel

    if (isProcessing) {
      btnClasses += "animate-pulse border-blue-500 text-blue-500 bg-blue-500/10 cursor-wait"
    } else if (isSold) {
      btnClasses += "occupied cursor-not-allowed opacity-40 bg-[#1f2022] border-[#3a3a3a] text-transparent"
      content = ""
    } else if (isHeld) {
      btnClasses += "held cursor-not-allowed bg-[#2d1b1e] border-[#ef4444]/40 text-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.2)]"
      content = "X"
    } else if (isSelected) {
      btnClasses += "selected cursor-pointer bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]"
    } else if (isVip) {
      btnClasses += "vip border-[#f59e0b]/60 text-[#f59e0b] hover:bg-[#f59e0b]/10 cursor-pointer"
    } else {
      btnClasses += "border-gray-600 text-gray-300 hover:bg-white/5 cursor-pointer"
    }

    return (
      <label ref={(node) => { if (node) seatRefs.current[seat.id] = node; else delete seatRefs.current[seat.id] }} key={seat.id} className={btnClasses} title={displayLabel}>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isOccupied || isProcessing}
          onChange={() => handleToggleSeat(seat.id, { label: displayLabel, type: String(seatType).toUpperCase() })}
          className="sr-only"
        />
        {content}
      </label>
    )
  }

  function CoupleButton({ seat }) {
    const isSold = soldSet.has(seat.id)
    const isHeld = heldSet.has(seat.id)
    const isOccupied = isSold || isHeld
    const isSelected = selectedSeats.includes(seat.id)
    const isProcessing = processingSeats.includes(seat.id)
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

    let btnClasses = "seat-btn couple w-[52px] h-6 sm:w-[60px] sm:h-7 rounded border flex items-center justify-center text-[9px] sm:text-[10px] font-bold relative transition-all "
    let content = doubleLabel

    if (isProcessing) {
      btnClasses += "animate-pulse border-blue-500 text-blue-500 bg-blue-500/10 cursor-wait"
    } else if (isSold) {
      btnClasses += "occupied cursor-not-allowed opacity-40 bg-[#1f2022] border-[#3a3a3a] text-transparent"
      content = ""
    } else if (isHeld) {
      btnClasses += "held cursor-not-allowed bg-[#2d1b1e] border-[#ef4444]/40 text-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.2)]"
      content = "X"
    } else if (isSelected) {
      btnClasses += "selected cursor-pointer bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]"
    } else {
      btnClasses += "border-red-600/60 text-red-500 hover:bg-red-600/10 cursor-pointer"
    }

    return (
      <label ref={(node) => { if (node) seatRefs.current[seat.id] = node; else delete seatRefs.current[seat.id] }} key={seat.id} className={btnClasses} title={doubleLabel}>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isOccupied || isProcessing}
          onChange={() => handleToggleSeat(seat.id, { label: doubleLabel, type: 'COUPLE' })}
          className="sr-only"
        />
        {content}
      </label>
    )
  }

  function renderDynamicRow(row) {
    return (
      <div key={row.rowLabel} className="flex items-center justify-center gap-1.5 sm:gap-2 w-full">
        <span className="w-4 sm:w-5 text-center font-bold text-gray-500 text-[9px] sm:text-[10px] tracking-wide">{row.rowLabel}</span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          {row.seats.map(seat => {
            if (seat.type === 'AISLE') {
              return (
                <div key={seat.id} className="w-4 sm:w-5 h-6 sm:h-7 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-20">
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
        <span className="w-4 sm:w-5 text-center font-bold text-gray-500 text-[9px] sm:text-[10px] tracking-wide">{row.rowLabel}</span>
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

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          {[
            { color: 'border-gray-500 bg-transparent', label: 'Thường' },
            { color: 'border-[#f59e0b] bg-transparent text-[#f59e0b]', label: 'VIP', char: 'V' },
            { color: 'border-red-500 bg-transparent text-red-400', label: 'Đôi', wide: true },
            { color: 'bg-[var(--color-primary)] border-[var(--color-primary)]', label: 'Đang chọn' },
            { color: 'border-[#ef4444]/40 bg-[#2d1b1e] text-[#ef4444]', label: 'Đang giữ', char: 'X' },
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
            <div ref={setGridRoot} className="relative min-w-max mx-auto px-2 flex flex-col gap-1.5 sm:gap-2 items-center">
              {loadingSeats ? (
                <div className="flex justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-3xl text-[var(--color-primary)]">progress_activity</span>
                </div>
              ) : seatError ? (
                <p className="text-sm text-red-400 italic py-4 text-center">{seatError}</p>
              ) : layout?.seatMatrix ? (
                layout.seatMatrix.map(row => renderDynamicRow(row))
              ) : (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  Chưa có sơ đồ ghế hợp lệ cho suất chiếu này.
                </p>
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

      {/* Floating Popup for Seat Selection Status */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg"
          >
            <div
              className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-4 text-sm font-semibold transition-all ${violations.length > 0
                  ? 'bg-red-950/90 border-red-500/30 text-red-200'
                  : 'bg-[#121824]/90 border-green-500/30 text-green-400'
                }`}
              style={{
                boxShadow: violations.length > 0
                  ? '0 10px 30px -5px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 10px 30px -5px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${violations.length > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                  <span className="material-symbols-outlined text-lg">
                    {violations.length > 0 ? 'warning' : 'check_circle'}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-white text-sm">
                    {violations.length > 0 ? 'Cảnh báo khoảng trống' : 'Đã chọn ghế'}
                  </span>
                  <span className="text-xs text-gray-300 leading-normal">
                    {violations.length > 0
                      ? `Không thể để lại ghế trống đơn lẻ: ${violations.join(', ')}`
                      : `✓ Đã chọn ${selectedSeats.length} ghế — nhấn "Tiếp tục" để thanh toán`
                    }
                  </span>
                </div>
              </div>

              {violations.length === 0 && (
                <button
                  onClick={handleContinue}
                  className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all uppercase tracking-widest shadow-[0_4px_12px_rgba(229,9,20,0.3)] active:scale-95 cursor-pointer shrink-0 border-none"
                >
                  Tiếp tục
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
