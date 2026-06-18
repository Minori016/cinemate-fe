import { useState } from 'react'
import { Briefcase, MapPin, DollarSign, Calendar, FileText, CheckCircle2, User, Mail, Send, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const JOBS = [
  {
    id: 1,
    title: 'Quản Lý Rạp Chiếu Phim (Cinema Manager)',
    dept: 'Vận hành Rạp',
    location: 'Quận 1, TP. Hồ Chí Minh',
    salary: '15 - 20 triệu VNĐ',
    type: 'Full-time',
    deadline: '30/07/2026',
    desc: 'Chịu trách nhiệm điều hành toàn bộ hoạt động của chi nhánh rạp, quản lý đội ngũ nhân viên, báo cáo doanh thu và bảo đảm chất lượng dịch vụ đạt tiêu chuẩn năm sao.',
    reqs: [
      'Có tối nhất 2 năm kinh nghiệm quản lý trong lĩnh vực F&B, Nhà hàng, Khách sạn hoặc Rạp chiếu phim.',
      'Kỹ năng giao tiếp, giải quyết vấn đề và quản lý nhân sự xuất sắc.',
      'Có thể làm việc xoay ca, các ngày Lễ, Tết.'
    ]
  },
  {
    id: 2,
    title: 'Kỹ Thuật Viên Phòng Chiếu (Projection Technician)',
    dept: 'Kỹ thuật',
    location: 'Bình Thạnh & Gò Vấp, HCMC',
    salary: '8 - 12 triệu VNĐ',
    type: 'Full-time',
    deadline: '25/07/2026',
    desc: 'Vận hành hệ thống máy chiếu phim laser kỹ thuật số, hệ thống âm thanh vòm Dolby Atmos, IMAX và thực hiện bảo trì định kỳ trang thiết bị phòng chiếu.',
    reqs: [
      'Tốt nghiệp Trung cấp trở lên ngành Điện, Điện tử, CNTT hoặc liên quan.',
      'Cẩn thận, tỉ mỉ, trung thực và có trách nhiệm cao với công việc.',
      'Sẵn sàng làm ca tối muộn theo lịch chiếu.'
    ]
  },
  {
    id: 3,
    title: 'Nhân Viên Dịch Vụ Khách Hàng (Part-time / Full-time)',
    dept: 'Dịch vụ',
    location: 'Toàn hệ thống rạp HCMC',
    salary: '25,000 - 30,000đ / giờ',
    type: 'Linh hoạt ca',
    deadline: 'Thường xuyên tuyển',
    desc: 'Chào đón khách, bán vé xem phim, hướng dẫn khách vào phòng chiếu và chuẩn bị/bán bắp nước tại quầy Concessions.',
    reqs: [
      'Ngoại hình sáng, giọng nói dễ nghe, luôn nở nụ cười tươi tắn.',
      'Ưu tiên sinh viên muốn tìm công việc năng động, thời gian linh hoạt.',
      'Không yêu cầu kinh nghiệm, sẽ được đào tạo bài bản.'
    ]
  }
]

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', portfolio: '', intro: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleApply = (job) => {
    setSelectedJob(job)
    setSubmitted(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setForm({ name: '', email: '', portfolio: '', intro: '' })
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
      className="min-h-screen py-10 px-4 md:px-8 max-w-4xl mx-auto text-left"
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
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Briefcase size={24} />
          </div>
        </div>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Cơ Hội Nghề Nghiệp
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto text-center">
          Gia nhập đại gia đình CineMate để cùng kiến tạo những không gian giải trí đỉnh cao cho hàng triệu khán giả Việt.
        </p>
      </motion.div>

      {/* Jobs list */}
      <div className="flex flex-col gap-6">
        {JOBS.map((job) => (
          <motion.div
            key={job.id}
            className="p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.12)', y: -4, transition: { duration: 0.2 } }}
          >
            {/* Left: Job Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-lg text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {job.title}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white bg-red-600/90 tracking-wider">
                  {job.type}
                </span>
              </div>

              <p className="text-xs text-red-500 font-semibold mb-3 tracking-wide">{job.dept}</p>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-4 leading-relaxed">{job.desc}</p>

              {/* Requirements summary */}
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="text-xs font-bold text-white/90">Yêu cầu ứng viên chính:</span>
                {job.reqs.map((req, i) => (
                  <p key={i} className="text-xs text-[var(--color-on-surface-variant)]/80 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-red-500">
                    {req}
                  </p>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-on-surface-variant)]/60 font-semibold border-t border-white/5 pt-4">
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-red-500" />{job.location}</span>
                <span className="flex items-center gap-1.5"><DollarSign size={13} className="text-red-500" />{job.salary}</span>
                <span className="flex items-center gap-1.5"><Calendar size={13} className="text-red-500" />Hạn nộp: {job.deadline}</span>
              </div>
            </div>

            {/* Right: Apply CTA */}
            <button
              onClick={() => handleApply(job)}
              className="md:self-center bg-white text-black hover:bg-red-600 hover:text-white transition-all px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer w-full md:w-auto text-center"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Ứng Tuyển Ngay
            </button>
          </motion.div>
        ))}
      </div>

      {/* Modal Application Form */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
            />

            {/* Modal Body */}
            <motion.div
              className="relative w-full max-w-lg rounded-2xl border border-white/10 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-container)' }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    className="flex flex-col items-center text-center justify-center py-8 gap-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 animate-bounce">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Ứng tuyển thành công!</h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed max-w-sm">
                      Hồ sơ ứng tuyển cho vị trí <strong>{selectedJob.title}</strong> đã được gửi tới bộ phận Nhân sự CineMate. Chúng tôi sẽ phản hồi lại bạn sớm nhất nếu hồ sơ phù hợp.
                    </p>
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="mt-4 bg-red-600 hover:bg-red-500 text-white transition-colors px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Đóng
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">{selectedJob.dept}</span>
                    <h3 className="text-lg text-white font-bold mt-1 mb-6 pr-6 leading-snug" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Ứng tuyển: {selectedJob.title}
                    </h3>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs sm:text-sm">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-white font-bold text-xs uppercase tracking-wider flex gap-1 items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}><User size={13} /> Họ và tên *</label>
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

                      <div className="flex flex-col gap-1.5">
                        <label className="text-white font-bold text-xs uppercase tracking-wider flex gap-1 items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}><Mail size={13} /> Địa chỉ Email *</label>
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

                      <div className="flex flex-col gap-1.5">
                        <label className="text-white font-bold text-xs uppercase tracking-wider flex gap-1 items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}><FileText size={13} /> Liên kết CV trực tuyến *</label>
                        <input
                          type="url"
                          required
                          value={form.portfolio}
                          onChange={e => setForm({ ...form, portfolio: e.target.value })}
                          placeholder="https://drive.google.com/... hoặc link CV của bạn"
                          style={inputStyle}
                          className="rounded-xl px-4 py-3 outline-none focus:border-red-500/80 transition-all font-medium"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-white font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>Thư giới thiệu ngắn (Không bắt buộc)</label>
                        <textarea
                          rows={3}
                          value={form.intro}
                          onChange={e => setForm({ ...form, intro: e.target.value })}
                          placeholder="Chia sẻ lý do bạn muốn ứng tuyển hoặc giới thiệu bản thân..."
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
                            <Send size={14} /> Nộp Hồ Sơ
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
