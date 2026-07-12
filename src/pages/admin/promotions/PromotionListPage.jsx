import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  promotionService,
  PROMOTION_TYPE_LABELS,
  PROMOTION_STATUS,
  PROMOTION_STATUS_LABELS,
  computePromotionStatus,
  formatDiscountValue,
  getDaysRemaining,
} from '../../../services/promotionService'
import Button from '../../../components/common/Button'
import {
  Plus, Pencil, Trash2, Search, Tag, Calendar, AlertCircle, Filter, X,
  TrendingUp, Zap, Users, Clock, Hash, Sparkles, Percent, ChevronDown, Star, Gift
} from 'lucide-react'
import { motion } from 'motion/react'

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

const STATUS_COLORS = {
  ACTIVE: { bg: 'bg-emerald-500', border: 'border-emerald-700', text: 'text-white', label: 'Dang hoat dong' },
  EXPIRED: { bg: 'bg-rose-500', border: 'border-rose-700', text: 'text-white', label: 'Da het han' },
  DISABLED: { bg: 'bg-amber-500', border: 'border-amber-700', text: 'text-white', label: 'Da vo hieu hoa' },
}

const TYPE_ICONS = {
  VOUCHER: Gift,
  FLASH_SALE: Zap,
  COMBO: Tag,
  MOVIE_SPECIFIC: Tag,
  BIRTHDAY: Tag,
  MEMBER_ONLY: Users,
}

