import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import Input from '../../components/common/Input'

const MOCK_BOOKINGS = [
  {
    id: 'BK99502',
    movieName: 'Backrooms: Vùng Ngoài Tầm Kiểm Soát',
    bookingDate: '2026-06-16T08:00:00Z',
    showDate: '2026-06-22',
    showTime: '20:00',
    room: 'Phòng chiếu 04 (IMAX 3D)',
    seats: ['F10', 'F11'],
    totalPrice: 280000,
    status: 'COMPLETED',
  },
  {
    id: 'BK92384',
    movieName: 'Spider-man: Brand New Day',
    bookingDate: '2026-06-15T12:30:00Z',
    showDate: '2026-06-15',
    showTime: '19:30',
    room: 'Phòng chiếu 03 (IMAX)',
    seats: ['C4', 'C5'],
    totalPrice: 220000,
    status: 'COMPLETED',
  },
  {
    id: 'BK91048',
    movieName: 'Lớp Học Ám Sát: Giờ Của Chúng Ta',
    bookingDate: '2026-06-13T10:15:00Z',
    showDate: '2026-06-13',
    showTime: '15:00',
    room: 'Phòng chiếu 01 (2D)',
    seats: ['B5', 'B6'],
    totalPrice: 180000,
    status: 'COMPLETED',
  },
  {
    id: 'BK88402',
    movieName: 'Kumanthong Ác Quỷ Dẫn Đường',
    bookingDate: '2026-06-08T14:00:00Z',
    showDate: '2026-06-08',
    showTime: '21:45',
    room: 'Phòng chiếu 02 (2D)',
    seats: ['E1'],
    totalPrice: 130000,
    status: 'COMPLETED',
  }
]

const MOCK_POINT_HISTORY = [
  {
    id: 'TX1004',
    type: 'EARN',
    amount: 22,
    movieName: 'Spider-man: Brand New Day',
    date: '2026-06-15T12:30:00Z',
  },
  {
    id: 'TX1003',
    type: 'SPEND',
    amount: 50,
    movieName: 'Sweet Combo (Bắp nước)',
    date: '2026-06-14T09:15:00Z',
  },
  {
    id: 'TX1002',
    type: 'EARN',
    amount: 18,
    movieName: 'Lớp Học Ám Sát: Giờ Của Chúng Ta',
    date: '2026-06-13T10:15:00Z',
  },
  {
    id: 'TX1001',
    type: 'EARN',
    amount: 13,
    movieName: 'Kumanthong Ác Quỷ Dẫn Đường',
    date: '2026-06-08T14:00:00Z',
  },
  {
    id: 'TX1005',
    type: 'SPEND',
    amount: 100,
    movieName: 'Vé 2D Doraemon: Bản Tình Ca Đất Nước',
    date: '2026-06-05T16:45:00Z',
  },
  {
    id: 'TX1006',
    type: 'EARN',
    amount: 25,
    movieName: 'Lật Mặt 7: Một Điều Ước',
    date: '2026-05-28T19:00:00Z',
  },
  {
    id: 'TX1007',
    type: 'SPEND',
    amount: 40,
    movieName: 'Bắp ngọt vừa (M)',
    date: '2026-05-25T11:30:00Z',
  }
]

