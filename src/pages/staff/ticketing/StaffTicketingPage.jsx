import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutGrid, Ticket, ShoppingBag, CheckCircle,
  AlertCircle, X, Search, CreditCard, QrCode,
  Coins, User, Printer, RotateCcw, ChevronRight,
  ChevronLeft, Armchair, Square, Sofa, Wrench, ShieldAlert, Clock3,
  Info, LogIn, LogOut, Tag, Gift, Star, Landmark
} from 'lucide-react'
import { movieService } from '../../../services/movieService'
import { showtimeService } from '../../../services/showtimeService'
import { concessionService, groupConcessionsByBaseName, FALLBACK_COMBOS } from '../../../services/concessionService'
import { bookingService } from '../../../services/bookingService'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { promotionService } from '../../../services/promotionService'
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
  const [rawConcessions, setRawConcessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCombos, setLoadingCombos] = useState(false)
  const [error, setError] = useState('')

  // Selected values
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedShowtime, setSelectedShowtime] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedCombos, setSelectedCombos] = useState({})
  const [selectedSizes, setSelectedSizes] = useState({})

  // Member states
  const [memberQuery, setMemberQuery] = useState('')
  const [checkedMember, setCheckedMember] = useState(false)
  const [foundMember, setFoundMember] = useState(null)
  const [convertCount, setConvertCount] = useState(0)
  const [scoreError, setScoreError] = useState('')

  // Coupon / Promotion / Points Tab State
  const [promoTab, setPromoTab] = useState('coupon')
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')

  // Checkout states (Thêm vnpay)
  const [paymentMethod, setPaymentMethod] = useState('cash') // 'cash' | 'card' | 'momo' | 'vnpay'
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
        const rawList = Array.isArray(list) && list.length > 0 ? list : FALLBACK_COMBOS
        setRawConcessions(rawList)
        
        const grouped = groupConcessionsByBaseName(rawList)
        setCombos(grouped)

        const initQty = {}
        const initSizes = {}
        grouped.forEach(item => {
          const key = item.id || item.uuid
          initQty[key] = 0
          if (item.sizes && item.sizes.length > 0) {
            initSizes[key] = item.sizes[0].key
          }
        })
        setSelectedCombos(initQty)
        setSelectedSizes(initSizes)
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

  // TÍNH GIÁ TIỀN GHẾ DỰA TRÊN THÔNG TIN TỪ BACK-END
  const getSeatPrice = (seatId) => {
    const rowChar = seatId.charAt(0).toUpperCase()
    let seatType = 'STANDARD'
    if (checkIsVipCenterSeat(seatId)) {
      seatType = 'VIP'
    } else if (rowChar === 'J') {
      seatType = 'COUPLE'
    }

    if (selectedShowtime?.prices && Array.isArray(selectedShowtime.prices) && selectedShowtime.prices.length > 0) {
      const matchedPriceObj = selectedShowtime.prices.find(
        p => String(p.seatType || '').toUpperCase() === seatType
      )
      if (matchedPriceObj && matchedPriceObj.price != null) {
        return Number(matchedPriceObj.price)
      }
    }

    const basePrice = Number(selectedShowtime?.price) || 90000
    if (seatType === 'VIP') return basePrice + 20000
    if (seatType === 'COUPLE') return basePrice * 2 + 10000

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

  const handleComboQty = (comboKey, delta) => {
    setSelectedCombos(prev => ({
      ...prev,
      [comboKey]: Math.max(0, (prev[comboKey] || 0) + delta)
    }))
  }

  const handleSelectSize = (comboKey, sizeKey) => {
    setSelectedSizes(prev => ({
      ...prev,
      [comboKey]: sizeKey
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

  const comboPriceTotal = useMemo(() => {
    return Object.entries(selectedCombos).reduce((sum, [key, qty]) => {
      if (qty <= 0) return sum
      const item = combos.find(c => String(c.id || c.uuid) === String(key))
      if (!item) return sum

      let unitPrice = Number(item.price) || 0
      if (item.sizes && item.sizes.length > 0) {
        const currentSize = selectedSizes[key] || item.sizes[0].key
        const sizeObj = item.sizes.find(s => s.key === currentSize)
        if (sizeObj) unitPrice = Number(sizeObj.price) || unitPrice
      }

      return sum + unitPrice * qty
    }, 0)
  }, [selectedCombos, combos, selectedSizes])

  const singleTicketPrice = selectedSeats.length > 0 ? (ticketPriceTotal / selectedSeats.length) : 0
  const pointsDiscountTotal = convertCount * singleTicketPrice
  const grossOrderTotal = ticketPriceTotal + comboPriceTotal

  const handleApplyPromoCode = async (e) => {
    if (e) e.preventDefault()
    if (!promoCodeInput.trim()) return

    const trimmedCode = promoCodeInput.trim().toUpperCase()
    setPromoLoading(true)
    setPromoError('')

    try {
      const result = await promotionService.validateForUi(trimmedCode, grossOrderTotal)
      if (result.success) {
        setAppliedPromoCode(result.promotionCode || trimmedCode)
        setCouponDiscount(result.discountAmount || 0)
      } else {
        setPromoError(result.message || 'Mã ưu đãi không hợp lệ.')
        setAppliedPromoCode('')
        setCouponDiscount(0)
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra mã khuyến mãi:', err)
      setPromoError('Không thể kiểm tra mã ưu đãi lúc này.')
      setAppliedPromoCode('')
      setCouponDiscount(0)
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromoCode = () => {
    setPromoCodeInput('')
    setAppliedPromoCode('')
    setCouponDiscount(0)
    setPromoError('')
  }

  const finalPriceTotal = Math.max(0, grossOrderTotal - pointsDiscountTotal - couponDiscount)

  const changeReturn = useMemo(() => {
    if (!cashReceived || isNaN(cashReceived)) return 0
    return Math.max(0, parseInt(cashReceived, 10) - finalPriceTotal)
  }, [cashReceived, finalPriceTotal])

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' đ'

  // 🟢 XỬ LÝ THANH TOÁN (HỖ TRỢ THÊM TỰ ĐỘNG VNPAY)
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

      const validConcessions = Object.entries(selectedCombos)
        .filter(([_, qty]) => qty > 0)
        .map(([key, qty]) => {
          const item = combos.find(c => String(c.id || c.uuid) === String(key))
          let actualVariantId = key

          if (item && item.sizes && item.sizes.length > 0) {
            const currentSize = selectedSizes[key] || item.sizes[0].key
            const sizeObj = item.sizes.find(s => s.key === currentSize)
            if (sizeObj && sizeObj.variantId) {
              actualVariantId = sizeObj.variantId
            }
          }

          return {
            concessionId: actualVariantId,
            quantity: qty
          }
        })

      const holdPayload = {
        showtimeId: showtimeUuid,
        seatIds: backendSeatIds,
        customerId: foundMember ? (foundMember.customerId || foundMember.userId) : null,
        concessions: validConcessions,
        promotionCode: appliedPromoCode || undefined
      }

      const holdRes = await bookingService.holdSeats(holdPayload)
      const bookingData = holdRes?.data?.result || holdRes?.data
      const backendBookingId = bookingData?.bookingId || bookingData?.id

      if (!backendBookingId) {
        throw new Error('Máy chủ không tạo được mã booking.')
      }

      // 🟡 XỬ LÝ THANH TOÁN ONLINE MOMO HOẶC VNPAY
      if (paymentMethod === 'momo') {
        const momoRes = await paymentService.createMomoPayment(backendBookingId)
        const payUrl = momoRes?.data?.result?.payUrl || momoRes?.data?.payUrl

        if (payUrl) {
          window.location.href = payUrl
          return
        } else {
          throw new Error(momoRes?.data?.message || 'Không nhận được đường dẫn thanh toán từ MoMo.')
        }
      } else if (paymentMethod === 'vnpay') {
        const vnpayRes = await paymentService.createVnPayPayment(backendBookingId)
        const payUrl = vnpayRes?.data?.result?.payUrl || vnpayRes?.data?.payUrl || vnpayRes?.data

        if (payUrl) {
          window.location.href = payUrl
          return
        } else {
          throw new Error(vnpayRes?.data?.message || 'Không nhận được đường dẫn thanh toán từ VNPay.')
        }
      }

      // TIỀN MẶT / CÀ THẺ -> CONFIRM VÉ NGAY
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
        promotionCode: appliedPromoCode || 'N/A',
        memberId: foundMember ? (foundMember.customerId || foundMember.memberId) : 'GUEST',
        customerName: foundMember ? foundMember.fullName : 'Khách vãng lai',
        phone: foundMember ? foundMember.phone : 'N/A',
        email: foundMember ? `${foundMember.memberId.toLowerCase()}@cinemate.vn` : 'counter@cinemate.vn',
        idCard: foundMember ? foundMember.idCard : 'N/A',
        status: 'Đã thanh toán',
        checkedIn: false,
        checkInTime: null,
        paymentMethod: paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ ngân hàng' : paymentMethod === 'momo' ? 'Ví MoMo' : 'VNPay',
        combosSummary: Object.entries(selectedCombos)
          .filter(([_, qty]) => qty > 0)
          .map(([key, qty]) => {
            const c = combos.find(combo => String(combo.id || combo.uuid) === String(key))
            return c ? `${c.name} (x${qty})` : `(x${qty})`
          }).join(', ')
      }

      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      localStorage.setItem('staff_bookings_db', JSON.stringify([payload, ...localBookings]))

      setSeatMapRefreshKey(prev => prev + 1)
      setPrintedTicket(payload)
    } catch (err) {
      console.error('Lỗi khi thanh toán:', err)
      if (err.response?.status === 409) {
        setError('Ghế này đã có người giữ hoặc đặt trước đó! Vui lòng bấm "Tạo giao dịch mới" hoặc chọn ghế khác.')
        setSeatMapRefreshKey(prev => prev + 1)
      } else {
        const serverMessage = err.response?.data?.message || err.response?.data?.result?.message || err.message
        setError(serverMessage || 'Có lỗi xảy ra trong quá trình xuất vé.')
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
    setPromoCodeInput('')
    setAppliedPromoCode('')
    setCouponDiscount(0)
    setPromoError('')
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

            {/* STEP 3: CONCESSIONS, MEMBER & PROMOTION IN ONE UNIFIED CARD */}
            {currentStep === 3 && (
              <div key="step3" className="bg-[#0a0b0e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 text-left">
                
                {/* 1. CHỌN BẮP & NƯỚC */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <ShoppingBag size={20} className="text-red-500" />
                    CHỌN BẮP &amp; NƯỚC
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
                    <div className="space-y-4">
                      {combos.map(item => {
                        const key = item.id || item.uuid
                        const qty = selectedCombos[key] || 0
                        const currentSizeKey = selectedSizes[key] || (item.sizes && item.sizes[0]?.key)

                        let displayPrice = Number(item.price) || 0
                        if (item.sizes && item.sizes.length > 0) {
                          const sizeObj = item.sizes.find(s => s.key === currentSizeKey)
                          if (sizeObj) displayPrice = Number(sizeObj.price) || displayPrice
                        }

                        return (
                          <div key={key} className="bg-[#121620] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-2xl">
                                {item.img && item.img.startsWith('http') ? (
                                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  item.img || '🍿'
                                )}
                              </div>
                              <div className="space-y-1 text-left flex-1 min-w-0">
                                <h4 className="text-base font-bold text-white tracking-wide truncate">{item.name}</h4>
                                <p className="text-xs text-slate-400 line-clamp-1">{item.desc || item.description}</p>
                                
                                {item.sizes && item.sizes.length > 0 && (
                                  <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SIZE:</span>
                                    {item.sizes.map(sz => {
                                      const isSelectedSize = sz.key === currentSizeKey
                                      return (
                                        <button
                                          key={sz.key}
                                          type="button"
                                          onClick={() => handleSelectSize(key, sz.key)}
                                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${isSelectedSize
                                            ? 'bg-red-600 border-red-500 text-white shadow-md'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                          }`}
                                        >
                                          {sz.label} ({formatVND(sz.price)})
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}

                                <span className="text-sm font-black text-red-500 block pt-1">{formatVND(displayPrice)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-full px-3 py-1.5 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleComboQty(key, -1)}
                                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer border-none active:scale-95"
                              >
                                -
                              </button>
                              <span className="text-sm font-black w-6 text-center font-mono text-white">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleComboQty(key, 1)}
                                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer border-none active:scale-95"
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

                {/* 2. MÃ ƯU ĐÃI / KHUYẾN MÃI & ĐỔI ĐIỂM HỘI VIÊN */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Tag size={20} className="text-red-500" />
                    MÃ ƯU ĐÃI / KHUYẾN MÃI
                  </h3>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPromoTab('coupon')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${promoTab === 'coupon'
                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Tag size={14} />
                      MÃ COUPON
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoTab('points')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${promoTab === 'points'
                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Star size={14} />
                      ĐỔI ĐIỂM HỘI VIÊN
                    </button>
                  </div>

                  {/* FORM TAB 1: MÃ COUPON (FIXED CONTRAST INPUT) */}
                  {promoTab === 'coupon' && (
                    <div className="bg-[#121620] border border-white/5 rounded-2xl p-5 space-y-3">
                      <p className="text-xs text-slate-400">
                        Nhập mã ưu đãi hoặc thử mã mẫu bên dưới để nhận chiết khấu trực tiếp.
                      </p>

                      {!appliedPromoCode ? (
                        <form onSubmit={handleApplyPromoCode} className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="VÍ DỤ: CINEMATE10, BAPNUOC20"
                              value={promoCodeInput}
                              onChange={(e) => setPromoCodeInput(e.target.value)}
                              className="flex-1 bg-[#181c28] border-2 border-slate-600 focus:border-red-500 rounded-xl px-4 py-3 text-sm uppercase font-mono font-black tracking-wider outline-none transition-colors"
                              style={{
                                color: '#ffffff',
                                WebkitTextFillColor: '#ffffff',
                                opacity: 1,
                                caretColor: '#e50914'
                              }}
                            />
                            <button
                              type="submit"
                              disabled={promoLoading || !promoCodeInput.trim()}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-none shadow-md shrink-0"
                            >
                              {promoLoading ? 'Đang lọc...' : 'ÁP DỤNG'}
                            </button>
                          </div>

                          {promoError && (
                            <p className="text-xs text-red-500 font-bold flex items-center gap-1.5">
                              <AlertCircle size={14} />
                              <span>{promoError}</span>
                            </p>
                          )}
                        </form>
                      ) : (
                        <div className="flex items-center justify-between bg-black/40 border border-emerald-500/30 p-4 rounded-xl">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle size={14} /> Coupon validated
                            </span>
                            <span className="text-sm font-black font-mono text-white block">{appliedPromoCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePromoCode}
                            className="px-4 py-2 border border-red-600/60 text-red-500 hover:bg-red-950/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            HỦY MÃ
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FORM TAB 2: ĐỔI ĐIỂM / TRA CỨU HỘI VIÊN */}
                  {promoTab === 'points' && (
                    <div className="bg-[#121620] border border-white/5 rounded-2xl p-5 space-y-4">
                      <p className="text-xs text-slate-400">
                        Tra cứu SĐT hoặc Member ID để đổi điểm lấy vé xem phim miễn phí.
                      </p>

                      <form onSubmit={handleCheckMember} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Số ĐT hoặc Member ID hội viên..."
                          value={memberQuery}
                          onChange={(e) => setMemberQuery(e.target.value)}
                          className="flex-1 bg-[#181c28] border-2 border-slate-600 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 outline-none font-medium"
                          style={{
                            color: '#ffffff',
                            WebkitTextFillColor: '#ffffff',
                            opacity: 1
                          }}
                        />
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-none shadow-md shrink-0 flex items-center gap-1.5"
                        >
                          <Search size={14} />
                          <span>TRA CỨU</span>
                        </button>
                      </form>

                      {checkedMember && (
                        <div>
                          {foundMember ? (
                            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-3 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Tên hội viên:</span>
                                <span className="text-white font-bold">{foundMember.fullName || 'Hội viên'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Điểm tích lũy:</span>
                                <span className="text-red-500 font-black text-sm">{foundMember.score} điểm</span>
                              </div>

                              <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
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
                                  <span className="text-[10px] text-red-500 font-bold block mt-1">
                                    ⚠️ {scoreError}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-xl border bg-red-500/5 border-red-500/20 text-red-500 text-center text-xs font-bold">
                              ⚠️ Không tìm thấy thông tin hội viên!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* KHUNG HIỂN THỊ GIẢM GIÁ ĐÃ ÁP DỤNG */}
                  {(couponDiscount > 0 || pointsDiscountTotal > 0) && (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between text-xs font-bold text-emerald-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} />
                        <span>Giảm giá đã áp dụng:</span>
                      </div>
                      <span className="font-mono text-sm text-emerald-400">-{formatVND(couponDiscount + pointsDiscountTotal)}</span>
                    </div>
                  )}
                </div>

                {/* NÚT TIẾN HÀNH THANH TOÁN */}
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    disabled={!!scoreError}
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer border-none active:scale-95"
                  >
                    <span>TIẾN HÀNH THANH TOÁN</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 4: CHECKOUT PAYMENT WITH VNPAY SUPPORT */}
            {currentStep === 4 && (
              <div key="step4" className="bg-[#0a0b0e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 text-left">
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/10 pb-4">
                  <CreditCard size={20} className="text-red-500" />
                  PHƯƠNG THỨC THANH TOÁN &amp; ĐƠN HÀNG
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                  {/* CỘT TRÁI: CHỌN PHƯƠNG THỨC THANH TOÁN */}
                  <div className="space-y-5">
                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block font-mono">
                      1. CHỌN HÌNH THỨC THANH TOÁN
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'cash', label: 'TIỀN MẶT', icon: Coins },
                        { id: 'card', label: 'CÀ THẺ', icon: CreditCard },
                        { id: 'momo', label: 'VÍ MOMO', icon: QrCode },
                        { id: 'vnpay', label: 'VNPAY', icon: Landmark },
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
                            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-red-600/20 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                                : 'bg-[#121620] border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Icon size={20} className={isSelected ? 'text-red-500' : 'text-slate-400'} />
                            <span className="text-[11px] font-black font-mono tracking-wider">{method.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* KHUNG TIỀN MẶT */}
                    {paymentMethod === 'cash' && (
                      <div className="bg-[#121620] border border-white/5 p-5 rounded-2xl space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                            SỐ TIỀN KHÁCH ĐƯA (VND) *
                          </label>
                          <input
                            type="number"
                            placeholder="Nhập số tiền..."
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="bg-[#181c28] border-2 border-slate-600 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold outline-none"
                            style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', opacity: 1 }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {[finalPriceTotal, 100000, 200000, 500000].map(val => {
                            if (val < finalPriceTotal) return null
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setCashReceived(val.toString())}
                                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-600/20 hover:border-red-500/50 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer font-mono"
                              >
                                {formatVND(val)}
                              </button>
                            )
                          })}
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-3 text-xs font-bold">
                          <span className="text-slate-400">TIỀN THỐI LẠI:</span>
                          <span className="text-emerald-400 text-base font-extrabold font-mono">{formatVND(changeReturn)}</span>
                        </div>
                      </div>
                    )}

                    {/* KHUNG VÍ MOMO */}
                    {paymentMethod === 'momo' && (
                      <div className="bg-[#121620] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
                        <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                          <QrCode size={100} className="text-red-600" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium max-w-xs mt-1">
                          Bấm <strong className="text-white">"Xác Nhận &amp; In Hóa Đơn"</strong> để chuyển sang cổng thanh toán Ví MoMo.
                        </p>
                      </div>
                    )}

                    {/* KHUNG CỔNG VNPAY */}
                    {paymentMethod === 'vnpay' && (
                      <div className="bg-[#121620] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                          <Landmark size={24} />
                        </div>
                        <p className="text-xs text-slate-400 font-medium max-w-xs">
                          Bấm <strong className="text-white">"Xác Nhận &amp; In Hóa Đơn"</strong> để chuyển tới cổng thanh toán VNPay (ATM / QR Ngân Hàng).
                        </p>
                      </div>
                    )}

                    {/* KHUNG CÀ THẺ POS */}
                    {paymentMethod === 'card' && (
                      <div className="bg-[#121620] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500">
                          <CreditCard size={24} />
                        </div>
                        <div className="text-left space-y-0.5">
                          <span className="text-xs font-bold text-white block uppercase tracking-wider">QUẸT THẺ TẠI MÁY POS QUẦY</span>
                          <span className="text-xs text-slate-400 block leading-relaxed">Chạm hoặc cắm thẻ ATM/Visa/MasterCard trên thiết bị quẹt thẻ tại quầy.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CỘT PHẢI: XÁC NHẬN CHI TIẾT HÓA ĐƠN */}
                  <div className="bg-[#121620] border border-white/5 p-6 rounded-2xl space-y-5">
                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block font-mono">
                      2. XÁC NHẬN CHI TIẾT HÓA ĐƠN
                    </label>

                    <div className="space-y-3 border-b border-white/10 pb-4 text-xs font-medium">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Số lượng vé:</span>
                        <span className="text-white font-bold">{selectedSeats.length} vé ({selectedSeats.join(', ')})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Tiền vé gốc:</span>
                        <span className="text-white font-mono font-bold">{formatVND(ticketPriceTotal)}</span>
                      </div>

                      {convertCount > 0 && (
                        <div className="flex justify-between items-center text-emerald-400 font-bold">
                          <span>Giảm giá điểm ({convertCount} vé):</span>
                          <span className="font-mono">-{formatVND(pointsDiscountTotal)}</span>
                        </div>
                      )}

                      {couponDiscount > 0 && (
                        <div className="flex justify-between items-center text-emerald-400 font-bold">
                          <span>Giảm giá Voucher ({appliedPromoCode}):</span>
                          <span className="font-mono">-{formatVND(couponDiscount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Tiền bắp nước:</span>
                        <span className="text-white font-mono font-bold">{formatVND(comboPriceTotal)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-white font-bold uppercase tracking-wider">TỔNG THANH TOÁN:</span>
                      <span className="text-red-500 font-black text-2xl font-mono">{formatVND(finalPriceTotal)}</span>
                    </div>

                    {error && (
                      <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl leading-relaxed flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={isSubmitting || !!scoreError}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold text-xs py-4 rounded-xl shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer border-none mt-4"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          ĐANG XỬ LÝ THANH TOÁN...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          XÁC NHẬN &amp; IN HÓA ĐƠN
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

            <div className="space-y-1 border-t border-white/5 pt-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                BẮP NƯỚC (COMBO)
              </span>

              {Object.entries(selectedCombos).some(([_, qty]) => qty > 0) ? (
                <div className="space-y-1 mt-1">
                  {Object.entries(selectedCombos)
                    .filter(([_, qty]) => qty > 0)
                    .map(([key, qty]) => {
                      const combo = combos.find(c => String(c.id || c.uuid) === String(key))
                      let unitPrice = Number(combo?.price) || 0
                      const currentSizeKey = selectedSizes[key]
                      if (combo?.sizes && combo.sizes.length > 0) {
                        const sizeObj = combo.sizes.find(s => s.key === currentSizeKey)
                        if (sizeObj) unitPrice = Number(sizeObj.price) || unitPrice
                      }

                      return combo ? (
                        <div key={key} className="flex justify-between items-center text-xs">
                          <span className="text-slate-200 font-medium truncate max-w-[180px]">
                            {combo.name} <span className="text-red-400 font-bold">(x{qty})</span>
                          </span>
                          <span className="text-slate-400 font-mono text-[11px] shrink-0">
                            {formatVND(unitPrice * qty)}
                          </span>
                        </div>
                      ) : null
                    })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Chưa chọn bắp nước</p>
              )}
            </div>

            {couponDiscount > 0 && (
              <div className="space-y-1 border-t border-white/5 pt-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">MÃ GIẢM GIÁ</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">{appliedPromoCode}</span>
                  <span className="text-emerald-400 font-mono font-bold">-{formatVND(couponDiscount)}</span>
                </div>
              </div>
            )}
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
                {printedTicket.promotionCode && printedTicket.promotionCode !== 'N/A' && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Mã khuyến mãi:</span>
                    <span>{printedTicket.promotionCode}</span>
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