import { Link, useLocation } from "react-router-dom"
import logoImg from "../../assets/logo.jpg"

export default function Footer() {
  const { pathname } = useLocation()

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="pt-14 pb-8 border-t" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.6), rgba(5,5,5,0.85))', borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-start">
        
        {/* Block 1: Logo & Info */}
        <div className="flex flex-col gap-3">
          <Link 
            to="/" 
            className="text-3xl tracking-tighter transition-opacity hover:opacity-90 flex items-center gap-2" 
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, letterSpacing: '-0.03em' }}
            onClick={handleScrollToTop}
          >
            <img src={logoImg} alt="Logo" className="w-9 h-9 rounded-full object-cover border border-white/10" />
            <div className="flex items-center">
              <span style={{ color: '#FFFFFF' }}>Cine</span>
              <span style={{ color: 'var(--color-primary)' }}>mate</span>
            </div>
          </Link>
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            Hệ thống rạp chiếu phim chuẩn quốc tế
          </p>
          <div className="text-sm flex flex-col gap-1 mt-2" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            <p><strong style={{ color: 'var(--color-on-surface)' }}>Hotline:</strong> 1900 6868</p>
            <p><strong style={{ color: 'var(--color-on-surface)' }}>Email:</strong> contact@cinemate.vn</p>
          </div>
        </div>

        {/* Block 2: Hệ thống rạp */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface)', fontFamily: 'Inter, sans-serif' }}>Hệ Thống Rạp</h3>
          <div className="flex flex-col gap-2 text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Cinemate TP.HCM</Link>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Cinemate Hà Nội</Link>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Cinemate Đà Nẵng</Link>
          </div>
        </div>

        {/* Block 3: Thông tin & Chính sách */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface)', fontFamily: 'Inter, sans-serif' }}>Thông Tin</h3>
          <div className="flex flex-col gap-2 text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Giới thiệu</Link>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Điều khoản sử dụng</Link>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Chính sách bảo mật</Link>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Câu hỏi thường gặp</Link>
          </div>
        </div>

        {/* Block 4: Chăm sóc khách hàng */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface)', fontFamily: 'Inter, sans-serif' }}>CSKH</h3>
          <div className="flex flex-col gap-2 text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Liên hệ</Link>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Góp ý</Link>
            <Link to="/" onClick={handleScrollToTop} className="hover:text-[var(--color-primary)] transition-colors">Tuyển dụng</Link>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t text-center text-xs" style={{ borderColor: 'rgba(255,255,255,0.04)', color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
        <p className="mx-auto max-w-2xl">© 2026 Cinemate. All rights reserved. Bằng việc sử dụng dịch vụ của Cinemate, bạn đồng ý với các <strong>Điều khoản sử dụng</strong> và <strong>Chính sách bảo mật</strong> của chúng tôi.</p>
        <div className="flex justify-center gap-4 mt-3">
          <a href="#" className="text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Facebook</a>
          <a href="#" className="text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Instagram</a>
          <a href="#" className="text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  )
}
