import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { employeeService } from '../../../services/employeeService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, Upload, User, Mail, Phone, Calendar, Shield } from 'lucide-react'

export default function EmployeeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const isEditMode = !!id

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('MALE')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [identityCard, setIdentityCard] = useState('')
  const [salary, setSalary] = useState('8000000')
  const [cinemaId, setCinemaId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
  const [role, setRole] = useState('STAFF')
  const [status, setStatus] = useState('ACTIVE')

  // UI feedback states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)

  const validateForm = () => {
    const tempErrors = {}
    if (!username.trim()) tempErrors.username = 'Tài khoản không được để trống'
    if (!email.trim()) tempErrors.email = 'Email không được để trống'
    if (!/^\S+@\S+\.\S+$/.test(email)) tempErrors.email = 'Email không hợp lệ'
    if (!fullName.trim()) tempErrors.fullName = 'Họ tên không được để trống'
    if (!dateOfBirth) tempErrors.dateOfBirth = 'Ngày sinh không được để trống'
    if (!phoneNumber.trim()) tempErrors.phoneNumber = 'Số điện thoại không được để trống'
    if (!address.trim()) tempErrors.address = 'Địa chỉ không được để trống'
    if (!identityCard.trim()) tempErrors.identityCard = 'CMND/CCCD không được để trống'
    if (!salary || Number(salary) <= 0) tempErrors.salary = 'Lương phải lớn hơn 0'
    if (!cinemaId) tempErrors.cinemaId = 'Vui lòng chọn rạp chiếu phim'

    if (!isEditMode) {
      if (!password) {
        tempErrors.password = 'Mật khẩu không được để trống'
      } else if (password.length < 8) {
        tempErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
      }
      if (password !== confirmPassword) {
        tempErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
      }
    } else if (password && password.length < 8) {
      tempErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setToast({ message: 'Vui lòng kiểm tra lại các thông tin nhập liệu.', type: 'danger' })
      return
    }

    setIsSubmitting(true)

    const employeeData = {
      username: username.trim(),
      email: email.trim(),
      fullName: fullName.trim(),
      dayOfBirth: dateOfBirth,
      gender: gender,
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      identityCard: identityCard.trim(),
      salary: Number(salary),
      cinemaId: cinemaId,
      role: role,
    }

    if (password) {
      employeeData.password = password
      employeeData.confirmPassword = confirmPassword
    }

    if (isEditMode) {
      employeeData.status = status
    }

    try {
      if (isEditMode) {
        await employeeService.update(id, employeeData)
        setToast({ message: 'Cập nhật nhân viên thành công!', type: 'success' })
      } else {
        await employeeService.create(employeeData)
        setToast({ message: 'Thêm nhân viên mới thành công!', type: 'success' })
      }
      setTimeout(() => {
        navigate('/admin/employees')
      }, 1500)
    } catch (err) {
      console.error('Failed to save employee', err)
      const serverMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
      setToast({ message: `Không thể lưu: ${serverMsg}`, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (isEditMode) {
      employeeService.getById(id)
        .then(res => {
          const employee = res.data?.result || res.data
          if (employee) {
            setUsername(employee.username || '')
            setEmail(employee.email || '')
            setFullName(employee.fullName || '')
            setDateOfBirth(employee.dateOfBirth || employee.dayOfBirth || '')
            setGender(employee.gender ? employee.gender.toUpperCase() : 'MALE')
            setPhoneNumber(employee.phoneNumber || '')
            setAddress(employee.address || '')
            setIdentityCard(employee.identityCard || '')
            setSalary(employee.salary ? String(employee.salary) : '')
            setCinemaId(employee.cinemaId || '')
            setRole(employee.roles && employee.roles.includes('MANAGER') ? 'MANAGER' : 'STAFF')
            setStatus(employee.status || 'ACTIVE')
          }
        })
        .catch(err => {
          console.error('Failed to load employee', err)
          setToast({ message: 'Không thể tải thông tin nhân viên', type: 'danger' })
        })
    }
  }, [id, isEditMode])

  const handleCancel = () => {
    navigate('/admin/employees')
  }

  return (
    <div className="space-y-6 text-[#e2e2e2] text-left relative pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-md transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#10b981' : '#ef4444',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'success' ? (
            <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Nhân viên</span>
          </button>
          <h1
            className="text-4xl text-white font-black tracking-wider uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isEditMode ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isEditMode
              ? 'Chỉnh sửa thông tin tài khoản nhân viên.'
              : 'Tạo tài khoản nhân viên mới với thông tin cá nhân và quyền truy cập hệ thống.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info inputs (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <User className="text-red-500" size={18} />
              Thông tin tài khoản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tài khoản *"
                placeholder="Ví dụ: nv001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
              />
              <Input
                label="Email *"
                type="email"
                placeholder="nv001@cinemate.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
            </div>

            {!isEditMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Mật khẩu *"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
                <Input
                  label="Xác nhận mật khẩu *"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Họ tên *"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
              />
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Giới tính *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ngày sinh *"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                error={errors.dateOfBirth}
              />
              <Input
                label="Số điện thoại *"
                placeholder="Ví dụ: 0901234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={errors.phoneNumber}
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Địa chỉ *"
                placeholder="Ví dụ: 123 Đường ABC, Quận XYZ, TP.HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                error={errors.address}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Số CMND / CCCD *"
                placeholder="Nhập số CMND hoặc CCCD"
                value={identityCard}
                onChange={(e) => setIdentityCard(e.target.value)}
                error={errors.identityCard}
              />
              <Input
                label="Mức lương (VNĐ) *"
                type="number"
                placeholder="Ví dụ: 8000000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                error={errors.salary}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Rạp chiếu phim *</label>
                <select
                  value={cinemaId}
                  onChange={(e) => setCinemaId(e.target.value)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                >
                  <option value="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11">Cinemate HQ</option>
                  <option value="b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22">Cinemate Q7</option>
                  <option value="c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33">Cinemate Bình Tân</option>
                  <option value="d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44">Cinemate Quận 9</option>
                  <option value="e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55">Cinemate Bình Thạnh</option>
                  <option value="f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66">Cinemate Cần Thơ</option>
                </select>
                {errors.cinemaId && <span className="text-xs text-red-400 mt-1">{errors.cinemaId}</span>}
              </div>

              {isEditMode && (
                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Trạng thái tài khoản *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full cursor-pointer"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="LOCKED">Bị khóa (LOCKED)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Panel (Right Column) */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 uppercase tracking-wider font-extrabold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Đang lưu...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 justify-center">
                  <Plus size={16} /> {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={handleCancel}
              className="w-full py-3.5 uppercase tracking-wider font-extrabold"
            >
              Hủy bỏ
            </Button>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3" style={{ fontFamily: 'Montserrat' }}>
              <Shield className="text-red-500" size={16} />
              Lưu ý
            </h4>
            <ul className="text-xs text-gray-400 space-y-2">
              <li>• Mật khẩu tối thiểu 8 ký tự</li>
              <li>• Tài khoản phải là duy nhất</li>
              <li>• Email phải đúng định dạng</li>
              <li>• Nhân viên sẽ được gán quyền STAFF mặc định</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
