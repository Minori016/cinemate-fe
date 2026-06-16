import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

// ─── Điều hướng theo role (giữ nguyên logic cũ) ───────────────────────────────
const ROLE_ROUTES = {
  ADMIN: '/admin',
  MANAGER: '/manager/dashboard',
  STAFF: '/staff/dashboard',
  MEMBER: '/',
}

function getRedirectPath(roles = []) {
  for (const role of ['ADMIN', 'MANAGER', 'STAFF', 'MEMBER']) {
    if (roles.includes(role)) return ROLE_ROUTES[role]
  }
  return '/'
}

const FEATURES = [
  { icon: 'confirmation_number', text: 'Đặt vé nhanh chóng, chọn ghế trực quan' },
  { icon: 'movie_filter', text: 'Cập nhật lịch chiếu và phim mới liên tục' },
  { icon: 'loyalty', text: 'Ưu đãi dành riêng cho thành viên CINEMATE' },
]

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAfzXSZJ_IElKcWEQbpgADwvf-abzKg0hLQhKAWZmxZjEmmaIS8XjYwff69_DJxWfrOv7LAJVTPKZDqzkfrWVM_ri34CC79Cu76XhaWY4CTQINrIjZnWmsI8sfZRNCq0bUGEkoEezFfGd_WGC_h2ETZUD_KEw-rG3aYozPI4-_ZN8fJ8Eb6PhcUcFCL9QPxymD-wFYZjwJs9G_mgQ4Gn_-KXH7lOCj2mlDuqOe8fE_Ahf_Ama0snCUlE-wunrt5TOHOY5Vl7gojBtJG'

