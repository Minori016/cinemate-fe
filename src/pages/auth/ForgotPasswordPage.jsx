import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
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
    <>
      <Navbar />
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

          {/* ── Right panel (form khôi phục) ── */}
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
                    Khôi phục mật khẩu
                  </h1>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.65, color: 'var(--color-on-surface-variant)' }}>
                    Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu đến hộp thư của bạn.
                  </p>
                </div>

                {/* ── Form (chưa gửi) ── */}
                {!sent && (
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Gửi Link Reset
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ── Đã gửi: Thông báo check email ── */}
                {sent && (
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
                      className="w-full px-4 py-3 rounded-xl flex items-start gap-3"
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