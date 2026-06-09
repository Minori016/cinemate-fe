import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeService } from '../../../services/employeeService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  const load = () => employeeService.getAll().then(r => setEmployees(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const columns = [
    { key: 'username', label: 'Tài khoản' },
    { key: 'fullName', label: 'Họ tên' },
    { key: 'dateOfBirth', label: 'Ngày sinh' },
    { key: 'gender', label: 'Giới tính' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'SĐT' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl text-white" style={{fontFamily:'Bebas Neue'}}>Quản lý nhân viên</h1>
        <Button onClick={() => navigate('/admin/employees/add')}><Plus size={14} className="mr-1"/>Thêm nhân viên</Button>
      </div>
      <Table columns={columns} data={employees} actions={row => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/employees/edit/${row.id}`)}><Pencil size={12}/></Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 size={12}/></Button>
        </div>
      )} />
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Xóa nhân viên <span className="text-white font-semibold">"{deleteTarget?.fullName}"</span>?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={async () => { await employeeService.delete(deleteTarget.id); setDeleteTarget(null); load() }}>Xóa</Button>
        </div>
      </Modal>
    </div>
  )
}
