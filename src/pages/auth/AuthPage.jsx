import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { authService } from '../../services/authService'

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAfzXSZJ_IElKcWEQbpgADwvf-abzKg0hLQhKAWZmxZjEmmaIS8XjYwff69_DJxWfrOv7LAJVTPKZDqzkfrWVM_ri34CC79Cu76XhaWY4CTQINrIjZnWmsI8sfZRNCq0bUGEkoEezFfGd_WGC_h2ETZUD_KEw-rG3aYozPI4-_ZN8fJ8Eb6PhcUcFCL9QPxymD-wFYZjwJs9G_mgQ4Gn_-KXH7lOCj2mlDuqOe8fE_Ahf_Ama0snCUlE-wunrt5TOHOY5Vl7gojBtJG'

const FEATURES = [
  { icon: 'confirmation_number', text: 'Đặt vé nhanh chóng, chọn ghế trực quan' },
  { icon: 'movie_filter', text: 'Cập nhật lịch chiếu và phim mới liên tục' },
  { icon: 'loyalty', text: 'Ưu đãi dành riêng cho thành viên CINEMATE' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine mode from pathname
  const getModeFromPath = () => {
    const path = location.pathname
    if (path === '/register') return 'register'
    if (path === '/forgot-password') return 'forgot'
    return 'login' // default
  }

  const [mode, setMode] = useState(getModeFromPath())

  useEffect(() => {
    // Update mode when path changes (e.g., browser back/forward)
    setMode(getModeFromPath())
  }, [location.pathname])

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { login } = useAuth()

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '', password: '', confirmPassword: '', fullName: '',
    dayOfBirth: '', gender: 'Male', email: '', phoneNumber: ''
  })
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  // Handlers
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const user = await login(loginForm.email, loginForm.password, remember)
      if (user.isFirstLogin) {
        navigate('/first-login', { replace: true })
        return
      }
      const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean)
      const from = location.state?.from
        ? (location.state.from.pathname + (location.state.from.search || ''))
        : (roles.includes('ADMIN') ? '/admin' : roles.includes('MANAGER') ? '/manager/dashboard' : roles.includes('STAFF') ? '/staff/dashboard' : '/')
      navigate(from, { replace: true })
    } catch {
      setLoginError('Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại!')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegisterChange = (e) => setRegisterForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleForgotChange = (e) => setForgotEmail(e.target.value)

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      await authService.forgotPassword(forgotEmail)
      setForgotSent(true)
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại!')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResend = async () => {
    setForgotError('')
    setForgotLoading(true)
    try {
      await authService.forgotPassword(forgotEmail)
    } catch {
      setForgotError('Không thể gửi lại email. Vui lòng thử lại.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(registerForm.password)) {
      return setRegisterError('Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).')
    }
    if (registerForm.password !== registerForm.confirmPassword) return setRegisterError('Mật khẩu xác nhận không khớp!')
    setRegisterError('')
    setRegisterLoading(true)
    try {
      await authService.register(registerForm)
      setShowSuccess(true)
    } catch (err) {
      let errMsg = 'Đăng ký thất bại. Vui lòng thử lại!'
      const resp = err.response?.data
      if (resp) {
        if (typeof resp === 'object') {
          if (resp.code === 1004 || resp.message?.includes('at least 8 characters')) errMsg = 'Mật khẩu phải có ít nhất 8 ký tự!'
          else if (resp.message) errMsg = resp.message
        } else if (typeof resp === 'string') {
          try {
            const parsed = JSON.parse(resp)
            if (parsed.code === 1004 || parsed.message?.includes('at least 8 characters')) errMsg = 'Mật khẩu phải có ít nhất 8 ký tự!'
            else if (parsed.message) errMsg = parsed.message
          } catch { errMsg = resp }
        }
      }
      setRegisterError(errMsg)
    } finally {
      setRegisterLoading(false)
    }
  }

  // Countdown effect
  useEffect(() => {
    if (!showSuccess) return
    if (countdown <= 0) {
      navigate('/login', { replace: true })
      setShowSuccess(false)
      setCountdown(3)
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [showSuccess, countdown])

  const handleFocus = (e) => {
    e.target.style.border = '1px solid var(--color-primary)'
    e.target.style.boxShadow = '0 0 20px rgba(229,9,20,0.22)'
    e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container) 95%, transparent)'
  }
  const handleBlur = (e) => {
    e.target.style.border = '1px solid rgba(255,255,255,0.15)'
    e.target.style.boxShadow = 'none'
    e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-surface-container) 90%, transparent)'
  }
  const inputStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 90%, transparent)',
    border: '1px solid rgba(255,255,255,0.15)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    color: 'var(--color-on-surface)',
    paddingLeft: '44px',
    paddingRight: '16px',
    transition: 'border 0.2s ease, box-shadow 0.2s ease',
  }
  const labelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    letterSpacing: '0.10em',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--color-on-surface-variant)',
  }

  // Determine which panel to show
  const showLoginForm = mode === 'login' && !showSuccess
  const showRegisterForm = mode === 'register' && !showSuccess
  const showForgotForm = mode === 'forgot'

  // Calculate orders and initial x offsets for swap animation
  const brandingOrder = mode === 'login' ? 1 : 2
  const formOrder = mode === 'login' ? 2 : 1
  const initialXBranding = mode === 'login' ? -50 : 50
  const initialXForm = mode === 'login' ? 50 : -50

  return (
    <>
      <Navbar />
      <main className="relative w-full overflow-hidden" style={{ minHeight: 'calc(100vh - 4rem)', backgroundColor: 'var(--color-background)' }}>
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img src={BG_IMAGE} alt="" aria-hidden="true" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(30,30,45,0.75) 0%, rgba(30,30,45,0.60) 50%, rgba(229,9,20,0.25) 100%)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(229,9,20,0.08) 50%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 4s ease-in-out infinite' }} />
        </div>

        <div className="relative z-10 grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr] max-w-6xl mx-auto w-full px-4 md:px-12 gap-8 lg:gap-16">
          {/* Branding panel */}
          <motion.aside
            layout
            initial={{ x: initialXBranding }}
            animate={{ x: 0 }}
            style={{ order: brandingOrder }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative hidden lg:flex flex-col justify-between overflow-hidden"
          >
            <div className="relative z-10 flex flex-col justify-between h-full py-12 lg:py-16">
              <div>

                <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '56px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: '#fff', textShadow: '0 4px 30px rgba(229,9,20,0.4)', marginBottom: '16px' }}>CINE<span style={{ color: 'var(--color-primary)' }}>MATE</span></h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', maxWidth: '420px' }}>
                  Trải nghiệm điện ảnh đỉnh cao — đặt vé, quản lý và thưởng thức phim theo cách của bạn.
                </p>
              </div>
              <ul className="flex flex-col gap-4">
                {FEATURES.map((f) => (
                  <li key={f.icon} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(229,9,20,0.2)', border: '1px solid rgba(229,9,20,0.35)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary-fixed-dim)' }}>{f.icon}</span>
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.5, color: 'rgba(255,255,255,0.8)', paddingTop: '6px' }}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>© 2026 CINEMATE · Movie Theater Management</p>
            </div>
          </motion.aside>

          {/* Form panel */}
          <motion.section
            layout
            initial={{ x: initialXForm }}
            animate={{ x: 0 }}
            style={{ order: formOrder, backgroundColor: 'transparent' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative flex items-center justify-center py-12 lg:py-16"
          >
            <div className="relative z-10 w-full flex flex-col" style={{ maxWidth: '460px' }}>
              {/* Mobile branding */}
              <div className="lg:hidden text-center mb-6">
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '28px', fontWeight: 900, color: 'var(--color-primary-container)', letterSpacing: '-0.02em' }}>CINE<span style={{ color: 'var(--color-primary)' }}>MATE</span></p>
              </div>

              <div className="w-full rounded-2xl" style={{ backgroundColor: 'rgba(30,30,45,0.35)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 0 rgba(255,255,255,0.06) inset, 0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(229,9,20,0.10)', backdropFilter: 'blur(28px)', padding: '40px 36px 32px' }}>

                {/* Header */}
                <div className="mb-7">
                  <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '26px', fontWeight: 800, color: 'var(--color-on-surface)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {showSuccess ? 'Đăng ký thành công!' : (showLoginForm ? 'Chào mừng trở lại' : 'Tạo tài khoản mới')}
                  </h1>
                  {!showSuccess && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-on-surface-variant)' }}>
                      {showLoginForm ? 'Đăng nhập để đặt vé, quản lý tài khoản và khám phá phim mới.' : 'Đăng ký để đặt vé, nhận ưu đãi và trải nghiệm rạp chiếu phim hiện đại.'}
                    </p>
                  )}
                  {showSuccess && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--color-on-surface-variant)', textAlign: 'center', lineHeight: '1.6', marginBottom: '28px' }}>
                      Tài khoản của bạn đã được tạo thành công.<br />
                      Chuyển đến trang đăng nhập sau <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '18px' }}>{countdown}</span> giây...
                    </p>
                  )}
                </div>

                {/* Success Progress Bar */}
                {showSuccess && (
                  <div className="w-full rounded-full overflow-hidden mb-6" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', width: `${((3 - countdown) / 3) * 100}%`, background: 'linear-gradient(to right, var(--color-primary-container), #22c55e)', borderRadius: '9999px', transition: 'width 1s linear' }} />
                  </div>
                )}

                {/* Login Form */}
                {showLoginForm && (
                  <form className="flex flex-col gap-5" onSubmit={handleLoginSubmit}>
                    {loginError && (
                      <div className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error-container) 35%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 60%, transparent)', color: 'var(--color-error)' }}>
                        <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px', marginTop: '1px' }}>error</span>
                        <span className="flex-1 leading-relaxed">{loginError}</span>
                        <button type="button" onClick={() => setLoginError('')} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-error)' }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span></button>
                      </div>
                    )}
                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="login-email" style={labelStyle}>Email</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>mail</span>
                        <input id="login-email" type="email" placeholder="you@example.com" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>
                    {/* Password */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="login-password" style={labelStyle}>Mật khẩu</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>lock</span>
                        <input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required className="w-full rounded-xl py-3 outline-none" style={{ ...inputStyle, paddingRight: '46px' }} onFocus={handleFocus} onBlur={handleBlur} />
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 flex items-center justify-center focus:outline-none transition-colors hover:text-[var(--color-on-surface)]" style={{ color: 'var(--color-on-surface-variant)', zIndex: 2 }}><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility' : 'visibility_off'}</span></button>
                      </div>
                    </div>
                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="peer appearance-none w-[18px] h-[18px] rounded cursor-pointer transition-colors" style={{ border: '1px solid rgba(255,255,255,0.25)', backgroundColor: remember ? 'var(--color-primary)' : 'color-mix(in srgb, var(--color-surface-container-highest) 80%, transparent)' }} />
                          {remember && <span className="material-symbols-outlined absolute pointer-events-none" style={{ fontSize: '13px', color: '#fff', fontVariationSettings: "'FILL' 1" }}>check</span>}
                        </div>
                        <span style={{ fontFamily: 'Inter', fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>Ghi nhớ đăng nhập</span>
                      </label>
                      <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm font-medium hover:opacity-75 transition-opacity" style={{ color: 'var(--color-primary)', fontFamily: 'Inter, sans-serif' }}>Quên mật khẩu?</button>
                    </div>
                    {/* Submit */}
                    <button type="submit" disabled={loginLoading} className="w-full py-[14px] px-6 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed" style={{ background: loginLoading ? 'rgba(229,9,20,0.35)' : 'linear-gradient(160deg, #e50914 0%, #b3070f 60%, #7a0409 100%)', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.04em', border: '1px solid rgba(255,255,255,0.12)', boxShadow: loginLoading ? 'none' : '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset', cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'box-shadow 0.2s ease, transform 0.1s ease' }} onMouseEnter={e => { if (!loginLoading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(229,9,20,0.65), 0 1px 0 rgba(255,255,255,0.12) inset' }} onMouseLeave={e => { if (!loginLoading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset' }}>
                      {loginLoading ? <><span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Đang đăng nhập...</> : <>Đăng Nhập<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span></>}
                    </button>
                  </form>
                )}

                {/* Register Form */}
                {showRegisterForm && (
                  <form className="flex flex-col gap-5" onSubmit={handleRegisterSubmit}>
                    {registerError && (
                      <div className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error-container) 35%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 60%, transparent)', color: 'var(--color-error)' }}>
                        <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px', marginTop: '1px' }}>error</span>
                        <span className="flex-1 leading-relaxed">{registerError}</span>
                        <button type="button" onClick={() => setRegisterError('')} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-error)' }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span></button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-username" style={labelStyle}>Tài khoản</label>
                        <div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>person</span><input id="reg-username" name="username" type="text" placeholder="Nhập username" value={registerForm.username} onChange={handleRegisterChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} /></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-email" style={labelStyle}>Email</label>
                        <div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>mail</span><input id="reg-email" name="email" type="email" placeholder="email@example.com" value={registerForm.email} onChange={handleRegisterChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} /></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-fullName" style={labelStyle}>Họ và tên</label>
                        <div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>badge</span><input id="reg-fullName" name="fullName" type="text" placeholder="Nguyễn Văn A" value={registerForm.fullName} onChange={handleRegisterChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} /></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-dayOfBirth" style={labelStyle}>Ngày sinh</label>
                        <div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>calendar_month</span><input id="reg-dayOfBirth" name="dayOfBirth" type="date" value={registerForm.dayOfBirth} onChange={handleRegisterChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} /></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-gender" style={labelStyle}>Giới tính</label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>wc</span>
                          <select id="reg-gender" name="gender" value={registerForm.gender} onChange={handleRegisterChange} className="w-full rounded-xl py-3 outline-none appearance-none cursor-pointer" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}>
                            <option value="Male" style={{ background: 'var(--color-surface-container-highest)' }}>Nam</option>
                            <option value="Female" style={{ background: 'var(--color-surface-container-highest)' }}>Nữ</option>
                            <option value="Other" style={{ background: 'var(--color-surface-container-highest)' }}>Khác</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-phoneNumber" style={labelStyle}>Số điện thoại</label>
                        <div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>phone</span><input id="reg-phoneNumber" name="phoneNumber" type="text" placeholder="0xxx xxx xxx" value={registerForm.phoneNumber} onChange={handleRegisterChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} /></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-password" style={labelStyle}>Mật khẩu</label>
                        <div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>lock</span><input id="reg-password" name="password" type="password" placeholder="••••••••" value={registerForm.password} onChange={handleRegisterChange} minLength="8" required className="w-full rounded-xl py-3 outline-none" style={{ ...inputStyle, paddingRight: '46px' }} onFocus={handleFocus} onBlur={handleBlur} /></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reg-confirm-password" style={labelStyle}>Xác nhận mật khẩu</label>
                        <div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>lock</span><input id="reg-confirm-password" name="confirmPassword" type="password" placeholder="••••••••" value={registerForm.confirmPassword} onChange={handleRegisterChange} minLength="8" required className="w-full rounded-xl py-3 outline-none" style={{ ...inputStyle, paddingRight: '46px' }} onFocus={handleFocus} onBlur={handleBlur} /></div>
                      </div>
                    </div>
                    <button type="submit" disabled={registerLoading} className="w-full py-[14px] px-6 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed mt-1" style={{ background: registerLoading ? 'rgba(229,9,20,0.35)' : 'linear-gradient(160deg, #e50914 0%, #b3070f 60%, #7a0409 100%)', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.04em', border: '1px solid rgba(255,255,255,0.12)', boxShadow: registerLoading ? 'none' : '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset', cursor: registerLoading ? 'not-allowed' : 'pointer', transition: 'box-shadow 0.2s ease, transform 0.1s ease' }} onMouseEnter={e => { if (!registerLoading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(229,9,20,0.65), 0 1px 0 rgba(255,255,255,0.12) inset' }} onMouseLeave={e => { if (!registerLoading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset' }}>
                      {registerLoading ? <><span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Đang xử lý...</> : <>Đăng Ký Ngay<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>how_to_reg</span></>}
                    </button>
                  </form>
                )}

                {/* Forgot Password Form */}
                {showForgotForm && (
                  <form className="flex flex-col gap-5" onSubmit={handleForgotSubmit}>
                    {forgotError && (
                      <div className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error-container) 35%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 60%, transparent)', color: 'var(--color-error)' }}>
                        <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px', marginTop: '1px' }}>error</span>
                        <span className="flex-1 leading-relaxed">{forgotError}</span>
                        <button type="button" onClick={() => setForgotError('')} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-error)' }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span></button>
                      </div>
                    )}

                    {!forgotSent && (
                      <>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="forgot-email" style={labelStyle}>Email</label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}>mail</span>
                            <input id="forgot-email" type="email" autoComplete="email" placeholder="you@example.com" value={forgotEmail} onChange={handleForgotChange} required className="w-full rounded-xl py-3 outline-none" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                          </div>
                        </div>

                        <button type="submit" disabled={forgotLoading} className="w-full py-[14px] px-6 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed" style={{ background: forgotLoading ? 'rgba(229,9,20,0.35)' : 'linear-gradient(160deg, #e50914 0%, #b3070f 60%, #7a0409 100%)', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.04em', border: '1px solid rgba(255,255,255,0.12)', boxShadow: forgotLoading ? 'none' : '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset', cursor: forgotLoading ? 'not-allowed' : 'pointer', transition: 'box-shadow 0.2s ease, transform 0.1s ease' }} onMouseEnter={e => { if (!forgotLoading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(229,9,20,0.65), 0 1px 0 rgba(255,255,255,0.12) inset' }} onMouseLeave={e => { if (!forgotLoading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset' }}>
                          {forgotLoading ? <><span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Đang xử lý...</> : <>Gửi Link Reset<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span></>}
                        </button>
                      </>
                    )}

                    {forgotSent && (
                      <div className="flex flex-col items-center gap-5 py-2">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 40px rgba(34,197,94,0.4)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '44px', color: '#fff', fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                        </div>

                        <div className="text-center">
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '8px' }}>Email đã được gửi!</p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                            Link đặt lại mật khẩu đã được gửi đến <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{forgotEmail}</span>.
                            <br />Vui lòng kiểm tra hộp thư (và thư mục spam) rồi bấm vào link trong email.
                          </p>
                        </div>

                        <div className="w-full px-4 py-3 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)', marginTop: '2px' }}>info</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-on-surface-variant)', lineHeight: '1.5', margin: 0 }}>
                            Link có hiệu lực trong <strong style={{ color: 'var(--color-on-surface)' }}>15 phút</strong>.
                          </p>
                        </div>

                        <button type="button" onClick={handleResend} disabled={forgotLoading} className="text-sm hover:underline underline-offset-4 transition-colors disabled:opacity-50" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-on-surface-variant)' }}>
                          Không nhận được email? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Gửi lại</span>
                        </button>

                        <button type="button" onClick={() => { navigate('/login'); setForgotSent(false); setForgotEmail(''); setForgotError(''); }} className="text-sm hover:underline underline-offset-4 transition-colors" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-primary)' }}>
                          ← Quay lại đăng nhập
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* Footer link */}
                {!showSuccess && !showForgotForm && (
                  <div className="mt-7 text-center w-full pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                      {showLoginForm ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                      {' '}
                      <button type="button" onClick={() => { navigate(showLoginForm ? '/register' : '/login'); setLoginError(''); setRegisterError(''); }} className="font-bold ml-1 hover:opacity-75 transition-opacity" style={{ color: 'var(--color-primary)' }}>
                        {showLoginForm ? 'Đăng ký ngay' : 'Đăng nhập tại đây'}
                      </button>
                    </p>
                  </div>
                )}

                {/* Footer for Forgot Password */}
                {showForgotForm && !forgotSent && (
                  <div className="mt-7 text-center w-full pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                      Nhớ mật khẩu rồi?{' '}
                      <button type="button" onClick={() => { navigate('/login'); setForgotError(''); }} className="font-bold ml-1 hover:opacity-75 transition-opacity" style={{ color: 'var(--color-primary)' }}>
                        Đăng nhập tại đây
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
