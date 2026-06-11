import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import Input from '../../components/common/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
    } catch {
      setError('Không thể gửi lại email. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-y-auto layout-scrollbar"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
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
            background: 'linear-gradient(to top, var(--color-background) 0%, color-mix(in srgb, var(--color-background) 80%, transparent) 50%, color-mix(in srgb, var(--color-background) 30%, transparent) 100%)',
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
            Khôi phục mật khẩu
          </p>
        </div>

        {/* Error Alert */}
        {error && (
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

        {/* ── Chưa gửi: Form nhập email ── */}
        {!sent && (
          <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-on-surface-variant)', textAlign: 'center', lineHeight: '1.6' }}>
              Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu đến hộp thư của bạn.
            </p>
            <Input
              label="Email *"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
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
                  Gửi link reset
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Đã gửi: Thông báo check email ── */}
        {sent && (
          <div className="w-full flex flex-col items-center gap-6 py-4" style={{ animation: 'fadeInScale 0.4s ease-out' }}>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 0 40px rgba(34,197,94,0.4)',
                animation: 'bounceIn 0.5s ease-out',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '44px', color: '#fff', fontVariationSettings: "'FILL' 1" }}>
                mark_email_read
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
                Email đã được gửi!
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                Link đặt lại mật khẩu đã được gửi đến{' '}
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{email}</span>.
                <br />Vui lòng kiểm tra hộp thư (và thư mục spam) rồi bấm vào link trong email.
              </p>
            </div>

            {/* Info box */}
            <div
              className="w-full px-4 py-3 rounded-lg flex items-start gap-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 40%, transparent)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)', marginTop: '2px' }}>info</span>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-on-surface-variant)', lineHeight: '1.5', margin: 0 }}>
                Link có hiệu lực trong <strong style={{ color: 'var(--color-on-surface)' }}>15 phút</strong>. Sau khi bấm vào link, bạn sẽ được chuyển đến trang đặt mật khẩu mới.
              </p>
            </div>

            {/* Resend */}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-sm hover:underline underline-offset-4 transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-on-surface-variant)' }}
            >
              Không nhận được email?{' '}
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Gửi lại</span>
            </button>
          </div>
        )}

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
      </div>

      {/* Keyframe animations */}
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
    </main>
  )
}