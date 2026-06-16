import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  TrendingUp,
  Calendar,
  Users,
  Plus,
  DollarSign,
  Ticket,
  Percent,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  MapPin,
  Coffee,
  Check,
  UserCheck
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Mock Analytics Data
const REVENUE_TREND_DATA = [
  { day: 'Thứ 2', ticket: 1450000, concession: 450000, total: 1900000 },
  { day: 'Thứ 3', ticket: 1850000, concession: 550000, total: 2400000 },
  { day: 'Thứ 4', ticket: 2100000, concession: 680000, total: 2780000 },
  { day: 'Thứ 5', ticket: 2450000, concession: 800000, total: 3250000 },
  { day: 'Thứ 6', ticket: 4100000, concession: 1200000, total: 5300000 },
  { day: 'Thứ 7', ticket: 6500000, concession: 2100000, total: 8600000 },
  { day: 'Chủ Nhật', ticket: 7200000, concession: 2400000, total: 9600000 }
]

const MOVIE_PERFORMANCE_DATA = [
  { name: 'Lật Mặt 7', revenue: 5600000, tickets: 51 },
  { name: 'Dune: Part 2', revenue: 4200000, tickets: 35 },
  { name: 'Inside Out 2', revenue: 2100000, tickets: 23 },
  { name: 'Furiosa', revenue: 1500000, tickets: 15 }
]

// Mock Movie List for Scheduler Form
const AVAILABLE_MOVIES = [
  'Lật Mặt 7: Một Điều Ước',
  'Dune: Hành Tinh Cát - Phần 2',
  'Inside Out 2: Những Mảnh Ghép Cảm Xúc',
  'Furiosa: Mad Max Saga'
]

const AVAILABLE_ROOMS = [
  'Phòng chiếu 1 (Standard)',
  'Phòng chiếu 2 (3D)',
  'Phòng chiếu 3 (IMAX)',
  'Phòng chiếu 4 (Dolby Atmos)'
]

