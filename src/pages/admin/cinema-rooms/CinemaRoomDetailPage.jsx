import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Info, 
  LayoutGrid, 
  RefreshCw,
  Pencil
} from 'lucide-react'
import SeatLayoutBuilder from './components/SeatLayoutBuilder'

// Generate default seats matching CinemaRoomListPage fallback
const generateDefaultSeats = (capacity) => {
  const seatsList = []
  let rowsCount = 8
  let colsCount = 10
  if (capacity === 48) {
    rowsCount = 6
    colsCount = 8
  } else if (capacity === 60) {
    rowsCount = 6
    colsCount = 10
  }

  const rowNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  for (let r = 0; r < rowsCount; r++) {
    const rowName = rowNames[r]
    for (let c = 1; c <= colsCount; c++) {
      let type = 'STANDARD'
      if (rowName === 'D' || rowName === 'E' || rowName === 'F') {
        type = 'VIP'
      } else if (rowName === 'G' || rowName === 'H') {
        type = 'COUPLE'
      }

      // Leave walkways at columns 3 and 8 for 10-column rooms (between 2-3 and 8-9)
      if (colsCount === 10 && (c === 3 || c === 8)) {
        type = 'EMPTY'
      }

      seatsList.push({
        id: `${rowName}${c}`,
        row: rowName,
        number: c,
        type: type
      })
    }
  }
  return seatsList
}

