import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Ticket as TicketIcon,
  QrCode
} from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { bookingService } from '../../../services/bookingService'

export default function StaffTicketVerifierPage() {
  const [query, setQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [toast, setToast] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [loading, setLoading] = useState(false)

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (!isScanning) return
    
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(
      (decodedText) => {
        setQuery(decodedText)
        scanner.clear()
        setIsScanning(false)
        fetchTicket(decodedText)
      },
      (error) => {
        // scan errors can be ignored
      }
    )

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [isScanning])

  const fetchTicket = async (ticketId) => {
    try {
      setLoading(true)
      const res = await bookingService.getById(ticketId)
      if (res.data.result) {
        const b = res.data.result
        setSelectedTicket({
          id: b.id,
          movie: b.movieName,
          screen: b.roomName,
          date: b.date,
          time: b.showtime,
          seats: (b.seatNames || []).join(', '),
          customerName: 'Khách hàng',
          phone: 'N/A',
          email: 'N/A',
          idCard: 'N/A',
          memberId: 'N/A',
          price: (b.totalAmount || 0) / Math.max(1, (b.seatNames || []).length),
          total: b.totalAmount || 0,
          convertTickets: 0,
          scoreUsed: 0,
          status: b.status,
          checkedIn: b.status === 'CHECKED_IN',
          checkInTime: null
        })
        if (b.status === 'CHECKED_IN') {
           triggerToast('Vé này đã được check-in trước đó!', 'error')
        } else {
           triggerToast('Tìm thấy vé hợp lệ!', 'success')
        }
      } else {
        setSelectedTicket(null)
        triggerToast('Không tìm thấy vé khớp với thông tin!', 'error')
      }
    } catch (error) {
      setSelectedTicket(null)
      triggerToast(error.response?.data?.message || 'Lỗi khi tìm vé!', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    fetchTicket(query.trim())
  }

  const handleCheckIn = async () => {
    if (!selectedTicket) return
    try {
      setLoading(true)
      await bookingService.checkIn(selectedTicket.id)
      
      const timeNow = new Date()
      const formattedTime = `${String(timeNow.getDate()).padStart(2, '0')}/${String(timeNow.getMonth() + 1).padStart(2, '0')}/${timeNow.getFullYear()} - ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`
      
      setSelectedTicket({
        ...selectedTicket,
        checkedIn: true,
        checkInTime: formattedTime
      })
      triggerToast(`Đã xác nhận check-in thành công cho vé ${selectedTicket.id}!`, 'success')
    } catch (error) {
      triggerToast(error.response?.data?.message || 'Có lỗi xảy ra khi check-in!', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="shrink-0" size={20} />
          ) : (
            <AlertCircle className="shrink-0" size={20} />
          )}
          <span className="font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Kiểm tra & Soát vé
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Nhập mã đặt vé (Booking ID), số điện thoại hoặc tên khách hàng để xác nhận vào phòng chiếu.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Nhập mã đặt vé (Booking ID) thủ công..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl py-4 pl-12 pr-4 outline-none text-white text-base focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder:text-gray-600"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 md:py-0 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <Search size={18} />}
          Tìm kiếm
        </button>
        <button
          type="button"
          onClick={() => setIsScanning(!isScanning)}
          className="bg-[var(--color-primary)] hover:bg-red-700 text-white font-bold px-8 py-4 md:py-0 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[rgba(229,9,20,0.25)]"
        >
          <QrCode size={18} />
          {isScanning ? 'Đóng Camera' : 'Quét QR'}
        </button>
      </form>

      {/* QR Scanner */}
      {isScanning && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 flex flex-col items-center">
          <style>{`
            #qr-reader {
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              color: #ffffff !important;
              background-color: #09090b !important;
            }
            #qr-reader * {
              color: #ffffff !important;
            }
            #qr-reader__header_message {
              color: #fca5a5 !important;
              background: rgba(239, 68, 68, 0.2) !important;
              border: 1px solid rgba(239, 68, 68, 0.4) !important;
              padding: 10px 14px !important;
              border-radius: 12px !important;
              font-weight: 700 !important;
              margin-bottom: 12px !important;
              font-size: 13px !important;
              word-break: break-word !important;
            }
            #qr-reader__status_span {
              color: #38bdf8 !important;
              font-weight: 600 !important;
            }
            #qr-reader__scan_region {
              background-color: #000000 !important;
              border-radius: 12px !important;
              overflow: hidden !important;
            }
            #qr-reader__dashboard {
              padding: 12px 0 !important;
            }
            #html5-qrcode-anchor-scan-type-change {
              color: #f87171 !important;
              font-weight: 700 !important;
              text-decoration: underline !important;
              margin-top: 10px !important;
              display: inline-block !important;
              cursor: pointer !important;
              font-size: 13px !important;
            }
            #qr-reader button,
            .html5-qrcode-element {
              background-color: #e50914 !important;
              color: #ffffff !important;
              font-weight: 700 !important;
              border-radius: 12px !important;
              border: none !important;
              padding: 10px 20px !important;
              margin: 8px 4px !important;
              cursor: pointer !important;
              font-size: 13px !important;
              transition: all 0.2s ease !important;
              box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3) !important;
            }
            #qr-reader button:hover,
            .html5-qrcode-element:hover {
              background-color: #b91c1c !important;
              transform: translateY(-1px) !important;
            }
            #qr-reader select {
              background-color: #18181b !important;
              color: #ffffff !important;
              border: 1px solid #3f3f46 !important;
              border-radius: 10px !important;
              padding: 8px 14px !important;
              margin: 6px 0 !important;
              font-size: 13px !important;
            }
          `}</style>
          <div id="qr-reader" className="w-full max-w-md rounded-2xl overflow-hidden bg-black text-white p-4"></div>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Đưa mã QR vé của khách vào giữa khung hình để quét.
          </p>
        </div>
      )}

      {/* Ticket Details Panel */}
      {selectedTicket ? (
        <div className="animate-fade-in space-y-6">
          {/* Ticket Stub Design */}
          <div
            className="rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-2xl relative"
            style={{
              background: 'linear-gradient(145deg, #0e121e 0%, #080a10 100%)',
            }}
          >
            {/* Top Indicator Strip */}
            <div
              className={`h-2.5 w-full ${
                selectedTicket.checkedIn ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'
              }`}
            />

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Film Title & Room Details */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-container)] flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                    <span>🎟️</span> Chi tiết vé xem phim
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Movie Name */}
                    <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Tên phim (Movie Name)</span>
                      <span className="text-sm font-extrabold text-white mt-1 block leading-snug">{selectedTicket.movie}</span>
                    </div>

                    {/* Ticket Booking ID */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Mã đặt vé (Booking ID)</span>
                      <span className="text-xs font-black text-white mt-1 block font-mono">{selectedTicket.id}</span>
                    </div>

                    {/* Screen */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Phòng chiếu (Screen)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.screen}</span>
                    </div>

                    {/* Date */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Ngày chiếu (Date)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.date}</span>
                    </div>

                    {/* Time */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Giờ chiếu (Time)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.time}</span>
                    </div>

                    {/* Seat */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Ghế ngồi (Seat)</span>
                      <span className="text-xs font-black text-[var(--color-primary-container)] mt-1 block">{selectedTicket.seats}</span>
                    </div>

                    {/* Price per ticket */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Đơn giá (Price)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{formatVND(selectedTicket.price)}</span>
                    </div>

                    {/* Total Price */}
                    <div className="col-span-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-primary-container)] block">Tổng tiền (Total)</span>
                      <span className="text-sm font-black text-[var(--color-primary-container)] mt-1 block">{formatVND(selectedTicket.total)}</span>
                    </div>

                    {/* Score Conversion Details */}
                    {selectedTicket.convertTickets > 0 && (
                      <>
                        <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-yellow-500 block">Convert to Ticket</span>
                          <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.convertTickets} vé</span>
                        </div>
                        <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-yellow-500 block">Score for Ticket Converting</span>
                          <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.scoreUsed} điểm</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section B: Thông tin thành viên */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5" style={{ fontFamily: 'Montserrat' }}>
                    <span>👤</span> Thông tin thành viên (Member Details)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Member ID */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Mã thành viên (Member ID)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block font-mono">{selectedTicket.memberId}</span>
                    </div>

                    {/* Email */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Email</span>
                      <span className="text-xs font-extrabold text-white mt-1 block truncate" title={selectedTicket.email}>{selectedTicket.email}</span>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Số điện thoại (Phone)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.phone}</span>
                    </div>

                    {/* Identity Card */}
                    <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Số CCCD (Identity Card)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.idCard}</span>
                    </div>

                    {/* Full Name */}
                    <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Họ tên thành viên (Full Name)</span>
                      <span className="text-xs font-extrabold text-white mt-1 block">{selectedTicket.customerName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: QR/Scan Status Stub */}
              <div className="border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between items-center text-center">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">MÃ ĐẶT VÉ</p>
                  <p className="text-lg font-black text-white bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl inline-block" style={{ fontFamily: 'monospace' }}>
                    {selectedTicket.id}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="my-6 space-y-1">
                  <span className="text-xs font-medium text-[var(--color-text-muted)] block">TRẠNG THÁI VÉ</span>
                  {selectedTicket.checkedIn ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wide">
                      <CheckCircle size={12} /> Đã vào phòng
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wide">
                      <AlertCircle size={12} /> Chờ check-in
                    </div>
                  )}
                  {selectedTicket.checkedIn && selectedTicket.checkInTime && (
                    <p className="text-[10px] text-gray-500 mt-1">{selectedTicket.checkInTime}</p>
                  )}
                </div>

                {/* Confirm Action Button */}
                {selectedTicket.checkedIn ? (
                  <button
                    disabled={loading || selectedTicket.checkedIn}
                    className="w-full bg-slate-800 text-gray-500 font-bold py-3.5 rounded-2xl text-sm border border-white/5 cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    Đã kiểm tra vé
                  </button>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-emerald-500/20 border border-emerald-500/10 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : null}
                    Xác nhận vào phòng
                  </button>
                )}
              </div>
            </div>

            {/* Ticket Cutout Circles */}
            <div className="hidden md:block absolute left-[66.6%] top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--color-background)] border-b border-[var(--color-border)]" />
            <div className="hidden md:block absolute left-[66.6%] bottom-0 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-[var(--color-background)] border-t border-[var(--color-border)]" />
          </div>
        </div>
      ) : (
        /* Welcome Scan State */
        <div className="text-center py-16 border border-dashed border-[var(--color-border)] rounded-3xl bg-[var(--color-surface)]">
          <span className="material-symbols-outlined text-gray-600" style={{ fontSize: '56px' }}>
            qr_code_scanner
          </span>
          <h4 className="text-lg font-bold text-white mt-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Đang đợi thông tin quét vé...
          </h4>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto mt-2">
            Quét mã QR trên vé của khách hoặc nhập ID thủ công ở thanh tìm kiếm để tra cứu thông tin vé.
          </p>
        </div>
      )}
    </div>
  )
}
