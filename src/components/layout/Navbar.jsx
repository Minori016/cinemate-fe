import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, LogOut, User as UserIcon, Settings, ChevronDown, Bell } from 'lucide-react'
import logoImg from '../../assets/logo.jpg'

const MOVIE_TITLES = [
  { id: 1, title: 'MA XÓ (T18)', route: '/movies/1' },
  { id: 2, title: 'LỚP HỌC ÁM SÁT (T16)', route: '/movies/2' },
  { id: 3, title: 'KUMANTHONG (T18)', route: '/movies/3' },
  { id: 4, title: 'THE AMAZING DIGITAL CIRCUS (K)', route: '/movies/4' },
  { id: 5, title: 'BẦY XÁC SỐNG (T16)', route: '/movies/5' },
  { id: 6, title: 'SPIDER NOIR (T13)', route: '/movies/6' },
  { id: 7, title: 'SPIDER-MAN: BRAND NEW DAY (K)', route: '/movies/7' },
  { id: 8, title: 'THE BACKROOMS (T16)', route: '/movies/8' },
  { id: 9, title: 'AVATAR: THE SEED BEARER (T13)', route: '/movies/9' },
  { id: 10, title: 'THÁM TỬ LỪNG DANH CONAN (K)', route: '/movies/10' }
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef(null)
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Vé đặt thành công 🎟️', message: 'Mã đặt vé của bạn đã được xác nhận. Kiểm tra vé tại trang cá nhân.', time: 'Vừa xong', read: false },
    { id: 2, title: 'Khuyến mãi hot 🔥', message: 'Giảm ngay 20% khi mua Combo Solo tại quầy bắp nước hôm nay.', time: '1 giờ trước', read: false },
    { id: 3, title: 'Suất chiếu đặc biệt 🎬', message: 'Dune: Hành Tinh Cát - Phần 2 đã mở bán vé suất chiếu IMAX.', time: '1 ngày trước', read: true }
  ])

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const [suggestions, setSuggestions] = useState([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const searchRef = useRef(null)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    if (value.trim().length >= 1) {
      const filtered = MOVIE_TITLES.filter(movie => 
        movie.title.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setSuggestionsOpen(true)
    } else {
      setSuggestions([])
      setSuggestionsOpen(false)
    }
  }

  const handleLogout = () => { 
    logout()
    setDropdownOpen(false)
    navigate('/login') 
  }

  // Close dropdown when clicking outside
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

  // Style chuẩn cho ô Tìm kiếm (Đồng bộ với hệ thống, chống lỗi đè chữ)
  const searchInputStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent)',
    border: '1px solid rgba(255,255,255,0.10)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: 'var(--color-on-surface)',
  }

  return (
    <nav 
      className="sticky top-0 z-40 backdrop-blur-xl transition-all duration-300"
      style={{ 
        backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 75%, transparent)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div 
        className="w-full mx-auto h-16 flex items-center justify-between"
        style={{ 
          maxWidth: '1400px', 
          paddingLeft: 'clamp(2rem, 6vw, 8rem)', 
          paddingRight: 'clamp(2rem, 6vw, 8rem)' 
        }}
      >
        
        {/* Logo Cinemate */}
        <Link 
          to="/" 
          className="text-2xl tracking-tighter transition-opacity hover:opacity-90 flex items-center gap-2" 
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-white/10" />
          <div className="flex items-center">
            <span style={{ color: '#FFFFFF' }}>Cine</span>
            <span style={{ color: 'var(--color-primary)' }}>mate</span>
          </div>
        </Link>

        {/* Khu vực Menu & Tiện ích */}
        <div className="flex items-center gap-6">
          
          {/* Menu Điều hướng chính */}
          <div className="flex items-center gap-5">
            <NavLink 
              to="/movies" 
              className={({ isActive }) => 
                `text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`
              }
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Phim
            </NavLink>
            <NavLink 
              to="/showtimes" 
              className={({ isActive }) => 
                `text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`
              }
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Lịch Chiếu
            </NavLink>
            <NavLink 
              to="/cinemas" 
              className={({ isActive }) => 
                `text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`
              }
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Rạp Chiếu
            </NavLink>
            <NavLink 
              to="/promotions" 
              className={({ isActive }) => 
                `text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`
              }
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Ưu Đãi
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`
              }
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Giới Thiệu
            </NavLink>
          </div>

          {/* Ô Tìm Kiếm chuẩn UI (Sửa triệt để lỗi đè chữ) */}
          <div className="relative flex items-center w-36 md:w-44 transition-all duration-300" ref={searchRef}>
            <button
              type="button"
              onClick={() => {
                if (searchTerm.trim()) {
                  navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`)
                  setSuggestionsOpen(false)
                }
              }}
              className="absolute left-3 z-20 transition-colors bg-transparent border-none outline-none cursor-pointer flex items-center justify-center p-0"
            >
              <Search 
                size={14} 
                className="transition-colors" 
                style={{ color: 'var(--color-on-surface-variant)' }}
              />
            </button>
            <input 
              type="text"
              placeholder="Tìm phim..." 
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`)
                  setSuggestionsOpen(false)
                }
              }}
              className="w-full rounded-full py-1.5 transition-all outline-none"
              style={{ ...searchInputStyle, paddingLeft: '32px', paddingRight: '12px', fontSize: '13px' }}
              onFocus={(e) => {
                e.target.style.border = '1px solid var(--color-primary)'
                e.target.style.boxShadow = '0 0 10px rgba(229,9,20,0.2)'
                if (searchTerm.trim().length >= 1) {
                  setSuggestionsOpen(true)
                }
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255,255,255,0.10)'
                e.target.style.boxShadow = 'none'
                // Delay so suggestion selection registers correctly before closing
                setTimeout(() => setSuggestionsOpen(false), 200)
              }}
            />

            {/* Suggestions list popup */}
            {suggestionsOpen && suggestions.length > 0 && (
              <div
                className="absolute left-0 top-full mt-2 w-56 bg-[var(--color-surface-container)] border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden z-50 animate-fade-in text-left text-xs"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <div className="py-1.5">
                  <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-gray-500 font-bold border-b border-white/5 pb-1 mb-1">Gợi ý tìm kiếm</div>
                  {suggestions.map((movie) => (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => {
                        setSearchTerm('')
                        setSuggestionsOpen(false)
                        navigate(movie.route)
                      }}
                      className="w-full text-left px-3 py-2 text-white hover:bg-white/10 transition-colors border-none outline-none bg-transparent cursor-pointer block font-semibold truncate"
                    >
                      {movie.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nút MUA VÉ (Thiết kế dạng Vé xem phim) */}
          <button 
            onClick={() => navigate('/showtimes')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
              color: '#ffffff',
              fontFamily: 'Montserrat, sans-serif',
              boxShadow: '0 4px 10px rgba(229, 9, 20, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span className="material-symbols-outlined filled text-[14px]">grade</span>
            <span>MUA VÉ</span>
            <div className="h-3.5 border-l border-dashed border-white/40 ml-1.5 pl-1.5 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
            </div>
          </button>

          {/* Nút Notification Chuông màu đỏ */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => {
                setNotificationsOpen(!notificationsOpen)
                setDropdownOpen(false)
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_8px_rgba(229,9,20,0.2)] shrink-0 relative cursor-pointer"
              style={{
                backgroundColor: '#e50914',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Bell size={14} />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 text-[#06080F] text-[8px] font-black rounded-full flex items-center justify-center border border-[#06080F] select-none scale-95">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {notificationsOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 text-left"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(229,9,20,0.1)',
                  animation: 'dropdownFadeIn 0.2s ease-out',
                }}
              >
                {/* Header */}
                <div className="px-4 py-3 flex justify-between items-center bg-white/5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="font-bold text-[10px] uppercase text-white tracking-wider">Thông báo của bạn</span>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-yellow-400 hover:underline font-semibold bg-transparent border-none outline-none cursor-pointer"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => toggleRead(n.id)}
                        className={`p-3.5 transition-colors duration-150 cursor-pointer ${!n.read ? 'bg-white/5' : 'hover:bg-white/5'}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-xs font-bold ${!n.read ? 'text-[#F3EA28]' : 'text-white'}`}>{n.title}</span>
                          <span className="text-[9px] text-gray-500 font-medium">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-normal mt-1">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-500 font-semibold flex flex-col items-center gap-1.5">
                      <span className="material-symbols-outlined text-3xl">notifications_off</span>
                      <span>Không có thông báo mới!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Khối User Profile / Nút Đăng nhập */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar Button */}
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 transition-all duration-200 group"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200"
                  style={{
                    border: dropdownOpen ? '2px solid var(--color-primary)' : '2px solid rgba(255,255,255,0.15)',
                    boxShadow: dropdownOpen ? '0 0 12px rgba(229,9,20,0.3)' : 'none',
                    background: 'linear-gradient(135deg, var(--color-primary-container), #b3070f)',
                  }}
                >
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 800,
                        fontSize: '14px',
                        color: '#fff',
                      }}
                    >
                      {(user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span 
                  className="hidden md:block text-sm font-medium transition-colors group-hover:text-[var(--color-on-surface)]"
                  style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}
                >
                  {user.fullName || user.email?.split('@')[0]}
                </span>
                <ChevronDown
                  size={14}
                  className="transition-transform duration-200"
                  style={{
                    color: 'var(--color-on-surface-variant)',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface-container)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(229,9,20,0.1)',
                    animation: 'dropdownFadeIn 0.2s ease-out',
                  }}
                >
                  {/* User Info Header */}
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary-container), #b3070f)',
                        border: '2px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      {user.image ? (
                        <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '16px', color: '#fff' }}>
                          {(user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="truncate"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--color-on-surface)',
                          margin: 0,
                        }}
                      >
                        {user.email}
                      </p>
                      <p
                        className="truncate"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: 'var(--color-on-surface-variant)',
                          margin: 0,
                        }}
                      >
                        {user.roles?.includes('ADMIN') ? 'Quản trị viên' : 'Thành viên'}
                      </p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                      style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-on-surface)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)' }}
                    >
                      <UserIcon size={16} />
                      Thông tin cá nhân
                    </Link>

                    {user.roles?.includes('ADMIN') && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                        style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-on-surface)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)' }}
                      >
                        <Settings size={16} />
                        Trang quản trị
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                      style={{ color: 'var(--color-error)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(229,9,20,0.08)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Nút Đăng Nhập Đổ Bóng Đỏ Cao Cấp */
            <Link 
              to="/login" 
              className="py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                color: 'var(--color-on-primary-container)',
                fontFamily: 'Montserrat, sans-serif',
                boxShadow: '0 4px 10px rgba(229,9,20,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(229,9,20,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 10px rgba(229,9,20,0.3)'}
            >
              Đăng nhập
            </Link>
          )}

        </div>
      </div>

      {/* Dropdown animation */}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}