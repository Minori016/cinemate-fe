import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function RegisterPage() {
  const [form, setForm] = useState({
    account: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    identityCard: '',
    email: '',
    address: '',
    phoneNumber: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  // Đồng bộ style inline cho các ô select/input đặc biệt nếu không ăn class Tailwind toàn cục
  const selectStyle = {
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
      className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-y-auto layout-scrollbar"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Cinematic Background (Đồng bộ với Login) */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
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

      {/* Register Card */}
      <div
        className="relative z-10 w-full max-w-[640px] backdrop-blur-xl rounded-xl flex flex-col items-center my-8"
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
              lineHeight: '56px',
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
            Tạo tài khoản thành viên mới
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="w-full px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-6"
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

        {/* Form Đăng ký chia lưới thông minh */}
        <form className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4" onSubmit={handleSubmit}>
          
          <Input label="Tài khoản *" name="account" placeholder="Nhập username" value={form.account} onChange={handleChange} required />
          <Input label="Email *" name="email" type="email" placeholder="email@example.com" value={form.email} onChange={handleChange} required />
          
          <Input label="Mật khẩu *" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          <Input label="Xác nhận mật khẩu *" name="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required />
          
          <Input label="Họ và tên *" name="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={handleChange} required />
          <Input label="Ngày sinh *" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
          
          <div className="flex flex-col gap-2">
            <label
              className="uppercase font-semibold"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--color-on-surface)' }}
            >
              Giới tính
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-lg px-4 py-3 transition-all outline-none appearance-none cursor-pointer"
              style={selectStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="Nam" style={{ background: 'var(--color-surface-container-highest)' }}>Nam</option>
              <option value="Nữ" style={{ background: 'var(--color-surface-container-highest)' }}>Nữ</option>
            </select>
          </div>

          <Input label="CMND/CCCD *" name="identityCard" placeholder="Số CMND/CCCD" value={form.identityCard} onChange={handleChange} required />
          
          {/* Các ô full-width chiếm 2 cột */}
          <div className="md:col-span-2">
            <Input label="Số điện thoại *" name="phoneNumber" placeholder="0xxx xxx xxx" value={form.phoneNumber} onChange={handleChange} required />
          </div>
          
          <div className="md:col-span-2">
            <Input label="Địa chỉ" name="address" placeholder="Nhập địa chỉ của bạn" value={form.address} onChange={handleChange} />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
                  Đang xử lý...
                </>
              ) : (
                <>
                  Đăng Ký Ngay
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>how_to_reg</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quay lại Login */}
        <div
          className="mt-8 text-center w-full pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
        >
          <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
            Đã có tài khoản?{' '}
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

      </div>
    </main>
  )
}   