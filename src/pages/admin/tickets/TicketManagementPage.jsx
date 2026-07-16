import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import Table from '../../../components/common/Table'
import { X, CheckCircle, Ticket, Calendar, Clock, DollarSign, User, Loader2 } from 'lucide-react'
import { bookingService } from '../../../services/bookingService'

// Removed INITIAL_BOOKINGS mock data

const getSeatCount = (seats) => {
  if (!seats) return 1
  if (Array.isArray(seats)) return seats.length
  return seats.split(',').map(s => s.trim()).filter(Boolean).length
}

export default function TicketManagementPage() {
  const location = useLocation()
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [successBanner, setSuccessBanner] = useState(location.state?.successMessage || '')

  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [convertOption, setConvertOption] = useState('no')
  const [convertTicketsCount, setConvertTicketsCount] = useState(0)

  const [loading, setLoading] = useState(false)

  // Fetch real data from API (AC-01)
  const loadBookings = async () => {
    try {
      setLoading(true)
      const res = await bookingService.getAllAdminBookings()
      const data = res.data?.result || res.data
      setBookings(data)
    } catch (error) {
      console.error('Failed to load bookings', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking)
    setConvertOption('no')
    setConvertTicketsCount(0)
  }

  const handleFinalizeBooking = async () => {
    if (!selectedBooking) return

    try {
      // Call confirm API
      await bookingService.confirm(selectedBooking.id)
      setSuccessBanner(`Đã xác nhận booking ${selectedBooking.id} thành công!`)
      setSelectedBooking(null)
      loadBookings() // refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xác nhận booking. Vui lòng thử lại.')
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  // (Storage listener removed since we use API)

  const filtered = bookings.filter(b =>
    b.id?.toLowerCase().includes(search.toLowerCase()) ||
    b.memberId?.toLowerCase().includes(search.toLowerCase()) ||
    b.phone?.includes(search) ||
    b.idCard?.includes(search)
  )

  const columns = [
    { key: 'id', label: 'Booking ID' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'movieName', label: 'Movie Title' },
    { key: 'showtime', label: 'Showtime', render: row => `${row.date} - ${row.showtime}` },
  ]

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  return (
    <motion.div
      className="space-y-6 text-left"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="shrink-0" size={16} />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-400 hover:text-emerald-300 transition-colors bg-transparent border-0 outline-none cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
        <div>
          <h1 
            className="text-4xl text-gray-900 font-bold tracking-wider uppercase" 
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý đặt vé
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Xem danh sách đặt vé của khách hàng, đối chiếu thông tin giao dịch và kiểm tra trạng thái vé.
          </p>
        </div>
        <input 
          placeholder="Tìm theo Booking ID, CCCD, SĐT..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 w-80 transition-colors shadow-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </div>

      {/* Bookings Table List */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl p-4">
        {filtered.length > 0 ? (
          <Table
            columns={columns}
            data={filtered}
            actions={row => (
              <button
                onClick={() => handleSelectBooking(row)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center gap-1.5 ml-auto"
              >
                <CheckCircle size={13} />
                Successful Booking
              </button>
            )}
          />
        ) : (
          <div className="text-center py-12 text-[var(--color-text-muted)] font-semibold flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-4xl text-gray-600">search_off</span>
            <span className="text-sm">No booking found!</span>
          </div>
        )}
      </div>

      {/* Detailed Customer Booking Information Modal (AC-03 & AC-05) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center bg-white/5">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white flex items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                <Ticket size={16} className="text-emerald-400" />
                Chi tiết giao dịch đặt vé (Booking Details)
              </h4>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-[var(--color-text-muted)] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[480px] overflow-y-auto">
              {/* Ticket Information Section (AC-01 & AC-02) */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                  <span>🎟️</span> Thông tin vé (Ticket Information)
                </h5>
                
                {/* Labels instead of inputs to prevent edits (AC-05) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Tên Phim (Movie Name)</span>
                    <span className="text-sm font-extrabold text-white mt-1 block leading-snug">{selectedBooking.movie}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Booking ID</span>
                    <span className="text-xs font-black text-white mt-1 block font-mono">{selectedBooking.id}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Phòng Chiếu (Screen)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">{selectedBooking.screen}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Ngày Chiếu (Date)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">{selectedBooking.date}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Suất Chiếu (Time)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">{selectedBooking.showtime}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Ghế Ngồi (Seat)</span>
                    <span className="text-xs font-black text-[var(--color-primary-container)] mt-1 block">{selectedBooking.seatNames?.join(', ')}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Giá Vé (Price)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">{formatVND(selectedBooking.totalAmount / (selectedBooking.seatNames?.length || 1))}</span>
                  </div>

                  <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Tổng tiền (Total)</span>
                    <span className="text-sm font-black text-emerald-400 mt-1 block">
                      {selectedBooking.status !== 'CONFIRMED' && convertOption === 'yes'
                        ? formatVND(Math.max(0, selectedBooking.totalAmount - (convertTicketsCount * (selectedBooking.totalAmount / (selectedBooking.seatNames?.length || 1)))))
                        : formatVND(selectedBooking.totalAmount)
                      }
                    </span>
                  </div>

                  {/* Converted points fields (AC-02) */}
                  {selectedBooking.convertTickets > 0 && (
                    <>
                      <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-yellow-500 block">Convert to Ticket</span>
                        <span className="text-xs font-extrabold text-white mt-1 block">{selectedBooking.convertTickets} vé</span>
                      </div>
                      <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-yellow-500 block">Score for Ticket Converting</span>
                        <span className="text-xs font-extrabold text-white mt-1 block">{selectedBooking.scoreUsed} điểm</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Member Information Section (AC-03 / AC-01) */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                  <User size={14} className="text-red-400" />
                  Thông tin thành viên (Member Information)
                </h5>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Mã Thành Viên (Member ID)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block font-mono">MEM-{selectedBooking.id?.substring(0,6).toUpperCase()}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Họ Tên Khách Hàng (Full Name)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">{selectedBooking.customerName}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Điểm tích lũy (Member Score)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block font-mono">{selectedBooking.memberScore || 0}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Số Điện Thoại</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">{selectedBooking.phoneNumber}</span>
                  </div>

                  <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Email</span>
                    <span className="text-xs font-extrabold text-white mt-1 block truncate" title={selectedBooking.email}>{selectedBooking.email}</span>
                  </div>
                </div>
              </div>

              {/* Score Conversion Option (AC-02, AC-03) */}
              {selectedBooking.status !== 'CONFIRMED' && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                    <span>🪙</span> Quy đổi điểm thành viên (Member Score Conversion)
                  </h5>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs font-medium text-gray-300">Quy đổi điểm thành viên sang vé?</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                          <input
                            type="radio"
                            name="convertOption"
                            value="no"
                            checked={convertOption === 'no'}
                            onChange={() => {
                              setConvertOption('no')
                              setConvertTicketsCount(0)
                            }}
                            className="accent-red-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Không quy đổi</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                          <input
                            type="radio"
                            name="convertOption"
                            value="yes"
                            checked={convertOption === 'yes'}
                            onChange={() => {
                              setConvertOption('yes')
                              setConvertTicketsCount(1)
                            }}
                            className="accent-red-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Quy đổi sang vé</span>
                        </label>
                      </div>
                    </div>

                    {convertOption === 'yes' && (
                      <div className="space-y-3 pt-2 border-t border-white/5 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-[10px] uppercase font-bold text-gray-400">Chọn số vé muốn đổi (1000 điểm / vé)</label>
                          <select
                            value={convertTicketsCount}
                            onChange={(e) => setConvertTicketsCount(parseInt(e.target.value, 10))}
                            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl py-2 px-3 outline-none text-xs text-white focus:border-red-500 cursor-pointer min-w-[100px]"
                          >
                            {Array.from({ length: getSeatCount(selectedBooking.seatNames) }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1} vé</option>
                            ))}
                          </select>
                        </div>

                        {selectedBooking.memberScore < convertTicketsCount * 1000 && (
                          <div className="text-xs text-red-500 font-bold flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                            <span>⚠️</span>
                            <span>Not enough score to convert into ticket</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[var(--color-border)] bg-slate-900/40 flex justify-end gap-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all cursor-pointer"
              >
                Đóng
              </button>
              {selectedBooking.status !== 'CONFIRMED' ? (
                <button
                  onClick={handleFinalizeBooking}
                  disabled={convertOption === 'yes' && (selectedBooking.memberScore || 0) < convertTicketsCount * 1000}
                  className="px-5 py-3 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Confirm Booking
                </button>
              ) : (
                <button
                  disabled
                  className="px-5 py-3 text-xs bg-gray-700 text-gray-400 font-bold rounded-xl border border-white/5"
                >
                  Đã xác nhận thành công
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
