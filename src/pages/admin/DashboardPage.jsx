import { useState, useEffect } from 'react'
import { Film, Users, Ticket, Tag, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const STAT_DEFS = [
  {
    key: 'movies',
    label: 'Tổng phim',
    fallback: '0',
    icon: Film,
    color: 'from-red-500/20 to-red-500/5',
    iconColor: 'text-red-500',
    borderColor: 'group-hover:border-red-500/30',
    route: '/admin/movies'
  },
  {
    key: 'employees',
    label: 'Nhân viên',
    fallback: '0',
    icon: Users,
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
    borderColor: 'group-hover:border-blue-500/30',
    route: '/admin/employees'
  },
  {
    key: 'tickets',
    label: 'Vé bán hôm nay',
    fallback: '0',
    icon: Ticket,
    color: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-400',
    borderColor: 'group-hover:border-green-500/30',
    route: '/admin/bookings'
  },
  {
    key: 'promotions',
    label: 'Khuyến mãi hoạt động',
    fallback: '0',
    icon: Tag,
    color: 'from-yellow-500/20 to-yellow-500/5',
    iconColor: 'text-yellow-400',
    borderColor: 'group-hover:border-yellow-500/30',
    route: '/admin/promotions'
  },
]

const recentBookings = [
  { id: '1', user: 'Nguyễn Minh', movie: 'Assassin Classroom', time: '10 phút trước', price: '95,000đ', status: 'SUCCESS' },
  { id: '2', user: 'Lê Trọng Nghĩa', movie: 'Spider-man: Brand New Day', time: '25 phút trước', price: '120,000đ', status: 'SUCCESS' },
  { id: '3', user: 'Trần Thị A', movie: 'The Backrooms', time: '1 giờ trước', price: '95,000đ', status: 'PENDING' },
  { id: '4', user: 'Phạm Văn B', movie: 'Spider Noir', time: '2 giờ trước', price: '110,000đ', status: 'SUCCESS' },
]

const revenueData = [
  { day: 'Thứ 2', amount: 4200000, percentage: '45%' },
  { day: 'Thứ 3', amount: 5600000, percentage: '60%' },
  { day: 'Thứ 4', amount: 3800000, percentage: '40%' },
  { day: 'Thứ 5', amount: 7200000, percentage: '80%' },
  { day: 'Thứ 6', amount: 9800000, percentage: '100%' },
  { day: 'Thứ 7', amount: 8500000, percentage: '90%' },
  { day: 'Chủ nhật', amount: 9000000, percentage: '95%' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(
    STAT_DEFS.reduce((acc, s) => ({ ...acc, [s.key]: s.fallback }), {})
  )
  const [statsLoading, setStatsLoading] = useState(true)
  const navigate = useNavigate()

  // Fetch dashboard stats from API
  useEffect(() => {
    const update = (key, value) => setStats(prev => ({ ...prev, [key]: String(value) }))

    // Interceptor sẽ tự gắn Bearer token từ localStorage
    Promise.allSettled([
      // Tổng phim - endpoint public
      api.get('/api/v1/movies', { params: { size: 1 } })
        .then(r => update('movies', r.data?.result?.totalElements ?? r.data?.result?.length ?? 0)),

      // Nhân viên (endpoint admin) — chỉ đếm STAFF, loại trừ MANAGER
      api.get('/api/v1/admin/employees', { params: { page: 0, size: 1, role: 'STAFF' } })
        .then(r => {
          const result = r.data?.result
          const count = result?.totalElements ?? result?.content?.length ?? (Array.isArray(result) ? result.length : 0)
          update('employees', count)
        }),

      // Vé bán hôm nay
      api.get('/api/v1/bookings/today')
        .then(r => {
          const result = r.data?.result
          const count = result?.totalElements ?? result?.length ?? (typeof result === 'number' ? result : 0)
          update('tickets', count)
        }),

      // Khuyến mãi đang hoạt động
      api.get('/api/v1/promotions', { params: { status: 'ACTIVE', size: 1 } })
        .then(r => {
          const result = r.data?.result
          const count = result?.totalElements ?? result?.content?.length ?? (Array.isArray(result) ? result.length : 0)
          update('promotions', count)
        }),
    ]).finally(() => setStatsLoading(false))
  }, [])

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Welcome & Overview Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1
            className="text-4xl text-gray-900 font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Tổng Quan Hệ Thống
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Báo cáo thống kê thời gian thực & hoạt động bán vé hôm nay.
          </p>
        </div>
        <div
          className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-gray-200 backdrop-blur-md"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif', color: '#1f2937' }}>
            Hệ thống trực tuyến
          </span>
        </div>
      </motion.div>

      {/* Stats Counter Section */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
      >
        {STAT_DEFS.map(s => {
          const Icon = s.icon
          const value = stats[s.key]
          return (
            <motion.div
              key={s.key}
              onDoubleClick={() => s.route && navigate(s.route)}
              title={s.route ? 'Double-click để xem chi tiết' : undefined}
              className={`group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex items-center justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(229,9,20,0.08)] ${s.borderColor} ${s.route ? 'cursor-pointer select-none' : ''}`}
              variants={{ hidden: { opacity: 0, y: 24, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } } }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {s.label}
                </p>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {statsLoading ? '...' : value}
                </p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-br ${s.color} transition-all duration-300 group-hover:scale-110`}>
                <Icon className={`w-6 h-6 ${s.iconColor}`} />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue chart mockup */}
        <div
          className="lg:col-span-2 rounded-xl border border-[var(--color-border)] p-6 space-y-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Doanh thu tuần này
              </h2>
            </div>
            <div className="text-sm font-bold text-red-500 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <DollarSign className="w-4 h-4" />
              <span>49,100,000đ</span>
            </div>
          </div>

          {/* Bar Chart Simulation */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-white/5 pb-2">
            {revenueData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end relative">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] text-white py-1 px-1.5 rounded border border-white/10 absolute -translate-y-16 pointer-events-none whitespace-nowrap z-30">
                  {(d.amount / 1000000).toFixed(1)}M đ
                </div>
                <motion.div
                  className="w-full rounded-t-md bg-gradient-to-t from-red-600 to-rose-500 group-hover:from-red-500 group-hover:to-rose-400 group-hover:shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                  initial={{ height: 0 }}
                  animate={{ height: d.percentage }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                <span className="text-[10px] md:text-xs text-[var(--color-text-muted)] group-hover:text-white transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent booking list */}
        <div
          className="rounded-xl border border-[var(--color-border)] p-6 space-y-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Vé đặt gần đây
            </h2>
          </div>

          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
          >
            {recentBookings.map((b) => (
              <motion.div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-2)] border border-white/5 hover:border-white/10 transition-colors"
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-bold text-red-500">
                    {b.user.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" style={{ fontFamily: 'Inter, sans-serif' }} title={b.user}>
                      {b.user}
                    </h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px]">
                      {b.movie}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-white block" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {b.price}
                  </span>
                  <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${b.status === 'SUCCESS' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                    {b.status === 'SUCCESS' ? 'THÀNH CÔNG' : 'ĐANG XỬ LÝ'}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </motion.div>
  )
}