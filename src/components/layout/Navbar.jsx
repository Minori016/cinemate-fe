import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, LogOut, User as UserIcon, Settings, ChevronDown, Bell } from 'lucide-react'
import logoImg from '../../assets/logo.jpg'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

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
          <div className="relative flex items-center w-36 md:w-44 transition-all duration-300">
            <Search 
              size={14} 
              className="absolute left-3 z-20 pointer-events-none transition-colors" 
              style={{ color: 'var(--color-on-surface-variant)' }}
            />
            <input 
              type="text"
              placeholder="Tìm phim..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full py-1.5 transition-all outline-none"
              style={{ ...searchInputStyle, paddingLeft: '32px', paddingRight: '12px', fontSize: '13px' }}
              onFocus={(e) => {
                e.target.style.border = '1px solid var(--color-primary)'
                e.target.style.boxShadow = '0 0 10px rgba(229,9,20,0.2)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255,255,255,0.10)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Nút MUA VÉ (Thiết kế dạng Vé xem phim) */}
          <button 
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
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
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_8px_rgba(229,9,20,0.2)] shrink-0"
            style={{
              backgroundColor: '#e50914',
              color: '#ffffff',
              border: 'none',
            }}
          >
            <Bell size={14} />
          </button>

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