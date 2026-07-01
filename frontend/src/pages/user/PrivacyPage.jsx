import { Eye, Shield, Lock, Users, Radio, CheckCircle } from 'lucide-react'
import { motion } from 'motion/react'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function PrivacyPage() {
  const policies = [
    {
      id: 1,
      icon: Eye,
      title: '1. Thông Tin Chúng Tôi Thu Thập',
      desc: 'Khi sử dụng dịch vụ của CineMate, chúng tôi thu thập các thông tin sau để phục vụ giao dịch:',
      items: [
        'Thông tin đăng ký tài khoản: Họ tên, địa chỉ email, số điện thoại, ngày sinh và giới tính.',
        'Thông tin giao dịch: Lịch sử đặt vé, lịch sử mua combo bắp nước, số tiền thanh toán.',
        'Thông tin kỹ thuật: Địa chỉ IP, loại thiết bị sử dụng, hệ điều hành và lịch sử tương tác trên website.',
      ]
    },
    {
      id: 2,
      icon: Radio,
      title: '2. Cách Thức Sử Dụng Thông Tin',
      desc: 'CineMate sử dụng thông tin thu thập được của khách hàng cho các mục đích chính đáng sau:',
      items: [
        'Xác nhận giao dịch đặt vé trực tuyến và gửi mã vé (mã QR) qua email/SMS.',
        'Tích lũy điểm thưởng thành viên, thăng hạng hội viên và áp dụng các khuyến mãi.',
        'Gửi email thông báo về phim mới, sự kiện đặc biệt và các ưu đãi đặc quyền (nếu bạn đăng ký nhận).',
        'Giải quyết các khiếu nại, hỗ trợ khách hàng và cải thiện trải nghiệm sử dụng website.',
      ]
    },
    {
      id: 3,
      icon: Lock,
      title: '3. Bảo Mật Thông Tin Cá Nhân',
      desc: 'Chúng tôi áp dụng các biện pháp an ninh tối đa để bảo đảm an toàn thông tin cá nhân của bạn khỏi các truy cập trái phép, sử dụng sai mục đích hoặc tiết lộ ngoài ý muốn:',
      items: [
        'Mã hóa dữ liệu truyền tải sử dụng giao thức bảo mật SSL/TLS hiện đại.',
        'Hệ thống cổng thanh toán liên kết đạt tiêu chuẩn bảo mật quốc tế PCI DSS.',
        'Giới hạn nhân viên tiếp cận thông tin cá nhân, chỉ những người có phận sự trực tiếp mới được xử lý dữ liệu.',
      ]
    },
    {
      id: 4,
      icon: Users,
      title: '4. Chia Sẻ Thông Tin Với Bên Thứ Ba',
      desc: 'CineMate cam kết KHÔNG bán, cho thuê hay trao đổi thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại. Chúng tôi chỉ chia sẻ dữ liệu trong các trường hợp:',
      items: [
        'Với các cổng thanh toán liên kết chính thức (Momo, v.v.) để xử lý giao dịch vé.',
        'Khi có yêu cầu chính thức bằng văn bản của cơ quan pháp luật có thẩm quyền theo quy định của pháp luật Việt Nam.',
      ]
    }
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
            <Shield size={24} />
          </div>
        </div>
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Chính Sách Bảo Mật
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto text-center">
          Sự riêng tư và an toàn thông tin cá nhân của khách hàng là ưu tiên hàng đầu tại CineMate.
        </p>
      </motion.div>

      {/* Policies grid */}
      <motion.div
        className="flex flex-col gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger}
      >
        {policies.map((p) => {
          const IconComponent = p.icon
          return (
            <motion.div
              key={p.id}
              variants={fadeUp}
              className="p-6 rounded-2xl border border-white/5"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 60%, transparent)' }}
              whileHover={{ borderColor: 'rgba(255,255,255,0.12)', scale: 1.01, transition: { duration: 0.2 } }}
            >
              <h2 className="text-lg text-white font-bold mb-3 flex items-center gap-2.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                  <IconComponent size={16} />
                </div>
                {p.title}
              </h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 leading-relaxed font-medium">
                {p.desc}
              </p>
              <ul className="flex flex-col gap-2.5">
                {p.items.map((item, index) => (
                  <li key={index} className="flex gap-2.5 items-start text-xs text-[var(--color-on-surface-variant)]/90 leading-relaxed">
                    <CheckCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div 
        className="text-center mt-12 pt-6 border-t border-white/5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p className="text-xs text-gray-500">
          Chính sách bảo mật này được áp dụng cho mọi dịch vụ cung cấp bởi CineMate. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:privacy@cinemate.vn" className="text-red-500 hover:underline">privacy@cinemate.vn</a>.
        </p>
      </motion.div>
    </motion.div>
  )
}
