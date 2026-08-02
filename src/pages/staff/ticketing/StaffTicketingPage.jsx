import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutGrid, Ticket, ShoppingBag, CheckCircle,
  AlertCircle, X, Search, CreditCard, QrCode,
  Coins, User, Printer, RotateCcw, ChevronRight,
  ChevronLeft, Armchair, Square, Sofa, Wrench, ShieldAlert, Clock3,
  Info, LogIn, LogOut
} from 'lucide-react'
import { movieService } from '../../../services/movieService'
import { showtimeService } from '../../../services/showtimeService'
import { concessionService, FALLBACK_COMBOS } from '../../../services/concessionService'
import { bookingService } from '../../../services/bookingService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { paymentService } from '../../../services/paymentService'

const MOCK_MEMBERS = []

// 🟢 HÀM KIỂM TRA GHẾ THUỘC VÙNG VIP TRUNG TÂM (ĐỒNG BỘ THEO DỮ LIỆU ADMIN)
const checkIsVipCenterSeat = (seatId) => {
  if (!seatId) return false
  const row = seatId.charAt(0).toUpperCase()
  const num = parseInt(seatId.substring(1), 10)

  if (row === 'F') return num >= 1 && num <= 10
  if (row === 'G') return num >= 3 && num <= 8
  if (row === 'H') return num >= 3 && num <= 8
  if (row === 'I') return num >= 4 && num <= 7

  return false
}

