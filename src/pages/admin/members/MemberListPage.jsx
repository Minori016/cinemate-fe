import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { memberService } from '../../../services/memberService'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus, Search, Pencil, Trash2, Users,
  X, Mail, Phone, Calendar, Star,
  Sparkles, Hash, Filter, ChevronDown, AlertCircle, Lock, Unlock, UserMinus, Award, BadgeCheck, User,
} from 'lucide-react'

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

const STATUS_META = {
  ACTIVE: { bg: 'bg-emerald-500', border: 'border-emerald-700', text: 'text-white', label: 'Hoạt động', icon: BadgeCheck, dot: 'bg-emerald-500' },
  LOCKED: { bg: 'bg-rose-500', border: 'border-rose-700', text: 'text-white', label: 'Bị khóa', icon: Lock, dot: 'bg-rose-500' },
  INACTIVE: { bg: 'bg-slate-500', border: 'border-slate-700', text: 'text-white', label: 'Đã xóa', icon: UserMinus, dot: 'bg-slate-400' },
}

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả', bg: 'bg-violet-500', border: 'border-violet-700' },
  { key: 'ACTIVE', label: 'Hoạt động', bg: 'bg-emerald-500', border: 'border-emerald-700' },
  { key: 'LOCKED', label: 'Bị khóa', bg: 'bg-rose-500', border: 'border-rose-700' },
  { key: 'INACTIVE', label: 'Đã xóa', bg: 'bg-slate-500', border: 'border-slate-700' },
]

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #6d28d9)',
  'linear-gradient(135deg, #2563eb, #0891b2)',
  'linear-gradient(135deg, #db2777, #f43f5e)',
  'linear-gradient(135deg, #059669, #14b8a6)',
  'linear-gradient(135deg, #ea580c, #f59e0b)',
  'linear-gradient(135deg, #4f46e5, #3b82f6)',
]

