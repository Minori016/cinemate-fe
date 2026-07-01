import { ShieldCheck, FileText, Calendar, Info } from 'lucide-react'
import { motion } from 'motion/react'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function TermsPage() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sections = [
    {
      id: 1,
      title: '1. Quy Định Chung',
      content: 'Bằng việc truy cập hoặc sử dụng trang web CineMate, bạn đồng ý tuân thủ và chịu sự ràng buộc bởi các Điều khoản sử dụng này. Hệ thống rạp chiếu phim CineMate có quyền thay đổi, chỉnh sửa, thêm hoặc lược bỏ bất kỳ phần nào trong Điều khoản sử dụng này vào bất kỳ lúc nào mà không cần thông báo trước.',
    },
    {
      id: 2,
      title: '2. Tài Khoản & Bảo Mật',
      content: 'Khi đăng ký tài khoản thành viên CineMate, bạn phải cung cấp thông tin cá nhân chính xác, đầy đủ và cập nhật. Bạn chịu trách nhiệm bảo mật mật khẩu của mình và mọi hoạt động diễn ra dưới tài khoản của bạn. CineMate sẽ không chịu trách nhiệm đối với bất kỳ tổn thất nào phát sinh từ việc bạn không bảo mật thông tin tài khoản.',
    },
    {
      id: 3,
      title: '3. Quy Định Đặt Vé & Thanh Toán',
      content: 'Khách hàng có thể mua vé trực tuyến qua website của CineMate hoặc mua trực tiếp tại quầy. Giao dịch mua vé trực tuyến sẽ được xác nhận sau khi hệ thống nhận được thanh toán thành công qua các phương thức thanh toán được hỗ trợ (Momo, Thẻ tín dụng/ghi nợ, v.v.). Giá vé hiển thị là giá vé cuối cùng và đã bao gồm thuế giá trị gia tăng (VAT).',
    },
    {
      id: 4,
      title: '4. Chính Sách Hoàn/Đổi Vé',
      content: 'Vé đã mua trực tuyến thành công KHÔNG thể hoàn tiền, hủy hoặc thay đổi thông tin (như phim, suất chiếu, ghế ngồi). Quyết định này nhằm đảm bảo tính công bằng và vận hành trơn tru của hệ thống đặt ghế tự động. Quý khách vui lòng kiểm tra kỹ thông tin đơn hàng trước khi tiến hành thanh toán.',
    },
    {
      id: 5,
      title: '5. Quy Định Tại Phòng Chiếu',
      content: 'Khách hàng phải tuân thủ mọi quy định phòng chiếu của CineMate bao gồm: Không mang đồ ăn nước uống từ ngoài vào; Không quay phim, chụp ảnh hoặc ghi âm trong phòng chiếu dưới mọi hình thức (vi phạm sẽ bị xử lý theo pháp luật); Giữ gìn trật tự và vệ sinh chung; Tuân thủ độ tuổi quy định của phim (ví dụ: phim T18 chỉ dành cho khán giả từ đủ 18 tuổi trở lên).',
    },
    {
      id: 6,
      title: '6. Quyền Sở Hữu Trí Tuệ',
      content: 'Mọi nội dung trên website CineMate bao gồm văn bản, hình ảnh, đồ họa, logo, biểu tượng, video, mã nguồn đều thuộc sở hữu trí tuệ của CineMate và được bảo hộ bởi luật sở hữu trí tuệ Việt Nam. Nghiêm cấm mọi hành vi sao chép, phân phối hoặc sử dụng trái phép các nội dung này.',
    },
  ]

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
        className="text-center mb-12"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <FileText size={24} />
          </div>
        </div>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Điều Khoản Sử Dụng
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto text-center">
          Vui lòng đọc kỹ các quy định dưới đây trước khi sử dụng dịch vụ của hệ thống rạp CineMate.
        </p>
      </motion.div>

      {/* Date */}
      <motion.div 
        className="flex items-center gap-2 mb-8 justify-center text-xs text-[var(--color-on-surface-variant)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Calendar size={13} className="text-red-500" />
        <span>Cập nhật mới nhất: 18 tháng 6, 2026</span>
      </motion.div>

      {/* Note Warning */}
      <motion.div
        className="p-4 rounded-xl border border-yellow-500/20 mb-8 flex gap-3 items-start"
        style={{ backgroundColor: 'rgba(217,119,6,0.05)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Info size={18} className="text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-500/90 leading-relaxed">
          <strong>Lưu ý quan trọng:</strong> Khi đặt vé qua website CineMate, hệ thống coi như quý khách đã đọc, hiểu và hoàn toàn đồng ý với tất cả các điều khoản, chính sách được nêu tại đây, đặc biệt là quy định không hoàn hủy vé sau khi giao dịch thành công.
        </p>
      </motion.div>

      {/* Content Sections */}
      <motion.div
        className="flex flex-col gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger}
      >
        {sections.map((sec) => (
          <motion.div
            key={sec.id}
            variants={fadeUp}
            className="p-6 rounded-2xl border border-white/5"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)' }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.12)', x: 4, transition: { duration: 0.2 } }}
          >
            <h2 className="text-lg text-white font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <ShieldCheck size={18} className="text-red-500" />
              {sec.title}
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed whitespace-pre-line">
              {sec.content}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="text-center mt-12 pt-6 border-t border-white/5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p className="text-xs text-gray-500">
          Nếu có bất kỳ thắc mắc hoặc câu hỏi nào liên quan đến Điều khoản sử dụng, vui lòng <a href="/contact" className="text-red-500 hover:underline">Liên hệ</a> với Ban quản trị CineMate.
        </p>
      </motion.div>
    </motion.div>
  )
}
