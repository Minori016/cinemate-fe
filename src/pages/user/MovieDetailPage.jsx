import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { movieService } from '../../services/movieService'
import { bookingService } from '../../services/bookingService'
import { showtimeService, isPublicShowtimeStatus } from '../../services/showtimeService'
import { concessionService, FALLBACK_COMBOS } from '../../services/concessionService'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { Ticket, CalendarDays, Armchair, CreditCard, Check, CloudOff, ArrowLeft, Play } from 'lucide-react'
import * as THREE from 'three'

// Import split presenter components
import MovieInfo from './components/moviedetail/MovieInfo'
import ShowtimeStep from './components/moviedetail/ShowtimeStep'
import SeatStep from './components/moviedetail/SeatStep'
import ComboStep from './components/moviedetail/ComboStep'
import PaymentStep from './components/moviedetail/PaymentStep'
import SuccessModal from './components/moviedetail/SuccessModal'
import TrailerModal from './components/moviedetail/TrailerModal'

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

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return { date: d.toISOString().slice(0, 10), label: d.getDate(), day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()] }
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
    if (rows.includes(rowLabel)) return [['1', '2', '3'], ['4', '5', '6', '7', '8', '9'], ['10', '11', '12']]
    if (coupleRows.includes(rowLabel)) return [['1'], ['2', '3', '4'], ['5']]
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
          if (finalStates[i] === 0) { let start = i; let len = 0; while (i < finalStates.length && finalStates[i] === 0) { len++; i++ } if (len === 1) { let initLen = 0; let j = start; while (j >= 0 && initialStates[j] === 0) { initLen++; j-- } j = start + 1; while (j < initialStates.length && initialStates[j] === 0) { initLen++; j++ } if (initLen !== 1) violations.push(`${row}${section[start]}`) } } else i++
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

const getYoutubeVideoId = (url) => {
  if (!url) return ''
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  if (match && match[2].length === 11) return match[2]
  if (url.includes('embed/')) {
    const parts = url.split('embed/')
    const id = parts[parts.length - 1]?.split('?')[0]
    if (id && id.length === 11) return id
  }
  return ''
}

function getRatingBadge(rating) {
  if (!rating) return null
  const colorMap = { 'K': '#10b981', 'T13': '#f59e0b', 'T16': '#f97316', 'T18': '#ef4444' }
  const bgColor = colorMap[rating] || '#6b7280'
  return (
    <span className="px-2 py-0.5 rounded text-xs font-black border" style={{ background: `${bgColor}22`, borderColor: bgColor, color: bgColor }}>
      {rating}
    </span>
  )
}

// ── Skeleton components ──
function MovieDetailSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
        <div className="absolute bottom-0 w-full left-0 px-6 md:px-12 pb-10 z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-end">
            <div className="hidden md:block w-44 lg:w-52 flex-shrink-0 aspect-[2/3] rounded-xl bg-white/10 animate-pulse" />
            <div className="flex flex-col gap-4 flex-1 w-full">
              <div className="h-12 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-1/2 bg-white/5 rounded animate-pulse" />
              <div className="h-12 w-40 bg-white/10 rounded-full animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </section>
      {/* Content skeleton */}
      <section className="max-w-6xl mx-auto px-4 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </section>
    </>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <CloudOff size={48} className="mb-4" style={{ color: 'var(--color-primary)' }} />
      <h2 className="text-xl font-bold text-white mb-2">Không tải được thông tin phim</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-md">{message || 'Vui lòng kiểm tra kết nối và thử lại.'}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button onClick={onRetry} className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider border cursor-pointer" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}>Thử lại</button>
        )}
        <Link to="/movies" className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white cursor-pointer border-none" style={{ background: 'var(--color-primary)' }}>Xem phim khác</Link>
      </div>
    </div>
  )
}