export default function LoginPage() {
  // ─── Logic giữ nguyên 100% ────────────────────────────────────────────────
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean)
      navigate(getRedirectPath(roles))
    } catch {
      setError('Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <main
        className="relative w-full"
        style={{ minHeight: 'calc(100vh - 4rem)', backgroundColor: 'var(--color-background)' }}
      >
        <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_1.05fr]">

          {/* ── Left panel (ảnh + branding) — chỉ hiện trên lg+ ── */}
          <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden">
            <img
              src={BG_IMAGE}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.75) 45%, rgba(229,9,20,0.18) 100%)',
              }}
            />
            {/* Shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(105deg, transparent 40%, rgba(229,9,20,0.06) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 4s ease-in-out infinite',
              }}
            />

            <div className="relative z-10 flex flex-col justify-between h-full" style={{ padding: 'clamp(2.5rem, 4vw, 5rem) clamp(3rem, 5vw, 6rem)' }}>
              {/* Brand block */}
              <div>
                {/* Film-strip decoration */}
                <div className="flex items-center gap-[5px] mb-6" aria-hidden="true">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '16px',
                        height: '9px',
                        borderRadius: '2px',
                        backgroundColor: i === 5 ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>

                <h2
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '56px',
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    color: '#fff',
                    textShadow: '0 4px 30px rgba(229,9,20,0.4)',
                    marginBottom: '16px',
                  }}
                >
                  CINEMATE
                </h2>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '18px',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.75)',
                    maxWidth: '340px',
                  }}
                >
                  Trải nghiệm điện ảnh đỉnh cao — đặt vé, quản lý và thưởng thức phim theo cách của bạn.
                </p>
              </div>

              {/* Feature list */}
              <ul className="flex flex-col gap-4">
                {FEATURES.map((f) => (
                  <li key={f.icon} className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(229,9,20,0.2)',
                        border: '1px solid rgba(229,9,20,0.35)',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '18px', color: 'var(--color-primary-fixed-dim)' }}
                      >
                        {f.icon}
                      </span>
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        lineHeight: 1.5,
                        color: 'rgba(255,255,255,0.8)',
                        paddingTop: '6px',
                      }}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
                © 2026 CINEMATE · Movie Theater Management
              </p>
            </div>
          </aside>

          {/* ── Right panel (form đăng nhập) ── */}
          <section
            className="relative flex items-center justify-center p-8 sm:p-10 lg:p-14"
            style={{ backgroundColor: 'var(--color-background)' }}
          >
            {/* Mobile background (chỉ hiện khi không có left panel) */}
            <div className="lg:hidden absolute inset-0 z-0 pointer-events-none">
              <img
                src={BG_IMAGE}
                alt=""
                className="w-full h-full object-cover opacity-20"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, var(--color-background) 0%, rgba(9,9,15,0.85) 100%)' }}
              />
            </div>

            {/* Form card */}
            <div
              className="relative z-10 w-full flex flex-col"
              style={{
                maxWidth: '460px',
                animation: 'authCardEnter 0.45s ease forwards',
              }}
            >
              {/* Mobile branding */}
              <div className="lg:hidden text-center mb-6">
                <p
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '28px',
                    fontWeight: 900,
                    color: 'var(--color-primary-container)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  CINEMATE
                </p>
              </div>

              <div
                className="w-full rounded-2xl"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 72%, transparent)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow:
                    '0 2px 0 rgba(255,255,255,0.06) inset, 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(229,9,20,0.10)',
                  backdropFilter: 'blur(28px)',
                  padding: '40px 36px 32px',
                }}
              >
                {/* Card heading */}
                <div className="mb-7">
                  <h1
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '26px',
                      fontWeight: 800,
                      color: 'var(--color-on-surface)',
                      letterSpacing: '-0.02em',
                      marginBottom: '8px',
                    }}
                  >
                    Chào mừng trở lại
                  </h1>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-on-surface-variant)' }}>
                    Đăng nhập để đặt vé, quản lý tài khoản và khám phá phim mới.
                  </p>
                </div>

                {/* ── Form (logic giữ nguyên) ── */}
                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

                  {/* Error */}
                  {error && (
                    <div
                      className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-error-container) 35%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-error) 60%, transparent)',
                        color: 'var(--color-error)',
                      }}
                    >
                      <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px', marginTop: '1px' }}>error</span>
                      <span className="flex-1 leading-relaxed">{error}</span>
                      <button
                        type="button"
                        onClick={() => setError('')}
                        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-error)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                      </button>
                    </div>
                  )}

                  {/* Email field */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="email"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        letterSpacing: '0.10em',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--color-on-surface-variant)',
                      }}
                    >
                      Email
                    </label>
                    <div className="relative flex items-center">
                      <span
                        className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none"
                        style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}
                      >
                        mail
                      </span>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        required
                        className="w-full rounded-xl py-3 outline-none"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 55%, transparent)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          color: 'var(--color-on-surface)',
                          paddingLeft: '44px',
                          paddingRight: '16px',
                          transition: 'border 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid var(--color-primary)'
                          e.target.style.boxShadow = '0 0 20px rgba(229,9,20,0.22)'
                          e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container-highest) 70%, transparent)'
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid rgba(255,255,255,0.10)'
                          e.target.style.boxShadow = 'none'
                          e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container-highest) 55%, transparent)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="password"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        letterSpacing: '0.10em',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--color-on-surface-variant)',
                      }}
                    >
                      Mật khẩu
                    </label>
                    <div className="relative flex items-center">
                      <span
                        className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none"
                        style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}
                      >
                        lock
                      </span>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        required
                        className="w-full rounded-xl py-3 outline-none"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 55%, transparent)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          color: 'var(--color-on-surface)',
                          paddingLeft: '44px',
                          paddingRight: '46px',
                          transition: 'border 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid var(--color-primary)'
                          e.target.style.boxShadow = '0 0 20px rgba(229,9,20,0.22)'
                          e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container-highest) 70%, transparent)'
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid rgba(255,255,255,0.10)'
                          e.target.style.boxShadow = 'none'
                          e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container-highest) 55%, transparent)'
                        }}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 flex items-center justify-center focus:outline-none transition-colors hover:text-[var(--color-on-surface)]"
                        style={{ color: 'var(--color-on-surface-variant)', zIndex: 2 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                          {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="peer appearance-none w-[18px] h-[18px] rounded cursor-pointer transition-colors"
                          style={{
                            border: '1px solid rgba(255,255,255,0.25)',
                            backgroundColor: remember
                              ? 'var(--color-primary)'
                              : 'color-mix(in srgb, var(--color-surface-container-highest) 80%, transparent)',
                          }}
                        />
                        {remember && (
                          <span
                            className="material-symbols-outlined absolute pointer-events-none"
                            style={{ fontSize: '13px', color: '#fff', fontVariationSettings: "'FILL' 1" }}
                          >
                            check
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: 'Inter', fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                        Ghi nhớ đăng nhập
                      </span>
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium hover:opacity-75 transition-opacity"
                      style={{ color: 'var(--color-primary)', fontFamily: 'Inter, sans-serif' }}
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-[14px] px-6 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed"
                    style={{
                      background: loading
                        ? 'rgba(229,9,20,0.35)'
                        : 'linear-gradient(160deg, #e50914 0%, #b3070f 60%, #7a0409 100%)',
                      color: '#fff',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: loading ? 'none' : '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(229,9,20,0.65), 0 1px 0 rgba(255,255,255,0.12) inset'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                        Đang đăng nhập...
                      </>
                    ) : (
                      <>
                        Đăng Nhập
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer link */}
                <div className="mt-7 text-center w-full pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                    Chưa có tài khoản?{' '}
                    <Link
                      to="/register"
                      className="font-bold ml-1 hover:opacity-75 transition-opacity"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Đăng ký ngay
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes authCardEnter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
