import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
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
      const user = await login(form.username, form.password)
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/')
    } catch {
      setError('Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 50%, transparent)',
    border: '1px solid rgba(255,255,255,0.10)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    color: 'var(--color-on-surface)',
  }

  const handleFocus = (e) => {
    e.target.style.border = '1px solid var(--color-primary)'
    e.target.style.boxShadow = '0 0 15px rgba(229,9,20,0.2)'
  }

  const handleBlur = (e) => {
    e.target.style.border = '1px solid rgba(255,255,255,0.10)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <main
      className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfzXSZJ_IElKcWEQbpgADwvf-abzKg0hLQhKAWZmxZjEmmaIS8XjYwff69_DJxWfrOv7LAJVTPKZDqzkfrWVM_ri34CC79Cu76XhaWY4CTQINrIjZnWmsI8sfZRNCq0bUGEkoEezFfGd_WGC_h2ETZUD_KEw-rG3aYozPI4-_ZN8fJ8Eb6PhcUcFCL9QPxymD-wFYZjwJs9G_mgQ4Gn_-KXH7lOCj2mlDuqOe8fE_Ahf_Ama0snCUlE-wunrt5TOHOY5Vl7gojBtJG"
          alt="Cinematic Background"
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, var(--color-background) 0%, color-mix(in srgb, var(--color-background) 80%, transparent) 50%, color-mix(in srgb, var(--color-background) 30%, transparent) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[2px]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, transparent)' }}
        />
      </div>

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-[440px] backdrop-blur-xl rounded-xl flex flex-col items-center"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0px 10px 30px rgba(229,9,20,0.15)',
          padding: '40px',
        }}
      >
        {/* Branding */}
        <div className="w-full text-center mb-8">
          <h1
            className="tracking-tighter mb-2"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '48px',
              lineHeight: '56px', /* ĐÃ SỬA: từ line-height thành lineHeight */
              fontWeight: 900,
              color: 'var(--color-primary-container)',
              letterSpacing: '-0.02em',
            }}
          >
            CINEPLEX PRO
          </h1>
          <p
            className="uppercase tracking-widest"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            Hệ Thống Quản Lý Rạp
          </p>
        </div>

        {/* Form */}
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
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

          {/* Username */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="username"
              className="uppercase"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                letterSpacing: '0.05em',
                fontWeight: 600,
                color: 'var(--color-on-surface)',
              }}
            >
              Email / Số điện thoại
            </label>
            <div className="relative flex items-center">
              <span
                className="material-symbols-outlined absolute left-3 z-20 select-none pointer-events-none"
                style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px' }}
              >
                person
              </span>
              <input
                id="username"
                type="text"
                placeholder="Nhập email hoặc số điện thoại"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                className="w-full rounded-lg py-3 transition-all outline-none"
                style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '16px' }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="uppercase"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                letterSpacing: '0.05em',
                fontWeight: 600,
                color: 'var(--color-on-surface)',
              }}
            >
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <span
                className="material-symbols-outlined absolute left-3 z-20 select-none pointer-events-none"
                style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px' }}
              >
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                className="w-full rounded-lg py-3 transition-all outline-none"
                style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '44px' }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 z-20 transition-colors focus:outline-none flex items-center justify-center"
                style={{ color: 'var(--color-on-surface-variant)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-on-surface)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-on-surface-variant)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="appearance-none w-4 h-4 rounded-sm cursor-pointer transition-colors"
                  style={{
                    border: '1px solid rgba(255,255,255,0.30)',
                    backgroundColor: remember
                      ? 'var(--color-primary-container)'
                      : 'color-mix(in srgb, var(--color-surface-container-highest) 80%, transparent)',
                  }}
                />
                {remember && (
                  <span
                    className="material-symbols-outlined absolute pointer-events-none"
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-on-primary-container)',
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    check
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                Ghi nhớ đăng nhập
              </span>
            </label>
            
            <a
              href="#"
              className="transition-colors hover:underline underline-offset-2"
              style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-primary)' }}
            >
              Quên mật khẩu?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
              color: 'var(--color-on-primary-container)',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 4px 14px rgba(229,9,20,0.4)',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.4)' }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span>
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

        {/* Register link */}
        <div
          className="mt-8 text-center w-full pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
        >
          <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-bold hover:underline underline-offset-4 transition-colors ml-1"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-fixed-dim)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
            >
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}