// Seed Showtime Data
const INITIAL_SHOWTIMES = [
  { id: 101, movie: 'Dune: Hành Tinh Cát - Phần 2', room: 'Phòng chiếu 3 (IMAX)', date: '2026-06-18', time: '18:30', price: 120000 },
  { id: 102, movie: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc', room: 'Phòng chiếu 2 (3D)', date: '2026-06-18', time: '17:00', price: 90000 },
  { id: 103, movie: 'Lật Mặt 7: Một Điều Ước', room: 'Phòng chiếu 1 (Standard)', date: '2026-06-18', time: '20:15', price: 110000 }
]

// Seed Shift Staff Data
const INITIAL_SHIFTS = [
  { id: 201, name: 'Nguyễn Văn Hùng', role: 'Nhân viên soát vé', shift: 'Sáng (08:00 - 14:00)', room: 'Phòng chiếu 3 (IMAX)', status: 'Đã ra ca' },
  { id: 202, name: 'Trần Minh Tâm', role: 'Nhân viên bán vé', shift: 'Chiều (14:00 - 20:00)', room: 'Quầy bán vé trung tâm', status: 'Trực ca' },
  { id: 203, name: 'Lê Thị Hồng', role: 'Nhân viên soát vé', shift: 'Tối (18:00 - 23:00)', room: 'Phòng chiếu 1 (Standard)', status: 'Trực ca' },
  { id: 204, name: 'Phạm Quốc Bảo', role: 'Nhân viên bắp nước', shift: 'Tối (18:00 - 23:00)', room: 'Quầy bắp nước số 2', status: 'Vắng mặt' }
]

export default function ManagerDashboardPage() {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'analytics'

  const [toast, setToast] = useState(null)

  // Local database states persisted
  const [showtimes, setShowtimes] = useState(() => {
    const saved = localStorage.getItem('manager_showtimes_db')
    return saved ? JSON.parse(saved) : INITIAL_SHOWTIMES
  })

  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem('manager_shifts_db')
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS
  })

  useEffect(() => {
    localStorage.setItem('manager_showtimes_db', JSON.stringify(showtimes))
  }, [showtimes])

  useEffect(() => {
    localStorage.setItem('manager_shifts_db', JSON.stringify(shifts))
  }, [shifts])

  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up`}
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(147,51,234,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(147,51,234,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#a855f7' : '#ef4444',
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

      {/* Analytics tab */}
      {activeTab === 'analytics' && <AnalyticsSection />}

      {/* Showtime manager tab */}
      {activeTab === 'showtimes' && (
        <ShowtimeSection
          showtimes={showtimes}
          setShowtimes={setShowtimes}
          triggerToast={triggerToast}
        />
      )}

      {/* Shift staff tab */}
      {activeTab === 'shifts' && (
        <ShiftSection
          shifts={shifts}
          setShifts={setShifts}
          triggerToast={triggerToast}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: MANAGER OVERVIEW & ANALYTICS (RECHARTS)
// ──────────────────────────────────────────────────────────────────────────
function AnalyticsSection() {
  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  // Custom tooltips for graphs
  const CustomTooltipRevenue = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f121d] border border-white/10 p-3.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-extrabold text-white">{label}</p>
          <p className="text-purple-400 font-semibold">Vé: {formatVND(payload[0].value)}</p>
          <p className="text-amber-400 font-semibold">Bắp nước: {formatVND(payload[1].value)}</p>
          <p className="text-white font-black border-t border-white/5 pt-1.5 mt-1">Tổng: {formatVND(payload[2].value)}</p>
        </div>
      )
    }
    return null
  }

  const CustomTooltipMovie = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f121d] border border-white/10 p-3.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-extrabold text-white">{label}</p>
          <p className="text-purple-400 font-semibold">Doanh thu: {formatVND(payload[0].value)}</p>
          <p className="text-gray-400">Vé bán: {payload[0].payload.tickets} vé</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Báo cáo doanh thu & Thống kê
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Báo cáo dữ liệu kinh doanh rạp phim, doanh số bán vé và tình hình quầy bắp nước theo thời gian thực.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Doanh thu hôm nay</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3" style={{ fontFamily: 'Montserrat' }}>12.450.000 đ</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +14.2% <span className="text-[var(--color-text-muted)] font-normal">so với hôm qua</span>
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Vé đã bán ra</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <Ticket size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3" style={{ fontFamily: 'Montserrat' }}>428 vé</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +8.7% <span className="text-[var(--color-text-muted)] font-normal">so với tuần trước</span>
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Đơn hàng bắp nước</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <Coffee size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3" style={{ fontFamily: 'Montserrat' }}>185 đơn</p>
          <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
            ▲ +12.3% <span className="text-[var(--color-text-muted)] font-normal">doanh số combo</span>
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tỷ lệ lấp đầy</p>
            <span className="p-2 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
              <Percent size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-3" style={{ fontFamily: 'Montserrat' }}>74.5%</p>
          <span className="text-[10px] text-yellow-500 font-bold mt-1.5 flex items-center gap-1">
            ● Ổn định <span className="text-[var(--color-text-muted)] font-normal">hiệu suất phòng IMAX</span>
          </span>
        </div>
      </div>

      {/* Recharts Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Weekly Sales Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat' }}>
              📈 Xu Hướng Doanh Thu Tuần Hiện Tại
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">Cập nhật lúc 23:50</span>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={REVENUE_TREND_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                <XAxis dataKey="day" stroke="#7e8494" fontSize={11} tickLine={false} />
                <YAxis stroke="#7e8494" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ticket" name="Doanh thu vé" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="concession" name="Doanh thu bắp nước" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="total" name="Tổng doanh số" stroke="#a855f7" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart: Movie Ranking */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat' }}>
            🎬 Xếp Hạng Doanh Thu Theo Phim
          </h3>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={MOVIE_PERFORMANCE_DATA} margin={{ top: 10, right: 5, left: 5, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" horizontal={false} />
                <XAxis type="number" stroke="#7e8494" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <YAxis dataKey="name" type="category" stroke="#7e8494" fontSize={11} width={80} tickLine={false} />
                <Tooltip content={<CustomTooltipMovie />} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#a855f7" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: MANAGER SHOWTIME SCHEDULER
// ──────────────────────────────────────────────────────────────────────────
function ShowtimeSection({ showtimes, setShowtimes, triggerToast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    movie: AVAILABLE_MOVIES[0],
    room: AVAILABLE_ROOMS[0],
    date: '2026-06-18',
    time: '19:00',
    price: 90000
  })

  const handleCreateShowtime = (e) => {
    e.preventDefault()
    if (!form.time || !form.date || form.price <= 0) {
      triggerToast('Vui lòng điền đầy đủ và đúng thông tin!', 'error')
      return
    }

    const newShow = {
      id: Date.now(),
      movie: form.movie,
      room: form.room,
      date: form.date,
      time: form.time,
      price: parseInt(form.price, 10)
    }

    setShowtimes([newShow, ...showtimes])
    setModalOpen(false)
    triggerToast(`Đã lên lịch chiếu thành công phim: ${form.movie}`)
  }

  const handleDeleteShowtime = (id, movieTitle) => {
    setShowtimes(showtimes.filter((st) => st.id !== id))
    triggerToast(`Đã xóa suất chiếu của phim ${movieTitle}`)
  }

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Quản lý lịch chiếu phim
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Lập kế hoạch, lên lịch giờ chiếu cho các phim đang và sắp chiếu tại các phòng chiếu.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-[rgba(147,51,234,0.25)] text-sm"
        >
          <Plus size={16} /> Lên lịch suất chiếu
        </button>
      </div>

      {/* Showtimes Table List */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              <th className="px-6 py-4">Phim / Movie</th>
              <th className="px-6 py-4">Phòng chiếu</th>
              <th className="px-6 py-4">Ngày chiếu</th>
              <th className="px-6 py-4">Giờ chiếu</th>
              <th className="px-6 py-4">Đơn giá vé</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {showtimes.length > 0 ? (
              showtimes.map((st) => (
                <tr key={st.id} className="hover:bg-white/2s transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-extrabold text-white">{st.movie}</p>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] font-semibold">{st.room}</td>
                  <td className="px-6 py-4 font-medium">{st.date}</td>
                  <td className="px-6 py-4 text-[var(--color-primary-container)] font-bold">{st.time}</td>
                  <td className="px-6 py-4 font-bold font-mono">{formatVND(st.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteShowtime(st.id, st.movie)}
                      className="text-red-400 hover:text-red-500 font-semibold transition-colors"
                    >
                      Xóa lịch
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-10 text-[var(--color-text-muted)] font-semibold">
                  Chưa có lịch chiếu nào được lên kế hoạch. Ấn "Lên lịch suất chiếu" để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Scheduler Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center bg-white/5">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white" style={{ fontFamily: 'Montserrat' }}>
                🗓️ Lên lịch suất chiếu mới
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="p-6 space-y-4">
              {/* Select Movie */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Chọn phim</label>
                <select
                  value={form.movie}
                  onChange={(e) => setForm({ ...form, movie: e.target.value })}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500"
                >
                  {AVAILABLE_MOVIES.map((mv) => (
                    <option key={mv} value={mv}>{mv}</option>
                  ))}
                </select>
              </div>

              {/* Select Room */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Phòng chiếu</label>
                <select
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500"
                >
                  {AVAILABLE_ROOMS.map((rm) => (
                    <option key={rm} value={rm}>{rm}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Ngày chiếu</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500"
                  />
                </div>

                {/* Time Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Giờ chiếu</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Base Ticket Price */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Đơn giá vé (VND)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 120000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  min="30000"
                  step="5000"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 outline-none text-xs text-white focus:border-purple-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  Xác nhận lên lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ── SUB-SECTION: STAFF SHIFT ATTENDANCE & ROOM ALLOCATION
// ──────────────────────────────────────────────────────────────────────────
function ShiftSection({ shifts, setShifts, triggerToast }) {

  const handleStatusToggle = (id, name, currentStatus) => {
    const nextStatus = currentStatus === 'Trực ca' ? 'Đã ra ca' : currentStatus === 'Đã ra ca' ? 'Vắng mặt' : 'Trực ca'

    const updated = shifts.map((sf) => {
      if (sf.id === id) {
        return { ...sf, status: nextStatus }
      }
      return sf
    })

    setShifts(updated)
    triggerToast(`Đã thay đổi trạng thái ca trực của ${name} thành: ${nextStatus}`)
  }

  const handleRoomAllocation = (id, name, room) => {
    const updated = shifts.map((sf) => {
      if (sf.id === id) {
        return { ...sf, room }
      }
      return sf
    })

    setShifts(updated)
    triggerToast(`Đã phân công ${name} vận hành tại: ${room}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Quản lý ca trực & Điểm danh nhân viên
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Điểm danh nhân sự đầu ca, phân bổ phòng chiếu và khu vực làm việc của các nhân sự trong ca làm việc.
        </p>
      </div>

      {/* Shifts Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              <th className="px-6 py-4">Nhân viên / Employee</th>
              <th className="px-6 py-4">Vai trò hoạt động</th>
              <th className="px-6 py-4">Thời gian ca trực</th>
              <th className="px-6 py-4">Khu vực phân bổ</th>
              <th className="px-6 py-4">Trạng thái ca trực</th>
              <th className="px-6 py-4 text-right">Hành động nhanh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {shifts.map((sf) => (
              <tr key={sf.id} className="hover:bg-white/2s transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-white/5">
                      {sf.name[0]}
                    </div>
                    <span className="font-extrabold text-white">{sf.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-semibold text-gray-300 uppercase">
                    {sf.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--color-text-muted)] font-semibold flex items-center gap-1.5 mt-2">
                  <Clock size={12} /> {sf.shift}
                </td>
                <td className="px-6 py-4">
                  {/* Select Dropdown to Alloc Room */}
                  <select
                    value={sf.room}
                    onChange={(e) => handleRoomAllocation(sf.id, sf.name, e.target.value)}
                    className="bg-color-mix(in srgb, var(--color-surface-container) 70%, transparent) border border-[var(--color-border)] rounded-lg py-1.5 px-3 outline-none text-[11px] text-white focus:border-purple-500 font-medium cursor-pointer"
                  >
                    <option value="Quầy bán vé trung tâm">Quầy bán vé trung tâm</option>
                    <option value="Quầy bắp nước số 1">Quầy bắp nước số 1</option>
                    <option value="Quầy bắp nước số 2">Quầy bắp nước số 2</option>
                    <option value="Phòng chiếu 1 (Standard)">Phòng chiếu 1 (Standard)</option>
                    <option value="Phòng chiếu 2 (3D)">Phòng chiếu 2 (3D)</option>
                    <option value="Phòng chiếu 3 (IMAX)">Phòng chiếu 3 (IMAX)</option>
                    <option value="Phòng chiếu 4 (Dolby Atmos)">Phòng chiếu 4 (Dolby Atmos)</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sf.status === 'Trực ca'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : sf.status === 'Đã ra ca'
                        ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {sf.status === 'Trực ca' && <UserCheck size={10} />}
                    {sf.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleStatusToggle(sf.id, sf.name, sf.status)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-white/5 transition-all text-[10px]"
                  >
                    Đổi trạng thái
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
