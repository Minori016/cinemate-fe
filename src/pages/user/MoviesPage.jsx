import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag, Clock, Globe, MessageSquare } from 'lucide-react'

import maxo from '../../assets/maxo.png'
import lophocamsat from '../../assets/lophocamsat.png'
import kumathong from '../../assets/kumathong.png'
import amazing from '../../assets/amazing.png'
import xacsong from '../../assets/xacsong.png'
import spiderNoir from '../../assets/z7926548056551_31ba8c85180d00c18c1d766965b7f0d5.jpg'
import spiderman from '../../assets/z7926548206262_069a2a65c451a5d7f795d731f2371e47.jpg'
import backrooms from '../../assets/z7926549211322_474665675a42a9e64a53f3c58f96ca9f.jpg'

const MOVIES_NOW_SHOWING = [
  { id: 1, title: 'MA XÓ (T18)', rating: 'T18', format: '2D', img: maxo, genre: 'Kinh Dị', duration: "102'", country: 'Khác', subtitle: 'VN', link: '/booking' },
  { id: 2, title: 'LỚP HỌC ÁM SÁT (T16)', rating: 'T16', format: '2D', img: lophocamsat, genre: 'Học Đường', duration: "110'", country: 'Nhật Bản', subtitle: 'Phụ đề', link: '/booking' },
  { id: 3, title: 'KUMANTHONG (T18)', rating: 'T18', format: '2D', img: kumathong, genre: 'Kinh Dị', duration: "95'", country: 'Thái Lan', subtitle: 'Lồng Tiếng', link: '/booking' },
  { id: 4, title: 'THE AMAZING DIGITAL CIRCUS (K)', rating: 'K', format: '2D', img: amazing, genre: 'Hoạt Hình', duration: "85'", country: 'Mỹ', subtitle: 'Lồng tiếng', link: '/booking' },
  { id: 5, title: 'BẦY XÁC SỐNG (T16)', rating: 'T16', format: '2D', img: xacsong, genre: 'Hành Động, Kinh Dị', duration: "122'", country: 'Hàn Quốc', subtitle: 'Phụ Đề', link: '/booking' },
  { id: 6, title: 'SPIDER NOIR (T13)', rating: 'T13', format: '2D', img: spiderNoir, genre: 'Hành Động, Viễn Tưởng', duration: "120'", country: 'Mỹ', subtitle: 'Phụ Đề', link: '/booking' },
  { id: 7, title: 'SPIDER-MAN: BRAND NEW DAY (K)', rating: 'K', format: '2D', img: spiderman, genre: 'Hành Động, Phiêu Lưu', duration: "135'", country: 'Mỹ', subtitle: 'Lồng Tiếng', link: '/booking' },
  { id: 8, title: 'THE BACKROOMS (T16)', rating: 'T16', format: '2D', img: backrooms, genre: 'Kinh Dị, Bí Ẩn', duration: "90'", country: 'Canada', subtitle: 'Phụ Đề', link: '/booking' }
]

const MOVIES_COMING_SOON = [
  { id: 9, title: 'AVATAR: THE SEED BEARER (T13)', rating: 'T13', format: '3D', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=240', genre: 'Sci-Fi, Phiêu Lưu', duration: "160'", country: 'Mỹ', subtitle: 'Phụ Đề', link: '#' },
  { id: 10, title: 'THÁM TỬ LỪNG DANH CONAN (K)', rating: 'K', format: '2D', img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=240', genre: 'Anime, Trinh Thám', duration: "110'", country: 'Nhật Bản', subtitle: 'Lồng Tiếng', link: '#' }
]

export default function MoviesPage() {
  const [activeTab, setActiveTab] = useState('now') // 'now' or 'soon'
  const currentMovies = activeTab === 'now' ? MOVIES_NOW_SHOWING : MOVIES_COMING_SOON

  return (
    <div className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl text-white tracking-widest uppercase font-extrabold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Danh Sách Phim
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md mx-auto">
          Cập nhật lịch chiếu phim mới nhất, các bom tấn điện ảnh hấp dẫn không thể bỏ lỡ tại CineMate.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => setActiveTab('now')}
          className="px-6 py-2.5 font-bold text-sm tracking-wider uppercase transition-all duration-300 border-b-2"
          style={{
            color: activeTab === 'now' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
            borderColor: activeTab === 'now' ? 'var(--color-primary)' : 'transparent',
            backgroundColor: 'transparent',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          Phim Đang Chiếu
        </button>
        <button
          onClick={() => setActiveTab('soon')}
          className="px-6 py-2.5 font-bold text-sm tracking-wider uppercase transition-all duration-300 border-b-2"
          style={{
            color: activeTab === 'soon' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
            borderColor: activeTab === 'soon' ? 'var(--color-primary)' : 'transparent',
            backgroundColor: 'transparent',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          Phim Sắp Chiếu
        </button>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {currentMovies.map((movie) => (
          <div key={movie.id} className="flex flex-col group cursor-pointer">
            <div className="relative aspect-[2/3] overflow-hidden border border-white/10 shadow-lg mb-4">
              {/* Badge */}
              <div className="absolute top-0 left-0 z-30 flex">
                <span className="bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 border-r border-b border-white/5">{movie.format}</span>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1">{movie.rating}</span>
              </div>
              <img
                src={movie.img}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay details */}
              <div className="absolute inset-0 bg-black/85 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center px-4">
                <h3 className="text-white font-bold text-base mb-4 uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {movie.title}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-red-500" />
                    <span className="text-white text-xs font-semibold">{movie.genre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-red-500" />
                    <span className="text-white text-xs font-semibold">{movie.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-red-500" />
                    <span className="text-white text-xs font-semibold">{movie.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-red-500" />
                    <span className="text-white text-xs font-semibold">{movie.subtitle}</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-white text-center font-bold text-xs mb-3 uppercase line-clamp-2 min-h-[36px] flex items-center justify-center">
              {movie.title}
            </h3>

            {activeTab === 'now' ? (
              <div className="flex items-center justify-between mt-auto px-1">
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-base text-red-500">play_circle</span>
                  <span className="underline decoration-1 underline-offset-2 text-[10px] font-semibold">Trailer</span>
                </button>
                <Link 
                  to={movie.link} 
                  className="text-white text-[10px] font-black px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95 uppercase rounded-sm"
                  style={{
                    background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                    boxShadow: '0 4px 10px rgba(229, 9, 20, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  ĐẶT VÉ
                </Link>
              </div>
            ) : (
              <div className="text-center mt-auto">
                <span className="text-[11px] text-red-500 font-semibold uppercase tracking-wider">SẮP CHIẾU CHI TIẾT</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
