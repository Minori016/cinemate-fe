import { useState } from 'react'
import { HelpCircle, ChevronDown, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const FAQS = [
  {
    id: 1,
    q: 'Làm thế nào để đặt vé xem phim trực tuyến tại CineMate?',
    a: 'Bạn chỉ cần chọn bộ phim đang chiếu yêu thích từ Trang chủ, nhấn "Đặt Vé", chọn Suất chiếu (ngày giờ), chọn Ghế ngồi và tiến hành thanh toán qua ví điện tử Momo hoặc Thẻ ngân hàng. Mã đặt vé QR sẽ lập tức hiển thị trên màn hình và gửi về email đã đăng ký của bạn.'
  },
  {
    id: 2,
    q: 'Vé đã mua trực tuyến thành công có được hoàn tiền hoặc thay đổi không?',
    a: 'Theo quy định sử dụng dịch vụ của CineMate, tất cả các vé đã mua thành công trực tuyến đều KHÔNG THỂ hủy, đổi trả hoặc hoàn tiền dưới bất kỳ hình thức nào. Vui lòng kiểm tra thật kỹ các thông tin về phim, rạp chiếu, ngày chiếu, giờ chiếu và số lượng ghế trước khi thanh toán.'
  },
  {
    id: 3,
    q: 'Tôi đã thanh toán thành công nhưng không nhận được email mã vé QR?',
    a: 'Trước hết, bạn hãy kiểm tra mục Thư rác (Spam) trong hộp thư email của bạn. Hoặc bạn có thể truy cập vào trang Cá nhân trên website, vào phần "Lịch sử đặt vé" để xem và chụp lại mã QR vé. Nếu vẫn không thấy, bạn hãy gọi hotline 1900 6868 hoặc mang biên nhận thanh toán đến quầy vé để được nhân viên hỗ trợ.'
  },
  {
    id: 4,
    q: 'Làm cách nào để tích điểm và đổi quà thành viên?',
    a: 'Khi đặt vé trực tuyến khi đã đăng nhập hoặc mua trực tiếp tại quầy bằng cách đọc số điện thoại thành viên, hệ thống sẽ tự động tích điểm 5% - 10% giá trị hóa đơn. Số điểm này có thể dùng để đổi vé xem phim miễn phí hoặc các phần bắp nước hấp dẫn ngay tại tài khoản cá nhân.'
  },
  {
    id: 5,
    q: 'Tôi có thể mang đồ ăn thức uống từ ngoài vào phòng chiếu của CineMate không?',
    a: 'Nhằm bảo đảm vệ sinh, không gian thoải mái và an toàn vệ sinh thực phẩm trong phòng chiếu, CineMate quy định khách hàng không được phép mang các loại thức ăn, nước uống mua từ bên ngoài vào rạp. Bạn có thể chọn mua bắp nước thơm ngon trực tiếp tại quầy bắp nước của chúng tôi.'
  },
  {
    id: 6,
    q: 'Quy định về độ tuổi phân loại phim (T18, T16, T13, K, P) là gì?',
    a: 'CineMate tuân thủ quy định phân loại phim của Bộ Văn hóa, Thể thao và Du lịch:\n- P: Phổ biến đến mọi đối tượng.\n- K: Được phổ biến đến người xem dưới 13 tuổi với điều kiện xem cùng cha, mẹ hoặc người giám hộ.\n- T13: Dành cho khán giả từ đủ 13 tuổi trở lên.\n- T16: Dành cho khán giả từ đủ 16 tuổi trở lên.\n- T18: Dành cho khán giả từ đủ 18 tuổi trở lên. Nhân viên có quyền yêu cầu xuất trình CCCD/Hộ chiếu để xác nhận độ tuổi khi kiểm tra vé.'
  }
]

export default function FaqPage() {
  const [openId, setOpenId] = useState(null)

  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <motion.div
      className="min-h-screen py-10 px-4 md:px-8 max-w-3xl mx-auto text-left"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Title */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <HelpCircle size={24} />
          </div>
        </div>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Câu Hỏi Thường Gặp
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto text-center">
          Giải đáp nhanh chóng các thắc mắc phổ biến của khách hàng về đặt vé và dịch vụ tại CineMate.
        </p>
      </motion.div>

      {/* FAQs List */}
      <div className="flex flex-col gap-4">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id
          return (
            <div
              key={faq.id}
              className="rounded-2xl border transition-all duration-300"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)',
                borderColor: isOpen ? 'rgba(229,9,20,0.35)' : 'rgba(255,255,255,0.05)',
                boxShadow: isOpen ? '0 8px 24px rgba(229,9,20,0.06)' : 'none'
              }}
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex justify-between items-center p-5 text-left border-none outline-none bg-transparent cursor-pointer font-bold text-white text-sm sm:text-base select-none gap-4"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <span className="flex items-center gap-3">
                  <MessageSquare size={16} className={`shrink-0 ${isOpen ? 'text-red-500' : 'text-gray-400'}`} />
                  {faq.q}
                </span>
                <ChevronDown
                  size={18}
                  className="text-gray-400 shrink-0 transition-transform duration-300"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--color-on-surface-variant)]/90 leading-relaxed border-t border-white/5 pt-4 whitespace-pre-line">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <motion.div 
        className="text-center mt-12 pt-6 border-t border-white/5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p className="text-xs text-gray-500">
          Chưa tìm thấy câu trả lời? Vui lòng <a href="/contact" className="text-red-500 hover:underline">gửi tin nhắn trực tiếp</a> hoặc liên hệ Hotline <strong>1900 6868</strong> để được giải đáp.
        </p>
      </motion.div>
    </motion.div>
  )
}
