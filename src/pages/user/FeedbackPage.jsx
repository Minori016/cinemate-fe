import { useState } from 'react'
import { Star, MessageSquare, ThumbsUp, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function FeedbackPage() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [hoverServiceRating, setHoverServiceRating] = useState(0)
  const [popcornRating, setPopcornRating] = useState(0)
  const [hoverPopcornRating, setHoverPopcornRating] = useState(0)

  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating === 0) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setComment('')
      setEmail('')
      setRating(0)
      setServiceRating(0)
      setPopcornRating(0)
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
      className="min-h-screen py-10 px-4 md:px-8 max-w-2xl mx-auto"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Title */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <MessageSquare size={24} />
          </div>
        </div>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Ý Kiến Đóng Góp
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          Mọi đóng góp quý giá của bạn sẽ giúp CineMate ngày càng hoàn thiện và mang lại chất lượng dịch vụ tốt hơn.
        </p>
      </motion.div>

      {/* Main Container */}
      <div
        className="p-8 rounded-2xl border border-white/5 relative text-left"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)' }}
      >
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
                <ThumbsUp size={32} />
              </div>
              <h3 className="text-xl text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Cảm ơn sự đóng góp của bạn!</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] max-w-sm leading-relaxed">
                Ý kiến phản hồi của bạn đã được ghi nhận thành công và chuyển đến bộ phận quản lý dịch vụ CineMate.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Gửi thêm góp ý
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Rating 1: Trải nghiệm phòng chiếu */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  1. Chất lượng phòng chiếu & hình ảnh âm thanh *
                </label>
                <div className="flex gap-2.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform duration-150 hover:scale-125 bg-transparent border-none outline-none cursor-pointer p-0"
                    >
                      <Star
                        size={28}
                        className="transition-colors duration-150"
                        fill={(hoverRating || rating) >= star ? '#e50914' : 'none'}
                        color={(hoverRating || rating) >= star ? '#e50914' : '#55555d'}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-xs font-bold text-red-500 self-center ml-2 uppercase tracking-wide">
                      {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Khá tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Tệ' : 'Rất tệ'}
                    </span>
                  )}
                </div>
              </div>

              {/* Rating 2: Thái độ phục vụ */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  2. Thái độ và tốc độ phục vụ của nhân viên
                </label>
                <div className="flex gap-2.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setServiceRating(star)}
                      onMouseEnter={() => setHoverServiceRating(star)}
                      onMouseLeave={() => setHoverServiceRating(0)}
                      className="transition-transform duration-150 hover:scale-125 bg-transparent border-none outline-none cursor-pointer p-0"
                    >
                      <Star
                        size={28}
                        className="transition-colors duration-150"
                        fill={(hoverServiceRating || serviceRating) >= star ? '#d97706' : 'none'}
                        color={(hoverServiceRating || serviceRating) >= star ? '#d97706' : '#55555d'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 3: Bắp nước */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  3. Chất lượng & hương vị bắp nước
                </label>
                <div className="flex gap-2.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPopcornRating(star)}
                      onMouseEnter={() => setHoverPopcornRating(star)}
                      onMouseLeave={() => setHoverPopcornRating(0)}
                      className="transition-transform duration-150 hover:scale-125 bg-transparent border-none outline-none cursor-pointer p-0"
                    >
                      <Star
                        size={28}
                        className="transition-colors duration-150"
                        fill={(hoverPopcornRating || popcornRating) >= star ? '#16a34a' : 'none'}
                        color={(hoverPopcornRating || popcornRating) >= star ? '#16a34a' : '#55555d'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Địa chỉ Email nhận phản hồi (Không bắt buộc)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={inputStyle}
                  className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all font-medium text-sm"
                />
              </div>

              {/* Comment text */}
              <div className="flex flex-col gap-2">
                <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Chi tiết ý kiến đóng góp của bạn *
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Gợi ý thêm dịch vụ, ý kiến đóng góp về rạp chiếu phim..."
                  style={inputStyle}
                  className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all resize-none font-medium text-sm leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading || rating === 0}
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
                    <Send size={15} /> Gửi Phản Hồi
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