const getMembershipTier = (score) => {
  if (score >= 300) {
    return {
      name: 'Kim Cương',
      color: '#c084fc',
      gradient: 'linear-gradient(135deg, #4c1d95, #6d28d9, #7c3aed, #4c1d95)',
      textColor: 'text-purple-300',
      nextTier: null,
      pointsToNext: 0,
      benefit: 'Tích lũy thêm 10% điểm thưởng khi đặt vé. Tặng 1 vé 2D + Combo sinh nhật miễn phí vào tháng sinh nhật.'
    }
  } else if (score >= 100) {
    return {
      name: 'Vàng',
      color: '#facc15',
      gradient: 'linear-gradient(135deg, #854d0e, #a16207, #ca8a04, #854d0e)',
      textColor: 'text-yellow-300',
      nextTier: 'Kim Cương',
      pointsToNext: 300 - score,
      benefit: 'Tích lũy thêm 5% điểm thưởng khi đặt vé. Nhận các ưu đãi đặc quyền đổi quà VIP.'
    }
  } else {
    return {
      name: 'Bạc',
      color: '#cbd5e1',
      gradient: 'linear-gradient(135deg, #374151, #1f2937, #111827, #374151)',
      textColor: 'text-gray-300',
      nextTier: 'Vàng',
      pointsToNext: 100 - score,
      benefit: 'Tích lũy 1 điểm thành viên cho mỗi 10.000 VND chi tiêu tại rạp.'
    }
  }
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'info')
  const [bookings, setBookings] = useState(MOCK_BOOKINGS)

  const [fromDateStr, setFromDateStr] = useState('01/05/2026')
  const [toDateStr, setToDateStr] = useState('30/06/2026')
  const [scoreFilterType, setScoreFilterType] = useState('EARN') // 'EARN' = Adding, 'SPEND' = Using
  const [filteredScoreHistory, setFilteredScoreHistory] = useState([])
  const [scoreFilterError, setScoreFilterError] = useState('')
  const [hasViewedScore, setHasViewedScore] = useState(false)

  // Helper to parse DD/MM/YYYY to Date object
  const parseDateDMY = (str) => {
    if (!str) return null
    const parts = str.trim().split('/')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    const date = new Date(year, month, day)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null
    }
    return date
  }

  const handleViewScore = (e) => {
    if (e) e.preventDefault()
    setScoreFilterError('')
    setHasViewedScore(true)

    if (!fromDateStr.trim() || !toDateStr.trim()) {
      setScoreFilterError('Vui lòng nhập đầy đủ Từ ngày và Đến ngày.')
      setFilteredScoreHistory([])
      return
    }

    const fromDate = parseDateDMY(fromDateStr)
    const toDate = parseDateDMY(toDateStr)

    if (!fromDate) {
      setScoreFilterError('Từ ngày không hợp lệ. Định dạng yêu cầu: DD/MM/YYYY (ví dụ: 01/05/2026).')
      setFilteredScoreHistory([])
      return
    }

    if (!toDate) {
      setScoreFilterError('Đến ngày không hợp lệ. Định dạng yêu cầu: DD/MM/YYYY (ví dụ: 30/06/2026).')
      setFilteredScoreHistory([])
      return
    }

    if (fromDate > toDate) {
      setScoreFilterError('Từ ngày không được sau Đến ngày.')
      setFilteredScoreHistory([])
      return
    }

    const toDateEnd = new Date(toDate)
    toDateEnd.setHours(23, 59, 59, 999)

    const results = MOCK_POINT_HISTORY.filter(item => {
      const matchType = item.type === scoreFilterType
      const itemDate = new Date(item.date)
      return matchType && itemDate >= fromDate && itemDate <= toDateEnd
    })

    setFilteredScoreHistory(results)
  }

  // Load initial score history when switching to 'history' tab
  useEffect(() => {
    if (activeTab === 'history') {
      const fromDate = parseDateDMY(fromDateStr)
      const toDate = parseDateDMY(toDateStr)
      if (fromDate && toDate && fromDate <= toDate) {
        const toDateEnd = new Date(toDate)
        toDateEnd.setHours(23, 59, 59, 999)
        const results = MOCK_POINT_HISTORY.filter(item => {
          return item.type === scoreFilterType && new Date(item.date) >= fromDate && new Date(item.date) <= toDateEnd
        })
        Promise.resolve().then(() => {
          setFilteredScoreHistory(results)
          setHasViewedScore(true)
        })
      }
    }
  }, [activeTab, fromDateStr, toDateStr, scoreFilterType])


  const handleCancelTicket = (ticketId) => {
    const confirmCancel = window.confirm(`Bạn có chắc chắn muốn hủy vé ${ticketId} không? Hoạt động này không thể hoàn tác.`);
    if (!confirmCancel) return;

    setBookings(prevBookings => 
      prevBookings.map(b => 
        b.id === ticketId ? { ...b, status: 'CANCELED' } : b
      )
    );
    
    setSuccess(`Hủy vé ${ticketId} thành công!`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    dayOfBirth: '',
    gender: 'MALE',
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

  const fetchProfile = useCallback(async () => {
    try {
      const res = await userService.getMyInfo()
      const data = res.data?.result ?? res.data
      setProfile(data)
      updateUser({ image: data.image, fullName: data.fullName })
      setForm({
        username: data.username || '',
        email: data.email || '',
        fullName: data.fullName || '',
        dayOfBirth: data.dayOfBirth || '',
        gender: data.gender ? data.gender.toUpperCase() : 'MALE',
        identityCard: data.identityCard || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
      })
    } catch {
      setError('Không thể tải thông tin hồ sơ.')
    } finally {
      setLoading(false)
    }
  }, [updateUser])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchProfile()
    }
  }, [user, navigate, fetchProfile])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSuccess('')
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        username: profile.username || '',
        email: profile.email || '',
        fullName: profile.fullName || '',
        dayOfBirth: profile.dayOfBirth || '',
        gender: profile.gender ? profile.gender.toUpperCase() : 'MALE',
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

    setSaving(true)
    try {
      const payload = {
        username: form.username || profile?.username || '',
        email: form.email || profile?.email || '',
        fullName: form.fullName || profile?.fullName || '',
        dayOfBirth: form.dayOfBirth || profile?.dayOfBirth || null,
        gender: form.gender || profile?.gender || '',
        identityCard: form.identityCard || profile?.identityCard || '',
        phoneNumber: form.phoneNumber || profile?.phoneNumber || '',
        address: form.address || profile?.address || '',
      }

      const res = await userService.updateMyProfile(payload)
      const data = res.data?.result ?? res.data
      setProfile(data)
      updateUser({ image: data.image, fullName: data.fullName })
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

    if (pwdForm.newPassword.length < 8) {
      return setPwdError('Mật khẩu mới phải có ít nhất 8 ký tự!')
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return setPwdError('Mật khẩu xác nhận mới không khớp!')
    }

    setPwdSaving(true)
    try {
      await userService.changePassword(pwdForm)
      setPwdSuccess('Đổi mật khẩu thành công!')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
      setPwdError(errMsg || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại độ mạnh mật khẩu và mật khẩu hiện tại!')
    } finally {
      setPwdSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

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

        {/* ── Page Header ── */}
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
        </div>
        {/* ── End Page Header ── */}

        {/* ── Alerts (toàn cục) ── */}
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

        {/* ── Card Grid ── */}
        <div className="flex flex-wrap gap-6">

          {/* ── Profile Card (Avatar + Name + Edit Btn) ── */}
          <div
            className="rounded-xl overflow-hidden w-full"
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
                  <button
                    onClick={() => setActiveTab('history')}
                    className="flex items-center gap-1 mt-1.5 cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0 text-left align-middle group outline-none"
                  >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform duration-200" style={{ fontSize: '16px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
                      {profile.score} điểm thành viên
                    </span>
                  </button>
                )}
              </div>

              {/* Edit / Cancel Buttons */}
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
              )}
            </div>
          </div>
          {/* ── End Profile Card ── */}

          {/* ── Tab Selector ── */}
          <div className="w-full flex gap-6 mb-2 border-b border-white/10 pb-px overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 text-sm font-bold tracking-wider uppercase transition-all border-b-2 px-1 cursor-pointer shrink-0 ${
                activeTab === 'info' 
                  ? 'border-red-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Thông tin tài khoản
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-bold tracking-wider uppercase transition-all border-b-2 px-1 cursor-pointer shrink-0 ${
                activeTab === 'history' 
                  ? 'border-red-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Lịch sử (History)
            </button>
            <button
              onClick={() => setActiveTab('booked')}
              className={`pb-3 text-sm font-bold tracking-wider uppercase transition-all border-b-2 px-1 cursor-pointer shrink-0 ${
                activeTab === 'booked' 
                  ? 'border-red-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Vé đã đặt (Booked)
            </button>
            <button
              onClick={() => setActiveTab('canceled')}
              className={`pb-3 text-sm font-bold tracking-wider uppercase transition-all border-b-2 px-1 cursor-pointer shrink-0 ${
                activeTab === 'canceled' 
                  ? 'border-red-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Vé đã hủy (Canceled)
            </button>
          </div>

          {activeTab === 'info' && (
            <>
              {/* ── Personal Information Card ── */}
              <div
            className="rounded-xl overflow-hidden w-full md:w-[calc(50%-12px)]"
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
                      <option value="MALE" style={{ background: 'var(--color-surface-container-highest)' }}>Nam</option>
                      <option value="FEMALE" style={{ background: 'var(--color-surface-container-highest)' }}>Nữ</option>
                      <option value="OTHER" style={{ background: 'var(--color-surface-container-highest)' }}>Khác</option>
                    </select>
                  </div>

                  <Input label="Số điện thoại *" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
                  <Input 
                    label={profile?.identityCard ? "CMND / CCCD (Không thể thay đổi)" : "CMND / CCCD *"} 
                    name="identityCard" 
                    value={form.identityCard} 
                    onChange={handleChange} 
                    disabled={!!profile?.identityCard} 
                    required 
                  />

                  <div className="md:col-span-2">
                    <Input label="Địa chỉ *" name="address" value={form.address} onChange={handleChange} required />
                  </div>

                  {/* Password confirmation removed */}

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
                    { label: 'Giới tính', value: profile?.gender?.toUpperCase() === 'MALE' ? 'Nam' : profile?.gender?.toUpperCase() === 'FEMALE' ? 'Nữ' : profile?.gender?.toUpperCase() === 'OTHER' ? 'Khác' : profile?.gender, icon: 'wc' },
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
          {/* ── End Personal Information Card ── */}

          {/* ── Account Details Card ── */}
          <div
            className="rounded-xl overflow-hidden w-full md:w-[calc(50%-12px)]"
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
          {/* ── End Account Details Card ── */}

          {/* ── Change Password Card ── */}
          <div
            className="rounded-xl overflow-hidden w-full"
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
                  minLength={8}
                  required
                />
                <Input
                  label="Xác nhận mật khẩu mới *"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={pwdForm.confirmPassword}
                  onChange={handlePwdChange}
                  minLength={8}
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
          {/* ── End Change Password Card ── */}
            </>
          )}

          {/* ── Tab History (Lịch sử đặt vé chung) ── */}
          {activeTab === 'history' && (() => {
            const score = profile?.score ?? 0
            const tier = getMembershipTier(score)
            const progressPercent = score >= 300 
              ? 100 
              : score >= 100 
                ? ((score - 100) / 200) * 100 
                : (score / 100) * 100

            return (
              <div className="w-full flex flex-col lg:flex-row gap-8 animate-fade-in-up">
                {/* Left Column: Membership Card & Rules */}
                <div className="w-full lg:w-5/12 flex flex-col gap-6">
                  {/* Membership Card */}
                  <div 
                    className="relative rounded-2xl p-6 overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between aspect-[1.586/1] w-full max-w-[420px] mx-auto select-none group"
                    style={{ 
                      background: tier.gradient,
                      boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)'
                    }}
                  >
                    <div className="flex justify-between items-start text-white">
                      <div className="flex flex-col">
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '20px', letterSpacing: '1px' }}>
                          <span className="text-white">Cine</span><span className="text-red-500">Mate</span>
                        </span>
                        <span className="text-[10px] text-white/60 font-semibold tracking-widest uppercase mt-0.5">Membership Card</span>
                      </div>
                      <span className="material-symbols-outlined text-4xl text-white/30 font-light">contactless</span>
                    </div>

                    <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300/80 via-yellow-500/80 to-amber-700/80 border border-yellow-200/20 relative overflow-hidden mt-4">
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 border border-black/20">
                        {Array.from({length: 9}).map((_, i) => (
                          <div key={i} className="border-t border-l border-black/30"></div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between items-end text-white">
                      <div>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Tên thành viên</p>
                        <p className="font-bold tracking-wide mt-0.5 truncate max-w-[200px]" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '15px' }}>
                          {profile?.fullName || profile?.username || 'Chưa đặt tên'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Hạng thẻ</p>
                        <p className="font-extrabold tracking-widest mt-0.5 uppercase" style={{ color: tier.color, textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontSize: '15px' }}>
                          {tier.name}
                        </p>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none"></div>
                  </div>

                  {/* Points Progress */}
                  <div 
                    className="p-5 rounded-xl border border-white/5 flex flex-col gap-4 text-white"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">Hạng hiện tại:</span>
                      <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10" style={{ color: tier.color }}>
                        {tier.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">Điểm tích lũy:</span>
                      <span className="font-bold text-white text-base">{score} điểm</span>
                    </div>

                    {tier.nextTier ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Tiến trình lên hạng <strong>{tier.nextTier}</strong></span>
                          <span>Còn <strong>{tier.pointsToNext}</strong> điểm</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ 
                              width: `${progressPercent}%`,
                              background: 'linear-gradient(to right, var(--color-primary), #f87171)'
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-green-400 font-bold bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-sm">workspace_premium</span>
                        Chúc mừng! Bạn đã đạt hạng thẻ cao nhất (KIM CƯƠNG)
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-3 mt-1 text-xs text-gray-400 leading-relaxed text-left">
                      <span className="font-semibold text-white block mb-1">Quyền lợi của bạn:</span>
                      {tier.benefit}
                    </div>
                  </div>

                  {/* Rules Card */}
                  <div 
                    className="p-5 rounded-xl border border-white/5 flex flex-col gap-4 text-white text-left"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                  >
                    <h3 className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Quy tắc tích lũy & Đổi quà
                    </h3>
                    <div className="flex flex-col gap-4 text-xs text-gray-400">
                      <div className="space-y-1.5">
                        <h4 className="text-white font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-[#F3EA28]">payments</span>
                          Cách tích điểm
                        </h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Mỗi <strong>10.000 VND</strong> chi tiêu mua vé hoặc bắp nước tích <strong>1 điểm</strong>.</li>
                          <li>Không áp dụng tích điểm khi thanh toán bằng voucher hoặc điểm thưởng.</li>
                          <li>Điểm thành viên có giá trị sử dụng trong vòng 1 năm kể từ ngày tích lũy.</li>
                        </ul>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-white font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-[#F3EA28]">featured_play_list</span>
                          Bảng đổi quà
                        </h4>
                        <div className="bg-white/5 border border-white/5 rounded-lg overflow-hidden">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="border-b border-white/5 bg-white/5 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                                <th className="p-2">Quà tặng</th>
                                <th className="p-2 text-right">Điểm đổi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              <tr>
                                <td className="p-2">1 Nước ngọt lớn (L)</td>
                                <td className="p-2 text-right font-mono font-bold text-[#F3EA28]">30 pts</td>
                              </tr>
                              <tr>
                                <td className="p-2">1 Bắp ngọt vừa (M)</td>
                                <td className="p-2 text-right font-mono font-bold text-[#F3EA28]">40 pts</td>
                              </tr>
                              <tr>
                                <td className="p-2">1 Combo ngọt (1 Bắp M + 1 Nước L)</td>
                                <td className="p-2 text-right font-mono font-bold text-[#F3EA28]">60 pts</td>
                              </tr>
                              <tr>
                                <td className="p-2">1 Vé xem phim 2D miễn phí</td>
                                <td className="p-2 text-right font-mono font-bold text-[#F3EA28]">100 pts</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Score History Filter and Table */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Filters Card */}
                  <div 
                    className="p-6 rounded-xl border border-white/5 flex flex-col gap-5 text-white"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                  >
                    <h3 className="text-base font-bold text-white tracking-wide text-left" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Bộ lọc lịch sử điểm thành viên
                    </h3>

                    {scoreFilterError && (
                      <div className="p-3 text-xs rounded border bg-red-500/15 border-red-500/20 text-red-400 flex items-center gap-2 text-left">
                        <span className="material-symbols-outlined text-base">error</span>
                        {scoreFilterError}
                      </div>
                    )}

                    <form onSubmit={handleViewScore} className="space-y-4">
                      {/* Date Range Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Từ ngày (DD/MM/YYYY)
                          </label>
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={fromDateStr}
                            onChange={(e) => setFromDateStr(e.target.value)}
                            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Đến ngày (DD/MM/YYYY)
                          </label>
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={toDateStr}
                            onChange={(e) => setToDateStr(e.target.value)}
                            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-full"
                          />
                        </div>
                      </div>

                      {/* Filter Type Radio Buttons */}
                      <div className="flex flex-col gap-2 text-left">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Loại giao dịch
                        </label>
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-6 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-white hover:text-gray-200">
                            <input
                              type="radio"
                              name="scoreFilterType"
                              value="EARN"
                              checked={scoreFilterType === 'EARN'}
                              onChange={() => setScoreFilterType('EARN')}
                              className="accent-red-600 w-4 h-4 cursor-pointer"
                            />
                            Lịch sử nhận điểm (History of Score Adding)
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-sm text-white hover:text-gray-200">
                            <input
                              type="radio"
                              name="scoreFilterType"
                              value="SPEND"
                              checked={scoreFilterType === 'SPEND'}
                              onChange={() => setScoreFilterType('SPEND')}
                              className="accent-red-600 w-4 h-4 cursor-pointer"
                            />
                            Lịch sử dùng điểm (History of Score Using)
                          </label>
                        </div>
                      </div>

                      {/* View Score Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                          style={{
                            background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                            color: 'var(--color-on-primary-container)',
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.10)',
                            boxShadow: '0 4px 14px rgba(229,9,20,0.3)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,9,20,0.5)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,9,20,0.3)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                          Xem điểm (View Score)
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Results Card */}
                  <div 
                    className="p-6 rounded-xl border border-white/5 flex flex-col gap-4 flex-grow text-white"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                  >
                    <h3 className="text-base font-bold text-white tracking-wide border-b border-white/10 pb-3 text-left" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {scoreFilterType === 'EARN' ? 'Lịch sử tích lũy điểm' : 'Lịch sử sử dụng điểm'}
                    </h3>

                    {!hasViewedScore ? (
                      <div className="text-center py-10 text-gray-500">
                        <span className="material-symbols-outlined text-4xl block mb-2">info</span>
                        Nhấn "Xem điểm" để hiển thị lịch sử giao dịch.
                      </div>
                    ) : filteredScoreHistory.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 font-medium">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-gray-600">history_toggle_off</span>
                        No score history found for the selected period.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="border-b border-white/10 text-xs text-gray-400 font-bold uppercase tracking-wider">
                              <th className="py-3 px-4">Ngày tạo (Date Created)</th>
                              <th className="py-3 px-4">Tên phim (Movie Name)</th>
                              <th className="py-3 px-4 text-right">
                                {scoreFilterType === 'EARN' ? 'Điểm nhận (Added Score)' : 'Điểm dùng (Used Score)'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm">
                            {filteredScoreHistory.map((item) => {
                              const dateStr = new Date(item.date).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                              return (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-3.5 px-4 text-gray-300 font-medium">{dateStr}</td>
                                  <td className="py-3.5 px-4 text-white font-semibold">{item.movieName}</td>
                                  <td className="py-3.5 px-4 text-right font-mono font-bold text-base">
                                    <span 
                                      className={item.type === 'EARN' ? 'text-green-400' : 'text-red-400'}
                                    >
                                      {item.type === 'EARN' ? `+${item.amount}` : `-${item.amount}`}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── Tab Booked (Vé đã đặt hoạt động) ── */}
          {activeTab === 'booked' && (() => {
            const activeBookings = bookings.filter(b => b.status === 'COMPLETED')
            return (
              <div className="w-full space-y-4 animate-fade-in-up">
                {activeBookings.length === 0 ? (
                  <div 
                    className="text-center py-20 bg-white/5 rounded-xl border border-white/5 w-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                  >
                    <span className="material-symbols-outlined text-5xl text-gray-600 mb-3">confirmation_number</span>
                    <p className="text-gray-400 font-medium">No booked tickets found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {activeBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="rounded-xl overflow-hidden border border-white/10 shadow-lg flex flex-col relative w-full transition-all duration-300 hover:scale-[1.01] hover:border-white/20"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                      >
                        <div 
                          className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full z-10 border-r border-white/10 md:block hidden"
                          style={{ backgroundColor: 'var(--color-background)' }}
                        ></div>
                        <div 
                          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full z-10 border-l border-white/10 md:block hidden"
                          style={{ backgroundColor: 'var(--color-background)' }}
                        ></div>

                        <div className="p-6 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {booking.movieName}
                              </h3>
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20 shrink-0 uppercase tracking-wider">
                                ĐÃ THANH TOÁN
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-400 mt-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mã vé</p>
                                <p className="text-white font-mono font-bold mt-0.5">{booking.id}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Phòng chiếu</p>
                                <p className="text-white font-medium mt-0.5">{booking.room}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Suất chiếu</p>
                                <p className="text-white font-medium mt-0.5">
                                  {booking.showTime} · {new Date(booking.showDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ghế ngồi</p>
                                <p className="text-red-500 font-black mt-0.5 tracking-wider">{booking.seats.join(', ')}</p>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-white/10 mt-5 pt-4 flex justify-between items-end">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ngày đặt</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(booking.bookingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tổng tiền</p>
                                <p className="text-lg font-black text-[#F3EA28] font-mono mt-0.5">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleCancelTicket(booking.id)}
                                className="mt-1.5 px-3 py-1 text-[11px] font-bold text-red-500 hover:text-white hover:bg-red-600 border border-red-500/30 hover:border-red-600 rounded transition-all duration-200 cursor-pointer active:scale-95"
                              >
                                Hủy vé
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Tab Canceled (Vé đã hủy) ── */}
          {activeTab === 'canceled' && (() => {
            const canceledBookings = bookings.filter(b => b.status === 'CANCELED')
            return (
              <div className="w-full space-y-4 animate-fade-in-up">
                {canceledBookings.length === 0 ? (
                  <div 
                    className="text-center py-20 bg-white/5 rounded-xl border border-white/5 w-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                  >
                    <span className="material-symbols-outlined text-5xl text-gray-600 mb-3">cancel</span>
                    <p className="text-gray-400 font-medium">No canceled tickets found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {canceledBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="rounded-xl overflow-hidden border border-white/10 shadow-lg flex flex-col relative w-full opacity-75 grayscale-[20%] transition-all duration-300 hover:scale-[1.01]"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-container) 80%, transparent)' }}
                      >
                        <div 
                          className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full z-10 border-r border-white/10 md:block hidden"
                          style={{ backgroundColor: 'var(--color-background)' }}
                        ></div>
                        <div 
                          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full z-10 border-l border-white/10 md:block hidden"
                          style={{ backgroundColor: 'var(--color-background)' }}
                        ></div>

                        <div className="p-6 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {booking.movieName}
                              </h3>
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 shrink-0 uppercase tracking-wider">
                                ĐÃ HỦY
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-400 mt-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mã vé</p>
                                <p className="text-white font-mono font-bold mt-0.5">{booking.id}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Phòng chiếu</p>
                                <p className="text-white font-medium mt-0.5">{booking.room}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Suất chiếu</p>
                                <p className="text-white font-medium mt-0.5">
                                  {booking.showTime} · {new Date(booking.showDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ghế ngồi</p>
                                <p className="text-red-500 font-black mt-0.5 tracking-wider">{booking.seats.join(', ')}</p>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-white/10 mt-5 pt-4 flex justify-between items-end">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ngày đặt</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(booking.bookingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tổng tiền</p>
                              <p className="text-lg font-black text-[#F3EA28] font-mono mt-0.5">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}



        </div>
        {/* ── End Card Grid ── */}

      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </main>
  )
}