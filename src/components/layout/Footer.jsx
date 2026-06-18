import { Link, useLocation } from "react-router-dom"
import logoImg from "../../assets/Cinematelogo.png"

export default function Footer() {
  const { pathname } = useLocation()

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="pt-14 pb-8 border-t w-full" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.6), rgba(5,5,5,0.85))', borderColor: 'rgba(255,255,255,0.04)' }}>
      <style>{`
        @media (min-width: 768px) {
          .md-cskh-align {
            justify-self: end !important;
            align-items: flex-end !important;
            text-align: right !important;
          }
        }
        .footer-link-custom {
          position: relative;
          width: fit-content;
          transition: text-shadow 0.2s ease-in-out, color 0.2s ease-in-out;
        }
        .footer-link-custom::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 1.5px;
          background-color: var(--color-primary);
          border-radius: 9999px;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 6px var(--color-primary);
        }
        .footer-link-custom:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .footer-link-custom:hover {
          text-shadow: 0 0 6px rgba(229, 9, 20, 0.45);
        }
      `}</style>
      <div
        className="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-8 items-start"
        style={{ 
          maxWidth: '1400px', 
          paddingLeft: 'clamp(2rem, 9vw, 12rem)', 
          paddingRight: 'clamp(2rem, 5vw, 8rem)',
          columnGap: 'clamp(2.5rem, 5.5vw, 6rem)'
        }}
      >
        
        {/* Block 1: Logo & Info */}
        <div className="flex flex-col gap-3">
          <Link 
            to="/" 
            className="text-3xl tracking-tighter transition-opacity hover:opacity-90 flex items-center gap-2" 
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, letterSpacing: '-0.03em', marginLeft: '-20px' }}
            onClick={handleScrollToTop}
          >
            <img src={logoImg} alt="Logo" className="w-14 h-14 object-contain" />
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
            <p><strong style={{ color: 'var(--color-on-surface)' }}>Trụ sở chính:</strong> 135 Đồng Khởi, Q.1, TP.HCM</p>
          </div>
        </div>

        {/* Block 2: Hệ thống rạp */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface)', fontFamily: 'Inter, sans-serif' }}>Hệ Thống Rạp</h3>
          <div className="flex flex-col gap-2 text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            <Link to="/cinemas" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">CineMate Quận 1</Link>
            <Link to="/cinemas" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">CineMate Bình Thạnh</Link>
            <Link to="/cinemas" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">CineMate Gò Vấp</Link>
            <Link to="/cinemas" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">CineMate Thủ Đức</Link>
          </div>
        </div>

        {/* Block 3: Thông tin & Chính sách */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface)', fontFamily: 'Inter, sans-serif' }}>Thông Tin</h3>
          <div className="flex flex-col gap-2 text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            <Link to="/about" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">Giới thiệu</Link>
            <Link to="/terms" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">Điều khoản sử dụng</Link>
            <Link to="/privacy" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">Chính sách bảo mật</Link>
            <Link to="/faqs" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">Câu hỏi thường gặp</Link>
          </div>
        </div>

        {/* Block 4: Chăm sóc khách hàng */}
        <div className="flex flex-col md-cskh-align gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface)', fontFamily: 'Inter, sans-serif' }}>CSKH</h3>
          <div className="flex flex-col md-cskh-align gap-2 text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
            <Link to="/contact" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">Liên hệ</Link>
            <Link to="/feedback" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">Góp ý</Link>
            <Link to="/careers" onClick={handleScrollToTop} className="footer-link-custom hover:text-[var(--color-primary)] transition-colors">Tuyển dụng</Link>
          </div>
        </div>

      </div>

      <div
        className="w-full mx-auto mt-10 pt-6 border-t text-center text-xs"
        style={{ maxWidth: '1400px', paddingLeft: 'clamp(2rem, 9vw, 12rem)', paddingRight: 'clamp(2rem, 5vw, 8rem)', borderColor: 'rgba(255,255,255,0.04)', color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}
      >
        <p className="mx-auto max-w-2xl">© 2026 Cinemate. All rights reserved. Bằng việc sử dụng dịch vụ của Cinemate, bạn đồng ý với các <strong>Điều khoản sử dụng</strong> và <strong>Chính sách bảo mật</strong> của chúng tôi.</p>
        <div className="flex justify-center gap-4 mt-3">
          <a href="#" className="footer-link-custom text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Facebook</a>
          <a href="#" className="footer-link-custom text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Instagram</a>
          <a href="#" className="footer-link-custom text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  )
}
