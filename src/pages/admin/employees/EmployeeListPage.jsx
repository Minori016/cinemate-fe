import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeService } from '../../../services/employeeService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    employeeService.getAll()
      .then(r => {
        const resData = r.data?.result ?? r.data?.data ?? r.data ?? {}
        // Handle paginated content or flat array
        const list = resData.content ?? (Array.isArray(resData) ? resData : [])
        // Filter for users with STAFF or MANAGER roles
        const staffList = list.filter(u => u.roles?.includes('STAFF') || u.roles?.includes('MANAGER'))
        setEmployees(staffList)
      })
      .catch(err => {
        console.error('Error loading employees:', err)
        setEmployees([])
      })
  }
  useEffect(() => { load() }, [])

  const columns = [
    { key: 'username', label: 'Tài khoản' },
    { key: 'fullName', label: 'Họ tên' },
    { key: 'dayOfBirth', label: 'Ngày sinh' },
    { key: 'gender', label: 'Giới tính' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'SĐT' },
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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div>
          <h1
            className="text-4xl text-white font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            Quản lý nhân viên
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Quản lý danh sách nhân viên và thông tin tài khoản vận hành hệ thống.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/employees/add')}>
          <Plus size={16} className="mr-1" /> Thêm nhân viên
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table columns={columns} data={employees} actions={row => (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/employees/edit/${row.id || row.uuid}`)}><Pencil size={12}/></Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 size={12}/></Button>
          </div>
        )} />
      </motion.div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Xóa nhân viên <span className="text-white font-semibold">"{deleteTarget?.fullName}"</span>?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={async () => { await employeeService.delete(deleteTarget.id || deleteTarget.uuid); setDeleteTarget(null); load() }}>Xóa</Button>
        </div>
      </Modal>
    </motion.div>
  )
}
