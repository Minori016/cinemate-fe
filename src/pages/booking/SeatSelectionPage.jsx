import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, CalendarDays, Clock, DoorOpen, Armchair, Check, Ticket, Users, Crown, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { movieService } from '../../services/movieService'
import { showtimeService, isPublicShowtimeStatus } from '../../services/showtimeService'
import { cinemaRoomService } from '../../services/cinemaRoomService'
import { concessionService } from '../../services/concessionService'
import { useAuth } from '../../contexts/AuthContext'
import { bookingService } from '../../services/bookingService'
import websocketService from '../../services/websocketService'
import {
  validateSeatSelection,
  getRowsFromLayout,
  SEAT_GAP_ERROR_MESSAGE,
} from '../../utils/seatValidation'
// removed BestViewZoneFrame and RecommendationOverlay


/* ── Custom Select Component ── */
function CustomSelect({ value, onChange, options, placeholder, disabled, error, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="flex flex-col gap-2 relative w-full text-left z-50" ref={containerRef}>
      {label && <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">{label}</span>}
      <motion.button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-[var(--color-surface-2)] border rounded-xl py-3 px-4 outline-none text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none text-left h-[46px]" style={{ borderColor: error ? 'var(--color-error)' : isOpen ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)', boxShadow: isOpen ? '0 0 10px rgba(229, 9, 20, 0.2)' : 'none' }} whileTap={{ scale: 0.97 }}>
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className="text-gray-400 select-none transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </motion.button>
      {error && <span className="text-[10px] text-red-500 font-semibold absolute top-[calc(100%+4px)] left-0 z-10">{error}</span>}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-full rounded-xl border z-[60] max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--color-surface-container)', borderColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', padding: '6px 0' }}>
          {options.length === 0 ? <div className="px-4 py-2.5 text-xs text-gray-500 italic select-none">Không có lựa chọn nào</div> : options.map(opt => {
            const isSelected = opt.value === value
            return <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false) }} className="px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between font-medium" style={{ backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.15)' : 'transparent', color: isSelected ? 'var(--color-primary)' : 'inherit' }}><span className="truncate">{opt.label}</span>{isSelected && <CheckCircle2 size={14} className="font-bold" style={{ color: 'var(--color-primary)' }} />}</div>
          })}
        </div>
      )}
    </div>
  )
}

