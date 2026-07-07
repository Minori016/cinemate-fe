import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    }, 1200)
  }

  const inputStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 30%, transparent)',
    border: '1px solid rgba(255,255,255,0.08)',
    fontFamily: 'Inter, sans-serif',
    color: '#fff',
  }

  return (
    <motion.div
      className="min-h-screen py-10 px-4 md:px-8 max-w-6xl mx-auto"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Title */}
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Kết nối</p>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Liên Hệ Với Chúng Tôi
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          CineMate luôn sẵn sàng lắng nghe mọi thắc mắc, phản hồi hoặc hợp tác kinh doanh từ quý khách.
        </p>
      </motion.div>

      {/* Content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
        
        {/* Left column: Contact Info (4 cols) */}
        <motion.div
          className="lg:col-span-5 flex flex-col gap-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div
            className="p-6 rounded-2xl border border-white/5 flex flex-col gap-5"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)' }}
          >
            <h2 className="text-xl text-white font-bold mb-2 uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Thông Tin Liên Hệ
            </h2>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Địa chỉ Trụ sở chính</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">
                  135 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh, Việt Nam
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Hotline CSKH</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">
                  1900 6600 (9:00 - 22:00 hàng ngày)
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Hộp thư điện tử</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">
                  contact@cinemate.vn hoặc cskh@cinemate.vn
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Giờ hoạt động rạp</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">
                  8:00 AM - 1:00 AM (Tất cả các ngày trong tuần bao gồm Lễ, Tết)
                </p>
              </div>
            </div>
          </div>

          {/* Minimal Map embed */}
          <div
            className="rounded-2xl overflow-hidden border border-white/5 shadow-xl relative aspect-video"
          >
            <iframe
              title="Vị trí CineMate Quận 1"
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.7000%2C10.7730%2C106.7050%2C10.7780&layer=mapnik&marker=10.7757%2C106.7004"
              className="w-full h-full"
              style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) saturate(1.3)', border: 'none' }}
              loading="lazy"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,5,5,0.3) 0%, transparent 80%)' }} />
          </div>
        </motion.div>

        {/* Right column: Form (7 cols) */}
        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div
            className="p-8 rounded-2xl border border-white/5 relative"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)' }}
          >
            <h2 className="text-xl text-white font-bold mb-6 uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Gửi Tin Nhắn Cho CineMate
            </h2>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 flex flex-col items-center text-center justify-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Gửi thành công!</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)] max-w-sm leading-relaxed">
                    Cảm ơn bạn đã gửi tin nhắn. Bộ phận CSKH của CineMate sẽ tiếp nhận và phản hồi sớm nhất qua email của bạn.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Gửi tin nhắn khác
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 text-xs sm:text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>Họ tên *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        style={inputStyle}
                        className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>Email *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="nva@example.com"
                        style={inputStyle}
                        className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>Số điện thoại</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="0901234567"
                        style={inputStyle}
                        className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>Chủ đề</label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        placeholder="Hỏi đáp dịch vụ, Hợp tác..."
                        style={inputStyle}
                        className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>Nội dung *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Nhập nội dung tin nhắn liên hệ của bạn tại đây..."
                      style={inputStyle}
                      className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all resize-none font-medium leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 mt-2 py-3 px-6 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] w-full text-center text-white disabled:opacity-50 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                      fontFamily: 'Montserrat, sans-serif',
                      boxShadow: '0 4px 12px rgba(229,9,20,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={15} /> Gửi Liên Hệ
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
