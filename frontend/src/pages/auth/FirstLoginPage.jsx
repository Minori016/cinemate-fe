import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAfzXSZJ_IElKcWEQbpgADwvf-abzKg0hLQhKAWZmxZjEmmaIS8XjYwff69_DJxWfrOv7LAJVTPKZDqzkfrWVM_ri34CC79Cu76XhaWY4CTQINrIjZnWmsI8sfZRNCq0bUGEkoEezFfGd_WGC_h2ETZUD_KEw-rG3aYozPI4-_ZN8fJ8Eb6PhcUcFCL9QPxymD-wFYZjwJs9G_mgQ4Gn_-KXH7lOCj2mlDuqOe8fE_Ahf_Ama0snCUlE-wunrt5TOHOY5Vl7gojBtJG'

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

export default function FirstLoginPage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Redirect if they shouldn't be here
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!user.isFirstLogin) {
      const redirectPath = user.roles.includes('ADMIN')
        ? '/admin/dashboard'
        : user.roles.includes('MANAGER')
        ? '/manager/analytics'
        : user.roles.includes('STAFF')
        ? '/staff/overview'
        : '/home'
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate])

  const getPasswordError = (pwd) => {
    if (!pwd) return ''
    if (pwd.length < 8) return 'Mật khẩu mới phải có ít nhất 8 ký tự.'
    if (!PASSWORD_REGEX.test(pwd)) {
      return 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu tạm thời hiện tại.')
      return
    }

    const pwdError = getPasswordError(newPassword)
    if (pwdError) {
      setError(pwdError)
      return
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu tạm thời.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    setLoading(true)
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      showToast('Đổi mật khẩu thành công! Đang chuyển hướng...', 'success')

      // Update auth context state to mark first login as complete
      updateUser({ isFirstLogin: false })

      setTimeout(() => {
        const redirectPath = user.roles.includes('ADMIN')
          ? '/admin/dashboard'
          : user.roles.includes('MANAGER')
          ? '/manager/analytics'
          : user.roles.includes('STAFF')
          ? '/staff/overview'
          : '/home'
        navigate(redirectPath, { replace: true })
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại mật khẩu tạm thời.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength(newPassword)

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 flex items-center gap-2 py-3 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-300 transform"
          style={{
            backgroundColor: toast.type === 'success' ? '#43a047' : 'var(--color-error)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.3s ease',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}

      {/* Background Image & Overlays */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src={BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.85) 50%, rgba(229,9,20,0.15) 100%)',
          }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md bg-[rgba(20,20,25,0.7)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-[5px] mb-6" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '7px',
                borderRadius: '2px',
                backgroundColor: i === 3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-2 tracking-tight">
          Đổi mật khẩu lần đầu
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] text-center mb-8 max-w-sm">
          Đây là lần đăng nhập đầu tiên của bạn. Hãy đổi mật khẩu để bảo vệ tài khoản trước khi tiếp tục.
        </p>

        {error && (
          <motion.div
            className="w-full mb-6 py-3 px-4 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-red-400 text-sm flex items-start gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="material-symbols-outlined shrink-0 text-red-500 mt-0.5" style={{ fontSize: '18px' }}>
              warning
            </span>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {/* Current Password */}
          <div className="flex flex-col gap-1 w-full text-left">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Mật khẩu tạm thời *
            </label>
            <div className="relative w-full">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu nhận qua Email"
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] focus:border-red-500 rounded-lg py-2.5 pl-3.5 pr-10 text-white text-sm transition-all focus:outline-none placeholder-[rgba(255,255,255,0.25)]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1 w-full text-left">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Mật khẩu mới *
            </label>
            <div className="relative w-full">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới từ 8 ký tự trở lên"
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] focus:border-red-500 rounded-lg py-2.5 pl-3.5 pr-10 text-white text-sm transition-all focus:outline-none placeholder-[rgba(255,255,255,0.25)]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Strength meter */}
            {newPassword && (
              <div className="mt-2 w-full">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--color-text-muted)]">Độ mạnh mật khẩu:</span>
                  <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
                </div>
                <div className="h-1 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(strength.score / 3) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1 w-full text-left">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Xác nhận mật khẩu mới *
            </label>
            <div className="relative w-full">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] focus:border-red-500 rounded-lg py-2.5 pl-3.5 pr-10 text-white text-sm transition-all focus:outline-none placeholder-[rgba(255,255,255,0.25)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold rounded-lg py-3 text-sm transition-all shadow-lg shadow-red-600/20 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>
                progress_activity
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  lock_reset
                </span>
                Xác nhận đổi mật khẩu
              </>
            )}
          </button>
        </form>

        <button
          onClick={logout}
          className="mt-6 text-xs text-[var(--color-text-muted)] hover:text-white transition-colors underline cursor-pointer"
        >
          Đăng xuất tài khoản
        </button>
      </motion.div>
    </div>
  )
}
