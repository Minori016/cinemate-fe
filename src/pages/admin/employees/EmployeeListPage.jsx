import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeService } from '../../../services/employeeService'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus, Search, Pencil, Trash2, Users, UserCheck, X,
  Mail, Phone, Crown, ShieldAlert, AlertTriangle, BadgeCheck,
  Briefcase, AtSign, Cake, Hash, ToggleRight,
} from 'lucide-react'
import { toast } from 'sonner'

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
  ACTIVE: { bg: 'bg-emerald-500', border: 'border-emerald-700', text: 'text-white', dot: 'bg-emerald-500', label: 'HOAT DONG' },
  LOCKED: { bg: 'bg-rose-500', border: 'border-rose-700', text: 'text-white', dot: 'bg-rose-500', label: 'BI KHOA' },
  INACTIVE: { bg: 'bg-slate-500', border: 'border-slate-700', text: 'text-white', dot: 'bg-slate-500', label: 'VO HIEU' },
}

const ROLE_META = {
  STAFF: { bg: 'bg-sky-100', border: 'border-sky-700', text: 'text-sky-900', icon: UserCheck, label: 'NHAN VIEN' },
  MANAGER: { bg: 'bg-amber-100', border: 'border-amber-700', text: 'text-amber-900', icon: Crown, label: 'QUAN LY' },
  ADMIN: { bg: 'bg-violet-100', border: 'border-violet-700', text: 'text-violet-900', icon: ShieldAlert, label: 'ADMIN' },
}

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.INACTIVE
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border-2 ${m.border} ${m.bg} ${m.text} text-[10px] font-black uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} border border-white`} />
      {m.label}
    </span>
  )
}

function RolePill({ roles }) {
  const roleKey = roles?.includes('MANAGER') ? 'MANAGER' : roles?.includes('ADMIN') ? 'ADMIN' : 'STAFF'
  const m = ROLE_META[roleKey]
  const Icon = m.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 ${m.border} ${m.bg} ${m.text} text-[10px] font-black uppercase tracking-wider`}>
      <Icon size={10} strokeWidth={3} /> {m.label}
    </span>
  )
}

