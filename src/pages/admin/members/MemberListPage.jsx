import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { userService } from '../../../services/userService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function MemberListPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal states
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form states
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dayOfBirth: '',
    gender: 'MALE',
    phoneNumber: '',
  })

  const [editForm, setEditForm] = useState({
    id: '',
    username: '',
    email: '',
    fullName: '',
    dayOfBirth: '',
    gender: 'MALE',
    identityCard: '',
    phoneNumber: '',
    address: '',
    password: '',
  })

  const loadMembers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await userService.getAll()
      let allUsers = res.data?.result ?? res.data ?? []
      if (!Array.isArray(allUsers)) {
        console.warn('userService.getAll returned non-array:', allUsers)
        allUsers = []
      }
      // Filter for users with MEMBER role
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
    Promise.resolve().then(() => {
      loadMembers()
    })
  }, [])

  const handleAddChange = (e) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEditChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (addForm.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự!')
      return
    }

    if (addForm.password !== addForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn THÊM thành viên "${addForm.fullName}" vào hệ thống?`)
    if (!isConfirmed) return

    try {
      await memberService.register(addForm)
      setSuccess('Thêm thành viên mới thành công!')
      setAddOpen(false)
      // Reset form
      setAddForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        dayOfBirth: '',
        gender: 'MALE',
        phoneNumber: '',
      })
      loadMembers()
    } catch (err) {
      let errMsg = ''
      const responseData = err.response?.data
      if (responseData) {
        if (typeof responseData === 'object') {
          if (responseData.code === 1004 || responseData.message?.includes('at least 8 characters')) {
            errMsg = 'Mật khẩu phải có ít nhất 8 ký tự!'
          } else if (responseData.message) {
            let msgStr = responseData.message
            if (typeof msgStr === 'string' && msgStr.startsWith('{')) {
              try {
                const parsedMsg = JSON.parse(msgStr)
                if (parsedMsg.message) {
                  msgStr = parsedMsg.message
                }
              } catch {
                // Ignore
              }
            }
            errMsg = msgStr
          } else {
            errMsg = JSON.stringify(responseData)
          }
        } else if (typeof responseData === 'string') {
          try {
            const parsedData = JSON.parse(responseData)
            if (parsedData.code === 1004 || parsedData.message?.includes('at least 8 characters')) {
              errMsg = 'Mật khẩu phải có ít nhất 8 ký tự!'
            } else {
              errMsg = parsedData.message || responseData
            }
          } catch {
            errMsg = responseData
          }
        }
      }
      setError(errMsg || 'Không thể thêm thành viên. Vui lòng kiểm tra lại mật khẩu (cần 8 kí tự, chữ hoa, thường, số, ký tự đặc biệt).')
    }
  }

  const handleEditClick = (row) => {
    setEditForm({
      id: row.uuid || row.id,
      username: row.username || '',
      email: row.email || '',
      fullName: row.fullName || '',
      dayOfBirth: row.dayOfBirth || '',
      gender: row.gender ? row.gender.toUpperCase() : 'MALE',
      identityCard: row.identityCard || '',
      phoneNumber: row.phoneNumber || '',
      address: row.address || '',
      password: '',
    })
    setEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (editForm.password && editForm.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự!')
      return
    }

    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn CẬP NHẬT thông tin cho thành viên "${editForm.fullName}"?`)
    if (!isConfirmed) return

    try {
      const payload = { ...editForm }
      await userService.update(editForm.id, payload)
      setSuccess('Cập nhật thông tin thành viên thành công!')
      setEditOpen(false)
      loadMembers()
    } catch (err) {
      let errMsg = ''
      const responseData = err.response?.data
      if (responseData) {
        if (typeof responseData === 'object') {
          if (responseData.code === 1004 || responseData.message?.includes('at least 8 characters')) {
            errMsg = 'Mật khẩu phải có ít nhất 8 ký tự!'
          } else if (responseData.message) {
            let msgStr = responseData.message
            if (typeof msgStr === 'string' && msgStr.startsWith('{')) {
              try {
                const parsedMsg = JSON.parse(msgStr)
                if (parsedMsg.message) {
                  msgStr = parsedMsg.message
                }
              } catch {
                // Ignore
              }
            }
            errMsg = msgStr
          } else {
            errMsg = JSON.stringify(responseData)
          }
        } else if (typeof responseData === 'string') {
          try {
            const parsedData = JSON.parse(responseData)
            if (parsedData.code === 1004 || parsedData.message?.includes('at least 8 characters')) {
              errMsg = 'Mật khẩu phải có ít nhất 8 ký tự!'
            } else {
              errMsg = parsedData.message || responseData
            }
          } catch {
            errMsg = responseData
          }
        }
      }
      setError(errMsg || 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.')
    }
  }

  const handleDeleteSubmit = async () => {
    setError('')
    setSuccess('')
    try {
      const id = deleteTarget.uuid || deleteTarget.id
      await userService.delete(id)
      setSuccess('Xóa thành viên thành công!')
      setDeleteTarget(null)
      loadMembers()
    } catch {
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

  const selectStyle = {
    backgroundColor: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: 'var(--color-on-surface)',
  }

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
        <Button onClick={() => setAddOpen(true)}>
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
              <Button size="sm" variant="secondary" onClick={() => handleEditClick(row)}>
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
                <Trash2 size={14} />
              </Button>
            </div>
          )} 
        />
      )}

      {/* Modal Thêm Thành Viên */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm Thành Viên Mới">
        <form onSubmit={handleAddSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tài khoản *" name="username" value={addForm.username} onChange={handleAddChange} required />
            <Input label="Email *" name="email" type="email" value={addForm.email} onChange={handleAddChange} required />
            <Input label="Mật khẩu *" name="password" type="password" placeholder="Tối thiểu 8 kí tự, hoa, thường, số, kí tự đặc biệt" value={addForm.password} onChange={handleAddChange} minLength={8} required />
            <Input label="Xác nhận mật khẩu *" name="confirmPassword" type="password" value={addForm.confirmPassword} onChange={handleAddChange} minLength={8} required />
            <Input label="Họ tên *" name="fullName" value={addForm.fullName} onChange={handleAddChange} required />
            <Input label="Ngày sinh *" name="dayOfBirth" type="date" value={addForm.dayOfBirth} onChange={handleAddChange} required />
            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Giới tính *</label>
              <select
                name="gender"
                value={addForm.gender}
                onChange={handleAddChange}
                className="w-full rounded-lg px-3 py-2.5 transition-colors outline-none cursor-pointer border focus:border-red-500"
                style={selectStyle}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <Input label="Số điện thoại *" name="phoneNumber" value={addForm.phoneNumber} onChange={handleAddChange} required />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Hủy</Button>
            <Button type="submit">Thêm mới</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Chỉnh Sửa Thành Viên */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Chỉnh Sửa Thành Viên">
        <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tài khoản *" name="username" value={editForm.username} onChange={handleEditChange} required />
            <Input label="Email * (Không thể thay đổi)" name="email" type="email" value={editForm.email} onChange={handleEditChange} disabled required />
            <Input label="Họ tên * (Không thể thay đổi)" name="fullName" value={editForm.fullName} onChange={handleEditChange} disabled required />
            <Input label="Ngày sinh *" name="dayOfBirth" type="date" value={editForm.dayOfBirth} onChange={handleEditChange} required />
            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Giới tính * (Không thể thay đổi)</label>
              <select
                name="gender"
                value={editForm.gender}
                onChange={handleEditChange}
                disabled
                className="w-full rounded-lg px-3 py-2.5 transition-colors outline-none cursor-pointer border focus:border-red-500 opacity-60"
                style={selectStyle}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <Input label="Số điện thoại *" name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditChange} required />
            <Input label={members.find(u => u.uuid === editForm.id || u.id === editForm.id)?.identityCard ? "CMND / CCCD * (Không thể thay đổi)" : "CMND / CCCD *"} name="identityCard" value={editForm.identityCard} onChange={handleEditChange} disabled={!!members.find(u => u.uuid === editForm.id || u.id === editForm.id)?.identityCard} required />
            <Input label="Địa chỉ *" name="address" value={editForm.address} onChange={handleEditChange} required />
          </div>
          <div className="border-t border-[var(--color-border)] pt-4 mt-2">
            <div className="flex items-start gap-2 mb-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5 flex-shrink-0 text-base select-none">shield</span>
              <p className="text-xs text-[var(--color-text-muted)] text-left">
                Yêu cầu nhập lại mật khẩu của thành viên (hoặc mật khẩu mới) để xác nhận cập nhật thông tin lên hệ thống.
              </p>
            </div>
            <Input label="Mật khẩu xác nhận / Mới *" name="password" type="password" placeholder="Nhập mật khẩu của thành viên" value={editForm.password || ''} onChange={handleEditChange} minLength={8} required />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu thay đổi</Button>
          </div>
        </form>
      </Modal>

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
