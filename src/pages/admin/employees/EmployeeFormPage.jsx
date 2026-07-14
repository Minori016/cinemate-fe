import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { employeeService } from '../../../services/employeeService'
import {
  ArrowLeft, User, Eye, EyeOff, CheckCircle, XCircle,
  Info, UserPlus, Save, X,
} from 'lucide-react'

const INPUT_STYLE = {
  width: '100%',
  padding: '10px 14px',
  background: '#ffffff',
  border: '2px solid #e5e7eb',
  borderRadius: '10px',
  color: '#0f172a',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
}
const INPUT_FOCUS = {
  borderColor: '#7c3aed',
  boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)',
}
const INPUT_ERROR = {
  borderColor: '#ef4444',
}
const ERROR_TEXT = {
  color: '#ef4444',
  fontSize: '12px',
  fontWeight: '500',
  marginTop: '4px',
  display: 'block',
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,28}$/
const PHONE_REGEX = /^0[3|5|7|8|9][0-9]{8}$/
const IDENTITY_REGEX = /^\d{9}$|^\d{12}$/

export default function EmployeeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const formRef = useRef(null)

  const [form, setForm] = useState({
    username: '', email: '', fullName: '', dateOfBirth: '', gender: 'MALE',
    phoneNumber: '', address: '', identityCard: '',
    cinemaId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', role: 'STAFF',
    password: '', confirmPassword: '', status: 'ACTIVE',
    salary: 1,
  })
  const [focused, setFocused] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (isEditMode) {
      employeeService.getById(id)
        .then(res => {
          const e = res.data?.result || res.data
          if (e) {
            setForm({
              username: e.username || '', email: e.email || '',
              fullName: e.fullName || '',
              dateOfBirth: e.dateOfBirth || e.dayOfBirth || '',
              gender: e.gender ? e.gender.toUpperCase() : 'MALE',
              phoneNumber: e.phoneNumber || '', address: e.address || '',
              identityCard: e.identityCard || '',
              cinemaId: e.cinemaId || '',
              role: e.roles?.includes('MANAGER') ? 'MANAGER' : 'STAFF',
              status: e.status || 'ACTIVE',
              password: '', confirmPassword: '',
            })
            setDataLoaded(true)
          }
        })
        .catch(() => showToast('Không thể tải thông tin nhân viên', 'danger'))
    } else {
      setDataLoaded(true)
    }
  }, [id, isEditMode])

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const getInputStyle = (field) => {
    const base = { ...INPUT_STYLE }
    if (errors[field]) Object.assign(base, INPUT_ERROR)
    else if (focused[field]) Object.assign(base, INPUT_FOCUS)
    return base
  }

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Tài khoản không được để trống'
    else if (!USERNAME_REGEX.test(form.username)) {
      errs.username = 'Tài khoản 3-28 ký tự, chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang'
    }
    if (!form.email.trim()) errs.email = 'Email không được để trống'
    else if (!EMAIL_REGEX.test(form.email)) errs.email = 'Email không hợp lệ (vd: ten@example.com)'
    if (!form.fullName.trim()) errs.fullName = 'Họ tên không được để trống'
    else if (form.fullName.trim().length < 2) errs.fullName = 'Họ tên tối thiểu 2 ký tự'
    if (!form.dateOfBirth) {
      errs.dateOfBirth = 'Ngày sinh không được để trống'
    } else {
      const dob = new Date(form.dateOfBirth)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (isNaN(dob.getTime())) {
        errs.dateOfBirth = 'Ngày sinh không hợp lệ'
      } else if (dob > today) {
        errs.dateOfBirth = 'Ngày sinh không được ở tương lai'
      } else {
        const age = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        const isUnder18 = m < 0 || (m === 0 && today.getDate() < dob.getDate())
        const realAge = isUnder18 ? age - 1 : age
        if (realAge < 18) errs.dateOfBirth = `Nhân viên phải từ 18 tuổi trở lên (hiện tại ${realAge} tuổi)`
      }
    }
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'SĐT không được để trống'
    else if (!PHONE_REGEX.test(form.phoneNumber.trim())) {
      errs.phoneNumber = 'SĐT phải có 10 chữ số và bắt đầu bằng 0 (vd: 0912345678)'
    }
    if (!form.address.trim()) errs.address = 'Địa chỉ không được để trống'
    else if (form.address.trim().length < 5) errs.address = 'Địa chỉ quá ngắn (tối thiểu 5 ký tự)'
    if (!form.identityCard.trim()) errs.identityCard = 'CMND/CCCD không được để trống'
    else if (!IDENTITY_REGEX.test(form.identityCard.trim())) {
      errs.identityCard = 'CMND phải 9 chữ số hoặc CCCD phải 12 chữ số'
    }
    if (!isEditMode) {
      if (!form.password) errs.password = 'Mật khẩu không được để trống'
      else if (form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự'
      else if (!PASSWORD_REGEX.test(form.password)) {
        errs.password = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt'
      }
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp'
    } else if (form.password) {
      if (form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự'
      else if (!PASSWORD_REGEX.test(form.password)) {
        errs.password = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt'
      }
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      showToast('Vui lòng kiểm tra lại thông tin nhập liệu.', 'danger')
      return
    }
    setIsSubmitting(true)
    const data = {
      username: form.username.trim(), email: form.email.trim(),
      fullName: form.fullName.trim(), dayOfBirth: form.dateOfBirth,
      gender: form.gender, phoneNumber: form.phoneNumber.trim(),
      address: form.address.trim(), identityCard: form.identityCard.trim(),
      cinemaId: form.cinemaId, role: form.role, salary: Number(form.salary) || 1,
      ...(form.password ? { password: form.password, confirmPassword: form.confirmPassword } : {}),
      ...(isEditMode ? { status: form.status } : {}),
    }
    try {
      if (isEditMode) await employeeService.update(id, data)
      else await employeeService.create(data)
      showToast(isEditMode ? 'Cập nhật nhân viên thành công!' : 'Thêm nhân viên mới thành công!', 'success')
      setTimeout(() => navigate('/admin/employees'), 1600)
    } catch (err) {
      console.error('Save error:', err.response?.data)
      const errCode = err.response?.data?.code
      const errMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
      if (errCode === 1007) {
        showToast('Bạn không có quyền thực hiện thao tác này', 'danger')
      } else if (errCode === 3001) {
        showToast('Tài khoản đã tồn tại trong hệ thống', 'danger')
      } else if (errCode === 1002) {
        showToast('Email đã tồn tại trong hệ thống', 'danger')
      } else if (errCode === 1012) {
        showToast('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt', 'danger')
      } else if (errCode === 1004) {
        showToast('Mật khẩu phải có ít nhất 8 ký tự', 'danger')
      } else {
        showToast(`Không thể lưu: ${errMsg}`, 'danger')
      }
      setIsSubmitting(false)
    }
  }

  if (!dataLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span style={{ fontSize: '40px', color: '#7c3aed', animation: 'spin 1s linear infinite' }}>&#9696;</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px', borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          fontSize: '14px', fontWeight: '500', maxWidth: '420px',
          background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#065f46' : '#991b1b',
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', marginLeft: 'auto', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/admin/employees')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', color: '#94a4a8', padding: 0, marginBottom: '12px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = '#7c3aed'}
          onMouseLeave={e => e.target.style.color = '#94a4a8'}
        >
          <ArrowLeft size={15} />
          Quay lại Quản lý Nhân viên
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
          }}>
            {isEditMode ? <User size={22} color="#fff" /> : <UserPlus size={22} color="#fff" />}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', lineHeight: '1.3', margin: 0 }}>
              {isEditMode ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
              {isEditMode ? 'Chỉnh sửa thông tin tài khoản nhân viên.' : 'Tạo tài khoản nhân viên mới với thông tin cá nhân và quyền truy cập.'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Account info card */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '16px', padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="#7c3aed" />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Thông tin tài khoản</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Tài khoản <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="username" type="text" placeholder="nv001" value={form.username}
                    onChange={e => update('username', e.target.value)}
                    onFocus={() => setFocused(f => ({ ...f, username: true }))}
                    onBlur={() => setFocused(f => ({ ...f, username: false }))}
                    style={getInputStyle('username')}
                    onMouseEnter={e => { if (!focused.username && !errors.username) e.target.style.borderColor = '#a78bfa' }}
                    onMouseLeave={e => { if (!focused.username && !errors.username) e.target.style.borderColor = errors.username ? '#ef4444' : '#e5e7eb' }}
                    maxLength={50}
                    readOnly={isEditMode}
                    title={isEditMode ? 'Không thể thay đổi tài khoản khi cập nhật' : ''}
                  />
                  {errors.username && <span style={ERROR_TEXT}>{errors.username}</span>}
                  {isEditMode && <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginTop: '2px' }}>Không thể thay đổi khi cập nhật</span>}
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="email" type="email" placeholder="nv001@cinemate.com" value={form.email}
                    onChange={e => update('email', e.target.value)}
                    onFocus={() => setFocused(f => ({ ...f, email: true }))}
                    onBlur={() => setFocused(f => ({ ...f, email: false }))}
                    style={getInputStyle('email')}
                    onMouseEnter={e => { if (!focused.email && !errors.email) e.target.style.borderColor = '#a78bfa' }}
                    onMouseLeave={e => { if (!focused.email && !errors.email) e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb' }}
                    maxLength={100}
                  />
                  {errors.email && <span style={ERROR_TEXT}>{errors.email}</span>}
                </div>
              </div>

              {(!isEditMode || form.password) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Mật khẩu {isEditMode ? '(để trống nếu không đổi)' : ''} <span style={{ color: '#ef4444' }}>{!isEditMode && '*'}</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        name="password" type={showPassword ? 'text' : 'password'} placeholder={isEditMode ? 'Để trống nếu giữ mật khẩu cũ' : 'Tối thiểu 8 ký tự'} value={form.password}
                        onChange={e => update('password', e.target.value)}
                        onFocus={() => setFocused(f => ({ ...f, password: true }))}
                        onBlur={() => setFocused(f => ({ ...f, password: false }))}
                        style={{ ...getInputStyle('password'), paddingRight: '40px' }}
                        onMouseEnter={e => { if (!focused.password && !errors.password) e.target.style.borderColor = '#a78bfa' }}
                        onMouseLeave={e => { if (!focused.password && !errors.password) e.target.style.borderColor = errors.password ? '#ef4444' : '#e5e7eb' }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.password && <span style={ERROR_TEXT}>{errors.password}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>{!isEditMode && '*'}</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        name="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" value={form.confirmPassword}
                        onChange={e => update('confirmPassword', e.target.value)}
                        onFocus={() => setFocused(f => ({ ...f, confirmPassword: true }))}
                        onBlur={() => setFocused(f => ({ ...f, confirmPassword: false }))}
                        style={{ ...getInputStyle('confirmPassword'), paddingRight: '40px' }}
                        onMouseEnter={e => { if (!focused.confirmPassword && !errors.confirmPassword) e.target.style.borderColor = '#a78bfa' }}
                        onMouseLeave={e => { if (!focused.confirmPassword && !errors.confirmPassword) e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : '#e5e7eb' }}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}>
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span style={ERROR_TEXT}>{errors.confirmPassword}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Personal info card */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '16px', padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info size={18} color="#059669" />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Thông tin cá nhân</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Họ tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="fullName" type="text" placeholder="Nguyễn Văn A" value={form.fullName}
                    onChange={e => update('fullName', e.target.value)}
                    onFocus={() => setFocused(f => ({ ...f, fullName: true }))}
                    onBlur={() => setFocused(f => ({ ...f, fullName: false }))}
                    style={getInputStyle('fullName')}
                    onMouseEnter={e => { if (!focused.fullName && !errors.fullName) e.target.style.borderColor = '#a78bfa' }}
                    onMouseLeave={e => { if (!focused.fullName && !errors.fullName) e.target.style.borderColor = errors.fullName ? '#ef4444' : '#e5e7eb' }}
                    maxLength={100}
                  />
                  {errors.fullName && <span style={ERROR_TEXT}>{errors.fullName}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Giới tính <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select name="gender" value={form.gender} onChange={e => update('gender', e.target.value)} style={INPUT_STYLE}>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Ngày sinh <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="dateOfBirth" type="date" value={form.dateOfBirth}
                    onChange={e => update('dateOfBirth', e.target.value)}
                    onFocus={() => setFocused(f => ({ ...f, dateOfBirth: true }))}
                    onBlur={() => setFocused(f => ({ ...f, dateOfBirth: false }))}
                    style={getInputStyle('dateOfBirth')}
                    onMouseEnter={e => { if (!focused.dateOfBirth && !errors.dateOfBirth) e.target.style.borderColor = '#a78bfa' }}
                    onMouseLeave={e => { if (!focused.dateOfBirth && !errors.dateOfBirth) e.target.style.borderColor = errors.dateOfBirth ? '#ef4444' : '#e5e7eb' }}
                  />
                  {errors.dateOfBirth && <span style={ERROR_TEXT}>{errors.dateOfBirth}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="phoneNumber" type="tel" placeholder="0901234567" value={form.phoneNumber}
                    onChange={e => update('phoneNumber', e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setFocused(f => ({ ...f, phoneNumber: true }))}
                    onBlur={() => setFocused(f => ({ ...f, phoneNumber: false }))}
                    style={getInputStyle('phoneNumber')}
                    onMouseEnter={e => { if (!focused.phoneNumber && !errors.phoneNumber) e.target.style.borderColor = '#a78bfa' }}
                    onMouseLeave={e => { if (!focused.phoneNumber && !errors.phoneNumber) e.target.style.borderColor = errors.phoneNumber ? '#ef4444' : '#e5e7eb' }}
                    maxLength={10}
                  />
                  {errors.phoneNumber && <span style={ERROR_TEXT}>{errors.phoneNumber}</span>}
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Địa chỉ <span style={{ color: '#ef4444' }}>*</span>
                </label>
<input
                    name="address" type="text" placeholder="123 Đường ABC, Quận XYZ, TP.HCM" value={form.address}
                    onChange={e => update('address', e.target.value)}
                    onFocus={() => setFocused(f => ({ ...f, address: true }))}
                    onBlur={() => setFocused(f => ({ ...f, address: false }))}
                    style={getInputStyle('address')}
                    onMouseEnter={e => { if (!focused.address && !errors.address) e.target.style.borderColor = '#a78bfa' }}
                    onMouseLeave={e => { if (!focused.address && !errors.address) e.target.style.borderColor = errors.address ? '#ef4444' : '#e5e7eb' }}
                    maxLength={255}
                  />
                {errors.address && <span style={ERROR_TEXT}>{errors.address}</span>}
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Số CMND / CCCD <span style={{ color: '#ef4444' }}>*</span>
                </label>
<input
                    name="identityCard" type="text" placeholder="123456789012" value={form.identityCard}
                    onChange={e => update('identityCard', e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setFocused(f => ({ ...f, identityCard: true }))}
                    onBlur={() => setFocused(f => ({ ...f, identityCard: false }))}
                    style={getInputStyle('identityCard')}
                    onMouseEnter={e => { if (!focused.identityCard && !errors.identityCard) e.target.style.borderColor = '#a78bfa' }}
                    onMouseLeave={e => { if (!focused.identityCard && !errors.identityCard) e.target.style.borderColor = errors.identityCard ? '#ef4444' : '#e5e7eb' }}
                    maxLength={12}
                  />
                {errors.identityCard && <span style={ERROR_TEXT}>{errors.identityCard}</span>}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>

            {/* Role & assignment card */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '16px', padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="#d97706" />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Phân công</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { value: 'STAFF', label: 'Nhân viên', desc: 'Quyền hạn thông thường', color: '#059669' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => update('role', opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px', borderRadius: '12px', cursor: 'pointer',
                      border: `2px solid ${form.role === opt.value ? opt.color : '#e5e7eb'}`,
                      background: form.role === opt.value ? `${opt.color}10` : '#f9fafb',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: `2px solid ${form.role === opt.value ? opt.color : '#d1d5db'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {form.role === opt.value && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: opt.color }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b', margin: 0 }}>{opt.label}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Rạp chiếu phim <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select name="cinemaId" value={form.cinemaId} onChange={e => update('cinemaId', e.target.value)} style={INPUT_STYLE}>
                  <option value="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11">Cinemate HQ</option>
                  <option value="b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22">Cinemate Q7</option>
                  <option value="c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33">Cinemate Bình Tân</option>
                  <option value="d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44">Cinemate Quận 9</option>
                  <option value="e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55">Cinemate Bình Thạnh</option>
                  <option value="f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66">Cinemate Cần Thơ</option>
                </select>
              </div>
              {isEditMode && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Trạng thái tài khoản
                  </label>
                  <select name="status" value={form.status} onChange={e => update('status', e.target.value)} style={INPUT_STYLE}>
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="LOCKED">Bị khóa (LOCKED)</option>
                    <option value="INACTIVE">Vô hiệu (INACTIVE)</option>
                  </select>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Bỏ "Vô hiệu" nếu muốn xóa mềm — khi đó nhân viên không thể đăng nhập.
                  </span>
                </div>
              )}
            </div>

            {/* Actions card */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '16px', padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: '12px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: '700', fontSize: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: isSubmitting ? 0.6 : 1,
                  background: isSubmitting ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#fff',
                  boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(124,58,237,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Đang lưu...
                  </>
                ) : (
                  <><Save size={17} /> {isEditMode ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}</>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/employees')}
                disabled={isSubmitting}
                style={{
                  width: '100%', padding: '12px', marginTop: '10px',
                  borderRadius: '12px', border: '2px solid #e5e7eb',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#fff', color: '#64748b',
                  opacity: isSubmitting ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#64748b' }}
              >
                Hủy bỏ
              </button>
            </div>

            {/* Notes card */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '16px', padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Info size={16} color="#7c3aed" />
                <h3 style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', margin: 0 }}>Lưu ý</h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  isEditMode ? 'Mật khẩu: để trống nếu giữ nguyên' : 'Mật khẩu tối thiểu 8 ký tự',
                  'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt',
                  'Tài khoản 3-28 ký tự, chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang',
                  'Tài khoản không thể thay đổi khi cập nhật',
                  'CMND 9 chữ số hoặc CCCD 12 chữ số',
                  'SĐT VN 10 chữ số, bắt đầu bằng 0',
                  'Nhân viên phải từ 18 tuổi trở lên',
                ].map((note, i) => (
                  <li key={i} style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