export default function EmployeeListPage() {
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [pendingStatusMap, setPendingStatusMap] = useState({})
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const getCurrentStatus = (employee) => {
    const key = employee.uuid || employee.id
    return pendingStatusMap[key] ?? employee.status
  }

  const load = useCallback((pageNum = 0) => {
    setLoading(true)
    const params = { page: pageNum, size: 10 }
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (roleFilter !== 'all') params.role = roleFilter
    employeeService.getAll(params)
      .then(r => {
        const resData = r.data?.result ?? r.data ?? {}
        const list = resData.content ?? []
        let filtered = list.filter(e => !e.roles?.includes('MANAGER'))
        if (statusFilter !== 'all') {
          filtered = filtered.filter(e => e.status === statusFilter)
        }
        setEmployees(filtered)
        setPage(resData.pageNumber ?? pageNum)
        setTotalPages(resData.totalPages ?? 1)
      })
      .catch(err => {
        console.error('Error loading employees:', err)
        setEmployees([])
      })
      .finally(() => setLoading(false))
  }, [searchTerm, roleFilter, statusFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(0) }, [load])

  const stats = {
    total: employees.length,
    staff: employees.filter(e => e.roles?.includes('STAFF')).length,
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarGradient = (id) => {
    const gradients = [
      'bg-violet-600', 'bg-sky-600', 'bg-rose-600',
      'bg-emerald-600', 'bg-orange-600', 'bg-indigo-600',
    ]
    return gradients[(id || 0) % gradients.length]
  }

  const formatDate = (date) => {
    if (!date) return 'Chua cap nhat'
    return new Date(date).toLocaleDateString('vi-VN')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const empId = deleteTarget.uuid || deleteTarget.id
    employeeService.delete(empId)
      .then(() => {
        setDeleteTarget(null)
        setShowModal(false)
        toast.success('Vo hieu hoa nhan vien thanh cong')
        load(page)
      })
      .catch(err => {
        console.error('Delete error:', err)
        setDeleteTarget(null)
        setShowModal(false)
        toast.error('Khong the vo hieu hoa nhan vien')
      })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const confirmUpdateStatus = (employee, newStatus) => {
    if (employee.status === newStatus) return
    const key = employee.uuid || employee.id
    setPendingStatusMap(prev => ({ ...prev, [key]: newStatus }))
    setStatusTarget(employee)
    setPendingStatus(newStatus)
    setShowStatusModal(true)
  }

  const handleUpdateStatus = () => {
    if (!statusTarget || !pendingStatus) return
    setLoading(true)
    employeeService.updateStatus(statusTarget.uuid || statusTarget.id, pendingStatus)
      .then(() => {
        const key = statusTarget.uuid || statusTarget.id
        setPendingStatusMap(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        setShowStatusModal(false)
        setStatusTarget(null)
        setPendingStatus(null)
        toast.success('Cap nhat trang thai thanh cong')
        load(page)
      })
      .catch(err => {
        console.error('Update status error:', err.response?.data || err)
        const errCode = err.response?.data?.code
        const errMsg = err.response?.data?.message || err.message || 'Loi he thong'
        if (errCode === 1007) toast.error('Ban khong co quyen thuc hien thao tac nay')
        else toast.error(`Cap nhat trang thai that bai: ${errMsg}`)
        setLoading(false)
      })
  }

  const closeStatusModal = () => {
    if (statusTarget) {
      const key = statusTarget.uuid || statusTarget.id
      setPendingStatusMap(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
    setShowStatusModal(false)
    setStatusTarget(null)
    setPendingStatus(null)
  }

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-[1400px]"
    >
      {/* PART_HERO */}
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-sky-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-violet-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] shrink-0">
                <Users size={26} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Briefcase size={10} /> STAFF MGMT
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <BadgeCheck size={10} strokeWidth={3} /> HE THONG
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Quan ly <span className="text-red-600">nhan vien</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Quan ly danh sach nhan vien va thong tin tai khoan van hanh he thong.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/employees/add')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} /> Them nhan vien
            </button>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_BODY */}
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-violet-600 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center shrink-0">
            <Users size={22} className="text-white" strokeWidth={3} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Tong nhan vien</p>
            <p className="text-3xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">
            <Hash size={8} className="inline" /> ALL
          </div>
        </div>
        <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center shrink-0">
            <UserCheck size={22} className="text-white" strokeWidth={3} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Nhan vien</p>
            <p className="text-3xl font-black text-slate-900 leading-none">{stats.staff}</p>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
            <UserCheck size={8} className="inline" /> STAFF
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tim kiem ten, tai khoan, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(0) }}
            className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-slate-200 focus:border-slate-900 focus:bg-amber-50 rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'Tat ca', bg: 'bg-violet-600' },
              { key: 'STAFF', label: 'Nhan vien', bg: 'bg-emerald-600' },
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setRoleFilter(filter.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-slate-900 text-[11px] font-black uppercase tracking-wider transition-all ${
                  roleFilter === filter.key
                    ? `${filter.bg} text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-300" />

          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'Tat ca', bg: 'bg-violet-600' },
              { key: 'ACTIVE', label: 'Hoat dong', bg: 'bg-emerald-600' },
              { key: 'LOCKED', label: 'Bi khoa', bg: 'bg-rose-600' },
              { key: 'INACTIVE', label: 'Da xoa', bg: 'bg-slate-600' },
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-slate-900 text-[11px] font-black uppercase tracking-wider transition-all ${
                  statusFilter === filter.key
                    ? `${filter.bg} text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-slate-900 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all"
            >
              <X size={12} strokeWidth={3} /> Xoa bo loc
            </button>
          )}
        </div>
      </div>

      {/* PART_GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-wider text-slate-700">Dang tai...</p>
        </div>
      ) : employees.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {employees.map((employee, index) => (
                <motion.div
                  key={employee.uuid || employee.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
                  className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  {/* Header: avatar + name + role */}
                  <div className="flex items-start gap-3 p-4 border-b-2 border-dashed border-slate-200">
                    <div className={`relative w-12 h-12 ${getAvatarGradient(employee.id)} border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center shrink-0`}>
                      <span className="text-white font-black text-base">{getInitials(employee.fullName)}</span>
                      <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${STATUS_META[employee.status]?.dot || 'bg-slate-500'} border-2 border-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm text-slate-900 truncate">
                        {employee.fullName || 'Chua cap nhat'}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500 truncate">@{employee.username}</p>
                      <div className="mt-1.5"><StatusPill status={employee.status} /></div>
                    </div>
                    <RolePill roles={employee.roles} />
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3 space-y-1.5 bg-slate-50/50">
                    {[
                      { icon: AtSign, value: employee.username, label: 'ID' },
                      { icon: Mail, value: employee.email, label: 'EMAIL' },
                      { icon: Phone, value: employee.phoneNumber, label: 'SĐT' },
                      { icon: Cake, value: `${formatDate(employee.dayOfBirth)}${employee.gender ? ' | ' + (employee.gender === 'MALE' ? 'Nam' : employee.gender === 'FEMALE' ? 'Nu' : 'Khac') : ''}`, label: 'NGAY SINH' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 bg-slate-200 border border-slate-300 rounded-md flex items-center justify-center shrink-0">
                          <item.icon size={11} className="text-slate-700" strokeWidth={2.5} />
                        </div>
                        <span className={`font-bold truncate ${item.value ? 'text-slate-700' : 'text-slate-400'}`}>
                          {item.value || `${item.label}: chua cap nhat`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 p-3 bg-white border-t-2 border-slate-200">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <ToggleRight size={12} strokeWidth={3} /> TRANG THAI
                    </div>
                    <select
                      value={getCurrentStatus(employee)}
                      onChange={(e) => confirmUpdateStatus(employee, e.target.value)}
                      className="flex-1 bg-white border-2 border-slate-900 rounded-lg px-2 py-1.5 text-xs font-black uppercase tracking-wider text-slate-900 cursor-pointer focus:outline-none focus:bg-amber-50"
                    >
                      <option value="ACTIVE">HOAT DONG</option>
                      <option value="LOCKED">KHOA</option>
                      <option value="INACTIVE">VO HIEU</option>
                    </select>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/employees/edit/${employee.uuid || employee.id}`)}
                        className="w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center cursor-pointer"
                        title="Chinh sua"
                      >
                        <Pencil size={13} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(employee); setShowModal(true) }}
                        className="w-9 h-9 bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center cursor-pointer"
                        title="Vo hieu hoa"
                      >
                        <Trash2 size={13} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-amber-50 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-30 disabled:hover:bg-white disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Truoc
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 bg-amber-100 border-2 border-slate-900 rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-amber-50 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-30 disabled:hover:bg-white disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-100 border-2 border-slate-300 rounded-3xl flex items-center justify-center mb-4">
            <Users size={36} className="text-slate-400" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 mb-2">Khong tim thay nhan vien</h3>
          <p className="text-sm text-slate-500 mb-5 max-w-sm">
            {hasActiveFilters ? 'Thu thay doi bo loc hoac tu khoa tim kiem' : 'Danh sach nhan vien trong'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer text-xs font-black uppercase tracking-wider"
            >
              <X size={12} strokeWidth={3} /> Xoa bo loc
            </button>
          )}
        </div>
      )}

      {/* PART_MODALS */}
      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {showModal && deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={() => { setShowModal(false); setDeleteTarget(null) }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-7 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-rose-500 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center shrink-0">
                  <Trash2 size={22} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 leading-tight">Vo hieu hoa nhan vien</h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5 uppercase tracking-wider">Hanh dong khong the hoan tac</p>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mb-6">
                Ban co chac chan muon vo hieu hoa nhan vien{' '}
                <strong className="text-slate-900 font-black">"{deleteTarget.fullName}"</strong>?
                Tai khoan se bi vo hieu hoa (Da xoa) va khong the dang nhap vao he thong.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowModal(false); setDeleteTarget(null) }}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  Huy bo
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  Vo hieu hoa nhan vien
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATUS CONFIRM MODAL */}
      <AnimatePresence>
        {showStatusModal && statusTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={closeStatusModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-7 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-amber-500 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 leading-tight">Thay doi trang thai</h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5 uppercase tracking-wider">Xac nhan hanh dong cua ban</p>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mb-6">
                Ban co chac chan muon thay doi trang thai cua nhan vien{' '}
                <strong className="text-slate-900 font-black">"{statusTarget.fullName}"</strong> thanh{' '}
                <span className="inline-flex items-center align-middle"><StatusPill status={pendingStatus} /></span>?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeStatusModal}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  Huy bo
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  Xac nhan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}