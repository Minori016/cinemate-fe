import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { movieService } from '../../../services/movieService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function MovieListPage() {
  const [movies, setMovies] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  const load = () => movieService.getAll().then(r => setMovies(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    await movieService.delete(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const columns = [
    { key: 'movieNameEnglish', label: 'Tên (ENG)' },
    { key: 'movieNameVn', label: 'Tên (VN)' },
    { key: 'fromDate', label: 'Từ ngày' },
    { key: 'duration', label: 'Thời lượng', render: r => `${r.duration} phút` },
    { key: 'version', label: 'Phiên bản' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 
            className="text-4xl text-white font-bold tracking-wider uppercase" 
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
      </div>
      <Table columns={columns} data={movies} actions={row => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/movies/edit/${row.id}`)}><Pencil size={12}/></Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 size={12}/></Button>
        </div>
      )} />
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Bạn có chắc muốn xóa phim <span className="text-white font-semibold">"{deleteTarget?.movieNameVn}"</span>?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </div>
  )
}
