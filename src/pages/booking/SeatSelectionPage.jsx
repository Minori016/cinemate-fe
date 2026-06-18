import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { movieService } from '../../services/movieService'
import { useAuth } from '../../contexts/AuthContext'

// Cấu trúc sơ đồ ghế mặc định
const SEAT_ROWS = [
  { row: 'A', type: 'standard', price: 90000 },
  { row: 'B', type: 'standard', price: 90000 },
  { row: 'C', type: 'standard', price: 90000 },
  { row: 'D', type: 'vip', price: 110000 },
  { row: 'E', type: 'vip', price: 110000 },
  { row: 'F', type: 'vip', price: 110000 },
]

// Các ghế đã bán cố định để tăng tính sinh động
const OCCUPIED_SEATS = [
  'A3', 'A4', 'A8', 'B1', 'B2', 'B11', 'B12',
  'C5', 'C6', 'C7', 'D5', 'D6', 'D7',
  'E4', 'E8', 'E9', 'F6', 'F7',
  'G1', 'H3', 'H5'
]

export default function SeatSelectionPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const movieId = params.get('movie')
  const time = params.get('time') || '19:30'
  const dateStr = params.get('date') || 'Hôm nay'

  const [movie, setMovie] = useState(null)
  const [selected, setSelected] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Seat quantity selection states (AC-01)
  const [seatQuantity, setSeatQuantity] = useState(0)

  // Selection warnings and guide logic (AC-03)
  const getSelectionMessage = () => {
    if (seatQuantity === 0) return 'Vui lòng chọn số lượng ghế để bắt đầu.'
    const diff = seatQuantity - selected.length
    if (diff > 0) {
      return `Please select ${diff} seat more`
    } else if (diff < 0) {
      return `Please select only ${seatQuantity} seat`
    }
    return 'Số lượng ghế đã chọn hợp lệ. Sẵn sàng tiếp tục!'
  }


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
    if (row === 'A' || row === 'B' || row === 'C') return 90000
    if (row === 'D' || row === 'E' || row === 'F') return 110000
    if (row === 'G' || row === 'H') return 130000 // Ghế đôi Couple
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
    <motion.div
      className="bg-[#06080F] text-[#e2e2e2] min-h-screen flex flex-col font-sans selection:bg-red-900 selection:text-white pb-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
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
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: #fff !important;
          box-shadow: 0 0 12px var(--color-primary);
        }
        .seat-btn.occupied {
          background-color: #282a2b !important;
          border-color: #4e4353 !important;
          color: #6b7280 !important;
          cursor: not-allowed;
          opacity: 0.4;
        }
        .seat-btn.vip {
          border-color: #f59e0b;
          color: #f59e0b;
        }
        .seat-btn.couple {
          width: 76px; /* 32px * 2 + 12px gap = 76px */
          border-color: #E02020;
          color: #E02020;
        }
        .seat-btn.couple.selected {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: #fff !important;
        }
        .screen-curve {
          background: linear-gradient(to bottom, rgba(229, 9, 20, 0.3) 0%, transparent 100%);
          box-shadow: 0 15px 35px rgba(229, 9, 20, 0.15);
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
          <h1 className="custom-font-title text-2xl md:text-3xl tracking-widest uppercase" style={{ fontWeight: 900 }}>
            <span className="text-white">Cine</span><span className="text-red-500">mate</span>
          </h1>
        </div>
        <div className="w-20"></div> {/* Spacer to keep title centered */}
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-28 px-4 md:px-8 max-w-5xl mx-auto w-full flex flex-col items-center">
        
        {/* Booking Details Summary Header */}
        <div className="w-full text-center mb-10">
          <h2 className="custom-font-title text-3xl md:text-5xl text-red-500 mb-2 tracking-wide uppercase">
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

        {/* Seat Quantity Selector (AC-01) */}
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-col items-start gap-2.5 mb-8">
          <label className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Số lượng ghế muốn đặt (Select Seat Quantity)
          </label>
          <select
            value={seatQuantity}
            onChange={(e) => {
              const qty = parseInt(e.target.value, 10)
              setSeatQuantity(qty)
              setSelected([]) // Reset selection when quantity changes
            }}
            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(qty => (
              <option key={qty} value={qty} className="bg-[#06080F] text-white">
                {qty} ghế
              </option>
            ))}
          </select>

          {/* Selection guide message (AC-03) */}
          {seatQuantity > 0 && (
            <div 
              className={`w-full text-xs font-bold px-3 py-1.5 rounded-lg border text-center mt-1 transition-all ${
                selected.length === seatQuantity 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
              }`}
            >
              {getSelectionMessage()}
            </div>
          )}
        </div>

        {/* Seat Map Area conditional rendering (AC-02) */}
        {seatQuantity === 0 ? (
          <div 
            className="w-full max-w-2xl text-center py-16 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3.5 mb-10"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
          >
            <span className="material-symbols-outlined text-5xl text-red-500/30">event_seat</span>
            <p className="text-gray-400 font-medium">Vui lòng chọn số lượng ghế ngồi (từ 1 đến 8) để hiển thị sơ đồ ghế.</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-wrap justify-center gap-5 md:gap-7 mb-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-gray-500 bg-transparent"></div>
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Thường</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-[#f59e0b] bg-transparent text-[#f59e0b] flex items-center justify-center text-[10px] font-black">V</div>
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-6 rounded border border-[#E02020] bg-transparent text-[#E02020] flex items-center justify-center text-[10px] font-black">COUPLE</div>
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Đôi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,9,20,0.5)]"></div>
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
                <div className="w-full h-8 screen-curve rounded-[100%] border-t-2 border-red-500/50"></div>
                <p className="text-[10px] text-red-500/50 font-bold uppercase tracking-[0.25em] mt-3">Màn Hình Chiếu</p>
              </div>

              {/* Seat Rows Grid Container */}
              <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
                <div className="min-w-[850px] flex flex-col gap-3.5 items-center">
                  
                  {/* Render Standard & VIP Rows */}
                  {SEAT_ROWS.map(r => renderRow(r.row, r.type))}

                  {/* Spacer between VIP and Couple rows */}
                  <div className="h-4" />

                  {/* Render Couple Rows (Row G & H) */}
                  {renderCoupleRow('G')}
                  {renderCoupleRow('H')}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Bottom Action/Checkout Bar */}
      <div className="fixed bottom-0 left-0 w-full z-30 p-4 md:p-6 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-4xl bg-[#1a1c1c]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_-10px_45px_rgba(229,9,20,0.25)] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start flex-grow text-left">
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
            {seatQuantity > 0 && selected.length !== seatQuantity && (
              <span className="text-xs font-bold text-yellow-400 mt-2 text-left block">
                {getSelectionMessage()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Tổng tiền thanh toán</span>
              <span className="text-xl md:text-2xl font-black text-red-500 font-mono tracking-tight">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            
            <button
              onClick={() => {
                const isManagerOrAdmin = user?.roles?.includes('MANAGER') || user?.roles?.includes('ADMIN')
                const redirectPath = isManagerOrAdmin ? '/manager/booking/confirm' : '/booking/confirm'
                navigate(redirectPath, {
                  state: {
                    movie: movie,
                    movieId: movieId,
                    time: time,
                    date: dateStr,
                    seats: selected,
                    totalPrice: totalPrice,
                    screen: 'Phòng Chiếu 03 (IMAX)'
                  }
                })
              }}
              disabled={selected.length !== seatQuantity || seatQuantity === 0}
              className="bg-[var(--color-primary)] text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(229,9,20,0.25)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group uppercase tracking-wider cursor-pointer border-none"
            >
              <span>Tiếp tục (Continue)</span>
              <span className="material-symbols-outlined text-lg font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121414] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(229,9,20,0.3)] animate-fade-in text-center relative overflow-hidden">
            {/* Background design glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
            </div>
            
            <h3 className="custom-font-title text-2xl text-[var(--color-primary)] uppercase tracking-wide mb-2">Đặt Vé Thành Công!</h3>
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
                <span className="font-extrabold text-[var(--color-primary)] text-base">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowModal(false)
                navigate('/')
              }}
              className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all uppercase tracking-wider text-sm cursor-pointer border-none"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )

  // Sub-component button for single seats
  function renderSeatButton(seat, type) {
    const isOccupied = OCCUPIED_SEATS.includes(seat.id)
    const isSelected = selected.includes(seat.id)
    const isVip = type === 'vip'

    return (
      <label
        key={seat.id}
        className={`seat-btn w-8 h-8 rounded border flex items-center justify-center text-xs font-bold relative ${
          isOccupied ? 'occupied cursor-not-allowed opacity-40' :
          isSelected ? 'selected cursor-pointer' :
          isVip ? 'vip border-[#f59e0b]/60 text-[#f59e0b] hover:bg-[#f59e0b]/10 cursor-pointer' :
          'border-gray-600 text-gray-300 hover:bg-white/5 cursor-pointer'
        }`}
        title={seat.id}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isOccupied}
          onChange={() => toggleSeat(seat.id)}
          className="sr-only"
        />
        {isVip && !isSelected && !isOccupied ? 'V' : seat.label}
      </label>
    )
  }

  // Sub-component button for couple seats
  function renderCoupleButton(seat) {
    const isOccupied = OCCUPIED_SEATS.includes(seat.id)
    const isSelected = selected.includes(seat.id)

    return (
      <label
        key={seat.id}
        className={`seat-btn couple h-8 rounded border flex items-center justify-center text-xs font-bold relative ${
          isOccupied ? 'occupied cursor-not-allowed opacity-40' :
          isSelected ? 'selected cursor-pointer' :
          'border-red-600/60 text-red-500 hover:bg-red-600/10 cursor-pointer'
        }`}
        title={seat.id}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isOccupied}
          onChange={() => toggleSeat(seat.id)}
          className="sr-only"
        />
        {seat.label}
      </label>
    )
  }

  // Render Row Standard hoặc VIP (A -> F)
  function renderRow(rowLabel, type) {
    const isVip = type === 'vip'
    const leftSeats = [
      { id: `${rowLabel}1`, label: '1' },
      { id: `${rowLabel}2`, label: '2' },
      { id: `${rowLabel}3`, label: '3' },
    ]
    const centerSeats = [
      { id: `${rowLabel}4`, label: '4' },
      { id: `${rowLabel}5`, label: '5' },
      { id: `${rowLabel}6`, label: '6' },
      { id: `${rowLabel}7`, label: '7' },
      { id: `${rowLabel}8`, label: '8' },
      { id: `${rowLabel}9`, label: '9' },
    ]
    const rightSeats = [
      { id: `${rowLabel}10`, label: '10' },
      { id: `${rowLabel}11`, label: '11' },
      { id: `${rowLabel}12`, label: '12' },
    ]

    return (
      <div key={rowLabel} className="flex items-center justify-center gap-3.5 w-full">
        <span className="w-6 text-center font-bold text-gray-500 text-sm tracking-wide">{rowLabel}</span>
        
        <div className="flex items-center gap-3">
          {/* Nhóm ghế trái */}
          <div className="flex gap-2">
            {leftSeats.map(seat => renderSeatButton(seat, type))}
          </div>

          {/* Lối đi 1 */}
          <div className="w-6 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-40">│</div>

          {/* Nhóm ghế trung tâm */}
          <div 
            className={`flex gap-2 p-1 rounded-xl transition-all ${
              isVip 
                ? 'border border-dashed border-[#f59e0b]/40 bg-[#f59e0b]/5 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)] relative' 
                : 'border border-transparent'
            }`}
          >
            {isVip && rowLabel === 'D' && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-[#f59e0b] bg-[#06080F] px-1.5 tracking-widest whitespace-nowrap border border-[#f59e0b]/20 rounded-full select-none">
                VÙNG TRUNG TÂM (BEST VIEW)
              </span>
            )}
            {centerSeats.map(seat => renderSeatButton(seat, type))}
          </div>

          {/* Lối đi 2 */}
          <div className="w-6 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-40">│</div>

          {/* Nhóm ghế phải */}
          <div className="flex gap-2">
            {rightSeats.map(seat => renderSeatButton(seat, type))}
          </div>
        </div>

        <span className="w-6 text-center font-bold text-gray-500 text-sm tracking-wide">{rowLabel}</span>
      </div>
    )
  }

  // Render Row Couple (G, H)
  function renderCoupleRow(rowLabel) {
    const leftCouple = [{ id: `${rowLabel}1`, label: `${rowLabel}1` }]
    const centerCouples = [
      { id: `${rowLabel}2`, label: `${rowLabel}2` },
      { id: `${rowLabel}3`, label: `${rowLabel}3` },
      { id: `${rowLabel}4`, label: `${rowLabel}4` },
    ]
    const rightCouple = [{ id: `${rowLabel}5`, label: `${rowLabel}5` }]

    return (
      <div key={rowLabel} className="flex items-center justify-center gap-3.5 w-full">
        <span className="w-6 text-center font-bold text-red-500 text-sm tracking-wide">{rowLabel}</span>
        
        <div className="flex items-center gap-3">
          {/* Nhóm trái (1 ghế đôi) */}
          <div className="flex gap-2 w-[112px] justify-end">
            {leftCouple.map(seat => renderCoupleButton(seat))}
          </div>

          {/* Lối đi 1 */}
          <div className="w-6 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-40">│</div>

          {/* Nhóm giữa (3 ghế đôi) */}
          <div className="flex gap-2 p-1 rounded-xl border border-dashed border-red-500/20 bg-red-950/5">
            {centerCouples.map(seat => renderCoupleButton(seat))}
          </div>

          {/* Lối đi 2 */}
          <div className="w-6 h-8 flex items-center justify-center text-[10px] text-gray-600 font-bold select-none opacity-40">│</div>

          {/* Nhóm phải (1 ghế đôi) */}
          <div className="flex gap-2 w-[112px] justify-start">
            {rightCouple.map(seat => renderCoupleButton(seat))}
          </div>
        </div>

        <span className="w-6 text-center font-bold text-red-500 text-sm tracking-wide">{rowLabel}</span>
      </div>
    )
  }
}
