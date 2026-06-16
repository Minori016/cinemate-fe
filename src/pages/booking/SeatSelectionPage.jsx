import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { movieService } from '../../services/movieService'

// Cấu trúc sơ đồ ghế mặc định
const SEAT_ROWS = [
  { row: 'A', type: 'standard', price: 90000 },
  { row: 'B', type: 'standard', price: 90000 },
  { row: 'C', type: 'vip', price: 110000 },
  { row: 'D', type: 'vip', price: 110000 },
]

// Các ghế đã bán cố định để tăng tính sinh động
const OCCUPIED_SEATS = ['A2', 'A3', 'A4', 'C3', 'C4', 'C5', 'E3']

export default function SeatSelectionPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  
  const movieId = params.get('movie')
  const time = params.get('time') || '19:30'
  const dateStr = params.get('date') || 'Hôm nay'

  const [movie, setMovie] = useState(null)
  const [selected, setSelected] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch thông tin phim từ API
  useEffect(() => {
    if (movieId) {
      setLoading(true)
      movieService.getById(movieId)
        .then(res => {
          setMovie(res.data)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [movieId])

  // Chọn/bỏ chọn ghế
  const toggleSeat = (seatId) => {
    setSelected(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId) 
        : [...prev, seatId]
    )
  }

  // Giá của từng loại ghế
  const getSeatPrice = (seatId) => {
    const row = seatId.charAt(0)
    if (row === 'A' || row === 'B') return 90000
    if (row === 'C' || row === 'D') return 110000
    if (row === 'E') return 130000 // Ghế đôi Couple
    return 0
  }

  // Tính tổng tiền
  const totalPrice = selected.reduce((sum, id) => sum + getSeatPrice(id), 0)

  // Định dạng tiền tệ VNĐ
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Định dạng ngày hiển thị
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hôm nay') return 'Hôm nay'
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080F]">
        <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="bg-[#06080F] text-[#e2e2e2] min-h-screen flex flex-col font-sans selection:bg-purple-900 selection:text-white pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        
        .seat-btn {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .seat-btn:hover:not(.occupied):not(:disabled) {
          transform: scale(1.15);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
        }
        .seat-btn.selected {
          background-color: #F3EA28 !important;
          border-color: #F3EA28 !important;
          color: #06080F !important;
          box-shadow: 0 0 12px #F3EA28;
        }
        .seat-btn.occupied {
          background-color: #282a2b !important;
          border-color: #4e4353 !important;
          color: #6b7280 !important;
          cursor: not-allowed;
          opacity: 0.4;
        }
        .seat-btn.vip {
          border-color: #8b1dd0;
          color: #8b1dd0;
        }
        .seat-btn.couple {
          width: 76px; /* 32px * 2 + 12px gap = 76px */
          border-color: #E02020;
          color: #E02020;
        }
        .seat-btn.couple.selected {
          background-color: #F3EA28 !important;
          border-color: #F3EA28 !important;
          color: #06080F !important;
        }
        .screen-curve {
          background: linear-gradient(to bottom, rgba(139, 29, 208, 0.3) 0%, transparent 100%);
          box-shadow: 0 15px 35px rgba(139, 29, 208, 0.15);
          transform: perspective(200px) rotateX(-5deg);
        }
        .custom-font-title {
          font-family: 'Anton', sans-serif;
        }
      `}</style>

      {/* Transactional Top Navigation */}
      <header className="bg-[#121414]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl flex justify-between items-center w-full px-6 md:px-12 h-20 fixed top-0 left-0 right-0 z-40">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-semibold uppercase tracking-wider"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span>Quay lại</span>
        </button>
        <div className="text-center">
          <h1 className="custom-font-title text-2xl md:text-3xl text-[#F3EA28] tracking-widest uppercase">CineStar</h1>
        </div>
        <div className="w-20"></div> {/* Spacer to keep title centered */}
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-28 px-4 md:px-8 max-w-5xl mx-auto w-full flex flex-col items-center">
        
        {/* Booking Details Summary Header */}
        <div className="w-full text-center mb-10">
          <h2 className="custom-font-title text-3xl md:text-5xl text-purple-400 mb-2 tracking-wide uppercase">
            {movie ? movie.movieNameVn : 'Đang Tải Phim...'}
          </h2>
          <p className="text-sm text-gray-400 flex items-center justify-center flex-wrap gap-4 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              {formatDate(dateStr)}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">schedule</span>
              {time}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">meeting_room</span>
              Phòng Chiếu 03 (IMAX)
            </span>
          </p>
        </div>

        {/* Legend */}
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-wrap justify-center gap-5 md:gap-7 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-500 bg-transparent"></div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Thường</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-[#8b1dd0] bg-transparent text-[#8b1dd0] flex items-center justify-center text-[10px] font-black">V</div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-6 rounded border border-[#E02020] bg-transparent text-[#E02020] flex items-center justify-center text-[10px] font-black">COUPLE</div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Đôi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#F3EA28] shadow-[0_0_8px_rgba(243,234,40,0.5)]"></div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Đang Chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#282a2b] border border-[#4e4353] opacity-40"></div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Đã Bán</span>
          </div>
        </div>

        {/* Seating Layout Area */}
        <div className="w-full flex flex-col items-center select-none">
          {/* Screen curve graphic */}
          <div className="w-4/5 h-16 mb-12 relative flex flex-col items-center justify-start">
            <div className="w-full h-8 screen-curve rounded-[100%] border-t-2 border-purple-500/50"></div>
            <p className="text-[10px] text-purple-400/50 font-bold uppercase tracking-[0.25em] mt-3">Màn Hình Chiếu</p>
          </div>

          {/* Seat Rows Grid Container */}
          <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
            <div className="min-w-[650px] flex flex-col gap-3.5 items-center">
              
              {/* Render Standard & VIP Rows */}
              {SEAT_ROWS.map(r => renderRow(r.row, r.type))}

              {/* Spacer between VIP and Couple rows */}
              <div className="h-2" />

              {/* Render Couple Row (Row E) */}
              {renderCoupleRow()}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action/Checkout Bar */}
      <div className="fixed bottom-0 left-0 w-full z-30 p-4 md:p-6 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-4xl bg-[#1a1c1c]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_-10px_45px_rgba(139,29,208,0.25)] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start flex-grow">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1.5">Ghế đã chọn</span>
            <div className="flex gap-2 flex-wrap justify-center md:justify-start">
              {selected.length === 0 ? (
                <span className="text-sm text-gray-400 italic font-medium">Vui lòng chọn ghế ngồi...</span>
              ) : (
                selected.map(seatId => (
                  <span 
                    key={seatId} 
                    className="px-3.5 py-1 bg-white/5 rounded-lg border border-white/10 text-sm font-bold text-white shadow-inner flex items-center justify-center"
                  >
                    {seatId}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Tổng tiền thanh toán</span>
              <span className="text-xl md:text-2xl font-black text-[#F3EA28] font-mono tracking-tight">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              disabled={selected.length === 0}
              className="bg-[#F3EA28] text-[#06080F] font-bold text-base px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(243,234,40,0.25)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group uppercase tracking-wider cursor-pointer"
            >
              <span>Thanh toán</span>
              <span className="material-symbols-outlined text-lg font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121414] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(139,29,208,0.3)] animate-fade-in text-center relative overflow-hidden">
            {/* Background design glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
            </div>
            
            <h3 className="custom-font-title text-2xl text-[#F3EA28] uppercase tracking-wide mb-2">Đặt Vé Thành Công!</h3>
            <p className="text-sm text-gray-400 mb-6">Cảm ơn bạn đã lựa chọn dịch vụ của CineStar. Chi tiết vé của bạn:</p>

            <div className="bg-white/5 rounded-xl border border-white/5 p-4 text-left space-y-3 mb-6 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Phim:</span>
                <span className="font-bold text-white text-right max-w-[200px] truncate">{movie?.movieNameVn}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Suất chiếu:</span>
                <span className="font-bold text-white">{time} · {formatDate(dateStr)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Phòng chiếu:</span>
                <span className="font-bold text-white">Phòng 03 (IMAX)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Ghế ngồi:</span>
                <span className="font-bold text-white tracking-wider">{selected.join(', ')}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-400 font-semibold">Tổng thanh toán:</span>
                <span className="font-extrabold text-[#F3EA28] text-base">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowModal(false)
                navigate('/')
              }}
              className="w-full bg-[#F3EA28] text-[#06080F] font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all uppercase tracking-wider text-sm cursor-pointer"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      )}
    </div>
  )

  // Render Row Standard hoặc VIP (A, B, C, D)
  function renderRow(rowLabel, type) {
    const seats = [
      { id: `${rowLabel}1`, label: '1' },
      { id: `${rowLabel}2`, label: '2' },
      { type: 'aisle' },
      { id: `${rowLabel}3`, label: '3' },
      { id: `${rowLabel}4`, label: '4' },
      { id: `${rowLabel}5`, label: '5' },
      { id: `${rowLabel}6`, label: '6' },
      { type: 'aisle' },
      { id: `${rowLabel}7`, label: '7' },
      { id: `${rowLabel}8`, label: '8' },
    ]

    return (
      <div key={rowLabel} className="flex items-center justify-center gap-3.5 w-full">
        <span className="w-6 text-center font-bold text-gray-500 text-sm tracking-wide">{rowLabel}</span>
        <div className="flex gap-2">
          {seats.map((seat, index) => {
            if (seat.type === 'aisle') {
              return <div key={`aisle-${index}`} className="w-8 h-8" />
            }

            const isOccupied = OCCUPIED_SEATS.includes(seat.id)
            const isSelected = selected.includes(seat.id)
            const isVip = type === 'vip'

            return (
              <button
                key={seat.id}
                disabled={isOccupied}
                onClick={() => toggleSeat(seat.id)}
                className={`seat-btn w-8 h-8 rounded border flex items-center justify-center text-xs font-bold ${
                  isOccupied ? 'occupied' :
                  isSelected ? 'selected' :
                  isVip ? 'vip border-purple-600/60 text-purple-400 hover:bg-purple-600/10' :
                  'border-gray-600 text-gray-300 hover:bg-white/5'
                }`}
                title={seat.id}
              >
                {isVip && !isSelected && !isOccupied ? 'V' : seat.label}
              </button>
            )
          })}
        </div>
        <span className="w-6 text-center font-bold text-gray-500 text-sm tracking-wide">{rowLabel}</span>
      </div>
    )
  }

  // Render Row Couple (E)
  function renderCoupleRow() {
    const seats = [
      { id: 'E1', label: 'E1' },
      { type: 'aisle' },
      { id: 'E2', label: 'E2' },
      { id: 'E3', label: 'E3' },
      { type: 'aisle' },
      { id: 'E4', label: 'E4' },
    ]

    return (
      <div className="flex items-center justify-center gap-3.5 w-full">
        <span className="w-6 text-center font-bold text-red-500 text-sm tracking-wide">E</span>
        <div className="flex gap-2">
          {seats.map((seat, index) => {
            if (seat.type === 'aisle') {
              return <div key={`aisle-${index}`} className="w-8 h-8" />
            }

            const isOccupied = OCCUPIED_SEATS.includes(seat.id)
            const isSelected = selected.includes(seat.id)

            return (
              <button
                key={seat.id}
                disabled={isOccupied}
                onClick={() => toggleSeat(seat.id)}
                className={`seat-btn couple h-8 rounded border flex items-center justify-center text-xs font-bold ${
                  isOccupied ? 'occupied' :
                  isSelected ? 'selected' :
                  'border-red-600/60 text-red-500 hover:bg-red-600/10'
                }`}
                title={seat.id}
              >
                {seat.label}
              </button>
            )
          })}
        </div>
        <span className="w-6 text-center font-bold text-red-500 text-sm tracking-wide">E</span>
      </div>
    )
  }
}