export default function SeatSelectionPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const movieId = params.get('movieId') || params.get('movie')
  const time = params.get('time')
  const dateStr = params.get('date')
  const roomIdParam = params.get('roomId') || ''

  const [movie, setMovie] = useState(null)
  const [selected, setSelected] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [seatLayout, setSeatLayout] = useState(null)
  const [seatError, setSeatError] = useState('')
  const [matchedShowtime, setMatchedShowtime] = useState(null)
  const seatRefs = useRef({})
  const [gridRoot, setGridRoot] = useState(null)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [processingSeats, setProcessingSeats] = useState([])

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          toast.error('Thời gian chọn ghế đã hết!', {
            description: 'Hệ thống tự động hủy phiên giao dịch của bạn.',
            duration: 4000
          })
          navigate(-1)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, navigate])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }


  // Build occupied set from canonical API seat data.
  const occupiedSet = useMemo(() => {
    const set = new Set()
    if (!seatLayout?.seatMatrix) return set
    seatLayout.seatMatrix.forEach(row => {
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
    return set
  }, [seatLayout])

  // Build dynamic seat rows from layout
  const dynamicSeatRows = useMemo(() => {
    if (!seatLayout?.seatMatrix) return null
    return seatLayout.seatMatrix.map(row => {
      const firstActive = row.seats.find(s => s.type !== 'AISLE' && s.type !== 'COUPLE_EXTENSION')
      const type = firstActive?.type === 'VIP' ? 'vip' : firstActive?.type === 'COUPLE' ? 'couple' : 'standard'
      return { row: row.rowLabel, type }
    })
  }, [seatLayout])



  // Rows used by gap validator
  const validationRows = useMemo(() => {
    if (seatLayout?.seatMatrix?.length) return getRowsFromLayout(seatLayout)
    return []
  }, [seatLayout])

  // Gap validation rejects invalid selections immediately, so no residual violations.
  const violations = []



  // Combo selection states (from API)
  const [combos, setCombos] = useState([])
  const [selectedCombos, setSelectedCombos] = useState({})

  const handleUpdateComboQty = (id, delta) => {
    setSelectedCombos(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
  }

  const [isHolding, setIsHolding] = useState(false)

  const IS_UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const isUuid = (id) => typeof id === 'string' && IS_UUID_REGEX.test(id);

  const handleHoldSeats = async () => {
    if (!matchedShowtime?.id || !seatLayout?.seatMatrix?.length || selected.length === 0) {
      setSeatError('Không có dữ liệu ghế hợp lệ để tiếp tục đặt vé.')
      return
    }
    if (violations.length > 0) {
      alert('Không được để trống 1 ghế đơn độc giữa các ghế đã chọn!')
      return
    }

    try {
      setIsHolding(true)

      const validSeatIds = selected.map(id => {
        if (isUuid(id)) return id;
        if (seatLayout?.seatMatrix) {
          for (const row of seatLayout.seatMatrix) {
            for (const seat of (row.seats || [])) {
              if (seat.id && isUuid(seat.id) && (`${seat.rowLabel || row.rowLabel}${seat.number}` === id || seat.id === id)) {
                return seat.id;
              }
            }
          }
        }
        return id;
      }).filter(isUuid);

      if (validSeatIds.length === 0) {
        alert('Phòng chiếu của suất chiếu này chưa được khởi tạo ghế trong cơ sở dữ liệu. Vui lòng chọn suất chiếu khác.');
        setIsHolding(false);
        return;
      }

      const validConcessions = Object.entries(selectedCombos)
        .filter(([id, qty]) => qty > 0 && isUuid(id))
        .map(([id, qty]) => ({ comboId: id, quantity: Number(qty) }));

      const payload = {
        showtimeId: matchedShowtime.id,
        seatIds: validSeatIds,
      };
      if (validConcessions.length > 0) {
        payload.concessions = validConcessions;
      }

      const res = await bookingService.holdSeats(payload)
      
      const bookingData = res.data?.result || res.data
      navigate(`/checkout?bookingId=${bookingData.bookingId}`)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Đã có lỗi xảy ra khi giữ ghế. Vui lòng thử lại.')
    } finally {
      setIsHolding(false)
    }
  }

  // Fetch movie info from API
  useEffect(() => {
    if (movieId) {
      setLoading(true)
      movieService.getById(movieId)
        .then(res => setMovie(res.data))
        .catch(() => setMovie(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [movieId])

  // Fetch combos/bắp nước from public API
  useEffect(() => {
    let cancelled = false
    concessionService.getActiveForUi()
      .then(list => {
        if (cancelled) return
        const mapped = Array.isArray(list) ? list : []
        setCombos(mapped)
        const initQty = {}
        mapped.forEach(c => { initQty[c.id] = 0 })
        setSelectedCombos(initQty)
      })
    return () => { cancelled = true }
  }, [])

  // Fetch seat layout from API (public statuses include DRAFT)
  useEffect(() => {
    if (!movieId || !dateStr || !time) return
    let cancelled = false
    const fetchSeatLayout = async () => {
      setSeatError('')
      try {
        const showtimes = await showtimeService.getByMovie(movieId, dateStr)
        const matched = (showtimes || []).find(st => {
          if (!st.startTime) return false
          const stTime = st.startTime.split('T')[1]?.substring(0, 5)
          const matchesRoom = roomIdParam ? String(st.roomId) === String(roomIdParam) : true
          return stTime === time && matchesRoom && isPublicShowtimeStatus(st.status)
        })

        if (cancelled) return
        if (!matched || !matched.roomId) {
          setMatchedShowtime(null)
          setSeatLayout(null)
          setSeatError('Không tìm thấy suất chiếu phù hợp để tải sơ đồ ghế')
          return
        }

        setMatchedShowtime(matched)
        const [data, seatMapRes] = await Promise.all([
          cinemaRoomService.getLayoutNormalized(matched.roomId, {
            roomName: matched.roomName || matched.room || '',
          }),
          bookingService.getSeatMap(matched.id)
        ])
        
        if (cancelled) return
        if (data?.seatMatrix?.length) {
          setSeatLayout({ ...data, showtimeId: matched.id })
          updateOccupiedFromSeatMap(seatMapRes.data?.result || seatMapRes.data)
        } else {
          setSeatError('Không tải được sơ đồ ghế')
          setSeatLayout(null)
        }

        // Connect Websocket
        websocketService.connect(() => {
          if (cancelled) return;
          websocketService.subscribeToSeatMap(matched.id, (message) => {
            if (message && message.type === 'SEAT_MAP_UPDATED') {
              // Nhận tín hiệu -> Gọi API lấy seat map mới
              bookingService.getSeatMap(matched.id).then(res => {
                if (!cancelled) {
                  updateOccupiedFromSeatMap(res.data?.result || res.data)
                }
              }).catch(console.error);
            }
          })
        })

      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch seat layout:', err)
        setSeatError('Không tải được sơ đồ ghế')
        setSeatLayout(null)
        setMatchedShowtime(null)
      }
    }
    fetchSeatLayout()
    return () => { 
      cancelled = true 
      if (seatLayout?.showtimeId) {
        websocketService.unsubscribeFromSeatMap(seatLayout.showtimeId)
      }
    }
  }, [movieId, dateStr, time, roomIdParam])

  // Cleanup Redis locks on page unload / navigate away
  useEffect(() => {
    const cleanup = () => {
      if (seatLayout?.showtimeId) {
        bookingService.clearMyLocks(seatLayout.showtimeId).catch(() => {})
      }
    }
    window.addEventListener('beforeunload', cleanup)
    return () => {
      window.removeEventListener('beforeunload', cleanup)
      cleanup()
    }
  }, [seatLayout?.showtimeId])

  const [realSeatMap, setRealSeatMap] = useState(null)

  function updateOccupiedFromSeatMap(seatMapData) {
    if (!seatMapData?.seats) return
    setRealSeatMap(seatMapData.seats)

    const ownLockedSeats = seatMapData.seats
      .filter((seat) => seat.lockedByCurrentUser && seat.status === 'HELD')
      .map((seat) => seat.seatId)
    if (ownLockedSeats.length > 0) {
      setSelected((previous) => [...new Set([...previous, ...ownLockedSeats])])
    }
  }

  // Override currentOccupied from realSeatMap
  const currentOccupied = useMemo(() => {
    if (realSeatMap) {
      const set = new Set()
      realSeatMap.forEach(s => {
        if (s.status === 'HELD' || s.status === 'CONFIRMED' || s.status === 'CANCELLED_UNAVAILABLE' || s.status === 'MAINTENANCE') {
          // Skip seats owned by current user — they should remain selectable
          if (s.lockedByCurrentUser) return
          if (!selected.includes(s.seatId) && !processingSeats.includes(s.seatId)) {
            set.add(s.seatId)
          }
        }
      })
      // Thêm các ghế Aisle/Couple_Extension từ layout
      if (seatLayout?.seatMatrix) {
        seatLayout.seatMatrix.forEach(row => {
          row.seats.forEach(seat => {
            if (seat.type === 'AISLE' || seat.type === 'MAINTENANCE') {
              set.add(seat.id)
            }
          })
        })
      }
      return set
    }
    return occupiedSet
  }, [realSeatMap, seatLayout, dynamicSeatRows, occupiedSet, processingSeats])

  // Chọn/bỏ chọn ghế — validate gap rule trước khi cập nhật state
  const toggleSeat = useCallback(async (seatId, type) => {
    const isSelected = selected.includes(seatId)

    // Nếu ghế ĐANG trong danh sách selected của user hiện tại, cho phép bỏ chọn dù currentOccupied có nó (do Backend trả về HELD)
    if (!isSelected && currentOccupied.has(seatId)) return

    let targetIds = [seatId]
    if (type === 'couple' || type === 'COUPLE') {
      if (seatLayout && seatLayout.seatMatrix) {
        for (let row of seatLayout.seatMatrix) {
          const idx = row.seats.findIndex(s => s.id === seatId)
          if (idx !== -1 && idx + 1 < row.seats.length && row.seats[idx + 1].type === 'COUPLE_EXTENSION') {
            targetIds.push(row.seats[idx + 1].id)
          }
        }
      }
    }

    if (targetIds.some(id => processingSeats.includes(id))) return

    // validate gap rule trước khi cập nhật state (cả khi chọn và bỏ chọn)
    const result = validateSeatSelection({
      rows: validationRows,
      currentSelected: selected,
      toggledSeatId: seatId,
      isSelecting: !isSelected
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

    setProcessingSeats(prev => [...prev, ...targetIds])

    if (isSelected) {
      try {
        await bookingService.unlockSeat(matchedShowtime.id, seatId);
        setSelected(prev => prev.filter(id => !targetIds.includes(id)))
      } catch (error) {
        console.error('Failed to unlock seat', error);
      } finally {
        setProcessingSeats(prev => prev.filter(id => !targetIds.includes(id)))
      }
      return
    }
    
    if (selected.length + targetIds.length > 8) {
      alert('Chỉ được chọn tối đa 8 ghế!')
      setProcessingSeats(prev => prev.filter(id => !targetIds.includes(id)))
      return
    }

    try {
      await bookingService.lockSeats(matchedShowtime.id, targetIds);
      setSelected(prev => [...prev, ...targetIds])
    } catch (error) {
      console.error('Failed to lock seats', error);
      alert(error.response?.data?.message || 'Không thể chọn ghế này. Có thể người khác đang giữ.');
    } finally {
      setProcessingSeats(prev => prev.filter(id => !targetIds.includes(id)))
    }
  }, [currentOccupied, validationRows, selected, seatLayout, matchedShowtime, processingSeats])

  // Giá của từng loại ghế (ưu tiên giá từ showtime nếu có)
  const getSeatPrice = useCallback((seatId) => {
    if (matchedShowtime) {
      const seat = seatLayout?.seatMatrix
        ?.flatMap(r => r.seats || [])
        ?.find(s => s.id === seatId)
      const type = String(seat?.type || '').toUpperCase()
      if (type === 'VIP' && matchedShowtime.vipPrice) return Number(matchedShowtime.vipPrice)
      if (type === 'COUPLE' && matchedShowtime.couplePrice) return Number(matchedShowtime.couplePrice)
      if (type === 'STANDARD' && matchedShowtime.price) return Number(matchedShowtime.price)
    }
    
    if (realSeatMap) {
      const seat = realSeatMap.find(s => s.seatId === seatId)
      if (seat && seat.price) return seat.price
    }
    
    const row = String(seatId).charAt(0)
    if (row === 'A' || row === 'B' || row === 'C') return 90000
    if (row === 'D' || row === 'E' || row === 'F') return 110000
    if (row === 'G' || row === 'H') return 130000
    return 0
  }, [matchedShowtime, seatLayout, realSeatMap])

  // Tính tổng tiền vé
  const ticketPrice = selected.reduce((sum, id) => sum + getSeatPrice(id), 0)

  // Tính tổng tiền bắp nước
  const comboPrice = Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
    const combo = combos.find(c => String(c.id) === String(id))
    return sum + (combo ? combo.price * qty : 0)
  }, 0)

  // Tổng tiền thanh toán
  const totalPrice = ticketPrice + comboPrice

  // Định dạng tiền tệ VNĐ
  const formatCurrency = useCallback((val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }, [])

  // Định dạng ngày hiển thị
  const formatDate = useCallback((dateString) => {
    if (!dateString || dateString === 'Hôm nay') return 'Hôm nay'
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return dateString }
  }, [])

  // ── Seat rendering helpers ──
  function isSeatOccupied(seatId) {
    return currentOccupied.has(seatId)
  }

  function renderSeatButton(seat, type) {
    const occupied = isSeatOccupied(seat.id)
    const isVip = type === 'vip'
    const isSelected = selected.includes(seat.id)
    const isProcessing = processingSeats.includes(seat.id)

    return (
      <label ref={(node) => { if (node) seatRefs.current[seat.id] = node; else delete seatRefs.current[seat.id] }} key={seat.id} className={`seat-btn w-8 h-8 rounded border flex items-center justify-center text-xs font-bold relative ${isProcessing ? 'animate-pulse border-blue-500 text-blue-500 bg-blue-500/10 cursor-wait' : occupied ? 'occupied cursor-not-allowed opacity-40' : isSelected ? 'selected cursor-pointer' : isVip ? 'vip border-[#f59e0b]/60 text-[#f59e0b] hover:bg-[#f59e0b]/10 cursor-pointer' : 'border-gray-600 text-gray-300 hover:bg-white/5 cursor-pointer'}`} title={seat.id}>
        <input type="checkbox" checked={isSelected} disabled={occupied || isProcessing} onChange={() => toggleSeat(seat.id, type)} className="sr-only" />
        {seat.row ? `${seat.row}${seat.number}` : seat.id}
      </label>
    )
  }

  function renderCoupleButton(seat) {
    const occupied = isSeatOccupied(seat.id)
    const isSelected = selected.includes(seat.id)
    const isProcessing = processingSeats.includes(seat.id)
    return (
      <label ref={(node) => { if (node) seatRefs.current[seat.id] = node; else delete seatRefs.current[seat.id] }} key={seat.id} className={`seat-btn couple h-8 rounded border flex items-center justify-center text-xs font-bold relative ${isProcessing ? 'animate-pulse border-blue-500 text-blue-500 bg-blue-500/10 cursor-wait' : occupied ? 'occupied cursor-not-allowed opacity-40' : isSelected ? 'selected cursor-pointer' : 'border-red-600/60 text-red-500 hover:bg-red-600/10 cursor-pointer'}`} title={seat.id}>
        <input type="checkbox" checked={isSelected} disabled={occupied || isProcessing} onChange={() => toggleSeat(seat.id, 'couple')} className="sr-only" />
        {seat.number != null ? `${seat.row}${seat.number}` : seat.id}
      </label>
    )
  }

  function renderDynamicRow(row) {
    return (
      <div key={row.rowLabel} className="flex items-center justify-center gap-3.5 w-full">
        <span className="w-6 text-center font-bold text-gray-500 text-sm tracking-wide">{row.rowLabel}</span>
        <div className="flex items-center gap-2">
          {row.seats.map(seat => {
            if (seat.type === 'AISLE') {
              return (
                <div key={seat.id} className="w-8 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-40">
                  │
                </div>
              )
            }
            if (seat.type === 'COUPLE_EXTENSION') {
              return null
            }
            if (seat.type === 'COUPLE') {
              return renderCoupleButton(seat)
            }
            return renderSeatButton(seat, seat.type.toLowerCase())
          })}
        </div>
        <span className="w-6 text-center font-bold text-gray-500 text-sm tracking-wide">{row.rowLabel}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080F]">
        <Loader2 size={28} className="animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <motion.div className="bg-[#06080F] text-[#e2e2e2] min-h-screen flex flex-col font-sans selection:bg-red-900 selection:text-white pb-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <style>{`.seat-btn { transition: all 0.2s ease; cursor: pointer; }
        .seat-btn:hover:not(.occupied):not(:disabled) { transform: scale(1.15); box-shadow: 0 0 8px rgba(255, 255, 255, 0.2); }
        .seat-btn.selected { background-color: var(--color-primary) !important; border-color: var(--color-primary) !important; color: #fff !important; box-shadow: 0 0 12px var(--color-primary); }
        .seat-btn.occupied { background-color: #282a2b !important; border-color: #4e4353 !important; color: #6b7280 !important; cursor: not-allowed; opacity: 0.4; }
        .seat-btn.vip { border-color: #f59e0b; color: #f59e0b; }
        .seat-btn.couple { width: 76px; border-color: #E02020; color: #E02020; }
        .seat-btn.couple.selected { background-color: var(--color-primary) !important; border-color: var(--color-primary) !important; color: #fff !important; }
        .screen-curve { background: linear-gradient(to bottom, rgba(229, 9, 20, 0.3) 0%, transparent 100%); box-shadow: 0 15px 35px rgba(229, 9, 20, 0.15); transform: perspective(200px) rotateX(-5deg); }
        .custom-font-title { font-family: 'Anton', sans-serif; }`}</style>

      {/* Transactional Top Navigation */}
      <header className="bg-[#121414]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl flex justify-between items-center w-full px-6 md:px-12 h-20 fixed top-0 left-0 right-0 z-40">
        <motion.button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-semibold uppercase tracking-wider" whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại</span>
        </motion.button>
        <div className="text-center">
          <h1 className="custom-font-title text-2xl md:text-3xl tracking-widest uppercase" style={{ fontWeight: 900 }}><span className="text-white">Cine</span><span className="text-red-500">mate</span></h1>
        </div>
        <div className="flex items-center gap-2 text-red-500 font-mono font-bold text-lg bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20">
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-28 px-4 md:px-8 max-w-5xl mx-auto w-full flex flex-col items-center">
        {/* Booking Details Summary Header */}
        <div className="w-full text-center mb-10">
          <motion.h2 className="custom-font-title text-3xl md:text-5xl text-red-500 mb-2 tracking-wide uppercase" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}>
            {movie ? (movie.title || movie.titleVn || movie.movieNameVn || 'Đang Tải Phim...') : 'Đang Tải Phim...'}
          </motion.h2>
          <p className="text-sm text-gray-400 flex items-center justify-center flex-wrap gap-4 font-medium">
            <span className="flex items-center gap-1"><CalendarDays size={14} />{formatDate(dateStr)}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
            <span className="flex items-center gap-1"><Clock size={14} />{time}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
            <span className="flex items-center gap-1"><DoorOpen size={14} />{seatLayout?.roomName || matchedShowtime?.roomName || matchedShowtime?.room || 'Phòng chiếu'}</span>
          </p>
          {seatError && <p className="text-xs text-red-400 mt-2">{seatError}</p>}
        </div>

        {/* Legend */}
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-wrap justify-center gap-5 md:gap-7 mb-10">
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded border border-gray-500 bg-transparent"></div><span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Thường</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded border border-[#f59e0b] bg-transparent text-[#f59e0b] flex items-center justify-center text-[10px] font-black">V</div><span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">VIP</span></div>
          <div className="flex items-center gap-2"><div className="w-10 h-6 rounded border border-[#E02020] bg-transparent text-[#E02020] flex items-center justify-center text-[10px] font-black">COUPLE</div><span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Đôi</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,9,20,0.5)]"></div><span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Đang Chọn</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#282a2b] border border-[#4e4353] opacity-40"></div><span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Đã Bán</span></div>
        </div>

        {/* Seating Layout Area */}
        <div className="w-full flex flex-col items-center select-none">
          {/* Screen curve graphic */}
          <div className="w-4/5 h-16 mb-12 relative flex flex-col items-center justify-start">
            <div className="w-full h-8 screen-curve rounded-[100%] border-t-2 border-red-500/50"></div>
            <p className="text-[10px] text-red-500/50 font-bold uppercase tracking-[0.25em] mt-3">Màn Hình Chiếu</p>
          </div>

          {/* Seat Rows Grid Container */}
          <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
            <div ref={setGridRoot} className="relative min-w-max mx-auto px-4 flex flex-col gap-3.5 items-center">
              {seatLayout?.seatMatrix
                ? seatLayout.seatMatrix.map(row => renderDynamicRow(row))
                : (
                  <p className="py-10 text-sm font-medium text-gray-400">
                    Chưa có sơ đồ ghế hợp lệ cho suất chiếu này.
                  </p>
                )}

              {/* Entrance / Exit Indicators */}
              <div className="w-full max-w-[620px] flex justify-between items-center mt-6 px-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-[0_2px_10px_rgba(16,185,129,0.05)]">
                  <DoorOpen size={14} className="font-bold" /><span>Lối vào / Entrance</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-[0_2px_10px_rgba(239,68,68,0.05)]">
                  <DoorOpen size={14} className="font-bold" /><span>Lối ra / Exit</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action/Checkout Bar */}
      <div className="fixed bottom-0 left-0 w-full z-30 p-4 md:p-6 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-4xl bg-[#1a1c1c]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_-10px_45px_rgba(229,9,20,0.25)] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {selected.length === 0 ? (
            <div className="flex items-center gap-3 flex-grow text-left">
              <Ticket size={22} className="text-red-500 select-none animate-pulse" />
              <p className="text-base md:text-lg font-bold text-white tracking-wide m-0">Vui lòng chọn ghế để tiếp tục</p>
            </div>
          ) : (
            <div className="flex items-center gap-6 flex-grow text-left">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Ghế đã chọn</p>
                <div className="flex gap-2 flex-wrap max-w-[250px]">
                  {selected.map(id => (
                    <span key={id} className="text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded">{id}</span>
                  ))}
                </div>
              </div>
              <div className="w-[1px] h-10 bg-white/10"></div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Tạm tính</p>
                <p className="text-xl md:text-2xl font-black text-red-500">{formatCurrency(ticketPrice)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 shrink-0">
            <motion.button 
              disabled={selected.length === 0 || isHolding || violations.length > 0} 
              onClick={handleHoldSeats} 
              className="bg-[var(--color-primary)] text-white font-bold text-base px-10 py-4 rounded-xl shadow-[0_0_24px_rgba(229,9,20,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group uppercase tracking-wider cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
              whileHover={{ scale: (selected.length === 0 || isHolding || violations.length > 0) ? 1 : 1.05 }} 
              whileTap={{ scale: (selected.length === 0 || isHolding || violations.length > 0) ? 1 : 0.95 }}
            >
              {isHolding ? <Loader2 size={18} className="animate-spin" /> : <span>Tiếp tục</span>}
              {!isHolding && <ArrowLeft size={18} className="font-black group-hover:-translate-x-1 transition-transform rotate-180" />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
