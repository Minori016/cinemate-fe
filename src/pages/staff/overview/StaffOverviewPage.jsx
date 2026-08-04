import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  Ticket as TicketIcon,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Film,
  UserCheck,
  TrendingUp,
  ShieldCheck
} from 'lucide-react'
import { showtimeService } from '../../../services/showtimeService'
import { bookingService } from '../../../services/bookingService'
import api from '../../../services/api'

export default function StaffOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showtimes, setShowtimes] = useState([])
  const [bookings, setBookings] = useState([])
  const [analytics, setAnalytics] = useState(null)

  const formatVND = (amount) => {
    if (amount == null) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A'
    try {
      const date = new Date(dateTimeStr)
      if (isNaN(date.getTime())) {
        if (typeof dateTimeStr === 'string' && dateTimeStr.includes('T')) {
          return dateTimeStr.split('T')[1].substring(0, 5)
        }
        return dateTimeStr
      }
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return dateTimeStr
    }
  }

  const formatDateStr = (dateObj) => {
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    const todayStr = formatDateStr(new Date())

    try {
      // 1. Fetch Today's Showtimes
      const showtimesRes = await showtimeService.getAll({ date: todayStr }).catch(() => [])
      const showtimesList = Array.isArray(showtimesRes) ? showtimesRes : []
      setShowtimes(showtimesList)

      // 2. Fetch Admin Bookings / Recent Tickets
      const bookingsRes = await bookingService.getAllAdminBookings({ size: 100 }).catch(() => null)
      const rawBookings = bookingsRes?.data?.result?.content || bookingsRes?.data?.result || bookingsRes?.data || []
      const bookingsList = Array.isArray(rawBookings) ? rawBookings : []
      setBookings(bookingsList)

      // 3. Fetch Overview Analytics
      try {
        const analyticsRes = await api.get('/api/v1/admin/analytics/overview')
        const analyticsData = analyticsRes.data?.result || analyticsRes.data
        if (analyticsData) {
          setAnalytics(analyticsData)
        }
      } catch (err) {
        console.warn('Analytics overview endpoint optional fallback:', err?.message)
      }
    } catch (err) {
      console.error('Failed to load staff overview data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculated Stats
  const checkedInBookings = bookings.filter(b => b.status === 'CHECKED_IN' || b.checkedIn === true)
  const pendingBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PAID' || (b.status === 'SUCCESS' && !b.checkedIn))
  
  const scannedCount = checkedInBookings.length
  const pendingCheckins = pendingBookings.length

  const concessionRevenue = analytics?.concessionRevenue != null
    ? Number(analytics.concessionRevenue)
    : bookings.reduce((sum, b) => sum + (Number(b.comboPriceTotal || b.concessionTotal) || 0), 0)

  const totalShowtimesCount = showtimes.length

  const totalBookedSeats = showtimes.reduce((acc, st) => acc + (Number(st.bookedSeatsCount || st.booked || st.occupiedCount) || 0), 0)
  const totalCapacity = showtimes.reduce((acc, st) => acc + (Number(st.totalSeats || st.capacity || st.roomCapacity) || 60), 0)
  const avgOccupancy = analytics?.occupancyRate != null
    ? Math.round(Number(analytics.occupancyRate))
    : totalCapacity > 0 ? Math.round((totalBookedSeats / totalCapacity) * 100) : 0

  return (
    <motion.div
      className="space-y-8 text-left min-h-screen text-[var(--color-on-surface)] pb-12"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-500/10 text-red-500 border border-red-500/20 tracking-wider">
              Ca Trực Hôm Nay
            </span>
            <span className="text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-1">
              <Calendar size={13} />
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight uppercase text-black dark:text-white mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Tổng quan ca làm việc
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] font-medium mt-0.5">
            Theo dõi dữ liệu soát vé, doanh thu quầy và suất chiếu thời gian thực từ hệ thống.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-white text-xs font-bold rounded-xl border border-[var(--color-border)] shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-red-500' : 'text-slate-400'} />
          <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-xl flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Đang tải dữ liệu từ hệ thống API...</p>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric 1: Check-ins */}
            <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
                <TicketIcon size={130} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Vé đã soát (Check-in)
                </p>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserCheck size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-4xl font-black text-white" style={{ fontFamily: 'Montserrat' }}>
                  {scannedCount}
                </span>
                <span className="text-xs text-emerald-400 font-bold">Khách đã vào phòng</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl w-fit font-semibold">
                <AlertCircle size={14} className="shrink-0" />
                <span>Còn {pendingCheckins} vé chờ soát vé trong ca</span>
              </div>
            </div>

            {/* Metric 2: Revenue */}
            <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
                <DollarSign size={130} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Doanh thu bắp nước tại quầy
                </p>
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black text-red-500" style={{ fontFamily: 'Montserrat' }}>
                  {formatVND(concessionRevenue)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-fit font-semibold">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Đã đồng bộ với POS thanh toán</span>
              </div>
            </div>

            {/* Metric 3: Showtimes & Occupancy */}
            <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
                <Calendar size={130} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Suất chiếu hôm nay
                </p>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Film size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-4xl font-black text-white" style={{ fontFamily: 'Montserrat' }}>
                  {totalShowtimesCount}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Suất chiếu hoạt động</span>
              </div>

              <div className="mt-4 text-xs text-[var(--color-text-muted)] border-t border-white/5 pt-3 flex items-center justify-between font-semibold">
                <span>Tỉ lệ lấp đầy bình quân:</span>
                <span className="text-white font-black text-sm font-mono px-2 py-0.5 bg-white/5 rounded-lg border border-white/10">
                  {avgOccupancy}%
                </span>
              </div>
            </div>
          </div>

          {/* Showtimes Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Film size={18} className="text-red-500" />
                Tình trạng suất chiếu thực tế
              </h3>
              <span className="text-xs text-slate-400 font-bold">
                {showtimes.length} Suất chiếu trong ngày
              </span>
            </div>

            {showtimes.length === 0 ? (
              <div className="py-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                <AlertCircle size={32} className="text-slate-600" />
                <span>Chưa có suất chiếu nào được lên lịch cho hôm nay.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {showtimes.map((st) => {
                  const title = st.movieTitle || st.movie?.titleVn || st.movie?.title || st.title || 'Phim Chiếu'
                  const poster = st.posterUrl || st.movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'
                  const startTime = formatTime(st.startTime || st.time)
                  const room = st.roomName || st.room?.name || st.room || 'Phòng chiếu'
                  const format = st.format || '2D'

                  const booked = Number(st.bookedSeatsCount || st.booked || st.occupiedCount) || 0
                  const total = Number(st.totalSeats || st.capacity || st.roomCapacity) || 60
                  const pct = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0

                  return (
                    <div
                      key={st.id}
                      className="flex rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-xl hover:border-red-500/30 transition-all duration-200"
                    >
                      <div className="w-28 relative shrink-0 bg-black/40">
                        <img src={poster} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--color-surface)] opacity-80" />
                      </div>

                      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold text-white bg-red-650 inline-block uppercase">
                              {format}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-semibold">
                              ID: #{String(st.id).substring(0, 8)}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white truncate leading-snug" title={title}>
                            {title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)] mt-1.5 font-medium">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Clock size={13} className="text-red-500" /> {startTime}
                            </span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin size={13} className="text-red-500" /> {room}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-[var(--color-text-muted)]">Số ghế đã đặt:</span>
                            <span className="text-white font-mono">{booked} / {total} ({pct}%)</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
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

          {/* Recent Ticket Check-ins Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <ShieldCheck size={18} className="text-emerald-400" />
              Lịch sử vé soát gần đây
            </h3>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl p-5">
              {bookings.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs font-semibold">
                  Chưa có dữ liệu vé nào trong hệ thống.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                        <th className="pb-3">Mã Đơn / Vé</th>
                        <th className="pb-3">Phim & Suất</th>
                        <th className="pb-3">Khách hàng</th>
                        <th className="pb-3">Ghế đặt</th>
                        <th className="pb-3 text-right">Tổng tiền</th>
                        <th className="pb-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {bookings.slice(0, 6).map((b) => {
                        const code = b.bookingCode || b.id || 'N/A'
                        const movieTitle = b.movieTitle || b.showtime?.movieTitle || 'Vé phim'
                        const customer = b.customerName || b.customer?.fullName || b.user?.fullName || 'Khách vãng lai'
                        const seats = Array.isArray(b.seats) ? b.seats.join(', ') : (b.seatList || b.seats || 'N/A')
                        const isCheckedIn = b.status === 'CHECKED_IN' || b.checkedIn === true

                        return (
                          <tr key={b.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 font-mono font-bold text-slate-200">
                              #{String(code).substring(0, 12)}
                            </td>
                            <td className="py-3.5 text-white font-bold max-w-[200px] truncate" title={movieTitle}>
                              {movieTitle}
                            </td>
                            <td className="py-3.5 text-slate-300">
                              {customer}
                            </td>
                            <td className="py-3.5 text-slate-200 font-mono font-bold">
                              {seats}
                            </td>
                            <td className="py-3.5 text-right font-mono font-bold text-red-400">
                              {formatVND(b.totalAmount || b.totalPrice || b.finalAmount)}
                            </td>
                            <td className="py-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-block border ${
                                isCheckedIn
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {isCheckedIn ? 'Đã soát vé' : 'Chưa check-in'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
