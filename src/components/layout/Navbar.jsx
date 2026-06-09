import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, User, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const handleLogout = () => { 
    logout()
    navigate('/login') 
  }

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
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo CINEPLEX PRO sang xịn mịn */}
        <Link 
          to="/" 
          className="text-2xl tracking-tighter transition-opacity hover:opacity-90" 
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            color: 'var(--color-primary-container)',
            letterSpacing: '-0.03em',
          }}
        >
          CINEPLEX PRO
        </Link>

        {/* Khu vực Menu & Tiện ích */}
        <div className="flex items-center gap-6">
          
          {/* Menu Điều hướng chính */}
          <div className="flex items-center gap-5">
            <NavLink 
              to="/showtimes" 
              className={({ isActive }) => 
                `text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`
              }
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Lịch chiếu
            </NavLink>
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
          </div>

          {/* Ô Tìm Kiếm chuẩn UI (Sửa triệt để lỗi đè chữ) */}
          <div className="relative flex items-center w-44 md:w-56 transition-all duration-300">
            <Search 
              size={15} 
              className="absolute left-3 z-20 pointer-events-none transition-colors" 
              style={{ color: 'var(--color-on-surface-variant)' }}
            />
            <input 
              type="text"
              placeholder="Tìm phim..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full py-1.5 transition-all outline-none"
              style={{ ...searchInputStyle, paddingLeft: '36px', paddingRight: '16px' }}
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

          {/* Khối User Profile / Nút Đăng nhập */}
          {user ? (
            <div className="flex items-center gap-4 pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              
              {/* Account Link */}
              <Link 
                to="/account" 
                className="flex items-center gap-1.5 text-sm font-medium transition-colors text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
                  <User size={14} className="text-[var(--color-primary)]" />
                </div>
                <span className="max-w-[100px] truncate">{user.username}</span>
              </Link>
              
              {/* Nút Đăng xuất */}
              <button 
                onClick={handleLogout} 
                className="p-1.5 rounded-full transition-colors text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-white/5"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>

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
    </nav>
  )
}