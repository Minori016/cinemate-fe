import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import { movieService } from '../../services/movieService'
import { bookingService } from '../../services/bookingService'
import { paymentService } from '../../services/paymentService'
import Input from '../../components/common/Input'
import { QRCodeSVG } from 'qrcode.react'

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
const MOCK_POSTERS = {
  'backrooms: vùng ngoài tầm kiểm soát': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300',
  'spider-man: brand new day': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300',
  'lớp học ám sát: giờ của chúng ta': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300',
  'kumanthong ác quỷ dẫn đường': 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=300',
  'doraemon: bản tình ca đất nước': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300',
  'lật mặt 7: một điều ước': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300'
}


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

const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: 'easeOut' } },
})

function GlassCard({ children, className = '', delay = 0, style = {} }) {
  return (
    <motion.div
      variants={stagger(delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={`rounded-2xl ${className}`}
      style={{ 
        background: 'rgba(255,255,255,0.04)', 
        backdropFilter: 'blur(14px)', 
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        ...style 
      }}
    >
      {children}
    </motion.div>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const resolveTab = (tab) => {
    if (tab === 'tickets' || tab === 'booked') return 'booked'
    return tab || 'info'
  }

  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState(resolveTab(location.state?.activeTab))
  const [bookings, setBookings] = useState([])
  const [moviePosters, setMoviePosters] = useState({})

  useEffect(() => {
    if (location.state?.activeTab) {
      const targetTab = resolveTab(location.state.activeTab)
      setActiveTab(targetTab)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.state])

  // Fetch movie posters map
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const res = await movieService.getAll({ size: 100 })
        const moviesList = res.data || []
        const posterMap = {}
        moviesList.forEach(m => {
          const titleVn = m.titleVn ? m.titleVn.toLowerCase().trim() : ''
          const titleEn = m.titleEn ? m.titleEn.toLowerCase().trim() : ''
          if (titleVn) posterMap[titleVn] = m.posterUrl
          if (titleEn) posterMap[titleEn] = m.posterUrl
        })
        setMoviePosters(posterMap)
      } catch (err) {
        console.error('Error fetching movie posters for tickets:', err)
      }
    }
    fetchPosters()
  }, [])

  // Fetch real bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await bookingService.getMyBookings()
        const data = res.data?.result ?? []
        const mappedData = data.map(b => ({
          id: b.id.substring(0, 8).toUpperCase(),
          movieName: b.movieName,
          bookingDate: b.createdAt,
          showDate: b.date,
          showTime: b.showtime,
          room: b.roomName,
          seats: b.seatNames,
          totalPrice: b.totalAmount,
          status: b.status
        }))
        setBookings(mappedData)
      } catch (err) {
        console.error('Lỗi khi tải danh sách vé:', err)
      }
    }
    
    if (user) {
      fetchBookings()
    }
  }, [user])

  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  useEffect(() => {
    const fetchPayments = async () => {
      setPaymentsLoading(true)
      try {
        const res = await paymentService.getMyPayments()
        setPayments(res.data?.result ?? [])
      } catch (err) {
        console.error('Lỗi khi tải lịch sử thanh toán:', err)
      } finally {
        setPaymentsLoading(false)
      }
    }

    if (user && activeTab === 'payments') {
      fetchPayments()
    }
  }, [user, activeTab])

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
  }, [activeTab])

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
    password: '',
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

  // States for Vietnam administrative divisions API
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [specificAddress, setSpecificAddress] = useState('')

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
        password: '',
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

  const handleProvinceChange = async (e) => {
    const code = e.target.value
    setSelectedProvince(code)
    setSelectedDistrict('')
    setSelectedWard('')
    setDistricts([])
    setWards([])
    if (code) {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        const data = await res.json()
        setDistricts(data.districts || [])
      } catch (err) {
        console.error('Lỗi khi tải danh sách quận huyện:', err)
      }
    }
  }

  const handleDistrictChange = async (e) => {
    const code = e.target.value
    setSelectedDistrict(code)
    setSelectedWard('')
    setWards([])
    if (code) {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        const data = await res.json()
        setWards(data.wards || [])
      } catch (err) {
        console.error('Lỗi khi tải danh sách phường xã:', err)
      }
    }
  }

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value)
  }

  // Effect to parse existing address when entering edit mode
  useEffect(() => {
    if (isEditing && profile?.address) {
      const addr = profile.address
      fetch('https://provinces.open-api.vn/api/p/')
        .then(res => res.json())
        .then(async (provList) => {
          setProvinces(provList)
          
          const matchedProv = provList.find(p => addr.toLowerCase().includes(p.name.toLowerCase()))
          if (matchedProv) {
            setSelectedProvince(matchedProv.code)
            
            try {
              const distRes = await fetch(`https://provinces.open-api.vn/api/p/${matchedProv.code}?depth=2`)
              const distData = await distRes.json()
              const distList = distData.districts || []
              setDistricts(distList)
              
              const matchedDist = distList.find(d => addr.toLowerCase().includes(d.name.toLowerCase()))
              if (matchedDist) {
                setSelectedDistrict(matchedDist.code)
                
                const wardRes = await fetch(`https://provinces.open-api.vn/api/d/${matchedDist.code}?depth=2`)
                const wardData = await wardRes.json()
                const wardList = wardData.wards || []
                setWards(wardList)
                
                const matchedWard = wardList.find(w => addr.toLowerCase().includes(w.name.toLowerCase()))
                if (matchedWard) {
                  setSelectedWard(matchedWard.code)
                  
                  let spec = addr
                  spec = spec.replace(new RegExp(matchedProv.name, 'i'), '')
                  spec = spec.replace(new RegExp(matchedDist.name, 'i'), '')
                  spec = spec.replace(new RegExp(matchedWard.name, 'i'), '')
                  spec = spec.replace(/^[\s,]+|[\s,]+$/g, '').replace(/,\s*,/g, ',')
                  setSpecificAddress(spec)
                } else {
                  let spec = addr
                  spec = spec.replace(new RegExp(matchedProv.name, 'i'), '')
                  spec = spec.replace(new RegExp(matchedDist.name, 'i'), '')
                  spec = spec.replace(/^[\s,]+|[\s,]+$/g, '').replace(/,\s*,/g, ',')
                  setSpecificAddress(spec)
                }
              } else {
                let spec = addr
                spec = spec.replace(new RegExp(matchedProv.name, 'i'), '')
                spec = spec.replace(/^[\s,]+|[\s,]+$/g, '').replace(/,\s*,/g, ',')
                setSpecificAddress(spec)
              }
            } catch (err) {
              console.error('Lỗi khi phân tích địa chỉ đã lưu:', err)
            }
          } else {
            setSpecificAddress(addr)
          }
        })
        .catch(err => console.error('Lỗi khi tải danh sách tỉnh thành:', err))
    } else if (isEditing) {
      fetch('https://provinces.open-api.vn/api/p/')
        .then(res => res.json())
        .then(data => setProvinces(data))
        .catch(err => console.error('Lỗi khi tải danh sách tỉnh thành:', err))
      
      setSelectedProvince('')
      setSelectedDistrict('')
      setSelectedWard('')
      setSpecificAddress('')
    }
  }, [isEditing, profile])

  // Effect to reactively compile selected fields to form.address
  useEffect(() => {
    if (!isEditing) return
    const provinceName = provinces.find(p => String(p.code) === String(selectedProvince))?.name || ''
    const districtName = districts.find(d => String(d.code) === String(selectedDistrict))?.name || ''
    const wardName = wards.find(w => String(w.code) === String(selectedWard))?.name || ''

    const parts = [specificAddress, wardName, districtName, provinceName].filter(Boolean)
    const fullAddress = parts.join(', ')
    setForm(f => ({ ...f, address: fullAddress }))
  }, [selectedProvince, selectedDistrict, selectedWard, specificAddress, provinces, districts, wards, isEditing])

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
        password: '',
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
      const payload = {
        username: form.username || profile?.username || '',
        email: form.email || profile?.email || '',
        fullName: form.fullName || profile?.fullName || '',
        dayOfBirth: form.dayOfBirth || profile?.dayOfBirth || null,
        gender: form.gender || profile?.gender || '',
        identityCard: form.identityCard || profile?.identityCard || '',
        phoneNumber: form.phoneNumber || profile?.phoneNumber || '',
        address: form.address || profile?.address || '',
        password: form.password,
      }

      const res = await userService.updateMyProfile(payload)
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
    <motion.main
      className="min-h-screen py-10 px-4"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-6xl mx-auto px-6">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--color-on-surface-variant)', border: 'none', backgroundColor: 'transparent' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
          </motion.button>
          <div className="text-left">
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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-error-container) 40%, transparent)',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-5"
            style={{
              backgroundColor: 'rgba(34,197,94,0.1)',
              border: '1px solid #22c55e',
              color: '#22c55e',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            {success}
          </motion.div>
        )}

        {/* ── Card Grid ── */}
        <div className="flex flex-wrap gap-6">

          {/* ── Profile Card (Avatar + Name + Edit Btn) ── */}
          <GlassCard
            className="w-full overflow-hidden"
            delay={0.05}
          >
            <div
              className="px-8 py-6 flex items-center gap-5 flex-wrap"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary-container) 15%, transparent), transparent)',
              }}
            >
              {/* Avatar */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 transition-opacity ${uploading ? 'opacity-50' : 'group-hover:opacity-80'}`}
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary-container), #b3070f)',
                    border: '3px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 6px 30px rgba(0,0,0,0.45)',
                  }}
                >
                  {profile?.image ? (
                    <img src={profile.image} alt="Avatar" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
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
              </motion.div>

              {/* Name + Verified */}
              <div className="flex-1 min-w-[200px] text-left">
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
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 26px rgba(229,9,20,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                    color: 'var(--color-on-primary-container)',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  Chỉnh sửa
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  className="py-2.5 px-5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'var(--color-on-surface-variant)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  Hủy
                </motion.button>
              )}
            </div>
          </GlassCard>
          {/* ── End Profile Card ── */}
        </div>

        {/* ── Main Dashboard Layout ── */}
        <div className="w-full flex flex-col md:flex-row gap-6 mt-6">
          
          {/* ── Sidebar Navigation ── */}
          <div className="w-full md:w-[260px] flex-shrink-0 flex flex-col gap-2.5">
            {['info', 'history', 'booked', 'payments'].map((tabKey) => {
              const tabLabels = {
                info: 'Thông tin tài khoản',
                history: 'Xem hạng thành viên',
                booked: 'Vé đã đặt',
                
                payments: 'Lịch sử thanh toán'
              }
              const tabIcons = {
                info: 'account_circle',
                history: 'stars',
                booked: 'confirmation_number',
                
                payments: 'payments'
              }
              const isActive = activeTab === tabKey
              return (
                <div key={tabKey} className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeProfileTabIndicator"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, #e50914 0%, #b3070f 100%)',
                        boxShadow: '0 8px 24px rgba(229,9,20,0.25)',
                      }}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.button
                    onClick={() => setActiveTab(tabKey)}
                    className="relative z-10 w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-bold text-left cursor-pointer group border outline-none"
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      backgroundColor: isActive ? 'transparent' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#fff' : '#9ca3af',
                      borderColor: isActive ? 'rgba(229,9,20,0.3)' : 'rgba(255,255,255,0.05)',
                    }}
                    whileHover={!isActive ? { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' } : {}}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span 
                      className="material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110"
                      style={{ 
                        color: isActive ? '#fff' : 'var(--color-primary)',
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                      }}
                    >
                      {tabIcons[tabKey]}
                    </span>
                    <span className="truncate">{tabLabels[tabKey]}</span>
                  </motion.button>
                </div>
              )
            })}
          </div>

          {/* ── Content Pane ── */}
          <div className="flex-1 min-w-0 flex flex-wrap gap-6 justify-start content-start items-stretch">
            {activeTab === 'info' && (
            <>
              {/* ── Personal Information Card ── */}
              <GlassCard
                className="w-full md:w-[calc(50%-12px)] overflow-hidden"
                delay={0.1}
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
                        <label className="uppercase font-semibold text-left" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--color-on-surface)' }}>
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

                      {/* Tỉnh / Thành phố */}
                      <div className="flex flex-col gap-2">
                        <label className="uppercase font-semibold text-left" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--color-on-surface)' }}>
                          Tỉnh / Thành phố *
                        </label>
                        <select
                          value={selectedProvince}
                          onChange={handleProvinceChange}
                          className="w-full rounded-lg px-4 py-3 transition-all outline-none cursor-pointer"
                          style={selectStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                          required
                        >
                          <option value="" style={{ background: 'var(--color-surface-container-highest)' }}>Chọn Tỉnh / Thành phố</option>
                          {provinces.map(p => (
                            <option key={p.code} value={p.code} style={{ background: 'var(--color-surface-container-highest)' }}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quận / Huyện */}
                      <div className="flex flex-col gap-2">
                        <label className="uppercase font-semibold text-left" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--color-on-surface)' }}>
                          Quận / Huyện *
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={handleDistrictChange}
                          disabled={!selectedProvince}
                          className="w-full rounded-lg px-4 py-3 transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          style={selectStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                          required
                        >
                          <option value="" style={{ background: 'var(--color-surface-container-highest)' }}>Chọn Quận / Huyện</option>
                          {districts.map(d => (
                            <option key={d.code} value={d.code} style={{ background: 'var(--color-surface-container-highest)' }}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Phường / Xã */}
                      <div className="flex flex-col gap-2">
                        <label className="uppercase font-semibold text-left" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--color-on-surface)' }}>
                          Phường / Xã *
                        </label>
                        <select
                          value={selectedWard}
                          onChange={handleWardChange}
                          disabled={!selectedDistrict}
                          className="w-full rounded-lg px-4 py-3 transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          style={selectStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                          required
                        >
                          <option value="" style={{ background: 'var(--color-surface-container-highest)' }}>Chọn Phường / Xã</option>
                          {wards.map(w => (
                            <option key={w.code} value={w.code} style={{ background: 'var(--color-surface-container-highest)' }}>{w.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Số nhà, tên đường */}
                      <div>
                        <Input 
                          label="Số nhà, tên đường *" 
                          name="specificAddress" 
                          placeholder="VD: 123 Đường ABC"
                          value={specificAddress} 
                          onChange={(e) => setSpecificAddress(e.target.value)} 
                          required 
                        />
                      </div>

                      {/* Password confirmation */}
                      <div className="md:col-span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '8px' }}>
                        <div className="flex items-start gap-3 mb-3">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)', marginTop: '2px' }}>info</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: '1.5', textAlign: 'left' }}>
                            Nhập mật khẩu hiện tại để xác nhận thay đổi thông tin tài khoản. Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                          </p>
                        </div>
                        <Input 
                          label="Mật khẩu xác nhận *" 
                          name="password" 
                          type="password" 
                          placeholder="Nhập mật khẩu hiện tại của bạn" 
                          value={form.password} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>

                      {/* Save Button */}
                      <div className="md:col-span-2 mt-2 flex justify-end gap-3">
                        <motion.button
                          whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.1)' }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={handleCancel}
                          className="py-2.5 px-6 rounded-lg transition-all duration-200 cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            color: 'var(--color-on-surface-variant)',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                            border: '1px solid rgba(255,255,255,0.10)',
                          }}
                        >
                          Hủy bỏ
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03, boxShadow: '0 6px 20px rgba(229,9,20,0.6)' }}
                          whileTap={{ scale: 0.97 }}
                          type="submit"
                          disabled={saving}
                          className="py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{
                            background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                            color: 'var(--color-on-primary-container)',
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '15px',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.10)',
                            boxShadow: '0 4px 14px rgba(229,9,20,0.4)',
                          }}
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
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-left">
                      {[
                        { label: 'Tài khoản', value: profile?.username, icon: 'person' },
                        { label: 'Email', value: profile?.email, icon: 'mail' },
                        { label: 'Họ và tên', value: profile?.fullName, icon: 'badge' },
                        { label: 'Ngày sinh', value: profile?.dayOfBirth, icon: 'cake' },
                        { label: 'Giới tính', value: profile?.gender?.toUpperCase() === 'MALE' ? 'Nam' : profile?.gender?.toUpperCase() === 'FEMALE' ? 'Nữ' : profile?.gender?.toUpperCase() === 'OTHER' ? 'Khác' : profile?.gender, icon: 'wc' },
                        { label: 'Số điện thoại', value: profile?.phoneNumber, icon: 'call' },
                        { label: 'CMND / CCCD', value: profile?.identityCard, icon: 'id_card' },
                        { label: 'Địa chỉ', value: profile?.address, icon: 'location_on' },
                      ].map(({ label, value, icon }, idx) => (
                        <motion.div 
                          key={label} 
                          className="flex items-start gap-3 p-1.5 rounded-xl transition-all"
                          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                        >
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
                        </motion.div>
                      ))}
                    </div>
                  )}
                </form>
              </GlassCard>

              {/* ── Account Details Card ── */}
              <GlassCard
                className="w-full md:w-[calc(50%-12px)] overflow-hidden"
                delay={0.15}
              >
                <div className="px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                    Thông tin tài khoản
                  </h2>
                </div>
                <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-left">
                  {[
                    { 
                      icon: 'shield', 
                      label: 'Vai trò', 
                      content: (
                        <div className="flex gap-1.5 flex-wrap">
                          {(profile?.roles || []).map((role) => (
                            <span
                              key={role}
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
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
                      )
                    },
                    {
                      icon: 'toggle_on',
                      label: 'Trạng thái',
                      content: (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: profile?.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(229,9,20,0.15)',
                            color: profile?.status === 'ACTIVE' ? '#22c55e' : 'var(--color-primary)',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {profile?.status === 'ACTIVE' ? 'Đang hoạt động' : profile?.status}
                        </span>
                      )
                    },
                    profile?.createdAt ? {
                      icon: 'calendar_today',
                      label: 'Ngày tạo tài khoản',
                      content: (
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--color-on-surface)', margin: 0 }}>
                          {new Date(profile.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      )
                    } : null,
                    profile?.score !== undefined && profile?.score !== null ? {
                      icon: 'star',
                      label: 'Điểm thành viên',
                      content: (
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--color-primary)', margin: 0, fontWeight: 700 }}>
                          {profile.score}
                        </p>
                      )
                    } : null
                  ].filter(Boolean).map(({ icon, label, content }, idx) => (
                    <motion.div 
                      key={label} 
                      className="flex items-start gap-3 p-1.5 rounded-xl transition-all"
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '20px', color: 'var(--color-primary)', opacity: 0.7 }}>{icon}</span>
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                          {label}
                        </p>
                        {content}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              {/* ── Change Password Card ── */}
              <GlassCard
                className="w-full overflow-hidden"
                delay={0.2}
              >
                <div className="px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                    Đổi mật khẩu
                  </h2>
                </div>

                <form className="px-8 py-6 space-y-4" onSubmit={handlePwdSubmit}>
                  {pwdError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-error-container) 40%, transparent)',
                        border: '1px solid var(--color-error)',
                        color: 'var(--color-error)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                      {pwdError}
                    </motion.div>
                  )}

                  {pwdSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.1)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                      {pwdSuccess}
                    </motion.div>
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
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: '0 6px 20px rgba(229,9,20,0.5)' }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={pwdSaving}
                      className="py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                        color: 'var(--color-on-primary-container)',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.10)',
                        boxShadow: '0 4px 14px rgba(229,9,20,0.3)',
                      }}
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
                    </motion.button>
                  </div>
                </form>
              </GlassCard>
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
              <div className="w-full flex flex-col lg:flex-row gap-8 text-left">
                {/* Left Column: Membership Card & Rules */}
                <div className="w-full lg:w-5/12 flex flex-col gap-6">
                  {/* Membership Card */}
                  <motion.div 
                    whileHover={{ scale: 1.03, rotate: 0.5, boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
                    className="relative rounded-2xl p-6 overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between aspect-[1.586/1] w-full max-w-[420px] mx-auto select-none group cursor-pointer"
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
                  </motion.div>

                  {/* Points Progress */}
                  <GlassCard
                    className="p-5 flex flex-col gap-4 text-white text-left"
                    delay={0.08}
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
                          <motion.div 
                            className="h-full rounded-full" 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            viewport={{ once: true }}
                            style={{ 
                              background: 'linear-gradient(to right, var(--color-primary), #f87171)'
                            }}
                          />
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
                  </GlassCard>

                  {/* Rules Card */}
                  <GlassCard 
                    className="p-5 flex flex-col gap-4 text-white text-left"
                    delay={0.12}
                  >
                    <h3 className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Quy tắc tích lũy & Đổi quà
                    </h3>
                    <div className="flex flex-col gap-4 text-xs text-gray-400 text-left">
                      <div className="space-y-1.5">
                        <h4 className="text-white font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-[#f59e0b]">payments</span>
                          Cách tích điểm
                        </h4>
                        <ul className="list-disc pl-4 space-y-1 text-left">
                          <li>Mỗi <strong>10.000 VND</strong> chi tiêu mua vé hoặc bắp nước tích <strong>1 điểm</strong>.</li>
                          <li>Không áp dụng tích điểm khi thanh toán bằng voucher hoặc điểm thưởng.</li>
                          <li>Điểm thành viên có giá trị sử dụng trong vòng 1 năm kể từ ngày tích lũy.</li>
                        </ul>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-white font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-[#f59e0b]">featured_play_list</span>
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
                                <td className="p-2 text-right font-mono font-bold text-[#f59e0b]">30 pts</td>
                              </tr>
                              <tr>
                                <td className="p-2">1 Bắp ngọt vừa (M)</td>
                                <td className="p-2 text-right font-mono font-bold text-[#f59e0b]">40 pts</td>
                              </tr>
                              <tr>
                                <td className="p-2">1 Combo ngọt (1 Bắp M + 1 Nước L)</td>
                                <td className="p-2 text-right font-mono font-bold text-[#f59e0b]">60 pts</td>
                              </tr>
                              <tr>
                                <td className="p-2">1 Vé xem phim 2D miễn phí</td>
                                <td className="p-2 text-right font-mono font-bold text-[#f59e0b]">100 pts</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Right Column: Score History Filter and Table */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Filters Card */}
                  <GlassCard 
                    className="p-6 flex flex-col gap-5 text-white"
                    delay={0.05}
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
                            Lịch sử nhận điểm
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
                            Lịch sử dùng điểm
                          </label>
                        </div>
                      </div>

                      {/* View Score Button */}
                      <div className="flex justify-end pt-2">
                        <motion.button
                          whileHover={{ scale: 1.03, boxShadow: '0 6px 20px rgba(229,9,20,0.5)' }}
                          whileTap={{ scale: 0.97 }}
                          type="submit"
                          className="py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all duration-200 cursor-pointer"
                          style={{
                            background: 'linear-gradient(to bottom, var(--color-primary-container), #b3070f)',
                            color: 'var(--color-on-primary-container)',
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.10)',
                            boxShadow: '0 4px 14px rgba(229,9,20,0.3)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                          Xem điểm (View Score)
                        </motion.button>
                      </div>
                    </form>
                  </GlassCard>

                  {/* Results Card */}
                  <GlassCard 
                    className="p-6 flex flex-col gap-4 flex-grow text-white"
                    delay={0.1}
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
                  </GlassCard>
                </div>
              </div>
            )
          })()}

          {/* ── Tab Booked (Vé đã đặt hoạt động) ── */}
          {activeTab === 'booked' && (() => {
            const activeBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED' || b.status === 'CHECKED_IN' || b.status === 'PAID')
            return (
              <div className="w-full space-y-4">
                {activeBookings.length === 0 ? (
                  <GlassCard 
                    className="text-center py-20 w-full"
                    delay={0.05}
                  >
                    <span className="material-symbols-outlined text-5xl text-gray-600 mb-3">confirmation_number</span>
                    <p className="text-gray-400 font-medium">Không tìm thấy vé đã đặt nào.</p>
                  </GlassCard>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full text-left">
                    {activeBookings.map((booking, idx) => {
                      const posterUrl = moviePosters[booking.movieName?.toLowerCase().trim()] || MOCK_POSTERS[booking.movieName?.toLowerCase().trim()] || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300'
                      const isCheckedIn = booking.status === 'CHECKED_IN'

                      return (
                        <motion.div 
                          key={booking.id}
                          variants={stagger(idx * 0.05)}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true, margin: '-40px' }}
                          whileHover={{ scale: 1.01, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 16px 36px rgba(0,0,0,0.4)' }}
                          className="rounded-2xl overflow-hidden flex flex-col sm:flex-row relative w-full transition-all duration-300"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            backdropFilter: 'blur(16px)', 
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          {/* Movie Poster Cover */}
                          <div className="w-full sm:w-28 md:w-32 h-44 sm:h-auto shrink-0 relative overflow-hidden bg-black/40">
                            <img 
                              src={posterUrl} 
                              alt={booking.movieName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/60 via-transparent to-black/30" />
                          </div>

                          {/* Main Information */}
                          <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between min-w-0 text-left space-y-3">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide line-clamp-2 leading-snug" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                  {booking.movieName}
                                </h3>
                                {isCheckedIn ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0 uppercase tracking-wider">
                                    ĐÃ CHECK-IN
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 uppercase tracking-wider">
                                    ĐÃ THANH TOÁN
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
                                <div>
                                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Mã vé</p>
                                  <p className="text-white font-mono font-bold mt-0.5 text-[11px] truncate bg-white/5 px-1.5 py-0.5 rounded inline-block max-w-full">{booking.id}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Phòng chiếu</p>
                                  <p className="text-white font-semibold mt-0.5 truncate">{booking.room}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Suất chiếu</p>
                                  <p className="text-white font-semibold mt-0.5 truncate">
                                    {booking.showTime} · {new Date(booking.showDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Ghế ngồi</p>
                                  <p className="text-red-400 font-black mt-0.5 tracking-wider truncate">
                                    {Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-dashed border-white/10 pt-3 flex justify-between items-end gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Ngày đặt</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                  {new Date(booking.bookingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Tổng tiền</p>
                                <p className="text-sm sm:text-base font-black text-red-500 font-mono mt-0.5 whitespace-nowrap">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* QR Code Section for Check-in (Stub) */}
                          <div className="bg-black/30 border-l border-dashed border-white/15 p-4 flex flex-col items-center justify-center shrink-0 min-w-[120px] relative">
                            {/* Decorative Notch Circles for Stub Tear Effect at Stub Seam */}
                            <div 
                              className="absolute -top-3 -left-3 w-6 h-6 rounded-full border-b border-r border-white/10 sm:block hidden z-10"
                              style={{ backgroundColor: 'var(--color-background, #0b0c10)' }}
                            />
                            <div 
                              className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full border-t border-r border-white/10 sm:block hidden z-10"
                              style={{ backgroundColor: 'var(--color-background, #0b0c10)' }}
                            />

                            {isCheckedIn ? (
                              <div className="flex flex-col items-center justify-center text-center py-2">
                                <span className="material-symbols-outlined text-3xl text-blue-400 mb-1">check_circle</span>
                                <p className="text-[10px] font-black text-blue-400 tracking-wider uppercase">
                                  Đã Check-in
                                </p>
                              </div>
                            ) : (
                              <>
                                <p className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider mb-2 text-center">
                                  Mã Check-in
                                </p>
                                <div className="bg-white p-1.5 rounded-lg shadow-md">
                                  <QRCodeSVG 
                                    value={booking.id.toString()} 
                                    size={72} 
                                    level="H" 
                                    includeMargin={false} 
                                    fgColor="#000000" 
                                    bgColor="#FFFFFF"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Tab Payments (Lịch sử thanh toán) ── */}
          {activeTab === 'payments' && (() => {
            return (
              <div className="w-full space-y-4">
                {paymentsLoading ? (
                  <div className="text-center py-20 w-full">
                    <span className="material-symbols-outlined animate-spin text-5xl text-red-500 mb-3">progress_activity</span>
                    <p className="text-gray-400 font-medium">Đang tải lịch sử thanh toán...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <GlassCard 
                    className="text-center py-20 w-full"
                    delay={0.05}
                  >
                    <span className="material-symbols-outlined text-5xl text-gray-600 mb-3">receipt_long</span>
                    <p className="text-gray-400 font-medium">Không tìm thấy lịch sử thanh toán nào.</p>
                  </GlassCard>
                ) : (
                  <div className="w-full">
                    <GlassCard className="p-6 overflow-hidden text-white" delay={0.05}>
                      <h3 className="text-lg font-bold text-white tracking-wide border-b border-white/10 pb-4 mb-4 text-left" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Lịch sử thanh toán MoMo
                      </h3>
                      <div className="overflow-x-auto scrollbar-none">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="border-b border-white/10 text-xs text-gray-400 font-bold uppercase tracking-wider">
                              <th className="py-3 px-4">Mã giao dịch</th>
                              <th className="py-3 px-4">Tên Phim</th>
                              <th className="py-3 px-4">Phương thức</th>
                              <th className="py-3 px-4">Thời gian</th>
                              <th className="py-3 px-4">Số tiền</th>
                              <th className="py-3 px-4 text-right">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm">
                            {payments.map((p, idx) => {
                              const dateStr = new Date(p.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              const statusConfig = {
                                COMPLETED: { text: 'Thành công', bg: 'bg-green-500/15', textClr: 'text-green-400', border: 'border-green-500/20' },
                                PENDING: { text: 'Chờ thanh toán', bg: 'bg-yellow-500/15', textClr: 'text-yellow-400', border: 'border-yellow-500/20' },
                                FAILED: { text: 'Thất bại', bg: 'bg-red-500/15', textClr: 'text-red-400', border: 'border-red-500/20' }
                              }
                              const currentStatus = statusConfig[p.status] || { text: p.status, bg: 'bg-gray-500/15', textClr: 'text-gray-400', border: 'border-gray-500/20' }
                              
                              return (
                                <tr key={p.uuid} className="hover:bg-white/5 transition-colors">
                                  <td className="py-4 px-4 font-mono text-xs text-gray-400">
                                    {p.transactionId || p.uuid.substring(0, 8).toUpperCase() + '...'}
                                  </td>
                                  <td className="py-4 px-4 text-white font-semibold">{p.movieName || 'N/A'}</td>
                                  <td className="py-4 px-4 text-gray-300 font-medium">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-xs font-bold uppercase tracking-wider">
                                      {p.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 font-medium">{dateStr}</td>
                                  <td className="py-4 px-4 font-mono font-bold text-red-500 text-base">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.amount)}
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${currentStatus.bg} ${currentStatus.textClr} ${currentStatus.border} uppercase tracking-wider`}>
                                      {currentStatus.text}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
            )
          })()}
          </div>
          {/* ── End Content Pane ── */}
        </div>
        {/* ── End Main Dashboard Layout ── */}
      </div>

      {/* ── Removed Custom Confirm Cancel Modal ── */}

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
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.main>
  )
}