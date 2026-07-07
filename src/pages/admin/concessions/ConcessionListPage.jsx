import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { concessionService, CONCESSION_ITEM_TYPES, ITEM_TYPE_EMOJIS } from '../../../services/concessionService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import { Plus, Pencil, Trash2, Search, Coffee, ChefHat, Filter, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { motion } from 'motion/react'

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
        console.error('Lỗi tải danh sách bắp nước:', err)
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
      console.error('Lỗi khi xóa bắp nước:', err)
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm.')
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
      console.error('Lỗi khi đổi trạng thái sản phẩm:', err)
    }
  }

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
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
    return {
      total: items.length,
      food: foodCount,
      drink: drinkCount,
      combo: comboCount
    }
  }, [items])

  const columns = [
    {
      key: 'image',
      label: 'Hình ảnh/Icon',
      render: r => (
        <span className="text-3xl select-none" role="img" aria-label={r.itemType}>
          {r.imageUrl && (r.imageUrl.startsWith('http') || r.imageUrl.startsWith('/') || r.imageUrl.startsWith('data:'))
            ? <img src={r.imageUrl} alt={r.name} className="w-10 h-10 rounded-lg object-cover" />
            : (r.imageUrl || ITEM_TYPE_EMOJIS[r.itemType] || '🍿')
          }
        </span>
      )
    },
    {
      key: 'name',
      label: 'Tên sản phẩm',
      render: r => (
        <div className="font-bold text-[var(--color-on-surface)]">
          <div>{r.name}</div>
          <div className="text-xs text-[var(--color-text-muted)] font-normal mt-0.5 max-w-[200px] truncate" title={r.description}>
            {r.description || 'Không có mô tả'}
          </div>
        </div>
      )
    },
    {
      key: 'itemType',
      label: 'Phân loại',
      render: r => (
        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[var(--color-text-muted)] text-xs font-semibold whitespace-nowrap">
          {CONCESSION_ITEM_TYPES[r.itemType] || r.itemType}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Giá bán',
      render: r => (
        <span className="text-red-400 font-extrabold font-mono text-sm">
          {formatVND(r.price)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: r => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${r.isActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
            {r.isActive ? 'Đang bán' : 'Ngưng bán'}
          </span>
          <button
            onClick={() => handleToggleActive(r)}
            className="p-1 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={r.isActive ? 'Tạm ngưng bán' : 'Kích hoạt bán lại'}
          >
            {r.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: r => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/concessions/edit/${r.id}`)}
            className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 border border-yellow-500/20 rounded-xl transition-all cursor-pointer"
            title="Sửa"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-all cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
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
            <ChefHat className="text-red-500" size={32} />
            Quản lý Bắp nước & Đồ ăn
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Quản lý danh sách các món ăn, thức uống và gói combo bắp nước phục vụ khách hàng.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/concessions/add')}>
          <Plus size={16} className="mr-1" /> Thêm món mới
        </Button>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        {[
          { label: 'Tổng số sản phẩm', value: stats.total, color: 'text-[var(--color-on-surface)]' },
          { label: 'Đồ ăn (Food)', value: stats.food, color: 'text-yellow-500' },
          { label: 'Đồ uống (Drink)', value: stats.drink, color: 'text-blue-500' },
          { label: 'Combo bắp nước', value: stats.combo, color: 'text-red-500' }
        ].map(s => (
          <div key={s.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Controls */}
      <motion.div
        className="flex flex-col md:flex-row items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="w-full md:w-96 relative flex items-center">
          <Input
            placeholder="Tìm theo tên sản phẩm..."
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

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[var(--color-text-muted)]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-xs rounded-xl py-2 px-3 outline-none"
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="food">Đồ ăn (Food)</option>
              <option value="drink">Đồ uống (Drink)</option>
              <option value="combo">Combo bắp nước</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-xs rounded-xl py-2 px-3 outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="INACTIVE">Ngưng bán</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Table grid */}
      <motion.div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span>Đang tải danh sách bắp nước...</span>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filtered}
            emptyMessage="Không tìm thấy món ăn/combo nào phù hợp."
          />
        )}
      </motion.div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Xác nhận xóa món"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle size={24} />
              <p className="font-bold">Hành động này không thể hoàn tác!</p>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-white">"{deleteTarget.name}"</strong> khỏi hệ thống không?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Hủy bỏ
              </Button>
              <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 border-none">
                Đồng ý xóa
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  )
}
