import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, LogOut, User as UserIcon, Settings, ChevronDown, Bell } from 'lucide-react'
import logoImg from '../../assets/Cinematelogo.png'
import { movieService } from '../../services/movieService'

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

  // Fetch search suggestions from the backend movie API with debouncing
  useEffect(() => {
    if (searchTerm.trim().length >= 1) {
      const delayDebounce = setTimeout(() => {
        movieService.getAll({ search: searchTerm.trim(), size: 6 })
          .then(res => {
            const moviesList = res.data?.result?.content || res.data?.result || []
            const formatted = moviesList.map(movie => ({
              id: movie.id,
              title: movie.titleVn || movie.titleEn || 'Phim Chưa Đặt Tên',
              route: `/movies/${movie.id}`
            }))
            setSuggestions(formatted)
            setSuggestionsOpen(true)
          })
          .catch(err => {
            console.error('Error fetching suggestions:', err)
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
        className="w-full mx-auto h-16 flex items-center"
        style={{ 
          maxWidth: '100%', 
          paddingLeft: '30px', 
          paddingRight: '30px',
          gap: '32px',
        }}
      >
        
        {/* ── CỘT TRÁI: Logo ── */}
        <Link 
          to="/" 
          className="text-2xl tracking-tighter transition-opacity hover:opacity-90 flex items-center gap-2 flex-shrink-0" 
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          <img src={logoImg} alt="Logo" className="w-14 h-14 object-contain" />
          <div className="flex items-center">
            <span style={{ color: '#FFFFFF' }}>Cine</span>
            <span style={{ color: 'var(--color-primary)' }}>mate</span>
          </div>
        </Link>

        {/* ── CỘT GIỮA: Menu điều hướng chính ── */}
        <div className="flex-1 flex items-center justify-center gap-10" style={{ position: 'relative', left: '60px' }}>
          <NavLink 
            to="/movies" 
            className={({ isActive }) => 
              `nav-link-custom text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
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
              `nav-link-custom text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
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
              `nav-link-custom text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
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
              `nav-link-custom text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
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
              `nav-link-custom text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
              }`
            }
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Giới Thiệu
          </NavLink>
        </div>

        {/* ── CỘT PHẢI: Search + Actions ── */}
        <div className="flex items-center gap-5 flex-shrink-0">
          
          {/* Ô Tìm Kiếm */}
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
                if (searchTerm.trim().length >= 1) setSuggestionsOpen(true)
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255,255,255,0.10)'
                e.target.style.boxShadow = 'none'
                setTimeout(() => setSuggestionsOpen(false), 200)
              }}
            />
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
                      onMouseDown={(e) => {
                        e.preventDefault()
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

          {/* User Profile / Đăng nhập */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 transition-all duration-200 group"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}
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
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '14px', color: '#fff' }}>
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
                  <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, var(--color-primary-container), #b3070f)', border: '2px solid rgba(255,255,255,0.15)' }}
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
                              <p className="truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0 }}>
                        {user.roles?.includes('ADMIN') 
                          ? 'Quản trị viên' 
                          : user.roles?.includes('MANAGER') 
                             ? 'Quản lý' 
                             : user.roles?.includes('STAFF') 
                               ? 'Nhân viên' 
                               : 'Thành viên'}
                      </p>
                    </div>
                  </div>
 
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
 
                    {(user.roles?.includes('ADMIN') || user.roles?.includes('MANAGER') || user.roles?.includes('STAFF')) && (() => {
                      const dashboardPath = user.roles.includes('ADMIN') 
                        ? '/admin' 
                        : user.roles.includes('MANAGER') 
                          ? '/manager' 
                          : '/staff';
                      return (
                        <Link
                          to={dashboardPath}
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                          style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-on-surface)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)' }}
                        >
                          <Settings size={16} />
                          Trang quản trị
                        </Link>
                      );
                    })()}
                  </div>

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

          {/* Nút Notification */}
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
                <div className="px-4 py-3 flex justify-between items-center bg-white/5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="font-bold text-[10px] uppercase text-white tracking-wider">Thông báo của bạn</span>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-red-500 hover:underline font-semibold bg-transparent border-none outline-none cursor-pointer"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => toggleRead(n.id)}
                        className={`p-3.5 transition-colors duration-150 cursor-pointer ${!n.read ? 'bg-white/5' : 'hover:bg-white/5'}`}
                      >
                        <div className="flex justify-between items-start">
                           <span className={`text-xs font-bold ${!n.read ? 'text-red-500' : 'text-white'}`}>{n.title}</span>
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

        </div>
      </div>

      {/* Navbar styles and animation */}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-link-custom {
          position: relative;
          padding: 6px 2px;
          transition: text-shadow 0.2s ease-in-out;
        }
        .nav-link-custom::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: var(--color-primary);
          border-radius: 9999px;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 8px var(--color-primary);
        }
        .nav-link-custom:hover::after,
        .nav-link-custom.active::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .nav-link-custom:hover {
          text-shadow: 0 0 8px rgba(229, 9, 20, 0.45);
        }
        .nav-link-custom.active {
          text-shadow: 0 0 12px rgba(229, 9, 20, 0.65);
        }
      `}</style>
    </nav>
  )
}