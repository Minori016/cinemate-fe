import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

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

  return (
    <main
      className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-y-auto layout-scrollbar"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium"
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

      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfzXSZJ_IElKcWEQbpgADwvf-abzKg0hLQhKAWZmxZjEmmaIS8XjYwff69_DJxWfrOv7LAJVTPKZDqzkfrWVM_ri34CC79Cu76XhaWY4CTQINrIjZnWmsI8sfZRNCq0bUGEkoEezFfGd_WGC_h2ETZUD_KEw-rG3aYozPI4-_ZN8fJ8Eb6PhcUcFCL9QPxymD-wFYZjwJs9G_mgQ4Gn_-KXH7lOCj2mlDuqOe8fE_Ahf_Ama0snCUlE-wunrt5TOHOY5Vl7gojBtJG"
          alt="Cinematic Background"
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, var(--color-background) 0%, color-mix(in srgb, var(--color-background) 80%, transparent) 50%, color-mix(in srgb, var(--color-background) 30%, transparent) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[2px]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, transparent)' }}
        />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[480px] backdrop-blur-xl rounded-xl flex flex-col items-center my-8"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0px 10px 30px rgba(229,9,20,0.15)',
          padding: '40px',
        }}
      >
        {/* Branding */}
        <div className="w-full text-center mb-6">
          <h1
            className="tracking-tighter mb-2"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '48px',
              lineHeight: '56px',
              fontWeight: 900,
              color: 'var(--color-primary-container)',
              letterSpacing: '-0.02em',
            }}
          >
            CINEMATE
          </h1>
          <p
            className="uppercase tracking-widest"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            Đặt lại mật khẩu
          </p>
        </div>

        {/* ── SUCCESS STATE ── */}
        {success ? (
          <div className="w-full flex flex-col items-center gap-6 py-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                boxShadow: '0 0 30px rgba(229,9,20,0.4)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#fff' }}>
                check_circle
              </span>
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '8px' }}>
                Đặt lại thành công!
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại để tiếp tục.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                color: 'var(--color-on-primary-container)',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 4px 14px rgba(229,9,20,0.4)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.6)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.4)' }}
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
                className="w-full px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-error-container) 40%, transparent)',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-error)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.
              </div>
            )}

            {/* Error Alert */}
            {error && token && (
              <div
                className="w-full px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-error-container) 40%, transparent)',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-error)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                {error}
              </div>
            )}

            {/* ── RESET FORM ── */}
            <form className="w-full flex flex-col gap-5" onSubmit={handleReset}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-on-surface-variant)', textAlign: 'center', lineHeight: '1.6' }}>
                Nhập mật khẩu mới cho tài khoản của bạn. Hãy dùng mật khẩu đủ mạnh.
              </p>

              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Mật khẩu mới *
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--color-text-muted)] pointer-events-none text-xl">
                    lock
                  </span>
                  <input
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!token || loading}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full pl-10 pr-10"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 flex items-center justify-center text-[var(--color-text-muted)] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {/* Password strength bar */}
                {newPassword.length > 0 && (
                  <div className="flex flex-col gap-1 mt-2">
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
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--color-error)' }}>
                          Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Xác nhận mật khẩu *
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--color-text-muted)] pointer-events-none text-xl">
                    lock_clock
                  </span>
                  <input
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!token || loading}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full pl-10 pr-10"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 flex items-center justify-center text-[var(--color-text-muted)] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>
                    Mật khẩu xác nhận không khớp.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!token || loading}
                className="w-full py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                  color: 'var(--color-on-primary-container)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 4px 14px rgba(229,9,20,0.4)',
                }}
                onMouseEnter={(e) => { if (token && !loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.6)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.4)' }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đặt lại mật khẩu
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock_reset</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer links */}
            <div
              className="mt-8 text-center w-full pt-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
            >
              <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                Nhớ ra mật khẩu rồi?{' '}
                <Link
                  to="/login"
                  className="font-bold hover:underline underline-offset-4 transition-colors ml-1"
                  style={{ color: 'var(--color-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-fixed-dim)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
                >
                  Đăng nhập tại đây
                </Link>
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </main>
  )
}
