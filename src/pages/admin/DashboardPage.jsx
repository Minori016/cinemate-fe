import { useState, useEffect } from 'react'
import {
  Film, Users, Ticket, Tag, TrendingUp, DollarSign, Activity,
  LayoutDashboard, Sparkles, Crown, BarChart3, ArrowUpRight,
  CheckCircle2, Clock, Wallet, Calendar, Star, Tv,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

const STAT_DEFS = [
  {
    key: 'movies',
    label: 'TONG PHIM',
    fallback: '0',
    icon: Film,
    bg: 'bg-red-600',
    lightBg: 'bg-red-100',
    route: '/admin/movies'
  },
  {
    key: 'employees',
    label: 'NHAN VIEN',
    fallback: '0',
    icon: Users,
    bg: 'bg-sky-600',
    lightBg: 'bg-sky-100',
    route: '/admin/employees'
  },
  {
    key: 'tickets',
    label: 'VE BAN HOM NAY',
    fallback: '0',
    icon: Ticket,
    bg: 'bg-emerald-600',
    lightBg: 'bg-emerald-100',
    route: '/admin/bookings'
  },
  {
    key: 'promotions',
    label: 'KHUYEN MAI HOAT DONG',
    fallback: '0',
    icon: Tag,
    bg: 'bg-amber-500',
    lightBg: 'bg-amber-100',
    route: '/admin/promotions'
  },
]

const recentBookings = [
  { id: '1', user: 'Nguyen Minh', movie: 'Assassin Classroom', time: '10 phut truoc', price: '95,000d', status: 'SUCCESS' },
  { id: '2', user: 'Le Trong Nghia', movie: 'Spider-man: Brand New Day', time: '25 phut truoc', price: '120,000d', status: 'SUCCESS' },
  { id: '3', user: 'Tran Thi A', movie: 'The Backrooms', time: '1 gio truoc', price: '95,000d', status: 'PENDING' },
  { id: '4', user: 'Pham Van B', movie: 'Spider Noir', time: '2 gio truoc', price: '110,000d', status: 'SUCCESS' },
]

const revenueData = [
  { day: 'Thu 2', amount: 4200000, percentage: 45 },
  { day: 'Thu 3', amount: 5600000, percentage: 60 },
  { day: 'Thu 4', amount: 3800000, percentage: 40 },
  { day: 'Thu 5', amount: 7200000, percentage: 80 },
  { day: 'Thu 6', amount: 9800000, percentage: 100 },
  { day: 'Thu 7', amount: 8500000, percentage: 90 },
  { day: 'Chu nhat', amount: 9000000, percentage: 95 },
]

const formatVND = (n) => `${(n / 1000000).toFixed(1)}M`
const formatVNDShort = (n) => {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

export default function DashboardPage() {
  const [stats, setStats] = useState(
    STAT_DEFS.reduce((acc, s) => ({ ...acc, [s.key]: s.fallback }), {})
  )
  const [statsLoading, setStatsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const update = (key, value) => setStats(prev => ({ ...prev, [key]: String(value) }))

    Promise.allSettled([
      api.get('/api/v1/movies', { params: { size: 1 } })
        .then(r => update('movies', r.data?.result?.totalElements ?? r.data?.result?.length ?? 0)),

      api.get('/api/v1/admin/employees', { params: { page: 0, size: 1, role: 'STAFF' } })
        .then(r => {
          const result = r.data?.result
          const count = result?.totalElements ?? result?.content?.length ?? (Array.isArray(result) ? result.length : 0)
          update('employees', count)
        }),

      api.get('/api/v1/bookings/today')
        .then(r => {
          const result = r.data?.result
          const count = result?.totalElements ?? result?.length ?? (typeof result === 'number' ? result : 0)
          update('tickets', count)
        }),

      api.get('/api/v1/promotions', { params: { status: 'ACTIVE', size: 1 } })
        .then(r => {
          const result = r.data?.result
          const count = result?.totalElements ?? result?.content?.length ?? (Array.isArray(result) ? result.length : 0)
          update('promotions', count)
        }),
    ]).finally(() => setStatsLoading(false))
  }, [])

  const totalWeek = revenueData.reduce((s, d) => s + d.amount, 0)
  const peakDay = revenueData.reduce((max, d) => d.amount > max.amount ? d : max, revenueData[0])
  const avgPerDay = Math.round(totalWeek / revenueData.length)

  return (
    <motion.div
      className="space-y-6 max-w-[1400px]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-sky-50 via-violet-50 to-rose-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] shrink-0">
                <LayoutDashboard size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Crown size={10} fill="currentColor" /> ADMIN DASHBOARD
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    HE THONG TRUC TUYEN
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Tong quan <span className="text-red-600">he thong</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Bao cao thong ke thoi gian thuc & hoat dong ban ve hom nay.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
              <Calendar size={14} strokeWidth={3} className="text-slate-700" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">REALTIME 2026</span>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_DEFS.map((s, i) => {
          const Icon = s.icon
          const value = stats[s.key]
          return (
            <motion.button
              key={s.key}
              type="button"
              onClick={() => s.route && navigate(s.route)}
              title={s.route ? 'Click de xem chi tiet' : undefined}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="group bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] p-5 text-left transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`w-12 h-12 ${s.bg} border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center`}>
                  <Icon size={20} className="text-white" strokeWidth={3} />
                </div>
                <div className="w-7 h-7 bg-slate-100 border-2 border-slate-300 rounded-lg flex items-center justify-center group-hover:bg-amber-100 group-hover:border-slate-900 transition-all">
                  <ArrowUpRight size={12} strokeWidth={3} className="text-slate-700 group-hover:text-slate-900" />
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${s.lightBg} text-slate-900 inline-block px-2 py-0.5 rounded mb-1.5`}>
                  {s.label}
                </p>
                <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                  {statsLoading ? <span className="inline-block w-10 h-8 bg-slate-200 rounded animate-pulse" /> : value}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* MAIN GRID: REVENUE + BOOKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
          <div className="flex items-stretch border-b-2 border-slate-900">
            <div className="bg-emerald-600 text-white px-4 py-3 flex items-center border-r-2 border-slate-900">
              <BarChart3 size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 px-5 py-3 flex items-center justify-between bg-emerald-50 gap-3">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Doanh thu tuan nay</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">7 ngay gan nhat</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-red-600 text-white border-2 border-slate-900 rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <Wallet size={12} strokeWidth={3} />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {formatVNDShort(totalWeek)} d
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500 text-white border-2 border-slate-900 rounded-lg px-2.5 py-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <TrendingUp size={11} strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase tracking-wider">+{formatVNDShort(avgPerDay)}/ngay</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-7 gap-3 items-end h-56 mb-3">
              {revenueData.map((d, i) => {
                const isPeak = d.day === peakDay.day
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="relative w-full">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-amber-300 text-[10px] font-black uppercase px-2 py-1 rounded border-2 border-slate-900 pointer-events-none whitespace-nowrap z-10">
                        {formatVND(d.amount)} d
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.percentage}%` }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className={`w-full rounded-t-lg border-2 border-slate-900 ${
                          isPeak
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                            : 'bg-gradient-to-t from-red-600 to-rose-400'
                        } group-hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-shadow relative`}
                      >
                        {isPeak && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded border-2 border-slate-900 whitespace-nowrap">
                            PEAK
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-7 gap-3 pt-3 border-t-2 border-slate-900">
              {revenueData.map(d => (
                <div key={d.day} className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">{d.day}</p>
                </div>
              ))}
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t-2 border-dashed border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-red-600 border-2 border-slate-900 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign size={14} strokeWidth={3} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">CAO NHAT</p>
                  <p className="text-xs font-black text-slate-900 truncate">{peakDay.day}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-600 border-2 border-slate-900 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp size={14} strokeWidth={3} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">TRUNG BINH</p>
                  <p className="text-xs font-black text-slate-900 truncate">{formatVND(avgPerDay)} d</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-600 border-2 border-slate-900 rounded-lg flex items-center justify-center shrink-0">
                  <Star size={14} strokeWidth={3} className="text-white" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">TONG CONG</p>
                  <p className="text-xs font-black text-slate-900 truncate">{formatVNDShort(totalWeek)} d</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT BOOKINGS */}
        <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
          <div className="flex items-stretch border-b-2 border-slate-900">
            <div className="bg-violet-600 text-white px-4 py-3 flex items-center border-r-2 border-slate-900">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 px-5 py-3 flex items-center justify-between bg-violet-50">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Ve dat gan day</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{recentBookings.length} giao dich</p>
              </div>
              <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
            </div>
          </div>

          <div className="p-4 space-y-3">
            {recentBookings.map((b, idx) => {
              const isSuccess = b.status === 'SUCCESS'
              const accent = isSuccess ? 'bg-emerald-600' : 'bg-amber-500'
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + idx * 0.06 }}
                  className="relative flex items-center gap-3 p-3 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent} rounded-l-lg`} />
                  <div className={`w-9 h-9 ${accent} border-2 border-slate-900 rounded-lg flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]`}>
                    <Tv size={14} strokeWidth={3} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-slate-900 truncate">{b.user}</p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 truncate">{b.movie}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} strokeWidth={3} className="text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">{b.time}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">{b.price}</p>
                    <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                      isSuccess
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
                        : 'bg-amber-100 text-amber-900 border-amber-700'
                    }`}>
                      {isSuccess ? <CheckCircle2 size={9} strokeWidth={3} /> : <Clock size={9} strokeWidth={3} />}
                      {isSuccess ? 'OK' : 'WAIT'}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}