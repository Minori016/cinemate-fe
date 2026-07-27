import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Ticket as TicketIcon,
  QrCode,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Tag,
  User,
  Coffee,
  CheckCircle2
} from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { bookingService } from '../../../services/bookingService'

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

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
          posterUrl: b.posterUrl,
          screen: b.roomName,
          date: b.date,
          time: b.showtime,
          seats: (b.seatNames || []).join(', '),
          customerName: b.customerName || 'Khách vãng lai',
          phone: b.phone || 'N/A',
          email: b.email || 'N/A',
          memberId: b.memberId || 'N/A',
          concessions: b.concessions || [],
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
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#121420] border-2 border-red-600/30 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(229,9,20,0.15)] relative">

              {/* LEFT SECTION (Main Ticket Details) - 8 Cols */}
              <div className="lg:col-span-8 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-dashed border-red-500/20 relative">

                {/* Top Bar */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-[0_0_12px_rgba(229,9,20,0.6)] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={13} className={selectedTicket.checkedIn ? "" : "animate-pulse"} /> {selectedTicket.checkedIn ? "ĐÃ CHECK-IN" : "CHỜ KIỂM TRA"}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/5 text-red-400 border border-red-500/30 font-mono">
                        #{selectedTicket.id?.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Movie Title & Cinema Info */}
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {selectedTicket.movie}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-red-400 font-semibold">
                      <MapPin size={16} className="shrink-0 text-red-500" />
                      <span>Cinemate Center — <strong className="text-white">{selectedTicket.screen}</strong></span>
                    </div>
                  </div>

                  {/* Show Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 mb-6">
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar size={13} className="text-red-500" /> Ngày chiếu
                      </p>
                      <p className="text-white font-extrabold text-base">{selectedTicket.date}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock size={13} className="text-red-500" /> Suất chiếu
                      </p>
                      <p className="text-red-400 font-black text-base">{selectedTicket.time}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <TicketIcon size={13} className="text-red-500" /> Ghế ngồi
                      </p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {selectedTicket.seats.split(',').map((seat) => (
                          <span key={seat} className="text-xs font-black bg-red-600/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md">
                            {seat.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Tag size={13} className="text-red-500" /> Tổng tiền
                      </p>
                      <p className="text-red-500 font-black text-base">{formatPrice(selectedTicket.total)}</p>
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="mb-6">
                    <p className="text-xs font-black uppercase text-gray-300 tracking-wider mb-3 flex items-center gap-2">
                      <User size={15} className="text-red-500" /> Thông tin khách hàng
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Mã thành viên</span>
                        <span className="text-sm font-bold text-white block">{selectedTicket.memberId}</span>
                      </div>
                      <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tên khách hàng</span>
                        <span className="text-sm font-bold text-white block">{selectedTicket.customerName}</span>
                      </div>
                      <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Số điện thoại</span>
                        <span className="text-sm font-bold text-white block">{selectedTicket.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* CONCESSIONS / BẮP NƯỚC SECTION */}
                  <div>
                    <p className="text-xs font-black uppercase text-gray-300 tracking-wider mb-3 flex items-center gap-2">
                      <Coffee size={15} className="text-red-500" /> Đồ ăn & Bắp nước đặt kèm:
                    </p>

                    {selectedTicket.concessions && selectedTicket.concessions.length > 0 ? (
                      <div className="space-y-2 bg-black/30 p-3.5 rounded-2xl border border-white/5">
                        {selectedTicket.concessions.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-gray-200 py-1 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 font-extrabold flex items-center justify-center text-[10px] border border-red-500/30">
                                {item.quantity}x
                              </span>
                              <div>
                                <span className="font-bold text-white">{item.name}</span>
                                {item.size && (
                                  <span className="ml-2 text-[10px] text-red-400 bg-red-950/60 px-1.5 py-0.2 rounded border border-red-800/40 uppercase">
                                    Size {item.size}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-extrabold text-red-400">
                              {formatPrice(item.lineTotal || ((item.unitPrice || 0) * item.quantity))}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-gray-500 italic">Không mua kèm bắp nước</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT SECTION (Status & Actions) - 4 Cols */}
              <div className="lg:col-span-4 bg-gradient-to-b from-[#181a28] to-[#0f101a] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">

                {/* Decorative Notch Circles */}
                <div className="hidden lg:block absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#07080E] border-r border-red-500/30" />
                <div className="hidden lg:block absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-[#07080E] border-r border-red-500/30" />

                <div className="w-full flex flex-col items-center">
                  <div className="w-full max-w-[200px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-red-600/40 shadow-[0_10px_30px_rgba(229,9,20,0.3)] mb-6 group relative">
                    <img
                      src={selectedTicket.posterUrl || 'https://via.placeholder.com/300x450?text=CineMate'}
                      alt={selectedTicket.movie}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    <span className="absolute bottom-2 left-2 right-2 text-[10px] font-extrabold text-white bg-red-600/80 backdrop-blur-sm py-1 rounded text-center uppercase tracking-widest">
                      PASS TICKET
                    </span>
                  </div>

                  <div className="relative mb-6">
                    <div className={`absolute inset-0 blur-2xl ${selectedTicket.checkedIn ? 'bg-emerald-600/40' : 'bg-yellow-500/40'} rounded-full`} />
                    {selectedTicket.checkedIn ? (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-[0_0_40px_rgba(16,185,129,0.6)] relative z-10 border-2 border-emerald-400/40">
                        <CheckCircle2 size={50} strokeWidth={2.2} />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-yellow-900 flex items-center justify-center text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)] relative z-10 border-2 border-yellow-500/30">
                        <AlertCircle size={50} strokeWidth={2} />
                      </div>
                    )}
                  </div>

                  <h4 className="text-xl font-bold text-white mb-1">
                    {selectedTicket.checkedIn ? "Đã Check-in" : "Chờ Check-in"}
                  </h4>
                  {selectedTicket.checkedIn && selectedTicket.checkInTime ? (
                    <p className="text-xs text-gray-400 font-mono mb-8">
                      {selectedTicket.checkInTime}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-8">
                      Vé hợp lệ, sẵn sàng vào phòng chiếu
                    </p>
                  )}

                  {/* Confirm Action Button */}
                  <div className="w-full mt-auto">
                    {selectedTicket.checkedIn ? (
                      <button
                        disabled
                        className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-gray-500 cursor-not-allowed flex justify-center items-center gap-2"
                      >
                        Đã kiểm tra vé
                      </button>
                    ) : (
                      <button
                        onClick={handleCheckIn}
                        disabled={loading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-2xl text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] border-none active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                      >
                        {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : null}
                        Xác nhận vào phòng
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
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
