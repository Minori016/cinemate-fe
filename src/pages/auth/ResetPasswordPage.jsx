import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { authService } from '../../services/authService'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const FEATURES = [
  { icon: 'confirmation_number', text: 'Đặt vé nhanh chóng, chọn ghế trực quan' },
  { icon: 'movie_filter', text: 'Cập nhật lịch chiếu và phim mới liên tục' },
  { icon: 'loyalty', text: 'Ưu đãi dành riêng cho thành viên CINEMATE' },
]

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAfzXSZJ_IElKcWEQbpgADwvf-abzKg0hLQhKAWZmxZjEmmaIS8XjYwff69_DJxWfrOv7LAJVTPKZDqzkfrWVM_ri34CC79Cu76XhaWY4CTQINrIjZnWmsI8sfZRNCq0bUGEkoEezFfGd_WGC_h2ETZUD_KEw-rG3aYozPI4-_ZN8fJ8Eb6PhcUcFCL9QPxymD-wFYZjwJs9G_mgQ4Gn_-KXH7lOCj2mlDuqOe8fE_Ahf_Ama0snCUlE-wunrt5TOHOY5Vl7gojBtJG'

/* ── Password strength ── */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score: 1, label: 'Yếu', color: '#e53935' }
  if (score <= 3) return { score: 2, label: 'Trung bình', color: '#fb8c00' }
  return { score: 3, label: 'Mạnh', color: '#43a047' }
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const clearError = () => setError('')

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  /* ── Validate token presence ── */
  useEffect(() => {
    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.')
    }
  }, [token])

  /* ── Password validation ── */
  const getPasswordError = (pwd) => {
    if (!pwd) return ''
    if (pwd.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (!PASSWORD_REGEX.test(pwd)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.'
    return ''
  }

  /* ── Submit ── */
  const handleReset = async (e) => {
    e.preventDefault()
    clearError()

    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
      return
    }

    const pwdError = getPasswordError(newPassword)
    if (pwdError) {
      setError(pwdError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword({
        token,
        newPassword,
        confirmPassword,
      })
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.includes('Token') || msg.includes('token') || msg.includes('expired') || msg.includes('invalid')) {
        setError('Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại email.')
      } else {
        setError(msg || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!')
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength(newPassword)

  // Input style helpers (matching LoginPage)
  const inputStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 55%, transparent)',
    border: '1px solid rgba(255,255,255,0.10)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    color: 'var(--color-on-surface)',
    paddingLeft: '44px',
    paddingRight: '46px',
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

  return (
    <>
      <Navbar />

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'success'
              ? 'color-mix(in srgb, #43a047 20%, var(--color-surface-container))'
              : 'color-mix(in srgb, var(--color-error-container) 40%, transparent)',
            border: `1px solid ${toast.type === 'success' ? '#43a047' : 'var(--color-error)'}`,
            color: toast.type === 'success' ? '#43a047' : 'var(--color-error)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.3s ease',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}

      <motion.main
        className="relative w-full overflow-hidden"
        style={{ minHeight: 'calc(100vh - 4rem)', backgroundColor: 'var(--color-background)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Full-screen background image */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={BG_IMAGE}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay across the whole screen */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.80) 50%, rgba(229,9,20,0.15) 100%)',
            }}
          />
          {/* Shimmer across the whole screen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(229,9,20,0.06) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 4s ease-in-out infinite',
            }}
          />
        </div>

        <div className="relative z-10 grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_1.05fr] max-w-6xl mx-auto w-full px-4 md:px-12 gap-8 lg:gap-16">

          {/* ── Left panel (branding) — chỉ hiện trên lg+ ── */}
          <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full py-12 lg:py-16">
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
                    maxWidth: '420px',
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

          {/* ── Right panel (form đặt lại mật khẩu) ── */}
          <section
            className="relative flex items-center justify-center py-12 lg:py-16"
            style={{ backgroundColor: 'transparent' }}
          >

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
                    Đặt lại mật khẩu
                  </h1>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-on-surface-variant)' }}>
                    Nhập mật khẩu mới cho tài khoản của bạn. Hãy dùng mật khẩu đủ mạnh.
                  </p>
                </div>

                {/* ── SUCCESS STATE ── */}
                {success ? (
                  <div className="flex flex-col items-center gap-5 py-2" style={{ animation: 'fadeInScale 0.4s ease-out' }}>
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
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

                    <div className="text-center">
                      <p
                        style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: '22px',
                          fontWeight: 700,
                          color: 'var(--color-on-surface)',
                          marginBottom: '8px',
                        }}
                      >
                        Đặt lại thành công!
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                        Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại để tiếp tục.
                      </p>
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
                ) : (
                  <>
                    {/* Token error banner */}
                    {!token && (
                      <div
                        className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 mb-5"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-error-container) 35%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--color-error) 60%, transparent)',
                          color: 'var(--color-error)',
                        }}
                      >
                        <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px', marginTop: '1px' }}>error</span>
                        <span className="flex-1 leading-relaxed">Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.</span>
                      </div>
                    )}

                    {/* Error Alert */}
                    {error && token && (
                      <div
                        className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 mb-5"
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

                    {/* ── RESET FORM ── */}
                    <form className="flex flex-col gap-5" onSubmit={handleReset}>

                      {/* New Password */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="newPassword"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '11px',
                            letterSpacing: '0.10em',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'var(--color-on-surface-variant)',
                          }}
                        >
                          Mật khẩu mới
                        </label>
                        <div className="relative flex items-center">
                          <span
                            className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none"
                            style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}
                          >
                            lock
                          </span>
                          <input
                            id="newPassword"
                            name="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={!token || loading}
                            required
                            className="w-full rounded-xl py-3 outline-none disabled:opacity-50"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            autoComplete="new-password"
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

                        {/* Password strength bar */}
                        {newPassword.length > 0 && (
                          <div className="flex flex-col gap-1.5 mt-1">
                            <div className="flex gap-1">
                              {[1, 2, 3].map((level) => (
                                <div
                                  key={level}
                                  className="flex-1 rounded-full transition-all duration-300"
                                  style={{
                                    height: '4px',
                                    backgroundColor: strength.score >= level ? strength.color : 'rgba(255,255,255,0.12)',
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: strength.color, fontWeight: 600 }}>
                                Độ mạnh: {strength.label}
                              </p>
                              {getPasswordError(newPassword) && (
                                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--color-error)', textAlign: 'right', maxWidth: '240px' }}>
                                  Cần chữ hoa, thường, số và ký tự đặc biệt
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="confirmPassword"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '11px',
                            letterSpacing: '0.10em',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'var(--color-on-surface-variant)',
                          }}
                        >
                          Xác nhận mật khẩu
                        </label>
                        <div className="relative flex items-center">
                          <span
                            className="material-symbols-outlined absolute left-3.5 select-none pointer-events-none"
                            style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px', zIndex: 2 }}
                          >
                            lock
                          </span>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={!token || loading}
                            required
                            className="w-full rounded-xl py-3 outline-none disabled:opacity-50"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 flex items-center justify-center focus:outline-none transition-colors hover:text-[var(--color-on-surface)]"
                            style={{ color: 'var(--color-on-surface-variant)', zIndex: 2 }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                              {showConfirm ? 'visibility' : 'visibility_off'}
                            </span>
                          </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-error)', marginTop: '2px' }}>
                            Mật khẩu xác nhận không khớp.
                          </p>
                        )}
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={!token || loading}
                        className="w-full py-[14px] px-6 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed"
                        style={{
                          background: loading || !token
                            ? 'rgba(229,9,20,0.35)'
                            : 'linear-gradient(160deg, #e50914 0%, #b3070f 60%, #7a0409 100%)',
                          color: '#fff',
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: '16px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          border: '1px solid rgba(255,255,255,0.12)',
                          boxShadow: (loading || !token) ? 'none' : '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
                          cursor: (loading || !token) ? 'not-allowed' : 'pointer',
                          transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!loading && token) e.currentTarget.style.boxShadow = '0 6px 28px rgba(229,9,20,0.65), 0 1px 0 rgba(255,255,255,0.12) inset'
                        }}
                        onMouseLeave={(e) => {
                          if (!loading && token) e.currentTarget.style.boxShadow = '0 4px 20px rgba(229,9,20,0.45), 0 1px 0 rgba(255,255,255,0.12) inset'
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            Đặt Lại Mật Khẩu
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock_reset</span>
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}

                {/* Footer link */}
                <div className="mt-7 text-center w-full pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                    Nhớ ra mật khẩu rồi?{' '}
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
      </motion.main>
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
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
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