export default function PromotionListPage() {
  const [promotions, setPromotions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const navigate = useNavigate()

  const loadPromotions = (search = '') => {
    setLoading(true)
    promotionService.getAll(search ? { search } : {})
      .then(res => {
        const data = res.data?.result || res.data || []
        setPromotions(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Loi tai danh sach khuyen mai:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadPromotions(searchQuery)
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await promotionService.delete(deleteTarget.id)
      setPromotions(prev => prev.filter(p => p.id !== deleteTarget.id))
    } catch (err) {
      console.error('Loi khi xoa khuyen mai:', err)
      alert(err.response?.data?.message || 'Co loi xay ra khi xoa khuyen mai.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (e) { return dateStr }
  }

  const filtered = useMemo(() => {
    return promotions.filter(p => {
      const status = computePromotionStatus(p)
      if (statusFilter !== 'ALL' && status !== statusFilter) return false
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false
      return true
    })
  }, [promotions, typeFilter, statusFilter])

  const stats = useMemo(() => {
    let active = 0, expired = 0, draft = 0
    promotions.forEach(p => {
      const s = computePromotionStatus(p)
      if (s === PROMOTION_STATUS.ACTIVE) active++
      else if (s === PROMOTION_STATUS.EXPIRED) expired++
      else draft++
    })
    return { total: promotions.length, active, expired, draft }
  }, [promotions])

  const hasFilter = typeFilter !== 'ALL' || statusFilter !== 'ALL'

  return (
    <div className="text-left space-y-6">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Tag size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> PROMO CENTER
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {stats.total} KM
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly<br /><span className="text-red-600">khuyen mai</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Xem, tim kiem, them moi, cap nhat hoac xoa cac chuong trinh khuyen mai va chien dich quang cao.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/promotions/add')}
              className="inline-flex items-center gap-1.5 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-sm rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} /> Them khuyen mai
            </button>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_STATS_HERE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'TONG KM', value: stats.total, icon: Tag, bg: 'bg-slate-900', text: 'text-amber-300', border: 'border-slate-900' },
          { label: 'DANG CHAY', value: stats.active, icon: TrendingUp, bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-700' },
          { label: 'BAN NHAP / SAP', value: stats.draft, icon: Clock, bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-700' },
          { label: 'DA HET HAN', value: stats.expired, icon: AlertCircle, bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-700' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">{s.label}</span>
                <div className={`w-9 h-9 ${s.bg} ${s.text} rounded-lg flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`}>
                  <Icon size={16} strokeWidth={3} />
                </div>
              </div>
              <p className={`text-3xl font-black font-mono leading-none ${s.value > 0 && s.label === 'DANG CHAY' ? 'text-emerald-600' : s.label === 'DA HET HAN' && s.value > 0 ? 'text-rose-600' : s.label === 'BAN NHAP / SAP' && s.value > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {s.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <Filter size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-amber-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Bo loc va tim kiem</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filtered.length} / {promotions.length} chuong trinh</p>
            </div>
            <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Search size={11} strokeWidth={2.5} className="text-red-600" />
              Tu khoa
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Tim kiem theo tieu de, noi dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-rose-50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <TrendingUp size={11} strokeWidth={2.5} className="text-red-600" />
              Trang thai
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 px-3 pr-9 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
              >
                <option value="ALL">Tat ca trang thai</option>
                {Object.entries(PROMOTION_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Tag size={11} strokeWidth={2.5} className="text-red-600" />
              Loai KM
            </label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 px-3 pr-9 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
              >
                <option value="ALL">Tat ca loai</option>
                {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {hasFilter && (
          <div className="px-5 pb-5">
            <button
              onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL') }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-rose-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              <X size={11} strokeWidth={3} /> Bo loc
            </button>
          </div>
        )}
      </div>

      {/* PART_LIST_HERE */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
              <p className="text-sm font-black uppercase tracking-wider text-slate-700">Dang tai...</p>
            </div>
          </div>
        )}

        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
            <Tag size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-rose-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Danh sach khuyen mai</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filtered.length} ket qua</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-amber-300">
                <tr className="text-[10px] uppercase font-black tracking-[0.15em] border-b-2 border-slate-900">
                  <th className="px-4 py-3 text-left">Tieu de / Code</th>
                  <th className="px-4 py-3 text-left">Loai KM</th>
                  <th className="px-4 py-3 text-left">Muc giam</th>
                  <th className="px-4 py-3 text-left">Trang thai</th>
                  <th className="px-4 py-3 text-left">Bat dau</th>
                  <th className="px-4 py-3 text-left">Ket thuc</th>
                  <th className="px-4 py-3 text-right">Hanh dong</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 bg-white">
                {filtered.map(p => {
                  const status = computePromotionStatus(p)
                  const statusMeta = STATUS_COLORS[status] || STATUS_COLORS.DISABLED
                  const days = getDaysRemaining(p.endTime)
                  const discountText = formatDiscountValue(p)
                  const TypeIcon = TYPE_ICONS[p.type] || Tag
                  return (
                    <tr key={p.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="max-w-[260px]">
                          <p className="text-sm font-black text-slate-900 truncate" title={p.title}>{p.title}</p>
                          {p.code && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-amber-200 border-2 border-amber-700 text-amber-900 rounded-md text-[10px] font-mono font-black uppercase tracking-wider">
                              <Tag size={9} strokeWidth={3} /> {p.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-violet-100 border-2 border-violet-700 text-violet-900 rounded-md text-[10px] font-black uppercase">
                          <TypeIcon size={11} strokeWidth={3} />
                          {PROMOTION_TYPE_LABELS[p.type] || 'Voucher'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {discountText ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-200 border-2 border-rose-700 text-rose-900 rounded-md text-xs font-black font-mono">
                            <Percent size={11} strokeWidth={3} /> {discountText}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase border-2 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                            {statusMeta.label}
                          </span>
                          {status === 'ACTIVE' && days != null && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600">
                              <Clock size={9} strokeWidth={3} className="text-red-600" /> con {days} ngay
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold text-slate-700">{formatDate(p.startTime)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold text-slate-700">{formatDate(p.endTime)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/promotions/edit/${p.id}`)}
                            title="Chinh sua"
                            className="p-2 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-lg border-2 border-sky-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                          >
                            <Pencil size={12} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="Xoa"
                            className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg border-2 border-rose-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                          >
                            <Trash2 size={12} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center">
                <Tag size={36} className="text-slate-400" strokeWidth={2} />
              </div>
              <p className="text-base font-black uppercase tracking-wider text-slate-700">
                {hasFilter ? 'Khong co KM nao khop bo loc' : 'Khong tim thay khuyen mai'}
              </p>
              <p className="text-xs font-bold text-slate-500">Thu thay doi tu khoa hoac bo loc.</p>
            </div>
          )}
        </div>
      </div>

      {/* PART_MODAL_HERE */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
          >
            <TicketStrip count={14} />
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 px-6 py-5 flex items-center gap-3 border-b-2 border-slate-900">
              <div className="w-10 h-10 bg-rose-600 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <Trash2 size={18} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Xac nhan xoa</h4>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Hanh dong khong the hoan tac</p>
              </div>
            </div>
            <div className="p-6 space-y-3 bg-white">
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                Ban co chac muon xoa chien dich khuyen mai:
              </p>
              <div className="p-3 bg-rose-100 border-2 border-rose-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <p className="text-sm font-black text-rose-900 leading-tight">"{deleteTarget.title}"</p>
              </div>
              {deleteTarget.code && (
                <div className="flex items-center gap-2 p-3 bg-amber-100 border-2 border-amber-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <Tag size={14} className="text-amber-900 shrink-0" strokeWidth={3} />
                  <span className="text-xs font-bold text-amber-900">
                    Ma voucher: <span className="font-mono font-black">{deleteTarget.code}</span> (se bi xoa vinh vien)
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-slate-100 border-2 border-slate-900 rounded-xl">
                <Calendar size={14} className="text-slate-700 shrink-0" strokeWidth={3} />
                <span className="text-xs font-bold text-slate-800">
                  Thoi han: <span className="font-black">{formatDate(deleteTarget.startTime)}</span> den <span className="font-black">{formatDate(deleteTarget.endTime)}</span>
                </span>
              </div>
            </div>
            <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={3} /> Huy
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <Trash2 size={14} strokeWidth={3} /> Dong y xoa
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}