export default function CinemaRoomDetailPage() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin'

  // Authorization check (AC-07)
  const isAuthorized = user && (user.roles?.includes('ADMIN') || user.roles?.includes('MANAGER'))

  // States
  const [room, setRoom] = useState(null)
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Format quick edit modal state
  const [showFormatModal, setShowFormatModal] = useState(false)
  const [editingFormats, setEditingFormats] = useState([])
  const [savingFormats, setSavingFormats] = useState(false)

  const handleOpenFormatModal = () => {
    setEditingFormats(room?.supportedFormats || ['2D'])
    setShowFormatModal(true)
  }

  const handleToggleFormat = (fmt) => {
    setEditingFormats(prev =>
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    )
  }

  const handleSaveFormats = async () => {
    if (editingFormats.length === 0) {
      triggerToast('Phải chọn ít nhất 1 định dạng phòng', 'error')
      return
    }
    setSavingFormats(true)
    try {
      await cinemaRoomService.updateInfo(roomId, {
        name: room.name,
        supportedFormats: editingFormats,
        ...(room.cinemaId && { cinemaId: room.cinemaId })
      })
      setRoom(prev => ({ ...prev, supportedFormats: editingFormats }))
      setShowFormatModal(false)
      triggerToast('Đã cập nhật định dạng phòng chiếu thành công!', 'success')
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Không thể cập nhật định dạng phòng.', 'error')
    } finally {
      setSavingFormats(false)
    }
  }

  // Helper to show Toast messages
  const triggerToast = (msg, type = 'success') => {
    setToast({ text: msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleBackClick = () => {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      navigate(`${basePath}/cinema-rooms`)
    }
  }

  useEffect(() => {
    let active = true

    const fetchRoomAndSeats = async () => {
      // Yield execution to avoid synchronous setState inside render/effect block
      await Promise.resolve()
      if (!active) return

      setLoading(true)
      setError('')
      let fetchedRoom = null

      try {
        // 1. Fetch Room Info (AC-01)
        // cinemaRoomService.getById() calls /api/v1/cinema-rooms và filter client-side
        const roomRes = await cinemaRoomService.getById(roomId)
        if (roomRes && roomRes.data && active) {
          const roomData = roomRes.data.result || roomRes.data
          fetchedRoom = roomData
          setRoom(roomData)
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin phòng chiếu từ Backend API:', err)
        if (active) {
          setError('Lỗi kết nối máy chủ khi lấy thông tin phòng.')
          setLoading(false)
          return
        }
      }

      if (!fetchedRoom) {
        if (active) {
          setError('Không tìm thấy thông tin phòng chiếu.')
          setLoading(false)
          return
        }
      }

      try {
        // 2. Fetch Seats Info
        const seatsRes = await cinemaRoomService.getSeats(roomId)
        if (seatsRes && seatsRes.data && active) {
          const seatsData = seatsRes.data.result || seatsRes.data
          if (seatsData && seatsData.length > 0) {
            setSeats(seatsData)
          } else {
            // Backend trả về mảng rỗng -> Tạo sơ đồ ghế mặc định
            if (active && fetchedRoom) {
              const defaultSeats = generateDefaultSeats(fetchedRoom.capacity || fetchedRoom.seatsCount || 100)
              setSeats(defaultSeats)
            }
          }
        } else {
          throw new Error('Không có phản hồi dữ liệu ghế hợp lệ từ máy chủ.')
        }
      } catch (err) {
        console.error('Lỗi khi lấy sơ đồ ghế từ Backend API:', err)
        if (active) {
          setError('Lỗi kết nối máy chủ khi lấy sơ đồ ghế.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    if (isAuthorized && roomId) {
      fetchRoomAndSeats()
    }

    return () => {
      active = false
    }
  }, [roomId, isAuthorized])

  // Handle Save Seats layout (AC-04 & AC-05)
  const handleSave = async (payload) => {
    setSaving(true)
    setError('')
    try {
      // Basic validation
      if (!payload.seats || payload.seats.length === 0) {
        throw new Error('Sơ đồ ghế không được trống.')
      }

      try {
        await cinemaRoomService.updateLayout(roomId, payload)
      } catch (err) {
        if (err.response) {
          throw new Error(err.response.data?.message || 'Lưu thất bại: Máy chủ phản hồi lỗi.', { cause: err })
        } else {
          throw new Error('Lưu thất bại: Không thể kết nối tới máy chủ.', { cause: err })
        }
      }

      setSeats(payload.seats)
      
      // Return to listing and show confirmation (AC-04)
      navigate(`${basePath}/cinema-rooms`, { 
        state: { successMessage: `Cấu hình ghế cho phòng "${room?.name || roomId}" thành công!` } 
      })
    } catch (err) {
      // Save fails: stay on screen, display error, without writing to database/localStorage (AC-05)
      setError(err.message || 'Lưu cấu hình ghế thất bại.')
      triggerToast(err.message || 'Lưu cấu hình ghế thất bại.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Access Denied (AC-07)
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#06080F]">
        <span className="material-symbols-outlined text-red-500 text-6xl font-bold mb-4 animate-bounce">
          gpp_bad
        </span>
        <h2 className="text-2xl font-black uppercase text-white mb-2" style={{ fontFamily: 'Montserrat' }}>
          Quyền truy cập bị từ chối
        </h2>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          Chỉ có tài khoản Quản trị viên (Admin) mới có quyền truy cập và cấu hình phòng chiếu này.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
        >
          Quay lại trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-[var(--color-text-primary)] animate-fade-in text-left">
      
      {/* Toast — giữ nguyên, chỉ bỏ backdropFilter & dùng class chuẩn hơn */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg border text-sm max-w-sm
          ${toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : toast.type === 'info'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="shrink-0" size={18} /> : <CheckCircle className="shrink-0" size={18} />}
          <span className="font-medium leading-snug">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Back + Header */}
      <div>
        <button
          onClick={handleBackClick}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-black uppercase font-semibold tracking-widest mb-3 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={13} />
          Quay lại phòng chiếu
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium text-black" style={{ color: 'black' }}>
              Sơ đồ: {room ? room.name : 'Đang tải...'}
            </h1>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              {room && (
                <>
                  <span className="text-xs bg-white/5 border border-white/10 rounded-md px-2.5 py-0.5 text-gray-400">
                    ID: {room.id}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-400">{room.name}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-400">{room.capacity ?? room.seatsCount ?? '?'} ghế</span>
                  {room.supportedFormats && room.supportedFormats.length > 0 && (
                    <>
                      <span className="text-gray-600">•</span>
                      <div className="flex items-center gap-1">
                        {room.supportedFormats.map(fmt => (
                          <span key={fmt} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-[10px] font-bold">
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {!room && <span className="text-sm text-gray-500">Đang lấy dữ liệu...</span>}
            </div>
          </div>

          {room && (
            <button
              onClick={handleOpenFormatModal}
              className="px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold text-xs rounded-xl transition-all border border-blue-500/20 cursor-pointer flex items-center gap-1.5 self-start"
            >
              <Pencil size={13} />
              Đổi định dạng phòng
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/8" />

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/15 rounded-xl text-red-400 text-sm leading-relaxed max-w-2xl">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center gap-3 bg-white/[0.03] border border-white/8 rounded-2xl">
          <RefreshCw className="animate-spin text-gray-400" size={28} />
          <span className="text-sm text-gray-500 font-medium">Đang nạp sơ đồ ghế...</span>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          {/* SeatLayoutBuilder header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <LayoutGrid size={17} className="text-gray-400" />
              <span className="text-[15px] font-medium text-black" style={{ color: 'black' }}>Trình chỉnh sơ đồ ghế</span>
            </div>
          </div>

          <SeatLayoutBuilder
            initialSeats={seats}
            capacity={room ? (room.capacity ?? room.seatsCount ?? 0) : 0}
            onSave={handleSave}
            onCancel={handleBackClick}
            setIsDirty={setIsDirty}
          />
        </div>
      )}

      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.45)', 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-left">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-2">
              Xác nhận thoát
            </h4>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed font-sans">
              Bạn có những thay đổi chưa lưu. Bạn có chắc chắn muốn thoát và hủy bỏ toàn bộ thay đổi này không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 border border-white/10 text-gray-400 text-xs font-bold rounded-xl bg-transparent hover:bg-white/5 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false)
                  navigate(`${basePath}/cinema-rooms`)
                }}
                className="px-5 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 cursor-pointer shadow-md transition-colors"
              >
                Thoát và Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa nhanh định dạng phòng */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h4 className="font-extrabold uppercase tracking-wider text-sm text-white flex items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                <Pencil size={16} className="text-blue-400" />
                Đổi định dạng phòng chiếu
              </h4>
              <button
                onClick={() => setShowFormatModal(false)}
                className="text-gray-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-300">
                Chọn các định dạng màn hình mà phòng <strong className="text-white">{room?.name}</strong> hỗ trợ:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {['2D', '3D', '4DX', 'IMAX'].map(fmt => {
                  const isChecked = editingFormats.includes(fmt)
                  return (
                    <label
                      key={fmt}
                      onClick={() => handleToggleFormat(fmt)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md shadow-blue-500/10'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                      />
                      <span className="font-bold text-sm">{fmt}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-900/40 flex justify-end gap-2">
              <button
                onClick={() => setShowFormatModal(false)}
                disabled={savingFormats}
                className="px-4 py-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/5 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveFormats}
                disabled={savingFormats}
                className="px-5 py-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                {savingFormats ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