const DetailThreeBackground = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.08)
    scene.add(ambientLight)

    // Orbiting point lights for gradient flows
    const redLight = new THREE.PointLight(0xe50914, 3.5, 12)
    redLight.position.set(-2, 1, 1.5)
    scene.add(redLight)

    const blueLight = new THREE.PointLight(0x00d2ff, 1.5, 10)
    blueLight.position.set(2, -1, 1.5)
    scene.add(blueLight)

    const darkRedLight = new THREE.PointLight(0xb3070f, 3.0, 10)
    darkRedLight.position.set(0, 2, 1.0)
    scene.add(darkRedLight)

    // Flat reflective background mesh
    const wallGeo = new THREE.PlaneGeometry(60, 40)
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: 0x06080f,
      roughness: 0.7,
      metalness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.5,
    })
    const wall = new THREE.Mesh(wallGeo, wallMat)
    wall.position.z = -2
    scene.add(wall)

    let animId
    let time = 0

    const tick = () => {
      time += 0.007

      // Move point lights in slow organic orbits
      redLight.position.x = Math.sin(time * 0.4) * 3.5
      redLight.position.y = Math.cos(time * 0.3) * 2.0
      blueLight.position.x = -Math.sin(time * 0.5) * 3.5
      blueLight.position.y = -Math.cos(time * 0.4) * 2.0
      darkRedLight.position.x = Math.cos(time * 0.35) * 2.0
      darkRedLight.position.y = Math.sin(time * 0.45) * 1.5

      renderer.render(scene, camera)
      animId = requestAnimationFrame(tick)
    }

    tick()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none bg-[#06080F]" />
}

