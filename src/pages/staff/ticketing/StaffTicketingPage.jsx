import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutGrid, Ticket, ShoppingBag, CheckCircle,
  AlertCircle, X, Search, CreditCard, QrCode,
  Coins, User, Printer, RotateCcw, ChevronRight,
  ChevronLeft, Armchair, Square, Sofa, Wrench, ShieldAlert
} from 'lucide-react'
import { movieService } from '../../../services/movieService'
import { showtimeService } from '../../../services/showtimeService'
import { concessionService, FALLBACK_COMBOS } from '../../../services/concessionService'

// Mock Members Database for checking (consistent with CounterCheckoutPage.jsx)
const MOCK_MEMBERS = [
  { memberId: 'MEM-889922', idCard: '012345678901', fullName: 'Nguyễn Văn Anh', phone: '0912345678', score: 1500 },
  { memberId: 'MEM-445511', idCard: '023456789012', fullName: 'Trần Thị Bình', phone: '0987654321', score: 3500 },
  { memberId: 'MEM-332211', idCard: '034567890123', fullName: 'Lê Văn Cường', phone: '0933445566', score: 500 }
]

export default function StaffTicketingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [combos, setCombos] = useState(FALLBACK_COMBOS)
  const [loading, setLoading] = useState(true)
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

  // Fetch movies and showtimes on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [moviesRes, showtimesRes] = await Promise.all([
          movieService.getAll({ status: 'now-showing', page: 0, size: 50 }),
          showtimeService.getAll()
        ])

        const rawMovies = moviesRes.data?.result?.content || moviesRes.data?.result || moviesRes.data || []
        const moviesList = Array.isArray(rawMovies) ? rawMovies : (Array.isArray(rawMovies?.content) ? rawMovies.content : [])
        setMovies(moviesList)

        let showtimesList = showtimesRes
        if (!Array.isArray(showtimesList)) {
          showtimesList = showtimesRes?.result || showtimesRes?.data || []
        }
        if (!Array.isArray(showtimesList)) {
          showtimesList = []
        }
        setShowtimes(showtimesList)
      } catch (err) {
        console.error('API offline, loading mock data', err)
        // Mock fallback movies matching scraped_movies.json seed
        setMovies([
          { id: '1', titleVn: 'COLONY: BẦY XÁC SỐNG', titleEn: 'Colony', rating: 'K', durationMinutes: 122, posterUrl: 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-colony.jpg' },
          { id: '2', titleVn: 'LẬT MẶT 7: MỘT ĐIỀU ƯỚC', titleEn: 'Face Off 7', rating: 'K', durationMinutes: 138, posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500' },
          { id: '3', titleVn: 'Doraemon: Nobita và Lâu Đài Dưới Đáy Biển', titleEn: 'Doraemon', rating: 'P', durationMinutes: 101, posterUrl: 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_doraemon_movie_2026_g_c.jpg' },
          { id: '4', titleVn: 'TÊN CẬU LÀ GÌ.', titleEn: 'Your Name', rating: 'T13', durationMinutes: 107, posterUrl: 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/y/o/your_name_localized_adaptation_social_470_x_700.jpg' }
        ])
        setShowtimes([
          { id: 101, movie: 'COLONY: BẦY XÁC SỐNG', room: 'Phòng chiếu 3 (IMAX)', date: 'Hôm nay', time: '18:30', price: 120000 },
          { id: 102, movie: 'COLONY: BẦY XÁC SỐNG', room: 'Phòng chiếu 1 (Standard)', date: 'Hôm nay', time: '20:15', price: 90000 },
          { id: 103, movie: 'LẬT MẶT 7: MỘT ĐIỀU ƯỚC', room: 'Phòng chiếu 1 (Standard)', date: 'Hôm nay', time: '17:00', price: 110000 },
          { id: 104, movie: 'TÊN CẬU LÀ GÌ.', room: 'Phòng chiếu 3 (IMAX)', date: 'Hôm nay', time: '19:30', price: 120000 }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Tải combo từ backend, fallback về FALLBACK_COMBOS nếu API lỗi/rỗng
  useEffect(() => {
    let cancelled = false
    concessionService.getActiveForUi({ fallback: true })
      .then(list => {
        if (cancelled) return
        const mapped = Array.isArray(list) && list.length > 0 ? list : FALLBACK_COMBOS
        setCombos(mapped)
        const initQty = {}
        mapped.forEach(c => { initQty[c.id] = 0 })
        setSelectedCombos(initQty)
      })
    return () => { cancelled = true }
  }, [])

  // Filter showtimes for selected movie
  const availableShowtimes = useMemo(() => {
    if (!selectedMovie || !Array.isArray(showtimes)) return []
    const mTitle = selectedMovie.titleVn || selectedMovie.title || ''
    return showtimes.filter(s => {
      const matchTitle = s.movie && mTitle && s.movie.toUpperCase() === mTitle.toUpperCase()
      const matchId = String(s.movieId) === String(selectedMovie.id)
      return matchTitle || matchId
    })
  }, [selectedMovie, showtimes])

  // Custom Seeded Occupied seats (Deterministic for same showtime)
  const occupiedSeats = useMemo(() => {
    if (!selectedShowtime) return []
    const id = Number(selectedShowtime.id) || 100
    const occupied = []
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    for (let r = 0; r < rows.length; r++) {
      for (let c = 1; c <= 12; c++) {
        const hash = (r * 7 + c * 13 + id * 19) % 100
        if (hash < 30) { // 30% occupancy
          occupied.push(`${rows[r]}${c}`)
        }
      }
    }
    return occupied
  }, [selectedShowtime])

  // Maintenance seats simulation (Deterministic for same showtime)
  const maintenanceSeats = useMemo(() => {
    if (!selectedShowtime) return []
    const id = Number(selectedShowtime.id) || 100
    const maintenance = []
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    for (let r = 0; r < rows.length; r++) {
      for (let c = 1; c <= 12; c++) {
        const hash = (r * 11 + c * 17 + id * 23) % 100
        if (hash === 99) { // 1% maintenance
          maintenance.push(`${rows[r]}${c}`)
        }
      }
    }
    return maintenance
  }, [selectedShowtime])

  // Seating grid configuration
  const SEAT_ROWS = [
    { row: 'A', type: 'STANDARD', price: 90000 },
    { row: 'B', type: 'STANDARD', price: 90000 },
    { row: 'C', type: 'STANDARD', price: 90000 },
    { row: 'D', type: 'VIP', price: 110000 },
    { row: 'E', type: 'VIP', price: 110000 },
    { row: 'F', type: 'VIP', price: 110000 },
    { row: 'G', type: 'COUPLE', price: 130000 },
    { row: 'H', type: 'COUPLE', price: 130000 },
  ]

  const getSeatPrice = (seatId) => {
    const rowChar = seatId.charAt(0)
    const match = SEAT_ROWS.find(r => r.row === rowChar)
    if (selectedShowtime && selectedShowtime.room?.includes('IMAX')) {
      return match ? match.price + 30000 : 120000 // IMAX premium upcharge
    }
    return match ? match.price : 90000
  }

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId) || maintenanceSeats.includes(seatId)) return
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    )
  }

  const handleComboQty = (comboId, delta) => {
    setSelectedCombos(prev => ({
      ...prev,
      [comboId]: Math.max(0, prev[comboId] + delta)
    }))
  }

  // Member check logic
  const handleCheckMember = (e) => {
    if (e) e.preventDefault()
    if (!memberQuery.trim()) return

    const trimmed = memberQuery.trim().toUpperCase()
    const member = MOCK_MEMBERS.find(
      m => m.memberId.toUpperCase() === trimmed || m.phone === trimmed || m.idCard === trimmed
    )

    setCheckedMember(true)
    setConvertCount(0)
    setScoreError('')

    if (member) {
      setFoundMember(member)
    } else {
      setFoundMember(null)
    }
  }

  // Member score validation
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

  // Calculation summaries
  const ticketPriceTotal = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0)
  }, [selectedSeats, selectedShowtime])

  const comboPriceTotal = useMemo(() => {
    return Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
      const combo = combos.find(c => String(c.id) === String(id))
      return sum + (combo ? combo.price * qty : 0)
    }, 0)
  }, [selectedCombos, combos])

  const singleTicketPrice = selectedSeats.length > 0 ? (ticketPriceTotal / selectedSeats.length) : 0
  const discountTotal = convertCount * singleTicketPrice
  const finalPriceTotal = Math.max(0, ticketPriceTotal - discountTotal) + comboPriceTotal

  const changeReturn = useMemo(() => {
    if (!cashReceived || isNaN(cashReceived)) return 0
    return Math.max(0, parseInt(cashReceived, 10) - finalPriceTotal)
  }, [cashReceived, finalPriceTotal])

  // Formats currency in VND
  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  // Checkout process simulation
  const handleCheckout = async () => {
    if (paymentMethod === 'cash' && (!cashReceived || parseInt(cashReceived, 10) < finalPriceTotal)) {
      setError('Số tiền khách đưa chưa đủ để thanh toán.')
      return
    }
    setError('')
    setIsSubmitting(true)

    // Simulate print layout ticket payload
    const bookingId = 'BK' + Math.floor(100000 + Math.random() * 900000)
    const payload = {
      id: bookingId,
      movie: selectedMovie.titleVn || selectedMovie.title,
      screen: selectedShowtime.room,
      date: selectedShowtime.date === 'Hôm nay' ? new Date().toLocaleDateString('vi-VN') : selectedShowtime.date,
      time: selectedShowtime.time,
      seats: selectedSeats.join(', '),
      price: singleTicketPrice,
      total: finalPriceTotal,
      convertTickets: convertCount,
      scoreUsed: convertCount * 1000,
      memberId: foundMember ? foundMember.memberId : 'GUEST',
      customerName: foundMember ? foundMember.fullName : 'Khách vãng lai',
      phone: foundMember ? foundMember.phone : 'N/A',
      email: foundMember ? `${foundMember.memberId.toLowerCase()}@cinemate.vn` : 'counter@cinemate.vn',
      idCard: foundMember ? foundMember.idCard : 'N/A',
      status: 'Đã thanh toán',
      checkedIn: false,
      checkInTime: null,
      paymentMethod: paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ ngân hàng' : 'Quét mã QR',
      combosSummary: Object.entries(selectedCombos)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const c = combos.find(combo => String(combo.id) === String(id))
          return c ? `${c.name} (x${qty})` : `(x${qty})`
        }).join(', ')
    }

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Save directly into local database
      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      localStorage.setItem('staff_bookings_db', JSON.stringify([payload, ...localBookings]))

      // Trigger printed ticket modal view
      setPrintedTicket(payload)
    } catch (err) {
      setError('Có lỗi xảy ra trong quá trình xuất vé.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset page states for next sale
  const handleReset = () => {
    setCurrentStep(1)
    setSelectedMovie(null)
    setSelectedShowtime(null)
    setSelectedSeats([])
    const initQty = {}
    combos.forEach(c => { initQty[c.id] = 0 })
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
  }

  return (
    <div className="space-y-6 text-left min-h-screen text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Bán vé tại quầy (POS)
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
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
          <div className="flex justify-between items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xl select-none">
            {[
              { step: 1, label: 'Phim & Suất' },
              { step: 2, label: 'Chọn Ghế' },
              { step: 3, label: 'Bắp Nước & Thành Viên' },
              { step: 4, label: 'Thanh Toán' }
            ].map((s, idx) => (
              <div key={s.step} className="flex items-center flex-1 last:flex-initial">
                <button
                  disabled={currentStep < s.step && (!selectedMovie || (s.step === 3 && selectedSeats.length === 0))}
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex items-center gap-2 cursor-pointer border-none bg-transparent transition-all outline-none disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2
                    ${currentStep === s.step
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent shadow-[0_0_8px_rgba(229,9,20,0.15)]'
                      : currentStep > s.step
                        ? 'border-green-500 text-green-500 bg-transparent'
                        : 'border-slate-700 text-slate-500 bg-transparent'}`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </span>
                  <span className={`text-xs font-bold whitespace-nowrap ${currentStep === s.step ? 'text-white' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </button>
                {idx < 3 && (
                  <div className="h-px flex-1 mx-4 bg-slate-800" />
                )}
              </div>
            ))}
          </div>

          {/* Step Contents */}
          <AnimatePresence mode="wait">

            {/* STEP 1: SELECT MOVIE & SHOWTIME */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                className="space-y-6"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
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
                                setSelectedShowtime(null) // reset showtime on movie switch
                              }}
                              className={`w-fit mt-3 px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border
                                ${isSelected
                                  ? 'bg-[var(--color-primary)] text-white border-transparent shadow-md'
                                  : 'bg-transparent text-gray-400 hover:text-white border-white/10 hover:border-white/20'}`}
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
                  <motion.div
                    className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl text-left space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
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
                                setSelectedSeats([]) // reset seats on showtime switch
                                setCurrentStep(2) // proceed to step 2 automatically
                              }}
                              className={`p-3.5 rounded-xl text-left border cursor-pointer transition-all flex flex-col justify-between gap-1
                                ${isStSelected
                                  ? 'bg-red-600/10 border-[var(--color-primary)] text-red-400 shadow-sm'
                                  : 'bg-black/20 border-white/5 hover:border-white/20 text-gray-300 hover:text-white'
                                }`}
                            >
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{st.room}</span>
                              <span className="text-lg font-black font-mono leading-none mt-1">{st.time}</span>
                              <span className="text-[10px] font-bold text-slate-400 mt-1">{formatVND(st.price)}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: SELECT SEAT LAYOUT */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl text-center space-y-8"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-left">
                    Sơ đồ phòng chiếu: {selectedShowtime?.room} ({selectedShowtime?.time})
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] text-left mt-0.5">Nhấp vào ghế trống để bán vé.</p>
                </div>

                {/* Cinema Screen Curve */}
                <div className="w-4/5 mx-auto h-8 relative flex flex-col items-center justify-start pointer-events-none mb-10 select-none">
                  <div className="w-full h-8 rounded-[100%] border-t-2 border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent shadow-[0_12px_24px_rgba(229,9,20,0.06)]" />
                  <p className="text-[9px] text-red-500/40 font-bold uppercase tracking-[0.25em] mt-2">MÀN HÌNH CHÍNH (SCREEN)</p>
                </div>

                {/* Seating Grid map */}
                <div className="overflow-x-auto pb-4 custom-scrollbar">
                  <div className="inline-flex flex-col gap-2 relative px-8 py-6 rounded-3xl bg-black/30 border border-white/5 select-none">
                    {SEAT_ROWS.map((rowConfig, rIndex) => (
                      <div key={rowConfig.row} className="flex items-center gap-3">
                        {/* Row letter left */}
                        <span className="w-6 text-right font-black text-slate-500 text-[10px] font-mono pr-1.5">{rowConfig.row}</span>

                        <div className="flex gap-2">
                          {Array.from({ length: 12 }).map((_, colIndex) => {
                            const seatId = `${rowConfig.row}${colIndex + 1}`
                            const isOccupied = occupiedSeats.includes(seatId)
                            const isMaintenance = maintenanceSeats.includes(seatId)
                            const isSelected = selectedSeats.includes(seatId)

                            let seatStyle = ''
                            if (rowConfig.type === 'STANDARD') {
                              seatStyle = 'border border-slate-700 bg-transparent text-slate-400 hover:bg-slate-800'
                            } else if (rowConfig.type === 'VIP') {
                              seatStyle = 'border border-blue-500/40 bg-transparent text-blue-500 hover:bg-blue-950/40'
                            } else {
                              seatStyle = 'border border-red-500/40 bg-transparent text-red-500 hover:bg-red-950/40'
                            }

                            if (isOccupied) {
                              seatStyle = 'bg-slate-800 border-slate-900 text-slate-600 opacity-30 cursor-not-allowed'
                            } else if (isMaintenance) {
                              seatStyle = 'bg-amber-500/10 border-2 border-amber-500 text-amber-500 cursor-not-allowed'
                            } else if (isSelected) {
                              seatStyle = 'bg-[var(--color-primary)] border-transparent text-white shadow-[0_0_12px_rgba(229,9,20,0.35)] scale-105'
                            }

                            return (
                              <button
                                key={seatId}
                                disabled={isOccupied || isMaintenance}
                                onClick={() => handleSeatClick(seatId)}
                                className={`w-8 h-8 rounded-t-lg rounded-b-md flex items-center justify-center text-[9px] font-black font-mono transition-all cursor-pointer
                                  ${seatStyle}`}
                              >
                                {isMaintenance ? <Wrench size={10} /> : seatId}
                              </button>
                            )
                          })}
                        </div>

                        {/* Row letter right */}
                        <span className="w-6 text-left font-black text-slate-500 text-[10px] font-mono pl-1.5">{rowConfig.row}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seating Grid Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-6 text-[11px] font-semibold text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-950 border border-slate-700" />
                    <span>Standard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-950/30 border border-blue-500/40" />
                    <span>VIP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-950/30 border border-red-500/40" />
                    <span>Couple</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[var(--color-primary)] shadow-md" />
                    <span>Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-800 opacity-30 border border-slate-900" />
                    <span>Đã bán</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500">
                      <Wrench size={9} />
                    </div>
                    <span>Bảo trì</span>
                  </div>
                </div>

                {/* Continue button */}
                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    disabled={selectedSeats.length === 0}
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase transition-all shadow-md cursor-pointer border-none"
                  >
                    <span>Tiếp tục bắp nước</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONCESSIONS & MEMBERS */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* Popcorn Concessions counter */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2 font-mono">
                    <ShoppingBag size={16} className="text-red-500" />
                    Bắp nước & đồ ăn
                  </h3>

                  <div className="space-y-4">
                    {combos.map(combo => (
                      <div key={combo.id} className="flex justify-between items-center bg-black/20 border border-white/5 p-4 rounded-xl">
                        <div className="space-y-0.5 text-left pr-2">
                          <span className="text-xs font-bold text-white block">{combo.name}</span>
                          <span className="text-[10px] text-gray-500 block leading-normal">{combo.desc}</span>
                          <span className="text-xs font-semibold text-slate-400 block mt-1">{formatVND(Number(combo.price))}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleComboQty(combo.id, -1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 flex items-center justify-center font-black text-white cursor-pointer active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="text-sm font-black w-6 text-center font-mono text-white">
                            {selectedCombos[combo.id] || 0}
                          </span>
                          <button
                            onClick={() => handleComboQty(combo.id, 1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 flex items-center justify-center font-black text-white cursor-pointer active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Membership Integration */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-5 text-left">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2 font-mono">
                    <User size={16} className="text-red-500" />
                    Tích hợp Hội viên
                  </h3>

                  {/* Search member */}
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
                      className="bg-red-650 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 border-none shadow-md"
                    >
                      <Search size={12} />
                      Tra cứu
                    </button>
                  </form>

                  {/* Check Results details */}
                  {checkedMember && (
                    <div className="space-y-4">
                      {foundMember ? (
                        <div className="bg-red-950/15 border border-red-500/20 rounded-xl p-4 space-y-3 text-xs leading-normal">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tên hội viên:</span>
                            <span className="text-white font-bold">{foundMember.fullName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mã thẻ:</span>
                            <span className="text-white font-bold font-mono">{foundMember.memberId}</span>
                          </div>
                          <div className="flex justify-between border-t border-red-500/10 pt-2">
                            <span className="text-gray-400 font-bold">Điểm tích lũy:</span>
                            <span className="text-red-500 font-black text-sm">{foundMember.score} điểm</span>
                          </div>

                          {/* Convert points logic */}
                          <div className="flex flex-col gap-1.5 border-t border-red-500/10 pt-3">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Đổi vé miễn phí (1000 điểm = 1 vé)</label>
                            <select
                              value={convertCount}
                              onChange={(e) => setConvertCount(parseInt(e.target.value, 10))}
                              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer font-medium"
                            >
                              {Array.from({ length: selectedSeats.length + 1 }).map((_, i) => (
                                <option key={i} value={i}>{i} vé</option>
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

                  {/* Navigation step button */}
                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      disabled={!!scoreError}
                      onClick={() => setCurrentStep(4)}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase transition-all shadow-md cursor-pointer border-none"
                    >
                      <span>Tiến hành thanh toán</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CHECKOUT PAYMENT */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-6 text-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2 font-mono">
                  <CreditCard size={16} className="text-red-500" />
                  Phương thức thanh toán & Đơn hàng
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Select payment method */}
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

                    {/* Cash received calculator */}
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

                        {/* Quick cash helper buttons */}
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
                          {/* Simulated QR Code placeholder */}
                          <div className="w-full h-full border-4 border-slate-900 border-dashed flex items-center justify-center bg-slate-50 text-[10px] font-black text-slate-800 leading-none">
                            [ SCAN QR ]
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">Chờ quét mã chuyển khoản qua ví MoMo/VNPAY/VietQR</p>
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

                  {/* Summary Checklist */}
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
                      <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 text-[10px] font-bold rounded-lg leading-normal">
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
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* RIGHT ORDER SUMMARY PANEL */}
        <div className="lg:col-span-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl space-y-6 text-left relative overflow-hidden">

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-3 font-mono">
            Hóa đơn chi tiết (Summary)
          </h3>

          {/* Movie poster info */}
          {selectedMovie ? (
            <div className="flex gap-3">
              <img
                src={selectedMovie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=150'}
                alt={selectedMovie.titleVn}
                className="w-14 h-20 object-cover rounded-lg border border-white/10"
              />
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white bg-red-650 inline-block uppercase leading-none">
                  {selectedMovie.rating || 'P'}
                </span>
                <h4 className="text-xs font-black text-white leading-snug line-clamp-2">
                  {selectedMovie.titleVn || selectedMovie.title}
                </h4>
                <p className="text-[10px] text-[var(--color-text-muted)] font-semibold">
                  {selectedMovie.durationMinutes || 120} phút • {selectedMovie.version || '2D'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-600 text-xs border border-dashed border-slate-800 rounded-xl flex flex-col items-center gap-1.5">
              <span className="material-symbols-outlined text-2xl text-slate-600">movie</span>
              <span>Chưa chọn phim.</span>
            </div>
          )}

          {/* Showtime info */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thông tin suất chiếu</span>
            {selectedShowtime ? (
              <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs font-semibold leading-relaxed space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>Phòng chiếu:</span>
                  <span className="text-white font-bold">{selectedShowtime.room}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Ngày chiếu:</span>
                  <span className="text-white font-bold">{selectedShowtime.date === 'Hôm nay' ? 'Hôm nay' : selectedShowtime.date}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Giờ chiếu:</span>
                  <span className="text-red-500 font-extrabold font-mono">{selectedShowtime.time}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-600 italic block">Chưa chọn suất chiếu.</span>
            )}
          </div>

          {/* Seats and Ticket prices list */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ghế đã chọn ({selectedSeats.length})</span>
            {selectedSeats.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {selectedSeats.map(seat => (
                  <div key={seat} className="flex justify-between items-center text-xs font-semibold text-gray-300">
                    <span>Ghế {seat} ({seat.charAt(0) === 'G' || seat.charAt(0) === 'H' ? 'Couple' : seat.charAt(0) === 'D' || seat.charAt(0) === 'E' || seat.charAt(0) === 'F' ? 'VIP' : 'Standard'})</span>
                    <span className="font-mono">{formatVND(getSeatPrice(seat))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-600 italic block">Chưa chọn ghế ngồi.</span>
            )}
          </div>

          {/* Concessions combos summary */}
          {comboPriceTotal > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bắp nước đã thêm</span>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {Object.entries(selectedCombos).map(([id, qty]) => {
                  if (qty === 0) return null
                  const c = combos.find(combo => String(combo.id) === String(id))
                  if (!c) return null
                  return (
                    <div key={id} className="flex justify-between items-center text-xs font-semibold text-gray-300">
                      <span>{c.name} (x{qty})</span>
                      <span className="font-mono">{formatVND(Number(c.price) * qty)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Total Checkout Pricing */}
          <div className="border-t border-white/5 pt-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
              <span>Đơn giá vé:</span>
              <span className="font-mono">{formatVND(ticketPriceTotal)}</span>
            </div>
            {convertCount > 0 && (
              <div className="flex justify-between items-center text-xs font-semibold text-green-500">
                <span>Ưu đãi điểm hội viên:</span>
                <span className="font-mono">-{formatVND(discountTotal)}</span>
              </div>
            )}
            {comboPriceTotal > 0 && (
              <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
                <span>Đơn giá bắp nước:</span>
                <span className="font-mono">{formatVND(comboPriceTotal)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
              <span className="text-xs text-white font-bold">Tổng thanh toán:</span>
              <span className="text-lg font-black text-red-500 font-mono">{formatVND(finalPriceTotal)}</span>
            </div>
          </div>

          {/* Stepper controls */}
          <div className="flex gap-2.5 pt-4 border-t border-white/5">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer bg-transparent"
              >
                <ChevronLeft size={13} />
                <span>Quay lại</span>
              </button>
            )}

            {currentStep < 4 && (
              <button
                type="button"
                disabled={
                  (currentStep === 1 && (!selectedMovie || !selectedShowtime)) ||
                  (currentStep === 2 && selectedSeats.length === 0) ||
                  (currentStep === 3 && !!scoreError)
                }
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex-[2] py-2.5 rounded-xl bg-red-650 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1 border-none cursor-pointer shadow-md"
              >
                <span>Tiếp tục</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* TICKET PRINT PREVIEW MODAL */}
      <AnimatePresence>
        {printedTicket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
          >
            <motion.div
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-slate-800 text-left relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Receipt Visual design */}
              <div className="flex flex-col items-center border-b-2 border-dashed border-slate-200 pb-5 text-center space-y-2">
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle size={10} className="text-emerald-500" />
                  XUẤT VÉ THÀNH CÔNG
                </span>

                <h4 className="text-lg font-black tracking-widest text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  CINE<span className="text-red-650">MATE</span>
                </h4>
                <p className="text-[9px] font-medium text-slate-500">
                  HÓA ĐƠN VÉ &amp; DỊCH VỤ TẠI QUẦY<br />
                  Mã giao dịch: {printedTicket.id}
                </p>
              </div>

              {/* Receipt details */}
              <div className="py-5 space-y-3.5 text-[11px] font-semibold text-slate-600">

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Tên Phim</span>
                  <span className="text-xs font-black text-slate-900 leading-snug block">{printedTicket.movie}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Phòng chiếu</span>
                    <span className="text-xs font-bold text-slate-900 block">{printedTicket.screen}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Suất chiếu</span>
                    <span className="text-xs font-black text-red-650 block font-mono">{printedTicket.time}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Ngày chiếu</span>
                    <span className="text-xs font-bold text-slate-900 block">{printedTicket.date}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Số Ghế</span>
                    <span className="text-xs font-black text-slate-900 block font-mono">{printedTicket.seats}</span>
                  </div>
                </div>

                {printedTicket.combosSummary && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Bắp nước kèm theo</span>
                    <span className="text-[11px] text-slate-800 block mt-0.5 leading-snug font-medium">{printedTicket.combosSummary}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Hình thức thanh toán:</span>
                    <span>{printedTicket.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tài khoản hội viên:</span>
                    <span>{printedTicket.memberId} ({printedTicket.customerName})</span>
                  </div>
                  {printedTicket.convertTickets > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Đổi điểm tích lũy:</span>
                      <span>-{formatVND(printedTicket.convertTickets * printedTicket.price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-bold">TỔNG TIỀN THANH TOÁN:</span>
                    <span className="font-black text-red-650 text-sm font-mono">{formatVND(printedTicket.total)}</span>
                  </div>
                </div>

              </div>

              {/* Barcode/QR visualization for ticket checking */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 mt-2">
                <div className="w-full h-10 border-2 border-slate-900 border-dashed flex items-center justify-center text-[10px] font-black tracking-[0.4em] text-slate-800 select-none">
                  * {printedTicket.id} *
                </div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Quét mã vạch này tại cửa soát vé</p>
              </div>

              {/* Control buttons */}
              <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    window.print()
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Printer size={14} />
                  <span>In vé quầy</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-md"
                >
                  <RotateCcw size={14} />
                  <span>Giao dịch tiếp</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
