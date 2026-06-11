import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { movieService } from '../../services/movieService'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronLeft, ChevronRight, Tag, Clock, Globe, MessageSquare } from 'lucide-react'

import maxo from '../../assets/maxo.png'
import lophocamsat from '../../assets/lophocamsat.png'
import kumathong from '../../assets/kumathong.png'
import amazing from '../../assets/amazing.png'
import xacsong from '../../assets/xacsong.png'
import spiderNoir from '../../assets/z7926548056551_31ba8c85180d00c18c1d766965b7f0d5.jpg'
import spiderman from '../../assets/z7926548206262_069a2a65c451a5d7f795d731f2371e47.jpg'
import backrooms from '../../assets/z7926549211322_474665675a42a9e64a53f3c58f96ca9f.jpg'

const MOCK_SLIDES = [
  {
    id: 1,
    title: 'MA XÓ (T18)',
    rating: 'T18',
    format: '2D',
    img: maxo,
    genre: 'Kinh Dị',
    duration: "102'",
    country: 'Khác',
    subtitle: 'VN',
    link: '/booking/1'
  },
  {
    id: 2,
    title: 'LỚP HỌC ÁM SÁT: GIỜ CỦA CHÚNG TA (T16)',
    rating: 'T16',
    format: '2D',
    img: lophocamsat,
    genre: 'Học Đường',
    duration: "110'",
    country: 'Nhật Bản',
    subtitle: 'Phụ đề',
    link: '/booking/2'
  },
  {
    id: 3,
    title: 'KUMANTHONG ÁC QUỶ DẪN ĐƯỜNG (T18)',
    rating: 'T18',
    format: '2D',
    img: kumathong,
    genre: 'Kinh Dị',
    duration: "95'",
    country: 'Thái Lan',
    subtitle: 'Lồng Tiếng',
    link: '/booking/3'
  },
  {
    id: 4,
    title: 'THE AMAZING DIGITAL CIRCUS: HỒI KẾT (K)',
    rating: 'K',
    format: '2D',
    img: amazing,
    genre: 'Hoạt Hình',
    duration: "85'",
    country: 'Mỹ',
    subtitle: 'Lồng tiếng',
    link: '/booking/4'
  },
  {
    id: 5,
    title: 'BẦY XÁC SỐNG (T16)',
    rating: 'T16',
    format: '2D',
    img: xacsong,
    genre: 'Hành Động, Kinh Dị',
    duration: "122'",
    country: 'Hàn Quốc',
    subtitle: 'Phụ Đề',
    link: '/booking/5'
  },
  {
    id: 6,
    title: 'SPIDER NOIR (T13)',
    rating: 'T13',
    format: '2D',
    img: spiderNoir,
    genre: 'Hành Động, Viễn Tưởng',
    duration: "120'",
    country: 'Mỹ',
    subtitle: 'Phụ Đề',
    link: '/booking/6'
  },
  {
    id: 7,
    title: 'SPIDER-MAN: BRAND NEW DAY (K)',
    rating: 'K',
    format: '2D',
    img: spiderman,
    genre: 'Hành Động, Phiêu Lưu',
    duration: "135'",
    country: 'Mỹ',
    subtitle: 'Lồng Tiếng',
    link: '/booking/7'
  },
  {
    id: 8,
    title: 'THE BACKROOMS (T16)',
    rating: 'T16',
    format: '2D',
    img: backrooms,
    genre: 'Kinh Dị, Bí Ẩn',
    duration: "90'",
    country: 'Canada',
    subtitle: 'Phụ Đề',
    link: '/booking/8'
  }
];

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const location = useLocation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  
  // Nếu user là ADMIN, tự động chuyển hướng vào Admin Dashboard
  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [user, isAdmin, navigate])
  
  // Kiểm tra xem user có đang ở chính xác trang chủ "/" hay không
  const isRoot = location.pathname === '/'

  // Hàm xử lý cuộn phim: load 4 phim 1 lần, quay lại từ đầu nếu hết
  const slideLeft = () => {
    setCurrentIndex(prev => prev === 0 ? 4 : 0)
  }
  const slideRight = () => {
    setCurrentIndex(prev => prev === 4 ? 0 : 4)
  }

  useEffect(() => {
    movieService.getAll()
      .then(r => setMovies(r.data))
      .catch(() => { })
  }, [])

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Chỉ render Banner và Grid Phim khi ở đúng đường dẫn "/" */}
      {isRoot && (
        <>
          {/* Hero Section Cinematic */}
          <div className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
              {/* Bạn có thể thay src bằng hình banner phim thực tế */}
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop"
                alt="Cinematic Background"
                className="w-full h-full object-cover object-center opacity-40"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, var(--color-background) 0%, transparent 60%, var(--color-background) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-primary) 15%, transparent) 0%, transparent 60%)',
                }}
              />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col items-start mt-20">
              <p
                className="mb-4 px-3 py-1 rounded-full border backdrop-blur-md"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: 'var(--color-on-primary-container)',
                  borderColor: 'rgba(255,255,255,0.2)',
                  backgroundColor: 'color-mix(in srgb, var(--color-primary-container) 40%, transparent)',
                }}
              >
                KHÁM PHÁ CINEMATE
              </p>
              
              <h1
                className="text-5xl md:text-7xl mb-6 tracking-tighter"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  color: 'var(--color-on-surface)',
                  lineHeight: '1.1',
                }}
              >
                Trải nghiệm <br />
                <span style={{ color: 'var(--color-primary)' }}>điện ảnh đỉnh cao</span>
              </h1>
              
              <p
                className="max-w-md mb-8 text-lg"
                style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-on-surface-variant)' }}
              >
                Hệ thống rạp chiếu phim chuẩn quốc tế với công nghệ hình ảnh và âm thanh sống động bậc nhất.
              </p>

              <Link
                to="/showtimes"
                className="py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                  color: 'var(--color-on-primary-container)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 4px 14px rgba(229,9,20,0.4)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.4)'}
              >
                <span className="material-symbols-outlined">local_activity</span>
                Đặt Vé Ngay
              </Link>
            </div>
          </div>

          {/* ================= PHẦN PHIM ĐANG CHIẾU ================= */}
          <div className="w-full my-20 relative z-10 flex flex-col items-center">

            {/* Tiêu đề ôm trọn 100% chiều rộng màn hình và căn giữa */}
            <div className="w-full flex justify-center items-center h-[80px] px-6">
              <h2 className="text-3xl md:text-4xl text-center text-white tracking-wide uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, letterSpacing: '2px' }}>
                PHIM ĐANG CHIẾU
              </h2>
            </div>

            {/* Khu vực Slider phim giữ nguyên giới hạn 1100px để căn giữa gọn gàng */}
            <div className="relative group/slider w-full max-w-[1100px] px-6">

              {/* NÚT LÙI TRÁI */}
              <button
                onClick={slideLeft}
                className="absolute left-2 md:-left-6 top-[40%] -translate-y-1/2 z-40 w-12 h-16 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300 rounded-sm backdrop-blur-sm"
              >
                <ChevronLeft size={36} />
              </button>

              {/* TRACK TRƯỢT PHIM */}
              <div className="w-full overflow-hidden">
                <div
                  className="flex gap-6 transition-transform duration-500 ease-in-out pb-8 w-max"
                  style={{
                    transform: `translateX(-${currentIndex * (240 + 24)}px)`,
                  }}
                >
                  {MOCK_SLIDES.map((slide) => (
                    <div key={slide.id} className="w-[240px] flex-shrink-0 snap-center flex flex-col h-full group cursor-pointer">
                      <div className="relative w-full aspect-[2/3] flex-shrink-0 overflow-hidden border border-white/10 shadow-lg mb-4">
                        <div className="absolute top-0 left-0 z-30 flex">
                          <span className="bg-[#fdef22] text-black text-xs font-bold px-2 py-1 flex items-center justify-center">{slide.format}</span>
                          <span className="bg-[#e50914] text-white text-xs font-bold px-2 py-1 flex items-center justify-center">{slide.rating}</span>
                        </div>
                        <img
                          src={slide.img}
                          alt={slide.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                        />
                        <div className="absolute inset-0 bg-black/85 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center px-6">
                          <h3 className="text-white font-bold text-xl mb-6 uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>{slide.title}</h3>
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3"><Tag size={18} className="text-[#fdef22]" /><span className="text-white text-sm font-semibold">{slide.genre}</span></div>
                            <div className="flex items-center gap-3"><Clock size={18} className="text-[#fdef22]" /><span className="text-white text-sm font-semibold">{slide.duration}</span></div>
                            <div className="flex items-center gap-3"><Globe size={18} className="text-[#fdef22]" /><span className="text-white text-sm font-semibold">{slide.country}</span></div>
                            <div className="flex items-center gap-3"><MessageSquare size={18} className="text-[#fdef22]" /><span className="text-white text-sm font-semibold">{slide.subtitle}</span></div>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-white text-center font-bold text-sm mb-4 uppercase line-clamp-2 min-h-[40px] flex items-center justify-center">
                        {slide.title}
                      </h3>

                      <div className="flex items-center justify-between mt-auto px-1">
                        <button className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-lg text-[#e50914]">play_circle</span>
                          <span className="underline decoration-1 underline-offset-2 text-xs font-semibold">Xem Trailer</span>
                        </button>
                        <Link to={slide.link} className="bg-[#fdef22] hover:bg-yellow-400 text-black text-xs font-extrabold px-5 py-2 transition-colors uppercase">
                          ĐẶT VÉ
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NÚT TIẾN PHẢI */}
              <button
                onClick={slideRight}
                className="absolute right-2 md:-right-6 top-[40%] -translate-y-1/2 z-40 w-12 h-16 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300 rounded-sm backdrop-blur-sm"
              >
                <ChevronRight size={36} />
              </button>

            </div>

            {/* Pagination Dấu chấm */}
            <div className="flex justify-center gap-2 mt-2 w-full">
              <button
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === 0 ? 'bg-[#fdef22] scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                onClick={() => setCurrentIndex(0)}
              />
              <button
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === 4 ? 'bg-[#fdef22] scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                onClick={() => setCurrentIndex(4)}
              />
            </div>

            {/* Nút XEM THÊM */}
            <div className="flex justify-center mt-8 w-full">
              <Link
                to="/movies"
                className="border border-[#fdef22] text-[#fdef22] hover:bg-[#fdef22] hover:text-black transition-all duration-300 font-bold uppercase tracking-wider px-10 py-2.5 text-sm"
              >
                XEM THÊM
              </Link>
            </div>

          </div>
          {/* ================= HẾT PHẦN PHIM ĐANG CHIẾU ================= */}
        </>
      )}

      {/* NƠI HIỂN THỊ CÁC TRANG CON (Showtimes, Movie Detail) */}
      <Outlet />

      <style>{`
        /* Ẩn scrollbar trên Webkit (Chrome, Safari, Edge) */
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}