export default function StaffTicketingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCombos, setLoadingCombos] = useState(false)
  const [error, setError] = useState('')

  // Selected values
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedShowtime, setSelectedShowtime] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedCombos, setSelectedCombos] = useState({})

  // Member states
  const [memberQuery, setMemberQuery] = useState('')
  const [checkedMember, setCheckedMember] = useState(false)
  const [foundMember, setFoundMember] = useState(null)
  const [convertCount, setConvertCount] = useState(0)
  const [scoreError, setScoreError] = useState('')

  // Checkout states
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [printedTicket, setPrintedTicket] = useState(null)
  const [holdSeconds, setHoldSeconds] = useState(300)

  const [seatMapRefreshKey, setSeatMapRefreshKey] = useState(0)

  // 1. Fetch movies and showtimes on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [moviesRes, showtimesRes] = await Promise.all([
          movieService.getAll({ page: 0, size: 100 }),
          showtimeService.getPublicShowtimes()
        ])

        let showtimesList = showtimesRes
        if (!Array.isArray(showtimesList)) {
          showtimesList = showtimesRes?.result || showtimesRes?.data || []
        }
        if (!Array.isArray(showtimesList)) showtimesList = []
        setShowtimes(showtimesList)

        const rawMovies = moviesRes.data?.result?.content || moviesRes.data?.result || moviesRes.data || []
        let moviesList = Array.isArray(rawMovies) ? rawMovies : (Array.isArray(rawMovies?.content) ? rawMovies.content : [])

        const moviesWithShowtimesIds = new Set(showtimesList.map(st => String(st.movieId)))
        moviesList = moviesList.filter(m => moviesWithShowtimesIds.has(String(m.id)))

        setMovies(moviesList)
      } catch (err) {
        console.error('Lỗi khi tải danh sách phim/suất chiếu từ API:', err)
        setError('Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 2. TẢI DANH SÁCH BẮP NƯỚC TỪ API BACKEND
  useEffect(() => {
    let cancelled = false
    setLoadingCombos(true)
    concessionService.getActiveForUi({ fallback: true })
      .then(list => {
        if (cancelled) return
        const mapped = Array.isArray(list) && list.length > 0 ? list : FALLBACK_COMBOS
        setCombos(mapped)
        const initQty = {}
        mapped.forEach(c => {
          const comboId = c.id || c.uuid
          initQty[comboId] = 0
        })
        setSelectedCombos(initQty)
      })
      .catch(err => {
        console.error('Lỗi khi nạp danh sách bắp nước:', err)
        setCombos(FALLBACK_COMBOS)
      })
      .finally(() => {
        if (!cancelled) setLoadingCombos(false)
      })
    return () => { cancelled = true }
  }, [])

  const availableShowtimes = useMemo(() => {
    if (!selectedMovie || !Array.isArray(showtimes)) return []
    const mTitle = selectedMovie.titleVn || selectedMovie.title || ''
    return showtimes.filter(s => {
      const matchTitle = s.movie && mTitle && s.movie.toUpperCase() === mTitle.toUpperCase()
      const matchId = String(s.movieId) === String(selectedMovie.id)
      return matchTitle || matchId
    })
  }, [selectedMovie, showtimes])

  useEffect(() => {
    if (currentStep !== 2) return
    const interval = setInterval(() => {
      setHoldSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [currentStep])

  useEffect(() => {
    if (currentStep === 2) {
      setHoldSeconds(300)
    }
  }, [currentStep, selectedShowtime])

  const stepConfig = [
    { step: 1, label: 'LỊCH CHIẾU', icon: LayoutGrid },
    { step: 2, label: 'CHỌN GHẾ', icon: Armchair },
    { step: 3, label: 'BẮP NƯỚC', icon: ShoppingBag },
    { step: 4, label: 'THANH TOÁN', icon: CreditCard }
  ]

  const holdTimerLabel = `${String(Math.floor(holdSeconds / 60)).padStart(2, '0')}:${String(holdSeconds % 60).padStart(2, '0')}`

  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [maintenanceSeats, setMaintenanceSeats] = useState([])
  const [roomLayout, setRoomLayout] = useState(null)
  const [seatIdMap, setSeatIdMap] = useState({})

  // Fetch real seat map and room layout from backend
  useEffect(() => {
    let cancelled = false
    const fetchSeatMapAndLayout = async () => {
      if (!selectedShowtime) {
        setOccupiedSeats([])
        setMaintenanceSeats([])
        setRoomLayout(null)
        setSeatIdMap({})
        return
      }
      try {
        const [res, layoutRes] = await Promise.all([
          bookingService.getSeatMap(selectedShowtime.id),
          cinemaRoomService.getLayoutNormalized(selectedShowtime.roomId)
        ])

        if (cancelled) return

        if (layoutRes) {
          setRoomLayout(layoutRes)
        }

        const seatMapPayload = res.data?.result || res.data || []
        const seatMapData = Array.isArray(seatMapPayload)
          ? seatMapPayload
          : Array.isArray(seatMapPayload.seats)
            ? seatMapPayload.seats
            : []
        const occupied = []
        const maintenance = []

        const idMap = {}
        seatMapData.forEach(seat => {
          const seatLabel = `${seat.rowLabel || seat.rowName}${seat.seatNumber}`
          const backendSeatUuid = seat.seatId || seat.id || seat.seatUuid || seat.uuid

          if (backendSeatUuid) {
            idMap[seatLabel] = backendSeatUuid
          }

          if (['SOLD', 'LOCKED', 'HELD', 'CONFIRMED'].includes(seat.status)) {
            occupied.push(seatLabel)
          } else if (['MAINTENANCE', 'BROKEN'].includes(seat.status)) {
            maintenance.push(seatLabel)
          }
        })
        setSeatIdMap(idMap)
        setOccupiedSeats(occupied)
        setMaintenanceSeats(maintenance)
      } catch (err) {
        console.error('Failed to fetch seat map or layout:', err)
        if (!cancelled) {
          setOccupiedSeats([])
          setMaintenanceSeats([])
        }
      }
    }

    fetchSeatMapAndLayout()
    return () => { cancelled = true }
  }, [selectedShowtime, seatMapRefreshKey])

  // 🟢 TÍNH GIÁ TIỀN GHẾ DỰA TRÊN THÔNG TIN TỪ BACK-END
  // 🟢 TÍNH GIÁ GHẾ ĐỒNG BỘ CHUẨN THEO USER & BACKEND
  const getSeatPrice = (seatId) => {
    const rowChar = seatId.charAt(0).toUpperCase()

    // 1. Xác định loại ghế theo đúng sơ đồ
    let seatType = 'STANDARD'
    if (checkIsVipCenterSeat(seatId)) {
      seatType = 'VIP'
    } else if (rowChar === 'J') {
      seatType = 'COUPLE'
    }

    // 2. ƯU TIÊN LẤY GIÁ CHÍNH XÁC TỪ BACK-END (selectedShowtime.prices)
    if (selectedShowtime?.prices && Array.isArray(selectedShowtime.prices) && selectedShowtime.prices.length > 0) {
      const matchedPriceObj = selectedShowtime.prices.find(
        p => String(p.seatType || '').toUpperCase() === seatType
      )
      if (matchedPriceObj && matchedPriceObj.price != null) {
        return Number(matchedPriceObj.price)
      }
    }

    // 3. Fallback nếu suất chiếu chỉ có giá phẳng (selectedShowtime.price / vipPrice / couplePrice)
    if (seatType === 'VIP' && selectedShowtime?.vipPrice != null) {
      return Number(selectedShowtime.vipPrice)
    }
    if (seatType === 'COUPLE' && selectedShowtime?.couplePrice != null) {
      return Number(selectedShowtime.couplePrice)
    }
    if (seatType === 'STANDARD' && selectedShowtime?.price != null) {
      return Number(selectedShowtime.price)
    }

    // 4. Fallback mặc định theo công thức Back-End (Base = 90k)
    const basePrice = Number(selectedShowtime?.price) || 90000
    if (seatType === 'VIP') return basePrice + 20000       // 90k + 20k = 110k (hoặc theo cấu hình)
    if (seatType === 'COUPLE') return basePrice * 2 + 10000 // 90k * 2 + 10k = 190k

    return basePrice
  }

  const handleSeatClick = (primarySeatId, pairedSeatId = null) => {
    const seatsToToggle = pairedSeatId ? [primarySeatId, pairedSeatId] : [primarySeatId]

    const isBlocked = seatsToToggle.some(id => occupiedSeats.includes(id) || maintenanceSeats.includes(id))
    if (isBlocked) return

    setSelectedSeats(prev => {
      const isAlreadySelected = seatsToToggle.every(id => prev.includes(id))
      if (isAlreadySelected) {
        return prev.filter(id => !seatsToToggle.includes(id))
      } else {
        const newSet = new Set([...prev, ...seatsToToggle])
        return Array.from(newSet)
      }
    })
  }

  // Tăng giảm số lượng bắp nước
  const handleComboQty = (comboId, delta) => {
    setSelectedCombos(prev => ({
      ...prev,
      [comboId]: Math.max(0, (prev[comboId] || 0) + delta)
    }))
  }

  const handleCheckMember = async (e) => {
    if (e) e.preventDefault()
    if (!memberQuery.trim()) return

    const trimmed = memberQuery.trim()
    setCheckedMember(true)
    setConvertCount(0)
    setScoreError('')
    setFoundMember(null)

    try {
      const res = await bookingService.lookupCustomer(trimmed)
      const data = res.data?.result || res.data

      if (data) {
        setFoundMember({
          memberId: data.customerId || data.phone || 'MEMBER',
          customerId: data.customerId,
          fullName: data.fullName || 'Khách hàng',
          phone: data.phone || trimmed,
          score: data.loyaltyPoints ?? 0,
          loyaltyPoints: data.loyaltyPoints ?? 0,
          membershipTier: data.membershipTier || 'MEMBER'
        })
        return
      }
    } catch (err) {
      console.warn('API không tìm thấy dữ liệu hội viên:', err)
    }

    setFoundMember(null)
  }

  useEffect(() => {
    if (!foundMember || convertCount === 0) {
      setScoreError('')
      return
    }

    const requiredScore = convertCount * 1000
    if (foundMember.score < requiredScore) {
      setScoreError('Điểm tích lũy không đủ để thực hiện đổi vé')
    } else {
      setScoreError('')
    }
  }, [convertCount, foundMember])

  const ticketPriceTotal = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0)
  }, [selectedSeats, selectedShowtime])

  // TÍNH TỔNG TIỀN BẮP NƯỚC THỰC TẾ
  const comboPriceTotal = useMemo(() => {
    return Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
      const combo = combos.find(c => String(c.id || c.uuid) === String(id))
      return sum + (combo ? (Number(combo.price) || 0) * qty : 0)
    }, 0)
  }, [selectedCombos, combos])

  const singleTicketPrice = selectedSeats.length > 0 ? (ticketPriceTotal / selectedSeats.length) : 0
  const discountTotal = convertCount * singleTicketPrice
  const finalPriceTotal = Math.max(0, ticketPriceTotal - discountTotal) + comboPriceTotal

  const changeReturn = useMemo(() => {
    if (!cashReceived || isNaN(cashReceived)) return 0
    return Math.max(0, parseInt(cashReceived, 10) - finalPriceTotal)
  }, [cashReceived, finalPriceTotal])

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' đ'

  // XỬ LÝ THANH TOÁN THẬT VỚI API
  // 🟢 XỬ LÝ THANH TOÁN ĐỒNG BỘ CHUẨN AXIOS & BẮT LỖI 409
  const handleCheckout = async () => {
    if (paymentMethod === 'cash' && (!cashReceived || parseInt(cashReceived, 10) < finalPriceTotal)) {
      setError('Số tiền khách đưa chưa đủ để thanh toán.')
      return
    }

    const backendSeatIds = selectedSeats.map(label => seatIdMap[label]).filter(Boolean)

    if (backendSeatIds.length !== selectedSeats.length) {
      setError('Chưa lấy được mã ID ghế từ Hệ thống. Vui lòng bỏ chọn và chọn lại ghế.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const showtimeUuid = selectedShowtime?.id || selectedShowtime?.showtimeId

      // 1. Chuẩn hóa payload bắp nước
      const validConcessions = Object.entries(selectedCombos)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({
          concessionId: id,
          quantity: qty
        }))

      const holdPayload = {
        showtimeId: showtimeUuid,
        seatIds: backendSeatIds,
        customerId: foundMember ? (foundMember.customerId || foundMember.userId) : null,
        concessions: validConcessions
      }

      // 2. Giữ ghế (Hold seats) thông qua bookingService
      const holdRes = await bookingService.holdSeats(holdPayload)
      const bookingData = holdRes?.data?.result || holdRes?.data
      const backendBookingId = bookingData?.bookingId || bookingData?.id

      if (!backendBookingId) {
        throw new Error('Máy chủ không tạo được mã booking.')
      }

      // 3. Xử lý thanh toán MoMo QR qua paymentService (Chuẩn Axios + Token Auth)
      if (paymentMethod === 'qr') {
        const momoRes = await paymentService.createMomoPayment(backendBookingId)
        const payUrl = momoRes?.data?.result?.payUrl || momoRes?.data?.payUrl

        if (payUrl) {
          window.location.href = payUrl
          return
        } else {
          throw new Error(momoRes?.data?.message || 'Không nhận được đường dẫn thanh toán từ MoMo.')
        }
      }

      // 4. Tiền mặt / Cà thẻ -> Confirm Booking ngay
      await bookingService.confirm(backendBookingId)

      const payload = {
        id: backendBookingId,
        movie: selectedMovie.titleVn || selectedMovie.title,
        screen: selectedShowtime.room,
        date: selectedShowtime.date === 'Hôm nay' ? new Date().toLocaleDateString('vi-VN') : selectedShowtime.date,
        time: selectedShowtime.time,
        seats: selectedSeats.join(', '),
        price: singleTicketPrice,
        total: finalPriceTotal,
        convertTickets: convertCount,
        scoreUsed: convertCount * 1000,
        memberId: foundMember ? (foundMember.customerId || foundMember.memberId) : 'GUEST',
        customerName: foundMember ? foundMember.fullName : 'Khách vãng lai',
        phone: foundMember ? foundMember.phone : 'N/A',
        email: foundMember ? `${foundMember.memberId.toLowerCase()}@cinemate.vn` : 'counter@cinemate.vn',
        idCard: foundMember ? foundMember.idCard : 'N/A',
        status: 'Đã thanh toán',
        checkedIn: false,
        checkInTime: null,
        paymentMethod: paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ ngân hàng' : 'MoMo QR',
        combosSummary: Object.entries(selectedCombos)
          .filter(([_, qty]) => qty > 0)
          .map(([id, qty]) => {
            const c = combos.find(combo => String(combo.id || combo.uuid) === String(id))
            return c ? `${c.name} (x${qty})` : `(x${qty})`
          }).join(', ')
      }

      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      localStorage.setItem('staff_bookings_db', JSON.stringify([payload, ...localBookings]))

      setSeatMapRefreshKey(prev => prev + 1)
      setPrintedTicket(payload)
    } catch (err) {
      console.error('Lỗi khi thanh toán:', err)

      // Xử lý thông báo lỗi chi tiết khi gặp lỗi 409 Conflict hoặc lỗi khác
      if (err.response?.status === 409) {
        setError('Ghế này đã có người giữ hoặc đặt trước đó! Vui lòng bấm "Tạo giao dịch mới" hoặc chọn ghế khác.')
        setSeatMapRefreshKey(prev => prev + 1) // Refresh sơ đồ ghế ngay lập tức
      } else {
        const serverMessage = err.response?.data?.message || err.response?.data?.result?.message || err.message
        setError(serverMessage || 'Có lỗi xảy ra trong quá trình thanh toán.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedMovie(null)
    setSelectedShowtime(null)
    setSelectedSeats([])
    const initQty = {}
    combos.forEach(c => {
      const comboId = c.id || c.uuid
      initQty[comboId] = 0
    })
    setSelectedCombos(initQty)
    setMemberQuery('')
    setCheckedMember(false)
    setFoundMember(null)
    setConvertCount(0)
    setScoreError('')
    setPaymentMethod('cash')
    setCashReceived('')
    setPrintedTicket(null)
    setError('')
    setSeatMapRefreshKey(prev => prev + 1)
  }

  const demoMatrix = [
    { rowLabel: 'A', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'B', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'C', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'D', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'E', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'F', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'G', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'H', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    { rowLabel: 'I', seats: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, type: 'STANDARD' })) },
    {
      rowLabel: 'J',
      seats: Array.from({ length: 5 }, (_, i) => ({ number: i * 2 + 1, type: 'COUPLE' }))
    },
  ]

  const activeSeatMatrix = useMemo(() => {
    const rawMatrix = (roomLayout && roomLayout.seatMatrix && roomLayout.seatMatrix.length > 0)
      ? roomLayout.seatMatrix
      : demoMatrix

    return rawMatrix.map(row => {
      const label = String(row.rowLabel || '').toUpperCase()

      return {
        ...row,
        seats: row.seats.map(seat => {
          const seatLabel = `${label}${seat.number}`
          const isVipCenter = checkIsVipCenterSeat(seatLabel)
          const isCouple = label === 'J'

          return {
            ...seat,
            type: isCouple ? 'COUPLE' : isVipCenter ? 'VIP' : 'STANDARD'
          }
        })
      }
    })
  }, [roomLayout])

  return (
    <div className="space-y-6 text-left min-h-screen text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase text-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Bán vé tại quầy (POS)
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Giao diện xuất vé và thanh toán nhanh dành cho nhân viên bán vé tại rạp.
          </p>
        </div>

        {selectedMovie && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Tạo giao dịch mới</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT WORKFLOW: Steps 1-4 */}
        <div className="lg:col-span-8 space-y-6">

          {/* Stepper Navigation bar */}
          <div className="flex justify-between items-center bg-[#0b0c10] border border-white/5 rounded-2xl px-8 py-3.5 shadow-2xl select-none">
            {stepConfig.map((step, idx) => {
              const isActive = currentStep === step.step
              const isDone = currentStep > step.step
              return (
                <React.Fragment key={step.step}>
                  <button
                    disabled={currentStep < step.step && (!selectedMovie || (step.step === 3 && selectedSeats.length === 0))}
                    onClick={() => setCurrentStep(step.step)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent transition-all outline-none disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${isActive
                      ? 'border-red-500 bg-red-950/40 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      : isDone
                        ? 'border-emerald-500 text-emerald-500 bg-emerald-950/20'
                        : 'border-slate-800 text-slate-600 bg-transparent'
                      }`}>
                      {isDone ? <CheckCircle size={16} /> : <step.icon size={16} />}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider ${isActive ? 'text-red-500' : isDone ? 'text-emerald-500' : 'text-slate-600'
                      }`}>
                      {step.label}
                    </span>
                  </button>
                  {idx < stepConfig.length - 1 && (
                    <div className={`h-[2px] flex-1 mx-4 ${currentStep > idx + 1 ? 'bg-emerald-500/60' : 'bg-slate-800/80'
                      }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Step Contents */}
          <div className="relative">

            {/* STEP 1: SELECT MOVIE & SHOWTIME */}
            {currentStep === 1 && (
              <div key="step1" className="space-y-6">
                {loading ? (
                  <div className="py-20 text-center text-slate-500 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
                    <span className="material-symbols-outlined animate-spin text-3xl text-red-500">progress_activity</span>
                    <p className="text-xs mt-2">Đang tải danh sách phim...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {movies.map(movie => {
                      const isSelected = selectedMovie && selectedMovie.id === movie.id
                      const movieTitle = movie.titleVn || movie.title
                      return (
                        <div
                          key={movie.id}
                          className={`flex rounded-2xl bg-[var(--color-surface)] border transition-all duration-200 overflow-hidden shadow-xl hover:border-white/10
                            ${isSelected ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
                        >
                          <div className="w-28 shrink-0 relative bg-black/40">
                            <img
                              src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300'}
                              alt={movieTitle}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-red-650 inline-block uppercase">
                                {movie.rating || 'P'}
                              </span>
                              <h4 className="text-sm font-bold text-white leading-snug line-clamp-2" title={movieTitle}>
                                {movieTitle}
                              </h4>
                              <p className="text-[11px] text-[var(--color-text-muted)] font-medium">
                                {movie.durationMinutes || 120} phút • {movie.titleEn || 'N/A'}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedMovie(movie)
                                setSelectedShowtime(null)
                              }}
                              className={`w-fit mt-3 px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${isSelected
                                ? 'bg-red-600 text-white border-transparent shadow-md'
                                : 'bg-slate-900 text-slate-300 hover:bg-red-600 hover:text-white border-slate-700 hover:border-red-600'
                                }`}
                            >
                              {isSelected ? 'Đang chọn' : 'Chọn phim'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Showtimes Selection panel */}
                {selectedMovie && (
                  <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl text-left space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Suất chiếu khả dụng cho: {selectedMovie.titleVn || selectedMovie.title}
                    </h3>

                    {availableShowtimes.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                        Không có suất chiếu nào được lên lịch cho phim này trong ngày hôm nay.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableShowtimes.map(st => {
                          const isStSelected = selectedShowtime && selectedShowtime.id === st.id
                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                setSelectedShowtime(st)
                                setSelectedSeats([])
                                setCurrentStep(2)
                              }}
                              className={`p-4 rounded-2xl text-left border cursor-pointer transition-all flex flex-col justify-between gap-1.5 shadow-md ${isStSelected
                                ? 'bg-red-950/40 border-red-600 text-red-400 ring-2 ring-red-500 shadow-red-900/30'
                                : 'bg-[#121620] border-slate-800 hover:border-red-600/50 hover:bg-[#1a202c]'
                                }`}
                            >
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                {st.room} • {st.date === 'Hôm nay' ? 'Hôm nay' : st.date}
                              </span>

                              <span className={`text-2xl font-black font-mono leading-none tracking-tight ${isStSelected ? 'text-red-500' : 'text-white'
                                }`}>
                                {st.time}
                              </span>

                              <span className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                                {formatVND(st.price)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT SEAT LAYOUT */}
            {currentStep === 2 && (
              <div key="step2" className="bg-[#0a0b0e] border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between shadow-2xl min-h-[660px]">
                <div>
                  {/* TOP BANNER INFO */}
                  <div className="flex items-center justify-between bg-[#130b0e] border border-red-900/30 rounded-full px-5 py-2.5 mb-6">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-5 h-5 rounded-full border border-red-500/50 flex items-center justify-center text-red-500">
                        <Info size={12} />
                      </div>
                      <div className="flex items-center gap-2 font-bold tracking-wide">
                        <span className="text-slate-100 uppercase">{selectedMovie?.titleVn || selectedMovie?.title || 'ÁM ẢNH'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-100">{selectedShowtime?.time || '08:00'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300 font-normal">{selectedShowtime?.date || 'Thứ Hai, 27/07/2026'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300 font-normal">{selectedShowtime?.room || 'Phòng 3'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#1f0a0d] border border-red-600/40 text-red-500 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <Clock3 size={13} />
                      <span>{holdTimerLabel}</span>
                    </div>
                  </div>

                  {/* SEAT LEGEND */}
                  <div className="flex items-center justify-center gap-6 mb-10 text-[11px] font-semibold text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-slate-600 bg-transparent" />
                      <span>THƯỜNG</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-amber-500 text-amber-500 flex items-center justify-center text-[9px] font-bold">V</div>
                      <span>VIP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-4 rounded-full border border-red-600 bg-transparent" />
                      <span>ĐÔI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-600" />
                      <span>ĐANG CHỌN</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-red-800 text-red-800 flex items-center justify-center text-[10px]">X</div>
                      <span>ĐANG GIỮ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700" />
                      <span>ĐÃ BÁN</span>
                    </div>
                  </div>

                  {/* SCREEN ARCH GRAPHIC */}
                  <div className="relative flex flex-col items-center mb-12">
                    <div className="w-3/4 h-3 border-t-2 border-red-600/80 rounded-[100%] shadow-[0_-8px_20px_rgba(239,68,68,0.4)]" />
                    <span className="text-[10px] text-red-800 font-bold uppercase tracking-[0.3em] mt-3">MÀN HÌNH CHIẾU</span>
                  </div>

                  {/* SEAT GRID WITH RESPONSIVE SCALING & COLOR FIX */}
                  <div className="w-full overflow-x-auto py-2 custom-scrollbar">
                    <div className="space-y-2.5 min-w-max mx-auto px-4 flex flex-col items-center">
                      {activeSeatMatrix.map((row) => {
                        const renderedSeats = []
                        let skipNext = false

                        row.seats.forEach((seat, idx) => {
                          if (skipNext) {
                            skipNext = false
                            return
                          }

                          const seatType = String(seat.type || '').toUpperCase()

                          if (seatType === 'EMPTY' || seatType === 'WALKWAY') {
                            renderedSeats.push({
                              isWalkway: true,
                              seatId: `walkway-${row.rowLabel}-${idx}`
                            })
                            return
                          }

                          const isCouple = seatType === 'COUPLE' || ['J'].includes(row.rowLabel.toUpperCase())

                          if (isCouple) {
                            const nextSeat = row.seats[idx + 1]
                            const secondNum = nextSeat ? nextSeat.number : seat.number + 1
                            skipNext = true

                            renderedSeats.push({
                              ...seat,
                              isCouple: true,
                              seatId: `${row.rowLabel}${seat.number}`,
                              pairedSeatId: `${row.rowLabel}${secondNum}`,
                              coupleLabel: `${row.rowLabel}${seat.number} | ${row.rowLabel}${secondNum}`
                            })
                          } else {
                            renderedSeats.push({
                              ...seat,
                              isCouple: false,
                              seatId: `${row.rowLabel}${seat.number}`
                            })
                          }
                        })

                        const isLargeRow = row.seats.length > 12

                        return (
                          <div key={row.rowLabel} className="flex items-center justify-center gap-2">
                            <span className="w-6 text-xs font-bold text-slate-500 text-right shrink-0">{row.rowLabel}</span>

                            <div className={`flex items-center ${isLargeRow ? 'gap-1.5' : 'gap-2.5'}`}>
                              {renderedSeats.map((seat) => {
                                if (seat.isWalkway) {
                                  return <div key={seat.seatId} className="w-6 h-8 flex items-center justify-center text-[10px] text-slate-700 font-bold opacity-30 select-none">│</div>
                                }

                                const isOccupied = occupiedSeats.includes(seat.seatId) || (seat.pairedSeatId && occupiedSeats.includes(seat.pairedSeatId))
                                const isSelected = selectedSeats.includes(seat.seatId)

                                const seatType = String(seat.type || '').toUpperCase()
                                const isVip = seatType === 'VIP'
                                const isCouple = seat.isCouple || seatType === 'COUPLE'

                                if (isCouple) {
                                  return (
                                    <button
                                      key={seat.seatId}
                                      onClick={() => handleSeatClick(seat.seatId, seat.pairedSeatId)}
                                      disabled={isOccupied}
                                      className={`h-7 px-2.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${isSelected
                                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                                        : isOccupied
                                          ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                                          : 'border-red-600/80 text-red-500 hover:bg-red-950/30'
                                        }`}
                                    >
                                      {seat.coupleLabel}
                                    </button>
                                  )
                                }

                                return (
                                  <button
                                    key={seat.seatId}
                                    onClick={() => handleSeatClick(seat.seatId)}
                                    disabled={isOccupied}
                                    className={`rounded-full border font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${isLargeRow ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]'
                                      } ${isSelected
                                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                                        : isOccupied
                                          ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                                          : isVip
                                            ? 'border-amber-500/80 text-amber-500 hover:bg-amber-950/20'
                                            : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                                      }`}
                                  >
                                    {seat.seatId}
                                  </button>
                                )
                              })}
                            </div>

                            <span className="w-6 text-xs font-bold text-slate-500 text-left shrink-0">{row.rowLabel}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between max-w-xl mx-auto mt-10">
                    <div className="flex items-center gap-2 border border-emerald-500/40 bg-emerald-950/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold">
                      <LogIn size={14} />
                      <span>LỐI VÀO</span>
                    </div>
                    <div className="flex items-center gap-2 border border-red-500/40 bg-red-950/20 text-red-500 px-4 py-1.5 rounded-full text-xs font-bold">
                      <LogOut size={14} />
                      <span>LỐI RA</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 mt-8 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-bold block text-[10px] tracking-wider">GHẾ ĐÃ CHỌN</span>
                    <span className="text-slate-300 italic">
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế...'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 uppercase font-bold block text-[10px] tracking-wider">TỔNG TIỀN</span>
                    <span className="text-red-500 text-base font-extrabold font-mono">
                      {formatVND(ticketPriceTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CONCESSIONS & MEMBERS (DÙNG DỮ LIỆU THỰC TẾ TỪ API) */}
            {currentStep === 3 && (
              <div key="step3" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider border-b border-black/10 pb-3 flex items-center gap-2 font-mono">
                    <ShoppingBag size={16} className="text-red-500" />
                    Bắp nước &amp; đồ ăn
                  </h3>

                  {loadingCombos ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      <span className="material-symbols-outlined animate-spin text-2xl text-red-500 block mb-1">sync</span>
                      Đang tải danh sách bắp nước...
                    </div>
                  ) : combos.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-700 rounded-xl">
                      Không có sản phẩm bắp nước nào khả dụng.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                      {combos.map(combo => {
                        const comboId = combo.id || combo.uuid
                        const qty = selectedCombos[comboId] || 0
                        return (
                          <div key={comboId} className="flex justify-between items-center bg-black/20 border border-white/5 p-4 rounded-xl">
                            <div className="space-y-0.5 text-left pr-2 flex-1 min-w-0">
                              <span className="text-sm font-black text-black tracking-tight block truncate">{combo.name}</span>
                              <span className="text-[10px] text-slate-600 font-medium block leading-normal line-clamp-2">{combo.desc || combo.description}</span>
                              <span className="text-xs font-bold text-red-700 block mt-1">{formatVND(Number(combo.price))}</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                onClick={() => handleComboQty(comboId, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 flex items-center justify-center font-black text-white cursor-pointer active:scale-95 transition-all"
                              >
                                -
                              </button>

                              <span className="text-sm font-black w-6 text-center font-mono text-slate-900">
                                {qty}
                              </span>

                              <button
                                onClick={() => handleComboQty(comboId, 1)}
                                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 flex items-center justify-center font-black text-white cursor-pointer active:scale-95 transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Membership Integration */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-5 text-left">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider border-b border-black/10 pb-3 flex items-center gap-2 font-mono">
                    <User size={16} className="text-red-500" />
                    Tích hợp Hội viên
                  </h3>

                  <form onSubmit={handleCheckMember} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Số ĐT hoặc Member ID hội viên..."
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-red-500 transition-colors font-medium"
                    />
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border-none shadow-md shadow-red-600/30 active:scale-95"
                    >
                      <Search size={13} className="text-white" />
                      <span>Tra cứu</span>
                    </button>
                  </form>

                  {checkedMember && (
                    <div className="space-y-4">
                      {foundMember ? (
                        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-3 text-xs leading-normal">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Tên hội viên:</span>
                            <span className="text-white font-bold">{foundMember.fullName || 'Hội viên'}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Mã / SĐT hội viên:</span>
                            <span className="text-white font-bold font-mono">
                              {foundMember.customerId || foundMember.memberId || foundMember.phone || 'N/A'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-red-500/10 pt-2">
                            <span className="text-gray-400 font-bold">Điểm tích lũy:</span>
                            <span className="text-red-500 font-black text-sm">
                              {foundMember.loyaltyPoints ?? foundMember.score ?? 0} điểm
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5 border-t border-red-500/10 pt-3">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                              Đổi vé miễn phí (1000 điểm = 1 vé)
                            </label>
                            <select
                              value={convertCount}
                              onChange={(e) => setConvertCount(parseInt(e.target.value, 10))}
                              className="w-full bg-[#121620] border border-slate-700 rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
                            >
                              {Array.from({ length: selectedSeats.length + 1 }).map((_, i) => (
                                <option key={i} value={i} className="bg-[#121620] text-white">
                                  {i === 0 ? 'Không đổi vé' : `${i} vé (${i * 1000} điểm)`}
                                </option>
                              ))}
                            </select>

                            {scoreError && (
                              <span className="text-[10px] text-red-500 font-bold block mt-1 leading-normal">
                                ⚠️ {scoreError}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border bg-red-500/5 border-red-500/20 text-red-500 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                          <AlertCircle size={14} />
                          <span>Không tìm thấy thông tin hội viên!</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      disabled={!!scoreError}
                      onClick={() => setCurrentStep(4)}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase transition-all shadow-md cursor-pointer border-none active:scale-95"
                    >
                      <span>Tiến hành thanh toán</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CHECKOUT PAYMENT */}
            {currentStep === 4 && (
              <div key="step4" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-6 text-left">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2 font-mono">
                  <CreditCard size={16} className="text-red-500" />
                  Phương thức thanh toán &amp; Đơn hàng
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chọn hình thức thanh toán</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'cash', label: 'Tiền mặt', icon: Coins },
                        { id: 'card', label: 'Cà thẻ', icon: CreditCard },
                        { id: 'qr', label: 'Quét QR', icon: QrCode },
                      ].map(method => {
                        const Icon = method.icon
                        const isSelected = paymentMethod === method.id
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(method.id)
                              if (method.id !== 'cash') setCashReceived('')
                            }}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                              ${isSelected
                                ? 'bg-red-650/10 border-[var(--color-primary)] text-red-400'
                                : 'bg-black/20 border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                              }`}
                          >
                            <Icon size={20} />
                            <span className="text-[11px] font-bold">{method.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Số tiền khách đưa (VND) *</label>
                          <input
                            type="number"
                            placeholder="Nhập số tiền..."
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {[finalPriceTotal, 100000, 200000, 500000].map(val => {
                            if (val < finalPriceTotal) return null
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setCashReceived(val.toString())}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-white/5 cursor-pointer font-mono"
                              >
                                {formatVND(val)}
                              </button>
                            )
                          })}
                        </div>

                        <div className="flex justify-between border-t border-white/5 pt-2 text-xs font-semibold">
                          <span className="text-gray-400">Tiền thối lại:</span>
                          <span className="text-green-500 font-extrabold font-mono">{formatVND(changeReturn)}</span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'qr' && (
                      <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-2.5 text-center">
                        <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center shadow-lg">
                          <div className="w-full h-full border-4 border-slate-900 border-dashed flex items-center justify-center bg-slate-50 text-[10px] font-black text-slate-800 leading-none">
                            [ SCAN QR ]
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">Bấm "Xác nhận &amp; In hóa đơn" để chuyển sang cổng thanh toán MoMo</p>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                        <CreditCard size={24} className="text-slate-400" />
                        <div className="text-left">
                          <span className="text-[11px] font-bold text-white block">Quẹt thẻ ngân hàng tại POS</span>
                          <span className="text-[10px] text-gray-500 block leading-normal">Mời cắm hoặc chạm thẻ ATM/Visa/MasterCard trên thiết bị POS quầy.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 bg-black/10 border border-white/5 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Xác nhận chi tiết hóa đơn</label>

                    <div className="space-y-2 border-b border-white/5 pb-3 text-[var(--color-text-muted)]">
                      <div className="flex justify-between">
                        <span>Số lượng vé:</span>
                        <span className="text-white">{selectedSeats.length} vé ({selectedSeats.join(', ')})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiền vé gốc:</span>
                        <span className="text-white font-mono">{formatVND(ticketPriceTotal)}</span>
                      </div>
                      {convertCount > 0 && (
                        <div className="flex justify-between text-green-500">
                          <span>Giảm giá điểm ({convertCount} vé):</span>
                          <span className="font-mono">-{formatVND(discountTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tiền bắp nước:</span>
                        <span className="text-white font-mono">{formatVND(comboPriceTotal)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-bold">TỔNG THANH TOÁN:</span>
                      <span className="text-red-500 font-black text-xl font-mono">{formatVND(finalPriceTotal)}</span>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-bold rounded-lg leading-normal">
                        ⚠️ {error}
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={isSubmitting || !!scoreError}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer border-none"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          Đang thanh toán...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={15} />
                          Xác nhận &amp; In hóa đơn
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT ORDER SUMMARY PANEL */}
        <div className="lg:col-span-4 bg-[#0a0b0e] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl flex flex-col justify-between min-h-[660px] text-left">

          <div className="space-y-5">
            <h3 className="text-red-500 font-extrabold text-sm uppercase tracking-wider border-b border-white/5 pb-3">
              VÉ CỦA BẠN
            </h3>

            {selectedMovie ? (
              <div className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <img
                  src={selectedMovie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=150'}
                  alt={selectedMovie.titleVn || selectedMovie.title}
                  className="w-16 h-24 object-cover rounded-lg border border-white/10 shrink-0 shadow-md"
                />
                <div className="space-y-1.5 flex-1 min-w-0 flex flex-col justify-center">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-red-600 inline-block uppercase leading-none w-fit">
                    {selectedMovie.rating || 'P'}
                  </span>
                  <h4 className="text-xs font-black text-white leading-snug line-clamp-2 uppercase" title={selectedMovie.titleVn || selectedMovie.title}>
                    {selectedMovie.titleVn || selectedMovie.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {selectedMovie.durationMinutes || 120} phút • {selectedMovie.version || '2D'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl italic">
                Chưa chọn phim
              </div>
            )}

            <div className="space-y-1 border-t border-white/5 pt-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">SUẤT CHIẾU</span>
              <h4 className="text-sm font-extrabold text-slate-100 uppercase">
                {selectedShowtime?.date || 'THỨ HAI, 27/07'}
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                Giờ chiếu: {selectedShowtime?.time || '08:10'} tại {selectedShowtime?.room || 'Phòng 2'}
              </p>
            </div>

            <div className="space-y-1 border-t border-white/5 pt-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">GHẾ NGỒI</span>
              <p className="text-xs text-slate-400 italic">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}
              </p>
            </div>

            {/* HIỂN THỊ BẮP NƯỚC TẠI SIDEBAR VÉ CỦA BẠN */}
            <div className="space-y-1 border-t border-white/5 pt-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                BẮP NƯỚC (COMBO)
              </span>

              {Object.entries(selectedCombos).some(([_, qty]) => qty > 0) ? (
                <div className="space-y-1 mt-1">
                  {Object.entries(selectedCombos)
                    .filter(([_, qty]) => qty > 0)
                    .map(([id, qty]) => {
                      const combo = combos.find(c => String(c.id || c.uuid) === String(id))
                      return combo ? (
                        <div key={id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-200 font-medium truncate max-w-[180px]">
                            {combo.name} <span className="text-red-400 font-bold">(x{qty})</span>
                          </span>
                          <span className="text-slate-400 font-mono text-[11px] shrink-0">
                            {formatVND((Number(combo.price) || 0) * qty)}
                          </span>
                        </div>
                      ) : null
                    })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Chưa chọn bắp nước</p>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">TỔNG CỘNG</span>
              <span className="text-red-500 text-xl font-black font-mono">
                {formatVND(finalPriceTotal)}
              </span>
            </div>

            {currentStep === 1 && (
              <button
                disabled={!selectedMovie || !selectedShowtime}
                onClick={() => setCurrentStep(2)}
                className="w-full bg-red-700 hover:bg-red-600 disabled:bg-red-950/40 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all border-none cursor-pointer"
              >
                TIẾP TỤC CHỌN GHẾ
              </button>
            )}

            {currentStep === 2 && (
              <button
                disabled={selectedSeats.length === 0}
                onClick={() => setCurrentStep(3)}
                className="w-full bg-red-700 hover:bg-red-600 disabled:bg-red-950/40 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all border-none cursor-pointer"
              >
                TIẾP TỤC CHỌN COMBO
              </button>
            )}

            {currentStep === 3 && (
              <button
                disabled={!!scoreError}
                onClick={() => setCurrentStep(4)}
                className="w-full bg-red-700 hover:bg-red-600 disabled:bg-red-950/40 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all border-none cursor-pointer"
              >
                TIẾP TỤC THANH TOÁN
              </button>
            )}
          </div>

        </div>

      </div>

      {/* TICKET PRINT PREVIEW MODAL */}
      {printedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl max-w-md w-full text-slate-800 text-left relative overflow-hidden">
            <div className="flex flex-col items-center border-b-2 border-dashed border-slate-200 pb-6 text-center space-y-2.5">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                XUẤT VÉ THÀNH CÔNG
              </span>

              <h4 className="text-2xl font-black tracking-widest text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                CINE<span className="text-red-650">MATE</span>
              </h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                HÓA ĐƠN VÉ &amp; DỊCH VỤ TẠI QUẦY<br />
                Mã giao dịch: <span className="font-mono text-slate-700 font-bold">{printedTicket.id}</span>
              </p>
            </div>

            <div className="py-6 space-y-4 text-xs font-semibold text-slate-600">

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tên Phim</span>
                <span className="text-sm font-black text-slate-900 leading-snug block">{printedTicket.movie}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Phòng chiếu</span>
                  <span className="text-sm font-bold text-slate-900 block">{printedTicket.screen}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Suất chiếu</span>
                  <span className="text-sm font-black text-red-650 block font-mono">{printedTicket.time}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Ngày chiếu</span>
                  <span className="text-sm font-bold text-slate-900 block">{printedTicket.date}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Số Ghế</span>
                  <span className="text-sm font-black text-slate-900 block font-mono">{printedTicket.seats}</span>
                </div>
              </div>

              {printedTicket.combosSummary && (
                <div className="border-t border-slate-100 pt-3.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bắp nước kèm theo</span>
                  <span className="text-xs text-slate-800 block mt-1 leading-relaxed font-semibold">{printedTicket.combosSummary}</span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Hình thức thanh toán:</span>
                  <span className="font-bold text-slate-800">{printedTicket.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tài khoản hội viên:</span>
                  <span className="font-bold text-slate-800">{printedTicket.memberId} ({printedTicket.customerName})</span>
                </div>
                {printedTicket.convertTickets > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Đổi điểm tích lũy:</span>
                    <span>-{formatVND(printedTicket.convertTickets * printedTicket.price)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-900 pt-3 border-t border-slate-100">
                  <span className="font-bold text-xs uppercase tracking-wider">TỔNG TIỀN THANH TOÁN:</span>
                  <span className="font-black text-red-650 text-base font-mono">{formatVND(printedTicket.total)}</span>
                </div>
              </div>

            </div>

            <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <div className="w-full h-11 border-2 border-slate-900 border-dashed flex items-center justify-center text-xs font-black tracking-[0.3em] text-slate-800 select-none bg-white rounded-lg">
                * {printedTicket.id} *
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Quét mã vạch này tại cửa soát vé</p>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Printer size={16} />
                <span>In vé quầy</span>
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <RotateCcw size={16} />
                <span>Giao dịch tiếp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}