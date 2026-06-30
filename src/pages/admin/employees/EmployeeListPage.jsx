import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeService } from '../../../services/employeeService'
import Button from '../../../components/common/Button'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus, Search, Pencil, Trash2, Users,
  UserCheck, X,
  Mail, Phone, Calendar,
} from 'lucide-react'

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)

  // Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  // Lưu status tạm theo uuid để <select> hiển thị đúng option user vừa chọn
  // khi modal xác nhận đang mở (tránh dropdown "không hoạt động" do employee.status
  // chưa được cập nhật từ backend).
  const [pendingStatusMap, setPendingStatusMap] = useState({})

  // Trả về status hiện tại đang hiển thị cho từng nhân viên — ưu tiên giá trị tạm
  // mà user vừa chọn (nếu đang mở modal); fallback về status thực tế.
  const getCurrentStatus = (employee) => {
    const key = employee.uuid || employee.id
    return pendingStatusMap[key] ?? employee.status
  }
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback((pageNum = 0) => {
    setLoading(true)
    const params = { page: pageNum, size: 10 }
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (roleFilter !== 'all') params.role = roleFilter
    employeeService.getAll(params)
      .then(r => {
        const resData = r.data?.result ?? r.data ?? {}
        const list = resData.content ?? []
        // Loại bỏ user có role MANAGER (chỉ hiển thị STAFF cho admin quản lý)
        let filtered = list.filter(e => !e.roles?.includes('MANAGER'))
        if (statusFilter !== 'all') {
          filtered = filtered.filter(e => e.status === statusFilter)
        }
        setEmployees(filtered)
        setPage(resData.pageNumber ?? pageNum)
        setTotalPages(resData.totalPages ?? 1)
        setTotalElements(resData.totalElements ?? list.length)
      })
      .catch(err => {
        console.error('Error loading employees:', err)
        setEmployees([])
      })
      .finally(() => setLoading(false))
  }, [searchTerm, roleFilter, statusFilter])

  useEffect(() => { load(0) }, [load])

  const stats = {
    total: employees.length,
    staff: employees.filter(e => e.roles?.includes('STAFF')).length,
  }

  const getRoleBadge = (roles) => {
    if (roles?.includes('MANAGER')) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.25rem 0.75rem', borderRadius: '9999px',
          fontSize: '0.75rem', fontWeight: 600,
          background: 'rgba(245,158,11,0.15)', color: '#b45309',
          border: '1px solid rgba(245,158,11,0.3)'
        }}>
          <Crown size={12} />
          Quản lý
        </span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.25rem 0.75rem', borderRadius: '9999px',
        fontSize: '0.75rem', fontWeight: 600,
        background: 'rgba(16,185,129,0.12)', color: '#059669',
        border: '1px solid rgba(16,185,129,0.25)'
      }}>
        <UserCheck size={12} />
        Nhân viên
      </span>
    )
  }

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.2rem 0.6rem', borderRadius: '9999px',
          fontSize: '0.7rem', fontWeight: 600,
          background: 'rgba(16,185,129,0.12)', color: '#059669',
          border: '1px solid rgba(16,185,129,0.25)'
        }}>
          Hoạt động
        </span>
      )
    }
    if (status === 'INACTIVE') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.2rem 0.6rem', borderRadius: '9999px',
          fontSize: '0.7rem', fontWeight: 600,
          background: 'rgba(100,116,139,0.1)', color: '#475569',
          border: '1px solid rgba(100,116,139,0.25)'
        }}>
          Đã xóa (Vô hiệu)
        </span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.2rem 0.6rem', borderRadius: '9999px',
        fontSize: '0.7rem', fontWeight: 600,
        background: 'rgba(239,68,68,0.1)', color: '#dc2626',
        border: '1px solid rgba(239,68,68,0.25)'
      }}>
        Bị khóa
      </span>
    )
  }

  const getStatusDotColor = (status) => {
    if (status === 'ACTIVE') return '#10b981'
    if (status === 'INACTIVE') return '#64748b'
    return '#ef4444'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarGradient = (id) => {
    const gradients = [
      'linear-gradient(135deg, #7c3aed, #6d28d9)',
      'linear-gradient(135deg, #2563eb, #0891b2)',
      'linear-gradient(135deg, #db2777, #f43f5e)',
      'linear-gradient(135deg, #059669, #14b8a6)',
      'linear-gradient(135deg, #ea580c, #f59e0b)',
      'linear-gradient(135deg, #4f46e5, #3b82f6)',
    ]
    return gradients[(id || 0) % gradients.length]
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('vi-VN')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const empId = deleteTarget.uuid || deleteTarget.id
    employeeService.delete(empId)
      .then(() => {
        setDeleteTarget(null)
        setShowModal(false)
        load(page)
      })
      .catch(err => {
        console.error('Delete error:', err)
        setDeleteTarget(null)
        setShowModal(false)
      })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const confirmUpdateStatus = (employee, newStatus) => {
    if (employee.status === newStatus) return
    const key = employee.uuid || employee.id
    setPendingStatusMap(prev => ({ ...prev, [key]: newStatus }))
    setStatusTarget(employee)
    setPendingStatus(newStatus)
    setShowStatusModal(true)
  }

  const handleUpdateStatus = () => {
    if (!statusTarget || !pendingStatus) return
    setLoading(true)
    // Gọi PATCH /status endpoint (đồng bộ với gitlab main) — không cần gửi
    // lại toàn bộ payload như PUT /{id}.
    employeeService.updateStatus(statusTarget.uuid || statusTarget.id, pendingStatus)
      .then(() => {
        const key = statusTarget.uuid || statusTarget.id
        setPendingStatusMap(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        setShowStatusModal(false)
        setStatusTarget(null)
        setPendingStatus(null)
        load(page)
      })
      .catch(err => {
        console.error('Update status error:', err.response?.data || err)
        const errCode = err.response?.data?.code
        const errMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
        if (errCode === 1007) alert('Bạn không có quyền thực hiện thao tác này')
        else alert(`Cập nhật trạng thái thất bại: ${errMsg}`)
        setLoading(false)
      })
  }

  const closeStatusModal = () => {
    if (statusTarget) {
      const key = statusTarget.uuid || statusTarget.id
      setPendingStatusMap(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
    setShowStatusModal(false)
    setStatusTarget(null)
    setPendingStatus(null)
  }

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 700, color: '#1e293b',
            letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2
          }}>
            Quản lý nhân viên
          </h1>
          <p style={{
            color: '#64748b', marginTop: '0.35rem', fontSize: '0.875rem', margin: '0.35rem 0 0'
          }}>
            Quản lý danh sách nhân viên và thông tin tài khoản vận hành hệ thống.
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/employees/add')}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: 'none', color: '#fff', fontWeight: 600,
            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
            padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            cursor: 'pointer', fontSize: '0.875rem'
          }}
        >
          <Plus size={16} />
          Thêm nhân viên
        </Button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem'
      }}>
        {[
          { icon: Users, label: 'Tổng nhân viên', value: stats.total, gradient: '135deg, #7c3aed, #6d28d9', bg: 'rgba(124,58,237,0.08)' },
          { icon: UserCheck, label: 'Nhân viên', value: stats.staff, gradient: '135deg, #059669, #047857', bg: 'rgba(5,150,105,0.08)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '1rem', padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.875rem',
              background: `linear-gradient(${stat.gradient})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${stat.bg.replace('0.08', '0.25')}`,
              flexShrink: 0
            }}>
              <stat.icon size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>{stat.label}</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.1 }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '1.5rem',
        flexWrap: 'wrap', alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm kiếm tên, tài khoản, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(0) }}
            style={{
              width: '100%', paddingLeft: '2.75rem', paddingRight: '2.75rem',
              paddingTop: '0.75rem', paddingBottom: '0.75rem',
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '0.75rem', color: '#1e293b',
              outline: 'none', fontSize: '0.875rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute', right: '0.875rem', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                color: '#94a3b8', cursor: 'pointer', padding: '0.125rem',
                display: 'flex', alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'all', label: 'Tất cả', color: '#7c3aed' },
            { key: 'STAFF', label: 'Nhân viên', color: '#059669' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setRoleFilter(filter.key)}
              style={{
                padding: '0.625rem 1rem', borderRadius: '0.625rem',
                fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                border: roleFilter === filter.key ? 'none' : '1px solid #e2e8f0',
                background: roleFilter === filter.key ? filter.color : '#fff',
                color: roleFilter === filter.key ? '#fff' : '#64748b',
                boxShadow: roleFilter === filter.key ? `0 3px 10px ${filter.color}30` : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'all', label: 'Tất cả trạng thái', color: '#7c3aed' },
            { key: 'ACTIVE', label: 'Hoạt động', color: '#059669' },
            { key: 'LOCKED', label: 'Bị khóa', color: '#ef4444' },
            { key: 'INACTIVE', label: 'Đã xóa', color: '#64748b' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              style={{
                padding: '0.625rem 1rem', borderRadius: '0.625rem',
                fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                border: statusFilter === filter.key ? 'none' : '1px solid #e2e8f0',
                background: statusFilter === filter.key ? filter.color : '#fff',
                color: statusFilter === filter.key ? '#fff' : '#64748b',
                boxShadow: statusFilter === filter.key ? `0 3px 10px ${filter.color}30` : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '0.625rem 1rem', borderRadius: '0.625rem',
              fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
              border: '1px solid #e2e8f0', background: '#fff',
              color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} style={{ marginRight: '0.3rem' }} />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <span style={{ fontSize: '40px', color: '#7c3aed', animation: 'spin 1s linear infinite' }}>&#9696;</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : employees.length > 0 ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1rem'
          }}>
            <AnimatePresence mode="popLayout">
              {employees.map((employee, index) => (
                <motion.div
                  key={employee.uuid || employee.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
                  style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '1rem', padding: '1.25rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.25s, border-color 0.25s, transform 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                    e.currentTarget.style.borderColor = '#c4b5fd'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Avatar & Name */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{
                        width: '3.25rem', height: '3.25rem', borderRadius: '0.75rem',
                        background: getAvatarGradient(employee.id),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        flexShrink: 0, position: 'relative'
                      }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                          {getInitials(employee.fullName)}
                        </span>
                        <div style={{
                          position: 'absolute', bottom: '-0.2rem', right: '-0.2rem',
                          width: '0.875rem', height: '0.875rem', borderRadius: '50%',
                          background: getStatusDotColor(employee.status),
                          border: '2px solid #fff'
                        }} />
                      </div>
                      <div>
                        <h3 style={{
                          fontWeight: 600, fontSize: '1rem', color: '#1e293b',
                          margin: 0, lineHeight: 1.3
                        }}>
                          {employee.fullName || 'Chưa cập nhật'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
                          @{employee.username}
                        </p>
                        <div style={{ marginTop: '0.35rem' }}>
                          {getStatusBadge(employee.status)}
                        </div>
                      </div>
                    </div>
                    {getRoleBadge(employee.roles)}
                  </div>

                  {/* Info */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    marginBottom: '1rem', paddingLeft: '0.25rem'
                  }}>
                    {[
                      { icon: Mail, value: employee.email },
                      { icon: Phone, value: employee.phoneNumber },
                      { icon: Calendar, value: `${formatDate(employee.dayOfBirth)}${employee.gender ? ' | ' + (employee.gender === 'MALE' ? 'Nam' : employee.gender === 'FEMALE' ? 'Nữ' : 'Khác') : ''}` },
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.8125rem', color: '#64748b'
                      }}>
                        <item.icon size={13} style={{ flexShrink: 0, color: '#94a3b8' }} />
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: item.value ? '#475569' : '#cbd5e1'
                        }}>
                          {item.value || 'Chưa cập nhật'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex', gap: '0.5rem',
                    paddingTop: '0.875rem',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <select
                      value={getCurrentStatus(employee)}
                      onChange={(e) => confirmUpdateStatus(employee, e.target.value)}
                      style={{
                        padding: '0 0.5rem', borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0', fontSize: '0.8125rem',
                        background: '#f8fafc', outline: 'none', cursor: 'pointer',
                        color: '#475569', fontWeight: 500
                      }}
                    >
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="LOCKED">Khóa</option>
                      <option value="INACTIVE">Vô hiệu</option>
                    </select>
                    <Button
                      variant="secondary"
                      style={{ flex: 1, fontSize: '0.8125rem' }}
                      onClick={() => navigate(`/admin/employees/edit/${employee.uuid || employee.id}`)}
                    >
                      <Pencil size={13} style={{ marginRight: '0.3rem' }} />
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="danger"
                      style={{ fontSize: '0.8125rem' }}
                      onClick={() => { setDeleteTarget(employee); setShowModal(true) }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: '0.5rem', marginTop: '1.5rem'
            }}>
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 0}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0', background: '#fff',
                  color: page <= 0 ? '#cbd5e1' : '#475569',
                  cursor: page <= 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '0.875rem',
                  transition: 'all 0.2s',
                }}
              >
                Trước
              </button>
              <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0', background: '#fff',
                  color: page >= totalPages - 1 ? '#cbd5e1' : '#475569',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '0.875rem',
                  transition: 'all 0.2s',
                }}
              >
                Sau
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '4rem 1rem',
          background: '#fff', border: '2px dashed #e2e8f0',
          borderRadius: '1rem'
        }}>
          <div style={{
            width: '4.5rem', height: '4.5rem', borderRadius: '50%',
            background: '#f8fafc', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
          }}>
            <Users size={32} style={{ color: '#cbd5e1' }} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.35rem' }}>
            Không tìm thấy nhân viên
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.25rem', textAlign: 'center' }}>
            {hasActiveFilters
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Danh sách nhân viên trống'}
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {/* Results Count */}
      {!loading && employees.length > 0 && (
        <p style={{
          textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem',
          marginTop: '1.25rem'
        }}>
          {hasActiveFilters
            ? `Hiển thị ${employees.length} / ${totalElements} nhân viên`
            : `${totalElements} nhân viên`}
        </p>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showModal && deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
              padding: '1rem'
            }}
            onClick={() => { setShowModal(false); setDeleteTarget(null) }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: '#fff', borderRadius: '1rem', padding: '1.75rem',
                width: '100%', maxWidth: '26rem',
                boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem'
              }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '50%',
                  background: 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Trash2 size={20} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Xóa nhân viên
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '0.15rem 0 0' }}>
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>

              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn vô hiệu hóa nhân viên{' '}
                <strong style={{ color: '#1e293b' }}>"{deleteTarget.fullName}"</strong>?
                Tài khoản sẽ bị vô hiệu hóa (Đã xóa) và không thể đăng nhập vào hệ thống.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  onClick={() => { setShowModal(false); setDeleteTarget(null) }}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none', color: '#fff'
                  }}
                >
                  Vô hiệu hóa nhân viên
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Confirmation Modal */}
      <AnimatePresence>
        {showStatusModal && statusTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '1rem'
            }}
            onClick={closeStatusModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: '#fff', borderRadius: '1rem', padding: '1.75rem',
                width: '100%', maxWidth: '26rem',
                boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem'
              }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '50%',
                  background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Thay đổi trạng thái
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '0.15rem 0 0' }}>
                    Xác nhận hành động của bạn
                  </p>
                </div>
              </div>

              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn thay đổi trạng thái của nhân viên{' '}
                <strong style={{ color: '#1e293b' }}>"{statusTarget.fullName}"</strong> thành{' '}
                <strong style={{ color: '#1e293b' }}>
                  {pendingStatus === 'ACTIVE' ? 'Hoạt động' : pendingStatus === 'LOCKED' ? 'Khóa' : 'Vô hiệu'}
                </strong>?
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  onClick={closeStatusModal}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none' }}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateStatus}
                  style={{
                    background: '#f59e0b',
                    border: 'none', color: '#fff'
                  }}
                >
                  Xác nhận
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