export default function MemberListPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    memberService.getAll()
      .then(r => {
        const resData = r.data?.result ?? r.data?.data ?? r.data ?? {}
        const list = resData.content ?? (Array.isArray(resData) ? resData : [])
        const memberList = list.filter(u => u.roles?.includes('MEMBER'))
        setMembers(memberList)
      })
      .catch(err => {
        console.error('Error loading members:', err)
        setMembers([])
      })
      .finally(() => { setLoading(false) })
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'ACTIVE').length,
    locked: members.filter(m => m.status === 'LOCKED').length,
    inactive: members.filter(m => m.status === 'INACTIVE').length,
  }

  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !term ||
      m.fullName?.toLowerCase().includes(term) ||
      m.username?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.phoneNumber?.includes(term)
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarGradient = (id) => AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length]

  const formatDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('vi-VN')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    memberService.delete(deleteTarget.uuid || deleteTarget.id)
      .then(() => {
        setDeleteTarget(null)
        setShowModal(false)
        load()
      })
      .catch(err => {
        console.error('Delete error:', err)
        setDeleteTarget(null)
        setShowModal(false)
      })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  const confirmUpdateStatus = (member, newStatus) => {
    if (member.status === newStatus) return
    setStatusTarget(member)
    setPendingStatus(newStatus)
    setShowStatusModal(true)
  }

  const handleUpdateStatus = () => {
    if (!statusTarget || !pendingStatus) return
    setLoading(true)
    memberService.updateStatus(statusTarget.uuid || statusTarget.id, pendingStatus)
      .then(() => {
        setShowStatusModal(false)
        setStatusTarget(null)
        setPendingStatus(null)
        load()
      })
      .catch(err => {
        console.error('Update status error:', err)
        alert('Cập nhật trạng thái thất bại!')
        setLoading(false)
      })
  }

  const hasActiveFilters = searchTerm || statusFilter !== 'all'

  return (
    <div className="text-left space-y-6">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-sky-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Users size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> MEMBER CENTER
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {stats.total} TV
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <BadgeCheck size={10} strokeWidth={3} /> {stats.active} hoạt động
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly<br /><span className="text-red-600">thanh vien</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Quan ly danh sach thanh vien da dang ky tai khoan tren he thong.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/members/add')}
              className="inline-flex items-center gap-1.5 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-sm rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} /> Them thanh vien
            </button>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_STATS_HERE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'TONG THANH VIEN', value: stats.total, icon: Users, bg: 'bg-slate-900', text: 'text-amber-300' },
          { label: 'HOAT DONG', value: stats.active, icon: BadgeCheck, bg: 'bg-emerald-500', text: 'text-white' },
          { label: 'BI KHOA', value: stats.locked, icon: Lock, bg: 'bg-rose-500', text: 'text-white' },
          { label: 'DA XOA', value: stats.inactive, icon: UserMinus, bg: 'bg-slate-500', text: 'text-white' },
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
                s.label === 'HOAT DONG' && s.value > 0 ? 'text-emerald-600' :
                s.label === 'BI KHOA' && s.value > 0 ? 'text-rose-600' :
                s.label === 'DA XOA' && s.value > 0 ? 'text-slate-600' : 'text-slate-900'
              }`}>{s.value}</p>
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
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-violet-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Bo loc va tim kiem</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filteredMembers.length} / {members.length} thanh vien</p>
            </div>
            <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-3 rounded-xl font-black uppercase tracking-wider text-xs border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  statusFilter === tab.key
                    ? `${tab.bg} ${tab.border} border-slate-900 text-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] translate-x-[-1px] translate-y-[-1px]`
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Tim kiem ten, tai khoan, email, SDT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-rose-50/50 border-2 border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-rose-50 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-rose-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              <X size={11} strokeWidth={3} /> Bo loc
            </button>
          )}
        </div>
      </div>

      {/* PART_GRID_HERE */}
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
            <Users size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-fuchsia-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Danh sach thanh vien</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{filteredMembers.length} ket qua</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member, index) => {
                  const statusMeta = STATUS_META[member.status] || STATUS_META.INACTIVE
                  const StatusIcon = statusMeta.icon
                  const dob = formatDate(member.dayOfBirth)
                  const gender = member.gender === 'MALE' ? 'Nam' : member.gender === 'FEMALE' ? 'Nu' : member.gender === 'OTHER' ? 'Khac' : ''
                  return (
                    <motion.div
                      key={member.uuid || member.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                      className="bg-white border-2 border-slate-200 hover:border-slate-900 rounded-2xl p-4 transition-all hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative shrink-0">
                          <div
                            className="w-14 h-14 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center"
                            style={{ background: getAvatarGradient(member.id) }}
                          >
                            <span className="text-white font-black text-base">{getInitials(member.fullName)}</span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusMeta.dot} rounded-full border-2 border-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-slate-900 leading-tight truncate" title={member.fullName}>
                            {member.fullName || 'Chua cap nhat'}
                          </h3>
                          <p className="text-[11px] font-mono font-bold text-slate-600 mt-0.5">@{member.username}</p>
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${statusMeta.bg} ${statusMeta.text} border-2 ${statusMeta.border} rounded text-[9px] font-black uppercase`}>
                              <StatusIcon size={9} strokeWidth={3} /> {statusMeta.label}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-200 border-2 border-violet-700 text-violet-900 rounded text-[9px] font-black uppercase">
                              <Award size={9} strokeWidth={3} /> TV
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5 mb-3 pb-3 border-b-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Mail size={12} className="text-slate-500 shrink-0" strokeWidth={2.5} />
                          <span className="truncate" title={member.email}>{member.email || 'Chua cap nhat'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Phone size={12} className="text-slate-500 shrink-0" strokeWidth={2.5} />
                          <span>{member.phoneNumber || 'Chua cap nhat'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Calendar size={12} className="text-slate-500 shrink-0" strokeWidth={2.5} />
                          <span>
                            {dob || 'Chua cap nhat'}{gender ? ` | ${gender}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Star size={12} className="text-amber-500 shrink-0" strokeWidth={2.5} fill="currentColor" />
                          <span className="font-black text-amber-700">{member.score || 0} diem tich luy</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={member.status}
                            onChange={(e) => confirmUpdateStatus(member, e.target.value)}
                            className="appearance-none bg-violet-100 hover:bg-violet-200 border-2 border-slate-900 rounded-lg py-2 pl-2.5 pr-7 text-[10px] font-black uppercase tracking-wider text-slate-900 cursor-pointer focus:outline-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
                          >
                            <option value="ACTIVE">Hoat dong</option>
                            <option value="LOCKED">Khoa</option>
                            <option value="INACTIVE">Vo hieu</option>
                          </select>
                          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" strokeWidth={3} />
                        </div>
                        <button
                          onClick={() => navigate(`/admin/members/edit/${member.uuid || member.id}`)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-sky-100 hover:bg-sky-200 text-sky-900 font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-sky-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                        >
                          <Pencil size={11} strokeWidth={3} /> Sua
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(member); setShowModal(true) }}
                          className="inline-flex items-center justify-center p-2 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg border-2 border-rose-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                          title="Vo hieu hoa"
                        >
                          <Trash2 size={11} strokeWidth={3} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center">
                <Users size={36} className="text-slate-400" strokeWidth={2} />
              </div>
              <p className="text-base font-black uppercase tracking-wider text-slate-700">Khong tim thay thanh vien</p>
              <p className="text-xs font-bold text-slate-500">
                {hasActiveFilters ? 'Thu thay doi bo loc hoac tu khoa' : 'Danh sach trong'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-black uppercase tracking-wider text-[10px] rounded-lg border-2 border-rose-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <X size={11} strokeWidth={3} /> Bo loc
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PART_MODAL_HERE */}
      <AnimatePresence>
        {showModal && deleteTarget && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
            >
              <TicketStrip count={14} />
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 px-6 py-5 flex items-center gap-3 border-b-2 border-slate-900">
                <div className="w-10 h-10 bg-rose-600 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <Trash2 size={18} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Vo hieu hoa thanh vien</h4>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Hanh dong khong the hoan tac</p>
                </div>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <div className="flex items-center gap-3 p-3 bg-amber-100 border-2 border-amber-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <AlertCircle size={20} className="text-amber-700 shrink-0" strokeWidth={3} />
                  <p className="text-xs font-black text-amber-900 leading-snug">Tai khoan se bi vo hieu hoa va khong the dang nhap he thong.</p>
                </div>
                <div className="p-3 bg-rose-100 border-2 border-rose-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <p className="text-base font-black text-rose-900 leading-tight text-center">"{deleteTarget.fullName}"</p>
                  <p className="text-[11px] font-bold font-mono text-rose-700 text-center mt-1">@{deleteTarget.username}</p>
                </div>
              </div>
              <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => { setShowModal(false); setDeleteTarget(null) }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <X size={14} strokeWidth={3} /> Huy bo
                </button>
                <button
                  onClick={confirmDelete}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <Trash2 size={14} strokeWidth={3} /> Vo hieu hoa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Update Confirmation */}
      <AnimatePresence>
        {showStatusModal && statusTarget && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
            >
              <TicketStrip count={14} />
              <div className="bg-gradient-to-br from-amber-50 to-sky-50 px-6 py-5 flex items-center gap-3 border-b-2 border-slate-900">
                <div className="w-10 h-10 bg-amber-500 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <Unlock size={18} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-wider text-base text-slate-900 leading-none">Cap nhat trang thai</h4>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1">Xac nhan truoc khi thay doi</p>
                </div>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <div className="flex items-center gap-3 p-3 bg-sky-100 border-2 border-sky-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <User size={20} className="text-sky-900 shrink-0" strokeWidth={3} />
                  <p className="text-sm font-black text-sky-900 leading-tight">{statusTarget.fullName}</p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-100 border-2 border-slate-900 rounded-xl">
                  <BadgeCheck size={16} className="text-slate-700 shrink-0" strokeWidth={3} />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Trang thai hien tai: <span className="font-black uppercase">{STATUS_META[statusTarget.status]?.label}</span>
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-xs font-bold text-emerald-700">
                      Moi: <span className="font-black uppercase">{STATUS_META[pendingStatus]?.label}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => { setShowStatusModal(false); setStatusTarget(null); setPendingStatus(null) }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <X size={14} strokeWidth={3} /> Huy
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <Unlock size={14} strokeWidth={3} /> Xac nhan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}