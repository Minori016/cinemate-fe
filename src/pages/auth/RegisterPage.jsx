import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

const FEATURES = [
  { icon: 'confirmation_number', text: 'Đặt vé nhanh chóng, chọn ghế trực quan' },
  { icon: 'movie_filter', text: 'Cập nhật lịch chiếu và phim mới liên tục' },
  { icon: 'loyalty', text: 'Ưu đãi dành riêng cho thành viên CINEMATE' },
]

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAfzXSZJ_IElKcWEQbpgADwvf-abzKg0hLQhKAWZmxZjEmmaIS8XjYwff69_DJxWfrOv7LAJVTPKZDqzkfrWVM_ri34CC79Cu76XhaWY4CTQINrIjZnWmsI8sfZRNCq0bUGEkoEezFfGd_WGC_h2ETZUD_KEw-rG3aYozPI4-_ZN8fJ8Eb6PhcUcFCL9QPxymD-wFYZjwJs9G_mgQ4Gn_-KXH7lOCj2mlDuqOe8fE_Ahf_Ama0snCUlE-wunrt5TOHOY5Vl7gojBtJG'

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dayOfBirth: '',
    gender: 'Male',
    email: '',
    phoneNumber: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const navigate = useNavigate()

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp!')
    }
    setError('')
    setLoading(true)
    try {
      await authService.register(form)
      setShowSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  // Auto-redirect countdown after successful registration
  useEffect(() => {
    if (!showSuccess) return
    if (countdown <= 0) {
      navigate('/login')
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [showSuccess, countdown, navigate])

  // Reusable input field style helpers
  const inputStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 55%, transparent)',
    border: '1px solid rgba(255,255,255,0.10)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    color: 'var(--color-on-surface)',
    paddingLeft: '44px',
    paddingRight: '16px',
    transition: 'border 0.2s ease, box-shadow 0.2s ease',
  }

  const handleFocus = (e) => {
    e.target.style.border = '1px solid var(--color-primary)'
    e.target.style.boxShadow = '0 0 20px rgba(229,9,20,0.22)'
    e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container-highest) 70%, transparent)'
  }

  const handleBlur = (e) => {
    e.target.style.border = '1px solid rgba(255,255,255,0.10)'
    e.target.style.boxShadow = 'none'
    e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container-highest) 55%, transparent)'
  }

  const labelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    letterSpacing: '0.10em',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--color-on-surface-variant)',
  }

  // ── Success Popup Overlay ──
  if (showSuccess) {
    return (
      <>
        <Navbar />
        <main
          className="relative w-full"
          style={{ minHeight: 'calc(100vh - 4rem)', backgroundColor: 'var(--color-background)' }}
        >
          <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_1.05fr]">
            {/* Left panel */}
            <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden">
              <img src={BG_IMAGE} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.75) 45%, rgba(229,9,20,0.18) 100%)' }} />
              <div className="relative z-10 flex flex-col justify-between h-full" style={{ padding: 'clamp(2.5rem, 4vw, 5rem) clamp(3rem, 5vw, 6rem)' }}>
                <div>
                  <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '56px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: '#fff', textShadow: '0 4px 30px rgba(229,9,20,0.4)', marginBottom: '16px' }}>
                    CINEMATE
                  </h2>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
                  © 2026 CINEMATE · Movie Theater Management
                </p>
              </div>
            </aside>

            {/* Right panel - Success */}
            <section className="relative flex items-center justify-center p-8 sm:p-10 lg:p-14" style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="lg:hidden absolute inset-0 z-0 pointer-events-none">
                <img src={BG_IMAGE} alt="" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--color-background) 0%, rgba(9,9,15,0.85) 100%)' }} />
              </div>

              <div
                className="relative z-10 w-full flex flex-col items-center"
                style={{ maxWidth: '460px', animation: 'fadeInScale 0.4s ease-out' }}
              >
                <div
                  className="w-full rounded-2xl flex flex-col items-center"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 72%, transparent)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 2px 0 rgba(255,255,255,0.06) inset, 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(229,9,20,0.10)',
                    backdropFilter: 'blur(28px)',
                    padding: '48px 36px 36px',
                  }}
                >
                  {/* Animated Check Icon */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      boxShadow: '0 0 40px rgba(34,197,94,0.4)',
                      animation: 'bounceIn 0.5s ease-out',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '44px', color: '#fff', fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '26px', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '8px', textAlign: 'center' }}>
                    Đăng ký thành công!
                  </h2>

                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--color-on-surface-variant)', textAlign: 'center', lineHeight: '1.6', marginBottom: '28px' }}>
                    Tài khoản của bạn đã được tạo thành công.<br />
                    Chuyển đến trang đăng nhập sau{' '}
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '18px' }}>{countdown}</span> giây...
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full rounded-full overflow-hidden mb-6" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${((3 - countdown) / 3) * 100}%`,
                        background: 'linear-gradient(to right, var(--color-primary-container), #22c55e)',
                        borderRadius: '9999px',
                        transition: 'width 1s linear',
                      }}
                    />
                  </div>

                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-[14px] px-6 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(160deg, #e50914 0%, #b3070f 60%, #7a0409 100%)',
                      color: '#fff',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(229,9,20,0.65), 0 1px 0 rgba(255,255,255,0.12) inset' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset' }}
                  >
                    Đăng nhập ngay
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
        <Footer />

        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.9); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes bounceIn {
            0%   { opacity: 0; transform: scale(0.3); }
            50%  { opacity: 1; transform: scale(1.08); }
            70%  { transform: scale(0.95); }
            100% { transform: scale(1); }
          }
        `}</style>
      </>
    )
  }

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

          {/* ── Right panel (form đăng ký) ── */}
          <section
            className="relative flex items-center justify-center p-8 sm:p-10 lg:p-14"
            style={{ backgroundColor: 'var(--color-background)' }}
          >
            {/* Mobile background */}
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
                maxWidth: '520px',
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
                    Tạo tài khoản mới
                  </h1>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-on-surface-variant)' }}>
                    Đăng ký để đặt vé, nhận ưu đãi và trải nghiệm rạp chiếu phim hiện đại.
                  </p>
                </div>

                {/* ── Form ── */}
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

                  {/* 2-column grid for fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Username */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="username" style={labelStyle}>Tài khoản</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>person</span>
                        <input id="username" name="username" type="text" placeholder="Nhập username" value={form.username} onChange={handleChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reg-email" style={labelStyle}>Email</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>mail</span>
                        <input id="reg-email" name="email" type="email" placeholder="email@example.com" value={form.email} onChange={handleChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reg-password" style={labelStyle}>Mật khẩu</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>lock</span>
                        <input id="reg-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange} required className="w-full rounded-xl py-3 outline-none" style={{ ...inputStyle, paddingRight: '46px' }} onFocus={handleFocus} onBlur={handleBlur} />
                        <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 flex items-center justify-center focus:outline-none transition-colors hover:text-[var(--color-on-surface)]" style={{ color: 'var(--color-on-surface-variant)', zIndex: 2 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reg-confirm-password" style={labelStyle}>Xác nhận mật khẩu</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>lock</span>
                        <input id="reg-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required className="w-full rounded-xl py-3 outline-none" style={{ ...inputStyle, paddingRight: '46px' }} onFocus={handleFocus} onBlur={handleBlur} />
                        <button type="button" aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 flex items-center justify-center focus:outline-none transition-colors hover:text-[var(--color-on-surface)]" style={{ color: 'var(--color-on-surface-variant)', zIndex: 2 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="fullName" style={labelStyle}>Họ và tên</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>badge</span>
                        <input id="fullName" name="fullName" type="text" placeholder="Nguyễn Văn A" value={form.fullName} onChange={handleChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="dayOfBirth" style={labelStyle}>Ngày sinh</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>calendar_month</span>
                        <input id="dayOfBirth" name="dayOfBirth" type="date" value={form.dayOfBirth} onChange={handleChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="gender" style={labelStyle}>Giới tính</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>wc</span>
                        <select
                          id="gender"
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          className="w-full rounded-xl py-3 outline-none appearance-none cursor-pointer"
                          style={inputStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        >
                          <option value="Male" style={{ background: 'var(--color-surface-container-highest)' }}>Nam</option>
                          <option value="Female" style={{ background: 'var(--color-surface-container-highest)' }}>Nữ</option>
                          <option value="Other" style={{ background: 'var(--color-surface-container-highest)' }}>Khác</option>
                        </select>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="phoneNumber" style={labelStyle}>Số điện thoại</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>phone</span>
                        <input id="phoneNumber" name="phoneNumber" type="text" placeholder="0xxx xxx xxx" value={form.phoneNumber} onChange={handleChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-[14px] px-6 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed mt-1"
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
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Đăng Ký Ngay
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>how_to_reg</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer link */}
                <div className="mt-7 text-center w-full pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                    Đã có tài khoản?{' '}
                    <Link
                      to="/login"
                      className="font-bold ml-1 hover:opacity-75 transition-opacity"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Đăng nhập tại đây
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