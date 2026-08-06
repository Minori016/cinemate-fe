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
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [dateType, setDateType] = useState('created') // 'created' or 'showtime'
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

  // Fetch real data from API (AC-01) - Only completed transactions
  const loadBookings = async () => {
    try {
      setLoading(true)
      const res = await bookingService.getAllAdminBookings({
        page: currentPage,
        size: 10,
        search: search.trim(),
        fromDate,
        toDate,
        dateType,
      })
      const data = res.data?.result || res.data || {}
      setBookings(data.content || [])
      setTotalPages(data.totalPages || 0)
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
      await bookingService.confirm(selectedBooking.id)
      setSuccessBanner(`Đã xác nhận booking ${selectedBooking.id} thành công!`)
      loadBookings()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xác nhận booking. Vui lòng thử lại.')
    }
  }

  useEffect(() => {
    loadBookings()
  }, [currentPage, search, fromDate, toDate, dateType])

  const columns = [
    {
      key: 'id',
      label: 'Booking ID',
      render: row => <span className="font-mono text-xs font-bold text-white">{row.id?.substring(0, 8).toUpperCase()}</span>
    },
    {
      key: 'customerName',
      label: 'Khách Hàng',
      render: row => (
        <div>
          <div className="font-semibold text-white text-xs">{row.customerName || 'Khách vãng lai'}</div>
          <div className="text-[11px] text-gray-400">{row.phoneNumber || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'movieName',
      label: 'Tên Phim',
      render: row => <span className="font-bold text-emerald-400 text-xs">{row.movieName}</span>
    },
    {
      key: 'showtime',
      label: 'Suất Chiếu',
      render: row => <span className="text-xs text-gray-300">{row.date} — {row.showtime}</span>
    },
    {
      key: 'totalAmount',
      label: 'Tổng Tiền',
      render: row => <span className="font-extrabold text-amber-400 text-xs">{formatVND(row.totalAmount)}</span>
    },
    {
      key: 'status',
      label: 'Trạng Thái',
      render: row => (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${row.status === 'CHECKED_IN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
          {row.status === 'CHECKED_IN' ? 'Đã Check-in' : 'Đã thanh toán'}
        </span>
      )
    }
  ]

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0)

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
      <div className="flex flex-col gap-4 mb-2">
        <div>
          <h1 
            className="text-4xl text-gray-900 font-bold tracking-wider uppercase" 
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý đặt vé
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Quản lý và đối chiếu danh sách các vé đã hoàn thành giao dịch thành công.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input 
                placeholder="Tìm theo Booking ID, Số điện thoại, Tên phim, Tên khách..." 
                value={search} 
                onChange={e => { setSearch(e.target.value); setCurrentPage(0); }}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Date Type Selector */}
            <div className="flex items-center bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)] shrink-0">
              <button
                onClick={() => { setDateType('created'); setCurrentPage(0); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${dateType === 'created' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-gray-900 hover:bg-black/5'}`}
              >
                Thời gian đặt vé
              </button>
              <button
                onClick={() => { setDateType('showtime'); setCurrentPage(0); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${dateType === 'showtime' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-gray-900 hover:bg-black/5'}`}
              >
                Thời gian suất chiếu
              </button>
            </div>

            {/* Date Pickers */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-[11px] text-gray-400 font-semibold">Từ:</span>
                <input
                  type="date"
                  value={fromDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setFromDate(e.target.value); setCurrentPage(0); }}
                  className="bg-transparent text-xs text-white outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-[11px] text-gray-400 font-semibold">Đến:</span>
                <input
                  type="date"
                  value={toDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setToDate(e.target.value); setCurrentPage(0); }}
                  className="bg-transparent text-xs text-white outline-none cursor-pointer"
                />
              </div>

              {(search || fromDate || toDate) && (
                <button
                  onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setCurrentPage(0); }}
                  className="px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 rounded-xl border border-red-500/20 transition-all cursor-pointer"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table List */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
            <span className="text-xs font-semibold">Đang tải danh sách vé đã hoàn tất...</span>
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="p-4">
              <Table
                columns={columns}
                data={bookings}
                actions={row => (
                  <button
                    onClick={() => handleSelectBooking(row)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <CheckCircle size={13} />
                    Booking Detail
                  </button>
                )}
              />
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-t border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Page <strong className="text-white">{currentPage + 1}</strong> of <strong className="text-white">{totalPages}</strong>
                </span>
                
                <div className="flex gap-1 bg-[var(--color-surface-2)] p-1.5 rounded-xl border border-[var(--color-border)] shadow-inner">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-gray-900 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer outline-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum = currentPage;
                    if (totalPages <= 5) pageNum = i;
                    else if (currentPage < 2) pageNum = i;
                    else if (currentPage > totalPages - 3) pageNum = totalPages - 5 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    if (pageNum < 0 || pageNum >= totalPages) return null;

                    return (
                      <motion.button
                        key={pageNum}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer outline-none px-2
                          ${currentPage === pageNum 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'text-[var(--color-text-muted)] hover:text-gray-900 hover:bg-black/5'
                          }`}
                      >
                        {pageNum + 1}
                      </motion.button>
                    )
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-gray-900 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer outline-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
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
                    <span className="text-sm font-extrabold text-white mt-1 block leading-snug">{selectedBooking.movieName || selectedBooking.movie}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Booking ID</span>
                    <span className="text-xs font-black text-white mt-1 block font-mono">{selectedBooking.id}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Phòng Chiếu (Screen)</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">
                      {selectedBooking.roomName || selectedBooking.screen || 'Phòng chiếu'}
                      {selectedBooking.cinemaName ? ` - ${selectedBooking.cinemaName}` : ''}
                    </span>
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

                  {/* Bắp nước / Concessions */}
                  {selectedBooking.concessions && selectedBooking.concessions.length > 0 && (
                    <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block mb-1">Đồ ăn & Bắp nước (Concessions)</span>
                      <div className="space-y-1 mt-1">
                        {selectedBooking.concessions.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-white">
                            <span>{item.quantity}x {item.name} {item.size ? `(Size ${item.size})` : ''}</span>
                            <span className="font-bold text-red-400">{formatVND(item.lineTotal || ((item.unitPrice || 0) * item.quantity))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Giảm giá (Discount Breakdown) */}
                  {((selectedBooking.campaignDiscount > 0) || (selectedBooking.discountAmount - (selectedBooking.campaignDiscount || 0) > 0) || (selectedBooking.pointsDiscount > 0) || (selectedBooking.pointsPromotionTitle)) && (
                    <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block mb-1">Ưu đãi / Giảm giá (Discounts)</span>
                      
                      {(selectedBooking.pointsDiscount > 0 || selectedBooking.pointsPromotionTitle) ? (
                        <div className="flex justify-between items-center text-xs text-amber-400">
                          <span>★ Đổi điểm ({selectedBooking.pointsUsed || 0} điểm)</span>
                          <span className="font-bold">{selectedBooking.pointsDiscount > 0 ? `-${formatVND(selectedBooking.pointsDiscount)}` : selectedBooking.pointsPromotionTitle}</span>
                        </div>
                      ) : null}

                      {selectedBooking.campaignDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs text-emerald-400">
                          <span>Khuyến Mãi Tự Động {selectedBooking.campaignTitle ? `(${selectedBooking.campaignTitle})` : ""}</span>
                          <span className="font-bold">-${formatVND(selectedBooking.campaignDiscount)}</span>
                        </div>
                      )}

                      {selectedBooking.discountAmount - (selectedBooking.campaignDiscount || 0) > 0 && (
                        <div className="flex justify-between items-center text-xs text-emerald-400">
                          <span>Mã giảm giá {selectedBooking.promotionCode && selectedBooking.promotionCode !== selectedBooking.campaignTitle ? `(${selectedBooking.promotionCode})` : ""}</span>
                          <span className="font-bold">-${formatVND(selectedBooking.discountAmount - (selectedBooking.campaignDiscount || 0))}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="col-span-2 md:col-span-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
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

              
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[var(--color-border)] bg-slate-900/40 flex justify-end gap-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all cursor-pointer"
              >
                Đóng
              </button>
              
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
