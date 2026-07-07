import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clapperboard, Mail, Phone, MapPin } from 'lucide-react'
import logoImg from '../../assets/Cinematelogo.png'

export default function Footer() {
  return (
    <footer
      className="relative pt-16 pb-8 border-t overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(10,10,10,0.4), rgba(5,5,5,0.9))',
        borderColor: 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(229,9,20,0.3), transparent)',
        }}
      />

      <div
        className="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start"
        style={{ maxWidth: '1200px', paddingLeft: '32px', paddingRight: '32px' }}
      >
        {/* Block 1: Logo & Info */}
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <img src={logoImg} alt="CineMate" className="w-10 h-10 object-contain" />
            <span
              className="text-xl font-black tracking-tight"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span className="text-white">Cine</span>
              <span className="text-[#e50914]">mate</span>
            </span>
          </Link>
          <p
            className="text-sm leading-relaxed max-w-xs"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            Hệ thống rạp chiếu phim chuẩn quốc tế. Trải nghiệm điện ảnh đẳng cấp tại TP. Hồ Chí Minh.
          </p>
        </div>

        {/* Block 2: Hỗ Trợ */}
        <div className="flex flex-col gap-4">
          <h3
            className="text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}
          >
            Hỗ Trợ & Chính Sách
          </h3>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Giới thiệu', to: '/about' },
              { label: 'Liên hệ', to: '/contact' },
              { label: 'Điều khoản sử dụng', to: '/terms' },
              { label: 'Chính sách bảo mật', to: '/privacy' },
              { label: 'Câu hỏi thường gặp', to: '/faqs' },
              { label: 'Góp ý', to: '/feedback' },
              { label: 'Tuyển dụng', to: '/careers' },
            ].map((link) => (
              <FooterLink key={link.label} label={link.label} to={link.to} />
            ))}
          </div>
        </div>

        {/* Block 3: Rạp Chiếu */}
        <div className="flex flex-col gap-4">
          <h3
            className="text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}
          >
            Hệ Thống Rạp
          </h3>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'CineMate Quận 1', to: '/cinemas' },
              { label: 'CineMate Bình Thạnh', to: '/cinemas' },
              { label: 'CineMate Gò Vấp', to: '/cinemas' },
              { label: 'CineMate Thủ Đức', to: '/cinemas' },
            ].map((link) => (
              <FooterLink key={link.label} label={link.label} to={link.to} />
            ))}
          </div>
        </div>

        {/* Block 4: Liên Hệ */}
        <div className="flex flex-col gap-4">
          <h3
            className="text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}
          >
            Liên Hệ
          </h3>
          <div className="flex flex-col gap-3">
            <ContactItem icon={<Phone size={14} />} text="1900 6600" />
            <ContactItem icon={<Mail size={14} />} text="contact@cinemate.vn" />
            <ContactItem
              icon={<MapPin size={14} />}
              text="135 Đồng Khởi, Q.1, TP.HCM"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="w-full mx-auto mt-12 pt-6 border-t text-center"
        style={{
          maxWidth: '1400px',
          paddingLeft: '32px',
          paddingRight: '32px',
          borderColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <p
          className="text-xs mx-auto max-w-2xl"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}
        >
          © 2026 Cinemate. All rights reserved. Bằng việc sử dụng dịch vụ của Cinemate, bạn đồng ý với các{' '}
          <strong style={{ color: 'var(--color-text)' }}>Điều khoản sử dụng</strong> và{' '}
          <strong style={{ color: 'var(--color-text)' }}>Chính sách bảo mật</strong> của chúng tôi.
        </p>
      </div>
    </footer>
  )
}

function FooterLink({ label, to = '/' }) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <Link
      to={to}
      className="text-sm font-medium transition-all duration-200 w-fit inline-block origin-left"
      style={{
        color: isHovered ? '#e50914' : 'var(--color-text-muted)',
        fontFamily: 'Inter, sans-serif',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        textShadow: isHovered ? '0 0 8px rgba(229,9,20,0.6)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {label}
    </Link>
  )
}

function ContactItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
      <span
        className="text-sm"
        style={{ color: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}
      >
        {text}
      </span>
    </div>
  )
}
