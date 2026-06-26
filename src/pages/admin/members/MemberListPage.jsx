import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { memberService } from '../../../services/memberService'
import Button from '../../../components/common/Button'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus, Search, Pencil, Trash2, Users,
  X, Mail, Phone, Calendar, Star,
} from 'lucide-react'

const DEBOUNCE_MS = 400

export default function MemberListPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debounceRef = useRef(null)

  const load = useCallback((params = {}) => {
    setLoading(true)
    memberService.getAll(params)
      .then(r => {
        const resData = r.data?.result ?? r.data?.data ?? r.data ?? {}
        const list = resData.content ?? (Array.isArray(resData) ? resData : [])
        const memberList = list.filter(u => u.roles?.includes('MEMBER'))
        setMembers(memberList)
      })
      .catch(err => {
        console.error('Error loading members:', err)
        setMembers([])
      })
      .finally(() => {
        setLoading(false)
        setIsSearching(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Debounce: sau DEBOUNCE_MS ms không gõ nữa mới gọi API
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (searchTerm !== debouncedTerm) {
      setIsSearching(true)
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
  }, [searchTerm])

  // Khi debouncedTerm hoặc statusFilter thay đổi → gọi lại API
  useEffect(() => {
    const params = {}
    if (debouncedTerm.trim()) params.search = debouncedTerm.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    setIsSearching(true)
    load(params)
  }, [debouncedTerm, statusFilter, load])

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'ACTIVE').length,
    locked: members.filter(m => m.status === 'LOCKED').length,
  }

  const filteredMembers = members.filter(m => {
    const term = debouncedTerm.toLowerCase()
    const matchesSearch = !term ||
      m.fullName?.toLowerCase().includes(term) ||
      m.username?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.phoneNumber?.includes(term)

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter

    return matchesSearch && matchesStatus
  })

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

  const getStatusDotColor = (status) => status === 'ACTIVE' ? '#10b981' : '#ef4444'

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
    memberService.delete(deleteTarget.uuid || deleteTarget.id)
      .then(() => {
        setDeleteTarget(null)
        setShowModal(false)
        load()
      })
      .catch(err => {
        console.error('Delete error:', err)
        setDeleteTarget(null)
        setShowModal(false)
      })
  }

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
            Quản lý thành viên
          </h1>
          <p style={{
            color: '#64748b', marginTop: '0.35rem', fontSize: '0.875rem', margin: '0.35rem 0 0'
          }}>
            Quản lý danh sách thành viên đã đăng ký tài khoản trên hệ thống.
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/members/add')}
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
          Thêm thành viên
        </Button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem'
      }}>
        {[
          { icon: Users, label: 'Tổng thành viên', value: stats.total, gradient: '135deg, #7c3aed, #6d28d9', bg: 'rgba(124,58,237,0.08)' },
          { icon: Star, label: 'Hoạt động', value: stats.active, gradient: '135deg, #059669, #047857', bg: 'rgba(5,150,105,0.08)' },
          { icon: Trash2, label: 'Bị khóa', value: stats.locked, gradient: '135deg, #ef4444, #dc2626', bg: 'rgba(239,68,68,0.08)' },
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
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', transition: 'opacity 0.2s' }} />
          <input
            type="text"
            placeholder="Tìm kiếm tên, tài khoản, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', paddingLeft: '2.75rem', paddingRight: searchTerm ? '2.5rem' : '1rem',
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
                position: 'absolute', right: '2.5rem', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                color: '#94a3b8', cursor: 'pointer', padding: '0.125rem',
                display: 'flex', alignItems: 'center'
              }}
            >
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'searchSpin 0.7s linear infinite' }} />
            </button>
          )}
          {searchTerm ? (
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
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'all', label: 'Tất cả', color: '#7c3aed' },
            { key: 'ACTIVE', label: 'Hoạt động', color: '#059669' },
            { key: 'LOCKED', label: 'Bị khóa', color: '#ef4444' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => {
                setStatusFilter(filter.key)
                setIsSearching(true)
              }}
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
      </div>

      {/* Member Grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <span style={{ fontSize: '40px', color: '#7c3aed', animation: 'spin 1s linear infinite' }}>&#9696;</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredMembers.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1rem'
        }}>
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id || member.uuid}
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
                      background: getAvatarGradient(member.id),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      flexShrink: 0, position: 'relative'
                    }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        {getInitials(member.fullName)}
                      </span>
                      <div style={{
                        position: 'absolute', bottom: '-0.2rem', right: '-0.2rem',
                        width: '0.875rem', height: '0.875rem', borderRadius: '50%',
                        background: getStatusDotColor(member.status),
                        border: '2px solid #fff'
                      }} />
                    </div>
                    <div>
                      <h3 style={{
                        fontWeight: 600, fontSize: '1rem', color: '#1e293b',
                        margin: 0, lineHeight: 1.3
                      }}>
                        {member.fullName || 'Chưa cập nhật'}
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
                        @{member.username}
                      </p>
                      <div style={{ marginTop: '0.35rem' }}>
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.25rem 0.75rem', borderRadius: '9999px',
                    fontSize: '0.75rem', fontWeight: 600,
                    background: 'rgba(124,58,237,0.1)', color: '#7c3aed',
                    border: '1px solid rgba(124,58,237,0.2)'
                  }}>
                    <Star size={12} />
                    Thành viên
                  </span>
                </div>

                {/* Info */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.4rem',
                  marginBottom: '1rem', paddingLeft: '0.25rem'
                }}>
                  {[
                    { icon: Mail, value: member.email },
                    { icon: Phone, value: member.phoneNumber },
                    { icon: Calendar, value: `${formatDate(member.dayOfBirth)}${member.gender ? ' | ' + (member.gender === 'MALE' ? 'Nam' : member.gender === 'FEMALE' ? 'Nữ' : 'Khác') : ''}` },
                    { icon: Star, value: `Điểm tích lũy: ${member.score || 0} điểm` },
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
                  <Button
                    variant="secondary"
                    style={{ flex: 1, fontSize: '0.8125rem' }}
                    onClick={() => navigate(`/admin/members/edit/${member.uuid || member.id}`)}
                  >
                    <Pencil size={13} style={{ marginRight: '0.3rem' }} />
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="danger"
                    style={{ fontSize: '0.8125rem' }}
                    onClick={() => { setDeleteTarget(member); setShowModal(true) }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
            Không tìm thấy thành viên
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.25rem', textAlign: 'center' }}>
            {searchTerm || statusFilter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Danh sách thành viên trống'}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <Button variant="secondary" onClick={() => { setSearchTerm(''); setStatusFilter('all') }}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {/* Results Count */}
      {filteredMembers.length > 0 && (
        <p style={{
          textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem',
          marginTop: '1.25rem'
        }}>
          Hiển thị {filteredMembers.length} / {members.length} thành viên
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
                    Xóa thành viên
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '0.15rem 0 0' }}>
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>

              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn xóa thành viên{' '}
                <strong style={{ color: '#1e293b' }}>"{deleteTarget.fullName}"</strong>?
                Tất cả dữ liệu liên quan sẽ bị mất vĩnh viễn.
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
                  Xóa thành viên
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes searchSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  )
}
