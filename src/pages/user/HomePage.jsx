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

import banner1 from '../../assets/banner_spiderman.png'
import banner2 from '../../assets/banner_lophocamsat.png'
import banner3 from '../../assets/banner_backrooms.png'
import banner4 from '../../assets/banner_member.png'

const MOCK_BANNERS = [
  { id: 1, img: banner1, title: 'Spider-man: Brand New Day', link: '/movies/7' },
  { id: 2, img: banner2, title: 'Lớp Học Ám Sát: Giờ Của Chúng Ta', link: '/movies/2' },
  { id: 3, img: banner3, title: 'The Backrooms', link: '/movies/8' },
  { id: 4, img: banner4, title: 'Ưu Đãi Đặc Quyền Thành Viên VIP', link: '/promotions' },
]

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
    link: '/movies/1'
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
    link: '/movies/2'
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
    link: '/movies/3'
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
    link: '/movies/4'
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
    link: '/movies/5'
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
    link: '/movies/6'
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
    link: '/movies/7'
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
    link: '/movies/8'
  }
];

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const location = useLocation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isHoveringBanner, setIsHoveringBanner] = useState(false)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  // Tự động lướt banner quảng cáo mỗi 4 giây
  useEffect(() => {
    if (isHoveringBanner) return
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % MOCK_BANNERS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isHoveringBanner])

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
          {/* Banner Promo Slider (Tự động lướt quảng cáo) */}
          <div 
            className="relative w-full h-[250px] sm:h-[350px] md:h-[420px] lg:h-[500px] overflow-hidden group/banner border-b border-white/5"
            onMouseEnter={() => setIsHoveringBanner(true)}
            onMouseLeave={() => setIsHoveringBanner(false)}
          >
            {/* Slides container */}
            {MOCK_BANNERS.map((banner, index) => {
              const isActive = index === currentBannerIndex;
              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 pointer-events-none'
                  }`}
                >
                  {/* Banner Image */}
                  <Link to={banner.link} className="block w-full h-full relative">
                    <img
                      src={banner.img}
                      alt={banner.title}
                      className="w-full object-cover object-center select-none pointer-events-none"
                      style={{ height: 'calc(100% + 30px)', transform: 'translateY(-30px)' }}
                    />
                    {/* Shadow overlay bottom/top for cinematics */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, var(--color-background) 0%, transparent 20%, transparent 80%, var(--color-background) 100%)',
                      }}
                    />
                  </Link>
                </div>
              );
            })}

            {/* Nút Lùi (Prev Button) */}
            <button
              onClick={() => setCurrentBannerIndex(prev => (prev - 1 + MOCK_BANNERS.length) % MOCK_BANNERS.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-sm border border-white/10"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Nút Tiến (Next Button) */}
            <button
              onClick={() => setCurrentBannerIndex(prev => (prev + 1) % MOCK_BANNERS.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-sm border border-white/10"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            {/* Dots Indicators (Dấu chấm dẹt hiện đại chuẩn Premium) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {MOCK_BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBannerIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentBannerIndex ? 'bg-red-600 w-6' : 'bg-white/40 hover:bg-white/70 w-2'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
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
                    <div key={slide.id} className="w-[240px] flex-shrink-0 snap-center flex flex-col h-full cursor-pointer">
                      
                      {/* Thẻ chứa ảnh và thông tin phim link đến chi tiết phim */}
                      <Link to={slide.link} className="group flex flex-col flex-grow">
                        <div className="relative w-full aspect-[2/3] flex-shrink-0 overflow-hidden border border-white/10 shadow-lg mb-4">
                          <div className="absolute top-0 left-0 z-30 flex">
                            <span className="bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 flex items-center justify-center border-r border-b border-white/5">{slide.format}</span>
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 flex items-center justify-center">{slide.rating}</span>
                          </div>
                          <img
                            src={slide.img}
                            alt={slide.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                          />
                          <div className="absolute inset-0 bg-black/85 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center px-6">
                            <h3 className="text-white font-bold text-xl mb-6 uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>{slide.title}</h3>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-3"><Tag size={18} className="text-red-500" /><span className="text-white text-sm font-semibold">{slide.genre}</span></div>
                              <div className="flex items-center gap-3"><Clock size={18} className="text-red-500" /><span className="text-white text-sm font-semibold">{slide.duration}</span></div>
                              <div className="flex items-center gap-3"><Globe size={18} className="text-red-500" /><span className="text-white text-sm font-semibold">{slide.country}</span></div>
                              <div className="flex items-center gap-3"><MessageSquare size={18} className="text-red-500" /><span className="text-white text-sm font-semibold">{slide.subtitle}</span></div>
                            </div>
                          </div>
                        </div>

                        <h3 className="text-white text-center font-bold text-sm mb-4 uppercase line-clamp-2 min-h-[40px] flex items-center justify-center group-hover:text-red-500 transition-colors">
                          {slide.title}
                        </h3>
                      </Link>

                      {/* Các nút hành động bên dưới */}
                      <div className="flex items-center justify-between mt-auto px-1">
                        <Link to={slide.link} className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-lg text-red-500">play_circle</span>
                          <span className="underline decoration-1 underline-offset-2 text-xs font-semibold">Chi Tiết</span>
                        </Link>
                        <Link 
                          to={slide.link} 
                          className="text-white text-xs font-extrabold px-5 py-2 transition-all duration-200 hover:scale-105 active:scale-95 uppercase rounded-sm"
                          style={{
                            background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                            boxShadow: '0 4px 10px rgba(229, 9, 20, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
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
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === 0 ? 'bg-red-500 scale-125 shadow-[0_0_8px_rgba(229,9,20,0.6)]' : 'bg-white/30 hover:bg-white/50'}`}
                onClick={() => setCurrentIndex(0)}
              />
              <button
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === 4 ? 'bg-red-500 scale-125 shadow-[0_0_8px_rgba(229,9,20,0.6)]' : 'bg-white/30 hover:bg-white/50'}`}
                onClick={() => setCurrentIndex(4)}
              />
            </div>

            {/* Nút XEM THÊM */}
            <div className="flex justify-center mt-8 w-full">
              <Link
                to="/movies"
                className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-wider px-10 py-2.5 text-sm"
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