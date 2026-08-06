import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Ticket as TicketIcon,
  RefreshCw,
  Film
} from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { bookingService } from '../../../services/bookingService'

export default function StaffOverviewPage() {
  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0)

  // States lưu dữ liệu thực tế từ API
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayShowtimes, setTodayShowtimes] = useState([])
  const [scannedCount, setScannedCount] = useState(0)
  const [pendingCheckins, setPendingCheckins] = useState(0)
  const [concessionRevenue, setConcessionRevenue] = useState(0)

  // Ngày hôm nay dạng YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  // 🟢 TRUY VẤN DỮ LIỆU TỪ TRANG SOÁT VÉ, BÁN VÉ & BÁN BẮP NƯỚC QUA API
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // 1. Tải các Suất Chiếu trong ngày từ showtimeService
      const showtimesRes = await showtimeService.getPublicShowtimes({ date: todayStr })
      const rawShowtimes = Array.isArray(showtimesRes) ? showtimesRes : (showtimesRes?.data || [])

      // Tính số ghế đã đặt thực tế cho từng suất chiếu qua API getSeatMap
      const showtimesWithSeatStats = await Promise.all(
        rawShowtimes.map(async (st) => {
          let booked = 0
          let total = 80
          try {
            const seatMapRes = await bookingService.getSeatMap(st.id)
            const seats = seatMapRes?.data?.result?.seats || seatMapRes?.data?.seats || seatMapRes?.seats || []
            if (Array.isArray(seats) && seats.length > 0) {
              total = seats.length
              booked = seats.filter(s => ['HELD', 'CONFIRMED', 'SOLD', 'LOCKED'].includes(String(s.status || '').toUpperCase())).length
            }
          } catch (err) {
            console.warn(`Không thể nạp sơ đồ ghế cho suất chiếu ${st.id}:`, err)
          }

          return {
            id: st.id,
            title: st.movieTitle || st.movie || 'Phim chiếu rạp',
            room: st.roomName || st.room || 'Phòng chiếu',
            time: st.time || (st.startTime ? st.startTime.split('T')[1]?.substring(0, 5) : '00:00'),
            booked,
            total,
            image: st.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'
          }
        })
      )

      setTodayShowtimes(showtimesWithSeatStats)

      // 2. Tải Dữ liệu Đơn hàng từ API Quản lý Booking
      try {
        const bookingsRes = await bookingService.getAllAdminBookings({
          fromDateStr: todayStr,
          toDateStr: todayStr,
          dateType: 'showtime',
          page: 0,
          size: 500
        })

        const bookingsContent = bookingsRes?.content || bookingsRes?.data?.result?.content || []
        
        let scanned = 0
        let pending = 0
        let apiConcRevenue = 0

        bookingsContent.forEach(b => {
          const status = String(b.status || '').toUpperCase()
          const seatCount = b.seatNames?.length || 1

          if (status === 'CHECKED_IN') {
            scanned += seatCount
          } else if (status === 'CONFIRMED' || status === 'PAID') {
            pending += seatCount
          }

          // Doanh thu bắp nước được tính vĩnh viễn từ CSDL Back-End
          if (b.concessions && Array.isArray(b.concessions)) {
            b.concessions.forEach(c => {
              apiConcRevenue += Number(c.lineTotal || (c.unitPrice * c.quantity) || 0)
            })
          }
        })
        
        setScannedCount(scanned)
        setPendingCheckins(pending)
        setConcessionRevenue(apiConcRevenue)
      } catch (err) {
        console.warn('Không thể nạp danh sách Booking từ API:', err)
      }

    } catch (err) {
      console.error('Lỗi khi tải dữ liệu tổng quan Staff:', err)
      setError('Không thể kết nối máy chủ để cập nhật dữ liệu ca làm việc.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [todayStr])

  // Tính Tỷ lệ lấp đầy bình quân tổng thể của các phòng chiếu
  const averageOccupancy = useMemo(() => {
    if (todayShowtimes.length === 0) return 0
    const totalBooked = todayShowtimes.reduce((acc, curr) => acc + curr.booked, 0)
    const totalCapacity = todayShowtimes.reduce((acc, curr) => acc + curr.total, 0)
    return totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  }, [todayShowtimes])

  return (
    <motion.div
      className="space-y-8 text-left min-h-screen text-white pb-12"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            TỔNG QUAN CA LÀM VIỆC
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Theo dõi các chỉ số hoạt động soát vé và bán hàng trong ca hiện tại ({todayStr}).
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg border-none cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>LÀM MỚI DỮ LIỆU</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Số vé đã soát (Liên kết với Trang Check-in) */}
        <div className="p-6 rounded-2xl bg-[#111111] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-white group-hover:scale-110 transition-transform duration-300">
            <TicketIcon size={120} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Vé đã soát (Check-in)
          </p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl font-black text-white font-mono">
              {loading ? '...' : scannedCount}
            </span>
            <span className="text-xs text-emerald-400 font-bold">Khách hàng</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-xl w-fit">
            <AlertCircle size={14} />
            <span>Còn <strong>{pendingCheckins}</strong> vé chờ quét hôm nay</span>
          </div>
        </div>

        {/* Metric 2: Doanh thu bắp nước (Tự động cập nhật trực tiếp từ API) */}
        <div className="p-6 rounded-2xl bg-[#111111] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-white group-hover:scale-110 transition-transform duration-300">
            <DollarSign size={120} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Doanh thu bắp nước tại quầy
          </p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-red-500 font-mono">
              {loading ? '...' : formatVND(concessionRevenue)}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-xl w-fit">
            <CheckCircle size={14} />
            <span>Ghi nhận vĩnh viễn từ CSDL hệ thống</span>
          </div>
        </div>

        {/* Metric 3: Suất chiếu hoạt động (Liên kết Trang Lịch Chiếu) */}
        <div className="p-6 rounded-2xl bg-[#111111] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-white group-hover:scale-110 transition-transform duration-300">
            <Calendar size={120} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Suất chiếu hoạt động
          </p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl font-black text-white font-mono">
              {loading ? '...' : todayShowtimes.length}
            </span>
            <span className="text-xs text-slate-400">Suất chiếu hôm nay</span>
          </div>
          <div className="mt-4 text-xs text-slate-400 border-t border-white/10 pt-3 flex justify-between items-center">
            <span>Tỉ lệ lấp đầy bình quân:</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">
              {loading ? '...' : `${averageOccupancy}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Showtimes Grid */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Film size={20} className="text-red-500" />
          TÌNH TRẠNG SUẤT CHIẾU HÔM NAY ({todayStr})
        </h3>

        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-[#111111] border border-white/10 rounded-2xl">
            <span className="material-symbols-outlined animate-spin text-3xl text-red-500 block mb-2">sync</span>
            <p className="text-xs font-semibold">Đang nạp dữ liệu suất chiếu từ hệ thống...</p>
          </div>
        ) : todayShowtimes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-[#111111] border border-dashed border-slate-800 rounded-2xl text-xs">
            Chưa có suất chiếu nào được lên lịch trong ngày hôm nay.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayShowtimes.map((st) => {
              const pct = st.total > 0 ? Math.round((st.booked / st.total) * 100) : 0
              return (
                <div
                  key={st.id}
                  className="flex rounded-2xl bg-[#111111] border border-white/10 overflow-hidden shadow-2xl hover:border-red-500/40 transition-all duration-200"
                >
                  <div className="w-28 relative shrink-0 bg-black/40">
                    <img src={st.image} alt={st.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111111] opacity-80" />
                  </div>

                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0 text-left">
                    <div>
                      <h4 className="text-base font-extrabold text-white truncate uppercase" title={st.title}>
                        {st.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-medium">
                        <span className="flex items-center gap-1.5 font-mono text-red-400 font-bold">
                          <Clock size={13} /> {st.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" /> {st.room}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Số ghế đã đặt:</span>
                        <span className="text-white font-mono">{st.booked} / {st.total} ({pct}%)</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}