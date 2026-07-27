import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { concessionService, CONCESSION_ITEM_TYPES, ITEM_TYPE_EMOJIS, SIZE_DISPLAY, groupConcessionsByBaseName } from '../../../services/concessionService'
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
      const idsToDelete = (deleteTarget.sizes && deleteTarget.sizes.length > 0)
        ? deleteTarget.sizes.map(s => s.variantId || s.rawItem?.id || s.rawItem?.uuid).filter(Boolean)
        : [deleteTarget.id || deleteTarget.uuid].filter(Boolean)

      await Promise.all(idsToDelete.map(vId => concessionService.delete(vId)))

      setItems(prev => prev.filter(item => {
        const itemId = item.id || item.uuid
        return !idsToDelete.includes(itemId)
      }))
    } catch (err) {
      console.error('Lỗi khi xóa bắp nước:', err)
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (item) => {
    try {
      const idsToToggle = (item.sizes && item.sizes.length > 0)
        ? item.sizes.map(s => s.variantId || s.rawItem?.id || s.rawItem?.uuid).filter(Boolean)
        : [item.id || item.uuid].filter(Boolean)

      const nextActiveState = !item.isActive

      await Promise.all(idsToToggle.map(vId => concessionService.toggleActive(vId)))

      setItems(prev => prev.map(i => {
        const iId = i.id || i.uuid
        if (idsToToggle.includes(iId)) {
          return { ...i, isActive: nextActiveState }
        }
        return i
      }))
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái sản phẩm:', err)
    }
  }

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  // Group multi-size items into 1 row per base product
  const groupedList = useMemo(() => {
    const rawFiltered = items.filter(item => {
      const matchSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchCategory = categoryFilter === 'ALL' || item.itemType === categoryFilter
      const matchStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'ACTIVE' && item.isActive) || 
                          (statusFilter === 'INACTIVE' && !item.isActive)
      
      return matchSearch && matchCategory && matchStatus
    })

    const groups = groupConcessionsByBaseName(rawFiltered)
    // Alphabetical sort (A-Z) by base product name
    return groups.sort((a, b) => (a.baseName || a.name || '').localeCompare(b.baseName || b.name || '', 'vi', { sensitivity: 'base' }))
  }, [items, searchQuery, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    let popcornCount = 0, foodCount = 0, drinkCount = 0, comboCount = 0
    groupedList.forEach(i => {
      if (i.itemType === 'popcorn') popcornCount++
      else if (i.itemType === 'food') foodCount++
      else if (i.itemType === 'drink') drinkCount++
      else if (i.itemType === 'combo') comboCount++
    })
    return {
      total: groupedList.length,
      popcorn: popcornCount,
      food: foodCount,
      drink: drinkCount,
      combo: comboCount
    }
  }, [groupedList])

  const columns = [
    {
      key: 'image',
      label: 'Hình ảnh/Icon',
      render: r => (
        <span className="text-3xl select-none" role="img" aria-label={r.itemType}>
          {r.imageUrl && (r.imageUrl.startsWith('http') || r.imageUrl.startsWith('/') || r.imageUrl.startsWith('data:'))
            ? <img src={r.imageUrl} alt={r.name} className="w-10 h-10 rounded-lg object-cover" />
            : (r.imageUrl || r.img || ITEM_TYPE_EMOJIS[r.itemType] || '🍿')
          }
        </span>
      )
    },
    {
      key: 'name',
      label: 'Tên sản phẩm',
      render: r => (
        <div className="font-bold text-[var(--color-on-surface)]">
          <div className="flex items-center gap-2">
            <span>{r.name}</span>
            {r.sizes && r.sizes.length > 1 && (
              <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                {r.sizes.length} sizes
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-normal mt-0.5 max-w-[200px] truncate" title={r.desc || r.description}>
            {r.desc || r.description || 'Không có mô tả'}
          </div>
        </div>
      )
    },
    {
      key: 'itemType',
      label: 'Phân loại',
      render: r => (
        <span className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold whitespace-nowrap">
          {CONCESSION_ITEM_TYPES[r.itemType] || r.itemType}
        </span>
      )
    },
    {
      key: 'size',
      label: 'Kích thước & Giá',
      render: r => {
        if (r.itemType === 'combo') {
          return <span className="text-gray-500 text-xs italic">Combo trọn gói</span>
        }
        if (!r.sizes || r.sizes.length === 0) {
          return <span className="text-gray-400 text-xs font-bold">Tiêu chuẩn</span>
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {r.sizes.map(s => {
              const sInfo = SIZE_DISPLAY[s.key]
              const displayLabel = sInfo?.label || s.label
              const bgStyle = sInfo?.bg || 'bg-gray-100 text-gray-800 border-gray-300'
              return (
                <span key={s.key} className={`px-2 py-0.5 rounded border text-[11px] font-bold whitespace-nowrap ${bgStyle}`}>
                  {displayLabel}: {formatVND(s.price)}
                </span>
              )
            })}
          </div>
        )
      }
    },
    {
      key: 'price',
      label: 'Khung giá bán',
      render: r => {
        if (r.sizes && r.sizes.length > 1) {
          const minP = Math.min(...r.sizes.map(s => s.price))
          const maxP = Math.max(...r.sizes.map(s => s.price))
          return (
            <span className="text-red-600 font-extrabold font-mono text-sm">
              {formatVND(minP)} - {formatVND(maxP)}
            </span>
          )
        }
        return (
          <span className="text-red-600 font-extrabold font-mono text-sm">
            {formatVND(r.price)}
          </span>
        )
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: r => (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded border text-[10px] font-extrabold uppercase tracking-wider ${r.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
            {r.isActive ? 'Đang bán' : 'Ngưng bán'}
          </span>
          <button
            onClick={() => handleToggleActive(r)}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
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
      render: r => {
        const targetEditId = r.id || r.uuid || (r.sizes && r.sizes[0] && (r.sizes[0].variantId || r.sizes[0].rawItem?.id || r.sizes[0].rawItem?.uuid))
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/concessions/edit/${targetEditId}`)}
              className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-xl transition-all cursor-pointer"
              title="Sửa"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setDeleteTarget(r)}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl transition-all cursor-pointer"
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )
      }
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
            Quản lý đồ ăn
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Quản lý danh sách các món ăn, thức uống và gói combo phục vụ khách hàng.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/concessions/add')}>
          <Plus size={16} className="mr-1" /> Thêm món mới
        </Button>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        {[
          { label: 'Tổng số sản phẩm', value: stats.total, color: 'text-[var(--color-on-surface)]' },
          { label: 'Bắp rang (Popcorn)', value: stats.popcorn, color: 'text-amber-400' },
          { label: 'Đồ ăn khác (Food)', value: stats.food, color: 'text-yellow-500' },
          { label: 'Đồ uống (Drink)', value: stats.drink, color: 'text-blue-500' },
          { label: 'Gói Combo', value: stats.combo, color: 'text-red-500' }
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
              <option value="popcorn">Bắp rang (Popcorn)</option>
              <option value="food">Đồ ăn khác (Food)</option>
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
            data={groupedList}
            emptyMessage="Không tìm thấy món ăn/combo nào phù hợp."
          />
        )}
      </motion.div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
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
