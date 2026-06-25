import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memberService } from '../../../services/memberService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, Plus, User, Mail, Phone, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react'

export default function MemberFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [dayOfBirth, setDayOfBirth] = useState('')
  const [gender, setGender] = useState('MALE')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      memberService.getById(id)
        .then(res => {
          const member = res.data?.result || res.data
          if (member) {
            setUsername(member.username || '')
            setEmail(member.email || '')
            setFullName(member.fullName || '')
            setDayOfBirth(member.dayOfBirth || '')
            setGender(member.gender ? member.gender.toUpperCase() : 'MALE')
            setPhoneNumber(member.phoneNumber || '')
          }
        })
        .catch(err => {
          console.error('Failed to load member', err)
          setToast({ message: 'Không thể tải thông tin thành viên', type: 'danger' })
        })
    }
  }, [id, isEditMode])

  const validateForm = () => {
    const tempErrors = {}
    if (!username.trim()) tempErrors.username = 'Tài khoản không được để trống'
    if (!email.trim()) tempErrors.email = 'Email không được để trống'
    if (!/^\S+@\S+\.\S+$/.test(email)) tempErrors.email = 'Email không hợp lệ'
    if (!fullName.trim()) tempErrors.fullName = 'Họ tên không được để trống'
    if (!dayOfBirth) tempErrors.dayOfBirth = 'Ngày sinh không được để trống'
    if (!phoneNumber.trim()) tempErrors.phoneNumber = 'Số điện thoại không được để trống'
    if (!isEditMode) {
      if (!password) tempErrors.password = 'Mật khẩu không được để trống'
      else if (password.length < 8) tempErrors.password = 'Mật khẩu tối thiểu 8 ký tự'
      if (password !== confirmPassword) tempErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    } else if (password && password.length < 8) {
      tempErrors.password = 'Mật khẩu tối thiểu 8 ký tự'
    }
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setToast({ message: 'Vui lòng kiểm tra lại thông tin.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    const memberData = {
      username: username.trim(),
      email: email.trim(),
      fullName: fullName.trim(),
      dayOfBirth,
      gender: gender,
      phoneNumber: phoneNumber.trim(),
    }

    if (password) {
      memberData.password = password
      memberData.confirmPassword = confirmPassword
    }

    try {
      if (isEditMode) {
        await memberService.update(id, memberData)
        setToast({ message: 'Cập nhật thành viên thành công!', type: 'success' })
      } else {
        await memberService.register(memberData)
        setToast({ message: 'Thêm thành viên mới thành công!', type: 'success' })
      }
      setTimeout(() => {
        navigate('/admin/members')
      }, 1500)
    } catch (err) {
      console.error('Failed to save member', err)
      const serverMsg = err.response?.data?.message || err.message || 'Lỗi hệ thống'
      setToast({ message: `Không thể lưu: ${serverMsg}`, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin/members')
  }

  return (
    <div className="space-y-6 text-[#e2e2e2] text-left relative pb-12">
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
          {toast.type === 'success' ? <CheckCircle className="shrink-0" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider mb-2.5 transition-colors bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Thành viên</span>
          </button>
          <h1 className="text-4xl text-white font-black tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Cập nhật thành viên' : 'Thêm thành viên mới'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin tài khoản thành viên.' : 'Tạo tài khoản thành viên mới.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3" style={{ fontFamily: 'Montserrat' }}>
              <User className="text-red-500" size={18} />
              Thông tin tài khoản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tài khoản *"
                placeholder="Ví dụ: member001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
              />
              <Input
                label="Email *"
                type="email"
                placeholder="member@example.com"
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
                placeholder="Ví dụ: Nguyễn Văn B"
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
                value={dayOfBirth}
                onChange={(e) => setDayOfBirth(e.target.value)}
                error={errors.dayOfBirth}
              />
              <Input
                label="Số điện thoại *"
                placeholder="Ví dụ: 0912345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={errors.phoneNumber}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <Button type="submit" disabled={isSubmitting} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
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
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleCancel} className="w-full py-3.5 uppercase tracking-wider font-extrabold">
              Hủy bỏ
            </Button>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3 shadow-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3" style={{ fontFamily: 'Montserrat' }}>
              <CheckCircle className="text-green-500" size={16} />
              Lưu ý
            </h4>
            <ul className="text-xs text-gray-400 space-y-2">
              <li>• Tài khoản và email phải là duy nhất</li>
              <li>• Mật khẩu tối thiểu 8 ký tự</li>
              <li>• Thành viên sẽ được gán quyền MEMBER</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
