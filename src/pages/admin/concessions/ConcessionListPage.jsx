import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { concessionService, CONCESSION_ITEM_TYPES, ITEM_TYPE_EMOJIS } from '../../../services/concessionService'
import {
  Plus, Pencil, Trash2, Search, Coffee, ChefHat, Filter, AlertCircle, Eye, EyeOff,
  Sparkles, Hash, Star, X, ChevronDown, UtensilsCrossed, Cookie, Apple, CircleDollarSign, Package, Tag, Grid3x3
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

const TYPE_META = {
  food: { label: 'Do an', bg: 'bg-amber-500', border: 'border-amber-700', text: 'text-white', icon: UtensilsCrossed },
  drink: { label: 'Do uong', bg: 'bg-sky-500', border: 'border-sky-700', text: 'text-white', icon: Coffee },
  combo: { label: 'Combo', bg: 'bg-rose-500', border: 'border-rose-700', text: 'text-white', icon: Package },
}

const EMOJI_TO_ICON = {
  '🍿': UtensilsCrossed,
  '🥤': Coffee,
  '🎒': Package,
}

export default function ConcessionListPage() {
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const navigate = useNavigate()

  const loadConcessions = () => {
    setLoading(true)
    concessionService.getAll()
      .then(res => {
        const data = res.data?.result?.content || res.data?.result || res.data || []
        setItems(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Loi tai danh sach bap nuoc:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadConcessions()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await concessionService.delete(deleteTarget.id)
      setItems(prev => prev.filter(item => item.id !== deleteTarget.id))
    } catch (err) {
      console.error('Loi khi xoa bap nuoc:', err)
      alert(err.response?.data?.message || 'Co loi xay ra khi xoa san pham.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (item) => {
    try {
      const res = await concessionService.toggleActive(item.id)
      const updated = res.data?.result || res.data
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: updated.isActive } : i))
    } catch (err) {
      console.error('Loi khi doi trang thai san pham:', err)
    }
  }

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num) + 'd'
  }

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = categoryFilter === 'ALL' || item.itemType === categoryFilter
      const matchStatus = statusFilter === 'ALL' ||
                          (statusFilter === 'ACTIVE' && item.isActive) ||
                          (statusFilter === 'INACTIVE' && !item.isActive)
      return matchSearch && matchCategory && matchStatus
    })
  }, [items, searchQuery, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    let foodCount = 0, drinkCount = 0, comboCount = 0
    items.forEach(i => {
      if (i.itemType === 'food') foodCount++
      else if (i.itemType === 'drink') drinkCount++
      else if (i.itemType === 'combo') comboCount++
    })
    return { total: items.length, food: foodCount, drink: drinkCount, combo: comboCount }
  }, [items])

  const hasFilter = categoryFilter !== 'ALL' || statusFilter !== 'ALL'

  return (
    <div className="text-left space-y-6">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <ChefHat size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> CONCESSION CENTER
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {stats.total} SP
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Eye size={10} strokeWidth={3} /> {items.filter(i => i.isActive).length} dang ban
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly<br /><span className="text-red-600">bap nuoc & do an</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Quan ly danh sach cac mon an, thuc uong va goi combo bap nuoc phuc vu khach hang.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/concessions/add')}
              className="inline-flex items-center gap-1.5 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-sm rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} /> Them mon moi
            </button>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_STATS_HERE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'TONG SAN PHAM', value: stats.total, icon: Tag, bg: 'bg-slate-900', text: 'text-amber-300' },
          { label: 'DO AN (FOOD)', value: stats.food, icon: UtensilsCrossed, bg: 'bg-amber-500', text: 'text-white' },
          { label: 'DO UONG (DRINK)', value: stats.drink, icon: Coffee, bg: 'bg-sky-500', text: 'text-white' },
          { label: 'COMBO BAP NUOC', value: stats.combo, icon: Package, bg: 'bg-rose-500', text: 'text-white' },
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
              <p className={`text-3xl font-black font-mono leading-none ${
                s.label === 'DO AN (FOOD)' && s.value > 0 ? 'text-amber-600' :
                s.label === 'DO UONG (DRINK)' && s.value > 0 ? 'text-sky-600' :
                s.label === 'COMBO BAP NUOC' && s.value > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}>
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
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filtered.length} / {items.length} san pham</p>
            </div>
            <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Search size={11} strokeWidth={2.5} className="text-red-600" />
              Tu khoa
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Tim theo ten san pham..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-rose-50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Grid3x3 size={11} strokeWidth={2.5} className="text-red-600" />
              Phan loai
            </label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 px-3 pr-9 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
              >
                <option value="ALL">Tat ca danh muc</option>
                <option value="food">Do an (Food)</option>
                <option value="drink">Do uong (Drink)</option>
                <option value="combo">Combo bap nuoc</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
              <Eye size={11} strokeWidth={2.5} className="text-red-600" />
              Trang thai
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 px-3 pr-9 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-rose-50 cursor-pointer transition-all"
              >
                <option value="ALL">Tat ca trang thai</option>
                <option value="ACTIVE">Dang ban</option>
                <option value="INACTIVE">Ngung ban</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {hasFilter && (
          <div className="px-5 pb-5">
            <button
              onClick={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); setSearchQuery('') }}
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
            <ChefHat size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-rose-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Danh sach san pham</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filtered.length} ket qua</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-amber-300">
                <tr className="text-[10px] uppercase font-black tracking-[0.15em] border-b-2 border-slate-900">
                  <th className="px-4 py-3 text-left">Hinh anh</th>
                  <th className="px-4 py-3 text-left">Ten san pham</th>
                  <th className="px-4 py-3 text-left">Phan loai</th>
                  <th className="px-4 py-3 text-left">Gia ban</th>
                  <th className="px-4 py-3 text-left">Trang thai</th>
                  <th className="px-4 py-3 text-right">Hanh dong</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 bg-white">
                {filtered.map(item => {
                  const typeMeta = TYPE_META[item.itemType] || TYPE_META.food
                  const TypeIcon = typeMeta.icon
                  const emojiIcon = item.imageUrl && EMOJI_TO_ICON[item.imageUrl] ? EMOJI_TO_ICON[item.imageUrl] : null
                  const isImageUrl = item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') || item.imageUrl.startsWith('data:'))
                  const DisplayIcon = isImageUrl ? null : (emojiIcon || ITEM_TYPE_EMOJIS[item.itemType] === '🍿' ? UtensilsCrossed : (ITEM_TYPE_EMOJIS[item.itemType] === '🥤' ? Coffee : Package))

                  return (
                    <tr key={item.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 bg-slate-100 border-2 border-slate-900 rounded-lg flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                          {isImageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : DisplayIcon ? (
                            <DisplayIcon size={22} className="text-slate-700" strokeWidth={2.5} />
                          ) : (
                            <span className="text-2xl">{item.imageUrl || ITEM_TYPE_EMOJIS[item.itemType] || '🍿'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[260px]">
                          <p className="text-sm font-black text-slate-900 leading-tight">{item.name}</p>
                          <p className="text-[11px] font-bold text-slate-600 mt-0.5 line-clamp-1" title={item.description}>
                            {item.description || 'Khong co mo ta'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${typeMeta.bg} ${typeMeta.text} border-2 ${typeMeta.border} rounded-md text-[10px] font-black uppercase`}>
                          <TypeIcon size={11} strokeWidth={3} />
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-200 border-2 border-rose-700 text-rose-900 rounded-md text-xs font-black font-mono">
                          <CircleDollarSign size={11} strokeWidth={3} /> {formatVND(item.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 border-2 border-emerald-700 text-white rounded-md text-[10px] font-black uppercase">
                              <Eye size={11} strokeWidth={3} /> Dang ban
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-400 border-2 border-slate-600 text-white rounded-md text-[10px] font-black uppercase">
                              <EyeOff size={11} strokeWidth={3} /> Ngung ban
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleActive(item)}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border-2 border-amber-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                            title={item.isActive ? 'Tam ngung ban' : 'Kich hoat lai'}
                          >
                            {item.isActive ? <EyeOff size={11} strokeWidth={3} /> : <Eye size={11} strokeWidth={3} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/concessions/edit/${item.id}`)}
                            title="Sua"
                            className="p-2 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-lg border-2 border-sky-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                          >
                            <Pencil size={12} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
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
                <ChefHat size={36} className="text-slate-400" strokeWidth={2} />
              </div>
              <p className="text-base font-black uppercase tracking-wider text-slate-700">
                Khong tim thay san pham
              </p>
              <p className="text-xs font-bold text-slate-500">Hay thu voi bo loc khac.</p>
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
                <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Xac nhan xoa mon</h4>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Hanh dong khong the hoan tac</p>
              </div>
            </div>
            <div className="p-6 space-y-3 bg-white">
              <div className="flex items-center gap-3 p-3 bg-amber-100 border-2 border-amber-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <AlertCircle size={20} className="text-amber-700 shrink-0" strokeWidth={3} />
                <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Hanh dong nay khong the hoan tac!</p>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                Ban co chac muon xoa san pham khoi he thong?
              </p>
              <div className="p-3 bg-rose-100 border-2 border-rose-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <p className="text-base font-black text-rose-900 leading-tight text-center">"{deleteTarget.name}"</p>
              </div>
              {deleteTarget.price != null && (
                <div className="flex items-center gap-2 p-3 bg-slate-100 border-2 border-slate-900 rounded-xl">
                  <CircleDollarSign size={14} className="text-slate-700 shrink-0" strokeWidth={3} />
                  <span className="text-xs font-bold text-slate-800">
                    Gia hien tai: <span className="font-black font-mono">{formatVND(deleteTarget.price)}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={3} /> Huy bo
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