import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { movieService } from '../../services/movieService'
import {
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  X,
  Menu,
  Clapperboard,
  CheckCheck,
  Ticket,
  Tag,
} from 'lucide-react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react'
import gsap from 'gsap'
import * as THREE from 'three'
import logoImg from '../../assets/Cinematelogo.png'
import { bookingService } from '../../services/bookingService'
import { promotionService, getQuickDiscountText } from '../../services/promotionService'

function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Vừa xong'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'Vừa xong'
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)
  if (diffSec < 60) return 'Vừa xong'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ trước`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

const NAVBAR_HEIGHT = 72
const NAVBAR_SCROLL_THRESHOLD = 60

const ROLE_BADGES = {
  ADMIN: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  MANAGER: { label: 'Manager', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  STAFF: { label: 'Staff', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  MEMBER: { label: 'Member', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

const NAV_ITEMS = [
  { route: '/movies', label: 'Phim' },
  { route: '/showtimes', label: 'Lịch Chiếu' },
  { route: '/cinemas', label: 'Rạp Chiếu' },
  { route: '/promotions', label: 'Ưu Đãi' },
  { route: '/about', label: 'Giới Thiệu' },
]

function NavItem({ route, label, index }) {
  const linkRef = useRef(null)

  const handleMouseEnter = () => {
    gsap.to(linkRef.current, {
      scale: 1.05,
      textShadow: '0 0 8px rgba(229,9,20,0.6)',
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  const handleMouseLeave = () => {
    gsap.to(linkRef.current, {
      scale: 1.0,
      textShadow: '0 0 0px rgba(229,9,20,0)',
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
    >
      <NavLink
        ref={linkRef}
        to={route}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={({ isActive }) =>
          `relative inline-block px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-200 ${
            isActive ? 'text-white hover:text-[#e50914]' : 'text-white/50 hover:text-[#e50914]'
          }`
        }
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {({ isActive }) => (
          <>
            {label}
          </>
        )}
      </NavLink>
    </motion.div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)
  const searchRef = useRef(null)

  const scrollY = useMotionValue(0)
  const navbarBg = useTransform(
    scrollY,
    [0, NAVBAR_SCROLL_THRESHOLD],
    ['rgba(7,7,7,0)', 'rgba(7,7,7,0.85)']
  )
  const navbarBlur = useTransform(scrollY, [0, NAVBAR_SCROLL_THRESHOLD], ['0px', '16px'])
  const navbarHeight = useTransform(scrollY, [0, NAVBAR_SCROLL_THRESHOLD], [NAVBAR_HEIGHT, 64])
  const borderOpacity = useTransform(scrollY, [0, NAVBAR_SCROLL_THRESHOLD], [0, 1])

  useEffect(() => {
    const handleScroll = () => scrollY.set(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollY])

  useEffect(() => {
    if (searchTerm.trim().length >= 1) {
      const timer = setTimeout(() => {
        movieService.getAll({ search: searchTerm.trim(), size: 6 })
          .then((res) => {
            const list = res.data || []
            setSuggestions(
              list.map((m) => ({
                id: m.id,
                title: m.titleVn || m.titleEn || 'Phim',
                route: `/movies/${m.id}`,
              }))
            )
            setSuggestionsOpen(true)
          })
          .catch(() => setSuggestions([]))
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setSuggestionsOpen(false)
    }
  }, [searchTerm])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
      if (notificationRef.current && !notificationRef.current.contains(e.target))
        setNotificationsOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSuggestionsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      gsap.fromTo(
        '.mobile-link',
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.06, duration: 0.45, ease: 'power3.out', delay: 0.1 }
      )
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const handleLogout = useCallback(() => {
    logout()
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    navigate('/login')
  }, [logout, navigate])

  const [notifications, setNotifications] = useState([])
  const [readNotifIds, setReadNotifIds] = useState([])

  useEffect(() => {
    try {
      const key = `read_notifs_${user?.id || 'guest'}`
      const saved = localStorage.getItem(key)
      setReadNotifIds(saved ? JSON.parse(saved) : [])
    } catch {
      setReadNotifIds([])
    }
  }, [user?.id])

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }

    const list = []

    // 1. Fetch user bookings
    try {
      const resBooking = await bookingService.getMyBookings()
      const rawBookings = resBooking.data?.result || resBooking.data || []
      if (Array.isArray(rawBookings)) {
        rawBookings.forEach((b) => {
          const seatsStr = Array.isArray(b.seatNames) ? b.seatNames.join(', ') : (b.seatNames || '')
          const amountFormatted = b.totalAmount != null
            ? new Intl.NumberFormat('vi-VN').format(b.totalAmount) + 'đ'
            : ''
          const showInfo = [b.date, b.showtime].filter(Boolean).join(' - ')

          if (b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'CHECKED_IN') {
            list.push({
              id: `booking-success-${b.id}`,
              title: 'Vé đặt thành công 🎉',
              message: `Vé xem phim "${b.movieName || 'Phim'}" (${showInfo}${seatsStr ? `, Ghế: ${seatsStr}` : ''})${amountFormatted ? `. Tổng: ${amountFormatted}` : ''}.`,
              timeRaw: b.createdAt,
              type: 'BOOKING_SUCCESS',
              route: '/profile',
            })
          } else if (b.status === 'CANCELLED') {
            list.push({
              id: `booking-cancel-${b.id}`,
              title: 'Vé đã bị hủy ❌',
              message: `Đơn đặt vé phim "${b.movieName || 'Phim'}" (${showInfo}) đã được hủy.`,
              timeRaw: b.createdAt,
              type: 'BOOKING_CANCELLED',
              route: '/profile',
            })
          } else if (b.status === 'HELD' || b.status === 'PENDING') {
            list.push({
              id: `booking-held-${b.id}`,
              title: 'Đang giữ ghế ⏳',
              message: `Đơn giữ ghế phim "${b.movieName || 'Phim'}" (${showInfo}). Vui lòng hoàn tất thanh toán.`,
              timeRaw: b.createdAt,
              type: 'BOOKING_HELD',
              route: `/checkout?bookingId=${b.id}`,
            })
          }
        })
      }
    } catch (err) {
      console.error('Không thể tải vé cho thông báo:', err)
    }

    // 2. Fetch active promotions
    try {
      const activePromos = await promotionService.getActiveForUi()
      if (Array.isArray(activePromos)) {
        activePromos.slice(0, 5).forEach((p) => {
          const discountText = getQuickDiscountText(p)
          list.push({
            id: `promo-${p.id || p.code}`,
            title: `Khuyến mãi: ${p.code || 'Mới'} 🎁`,
            message: `${p.title || 'Ưu đãi hot'}${discountText ? ` (${discountText})` : ''}: ${p.description || p.detail || 'Nhập mã để nhận ưu đãi!'}`,
            timeRaw: p.startTime || p.createdAt,
            type: 'PROMOTION',
            route: '/promotions',
          })
        })
      }
    } catch (err) {
      console.error('Không thể tải khuyến mãi cho thông báo:', err)
    }

    list.sort((a, b) => new Date(b.timeRaw || 0) - new Date(a.timeRaw || 0))
    setNotifications(list)
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    const handleBookingUpdate = () => fetchNotifications()
    window.addEventListener('bookingUpdated', handleBookingUpdate)
    return () => {
      clearInterval(interval)
      window.removeEventListener('bookingUpdated', handleBookingUpdate)
    }
  }, [fetchNotifications])

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadNotifIds(allIds)
    try {
      localStorage.setItem(`read_notifs_${user?.id || 'guest'}`, JSON.stringify(allIds))
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotificationClick = (n) => {
    if (!readNotifIds.includes(n.id)) {
      const updated = [...readNotifIds, n.id]
      setReadNotifIds(updated)
      try {
        localStorage.setItem(`read_notifs_${user?.id || 'guest'}`, JSON.stringify(updated))
      } catch (e) {
        console.error(e)
      }
    }
    setNotificationsOpen(false)
    if (n.route) {
      if (n.route === '/profile') {
        navigate('/profile', { state: { activeTab: n.tab || 'booked' } })
      } else {
        navigate(n.route)
      }
    }
  }

  const unreadCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length

  return (
    <>
      <motion.nav
        initial={{ height: NAVBAR_HEIGHT }}
        style={{
          backgroundColor: 'transparent',
          height: navbarHeight,
        }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex items-center"
      >
        {/* Bottom border with red glow on scroll */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            opacity: borderOpacity,
            background: 'linear-gradient(90deg, transparent, rgba(229,9,20,0.4), transparent)',
          }}
        />

        <div
          className="w-full mx-auto flex items-center justify-between h-full relative"
          style={{ paddingLeft: '32px', paddingRight: '32px' }}
        >
          {/* ── LOGO ── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group z-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <img
                src={logoImg}
                alt="CineMate"
                className="w-10 h-10 object-contain relative z-10"
              />
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(circle, rgba(229,9,20,0.3), transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
            </motion.div>
            <motion.div
              className="text-lg font-black tracking-tight"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-white">Cine</span>
              <span className="text-[#e50914]">mate</span>
            </motion.div>
          </Link>

          {/* ── DESKTOP NAV FLOATING ISLAND ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center h-[48px] px-2 rounded-full overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(24px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >


            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_ITEMS.map((item, i) => (
                <NavItem key={item.route} route={item.route} label={item.label} index={i} />
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT SECTION ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search */}
            <div className="hidden md:block relative" ref={searchRef}>
              <AnimatePresence mode="wait">
                {searchTerm !== '' ? (
                  <motion.div
                    key="search-active"
                    initial={{ width: 40, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 40, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative"
                  >
                    <input
                      type="text"
                      placeholder="Tìm phim..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`)
                          setSearchTerm('')
                          setSuggestionsOpen(false)
                        } else if (e.key === 'Escape') {
                          setSearchTerm('')
                          setSuggestionsOpen(false)
                        }
                      }}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-2 px-3 pl-9 text-xs text-white outline-none transition-all focus:border-[#e50914] focus:shadow-[0_0_0_3px_rgba(229,9,20,0.1)]"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      autoFocus
                    />
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                    <button
                      onClick={() => { setSearchTerm(''); setSuggestionsOpen(false) }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchTerm(' ')}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    <Search size={16} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {suggestionsOpen && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-50"
                    style={{
                      background: 'rgba(17,17,17,0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div
                      className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b border-white/5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Gợi ý tìm kiếm
                    </div>
                    {suggestions.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setSearchTerm('')
                          setSuggestionsOpen(false)
                          navigate(movie.route)
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors border-none outline-none bg-transparent cursor-pointer"
                      >
                        {movie.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notificationRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen)
                    setDropdownOpen(false)
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors hover:bg-white/5"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                  title="Thông báo"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#e50914] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#070707] shadow-sm shadow-red-500/50"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-84 sm:w-96 rounded-xl overflow-hidden z-50"
                      style={{
                        background: 'rgba(17,17,17,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div className="px-4 py-3 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                            Thông báo
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30">
                              {unreadCount} chưa đọc
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-semibold text-[#e50914] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                          >
                            <CheckCheck size={12} />
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-8 px-4 text-center">
                            <Bell size={24} className="mx-auto mb-2 text-white/20" />
                            <p className="text-xs text-white/40 font-medium">Chưa có thông báo nào</p>
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const isRead = readNotifIds.includes(n.id)
                            let IconComponent = Bell
                            let iconColor = 'text-blue-400 bg-blue-500/10'

                            if (n.type === 'BOOKING_SUCCESS') {
                              IconComponent = Ticket
                              iconColor = 'text-emerald-400 bg-emerald-500/10'
                            } else if (n.type === 'BOOKING_CANCELLED') {
                              IconComponent = X
                              iconColor = 'text-red-400 bg-red-500/10'
                            } else if (n.type === 'BOOKING_HELD') {
                              IconComponent = Ticket
                              iconColor = 'text-amber-400 bg-amber-500/10'
                            } else if (n.type === 'PROMOTION') {
                              IconComponent = Tag
                              iconColor = 'text-purple-400 bg-purple-500/10'
                            }

                            return (
                              <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-all flex items-start gap-3 ${
                                  !isRead ? 'bg-[#e50914]/[0.06] hover:bg-[#e50914]/[0.1]' : 'hover:bg-white/[0.04] opacity-80 hover:opacity-100'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                                  <IconComponent size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1 gap-2">
                                    <span className={`text-xs font-bold truncate ${!isRead ? 'text-white' : 'text-white/80'}`}>
                                      {n.title}
                                    </span>
                                    <span className="text-[10px] text-white/30 shrink-0">{formatRelativeTime(n.timeRaw)}</span>
                                  </div>
                                  <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">{n.message}</p>
                                </div>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#e50914] shrink-0 mt-1 shadow-sm shadow-red-500/50" />
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User menu or Login button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen)
                    setNotificationsOpen(false)
                  }}
                  className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08] transition-all duration-200"
                >
                  <motion.div
                    className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                    animate={{
                      borderColor: dropdownOpen ? '#e50914' : 'rgba(255,255,255,0.12)',
                      boxShadow: dropdownOpen ? '0 0 14px rgba(229,9,20,0.35)' : 'none',
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(229,9,20,0.25), #8b0000)',
                      border: '2px solid',
                    }}
                  >
                    {user.image ? (
                      <img src={user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="text-white font-extrabold text-xs"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {(user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </motion.div>
                  <motion.span
                    animate={{ rotate: dropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden z-50"
                      style={{
                        background: 'rgba(17,17,17,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      }}
                    >
                      {/* User info */}
                      <div
                        className="px-4 py-3 flex items-center gap-3 border-b border-white/5"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #e50914, #8b0000)',
                            border: '2px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {user.image ? (
                            <img src={user.image} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span
                              className="text-white font-extrabold text-sm"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              {(user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-white text-sm font-semibold truncate"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {user.fullName || 'Người dùng'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const role = user.roles?.[0] || 'MEMBER'
                              const badge = ROLE_BADGES[role] || ROLE_BADGES.MEMBER
                              return (
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${badge}`}
                                >
                                  {badge.label}
                                </span>
                              )
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <motion.div
                        className="py-1.5"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: {},
                          visible: {
                            transition: { staggerChildren: 0.04, delayChildren: 0.05 },
                          },
                        }}
                      >
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, x: -8 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
                          }}
                        >
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}
                          >
                            <User size={15} />
                            Thông tin cá nhân
                          </Link>
                        </motion.div>
                        {(user.roles?.includes('ADMIN') ||
                          user.roles?.includes('MANAGER') ||
                          user.roles?.includes('STAFF')) && (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -8 },
                              visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
                            }}
                          >
                            <Link
                              to={
                                user.roles.includes('ADMIN')
                                  ? '/admin'
                                  : user.roles.includes('MANAGER')
                                  ? '/manager'
                                  : '/staff'
                              }
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                              style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}
                            >
                              <Settings size={15} />
                              Trang quản trị
                            </Link>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Logout */}
                      <div className="border-t border-white/5 py-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full hover:bg-red-500/10"
                          style={{ color: '#ef4444', fontFamily: 'Inter, sans-serif' }}
                        >
                          <LogOut size={15} />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 py-2 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #e50914, #b3070f)',
                  color: '#ffffff',
                  fontFamily: 'Montserrat, sans-serif',
                  boxShadow: '0 4px 16px rgba(229,9,20,0.3)',
                }}
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── MOBILE MENU OVERLAY ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: 'rgba(7,7,7,0.98)', paddingTop: '80px' }}
          >
            <div className="flex justify-end p-5">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col px-7 py-4 space-y-1">
              {NAV_ITEMS.map((item, index) => (
                <motion.div
                  key={item.to}
                  className="mobile-link"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <NavLink
                    to={item.route}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block py-4 text-lg font-bold transition-colors border-b border-white/[0.04] ${
                        isActive ? 'text-[#e50914]' : 'text-white/70 hover:text-white'
                      }`
                    }
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}

              {/* Mobile search */}
              <motion.div
                className="mobile-link mt-6"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm phim..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3.5 px-4 pl-11 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#e50914] transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </div>
              </motion.div>

              {/* Mobile user section */}
              <motion.div
                className="mobile-link mt-8 pt-6 border-t border-white/[0.06]"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #e50914, #8b0000)' }}
                      >
                        {user.image ? (
                          <img src={user.image} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span
                            className="text-white font-extrabold text-lg"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            {(user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {user.fullName || user.email?.split('@')[0]}
                        </p>
                        <span className="text-xs text-white/40">{user.roles?.[0] || 'MEMBER'}</span>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3.5 px-4 rounded-xl bg-white/[0.04] text-white text-sm font-medium hover:bg-white/[0.08] transition-colors"
                    >
                      Thông tin cá nhân
                    </Link>
                    {(user.roles?.includes('ADMIN') ||
                      user.roles?.includes('MANAGER') ||
                      user.roles?.includes('STAFF')) && (
                      <Link
                        to={
                          user.roles.includes('ADMIN')
                            ? '/admin'
                            : user.roles.includes('MANAGER')
                            ? '/manager'
                            : '/staff'
                        }
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-3.5 px-4 rounded-xl bg-white/[0.04] text-white text-sm font-medium hover:bg-white/[0.08] transition-colors"
                      >
                        Trang quản trị
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full py-3.5 px-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium text-left hover:bg-red-500/20 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3.5 px-4 rounded-xl text-center font-bold text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #e50914, #b3070f)',
                      color: '#ffffff',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    Đăng nhập
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-link-custom {
          position: relative;
          padding: 6px 2px;
        }
        input::placeholder {
          color: rgba(255,255,255,0.3);
        }
      `}</style>
    </>
  )
}