export default function MovieDetailPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const bookingSectionRef = useRef(null)

  // Back button config
  const [backInfo, setBackInfo] = useState({ label: 'Quay lại trang chủ', target: '/home' })

  useEffect(() => {
    const prevPath = sessionStorage.getItem('prevPath')
    if (prevPath) {
      const prevPathname = prevPath.split('?')[0]
      if (prevPathname === '/movies') {
        setBackInfo({ label: 'Quay lại trang phim', target: prevPath })
      } else if (prevPathname === '/home' || prevPathname === '/') {
        setBackInfo({ label: 'Quay lại trang chủ', target: prevPath })
      } else if (prevPathname === '/showtimes') {
        setBackInfo({ label: 'Quay lại lịch chiếu', target: prevPath })
      } else {
        setBackInfo({ label: 'Quay lại trang chủ', target: '/home' })
      }
    } else {
      setBackInfo({ label: 'Quay lại trang phim', target: '/movies' })
    }
  }, [location.pathname])

  const handleBack = () => navigate(backInfo.target)

  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  const queryDate = searchParams.get('date')
  const queryTime = searchParams.get('time')

  // Booking states
  const [isBookingMode, setIsBookingMode] = useState((queryDate && queryTime) ? true : false)
  const [bookingStep, setBookingStep] = useState((queryDate && queryTime) ? 2 : 1)
  const [selectedDate, setSelectedDate] = useState(queryDate || DAYS[0].date)
  const [selectedTime, setSelectedTime] = useState(queryTime || '')
  const [selectedShowtime, setSelectedShowtime] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedCombos, setSelectedCombos] = useState({ 1: 0, 2: 0, 3: 0 })
  const [dbCombos, setDbCombos] = useState([])   // combos từ API, fallback FALLBACK_COMBOS nếu rỗng
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)

  // Sync state with query parameters
  useEffect(() => {
    const qDate = searchParams.get('date')
    const qTime = searchParams.get('time')
    if (qDate && qTime) {
      setSelectedDate(qDate)
      setSelectedTime(qTime)
      setBookingStep(2)
      setIsBookingMode(true)
    }
  }, [searchParams])

  // Fetch showtimes if query parameters are present to set selectedShowtime
  useEffect(() => {
    const qDate = searchParams.get('date')
    const qTime = searchParams.get('time')
    const qRoomId = searchParams.get('roomId')
    if (movieId && qDate && qTime) {
      showtimeService.getByMovie(movieId, qDate)
        .then(list => {
          const showtimes = list || []
          const matched = showtimes.find(st => {
            if (!st.startTime) return false
            const time = st.startTime.split('T')[1]?.substring(0, 5)
            const matchesTime = time === qTime
            const matchesRoom = qRoomId ? String(st.roomId) === String(qRoomId) : true
            return matchesTime && matchesRoom && isPublicShowtimeStatus(st.status)
          }) || showtimes.find(st => {
            if (!st.startTime) return false
            const time = st.startTime.split('T')[1]?.substring(0, 5)
            return time === qTime && isPublicShowtimeStatus(st.status)
          })
          if (matched) {
            setSelectedShowtime(matched)
          }
        })
        .catch(err => {
          console.error('Failed to pre-fetch showtime from query params:', err)
        })
    }
  }, [movieId, searchParams])

  // Scroll to booking section when page finishes loading if queries are present
  useEffect(() => {
    const qDate = searchParams.get('date')
    const qTime = searchParams.get('time')
    if (!loading && qDate && qTime) {
      const timer = setTimeout(() => {
        const element = document.getElementById('booking-section')
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loading, searchParams])

  // Restore booking state after login redirection
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('pending_booking_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && String(parsed.movieId) === String(movieId) && user) {
          setSelectedDate(parsed.selectedDate)
          setSelectedTime(parsed.selectedTime)
          setSelectedSeats(parsed.selectedSeats)
          setBookingStep(parsed.bookingStep || 3)
        }
        sessionStorage.removeItem('pending_booking_state')
      }
    } catch (e) {
      console.error('Lỗi khi khôi phục trạng thái đặt vé', e)
    }
  }, [movieId, user])

  // Payment states
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

  // ── Fetch movie from API ──
  useEffect(() => {
    if (!movieId) { setLoading(false); return }
    let cancelled = false
    const fetchMovie = async () => {
      setLoading(true)
      setFetchError('')
      try {
        const res = await movieService.getById(movieId)
        if (cancelled) return
        const data = res.data
        if (!data) throw new Error('Không tìm thấy phim')
        setMovie(data)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch movie:', err)
        setFetchError(err.message || 'Không tải được thông tin phim.')
        setMovie(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMovie()
    return () => { cancelled = true }
  }, [movieId])

  // Tải danh sách bắp nước từ server (public /concessions/active)
  useEffect(() => {
    let cancelled = false
    concessionService.getActiveForUi({ fallback: true })
      .then(list => {
        if (cancelled) return
        const mapped = Array.isArray(list) && list.length > 0 ? list : FALLBACK_COMBOS
        setDbCombos(mapped)
        const initQty = {}
        mapped.forEach(c => { initQty[c.id] = 0 })
        setSelectedCombos(initQty)
      })
      .catch(err => console.error('Lỗi tải bắp nước:', err))
    return () => { cancelled = true }
  }, [])

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

  const violations = selectedSeats.length > 0 ? checkSingleEmptySeats(selectedSeats, OCCUPIED_SEATS) : []

  const ticketPrice = selectedSeats.reduce((sum, id) => sum + getSeatPrice(id), 0)
  const activeCombos = dbCombos.length > 0 ? dbCombos : FALLBACK_COMBOS
  const comboPrice = Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
    const combo = activeCombos.find(c => String(c.id) === String(id))
    return sum + (combo ? combo.price * qty : 0)
  }, 0)
  const totalPrice = ticketPrice + comboPrice

  const discountAmount = useMemo(() => {
    if (discount <= 0) return 0
    if (discount < 1) {
      return Math.round((ticketPrice + comboPrice) * discount)
    }
    return discount
  }, [discount, ticketPrice, comboPrice])

  const finalPrice = Math.max(0, ticketPrice + comboPrice - discountAmount)

  const onApplyPromo = (code, val) => {
    setPromoCode(code)
    setDiscount(val)
  }

  const onChangeCombo = (id, change) => {
    setSelectedCombos(prev => ({
      ...prev,
      [id]: Math.max(0, prev[id] + change)
    }))
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
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) errors.expiryDate = 'Ngay het han khong dung dinh dang MM/YY.'
      else {
        const [month, year] = expiryDate.split('/').map(Number)
        if (year < 26 || (year === 26 && month < 6)) errors.expiryDate = 'The da het han su dung.'
      }
      if (cvv.length !== 3) errors.cvv = 'Ma bao mat CVV/CVC phai chua dung 3 chu so.'
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
      setSubmitting(false)
      setProcessingStep('')
      const msgs = { fail_funds: 'Số dư tài khoản không đủ để thực hiện giao dịch.', fail_cvv: 'Mã bảo mật CVV/CVC không hợp lệ.', fail_expired: 'Thẻ đã hết hạn sử dụng hoặc bị khóa.', fail_timeout: 'Hết thời gian kết nối với cổng thanh toán ngân hàng.' }
      setSubmitError('Thanh toán thất bại: ' + (msgs[simulatedOutcome] || 'Lỗi không xác định.'))
      return
    }
    const payload = {
      bookingId, movieId, movieName: movie.title, showTime: selectedTime, showDate: selectedDate,
      seats: selectedSeats, totalPrice: finalPrice, room: 'Phong Chieu 03 (IMAX)',
      fullName: user?.fullName || 'Thanh vien CineMate', email: user?.email || '',
      identityCard: 'Chua cap nhat', phoneNumber: 'Chua cap nhat'
    }
    try { await bookingService.create(payload) } catch (err) { console.warn('Backend offline, saving locally.', err) }
    finally {
      const localBookings = JSON.parse(localStorage.getItem('staff_bookings_db') || '[]')
      localStorage.setItem('staff_bookings_db', JSON.stringify([{
        id: bookingId, movie: movie.title, screen: 'Phong Chieu 03 (IMAX)',
        date: new Date(selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: selectedTime, seats: selectedSeats.join(', '), price: getSeatPrice(selectedSeats[0] || 'A1'),
        total: finalPrice, convertTickets: 0, scoreUsed: 0,
        memberId: 'MEM-' + Math.floor(100000 + Math.random() * 900000),
        customerName: user?.fullName || 'Thanh vien CineMate', phone: '0123456789',
        email: user?.email || '', idCard: '012345678901', status: 'Da thanh toan',
        checkedIn: false, checkInTime: null
      }, ...localBookings]))
      setBookingSuccess(true)
      setSubmitting(false)
    }
  }

  const handleCloseSuccessModal = () => {
    setBookingSuccess(false)
    setBookingStep(1)
    setBookingId('')
    setSelectedSeats([])
    const initQty = {}
    activeCombos.forEach(c => { initQty[c.id] = 0 })
    setSelectedCombos(initQty)
    navigate('/')
  }

  const handleDateChange = () => {
    setSelectedShowtime(null)
    setSelectedTime('')
  }

  const handleShowtimeSelect = (st) => {
    setSelectedShowtime(st)
  }

  const handleBookAnother = () => {
    setBookingSuccess(false)
    setBookingStep(1)
    setSelectedTime('')
    setSelectedSeats([])
    const initQty = {}
    activeCombos.forEach(c => { initQty[c.id] = 0 })
    setSelectedCombos(initQty)
    setSelectedShowtime(null)
    setBookingId('')
    setCardNumber('')
    setCardHolder('')
    setExpiryDate('')
  }

  // ── Loading skeleton ──
  if (loading) {
    return <MovieDetailSkeleton />
  }

  // ── Error state ──
  if (fetchError || !movie) {
    return <ErrorState message={fetchError} onRetry={() => { setLoading(true); setFetchError('') }} />
  }

  return (
    <div className="relative min-h-screen text-white bg-[#06080F] overflow-x-hidden selection:bg-red-900 selection:text-white pb-16">
      {/* Permanent Red-Black WebGL Background */}
      <DetailThreeBackground />

      {/* Main Switchable Detail / Booking Layout */}
      {!isBookingMode && (
        <motion.div
          key="detail-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full min-h-screen flex flex-col justify-between"
        >
          {/* ── Hero Section ── */}
          <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-black/40">
            {/* Background YouTube Trailer Video */}
            {movie.trailerUrl && (
              <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none select-none opacity-30">
                <iframe
                  title={`${movie.title} Background Trailer`}
                  src={`${getEmbedUrl(movie.trailerUrl)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYoutubeVideoId(movie.trailerUrl)}&showinfo=0&rel=0&playsinline=1`}
                  className="absolute top-1/2 left-1/2 w-[120vw] h-[120vh] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ border: 'none', objectFit: 'cover' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}
            <div className="absolute inset-0 z-10 hero-gradient" />

            {/* Back Button */}
            <div className="absolute top-6 left-6 md:left-12 z-30">
              <motion.button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10 active:scale-95 cursor-pointer border border-white/20 text-white bg-black/40 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={14} className="text-red-500 font-bold" />
                <span>{backInfo.label}</span>
              </motion.button>
            </div>

            <div className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12 py-20 flex flex-col md:flex-row gap-10 items-center md:items-end text-left">
              {/* Animated Shared Poster */}
              <motion.div
                layoutId="hero-poster"
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                className="w-48 sm:w-56 md:w-64 flex-shrink-0 z-30 relative group"
              >
                <img
                  src={movie.poster}
                  alt={`${movie.title} poster`}
                  className="w-full rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 hover:scale-[1.02] transition-transform duration-300"
                  style={{ aspectRatio: '2/3', objectFit: 'cover' }}
                />
                <div className="absolute inset-0 border border-white/10 pointer-events-none rounded-2xl" />
              </motion.div>

              {/* Movie info metadata */}
              <motion.div
                className="flex flex-col gap-4 text-left flex-grow max-w-2xl"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h1
                  className="text-white text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-wider leading-none text-glow-red"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {movie.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 font-medium">
                  {getRatingBadge(movie.rating)}
                  <span>•</span>
                  <span>{movie.duration} phút</span>
                  <span>•</span>
                  <span>{movie.genre}</span>
                  <span>•</span>
                  <span className="border border-white/15 px-2 py-0.5 rounded text-[10px] text-white bg-white/5">{movie.format}</span>
                </div>


                <div className="flex gap-4 mt-4 flex-wrap">
                  <motion.button
                    onClick={() => setIsBookingMode(true)}
                    className="flex items-center gap-2.5 py-3.5 px-10 rounded-full font-bold uppercase tracking-widest text-xs text-white cursor-pointer border-none"
                    style={{ background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)', boxShadow: '0 6px 20px rgba(229,9,20,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 28px rgba(229,9,20,0.55)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Ticket size={18} />
                    Đặt Vé Ngay
                  </motion.button>

                  {movie.trailerUrl && (
                    <motion.button
                      onClick={() => setIsTrailerOpen(true)}
                      className="flex items-center gap-2 py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/5 active:scale-95 cursor-pointer border border-white/20 text-white bg-black/40 backdrop-blur-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play size={16} className="text-red-500 fill-red-500" />
                      Xem Trailer
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Bottom details block: MovieInfo */}
          <section className="max-w-6xl w-full mx-auto px-6 md:px-12 py-12 border-t border-white/5 flex flex-col gap-10 relative z-20">
            <div className="text-left flex flex-col gap-4">
              <h2 className="text-lg font-black uppercase text-red-500 tracking-wider m-0" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Tóm Tắt Nội Dung
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed font-medium m-0">
                {movie.description || 'Không có mô tả chi tiết.'}
              </p>
            </div>

            {/* Display static MovieInfo card spanning full width */}
            <div className="w-full">
              <MovieInfo
                movie={movie}
                movieId={movieId}
                onShowtimeSelect={handleShowtimeSelect}
                onDateChange={handleDateChange}
                onTrailerClick={() => setIsTrailerOpen(true)}
              />
            </div>
          </section>
        </motion.div>
      )}

      {isBookingMode && (
        <motion.div
          key="booking-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 max-w-full mx-auto px-4 lg:px-12 py-24 min-h-screen grid grid-cols-1 lg:grid-cols-4 gap-8"
        >
          {/* Column 1: Poster & Summary info */}
          <div className="lg:col-span-1 flex flex-col gap-5 text-left">
            <button
              onClick={() => {
                setIsBookingMode(false)
                setBookingStep(1)
              }}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none py-2"
            >
              <ArrowLeft size={16} /> Quay lại chi tiết
            </button>

            {/* Poster shared element */}
            <motion.div
              layoutId="hero-poster"
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10"
            >
              <img src={movie.poster} alt={movie.title} className="w-full h-auto object-cover" />
            </motion.div>
          </div>

          {/* Column 2 & 3: Stepper & Step Panels */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Stepper Progress */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 select-none">
              {[
                { step: 1, label: 'Lịch chiếu', icon: <CalendarDays size={16} /> },
                { step: 2, label: 'Chọn ghế', icon: <Armchair size={16} /> },
                { step: 3, label: 'Bắp nước', icon: <Ticket size={16} /> },
                { step: 4, label: 'Thanh toán', icon: <CreditCard size={16} /> },
              ].map(({ step, label, icon }, idx) => (
                <div key={step} className="flex items-center flex-1 last:flex-initial">
                  <button
                    onClick={() => {
                      if (bookingStep > step) setBookingStep(step)
                    }}
                    className={`flex flex-col items-center gap-1.5 flex-1 ${bookingStep > step ? 'cursor-pointer' : 'cursor-default'} bg-transparent border-none`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${bookingStep > step ? 'text-green-500 border-green-500 bg-green-500/5' : bookingStep === step ? 'text-red-500 border-red-500 bg-red-500/5 shadow-[0_0_8px_rgba(229,9,20,0.4)]' : 'text-gray-600 border-gray-800'}`}>
                      {bookingStep > step ? <Check size={14} className="font-black" /> : icon}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${bookingStep > step ? 'text-green-500' : bookingStep === step ? 'text-red-500' : 'text-gray-600'}`}>{label}</span>
                  </button>
                  {idx < 3 && <div className="h-[2px] flex-grow mx-2" style={{ background: bookingStep > idx + 1 ? '#10b981' : '#1f2937', transition: 'background 0.4s' }} />}
                </div>
              ))}
            </div>

            {/* Step Panels Container with AnimatePresence */}
            <div className={`bg-white/5 border border-white/10 rounded-2xl min-h-[460px] relative overflow-hidden flex flex-col justify-between ${bookingStep === 2 ? 'p-2 sm:p-4' : 'p-6'}`}>
              <AnimatePresence mode="wait">
                {bookingStep === 1 && (
                  <ShowtimeStep
                    key="step-1"
                    DAYS={DAYS}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                    schedules={getMovieSchedules()}
                    setBookingStep={setBookingStep}
                    movie={movie}
                    movieId={movieId}
                    onShowtimeSelect={handleShowtimeSelect}
                    onDateChange={handleDateChange}
                  />
                )}
                {bookingStep === 2 && (
                  <SeatStep
                    key="step-2"
                    movie={movie}
                    selectedTime={selectedTime}
                    selectedDate={selectedDate}
                    totalPrice={ticketPrice}
                    selectedSeats={selectedSeats}
                    violations={violations}
                    toggleSeat={toggleSeat}
                    setBookingStep={setBookingStep}
                    selectedShowtime={selectedShowtime}
                    SEAT_ROWS={SEAT_ROWS}
                    user={user}
                    navigate={navigate}
                    movieId={movieId}
                    location={location}
                  />
                )}
                {bookingStep === 3 && (
                  <ComboStep
                    key="step-3"
                    combos={activeCombos}
                    selectedCombos={selectedCombos}
                    onChangeCombo={onChangeCombo}
                    promoCode={promoCode}
                    setPromoCode={setPromoCode}
                    discount={discount}
                    onApplyPromo={onApplyPromo}
                    setBookingStep={setBookingStep}
                    orderAmount={ticketPrice + comboPrice}
                  />
                )}
                {bookingStep === 4 && (
                  <PaymentStep
                    key="step-4"
                    movie={movie}
                    bookingId={bookingId}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    selectedSeats={selectedSeats}
                    totalPrice={finalPrice}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    cardNumber={cardNumber}
                    handleCardNumberChange={handleCardNumberChange}
                    cardHolder={cardHolder}
                    handleCardHolderChange={handleCardHolderChange}
                    expiryDate={expiryDate}
                    handleExpiryChange={handleExpiryChange}
                    cvv={cvv}
                    handleCvvChange={handleCvvChange}
                    valErrors={valErrors}
                    submitting={submitting}
                    processingStep={processingStep}
                    submitError={submitError}
                    setSubmitError={setSubmitError}
                    simulatedOutcome={simulatedOutcome}
                    setSimulatedOutcome={setSimulatedOutcome}
                    handleSubmitPayment={handleSubmitPayment}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 4: Sticky real-time invoice panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white/5 border border-white/10 rounded-2xl p-6 text-left flex flex-col gap-5 backdrop-blur-md">
              <h3 className="text-xs font-black uppercase text-red-500 tracking-widest border-b border-white/5 pb-3 m-0">Vé Của Bạn</h3>

              {/* Showtime info */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Suất Chiếu</span>
                <span className="text-sm font-bold text-white uppercase">{selectedDate ? new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }) : 'Chưa chọn'}</span>
                <span className="text-xs text-gray-400 font-semibold">{selectedTime ? `Giờ chiếu: ${selectedTime} tại Phòng IMAX` : 'Chưa chọn giờ chiếu'}</span>
              </div>

              {/* Seats info */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Ghế Ngồi</span>
                {selectedSeats.length > 0 ? (
                  <>
                    <span className="text-sm font-bold text-white">{selectedSeats.join(', ')}</span>
                    <span className="text-xs text-gray-400 font-semibold">Tạm tính: {ticketPrice.toLocaleString('vi-VN')} đ</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">Chưa chọn ghế</span>
                )}
              </div>

              {/* Combos info */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Bắp Nước (Combo)</span>
                {Object.values(selectedCombos).some(qty => qty > 0) ? (
                  <div className="flex flex-col gap-1">
                    {activeCombos.map(c => {
                      const qty = selectedCombos[c.id] || 0
                      if (qty === 0) return null
                      return (
                        <div key={c.id} className="flex justify-between items-center text-xs text-white">
                          <span>{c.name} x {qty}</span>
                          <span className="text-gray-400">{(c.price * qty).toLocaleString('vi-VN')} đ</span>
                        </div>
                      )
                    })}
                    <span className="text-xs text-gray-400 font-semibold mt-1">Tạm tính: {comboPrice.toLocaleString('vi-VN')} đ</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">Chưa chọn bắp nước</span>
                )}
              </div>

              {/* Promo code & Discount info */}
              {discount > 0 && (
                <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Mã Giảm Giá</span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-green-500 font-bold">{promoCode}</span>
                    <span className="text-green-500 font-bold">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="border-t border-white/5 pt-4 flex justify-between items-end">
                <span className="text-xs font-black uppercase text-white tracking-wider">Tổng cộng</span>
                <span className="text-2xl font-black text-red-500 leading-none">{finalPrice.toLocaleString('vi-VN')} đ</span>
              </div>

              {/* Action buttons based on active step */}
              <div className="mt-2">
                {bookingStep === 1 && (
                  <button
                    onClick={() => setBookingStep(2)}
                    disabled={!selectedTime}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer border-none transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(229,9,20,0.3)]"
                  >
                    Tiếp tục chọn ghế
                  </button>
                )}
                {bookingStep === 2 && (
                  <button
                    onClick={() => setBookingStep(3)}
                    disabled={selectedSeats.length === 0 || violations.length > 0}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer border-none transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(229,9,20,0.3)]"
                  >
                    Tiếp tục chọn combo
                  </button>
                )}
                {bookingStep === 3 && (
                  <button
                    onClick={() => setBookingStep(4)}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer border-none transition-all shadow-[0_4px_14px_rgba(229,9,20,0.3)]"
                  >
                    Tiếp tục thanh toán
                  </button>
                )}
                {bookingStep === 4 && (
                  <button
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer border-none transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(229,9,20,0.3)]"
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Booking Success Modal ── */}
      <AnimatePresence>
        {bookingSuccess && (
          <SuccessModal
            bookingSuccess={bookingSuccess}
            movie={movie}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedSeats={selectedSeats}
            totalPrice={finalPrice}
            bookingId={bookingId}
            onClose={handleCloseSuccessModal}
            onBookAnother={handleBookAnother}
            navigate={navigate}
          />
        )}
      </AnimatePresence>

      {/* ── YouTube Trailer Modal ── */}
      <AnimatePresence>
        {isTrailerOpen && (
          <TrailerModal
            isTrailerOpen={isTrailerOpen}
            onClose={() => setIsTrailerOpen(false)}
            movie={movie}
          />
        )}
      </AnimatePresence>

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
          padding-top: 130px;
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
    </div>
  )
}
