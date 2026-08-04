import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  promotionService,
  PROMOTION_TYPE_LABELS,
  PROMOTION_STATUS,
  PROMOTION_STATUS_LABELS,
  PROMOTION_STATUS_COLORS,
  computePromotionStatus,
  formatDiscountValue,
  getDaysRemaining,
  getDaysUntilStart,
  unwrapList,
} from '../../../services/promotionService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import { Plus, Pencil, Trash2, Search, Tag, Calendar, AlertCircle, Filter, X } from 'lucide-react'
import { motion } from 'motion/react'

export default function PromotionListPage() {
  const [promotions, setPromotions] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ===== Bộ lọc client-side (không phụ thuộc backend) =====
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')


  const loadPromotions = (search = '') => {
    setLoading(true)
    const fetchFunc = promotionService.getAdminAll || promotionService.getAll
    fetchFunc(search ? { search } : {})
      .then(res => {
        const data = unwrapList(res.data)
        setPromotions(data)
      })
      .catch(err => {
        promotionService.getAll(search ? { search } : {})
          .then(res => setPromotions(unwrapList(res.data)))
          .catch(e => console.error('Lỗi tải danh sách khuyến mãi:', e))
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
      console.error('Lỗi khi xóa khuyến mãi:', err)
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa khuyến mãi.')
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
    } catch (e) {
      return dateStr
    }
  }

  // Áp dụng filter phía client (vì backend cũ chưa hỗ trợ filter)
  const filtered = useMemo(() => {
    return promotions.filter(p => {
      const status = computePromotionStatus(p)
      if (statusFilter !== 'ALL' && status !== statusFilter) return false
      const pType = p.promotionType || p.type
      if (typeFilter !== 'ALL' && pType !== typeFilter) return false
      return true
    })
  }, [promotions, typeFilter, statusFilter])

  // Thống kê nhanh cho dashboard mini phía trên
  const stats = useMemo(() => {
    const now = new Date()
    let active = 0, expired = 0, draft = 0
    promotions.forEach(p => {
      const s = computePromotionStatus(p)
      if (s === PROMOTION_STATUS.ACTIVE) active++
      else if (s === PROMOTION_STATUS.EXPIRED) expired++
      else draft++
    })
    return {
      total: promotions.length,
      active,
      expired,
      draft,
    }
  }, [promotions])

  const hasFilter = typeFilter !== 'ALL' || statusFilter !== 'ALL'

  const columns = [
    {
      key: 'title',
      label: 'Tiêu đề',
      render: r => (
        <div className="font-extrabold text-[15px] !text-slate-900 max-w-[260px] leading-tight">
          <div className="truncate" title={r.title}>{r.title}</div>
          {r.code && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400 text-black border-2 border-amber-200 text-[11px] font-mono font-extrabold uppercase tracking-wider shadow-md shadow-amber-500/40">
                <Tag size={11} strokeWidth={2.5} className="text-black" />
                {r.code}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Loại KM',
      render: r => (
        <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-900 text-xs font-extrabold whitespace-nowrap shadow-sm">
          {PROMOTION_TYPE_LABELS[r.promotionType] || PROMOTION_TYPE_LABELS[r.type] || 'Voucher'}
        </span>
      )
    },
    {
      key: 'discount',
      label: 'Mức giảm',
      render: r => {
        const text = formatDiscountValue(r)
        if (!text) return <span className="text-gray-500 text-xs">-</span>
        return <span className="text-red-400 font-extrabold font-mono text-sm">{text}</span>
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: r => {
        const s = computePromotionStatus(r)
        const daysToEnd = getDaysRemaining(r.endTime)
        const daysToStart = getDaysUntilStart(r.startTime)

        // Sub-label theo pha thời gian
        let subLabel = null
        if (s === PROMOTION_STATUS.UPCOMING && daysToStart != null && daysToStart > 0) {
          subLabel = `Bắt đầu sau ${daysToStart} ngày`
        } else if (s === PROMOTION_STATUS.ACTIVE && daysToEnd != null && daysToEnd > 0) {
          subLabel = `Còn ${daysToEnd} ngày`
        }

        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${PROMOTION_STATUS_COLORS[s]}`}>
              {PROMOTION_STATUS_LABELS[s]}
            </span>
            {subLabel && (
              <span className="text-[10px] text-[var(--color-text-muted)]">{subLabel}</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'startTime',
      label: 'Bắt đầu',
      render: r => <span className="whitespace-nowrap text-[var(--color-on-surface-variant)] font-mono text-xs">{formatDate(r.startTime)}</span>
    },
    {
      key: 'endTime',
      label: 'Kết thúc',
      render: r => <span className="whitespace-nowrap text-[var(--color-on-surface-variant)] font-mono text-xs">{formatDate(r.endTime)}</span>
    },
  ]

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header section */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div>
          <h1 className="text-4xl text-[var(--color-on-surface)] font-bold tracking-wider uppercase flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}>
            <Tag className="text-red-500" size={32} />
            Quản lý khuyến mãi
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Xem, tìm kiếm, thêm mới, cập nhật hoặc xóa các chương trình khuyến mãi và chiến dịch quảng cáo.
          </p>
        </div>
        <Button onClick={() => navigate(`${basePath}/promotions/add`)}>
          <Plus size={16} className="mr-1" /> Thêm khuyến mãi
        </Button>
      </motion.div>

      {/* Stats mini-cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        {[
          { label: 'Tổng KM', value: stats.total, color: 'text-[var(--color-on-surface)]' },
          { label: 'Đang chạy', value: stats.active, color: 'text-green-500' },
          { label: 'Bản nháp / sắp', value: stats.draft, color: 'text-yellow-500' },
          { label: 'Đã hết hạn', value: stats.expired, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Control panel */}
      <motion.div
        className="flex flex-col md:flex-row items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="w-full md:w-96 relative flex items-center">
          <Input
            placeholder="Tìm kiếm theo tiêu đề, nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <Search size={16} className="absolute left-3 text-gray-500" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 text-gray-400 hover:text-[var(--color-on-surface)] text-xs cursor-pointer">
              Xóa
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-[var(--color-text-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(PROMOTION_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="ALL">Tất cả loại</option>
            {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {hasFilter && (
            <button
              onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL') }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 cursor-pointer"
            >
              <X size={12} /> Bỏ lọc
            </button>
          )}
        </div>

        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 md:ml-auto">
          <AlertCircle size={14} className="text-red-500" />
          <span>{filtered.length} / {promotions.length} KM</span>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative"
      >
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center rounded-lg z-10">
            <span className="material-symbols-outlined animate-spin text-3xl text-red-500">progress_activity</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-12 text-center text-gray-400">
            <Tag size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm font-semibold">{hasFilter ? 'Không có KM nào khớp bộ lọc' : 'Không tìm thấy khuyến mãi nào'}</p>
            <p className="text-xs text-gray-500 mt-1">Thử thay đổi từ khóa hoặc bộ lọc.</p>
          </div>
        ) : (
          <Table columns={columns} data={filtered} actions={row => (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="info" onClick={() => navigate(`${basePath}/promotions/edit/${row.id}`)}>
                <Pencil size={12} />
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
                <Trash2 size={12} />
              </Button>
            </div>
          )} />
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa khuyến mãi">
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
            Bạn có chắc chắn muốn xóa chiến dịch khuyến mãi: <br />
            <span className="text-[var(--color-on-surface)] font-bold text-base block mt-2 p-3 bg-red-600/10 border border-red-500/20 rounded-xl">
              "{deleteTarget?.title}"
            </span>
          </p>
          {deleteTarget?.code && (
            <div className="flex items-center gap-2 text-xs bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 text-yellow-300">
              <Tag size={14} />
              <span>Mã voucher: <b className="font-mono">{deleteTarget.code}</b> (sẽ bị xóa vĩnh viễn)</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
            <Calendar size={14} />
            <span>Thời hạn chiến dịch: {formatDate(deleteTarget?.startTime)} - {formatDate(deleteTarget?.endTime)}</span>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy bỏ</Button>
            <Button variant="danger" onClick={handleDelete}>Đồng ý xóa</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
