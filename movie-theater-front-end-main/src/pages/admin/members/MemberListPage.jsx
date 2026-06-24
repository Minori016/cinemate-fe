import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { memberService } from '../../../services/memberService'
import Table from '../../../components/common/Table'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import { Plus, Pencil, Trash2, Users, Search, X, ChevronLeft, ChevronRight, UserCheck, UserX } from 'lucide-react'

export default function MemberListPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    last: true
  })

  // Search & Filter states
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  // Modal states
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [lockTarget, setLockTarget] = useState(null)
  const [toast, setToast] = useState(null)

  // Form states
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dayOfBirth: '',
    gender: 'Male',
    phoneNumber: '',
  })

  const [editForm, setEditForm] = useState({
    id: '',
    username: '',
    email: '',
    fullName: '',
    dayOfBirth: '',
    gender: 'Male',
    identityCard: '',
    phoneNumber: '',
    address: '',
  })

  const [formErrors, setFormErrors] = useState({})

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadMembers = useCallback(() => {
    setLoading(true)
    const params = {
      page: pagination.pageNumber,
      size: pagination.pageSize,
      search: searchKeyword,
      status: statusFilter || undefined,
      sortBy,
      direction: sortDir
    }

    memberService.getAll(params)
      .then(r => {
        const result = r.data?.result
        if (result) {
          setMembers(result.content || [])
          setPagination({
            pageNumber: result.pageNumber,
            pageSize: result.pageSize,
            totalElements: result.totalElements,
            totalPages: result.totalPages,
            last: result.last
          })
        } else {
          setMembers(r.data?.result?.content || [])
        }
      })
      .catch(err => {
        console.error('API Error:', err)
        showToast('Không thể tải danh sách thành viên.', 'danger')
      })
      .finally(() => setLoading(false))
  }, [pagination.pageNumber, searchKeyword, statusFilter, sortBy, sortDir])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  // Reset page when search/filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageNumber: 0 }))
  }, [searchKeyword, statusFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    loadMembers()
  }

  const handleClearSearch = () => {
    setSearchKeyword('')
    setStatusFilter('')
  }

  const goToPage = (page) => {
    if (page >= 0 && page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, pageNumber: page }))
    }
  }

  const handleAddChange = (e) => {
    const { name, value } = e.target
    setAddForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateAddForm = () => {
    const errors = {}
    if (!addForm.username.trim()) errors.username = 'Tài khoản không được để trống'
    else if (addForm.username.length < 3) errors.username = 'Tài khoản phải có ít nhất 3 ký tự'
    if (!addForm.email.trim()) errors.email = 'Email không được để trống'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errors.email = 'Email không hợp lệ'
    if (!addForm.password) errors.password = 'Mật khẩu không được để trống'
    else if (addForm.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(addForm.password)) {
      errors.password = 'Mật khẩu phải chứa hoa, thường, số, ký tự đặc biệt'
    }
    if (!addForm.confirmPassword) errors.confirmPassword = 'Xác nhận mật khẩu không được để trống'
    else if (addForm.password !== addForm.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    if (!addForm.fullName.trim()) errors.fullName = 'Họ tên không được để trống'
    if (!addForm.dayOfBirth) errors.dayOfBirth = 'Ngày sinh không được để trống'
    else {
      const birthDate = new Date(addForm.dayOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (birthDate > today) errors.dayOfBirth = 'Ngày sinh không hợp lệ'
      else if (age < 13) errors.dayOfBirth = 'Phải từ 13 tuổi trở lên'
    }
    if (!addForm.phoneNumber.trim()) errors.phoneNumber = 'Số điện thoại không được để trống'
    else if (!/^[0-9]{9,11}$/.test(addForm.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ (9-11 số)'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEditForm = () => {
    const errors = {}
    if (!editForm.fullName.trim()) errors.fullName = 'Họ tên không được để trống'
    if (!editForm.dayOfBirth) errors.dayOfBirth = 'Ngày sinh không được để trống'
    if (!editForm.identityCard.trim()) errors.identityCard = 'CCCD/CMND không được để trống'
    if (!editForm.email.trim()) errors.email = 'Email không được để trống'
    if (!editForm.phoneNumber.trim()) errors.phoneNumber = 'Số điện thoại không được để trống'
    if (!editForm.address.trim()) errors.address = 'Địa chỉ không được để trống'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!validateAddForm()) {
      showToast('Vui lòng kiểm tra lại thông tin nhập liệu.', 'danger')
      return
    }

    try {
      await memberService.register(addForm)
      showToast('Thêm thành viên mới thành công!', 'success')
      setAddOpen(false)
      setAddForm({
        username: '', email: '', password: '', confirmPassword: '',
        fullName: '', dayOfBirth: '', gender: 'Male', phoneNumber: '',
      })
      loadMembers()
    } catch (err) {
      console.error('Register error:', err)
      let msg = 'Không thể thêm thành viên.'
      const res = err.response?.data
      if (res?.message) {
        const msgText = res.message
        if (typeof msgText === 'string') {
          // Map backend error messages to Vietnamese
          if (msgText.includes('EMAIL_REQUIRED') || msgText.includes('email')) msg = 'Email không được để trống'
          else if (msgText.includes('USERNAME_REQUIRED') || msgText.includes('username')) msg = 'Tài khoản không được để trống'
          else if (msgText.includes('WEAK_PASSWORD') || msgText.includes('password')) msg = 'Mật khẩu yếu. Cần: hoa, thường, số, ký tự đặc biệt'
          else if (msgText.includes('USER_EXISTED') || msgText.includes('existed')) msg = 'Email hoặc tài khoản đã tồn tại'
          else msg = msgText
        }
      }
      showToast(msg, 'danger')
    }
  }

  const handleEditClick = (row) => {
    setEditForm({
      id: row.uuid || row.id,
      username: row.username || '',
      email: row.email || '',
      fullName: row.fullName || '',
      dayOfBirth: row.dayOfBirth || '',
      gender: row.gender || 'Male',
      identityCard: row.identityCard || '',
      phoneNumber: row.phoneNumber || '',
      address: row.address || '',
    })
    setFormErrors({})
    setEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateEditForm()) {
      showToast('Vui lòng kiểm tra lại thông tin nhập liệu.', 'danger')
      return
    }

    try {
      await memberService.update(editForm.id, editForm)
      showToast('Cập nhật thông tin thành viên thành công!', 'success')
      setEditOpen(false)
      loadMembers()
    } catch (err) {
      console.error('Update error:', err)
      let msg = 'Cập nhật thất bại.'
      const res = err.response?.data
      if (res?.message) {
        const msgText = res.message
        if (typeof msgText === 'string') {
          if (msgText.includes('USER_EXISTED') || msgText.includes('existed')) msg = 'Email đã tồn tại'
          else msg = msgText
        }
      }
      showToast(msg, 'danger')
    }
  }

  const handleDeleteSubmit = async () => {
    try {
      await memberService.delete(deleteTarget.uuid || deleteTarget.id)
      showToast('Xóa thành viên thành công!', 'success')
      setDeleteTarget(null)
      loadMembers()
    } catch (err) {
      showToast('Không thể xóa thành viên.', 'danger')
      setDeleteTarget(null)
    }
  }

  const handleLockToggle = async () => {
    if (!lockTarget) return
    try {
      const newStatus = lockTarget.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
      await memberService.updateStatus(lockTarget.uuid || lockTarget.id, newStatus)
      showToast(`Đã ${newStatus === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản thành công!`, 'success')
      setLockTarget(null)
      loadMembers()
    } catch (err) {
      showToast('Không thể thay đổi trạng thái.', 'danger')
      setLockTarget(null)
    }
  }

  const columns = [
    { key: 'username', label: 'Tài khoản' },
    { key: 'fullName', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'SĐT' },
    { key: 'gender', label: 'Giới tính', render: (row) => row.gender === 'Male' ? 'Nam' : row.gender === 'Female' ? 'Nữ' : 'Khác' },
    {
      key: 'score',
      label: 'Điểm',
      render: (row) => <span className="font-semibold text-yellow-500">{row.score || 0}</span>
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {row.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
        </span>
      )
    },
  ]

  const hasActiveFilters = searchKeyword || statusFilter

  return (
    <motion.div
      className="space-y-6 text-[#e2e2e2]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-md"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          <span className={toast.type === 'success' ? 'material-symbols-outlined' : 'material-symbols-outlined'}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
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
            Quản lý thành viên
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Quản lý danh sách thành viên đăng ký trên hệ thống.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-1" /> Thêm thành viên
        </Button>
      </motion.div>

      {/* Search & Filter Section */}
      <motion.div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, tài khoản, email, SĐT..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors"
              />
              {searchKeyword && (
                <button type="button" onClick={() => setSearchKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="LOCKED">Bị khóa</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="w-full md:w-40">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="fullName">Họ tên</option>
                <option value="score">Điểm</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div className="w-full md:w-32">
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>
            </div>

            <Button type="submit">
              <Search size={16} className="mr-1" /> Tìm
            </Button>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
              <span className="text-xs text-[var(--color-text-muted)]">Bộ lọc:</span>
              {searchKeyword && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                  Tìm: "{searchKeyword}"
                  <button type="button" onClick={() => setSearchKeyword('')}><X size={12} /></button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  {statusFilter === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                  <button type="button" onClick={() => setStatusFilter('')}><X size={12} /></button>
                </span>
              )}
              <button type="button" onClick={handleClearSearch} className="text-xs text-[var(--color-text-muted)] hover:text-white ml-2">
                Xóa tất cả
              </button>
            </div>
          )}
        </form>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            Hiển thị <span className="text-white font-medium">{members.length}</span> /{' '}
            <span className="text-white font-medium">{pagination.totalElements}</span> thành viên
          </p>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl">
            <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
            <p className="text-sm text-[var(--color-text-muted)]">Đang tải danh sách thành viên...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 flex flex-col justify-center items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl">
            <Users size={48} className="text-gray-600" />
            <p className="text-sm text-[var(--color-text-muted)]">Không tìm thấy thành viên nào.</p>
            {hasActiveFilters && (
              <Button variant="secondary" onClick={handleClearSearch}>Xóa bộ lọc</Button>
            )}
          </div>
        ) : (
          <>
            <Table columns={columns} data={members} actions={row => (
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="secondary" onClick={() => handleEditClick(row)} title="Chỉnh sửa">
                  <Pencil size={12} />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setLockTarget(row)} title={row.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}>
                  {row.status === 'ACTIVE' ? <UserX size={12} /> : <UserCheck size={12} />}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)} title="Xóa">
                  <Trash2 size={12} />
                </Button>
              </div>
            )} />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button variant="secondary" size="sm" disabled={pagination.pageNumber === 0} onClick={() => goToPage(0)}>Đầu</Button>
                <Button variant="secondary" size="sm" disabled={pagination.pageNumber === 0} onClick={() => goToPage(pagination.pageNumber - 1)}>
                  <ChevronLeft size={16} />
                </Button>

                <div className="flex items-center gap-1 px-3">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let page
                    if (pagination.totalPages <= 5) page = i
                    else if (pagination.pageNumber < 3) page = i
                    else if (pagination.pageNumber > pagination.totalPages - 3) page = pagination.totalPages - 5 + i
                    else page = pagination.pageNumber - 2 + i
                    return (
                      <button key={page} onClick={() => goToPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pagination.pageNumber ? 'bg-red-500 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-white'}`}>
                        {page + 1}
                      </button>
                    )
                  })}
                </div>

                <Button variant="secondary" size="sm" disabled={pagination.last} onClick={() => goToPage(pagination.pageNumber + 1)}>
                  <ChevronRight size={16} />
                </Button>
                <Button variant="secondary" size="sm" disabled={pagination.last} onClick={() => goToPage(pagination.totalPages - 1)}>Cuối</Button>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Modal Thêm Thành Viên */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm Thành Viên Mới">
        <form onSubmit={handleAddSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tài khoản *" name="username" value={addForm.username} onChange={handleAddChange} error={formErrors.username} placeholder="Nhập tài khoản" />
            <Input label="Email *" name="email" type="email" value={addForm.email} onChange={handleAddChange} error={formErrors.email} placeholder="email@example.com" />
            <Input label="Mật khẩu *" name="password" type="password" value={addForm.password} onChange={handleAddChange} error={formErrors.password} placeholder="Ít nhất 8 ký tự" />
            <Input label="Xác nhận mật khẩu *" name="confirmPassword" type="password" value={addForm.confirmPassword} onChange={handleAddChange} error={formErrors.confirmPassword} />
            <Input label="Họ tên *" name="fullName" value={addForm.fullName} onChange={handleAddChange} error={formErrors.fullName} />
            <Input label="Ngày sinh *" name="dayOfBirth" type="date" value={addForm.dayOfBirth} onChange={handleAddChange} error={formErrors.dayOfBirth} />
            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Giới tính *</label>
              <select name="gender" value={addForm.gender} onChange={handleAddChange}
                className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer">
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
            <Input label="Số điện thoại *" name="phoneNumber" value={addForm.phoneNumber} onChange={handleAddChange} error={formErrors.phoneNumber} />
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
            <Input label="Tài khoản" name="username" value={editForm.username} disabled />
            <Input label="Email *" name="email" type="email" value={editForm.email} onChange={handleEditChange} error={formErrors.email} />
            <Input label="Họ tên *" name="fullName" value={editForm.fullName} onChange={handleEditChange} error={formErrors.fullName} />
            <Input label="Ngày sinh *" name="dayOfBirth" type="date" value={editForm.dayOfBirth} onChange={handleEditChange} error={formErrors.dayOfBirth} />
            <Input label="CCCD/CMND *" name="identityCard" value={editForm.identityCard} onChange={handleEditChange} error={formErrors.identityCard} />
            <Input label="Số điện thoại *" name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditChange} error={formErrors.phoneNumber} />
            <div className="flex flex-col gap-1 w-full text-left">
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Giới tính *</label>
              <select name="gender" value={editForm.gender} onChange={handleEditChange}
                className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer">
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
            <Input label="Địa chỉ *" name="address" value={editForm.address} onChange={handleEditChange} error={formErrors.address} />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu thay đổi</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác Nhận Khóa/Mở Khóa */}
      <Modal open={!!lockTarget} onClose={() => setLockTarget(null)} title={lockTarget?.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
        <p className="text-[var(--color-text-muted)] text-sm mb-4">
          {lockTarget?.status === 'ACTIVE'
            ? <>Bạn có chắc muốn <span className="text-red-400 font-semibold">khóa</span> tài khoản <span className="text-white font-semibold">"{lockTarget?.fullName}"</span>? Thành viên sẽ không thể đăng nhập.</>
            : <>Bạn có chắc muốn <span className="text-green-400 font-semibold">mở khóa</span> tài khoản <span className="text-white font-semibold">"{lockTarget?.fullName}"</span>? Thành viên sẽ có thể đăng nhập lại.</>
          }
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setLockTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleLockToggle}>
            {lockTarget?.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
          </Button>
        </div>
      </Modal>

      {/* Modal Xác Nhận Xóa */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-[var(--color-text-muted)] text-sm mb-4">
          Xóa thành viên <span className="text-white font-semibold">"{deleteTarget?.fullName}"</span>?
          <br />
          <span className="text-red-400">Hành động này không thể hoàn tác.</span>
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDeleteSubmit}>Xóa</Button>
        </div>
      </Modal>
    </motion.div>
  )
}
