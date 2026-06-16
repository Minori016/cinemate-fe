import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Tag, Clock, Globe, MessageSquare, Star, Play, X, User, Calendar, DollarSign } from 'lucide-react'
import { movieService } from '../../services/movieService'

// Import assets for mock data
import maxo from '../../assets/maxo.png'
import lophocamsat from '../../assets/lophocamsat.png'
import kumathong from '../../assets/kumathong.png'
import amazing from '../../assets/amazing.png'
import xacsong from '../../assets/xacsong.png'
import spiderNoir from '../../assets/z7926548056551_31ba8c85180d00c18c1d766965b7f0d5.jpg'
import spiderman from '../../assets/z7926548206262_069a2a65c451a5d7f795d731f2371e47.jpg'
import backrooms from '../../assets/z7926549211322_474665675a42a9e64a53f3c58f96ca9f.jpg'

const MOCK_MOVIES = {
  1: {
    title: 'MA XÓ',
    rating: 'T18',
    format: '2D',
    genre: 'Kinh Dị',
    duration: '102 phút',
    country: 'Khác',
    subtitle: 'VN',
    backdrop: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200',
    poster: maxo,
    synopsis: 'Câu chuyện rùng rợn xoay quanh những bí ẩn cổ xưa và linh hồn lang thang trong ngôi làng hẻo lánh, nơi một thế lực đen tối đang trỗi dậy khiến bất kỳ ai đặt chân đến đều phải đối mặt với nỗi khiếp sợ tột cùng.',
    cast: [
      { name: 'Hoàng Yến Chibi', role: 'Mẫn', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' },
      { name: 'Quang Tuấn', role: 'Thầy Huỳnh', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150' }
    ],
    score: '90%',
    scoreValue: 90,
    director: 'Hoàng Nam',
    releaseDate: '13 Tháng 10, 2023',
    budget: '15 Tỷ VND',
    language: 'Tiếng Việt',
    trailerUrl: 'https://www.youtube.com/embed/BTo23ZCJu6E'
  },
  2: {
    title: 'LỚP HỌC ÁM SÁT: GIỜ CỦA CHÚNG TA',
    rating: 'T16',
    format: '2D',
    genre: 'Học Đường',
    duration: '110 phút',
    country: 'Nhật Bản',
    subtitle: 'Phụ đề',
    backdrop: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200',
    poster: lophocamsat,
    synopsis: 'Trận chiến cuối cùng giữa các học sinh lớp 3-E và người thầy bạch tuộc Koro-sensei ngoài hành tinh nhằm giải cứu Trái Đất khỏi nguy cơ bị hủy diệt, đồng thời là lời chia tay đầy xúc động tuổi học trò.',
    cast: [
      { name: 'Ryosuke Yamada', role: 'Nagisa Shiota', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150' },
      { name: 'Masaki Suda', role: 'Karma Akabane', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150' }
    ],
    score: '93%',
    scoreValue: 93,
    director: 'Seiji Kishi',
    releaseDate: '21 Tháng 3, 2015',
    budget: '$10M',
    language: 'Nhật Bản (Phụ đề)',
    trailerUrl: 'https://www.youtube.com/embed/bjkwRzGSe-E'
  },
  3: {
    title: 'KUMANTHONG ÁC QUỶ DẪN ĐƯỜNG',
    rating: 'T18',
    format: '2D',
    genre: 'Kinh Dị',
    duration: '95 phút',
    country: 'Thái Lan',
    subtitle: 'Lồng Tiếng',
    backdrop: 'https://images.unsplash.com/photo-1505635339356-d18d3f447f51?q=80&w=1200',
    poster: kumathong,
    synopsis: 'Những bùa ngải Kumanthong bí ẩn dẫn dắt một gia đình vào chuỗi thảm kịch kinh hoàng đầy oán hận không lời giải, phơi bày những góc khuất đen tối trong lòng tham của con người.',
    cast: [
      { name: 'Ploy Sornarin', role: 'Nội', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150' }
    ],
    score: '88%',
    scoreValue: 88,
    director: 'Thitipan Raksasat',
    releaseDate: '28 Tháng 12, 2023',
    budget: '$5M',
    language: 'Thái Lan (Lồng Tiếng)',
    trailerUrl: 'https://www.youtube.com/embed/sL9Q0r8z5iI'
  },
  4: {
    title: 'THE AMAZING DIGITAL CIRCUS: HỒI KẾT',
    rating: 'K',
    format: '2D',
    genre: 'Hoạt Hình',
    duration: '85 phút',
    country: 'Mỹ',
    subtitle: 'Lồng tiếng',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200',
    poster: amazing,
    synopsis: 'Chuyến phiêu lưu kỳ thú trong thế giới xiếc ảo kỹ thuật số đầy màu sắc nhưng cũng đầy cạm bẫy trớ trêu, nơi các nhân vật phải tìm mọi cách giữ lấy sự tỉnh táo để thoát khỏi vòng lặp vô tận.',
    cast: [
      { name: 'Lizzie Freeman', role: 'Pomni (Voice)', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150' }
    ],
    score: '96%',
    scoreValue: 96,
    director: 'Gooseworx',
    releaseDate: '13 Tháng 10, 2023',
    budget: '$1.5M',
    language: 'Tiếng Anh (Lồng Tiếng)',
    trailerUrl: 'https://www.youtube.com/embed/HwAPLk_sQ3w'
  },
  5: {
    title: 'BẦY XÁC SỐNG',
    rating: 'T16',
    format: '2D',
    genre: 'Hành Động, Kinh Dị',
    duration: '122 phút',
    country: 'Hàn Quốc',
    subtitle: 'Phụ Đề',
    backdrop: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200',
    poster: xacsong,
    synopsis: 'Đại dịch xác sống bùng phát dữ dội, một nhóm người sống sót phải tìm cách vượt qua vùng tử địa đầy rẫy nguy hiểm để đến căn cứ quân sự cuối cùng, thử thách tình người trước ranh giới sinh tử.',
    cast: [
      { name: 'Gong Yoo', role: 'Seok-woo', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150' }
    ],
    score: '91%',
    scoreValue: 91,
    director: 'Yeon Sang-ho',
    releaseDate: '20 Tháng 7, 2016',
    budget: '$8.5M',
    language: 'Hàn Quốc (Phụ đề)',
    trailerUrl: 'https://www.youtube.com/embed/2zQ2e1ySpxs'
  },
  6: {
    title: 'SPIDER NOIR',
    rating: 'T13',
    format: '2D',
    genre: 'Hành Động, Viễn Tưởng',
    duration: '120 phút',
    country: 'Mỹ',
    subtitle: 'Phụ Đề',
    backdrop: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1200',
    poster: spiderNoir,
    synopsis: 'Người Nhện Noir chiến đấu chống lại bọn tội phạm phát xít trong thế giới đen trắng đầy rẫy nguy hiểm của những năm 1930, mang lại một góc nhìn mới lạ, u tối và đầy tính nghệ thuật của thế giới Marvel.',
    cast: [
      { name: 'Nicolas Cage', role: 'Spider-Man Noir', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150' }
    ],
    score: '94%',
    scoreValue: 94,
    director: 'Steve Lightfoot',
    releaseDate: 'Tháng 11, 2024',
    budget: '$90M',
    language: 'Tiếng Anh (Phụ đề)',
    trailerUrl: 'https://www.youtube.com/embed/YZe5438c-S4'
  },
  7: {
    title: 'SPIDER-MAN: BRAND NEW DAY',
    rating: 'K',
    format: '2D',
    genre: 'Hành Động, Phiêu Lưu',
    duration: '135 phút',
    country: 'Mỹ',
    subtitle: 'Lồng Tiếng',
    backdrop: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?q=80&w=1200',
    poster: spiderman,
    synopsis: 'Kỷ nguyên mới mở ra cho Peter Parker khi anh đối mặt với những kẻ thù mới và cố gắng cân bằng cuộc sống cá nhân, cùng các đồng minh mới bảo vệ thành phố New York yên bình.',
    cast: [
      { name: 'Tom Holland', role: 'Peter Parker', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150' }
    ],
    score: '95%',
    scoreValue: 95,
    director: 'Jon Watts',
    releaseDate: '17 Tháng 12, 2021',
    budget: '$200M',
    language: 'Tiếng Anh (Lồng Tiếng)',
    trailerUrl: 'https://www.youtube.com/embed/JfVOs4VSpmA'
  },
  8: {
    title: 'THE BACKROOMS',
    rating: 'T16',
    format: '2D',
    genre: 'Kinh Dị, Bí Ẩn',
    duration: '90 phút',
    country: 'Canada',
    subtitle: 'Phụ Đề',
    backdrop: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200',
    poster: backrooms,
    synopsis: 'Vô tình lạc vào không gian vô tận của các căn phòng màu vàng ám ảnh, nhóm bạn trẻ phải tìm cách thoát thân trước khi sinh vật ẩn nấp tìm ra họ và tiêu diệt từng người một.',
    cast: [
      { name: 'Kane Pixels', role: 'Đạo diễn/Diễn viên', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150' }
    ],
    score: '89%',
    scoreValue: 89,
    director: 'Kane Parsons',
    releaseDate: '7 Tháng 1, 2022',
    budget: '$50,000',
    language: 'Tiếng Anh (Phụ đề)',
    trailerUrl: 'https://www.youtube.com/embed/H4dGvqNjT1M'
  },
  default: {
    title: 'Dune: Part Two',
    rating: 'T13',
    format: '2D/IMAX',
    genre: 'Sci-Fi, Adventure',
    duration: '2h 46m',
    country: 'Mỹ',
    subtitle: 'Phụ Đề',
    backdrop: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpKoeoRMxg66gCjHmMlPV6rUwCZNTmFX4mWnQGJaskDSp4_5Ubf-LV3AchwyZxN_OsBp0m2MSYbJ-W_5np_C_RuOAZqHidzP2V3tR9Gpmz6eCSAJPY3174xWqYyOfsb_pnkaE48QfHc-OphsH5kM6c0Y9aJecqz5vUtez5E16a7cRHzs2q9vqO5DH9uXjbXMaidi6rOBiHcCvlVQAQfoHknCJnld__Z4DM3dGtLcPTss7oGYVVripwqbhOEFF-3sA0wXIXP-Qj9pRJ',
    poster: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRg68exdL5IAca9CTt3nM16izlhD-AkBdrHAuSFRK-C6IV0_15lyb2JwC5r6NkIYB4xCbNmE8DBE66kWndwAmeuPGS38VKAvnV3kMoGQhAXdfMuBEIULbdfJhHV2IPp5rsJTq9DXfXHf_STi5sbjiXLVvn0aT5-7_TVeatSdOHZO_hpKqQrpCgYd1bdkFusYNJPntkV9iWwGG7n7Y-CQQNL5-iWgV4atgxf04SwFs9V_0i7nrTDHNFKWpoy0QWByGBn8Kp4izoY2ud',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtZvuv3U0PHbEC9y425M9pQzA_46zoDav7klCZsOI5PpVHdNwPPfJuMhJVsWzZbEy78sxML0DppmcxvgC5-HbLHMFB3tM6yEYUXtXH0-1PWZGZeNLcNJaYlrukBzTbl0XtGuYToe7DOsS3j2_tl03Po_pnnNTABRLabS8CfjW5o0-6yGOj69RVIoFB0WPrA6-rDORL8jnv171BVZOsK_ZMGk8LFGm0kwIcDVsXV72dN0gS10tSfvsrgGFswKpsVhp22J6c79Dhc_-y' },
      { name: 'Zendaya', role: 'Chani', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp3Zu_XJG3p-OvSCivtrTNBzC-t3tMf-X5Ymq3ASsI78nTYwa0jY0ADBzCPLLrQLvQjZxkzJcYV59bVClGKXLLrM6xB_HrvCP7w1HrGiAp2pino9F0GmTc-MihmsXiV1yDl6oWi0dP004gKynzNBEBt3KZHstqp-Y3axbMnTJ9q0Ft-CI9aQ4P4fZQk7Wsn_RAq2PAxgBFNqcN3tHvEeBQAF9Kt5UINJ7_Cwu1_kCHKPk__hrmaUQKA9RHcp3wY59eXkdOjtt0LiLg' }
    ],
    score: '95%',
    scoreValue: 95,
    director: 'Denis Villeneuve',
    releaseDate: '1 Tháng 3, 2024',
    budget: '$190M',
    language: 'Tiếng Anh (Phụ đề)',
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w'
  }
}

// Sub-components matching user design system
function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`glass-panel rounded-xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)'
      }}
    >
      {children}
    </div>
  )
}

function StarRating({ filled = 4, half = true }) {
  return (
    <div className="flex gap-0.5" style={{ color: 'var(--color-gold)' }}>
      {Array.from({ length: Math.floor(filled) }).map((_, i) => (
        <span key={i} className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
      {half && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star_half</span>}
      {Array.from({ length: 5 - Math.ceil(filled) }).map((_, i) => (
        <span key={i} className="material-symbols-outlined opacity-35" style={{ fontSize: '18px' }}>star</span>
      ))}
    </div>
  )
}

export default function MovieDetailPage() {
  const { movieId } = useParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [trailerHovered, setTrailerHovered] = useState(false)

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'instant' })

    const fetchMovie = async () => {
      try {
        const res = await movieService.getById(movieId)
        const data = res.data?.result ?? res.data
        if (data) {
          setMovie({
            title: data.title,
            rating: data.rating || 'K',
            format: data.format || '2D',
            genre: data.genre || 'Chưa phân loại',
            duration: data.duration ? `${data.duration}'` : 'N/A',
            country: data.country || 'N/A',
            subtitle: data.subtitle || 'Phụ Đề',
            backdrop: data.backdrop || MOCK_MOVIES.default.backdrop,
            poster: data.image || MOCK_MOVIES.default.poster,
            synopsis: data.description || 'Chưa có tóm tắt.',
            cast: MOCK_MOVIES[movieId]?.cast || MOCK_MOVIES.default.cast,
            score: MOCK_MOVIES[movieId]?.score || '95%',
            scoreValue: MOCK_MOVIES[movieId]?.scoreValue || 95,
            director: data.director || MOCK_MOVIES[movieId]?.director || MOCK_MOVIES.default.director,
            releaseDate: data.releaseDate || MOCK_MOVIES[movieId]?.releaseDate || MOCK_MOVIES.default.releaseDate,
            budget: data.budget || MOCK_MOVIES[movieId]?.budget || MOCK_MOVIES.default.budget,
            language: data.subtitle || MOCK_MOVIES[movieId]?.language || MOCK_MOVIES.default.language,
            trailerUrl: data.trailerUrl || MOCK_MOVIES[movieId]?.trailerUrl || MOCK_MOVIES.default.trailerUrl
          })
        } else {
          setMovie(MOCK_MOVIES[movieId] || MOCK_MOVIES.default)
        }
      } catch {
        // Fallback to mocks if BE api fails
        setMovie(MOCK_MOVIES[movieId] || MOCK_MOVIES.default)
      } finally {
        setLoading(false)
      }
    }
    fetchMovie()
  }, [movieId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-4xl">progress_activity</span>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-white gap-4">
        <p className="text-xl">Không tìm thấy thông tin phim!</p>
        <Link to="/" className="text-[var(--color-primary)] hover:underline">Quay về trang chủ</Link>
      </div>
    )
  }

  const getRatingBadge = (rating) => {
    let bgColor = 'bg-blue-600'
    if (rating === 'T18') bgColor = 'bg-red-700'
    else if (rating === 'T16') bgColor = 'bg-red-500'
    else if (rating === 'T13') bgColor = 'bg-orange-500'
    else if (rating === 'K' || rating === 'P') bgColor = 'bg-green-600'
    
    return (
      <span className={`${bgColor} text-white px-2.5 py-1 rounded font-bold text-xs shadow-md uppercase`}>
        {rating}
      </span>
    )
  }

  return (
    <div className="min-h-screen w-full relative pb-20 md:pb-8" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Hero Section ── */}
      <section className="relative w-full overflow-hidden" style={{ height: 'clamp(480px, 65vh, 820px)' }}>
        
        {/* Background image */}
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-[0.6] blur-[2px] md:blur-0 md:brightness-[0.45] transition-all duration-700"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-10 hero-gradient"
        />

        {/* Content bottom-anchored */}
        <div className="absolute bottom-0 w-full left-0 px-6 md:px-12 pb-10 z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-end">

            {/* Poster */}
            <div className="hidden md:block w-44 lg:w-52 flex-shrink-0 z-30">
              <img
                src={movie.poster}
                alt={`${movie.title} poster`}
                className="w-full rounded-xl shadow-2xl border border-white/10 transform hover:scale-[1.02] transition-transform duration-300"
                style={{
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                }}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3 z-30 text-left flex-1 w-full">
              <h1
                className="text-glow-red"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(28px, 5vw, 56px)',
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {movie.title}
              </h1>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {getRatingBadge(movie.rating)}
                <span className="opacity-40">•</span>
                <span>{movie.duration}</span>
                <span className="opacity-40">•</span>
                <span>{movie.genre}</span>
                <span className="opacity-40">•</span>
                <span className="border border-white/15 px-2 py-0.5 rounded text-xs text-white bg-white/5">{movie.format}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  to="/showtimes"
                  className="flex items-center gap-2 py-3 px-8 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:scale-105 active:scale-95 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                    boxShadow: '0 6px 20px rgba(229,9,20,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>confirmation_number</span>
                  Đặt Vé Ngay
                </Link>

                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center gap-2 py-3 px-8 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white/20 hover:bg-white/10 hover:border-white/45 text-white bg-transparent"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>
                  Xem Trailer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Area (Layout Grid 2:1) ── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-30">

        {/* Left: Synopsis + Trailer */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Synopsis */}
          <GlassCard className="p-8">
            <h2
              className="mb-4 text-[var(--color-primary)] font-extrabold uppercase tracking-wider text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Tóm Tắt Nội Dung
            </h2>
            <p className="leading-relaxed text-sm" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
              {movie.synopsis}
            </p>
          </GlassCard>

          {/* Trailer trigger */}
          <GlassCard
            className="overflow-hidden relative cursor-pointer group shadow-2xl"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setIsTrailerOpen(true)}
          >
            <div
              className="relative w-full h-full"
              onMouseEnter={() => setTrailerHovered(true)}
              onMouseLeave={() => setTrailerHovered(false)}
            >
              <img
                src={movie.backdrop}
                alt={`${movie.title} battle scene`}
                className="w-full h-full object-cover transition-all duration-500 opacity-55 scale-[1.01]"
                style={{ opacity: trailerHovered ? 0.75 : 0.55 }}
              />
              {/* Dark vignette */}
              <div className="absolute inset-0 bg-radial-[ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.5)_100%]" />
              
              {/* Play button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-black/60 border border-white/20 group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: '0 0 20px rgba(229,9,20,0.4)' }}
                >
                  <Play className="text-[var(--color-primary)] ml-1" size={24} fill="currentColor" />
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-white bg-black/45 px-4 py-1.5 rounded-full border border-white/5 shadow-md">
                  Xem Official Trailer
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Cast + Score + Details */}
        <div className="flex flex-col gap-6">

          {/* Cast & Crew */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Diễn Viên
              </h2>
              <span className="text-xs font-semibold text-[var(--color-gold)] cursor-pointer hover:underline tracking-wide">
                Xem tất cả
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {movie.cast.map(({ name, role, img }) => (
                <div key={name} className="flex items-center gap-3 group">
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-[var(--color-primary)] transition-all duration-300"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                  >
                    <img src={img} alt={name} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-bold text-white group-hover:text-[var(--color-primary)] transition-colors duration-200 truncate">{name}</p>
                    <p className="m-0 text-xs text-[var(--color-on-surface-variant)] truncate">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Audience Score */}
          <GlassCard className="p-6 flex flex-col">
            <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Đánh Giá Khán Giả
            </h2>

            <div className="flex items-center gap-4 mb-2">
              <span
                className="text-glow-gold text-5xl font-black text-white"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  lineHeight: 1,
                }}
              >
                {movie.score}
              </span>
              <div className="flex flex-col gap-1">
                <StarRating filled={4.5} half={true} />
                <span className="text-[10px] text-[var(--color-on-surface-variant)] font-medium">Sao đánh giá (4.5/5)</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1 font-medium">
              Dựa trên 2,500+ đánh giá đã xác thực.
            </p>

            {/* Score bar progress */}
            <div className="mt-4 rounded-full overflow-hidden bg-white/8 h-1.5 w-full">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${movie.scoreValue}%`, background: `linear-gradient(to right, var(--color-gold), #f59e0b)` }}
              />
            </div>
          </GlassCard>

          {/* Quick info details */}
          <GlassCard className="p-6">
            <h2 className="font-extrabold uppercase tracking-wider text-[var(--color-primary)] text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Thông Tin Phim
            </h2>
            {[
              { icon: <User size={16} />, label: 'Đạo Diễn', value: movie.director },
              { icon: <Calendar size={16} />, label: 'Ngày Chiếu', value: movie.releaseDate },
              { icon: <MessageSquare size={16} />, label: 'Ngôn Ngữ', value: movie.language },
              { icon: <DollarSign size={16} />, label: 'Kinh Phí', value: movie.budget },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-none">
                <span className="text-[var(--color-primary)] opacity-80">{icon}</span>
                <span className="text-xs flex-1 text-[var(--color-on-surface-variant)]" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                <span className="text-xs font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</span>
              </div>
            ))}
          </GlassCard>

        </div>
      </section>

      {/* ── YouTube Video Lightbox Modal ── */}
      {isTrailerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
          
          {/* Close trigger boundary */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsTrailerOpen(false)} />
          
          {/* Close button */}
          <button 
            onClick={() => setIsTrailerOpen(false)}
            className="absolute top-6 right-6 z-[110] w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>

          {/* Iframe wrapper */}
          <div className="w-full max-w-5xl aspect-video px-4 z-[105] relative animate-scale-up">
            <iframe
              title={`${movie.title} Trailer`}
              src={`${movie.trailerUrl}?autoplay=1&rel=0`}
              className="w-full h-full rounded-xl border border-white/10 shadow-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Styles animations */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
