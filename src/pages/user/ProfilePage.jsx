import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import Input from '../../components/common/Input'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    dayOfBirth: '',
    gender: 'Male',
    identityCard: '',
    phoneNumber: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const fileInputRef = useRef(null)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchProfile()
    }
  }, [user, navigate])

  const fetchProfile = async () => {
    try {
      const res = await userService.getMyInfo()
      const data = res.data?.result ?? res.data
      setProfile(data)
      updateUser({ image: data.image, fullName: data.fullName })
      setForm({
        username: data.username || '',
        email: data.email || '',
        password: '',
        fullName: data.fullName || '',
        dayOfBirth: data.dayOfBirth || '',
        gender: data.gender || 'Male',
        identityCard: data.identityCard || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
      })
    } catch {
      setError('Không thể tải thông tin hồ sơ.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSuccess('')
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        username: profile.username || '',
        email: profile.email || '',
        password: '',
        fullName: profile.fullName || '',
        dayOfBirth: profile.dayOfBirth || '',
        gender: profile.gender || 'Male',
        identityCard: profile.identityCard || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
      })
    }
    setIsEditing(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.password) {
      return setError('Vui lòng nhập mật khẩu để xác nhận cập nhật.')
    }

    setSaving(true)
    try {
      const res = await userService.updateMyProfile(form)
      const data = res.data?.result ?? res.data
      setProfile(data)
      updateUser({ image: data.image, fullName: data.fullName })
      setForm((f) => ({ ...f, password: '' }))
      setSuccess('Cập nhật hồ sơ thành công!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      const msg = err.response?.data?.message
      setError(msg || 'Cập nhật thất bại. Vui lòng thử lại!')
    } finally {
      setSaving(false)
    }
  }

  const handlePwdChange = (e) => {
    setPwdForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setPwdError('')
    setPwdSuccess('')
  }

  const handlePwdSubmit = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return setPwdError('Mật khẩu xác nhận mới không khớp!')
    }

    setPwdSaving(true)
    try {
      await userService.changePassword(pwdForm)
      setPwdSuccess('Đổi mật khẩu thành công!')
      setPwdForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      const msg = err.response?.data?.message
      setPwdError(msg || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại độ mạnh mật khẩu và mật khẩu hiện tại!')
    } finally {
      setPwdSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setError('')
    try {
      const res = await userService.uploadAvatar(formData)
      const data = res.data?.result ?? res.data
      setProfile(data)
      updateUser({ image: data.image })
      setSuccess('Cập nhật ảnh đại diện thành công!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      const msg = err.response?.data?.message
      setError(msg || 'Lỗi khi tải ảnh lên. Vui lòng thử lại!')
    } finally {
      setUploading(false)
      // Reset input value to allow uploading the same file again if it failed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const displayValue = (value) => value?.trim() || 'Chưa cập nhật'
  const isEmpty = (value) => !value?.trim()
  const initials = (profile?.fullName || profile?.email || 'U').charAt(0).toUpperCase()

  const selectStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-container-highest) 50%, transparent)',
    border: '1px solid rgba(255,255,255,0.10)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    color: 'var(--color-on-surface)',
  }

  const handleFocus = (e) => {
    e.target.style.border = '1px solid var(--color-primary)'
    e.target.style.boxShadow = '0 0 15px rgba(229,9,20,0.2)'
  }

  const handleBlur = (e) => {
    e.target.style.border = '1px solid rgba(255,255,255,0.10)'
    e.target.style.boxShadow = 'none'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '40px', color: 'var(--color-primary)' }}>progress_activity</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen py-10 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-6xl mx-auto px-6">

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
              Tài khoản
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-on-surface-variant)', margin: 0 }}>
              Quản lý thông tin cá nhân của bạn
            </p>
          </div>

        <div className="flex flex-wrap justify-center gap-6 w-full">

        {/* ── Profile Card (Avatar + Name + Edit Btn) ── */}
        <div
          className="rounded-xl overflow-hidden mb-5 w-full md:w-[48%]"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="px-8 py-6 flex items-center gap-5 flex-wrap"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary-container) 15%, transparent), transparent)',
            }}
          >
            {/* Avatar */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 transition-opacity ${uploading ? 'opacity-50' : 'group-hover:opacity-80'}`}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-container), #b3070f)',
                  border: '3px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 6px 30px rgba(0,0,0,0.45)',
                }}
              >
                {profile?.image ? (
                  <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '32px', color: '#fff' }}>
                    {initials}
                  </span>
                )}
              </div>

              {/* Camera Icon Overlay */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-white">photo_camera</span>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Name + Verified */}
              <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  {profile?.fullName || profile?.username || 'Chưa đặt tên'}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#22c55e', fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0 }}>
                {profile?.email}
              </p>
              {profile?.score !== undefined && profile?.score !== null && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {profile.score} điểm thành viên
                  </span>
                </div>
              )}
            </div>

            {/* Edit / Cancel+Save Buttons */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                  color: 'var(--color-on-primary-container)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 26px rgba(0,0,0,0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                Chỉnh sửa
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="py-2 px-4 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'var(--color-on-surface-variant)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-error-container) 40%, transparent)',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {error}
          </div>
        )}

        {success && (
          <div
            className="px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5"
            style={{
              backgroundColor: 'rgba(34,197,94,0.1)',
              border: '1px solid #22c55e',
              color: '#22c55e',
              animation: 'fadeInScale 0.3s ease-out',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            {success}
          </div>
        )}

        {/* ── Personal Information Card ── */}
        <div
          className="rounded-xl overflow-hidden mb-5 w-full md:w-[48%]"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
              Thông tin cá nhân
            </h2>
          </div>

          <form className="px-8 py-6" onSubmit={handleSubmit}>
            {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <Input label="Tài khoản *" name="username" value={form.username} onChange={handleChange} required />
                <Input label="Email (Không thể thay đổi)" name="email" type="email" value={form.email} onChange={handleChange} disabled required />
                <Input label="Họ và tên (Không thể thay đổi)" name="fullName" value={form.fullName} onChange={handleChange} disabled required />
                <Input label="Ngày sinh *" name="dayOfBirth" type="date" value={form.dayOfBirth} onChange={handleChange} required />

                <div className="flex flex-col gap-2">
                  <label className="uppercase font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--color-on-surface)' }}>
                    Giới tính (Không thể thay đổi)
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    disabled
                    className="w-full rounded-lg px-4 py-3 transition-all outline-none appearance-none cursor-pointer opacity-60"
                    style={selectStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  >
                    <option value="Male" style={{ background: 'var(--color-surface-container-highest)' }}>Nam</option>
                    <option value="Female" style={{ background: 'var(--color-surface-container-highest)' }}>Nữ</option>
                    <option value="Other" style={{ background: 'var(--color-surface-container-highest)' }}>Khác</option>
                  </select>
                </div>

                <Input label="Số điện thoại *" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
                <Input label="CMND / CCCD (Không thể thay đổi)" name="identityCard" value={form.identityCard} onChange={handleChange} disabled required />

                <div className="md:col-span-2">
                  <Input label="Địa chỉ *" name="address" value={form.address} onChange={handleChange} required />
                </div>

                {/* Password confirmation */}
                <div className="md:col-span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '8px' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)', marginTop: '2px' }}>info</span>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
                      Nhập mật khẩu hiện tại để xác nhận. Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                    </p>
                  </div>
                  <Input label="Mật khẩu xác nhận *" name="password" type="password" placeholder="Nhập mật khẩu hiện tại" value={form.password} onChange={handleChange} required />
                </div>

                {/* Save Button */}
                <div className="md:col-span-2 mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2.5 px-6 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: 'var(--color-on-surface-variant)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                      color: 'var(--color-on-primary-container)',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 4px 14px rgba(229,9,20,0.4)',
                    }}
                    onMouseEnter={(e) => { if (!saving) e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.6)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.4)' }}
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { label: 'Tài khoản', value: profile?.username, icon: 'person' },
                  { label: 'Email', value: profile?.email, icon: 'mail' },
                  { label: 'Họ và tên', value: profile?.fullName, icon: 'badge' },
                  { label: 'Ngày sinh', value: profile?.dayOfBirth, icon: 'cake' },
                  { label: 'Giới tính', value: profile?.gender === 'Male' ? 'Nam' : profile?.gender === 'Female' ? 'Nữ' : profile?.gender === 'Other' ? 'Khác' : profile?.gender, icon: 'wc' },
                  { label: 'Số điện thoại', value: profile?.phoneNumber, icon: 'call' },
                  { label: 'CMND / CCCD', value: profile?.identityCard, icon: 'id_card' },
                  { label: 'Địa chỉ', value: profile?.address, icon: 'location_on' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined mt-0.5"
                      style={{ fontSize: '20px', color: 'var(--color-primary)', opacity: 0.7 }}
                    >{icon}</span>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                        {label}
                      </p>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px',
                        margin: 0,
                        color: isEmpty(value) ? 'var(--color-on-surface-variant)' : 'var(--color-on-surface)',
                        fontStyle: isEmpty(value) ? 'italic' : 'normal',
                      }}>
                        {displayValue(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* ── Account Details Card ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
              Thông tin tài khoản
            </h2>
          </div>
          <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '20px', color: 'var(--color-primary)', opacity: 0.7 }}>shield</span>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                  Vai trò
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {(profile?.roles || []).map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: role === 'ADMIN' ? 'rgba(229,9,20,0.15)' : 'rgba(34,197,94,0.15)',
                        color: role === 'ADMIN' ? 'var(--color-primary)' : '#22c55e',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {role === 'ADMIN' ? 'Quản trị viên' : role === 'MEMBER' ? 'Thành viên' : role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '20px', color: 'var(--color-primary)', opacity: 0.7 }}>toggle_on</span>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                  Trạng thái
                </p>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: profile?.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(229,9,20,0.15)',
                    color: profile?.status === 'ACTIVE' ? '#22c55e' : 'var(--color-primary)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {profile?.status === 'ACTIVE' ? 'Đang hoạt động' : profile?.status}
                </span>
              </div>
            </div>

            {profile?.createdAt && (
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '20px', color: 'var(--color-primary)', opacity: 0.7 }}>calendar_today</span>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                    Ngày tạo tài khoản
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--color-on-surface)', margin: 0 }}>
                    {new Date(profile.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            {profile?.score !== undefined && profile?.score !== null && (
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '20px', color: 'var(--color-primary)', opacity: 0.7, fontVariationSettings: "'FILL' 1" }}>star</span>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                    Điểm thành viên
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--color-primary)', margin: 0, fontWeight: 700 }}>
                    {profile.score}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Change Password Card ── */}
        <div
          className="rounded-xl overflow-hidden mt-5"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
              Đổi mật khẩu
            </h2>
          </div>
          
          <form className="px-8 py-6 space-y-4" onSubmit={handlePwdSubmit}>
            {pwdError && (
              <div
                className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-error-container) 40%, transparent)',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-error)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div
                className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                style={{
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  border: '1px solid #22c55e',
                  color: '#22c55e',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                {pwdSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Mật khẩu hiện tại *"
                name="currentPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={pwdForm.currentPassword}
                onChange={handlePwdChange}
                required
              />
              <Input
                label="Mật khẩu mới *"
                name="newPassword"
                type="password"
                placeholder="Tối thiểu 8 kí tự, hoa, thường, số, ký tự đặc biệt"
                value={pwdForm.newPassword}
                onChange={handlePwdChange}
                required
              />
              <Input
                label="Xác nhận mật khẩu mới *"
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={pwdForm.confirmPassword}
                onChange={handlePwdChange}
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwdSaving}
                className="py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                  color: 'var(--color-on-primary-container)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 4px 14px rgba(229,9,20,0.3)',
                }}
                onMouseEnter={(e) => { if (!pwdSaving) e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.3)' }}
              >
                {pwdSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                    Đang thay đổi...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>key</span>
                    Cập nhật mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  )
}
