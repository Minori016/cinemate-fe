import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { User, Calendar, MessageSquare, DollarSign, X } from 'lucide-react'
import { movieService } from '../../services/movieService'
import { bookingService } from '../../services/bookingService'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'motion/react'

// ── Seat layout config ──
const SEAT_ROWS = [
  { row: 'A', type: 'standard', price: 90000 },
  { row: 'B', type: 'standard', price: 90000 },
  { row: 'C', type: 'standard', price: 90000 },
  { row: 'D', type: 'vip', price: 110000 },
  { row: 'E', type: 'vip', price: 110000 },
  { row: 'F', type: 'vip', price: 110000 },
]

const OCCUPIED_SEATS = [
  'A3', 'A4', 'A8', 'B1', 'B2', 'B11', 'B12',
  'C5', 'C6', 'C7', 'D5', 'D6', 'D7',
  'E4', 'E8', 'E9', 'F6', 'F7',
  'G1', 'H3', 'H5'
]

const COMBOS = [
  { id: 1, name: 'Combo Solo', desc: '1 bắp ngọt 60oz + 1 nước ngọt 22oz', price: 75000, img: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=600' },
  { id: 2, name: 'Combo Couple', desc: '1 bắp ngọt 60oz + 2 nước ngọt 22oz', price: 95000, img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600' },
  { id: 3, name: 'Combo Party', desc: '2 bắp ngọt 60oz (tự chọn vị) + 4 nước ngọt 22oz', price: 165000, img: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=600' },
]

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return {
    date: d.toISOString().slice(0, 10),
    label: d.getDate(),
    day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
  }
})

const SCHEDULE_TEMPLATES = [
  ['08:30', '11:15', '14:00', '16:45', '19:30', '22:15'],
  ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'],
  ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'],
  ['10:15', '13:00', '16:45', '19:30', '22:15'],
  ['11:00', '14:30', '18:00', '20:30', '22:30'],
]

const checkSingleEmptySeats = (selectedSeats, occupiedSeats) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F']
  const coupleRows = ['G', 'H']
  const getRowSections = (rowLabel) => {
    if (rows.includes(rowLabel)) return [['1','2','3'],['4','5','6','7','8','9'],['10','11','12']]
    if (coupleRows.includes(rowLabel)) return [['1'],['2','3','4'],['5']]
    return []
  }
  const allRows = [...rows, ...coupleRows]
  const violations = []
  for (const row of allRows) {
    const sections = getRowSections(row)
    for (let s = 0; s < sections.length; s++) {
      const section = sections[s]
      if (section.length <= 1) continue
      const initialStates = section.map(num => occupiedSeats.includes(`${row}${num}`) ? 1 : 0)
      const finalStates = section.map(num => (occupiedSeats.includes(`${row}${num}`) || selectedSeats.includes(`${row}${num}`)) ? 1 : 0)
      const countSingleEmpty = (states) => {
        let count = 0; let i = 0
        while (i < states.length) {
          if (states[i] === 0) { let len = 0; while (i < states.length && states[i] === 0) { len++; i++ }; if (len === 1) count++ } else i++
        }
        return count
      }
      if (countSingleEmpty(finalStates) > countSingleEmpty(initialStates)) {
        let i = 0
        while (i < finalStates.length) {
          if (finalStates[i] === 0) {
            let start = i; let len = 0
            while (i < finalStates.length && finalStates[i] === 0) { len++; i++ }
            if (len === 1) {
              let initLen = 0; let j = start
              while (j >= 0 && initialStates[j] === 0) { initLen++; j-- }
              j = start + 1
              while (j < initialStates.length && initialStates[j] === 0) { initLen++; j++ }
              if (initLen !== 1) violations.push(`${row}${section[start]}`)
            }
          } else i++
        }
      }
    }
  }
  return violations
}

