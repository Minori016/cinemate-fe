import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { movieService } from '../../services/movieService'
import { Search, LogOut, User as UserIcon, Settings, ChevronDown, Bell, X, Menu } from 'lucide-react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react'
import gsap from 'gsap'
import logoImg from '../../assets/Cinematelogo.png'

// Constants
const NAVBAR_HEIGHT = 72
const NAVBAR_SCROLL_THRESHOLD = 80

// Role badge config
const ROLE_BADGES = {
  ADMIN: { label: 'Admin', color: 'bg-purple-600', shadow: 'shadow-purple-500/30' },
  MANAGER: { label: 'Manager', color: 'bg-blue-600', shadow: 'shadow-blue-500/30' },
  STAFF: { label: 'Staff', color: 'bg-amber-600', shadow: 'shadow-amber-500/30' },
  MEMBER: { label: 'Member', color: 'bg-emerald-600', shadow: 'shadow-emerald-500/30' }
}

// Individual nav link item component
function NavItem({ route, label, index }) {
  const location = useLocation()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <NavLink
        to={route}
        className={({ isActive }) =>
          `nav-link-custom text-xs uppercase tracking-widest font-semibold transition-colors duration-200 relative ${
            isActive ? 'text-[#e50914]' : 'text-[rgba(255,255,255,0.7)] hover:text-white'
          }`
        }
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </NavLink>
    </motion.div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)

  // Notifications data
  const [notifications] = useState([
    { id: 1, title: 'Vé đặt thành công 🎟️', message: 'Mã đặt vé của bạn đã được xác nhận.', time: 'Vừa xong', read: false },
    { id: 2, title: 'Khuyến mãi hot 🔥', message: 'Giảm ngay 20% khi mua Combo Solo.', time: '1 giờ trước', read: false },
    { id: 3, title: 'Suất chiếu đặc biệt 🎬', message: 'Dune: Hành Tinh Cát - Phần 2 đã mở bán vé IMAX.', time: '1 ngày trước', read: true }
  ])

  // Scroll tracking with Lenis/motion
  const scrollY = useMotionValue(0)
  const navbarBg = useTransform(
    scrollY,
    [0, NAVBAR_SCROLL_THRESHOLD],
    ['rgba(20, 20, 20, 0)', 'rgba(20, 20, 20, 0.95)']
  )
  const navbarBlur = useTransform(scrollY, [0, NAVBAR_SCROLL_THRESHOLD], ['0px', '12px'])
  const navbarHeight = useTransform(
    scrollY,
    [0, NAVBAR_SCROLL_THRESHOLD],
    [NAVBAR_HEIGHT, 56]
  )

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollY])

  const [showSearchInput, setShowSearchInput] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchTerm.trim().length >= 1) {
      const delayDebounce = setTimeout(() => {
        movieService.getAll({ search: searchTerm.trim(), size: 6 })
          .then(res => {
            const moviesList = res.data || []
            const formatted = moviesList.map(movie => ({
              id: movie.id,
              title: movie.title || movie.titleEn || 'Phim Chưa Đặt Tên',
              route: `/movies/${movie.id}`
            }))
            setSuggestions(formatted)
            setSuggestionsOpen(true)
          })
          .catch(err => {
            console.error('Error fetching search suggestions:', err)
            setSuggestions([])
          })
      }, 300)
      return () => clearTimeout(delayDebounce)
    } else {
      setSuggestions([])
      setSuggestionsOpen(false)
    }
  }, [searchTerm])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchClose = () => {
    setShowSearchInput(false)
    setSearchTerm('')
    setSuggestions([])
    setSuggestionsOpen(false)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`)
      handleSearchClose()
    } else if (e.key === 'Escape') {
      handleSearchClose()
    }
  }

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mobile menu animation with GSAP
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      gsap.fromTo(mobileMenuRef.current.querySelectorAll('.mobile-link'),
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.1 }
      )
    }
  }, [mobileMenuOpen])

  const markAllAsRead = () => {
    // TODO: Implement mark all as read
  }

  return (
    <>
      <motion.nav
        initial={{ height: NAVBAR_HEIGHT }}
        style={{
          backgroundColor: navbarBg,
          backdropFilter: `blur(${navbarBlur}px)`,
          height: navbarHeight
        }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 transition-all duration-300"
      >
        <div
          className="w-full mx-auto flex items-center justify-between"
          style={{
            maxWidth: '100%',
            paddingLeft: '30px',
            paddingRight: '30px',
            gap: '32px',
            height: '100%'
          }}
        >
          {/* ── LOGO ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <motion.img
                src={logoImg}
                alt="CineMate Logo"
                className="w-12 h-12 object-contain"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="text-xl font-black tracking-tighter"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                whileHover={{ scale: 1.02 }}
              >
                <span style={{ color: '#FFFFFF' }}>Cine</span>
                <motion.span
                  style={{ color: '#e50914' }}
                  whileHover={{ color: '#ff4444' }}
                  transition={{ duration: 0.2 }}
                >
                  mate
                </motion.span>
              </motion.div>
            </Link>
          </motion.div>

          {/* ── DESKTOP NAV LINKS ── */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-10" style={{ position: 'relative', left: '60px' }}>
            {[
              { route: '/movies', label: 'Phim' },
              { route: '/showtimes', label: 'Lịch Chiếu' },
              { route: '/cinemas', label: 'Rạp Chiếu' },
              { route: '/promotions', label: 'Ưu Đãi' },
              { route: '/about', label: 'Giới Thiệu' }
            ].map(({ route, label }, index) => (
              <NavItem key={route} route={route} label={label} index={index} />
            ))}
          </div>

          {/* ── RIGHT SECTION: Search + User ── */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Search - Desktop */}
            <div className="hidden md:block relative" ref={searchRef}>
              <AnimatePresence mode="wait">
                {showSearchInput || searchTerm !== '' ? (
                  <motion.div
                    key="search-input"
                    initial={{ width: 36, opacity: 0 }}
                    animate={{ width: 240, opacity: 1 }}
                    exit={{ width: 36, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative"
                  >
                    <input
                      type="text"
                      placeholder="Tìm phim..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full bg-transparent border-b border-[#e50914] text-white text-sm py-1 px-2 outline-none transition-all"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      autoFocus
                    />
                    <button
                      onClick={handleSearchClose}
                      className="absolute right-0 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
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
                    onClick={() => setShowSearchInput(true)}
                    className="w-8 h-8 flex items-center justify-center"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    <Search size={16} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {suggestionsOpen && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-72 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="py-2">
                      <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-white/5">
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
                          className="w-full text-left px-4 py-2.5 text-white hover:bg-white/10 transition-colors border-none outline-none bg-transparent cursor-pointer text-sm"
                        >
                          {movie.title}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen)
                  setDropdownOpen(false)
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center relative"
                style={{
                  backgroundColor: 'rgba(229, 9, 20, 0.9)',
                  color: '#ffffff'
                }}
              >
                <Bell size={14} />
                {notifications.some(n => !n.read) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 text-[#06080F] text-[8px] font-black rounded-full flex items-center justify-center border border-[#06080F]"
                  >
                    {notifications.filter(n => !n.read).length}
                  </motion.span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 flex justify-between items-center bg-white/5 border-b border-white/8">
                      <span className="font-bold text-[10px] uppercase text-white tracking-wider">
                        Thông báo
                      </span>
                      {notifications.some(n => !n.read) && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-red-500 hover:underline font-semibold bg-transparent border-none outline-none cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {/* TODO: toggle read */}}
                            className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${
                              !n.read ? 'bg-red-500/5' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold ${!n.read ? 'text-red-500' : 'text-white'}`}>
                                {n.title}
                              </span>
                              <span className="text-[9px] text-gray-500">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-500 font-semibold flex flex-col items-center gap-2">
                          <span className="text-2xl">🔔</span>
                          <span>Không có thông báo mới!</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 transition-all duration-200 relative pl-3 border-l border-white/10"
                >
                  <motion.div
                    className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                    animate={{
                      border: dropdownOpen ? '2px solid #e50914' : '2px solid rgba(255,255,255,0.15)',
                      boxShadow: dropdownOpen ? '0 0 12px rgba(229,9,20,0.4)' : 'none'
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.3), #b3070f)'
                    }}
                  >
                    {user.image ? (
                      <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '14px', color: '#fff' }}>
                        {(user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </motion.div>
                  <motion.span
                    className="hidden lg:block text-sm font-medium"
                    style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif' }}
                    animate={{ color: dropdownOpen ? '#ffffff' : 'rgba(255,255,255,0.8)' }}
                  >
                    {user.fullName?.split(' ')[0] || user.email?.split('@')[0]}
                  </motion.span>
                  <motion.div
                    animate={{ rotate: dropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
                  </motion.div>
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 flex items-center gap-3 bg-white/5 border-b border-white/8">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #e50914, #b3070f)',
                            border: '2px solid rgba(255,255,255,0.15)'
                          }}
                        >
                          {user.image ? (
                            <img src={user.image} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '16px', color: '#fff' }}>
                              {(user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {user.fullName || 'Người dùng'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(() => {
                              const role = user.roles?.[0] || 'MEMBER'
                              const badge = ROLE_BADGES[role] || ROLE_BADGES.MEMBER
                              return (
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${badge.color} shadow-sm ${badge.shadow}`}>
                                  {badge.label}
                                </span>
                              )
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/10"
                          style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}
                        >
                          <UserIcon size={16} />
                          Thông tin cá nhân
                        </Link>

                        {(user.roles?.includes('ADMIN') || user.roles?.includes('MANAGER') || user.roles?.includes('STAFF')) && (() => {
                          const dashboardPath = user.roles.includes('ADMIN') ? '/admin' : user.roles.includes('MANAGER') ? '/manager' : '/staff'
                          return (
                            <Link
                              to={dashboardPath}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/10"
                              style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}
                            >
                              <Settings size={16} />
                              Trang quản trị
                            </Link>
                          )
                        })()}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-white/8 py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-red-500/10 w-full"
                          style={{ color: '#ef4444', fontFamily: 'Inter, sans-serif' }}
                        >
                          <LogOut size={16} />
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
                className="py-1.5 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #e50914, #b3070f)',
                  color: '#ffffff',
                  fontFamily: 'Montserrat, sans-serif',
                  boxShadow: '0 4px 12px rgba(229, 9, 20, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 9, 20, 0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 9, 20, 0.4)'}
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden w-8 h-8 flex items-center justify-center"
              style={{ color: 'rgba(255,255,255,0.8)' }}
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
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={24} />
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
            ref={mobileMenuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.98)',
              paddingTop: `${navbarHeight.get()}px`
            }}
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={toggleMobileMenu}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex flex-col px-6 py-4 space-y-1">
              {[
                { to: '/movies', label: 'Phim' },
                { to: '/showtimes', label: 'Lịch Chiếu' },
                { to: '/cinemas', label: 'Rạp Chiếu' },
                { to: '/promotions', label: 'Ưu Đãi' },
                { to: '/about', label: 'Giới Thiệu' }
              ].map((item, index) => (
                <motion.div
                  key={item.to}
                  className="mobile-link"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block py-4 text-lg font-semibold transition-colors ${
                        isActive ? 'text-[#e50914]' : 'text-white'
                      }`
                    }
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}

              {/* Mobile Search */}
              <motion.div
                className="mobile-link mt-6"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <input
                  type="text"
                  placeholder="Tìm phim..."
                  className="w-full bg-white/10 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-500 outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </motion.div>

              {/* Mobile User Section */}
              <motion.div
                className="mobile-link mt-8 pt-6 border-t border-white/10"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #e50914, #b3070f)' }}
                      >
                        {user.image ? (
                          <img src={user.image} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '18px', color: '#fff' }}>
                            {(user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {user.fullName || user.email?.split('@')[0]}
                        </p>
                        <span className="text-xs text-gray-400">
                          {user.roles?.[0] || 'MEMBER'}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3 px-4 rounded-lg bg-white/5 text-white"
                    >
                      Thông tin cá nhân
                    </Link>
                    {(user.roles?.includes('ADMIN') || user.roles?.includes('MANAGER') || user.roles?.includes('STAFF')) && (
                      <Link
                        to={user.roles.includes('ADMIN') ? '/admin' : user.roles.includes('MANAGER') ? '/manager' : '/staff'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-3 px-4 rounded-lg bg-white/5 text-white"
                      >
                        Trang quản trị
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full py-3 px-4 rounded-lg bg-red-500/10 text-red-500 text-left"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 px-4 rounded-lg text-center font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #e50914, #b3070f)',
                      color: '#ffffff'
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

      {/* Custom Styles */}
      <style>{`
        .nav-link-custom {
          position: relative;
          padding: 6px 2px;
        }

        /* Search input styling */
        input[type="text"]::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Scrollbar for dropdowns */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Prevent body scroll when mobile menu open */
        body.menu-open {
          overflow: hidden;
        }
      `}</style>
    </>
  )
}
