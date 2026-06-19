import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { promotionService } from '../../../services/promotionService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import { Plus, Pencil, Trash2, Search, Tag, Calendar, AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'

export default function PromotionListPage() {
  const [promotions, setPromotions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  const loadPromotions = (search = '') => {
    setLoading(true)
    promotionService.getAll(search ? { search } : {})
      .then(res => {
        // Handle standard wrapper ApiResponse: res.data = { code, message, result: [...] }
        const data = res.data?.result || res.data || []
        setPromotions(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Lỗi tải danh sách khuyến mãi:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Trigger search on query change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadPromotions(searchQuery)
    }, 300) // 300ms debounce
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

  const columns = [
    { 
      key: 'title', 
      label: 'Tiêu đề',
      render: r => (
        <div className="font-bold text-white max-w-[200px] truncate" title={r.title}>
          {r.title}
        </div>
      )
    },
    { 
      key: 'startTime', 
      label: 'Bắt đầu',
      render: r => <span className="whitespace-nowrap text-gray-300 font-mono text-xs">{formatDate(r.startTime)}</span>
    },
    { 
      key: 'endTime', 
      label: 'Kết thúc',
      render: r => <span className="whitespace-nowrap text-gray-300 font-mono text-xs">{formatDate(r.endTime)}</span>
    },
    { 
      key: 'content', 
      label: 'Nội dung ngắn',
      render: r => <div className="max-w-[300px] truncate text-gray-400 text-xs" title={r.content}>{r.content}</div>
    },
    { 
      key: 'description', 
      label: 'Chi tiết khuyến mãi',
      render: r => <div className="max-w-[300px] truncate text-gray-400 text-xs" title={r.description}>{r.description}</div>
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
          <h1
            className="text-4xl text-white font-bold tracking-wider uppercase flex items-center gap-3"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            <Tag className="text-red-500" size={32} />
            Quản lý khuyến mãi
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Xem, tìm kiếm, thêm mới, cập nhật hoặc xóa các chương trình khuyến mãi và chiến dịch quảng cáo.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/promotions/add')}>
          <Plus size={16} className="mr-1" /> Thêm khuyến mãi
        </Button>
      </motion.div>

      {/* Control panel (Search & Statistics) */}
      <motion.div
        className="flex flex-col md:flex-row items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="w-full md:w-96 relative flex items-center">
          <Input
            placeholder="Tìm kiếm theo tiêu đề, nội dung... (tối đa 28 ký tự)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxLength={28}
            className="pl-10 pr-10"
          />
          <Search size={16} className="absolute left-3 text-gray-500" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" />
          <span>Tìm kiếm được giới hạn tối đa 28 ký tự (AC-02).</span>
        </div>
      </motion.div>

      {/* Promotions Table */}
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
        
        {promotions.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-12 text-center text-gray-400">
            <Tag size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm font-semibold">Không tìm thấy khuyến mãi nào</p>
            <p className="text-xs text-gray-500 mt-1">Thử thay đổi từ khóa hoặc nhấn "Thêm khuyến mãi" để tạo mới.</p>
          </div>
        ) : (
          <Table columns={columns} data={promotions} actions={row => (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/promotions/edit/${row.id}`)}>
                <Pencil size={12}/>
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
                <Trash2 size={12}/>
              </Button>
            </div>
          )} />
        )}
      </motion.div>

      {/* Custom Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa khuyến mãi">
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
            Bạn có chắc chắn muốn xóa chiến dịch khuyến mãi: <br />
            <span className="text-white font-bold text-base block mt-2 p-3 bg-red-600/10 border border-red-500/20 rounded-xl">
              "{deleteTarget?.title}"
            </span>
          </p>
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