const getEmbedUrl = (url) => {
  if (!url) return ''
  if (url.includes('youtube.com/embed/')) return url
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`
  return url
}

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

function StarRating({ filled = 4, half = true }) {
  return (
    <div className="flex gap-0.5" style={{ color: 'var(--color-gold)' }}>
      {Array.from({ length: Math.floor(filled) }).map((_, i) => (
        <span key={i} className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
      {half && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star_half</span>}
      {Array.from({ length: 5 - Math.ceil(filled) }).map((_, i) => (
        <span key={i} className="material-symbols-outlined opacity-35" style={{ fontSize: '18px' }}>star</span>
      ))}
    </div>
  )
}



export default function MovieDetailPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const bookingSectionRef = useRef(null)

  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  const queryDate = searchParams.get('date')
  const queryTime = searchParams.get('time')

  // Booking stepper
  const [bookingStep, setBookingStep] = useState((queryDate && queryTime) ? 2 : 1)
  const [selectedDate, setSelectedDate] = useState(queryDate || DAYS[0].date)
  const [selectedTime, setSelectedTime] = useState(queryTime || '')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedCombos, setSelectedCombos] = useState({ 1: 0, 2: 0, 3: 0 })

  // Sync state with query parameters
  useEffect(() => {
    const qDate = searchParams.get('date')
    const qTime = searchParams.get('time')
    if (qDate && qTime) {
      setSelectedDate(qDate)
      setSelectedTime(qTime)
      setBookingStep(2)
    }
  }, [searchParams])

  // Scroll to booking section when page finishes loading if queries are present
  useEffect(() => {
    const qDate = searchParams.get('date')
    const qTime = searchParams.get('time')
    if (!loading && qDate && qTime) {
      const timer = setTimeout(() => {
        const element = document.getElementById('booking-section')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loading, searchParams])

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [valErrors, setValErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [simulatedOutcome, setSimulatedOutcome] = useState('success')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')

  useEffect(() => {
    if (bookingStep === 3 && !bookingId) {
      setBookingId('BK' + Math.floor(100000 + Math.random() * 900000))
    }
  }, [bookingStep, bookingId])

  const getMovieSchedules = () => {
    const idx = Number(movieId) || 0
    return SCHEDULE_TEMPLATES[idx % SCHEDULE_TEMPLATES.length]
  }

  const getSeatPrice = (seatId) => {
    const r = seatId.charAt(0)
    if (r === 'A' || r === 'B' || r === 'C') return 90000
    if (r === 'D' || r === 'E' || r === 'F') return 110000
    if (r === 'G' || r === 'H') return 130000
    return 0
  }

  const toggleSeat = (seatId) => {
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId])
  }

  const handleUpdateComboQty = (id, delta) => {
    setSelectedCombos(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
  }

  const violations = selectedSeats.length > 0
    ? checkSingleEmptySeats(selectedSeats, OCCUPIED_SEATS) : []

  const ticketPrice = selectedSeats.reduce((sum, id) => sum + getSeatPrice(id), 0)
  const comboPrice = Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
    const combo = COMBOS.find(c => c.id === parseInt(id, 10))
    return sum + (combo ? combo.price * qty : 0)
  }, 0)
  const totalPrice = ticketPrice + comboPrice

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hôm nay') return 'Hôm nay'
    try { return new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return dateString }
  }

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

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16)
    setCardNumber(value.replace(/(\d{4})(?=\d)/g, '$1 '))
    if (valErrors.cardNumber) setValErrors(prev => ({ ...prev, cardNumber: '' }))
  }
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2)
    setExpiryDate(value)
    if (valErrors.expiryDate) setValErrors(prev => ({ ...prev, expiryDate: '' }))
  }
  const handleCvvChange = (e) => {
    setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))
    if (valErrors.cvv) setValErrors(prev => ({ ...prev, cvv: '' }))
  }
  const handleCardHolderChange = (e) => {
    setCardHolder(e.target.value.toUpperCase())
    if (valErrors.cardHolder) setValErrors(prev => ({ ...prev, cardHolder: '' }))
  }

  const validateCardDetails = () => {
    const errors = {}
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) errors.cardNumber = 'Số thẻ không hợp lệ. Vui lòng nhập đủ 16 chữ số.'
      if (!cardHolder.trim()) errors.cardHolder = 'Tên chủ thẻ không được để trống.'
      else if (!/^[A-Z\s]+$/.test(cardHolder)) errors.cardHolder = 'Tên chủ thẻ viết hoa không dấu và chỉ chứa chữ cái.'
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) errors.expiryDate = 'Ngày hết hạn không đúng định dạng MM/YY.'
      else {
        const [month, year] = expiryDate.split('/').map(Number)
        if (year < 26 || (year === 26 && month < 6)) errors.expiryDate = 'Thẻ đã hết hạn sử dụng.'
      }
      if (cvv.length !== 3) errors.cvv = 'Mã bảo mật CVV/CVC phải chứa đúng 3 chữ số.'
    }
    setValErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitPayment = async (e) => {
    if (e) e.preventDefault()
    setSubmitError('')
    if (paymentMethod === 'card' && !validateCardDetails()) return
    setSubmitting(true)
    const steps = ['Đang mã hóa thông tin thẻ giao dịch...', 'Đang gửi yêu cầu xác thực bảo mật...', 'Đang xử lý kết quả giao dịch thanh toán...']
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i])
      await new Promise(r => setTimeout(r, 600))
    }
    if (simulatedOutcome !== 'success') {
      setSubmitting(false); setProcessingStep('')
      const msgs = { fail_funds: 'Số dư tài khoản không đủ để thực hiện giao dịch.', fail_cvv: 'Mã bảo mật CVV/CVC không hợp lệ.', fail_expired: 'Thẻ đã hết hạn sử dụng hoặc bị khóa.', fail_timeout: 'Hết thời gian kết nối với cổng thanh toán ngân hàng.' }
      setSubmitError('Thanh toán thất bại: ' + (msgs[simulatedOutcome] || 'Lỗi không xác định.'))
      return
    }
    const payload = {
      bookingId, movieId, movieName: movie.title, showTime: selectedTime, showDate: selectedDate,
      seats: selectedSeats, totalPrice, room: 'Phòng Chiếu 03 (IMAX)',
      fullName: user?.fullName || 'Thành viên CineMate', email: user?.email || '',
      identityCard: 'Chưa cập nhật', phoneNumber: 'Chưa cập nhật'
    }
    try { await bookingService.create(payload) } catch (err) { console.warn('Backend offline, saving locally.', err) }
    finally {
      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      localStorage.setItem('staff_bookings_db', JSON.stringify([{
        id: bookingId, movie: movie.title, screen: 'Phòng Chiếu 03 (IMAX)',
        date: new Date(selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: selectedTime, seats: selectedSeats.join(', '), price: getSeatPrice(selectedSeats[0] || 'A1'),
        total: totalPrice, convertTickets: 0, scoreUsed: 0,
        memberId: 'MEM-' + Math.floor(100000 + Math.random() * 900000),
        customerName: user?.fullName || 'Thành viên CineMate', phone: '0123456789',
        email: user?.email || '', idCard: '012345678901', status: 'Đã thanh toán',
        checkedIn: false, checkInTime: null
      }, ...localBookings]))
      setBookingSuccess(true)
      setSubmitting(false)
    }
  }

  // Seat renderers
  function SeatButton({ seat, type }) {
    const isOccupied = OCCUPIED_SEATS.includes(seat.id)
    const isSelected = selectedSeats.includes(seat.id)
    const isVip = type === 'vip'
    return (
      <label
        key={seat.id}
        className={`seat-btn w-8 h-8 rounded border flex items-center justify-center text-xs font-bold relative ${
          isOccupied ? 'occupied cursor-not-allowed opacity-40' :
          isSelected ? 'selected cursor-pointer' :
          isVip ? 'vip border-[#f59e0b]/60 text-[#f59e0b] hover:bg-[#f59e0b]/10 cursor-pointer' :
          'border-gray-600 text-gray-300 hover:bg-white/5 cursor-pointer'
        }`}
        title={seat.id}
      >
        <input type="checkbox" checked={isSelected} disabled={isOccupied} onChange={() => toggleSeat(seat.id)} className="sr-only" />
        {isVip && !isSelected && !isOccupied ? 'V' : seat.label}
      </label>
    )
  }

  function CoupleButton({ seat }) {
    const isOccupied = OCCUPIED_SEATS.includes(seat.id)
    const isSelected = selectedSeats.includes(seat.id)
    return (
      <label
        key={seat.id}
        className={`seat-btn couple h-8 rounded border flex items-center justify-center text-xs font-bold relative ${
          isOccupied ? 'occupied cursor-not-allowed opacity-40' :
          isSelected ? 'selected cursor-pointer' :
          'border-red-600/60 text-red-500 hover:bg-red-600/10 cursor-pointer'
        }`}
        title={seat.id}
      >
        <input type="checkbox" checked={isSelected} disabled={isOccupied} onChange={() => toggleSeat(seat.id)} className="sr-only" />
        {seat.label}
      </label>
    )
  }

  function SeatRow({ rowLabel, type }) {
    const cols = Array.from({ length: 12 }, (_, i) => i + 1)
    return (
      <div className="flex items-center gap-2">
        <span className="w-5 text-[11px] font-bold text-gray-500 select-none text-center">{rowLabel}</span>
        <div className="flex gap-1.5">
          {cols.map(colNum => <SeatButton key={`${rowLabel}${colNum}`} seat={{ id: `${rowLabel}${colNum}`, label: colNum.toString() }} type={type} />)}
        </div>
        <span className="w-5 text-[11px] font-bold text-gray-500 select-none text-center">{rowLabel}</span>
      </div>
    )
  }

  function CoupleRow({ rowLabel }) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-5 text-[11px] font-bold text-gray-500 select-none text-center">{rowLabel}</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(colNum => <CoupleButton key={`${rowLabel}${colNum}`} seat={{ id: `${rowLabel}${colNum}`, label: `${rowLabel}${colNum}` }} />)}
        </div>
        <span className="w-5 text-[11px] font-bold text-gray-500 select-none text-center">{rowLabel}</span>
      </div>
    )
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const fetchMovie = async () => {
      try {
        const res = await movieService.getById(movieId)
        const data = res.data?.result ?? res.data
        if (data) {
          let cast = []
          try {
            const actorsRes = await movieService.getActors(movieId)
            const actorsData = actorsRes.data?.result || actorsRes.data || []
            cast = actorsData.map(a => ({
              name: a.fullName, role: a.characterName || 'Diễn viên',
              img: a.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
            }))
          } catch { /* ignore */ }
          setMovie({
            title: data.titleVn || data.titleEn || 'Phim Chưa Đặt Tên',
            rating: data.rating || 'K', format: data.version || '2D',
            genre: data.genres?.map(g => g.name).join(', ') || 'Chưa phân loại',
            duration: data.durationMinutes ? `${data.durationMinutes} phút` : 'N/A',
            country: data.countries?.map(c => c.name).join(', ') || 'N/A',
            subtitle: data.language || 'Phụ Đề',
            backdrop: data.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200',
            poster: data.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300',
            synopsis: data.description || 'Chi tiết phim hiện chưa được cập nhật đầy đủ từ hệ thống.',
            cast, score: '95%', scoreValue: 95,
            director: data.director || 'Đang cập nhật',
            releaseDate: data.fromDate ? new Date(data.fromDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Đang cập nhật',
            budget: 'N/A', language: data.language || 'Đang cập nhật',
            trailerUrl: getEmbedUrl(data.trailerUrl),
          })
        } else { setMovie(null) }
      } catch { setMovie(null) }
      finally { setLoading(false) }
    }
    fetchMovie()
  }, [movieId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-4xl">progress_activity</span>
    </div>
  )

  if (!movie) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-white gap-4">
      <p className="text-xl">Không tìm thấy thông tin phim!</p>
      <Link to="/" className="text-[var(--color-primary)] hover:underline">Quay về trang chủ</Link>
    </div>
  )

  const getRatingBadge = (rating) => {
    let bg = 'bg-blue-600'
    if (rating === 'T18') bg = 'bg-red-700'
    else if (rating === 'T16') bg = 'bg-red-500'
    else if (rating === 'T13') bg = 'bg-orange-500'
    else if (rating === 'K' || rating === 'P') bg = 'bg-green-600'
    return <span className={`${bg} text-white px-2.5 py-1 rounded font-bold text-xs shadow-md uppercase`}>{rating}</span>
  }

  const schedules = getMovieSchedules()

  return (
    <div className="min-h-screen w-full relative pb-20 md:pb-8" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── INLINE SEAT & PAYMENT STYLES ── */}
      <style>{`
        .seat-btn {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .seat-btn:hover:not(.occupied):not(:disabled) {
          transform: scale(1.15);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
        }
        .seat-btn.selected {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: #fff !important;
          box-shadow: 0 0 12px var(--color-primary);
        }
        .seat-btn.occupied {
          background-color: #282a2b !important;
          border-color: #4e4353 !important;
          color: #6b7280 !important;
          cursor: not-allowed;
          opacity: 0.4;
        }
        .seat-btn.vip {
          border-color: #f59e0b;
          color: #f59e0b;
        }
        .seat-btn.couple {
          width: 76px; /* 32px * 2 + 12px gap = 76px */
          border-color: #E02020;
          color: #E02020;
        }
        .seat-btn.couple.selected {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: #fff !important;
        }
        .screen-curve-inline {
          background: linear-gradient(to bottom, rgba(229,9,20,0.25) 0%, transparent 100%);
          box-shadow: 0 12px 30px rgba(229,9,20,0.12);
          transform: perspective(180px) rotateX(-5deg);
        }
        .booking-stepper-line { height: 2px; flex: 1; margin: 0 8px; align-self: flex-start; margin-top: 16px; }
        .step-done-style { color: #10b981; border-color: #10b981; }
        .step-active-style { color: var(--color-primary); border-color: var(--color-primary); box-shadow: 0 0 12px rgba(229,9,20,0.25); }
        .step-inactive-style { color: #4b5563; border-color: #374151; }
        .time-slot-btn {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #e2e2e2;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'Inter', sans-serif;
        }
        .time-slot-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: rgba(229,9,20,0.06); }
        .time-slot-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; box-shadow: 0 0 16px rgba(229,9,20,0.35); }
        .day-btn {
          display: flex; flex-direction: column; align-items: center;
          padding: 10px 14px; border-radius: 12px; cursor: pointer;
          transition: all 0.18s ease; min-width: 54px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
        }
        .day-btn:hover { border-color: var(--color-primary); background: rgba(229,9,20,0.06); }
        .day-btn.active { background: var(--color-primary); border-color: var(--color-primary); box-shadow: 0 0 16px rgba(229,9,20,0.3); }
        .inline-input {
          width: 100%; background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 12px 16px;
          color: #fff; font-size: 14px; outline: none;
          transition: border-color 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .inline-input:focus { border-color: rgba(229,9,20,0.5); }
        .inline-input.error { border-color: rgba(239,68,68,0.8); }

        /* ── SUCCESS TICKET CUSTOM FORMAT ── */
        .success-ticket-container {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          text-align: left;
        }
        @media (max-width: 768px) {
          .success-ticket-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .success-ticket-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.3);
          color: #4ade80;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 20px;
          width: fit-content;
          font-weight: 600;
        }
        .success-ticket-title {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 700;
          margin-top: 8px;
          color: white;
        }
        .success-ticket-sub {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          margin-top: 8px;
        }
        .success-ticket-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 20px;
        }
        .success-ticket-sc-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .success-ticket-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .success-ticket-row:last-of-type {
          border-bottom: none;
        }
        .success-ticket-label {
          color: rgba(255,255,255,0.45);
        }
        .success-ticket-val {
          color: white;
          font-weight: 500;
          text-align: right;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .success-ticket-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          margin-top: 6px;
          border-top: 1px solid rgba(255,255,255,0.12);
        }
        .success-ticket-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .success-ticket-btn-outline {
          flex: 1;
          padding: 12px;
          border-radius: 40px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          transition: all 0.2s;
        }
        .success-ticket-btn-outline:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.4);
          color: white;
        }
        .success-ticket-btn-primary {
          flex: 2;
          padding: 12px;
          border-radius: 40px;
          background: rgba(229,9,20,0.15);
          border: 2px solid var(--color-primary);
          font-size: 13px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }
        .success-ticket-btn-primary:hover {
          background: var(--color-primary);
          box-shadow: 0 0 16px rgba(229,9,20,0.3);
        }
        .success-ticket-right-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          padding-top: 100px;
        }
        .success-ticket-physical {
          background: #111;
          border: 2px solid var(--color-primary);
          border-radius: 20px;
          overflow: hidden;
          width: 320px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.6);
        }
        .success-ticket-physical-poster {
          width: 100%;
          height: 250px;
          object-fit: cover;
          display: block;
        }
        .success-ticket-physical-body {
          padding: 24px 22px 20px;
          text-align: left;
        }
        .success-ticket-physical-title {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 14px;
          color: white;
        }
        .success-ticket-physical-divider {
          border: none;
          border-top: 1px dashed rgba(255,255,255,0.15);
          margin: 0 0 14px;
        }
        .success-ticket-physical-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 10px;
          margin-bottom: 16px;
        }
        .success-ticket-physical-field .stf-label {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .success-ticket-physical-field .stf-val {
          font-size: 13px;
          font-weight: 600;
          color: white;
        }
        .success-ticket-physical-barcode-box {
          background: white;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .success-ticket-physical-barcode-label {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          text-align: center;
          margin-top: 12px;
          letter-spacing: 1px;
          font-weight: 500;
        }
      `}</style>

      {/* ── Hero Section ── */}
      <section className="relative w-full overflow-hidden" style={{ height: 'clamp(480px, 65vh, 820px)' }}>
        <motion.img
          src={movie.backdrop} alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.45]"
          initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 z-10 hero-gradient" />
        <div className="absolute bottom-0 w-full left-0 px-6 md:px-12 pb-10 z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-end">
            <motion.div
              className="hidden md:block w-44 lg:w-52 flex-shrink-0 z-30"
              initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <img src={movie.poster} alt={`${movie.title} poster`}
                className="w-full rounded-xl shadow-2xl border border-white/10 hover:scale-[1.02] transition-transform duration-300"
                style={{ aspectRatio: '2/3', objectFit: 'cover', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
              />
            </motion.div>
            <motion.div
              className="flex flex-col gap-3 z-30 text-left flex-1 w-full"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className="text-glow-red"
                style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 900, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1, margin: 0 }}
              >
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {getRatingBadge(movie.rating)}
                <span className="opacity-40">•</span>
                <span>{movie.duration}</span>
                <span className="opacity-40">•</span>
                <span>{movie.genre}</span>
                <span className="opacity-40">•</span>
                <span className="border border-white/15 px-2 py-0.5 rounded text-xs text-white bg-white/5">{movie.format}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {/* Smooth scroll to booking section */}
                <button
                  onClick={() => bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center gap-2 py-3 px-8 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:scale-105 active:scale-95 text-white cursor-pointer border-0"
                  style={{ background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)', boxShadow: '0 6px 20px rgba(229,9,20,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>confirmation_number</span>
                  Đặt Vé Ngay
                </button>
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center gap-2 py-3 px-8 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white/20 hover:bg-white/10 hover:border-white/45 text-white bg-transparent cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>
                  Xem Trailer
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Master Grid Layout: Booking on Left (2/3), Details on Right (1/3) ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-30">
        
        {/* Left Column (2/3 width on desktop): Booking Flow */}
        <div 
          id="booking-section"
          ref={bookingSectionRef}
          className="lg:col-span-2 flex flex-col gap-6"
        >
          {/* Section Header */}
          <div className="mb-4 text-center lg:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-black uppercase tracking-widest text-white mb-1"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span style={{ color: 'var(--color-primary)' }}>Đặt</span> Vé
            </motion.h2>
            <p className="text-xs text-gray-400 font-medium">Chọn lịch chiếu, ghế ngồi và thanh toán trực tiếp tại đây</p>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center lg:justify-start mb-6 select-none">
            {[
              { step: 1, label: 'Lịch chiếu', icon: 'calendar_today' },
              { step: 2, label: 'Chọn ghế', icon: 'event_seat' },
              { step: 3, label: 'Thanh toán', icon: 'payment' },
            ].map(({ step, label, icon }, idx) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => bookingStep > step && setBookingStep(step)}
                  className={`flex flex-col items-center gap-1.5 ${bookingStep > step ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ background: 'none', border: 'none' }}
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      bookingStep > step ? 'step-done-style bg-transparent' :
                      bookingStep === step ? 'step-active-style bg-transparent' :
                      'step-inactive-style bg-transparent'
                    }`}
                  >
                    {bookingStep > step
                      ? <span className="material-symbols-outlined text-sm font-black">done</span>
                      : <span className="material-symbols-outlined text-sm">{icon}</span>
                    }
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    bookingStep > step ? 'text-green-500' :
                    bookingStep === step ? 'text-[var(--color-primary)]' : 'text-gray-600'
                  }`}>{label}</span>
                </button>
                {idx < 2 && (
                  <div
                    className="booking-stepper-line"
                    style={{ background: bookingStep > idx + 1 ? '#10b981' : '#374151', transition: 'background 0.4s' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Stepper Steps (AnimatePresence) */}
          <AnimatePresence mode="wait">
            {bookingStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                <GlassCard className="p-6 md:p-8">
                  {/* Date Picker */}
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-base">calendar_today</span>
                    Chọn ngày xem phim
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
                    {DAYS.map(d => (
                      <button
                        key={d.date}
                        onClick={() => setSelectedDate(d.date)}
                        className={`day-btn ${selectedDate === d.date ? 'active' : ''}`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDate === d.date ? 'text-white/70' : 'text-gray-500'}`}>{d.day}</span>
                        <span className={`text-xl font-black ${selectedDate === d.date ? 'text-white' : 'text-white'}`}>{d.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Time Slots */}
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-base">schedule</span>
                    Chọn suất chiếu — <span className="text-gray-400 font-semibold normal-case tracking-normal">{formatDate(selectedDate)}</span>
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {schedules.map(time => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); setBookingStep(2) }}
                        className={`time-slot-btn ${selectedTime === time ? 'active' : ''}`}
                      >
                        <span className="material-symbols-outlined text-sm align-middle mr-1">schedule</span>
                        {time}
                      </button>
                    ))}
                  </div>

                  {/* Rạp & Phòng info */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">location_on</span>
                      CineMate Rạp Trung Tâm
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">meeting_room</span>
                      Phòng Chiếu 03 (IMAX)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">subtitles</span>
                      {movie.format} — Phụ đề tiếng Việt
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {bookingStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                {/* Summary bar */}
                <div className="flex items-center gap-3 mb-5 p-3 rounded-xl text-sm" style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)' }}>
                  <span className="material-symbols-outlined text-[var(--color-primary)]">info</span>
                  <span className="text-gray-300">{movie.title} · <strong className="text-white">{selectedTime}</strong> · {formatDate(selectedDate)} · Phòng 03 (IMAX)</span>
                </div>

                <GlassCard className="p-6 md:p-8">
                  {/* Seat selection status */}
                  {selectedSeats.length > 0 && (
                    <div className={`mb-6 text-xs font-bold px-4 py-2.5 rounded-xl border text-center transition-all ${
                      violations.length > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                      {violations.length > 0
                        ? `⚠ Không thể để lại ghế trống đơn lẻ: ${violations.join(', ')}`
                        : `✓ Đã chọn ${selectedSeats.length} ghế — nhấn "Tiếp tục" để thanh toán`
                      }
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
                      <div className="min-w-[620px] flex flex-col gap-3 items-center">
                        {SEAT_ROWS.map(r => <SeatRow key={r.row} rowLabel={r.row} type={r.type} />)}
                        <div className="h-3" />
                        <CoupleRow rowLabel="G" />
                        <CoupleRow rowLabel="H" />
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

                  {/* Combos */}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">restaurant</span>
                      Thêm bắp nước (tùy chọn)
                    </h3>
                    <div className="flex flex-col gap-3">
                      {COMBOS.map(combo => {
                        const qty = selectedCombos[combo.id] || 0
                        return (
                          <div key={combo.id} className="flex items-center gap-4 p-4 rounded-xl border transition-all"
                            style={{ background: qty > 0 ? 'rgba(229,9,20,0.04)' : 'rgba(255,255,255,0.02)', borderColor: qty > 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)' }}>
                            <img src={combo.img} alt={combo.name} className="w-14 h-14 object-cover rounded-lg border border-white/10 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{combo.name}</h4>
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{combo.desc}</p>
                              <span className="text-xs font-extrabold text-[var(--color-primary)] mt-1 block font-mono">{formatCurrency(combo.price)}</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl shrink-0" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <button type="button" onClick={() => handleUpdateComboQty(combo.id, -1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-base font-black hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.06)', border: 'none' }}>−</button>
                              <span className="text-sm font-extrabold text-white w-4 text-center font-mono">{qty}</span>
                              <button type="button" onClick={() => handleUpdateComboQty(combo.id, 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-base font-black hover:opacity-90 active:scale-90 transition-all cursor-pointer"
                                style={{ background: 'var(--color-primary)', border: 'none' }}>+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Seat summary & Continue button */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Ghế đã chọn</p>
                      {selectedSeats.length === 0
                        ? <span className="text-gray-500 text-sm italic">Chưa chọn ghế...</span>
                        : <div className="flex gap-2 flex-wrap">
                            {selectedSeats.map(s => (
                              <span key={s} className="px-3 py-1 rounded-lg text-sm font-bold text-white" style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)' }}>{s}</span>
                            ))}
                          </div>
                      }
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Tổng tiền</p>
                        <p className="text-xl font-black text-[var(--color-primary)] font-mono">{formatCurrency(totalPrice)}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (!user) { navigate('/login'); return }
                          setBookingStep(3)
                        }}
                        disabled={selectedSeats.length === 0 || violations.length > 0}
                        className="flex items-center gap-2 py-3 px-7 rounded-xl font-bold uppercase tracking-widest text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'var(--color-primary)', border: 'none', boxShadow: '0 4px 20px rgba(229,9,20,0.3)' }}
                      >
                        Tiếp tục
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {bookingStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                {/* Error banner */}
                {submitError && (
                  <div className="mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                    <span className="material-symbols-outlined text-3xl shrink-0">error</span>
                    <div>
                      <p className="font-bold">{submitError}</p>
                      <p className="text-xs mt-0.5 opacity-80">Vui lòng kiểm tra lại thông tin hoặc thử phương thức thanh toán khác.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col xl:flex-row gap-6">
                  {/* Left — Payment Form */}
                  <div className="flex-1">
                    <GlassCard className="p-6 md:p-8">
                      <h3 className="font-extrabold text-lg text-white uppercase tracking-wide mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[var(--color-primary)]">shield_lock</span>
                        Cổng thanh toán an toàn
                      </h3>

                      {/* Payment method tabs */}
                      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl mb-6" style={{ background: '#121414', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {[
                          { id: 'card', icon: 'credit_card', label: 'Thẻ tín dụng/ghi nợ' },
                          { id: 'momo', icon: 'qr_code_2', label: 'Ví MoMo' },
                          { id: 'atm', icon: 'account_balance', label: 'Chuyển khoản / ATM' },
                        ].map(({ id, icon, label }) => (
                          <button key={id} type="button"
                            onClick={() => { setPaymentMethod(id); setSubmitError('') }}
                            className={`py-3 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer border-none outline-none ${
                              paymentMethod === id ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-white bg-transparent'
                            }`}
                          >
                            <span className="material-symbols-outlined">{icon}</span>
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Card Form */}
                      {paymentMethod === 'card' && (
                        <form onSubmit={handleSubmitPayment} className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Số thẻ (Card Number)</label>
                            <div className="relative">
                              <input type="text" placeholder="4000 1234 5678 9010" value={cardNumber} onChange={handleCardNumberChange} disabled={submitting}
                                className={`inline-input pr-12 font-mono ${valErrors.cardNumber ? 'error' : ''}`} />
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 select-none">credit_card</span>
                            </div>
                            {valErrors.cardNumber && <span className="text-[10px] text-red-500 font-bold">{valErrors.cardNumber}</span>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tên in trên thẻ (Cardholder Name)</label>
                            <input type="text" placeholder="NGUYEN VAN A" value={cardHolder} onChange={handleCardHolderChange} disabled={submitting}
                              className={`inline-input uppercase font-semibold ${valErrors.cardHolder ? 'error' : ''}`} />
                            {valErrors.cardHolder && <span className="text-[10px] text-red-500 font-bold">{valErrors.cardHolder}</span>}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hạn dùng (MM/YY)</label>
                              <input type="text" placeholder="MM/YY" value={expiryDate} onChange={handleExpiryChange} disabled={submitting}
                                className={`inline-input text-center ${valErrors.expiryDate ? 'error' : ''}`} />
                              {valErrors.expiryDate && <span className="text-[10px] text-red-500 font-bold">{valErrors.expiryDate}</span>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">CVV / CVC</label>
                              <div className="relative">
                                <input type="password" placeholder="***" value={cvv} onChange={handleCvvChange} disabled={submitting} maxLength={3}
                                  className={`inline-input text-center pr-12 ${valErrors.cvv ? 'error' : ''}`} />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 select-none text-base">lock</span>
                              </div>
                              {valErrors.cvv && <span className="text-[10px] text-red-500 font-bold">{valErrors.cvv}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2.5 items-start p-3 rounded-xl" style={{ background: '#121414', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="material-symbols-outlined text-green-500 text-lg mt-0.5">check_circle</span>
                            <p className="text-[10px] text-gray-400 leading-relaxed">Thông tin được mã hóa an toàn theo chuẩn PCI-DSS. Chúng tôi không lưu trữ CVV hay mật khẩu thẻ.</p>
                          </div>
                        </form>
                      )}

                      {/* MoMo QR */}
                      {paymentMethod === 'momo' && (
                        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl text-center" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                          <div className="bg-white p-3 rounded-2xl shadow-xl w-36 h-36 flex items-center justify-center relative overflow-hidden">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MoMoPaymentCineMate" alt="MoMo QR" className="w-32 h-32 object-contain" />
                            <div className="absolute w-8 h-8 rounded-lg border-2 border-white flex items-center justify-center text-[10px] font-black text-white select-none" style={{ background: '#a50064' }}>M</div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Quét mã QR bằng ứng dụng MoMo</p>
                            <p className="text-[10px] text-gray-400 max-w-xs mt-1 leading-relaxed">Mở app MoMo → Quét mã → Xác nhận thanh toán.</p>
                          </div>
                        </div>
                      )}

                      {/* ATM/Bank Transfer */}
                      {paymentMethod === 'atm' && (
                        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl text-center" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                          <div className="bg-white p-3 rounded-2xl shadow-xl w-36 h-36 flex items-center justify-center relative overflow-hidden">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VietQRCineMateTransfer" alt="VietQR" className="w-32 h-32 object-contain" />
                            <div className="absolute w-8 h-8 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-[8px] font-black text-white select-none">QR</div>
                          </div>
                          <div className="w-full text-[11px] rounded-xl p-3 font-mono space-y-1.5 text-left" style={{ background: '#121414', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex justify-between"><span className="text-gray-500">NGÂN HÀNG:</span><span className="text-white font-bold">MBBANK (Quân Đội)</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">SỐ TÀI KHOẢN:</span><span className="text-[var(--color-primary)] font-bold select-all">190202606179</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">SỐ TIỀN:</span><span className="text-white font-bold">{formatCurrency(totalPrice)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">NỘI DUNG:</span><span className="text-[var(--color-primary)] font-bold select-all">{bookingId}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Simulator */}
                      <div className="mt-6 p-4 rounded-2xl space-y-3" style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.2)' }}>
                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs">
                          <span className="material-symbols-outlined text-base">science</span>
                          Mô phỏng cổng thanh toán (Simulator)
                        </div>
                        <select
                          value={simulatedOutcome}
                          onChange={(e) => { setSimulatedOutcome(e.target.value); setSubmitError('') }}
                          className="w-full rounded-lg py-2.5 px-3 bg-black/40 border border-white/10 text-[11px] text-white cursor-pointer"
                        >
                          <option value="success">Thanh toán Thành công ✓</option>
                          <option value="fail_funds">Thất bại — Số dư không đủ</option>
                          <option value="fail_cvv">Thất bại — CVV/CVC không hợp lệ</option>
                          <option value="fail_expired">Thất bại — Thẻ hết hạn</option>
                          <option value="fail_timeout">Thất bại — Timeout kết nối ATM</option>
                        </select>
                      </div>

                      {/* Pay button */}
                      <div className="mt-6 border-t border-white/5 pt-4">
                        <button
                          type="button" onClick={handleSubmitPayment} disabled={submitting}
                          className="w-full font-black text-xs py-3.5 rounded-xl text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                          style={{ background: 'var(--color-primary)', boxShadow: '0 4px 15px rgba(229,9,20,0.35)' }}
                        >
                          {submitting ? (
                            <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span><span>{processingStep || 'Đang xử lý...'}</span></>
                          ) : (
                            <><span className="material-symbols-outlined text-sm">lock</span>Thanh toán {formatCurrency(totalPrice)}</>
                          )}
                        </button>
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
                          <p className="text-white font-bold mt-0.5 text-xs leading-tight">{movie.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Mã vé</p>
                            <p className="text-white font-mono font-bold mt-0.5 select-all text-[10px]">{bookingId}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Phòng chiếu</p>
                            <p className="text-white font-semibold mt-0.5 text-[10px]">Phòng 03 (IMAX)</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Ngày</p>
                            <p className="text-white font-semibold mt-0.5">{new Date(selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Suất chiếu</p>
                            <p className="text-white font-semibold mt-0.5">{selectedTime}</p>
                          </div>
                        </div>
                        <div className="border-t border-white/5 pt-3">
                          <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold mb-1">Ghế ngồi</p>
                          <p className="text-[var(--color-primary)] font-black text-xs font-mono tracking-wider">{selectedSeats.join(', ') || 'Chưa chọn'}</p>
                        </div>
                        {Object.entries(selectedCombos).some(([, qty]) => qty > 0) && (
                          <div className="border-t border-white/5 pt-3">
                            <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold mb-2">Bắp nước</p>
                            {COMBOS.filter(c => selectedCombos[c.id] > 0).map(c => (
                              <div key={c.id} className="flex justify-between text-gray-300 mb-1">
                                <span>{c.name} ×{selectedCombos[c.id]}</span>
                                <span className="font-mono">{formatCurrency(c.price * selectedCombos[c.id])}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="border-t border-white/5 pt-3 flex justify-between items-end">
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 tracking-wider font-bold">Hình thức TT</p>
                            <p className="text-gray-300 mt-0.5 font-medium">{paymentMethod === 'card' ? 'Thẻ tín dụng' : paymentMethod === 'momo' ? 'Ví MoMo' : 'Chuyển khoản ATM'}</p>
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
            )}
          </AnimatePresence>
        </div>

        {/* Right Column (1/3 width on desktop): Movie Details Stack */}
        <div className="flex flex-col gap-6 lg:border-l lg:border-white/5 lg:pl-8">
          {/* Thông Tin Phim */}
          <GlassCard className="p-6">
            <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>Thông Tin Phim</h2>
            {[
              { icon: <User size={16} />, label: 'Đạo Diễn', value: movie.director },
              { icon: <Calendar size={16} />, label: 'Ngày Chiếu', value: movie.releaseDate },
              { icon: <MessageSquare size={16} />, label: 'Ngôn Ngữ', value: movie.language },
              { icon: <DollarSign size={16} />, label: 'Kinh Phí', value: movie.budget },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-none">
                <span className="text-[var(--color-primary)] opacity-80">{icon}</span>
                <span className="text-xs flex-1 text-[var(--color-on-surface-variant)]">{label}</span>
                <span className="text-xs font-semibold text-white">{value}</span>
              </div>
            ))}
          </GlassCard>

          {/* Đánh Giá Khán Giả */}
          <GlassCard className="p-6 flex flex-col">
            <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>Đánh Giá Khán Giả</h2>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-glow-gold text-5xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>{movie.score}</span>
              <div className="flex flex-col gap-1">
                <StarRating filled={4.5} half={true} />
                <span className="text-[10px] text-[var(--color-on-surface-variant)] font-medium">Sao đánh giá (4.5/5)</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 font-medium">Dựa trên 2,500+ đánh giá đã xác thực.</p>
            <div className="mt-4 rounded-full overflow-hidden bg-white/8 h-1.5 w-full">
              <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, var(--color-gold), #f59e0b)' }}
                initial={{ width: '0%' }} animate={{ width: `${movie.scoreValue}%` }} transition={{ duration: 1.2, delay: 1.1 }}
              />
            </div>
          </GlassCard>
          {/* Tóm Tắt Nội Dung */}
          <GlassCard className="p-6">
            <h2 className="mb-3 text-[var(--color-primary)] font-extrabold uppercase tracking-wider text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>Tóm Tắt Nội Dung</h2>
            <p className="leading-relaxed text-xs text-[var(--color-on-surface-variant)]" style={{ fontFamily: 'Inter, sans-serif', margin: 0 }}>{movie.synopsis}</p>
          </GlassCard>

          {/* Diễn Viên */}
          {movie.cast.length > 0 && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>Diễn Viên</h2>
              </div>
              <div className="flex flex-col gap-4">
                {movie.cast.slice(0, 5).map(({ name, role, img }) => (
                  <div key={name} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-[var(--color-primary)] transition-all duration-300" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                      <img src={img} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-xs font-bold text-white group-hover:text-[var(--color-primary)] transition-colors truncate">{name}</p>
                      <p className="m-0 text-[10px] text-[var(--color-on-surface-variant)] truncate">{role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </section>

      {/* ── Booking Success Modal ── */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
            style={{ background: 'radial-gradient(circle at center, rgba(229, 9, 20, 0.35) 0%, rgba(12, 12, 12, 0.99) 100%)', backdropFilter: 'blur(20px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-4xl p-6 md:p-10 rounded-3xl relative overflow-hidden my-auto"
              style={{
                background: 'rgba(20,20,20,0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(229, 9, 20, 0.15)'
              }}
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,9,20,0.15), transparent)' }} />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent)' }} />

              <div className="success-ticket-container">
                {/* Left Column */}
                <div className="left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    onClick={() => {
                      setBookingSuccess(false)
                      setBookingStep(1)
                      setBookingId('')
                      setSelectedSeats([])
                      setSelectedCombos({ 1: 0, 2: 0, 3: 0 })
                      navigate('/')
                    }}
                    className="back-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                  >
                    <span>&larr; Quay về trang chủ</span>
                  </div>

                  <div>
                    <div className="success-ticket-badge">
                      <span className="material-symbols-outlined text-sm font-black">done</span>
                      Đặt vé thành công
                    </div>
                    <h2 className="success-ticket-title">Vé Xem Phim Di Động</h2>
                    <p className="success-ticket-sub">
                      Khi mua vé xem phim thành công, bạn chỉ cần xuất trình mã vạch này tại cửa rạp để soát vé. Thông tin vé cũng đã được lưu trong lịch sử giao dịch.
                    </p>
                  </div>

                  <div className="success-ticket-card">
                    <div className="success-ticket-sc-title">Chi tiết đặt vé</div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Phim</span>
                      <span className="success-ticket-val" title={movie.title}>{movie.title}</span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">📅 Ngày chiếu</span>
                      <span className="success-ticket-val">{formatDate(selectedDate)}</span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">⏰ Suất chiếu</span>
                      <span className="success-ticket-val">{selectedTime}</span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Phân loại ghế</span>
                      <span className="success-ticket-val">
                        {(() => {
                          const rows = selectedSeats.map(s => s.charAt(0))
                          if (rows.some(r => r === 'G' || r === 'H')) return 'Ghế Đôi (Couple)'
                          if (rows.some(r => r === 'D' || r === 'E' || r === 'F')) return 'Ghế VIP'
                          return 'Ghế Thường'
                        })()}
                      </span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Ghế ngồi</span>
                      <span className="success-ticket-val" title={formatSeatsLeftText(selectedSeats)} style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatSeatsLeftText(selectedSeats)}</span>
                    </div>
                    <div className="success-ticket-row">
                      <span className="success-ticket-label">Số lượng</span>
                      <span className="success-ticket-val">{selectedSeats.length} vé</span>
                    </div>
                    <div className="success-ticket-total-row">
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Tổng tiền đã thanh toán</span>
                      <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="success-ticket-actions">
                    <button
                      className="success-ticket-btn-outline"
                      onClick={() => alert('Vé đang được tải xuống thiết bị của bạn...')}
                    >
                      &dArr; Tải xuống
                    </button>
                    <button
                      className="success-ticket-btn-outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`Vé xem phim CineMate: ${movie.title} - Mã vé: ${bookingId}`)
                        alert('Đã sao chép liên kết chia sẻ vé vào khay nhớ tạm!')
                      }}
                    >
                      &nearr; Chia sẻ
                    </button>
                    <button
                      className="success-ticket-btn-primary"
                      onClick={() => navigate('/profile')}
                    >
                      🎟 Xem tất cả vé
                    </button>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => {
                        setBookingSuccess(false)
                        setBookingStep(1)
                        setSelectedTime('')
                        setSelectedSeats([])
                        setSelectedCombos({ 1: 0, 2: 0, 3: 0 })
                        setBookingId('')
                        setCardNumber('')
                        setCardHolder('')
                        setExpiryDate('')
                        setCvv('')
                        setSubmitError('')
                      }}
                      className="text-xs text-gray-500 hover:text-[var(--color-primary)] transition-all cursor-pointer underline bg-transparent border-0"
                    >
                      Đặt vé phim khác
                    </button>
                  </div>
                </div>

                {/* Right Column (Ticket Preview) */}
                <div className="success-ticket-right-col">
                  <div className="success-ticket-physical">
                    <img className="success-ticket-physical-poster" src={movie.poster} alt={movie.title} />
                    <div className="success-ticket-physical-body">
                      <div className="success-ticket-physical-title">
                        {movie.title}
                      </div>
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
                          <div className="stf-val">{selectedTime}</div>
                        </div>
                        <div className="success-ticket-physical-field">
                          <div className="stf-label">Loại vé</div>
                          <div className="stf-val">
                            {(() => {
                              const rows = selectedSeats.map(s => s.charAt(0))
                              if (rows.some(r => r === 'G' || r === 'H')) return 'COUPLE'
                              if (rows.some(r => r === 'D' || r === 'E' || r === 'F')) return 'VIP'
                              return 'STANDARD'
                            })()}
                          </div>
                        </div>
                        <div className="success-ticket-physical-field">
                          <div className="stf-label">Ghế</div>
                          <div className="stf-val" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedSeats.join(', ')}>
                            {formatSeatsRightText(selectedSeats)}
                          </div>
                        </div>
                      </div>
                      <div className="success-ticket-physical-barcode-box">
                        <svg width="100%" height="44" viewBox="0 0 240 44" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0"   y="0" width="2"  height="44" fill="#111"/>
                          <rect x="4"   y="0" width="1"  height="44" fill="#111"/>
                          <rect x="7"   y="0" width="3"  height="44" fill="#111"/>
                          <rect x="12"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="15"  y="0" width="2"  height="44" fill="#111"/>
                          <rect x="19"  y="0" width="4"  height="44" fill="#111"/>
                          <rect x="25"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="28"  y="0" width="3"  height="44" fill="#111"/>
                          <rect x="33"  y="0" width="2"  height="44" fill="#111"/>
                          <rect x="37"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="40"  y="0" width="3"  height="44" fill="#111"/>
                          <rect x="45"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="48"  y="0" width="2"  height="44" fill="#111"/>
                          <rect x="52"  y="0" width="4"  height="44" fill="#111"/>
                          <rect x="58"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="61"  y="0" width="3"  height="44" fill="#111"/>
                          <rect x="66"  y="0" width="2"  height="44" fill="#111"/>
                          <rect x="70"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="73"  y="0" width="3"  height="44" fill="#111"/>
                          <rect x="78"  y="0" width="2"  height="44" fill="#111"/>
                          <rect x="82"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="85"  y="0" width="4"  height="44" fill="#111"/>
                          <rect x="91"  y="0" width="1"  height="44" fill="#111"/>
                          <rect x="94"  y="0" width="3"  height="44" fill="#111"/>
                          <rect x="99"  y="0" width="2"  height="44" fill="#111"/>
                          <rect x="103" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="106" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="111" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="114" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="118" y="0" width="4"  height="44" fill="#111"/>
                          <rect x="124" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="127" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="132" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="136" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="139" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="144" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="148" y="0" width="4"  height="44" fill="#111"/>
                          <rect x="154" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="157" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="162" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="166" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="169" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="174" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="177" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="181" y="0" width="4"  height="44" fill="#111"/>
                          <rect x="187" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="190" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="195" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="199" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="202" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="207" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="211" y="0" width="4"  height="44" fill="#111"/>
                          <rect x="217" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="220" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="225" y="0" width="2"  height="44" fill="#111"/>
                          <rect x="229" y="0" width="1"  height="44" fill="#111"/>
                          <rect x="232" y="0" width="3"  height="44" fill="#111"/>
                          <rect x="237" y="0" width="2"  height="44" fill="#111"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="success-ticket-physical-barcode-label">SCAN AT ENTRANCE</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── YouTube Trailer Modal ── */}
      <AnimatePresence>
        {isTrailerOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.93)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsTrailerOpen(false)} />
            <motion.button onClick={() => setIsTrailerOpen(false)}
              className="absolute top-6 right-6 z-[110] w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer border-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
            <motion.div className="w-full max-w-5xl aspect-video px-4 z-[105] relative"
              initial={{ opacity: 0, scale: 0.88, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.4, ease: [0.34, 1.26, 0.64, 1] }}
            >
              <iframe title={`${movie.title} Trailer`} src={`${movie.trailerUrl}?autoplay=1&rel=0`}
                className="w-full h-full rounded-xl border border-white/10 shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
