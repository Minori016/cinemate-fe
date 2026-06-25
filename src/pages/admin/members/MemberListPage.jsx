import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { memberService } from '../../../services/memberService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'

export default function MemberListPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadMembers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await memberService.getAll()
      let allUsers = res.data?.result ?? res.data ?? []
      if (!Array.isArray(allUsers)) {
        console.warn('memberService.getAll returned non-array:', allUsers)
        allUsers = []
      }
      const memberList = allUsers.filter(u => u.roles?.includes('MEMBER'))
      setMembers(memberList)
    } catch (err) {
      console.error('Error loading members:', err)
      setError('Không thể tải danh sách thành viên.')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleDeleteSubmit = async () => {
    setError('')
    setSuccess('')
    try {
      const id = deleteTarget.uuid || deleteTarget.id
      await memberService.delete(id)
      setSuccess('Xóa thành viên thành công!')
      setDeleteTarget(null)
      loadMembers()
    } catch (err) {
      setError('Không thể xóa thành viên.')
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'username', label: 'Tài khoản' },
    { key: 'fullName', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Số điện thoại' },
    { key: 'gender', label: 'Giới tính' },
    {
      key: 'score',
      label: 'Điểm',
      render: (row) => <span className="font-semibold text-yellow-500">{row.score || 0}</span>
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {row.status || 'ACTIVE'}
        </span>
      )
    },
  ]

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1
            className="text-4xl text-white font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý thành viên
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Danh sách người dùng đăng ký tài khoản thành viên (MEMBER) trên hệ thống.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/members/add')}>
          <Plus size={16} className="mr-1" /> Thêm thành viên
        </Button>
      </div>

      {success && (
        <div className="bg-green-500/15 border border-green-500 text-green-400 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/15 border border-red-500 text-red-400 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-red-500 text-3xl">progress_activity</span>
        </div>
      ) : (
        <Table
          columns={columns}
          data={members}
          actions={row => (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/members/edit/${row.uuid || row.id}`)}>
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        />
      )}

      {/* Modal Xác Nhận Xóa */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">
          Bạn có chắc chắn muốn xóa thành viên <span className="text-white font-semibold">"{deleteTarget?.fullName || deleteTarget?.username}"</span>? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDeleteSubmit}>Xóa</Button>
        </div>
      </Modal>
    </motion.div>
  )
}