import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { movieService } from '../../../services/movieService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'

export default function MovieListPage() {
  const [movies, setMovies] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  const load = () => movieService.getAll().then(r => {
    const list = r.data || []
    setMovies(list)
  }).catch(() => {})
  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await movieService.deleteAdmin(deleteTarget.id)
      setMovies(prev => prev.map(m => m.id === deleteTarget.id ? { ...m, status: 'ENDED' } : m))
    } catch (err) {
      console.error('Lỗi khi xóa phim:', err)
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa phim.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'poster', label: 'Poster', render: r => r.posterUrl ? <img src={r.posterUrl} alt="poster" className="w-12 h-16 object-cover rounded shadow border border-white/10" /> : <div className="w-12 h-16 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">N/A</div> },
    { key: 'titleEn', label: 'Tên (ENG)', render: r => <span className="font-semibold text-[var(--color-on-surface)]">{r.titleEn}</span> },
    { key: 'titleVn', label: 'Tên (VN)', render: r => <span className="font-bold text-[var(--color-on-surface)]">{r.titleVn}</span> },
    { key: 'status', label: 'Trạng thái', render: r => {
      const colors = { COMING_SOON: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', NOW_SHOWING: 'bg-green-500/10 text-green-500 border-green-500/20', ENDED: 'bg-red-500/10 text-red-500 border-red-500/20' }
      const labels = { COMING_SOON: 'Sắp chiếu', NOW_SHOWING: 'Đang chiếu', ENDED: 'Ngừng chiếu' }
      return <span className={`px-2 py-1 rounded text-xs border whitespace-nowrap ${colors[r.status] || 'bg-gray-500/10 text-gray-400'}`}>{labels[r.status] || r.status || 'N/A'}</span>
    }},
    { key: 'fromDate', label: 'Từ ngày' },
    { key: 'durationMinutes', label: 'Thời lượng', render: r => `${r.durationMinutes || 120} phút` },
    { key: 'version', label: 'Phiên bản' },
  ]

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        className="flex justify-between items-start mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div>
          <h1
            className="text-4xl text-[var(--color-on-surface)] font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý phim
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Quản lý danh mục phim, thông tin chi tiết, thời lượng và phiên bản trình chiếu tại rạp.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/movies/add')}>
          <Plus size={16} className="mr-1" /> Thêm phim
        </Button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table columns={columns} data={movies} actions={row => (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="info" onClick={() => navigate(`/admin/movies/edit/${row.id}`)}><Pencil size={12}/></Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 size={12}/></Button>
          </div>
        )} />
      </motion.div>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Bạn có chắc muốn xóa phim <span className="text-[var(--color-on-surface)] font-semibold">"{deleteTarget?.titleVn}"</span>?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </motion.div>
  )
}
